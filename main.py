from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import pickle, json, pandas as pd, numpy as np
from scipy.spatial import cKDTree
import os
from dotenv import load_dotenv
from groq import Groq


load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

app = FastAPI(title="ParkSense Bengaluru API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

with open('data/best_model.pkl', 'rb') as f:
    best_model = pickle.load(f)
with open('data/label_encoder_station.pkl', 'rb') as f:
    le_station = pickle.load(f)
with open('data/feature_list.json', 'r') as f:
    ALL_FEATURES = json.load(f)

pcis_df = pd.read_csv('data/pcis_scores.csv')
pincode_stats = pd.read_csv('data/pincode_stats_detailed.csv')
violations_df = pd.read_csv('data/violations_clean.csv')

zone_dict = {z: row for z, row in pcis_df.set_index('police_station').iterrows()}

import math

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    p = math.radians
    a = math.sin((p(lat2)-p(lat1))/2)**2 + \
        math.cos(p(lat1))*math.cos(p(lat2))*math.sin((p(lon2)-p(lon1))/2)**2
    return 2*R*math.asin(math.sqrt(a))

class PredictionRequest(BaseModel):
    zone: str
    datetime_str: str   # IST time, e.g. "2024-03-15T23:00:00"

class EnforcementRequest(BaseModel):
    zone: str
    datetime_str: str   # IST time
    enforcement_boost_pct: float

class LLMRecommendRequest(BaseModel):
    zone: str
    datetime_str: str
    enforcement_boost_pct: float

# 1st Api endpoint for the prediction
@app.post("/api/predict")
def predict(req: PredictionRequest):
    try:
        if req.zone not in le_station.classes_:
            raise HTTPException(status_code=400, detail=f"Unknown zone: {req.zone}")
        
        # Parse as IST directly — no timezone conversion needed
        dt = datetime.fromisoformat(req.datetime_str.replace('Z', ''))
        hour = dt.hour
        day_of_week = dt.weekday()
        day_of_month = dt.day
        hour_sin = np.sin(2 * np.pi * hour / 24)
        hour_cos = np.cos(2 * np.pi * hour / 24)
        dow_sin = np.sin(2 * np.pi * day_of_week / 7)
        dow_cos = np.cos(2 * np.pi * day_of_week / 7)
        is_weekend = 1 if day_of_week >= 5 else 0
        is_night = 1 if (hour >= 22 or hour <= 5) else 0
        
        police_station_encoded = le_station.transform([req.zone])[0]
        zone_row = zone_dict[req.zone]
        zone_violation_rate = float(zone_row['zone_violation_rate'])
        zone_severity_avg = float(zone_row['zone_severity_avg'])
        zone_repeat_offender_pct = float(zone_row['zone_repeat_offender_pct'])
        
        zone_v = violations_df[violations_df['police_station'] == req.zone]
        pct_at_junction = float(zone_v['is_at_junction'].mean()) if len(zone_v) > 0 else 0.4
        avg_violations_per_incident = 1.2
        
        HOUR_WEIGHTS = {
            0:0.8, 1:0.9, 2:1.0, 3:0.9, 4:0.8, 5:0.7,
            6:0.6, 7:0.7, 8:1.2, 9:1.3, 10:1.5, 11:1.4,
            12:1.1, 13:0.9, 14:0.7, 15:0.6, 16:0.5, 17:0.5,
            18:0.5, 19:0.4, 20:0.3, 21:0.4, 22:0.7, 23:0.8
        }

        avg_hourly = zone_violation_rate / 24
        hourly_weight = HOUR_WEIGHTS.get(hour, 1.0)
        scaled_avg = avg_hourly * hourly_weight
        feature_values = {
            'hour': hour, 'hour_sin': hour_sin, 'hour_cos': hour_cos,
            'day_of_week': day_of_week, 'dow_sin': dow_sin, 'dow_cos': dow_cos,
            'is_weekend': is_weekend, 'day_of_month': day_of_month, 'is_night': is_night,
            'police_station_encoded': police_station_encoded,
            'zone_violation_rate': zone_violation_rate, 'zone_severity_avg': zone_severity_avg,
            'zone_repeat_offender_pct': zone_repeat_offender_pct,
            'avg_severity': zone_severity_avg, 'avg_vehicle_size': 2.5,
            'pct_at_junction': pct_at_junction, 'pct_repeat_offender': zone_repeat_offender_pct,
            'avg_violations_per_incident': avg_violations_per_incident,
            'violations_prev_day': scaled_avg, 'violations_prev_week': scaled_avg,
            'violations_prev_hour': scaled_avg * 0.8, 'rolling_7day_avg': zone_violation_rate,
        }
        
        X = np.array([[feature_values[f] for f in ALL_FEATURES]])
        predicted_violations = max(1, int(best_model.predict(X)[0]))
        
        pcis = float(zone_row['PCIS'])
        priority_tier = str(zone_row['priority_tier'])
        estimated_speed_kmh = float(zone_row['estimated_speed_kmh'])
        capacity_loss_pct = float(zone_row['capacity_loss_pct'])
        lat = float(zone_row['center_lat'])
        lon = float(zone_row['center_lon'])
        
        zone_violations = violations_df[violations_df['police_station'] == req.zone]
        junction_breakdown = []
        if len(zone_violations) > 0:
            pct_junction = (zone_violations['is_at_junction'] == 1).sum() / len(zone_violations)
            if pct_junction > 0.5:
                junctions = zone_violations[zone_violations['is_at_junction'] == 1]
                if len(junctions) > 0 and 'cluster_id' in junctions.columns:
                    j_agg = junctions.groupby('cluster_id').agg({
                        'latitude': ['count', 'mean'], 'longitude': 'mean'
                    }).reset_index()
                    j_agg.columns = ['cluster_id', 'violations', 'lat', 'lon']
                    for _, row in j_agg.head(5).iterrows():
                        junction_breakdown.append({
                            'junction': f"Hotspot {int(row['cluster_id'])}", 'violations': int(row['violations']),
                            'lat': float(row['lat']), 'lon': float(row['lon']),
                        })
        
        zone_pincodes = pincode_stats[pincode_stats['police_station'] == req.zone].sort_values('PCIS', ascending=False).head(5)
        top_pincodes = []
        for _, row in zone_pincodes.iterrows():
            top_pincodes.append({
                'pincode': str(int(row['pincode'])),
                'violations': int(row['violations']),
                'pcis': float(row['PCIS']),
                'avg_severity': float(row['avg_severity']),
                'lat': float(row['center_lat']),
                'lon': float(row['center_lon'])
            })
        
        return {
            'zone': req.zone, 'predicted_violations': predicted_violations, 'pcis': pcis,
            'priority_tier': priority_tier, 'estimated_speed_kmh': estimated_speed_kmh,
            'capacity_loss_pct': capacity_loss_pct, 'lat': lat, 'lon': lon,
            'junction_breakdown': junction_breakdown, 'top_pincodes': top_pincodes,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recommend")
def recommend(req: EnforcementRequest):
    try:
        enforcement_boost = req.enforcement_boost_pct
        reduction = min(enforcement_boost * 0.6, 70)
        primary_pred = predict(PredictionRequest(zone=req.zone, datetime_str=req.datetime_str))
        base_violations = primary_pred['predicted_violations']
        base_pcis = primary_pred['pcis']
        reduced_violations = max(1, int(base_violations * (1 - reduction / 100)))
        reduced_pcis = max(5, int(base_pcis * (1 - reduction / 100)))
        officers_required = max(2, int(np.ceil(reduced_violations / 50)))
        tow_vehicles_required = max(1, int(np.ceil(reduced_violations / 30)))
        return {
            'zone': req.zone, 'enforcement_level': enforcement_boost, 'base_violations': base_violations,
            'reduced_violations': reduced_violations, 'base_pcis': base_pcis, 'reduced_pcis': reduced_pcis,
            'officers_recommended': officers_required, 'tow_vehicles_recommended': tow_vehicles_required,
            'estimated_capacity_recovery_pct': min(100, reduction * 0.8),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# 2nd api endpoint for the llm recommendation system
@app.post("/api/recommend/llm")
def recommend_llm(req: LLMRecommendRequest):
    try:
        # Reuse existing endpoints
        pred = predict(PredictionRequest(zone=req.zone, datetime_str=req.datetime_str))
        base = recommend(EnforcementRequest(
            zone=req.zone,
            datetime_str=req.datetime_str,
            enforcement_boost_pct=req.enforcement_boost_pct
        ))

        prompt = f"""You are a traffic enforcement advisor for Bengaluru Traffic Police.
Generate a specific field deployment order. Use exact numbers from the data.
Do not use generic phrases like "focus on enforcement" or "deploy resources".

ZONE DATA:
Zone: {req.zone}
Time: {req.datetime_str}
Predicted violations this hour: {pred['predicted_violations']}
PCIS Score: {pred['pcis']} ({pred['priority_tier']})
Road speed: {pred['estimated_speed_kmh']} km/h (normal: 40 km/h)
Capacity loss: {pred['capacity_loss_pct']}%
After {req.enforcement_boost_pct}% enforcement:
  Violations reduced to: {base['reduced_violations']}
  PCIS reduced to: {base['reduced_pcis']}
Officers available: {base['officers_recommended']}
Tow vehicles available: {base['tow_vehicles_recommended']}

Generate exactly this format, no markdown, no extra text:

SITUATION:
[2 sentences with specific numbers about current congestion in {req.zone}]

DEPLOYMENT ORDER:
1. Assign {base['officers_recommended']} officers to {req.zone} main junction from [derive time window from {req.datetime_str}]
2. Deploy {base['tow_vehicles_recommended']} tow vehicle(s) targeting [suggest specific vehicle type based on zone - buses/autos/trucks]
3. Activate no-parking enforcement on [suggest main road type for this zone]
4. Place barricade at primary junction entry point
5. Increase patrol frequency to every [suggest interval] minutes

EXPECTED OUTCOME:
- Violations drop from {pred['predicted_violations']} to {base['reduced_violations']} this hour
- PCIS improves from {pred['pcis']} to {base['reduced_pcis']}
- Estimated capacity recovery: {base['estimated_capacity_recovery_pct']}%
- Road speed projected to recover to {round(40 * (1 - base['reduced_pcis']/200), 1)} km/h"""

        print("Calling Gemini...")
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=250,
            temperature=0.4
        )
        llm_brief = response.choices[0].message.content.strip()
        print("Groq response:", llm_brief[:100])

        return {
            **base,
            "llm_brief": llm_brief,
            "llm_available": True,
            "top_pincodes": pred.get("top_pincodes", []),
            "lat": pred["lat"],
            "lon": pred["lon"]
        }

    except Exception as e:
        print("LLM ERROR:", str(e))
        # Always fall back to static recommendation — never break the demo
        try:
            base = recommend(EnforcementRequest(
                zone=req.zone,
                datetime_str=req.datetime_str,
                enforcement_boost_pct=req.enforcement_boost_pct
            ))
            return {**base, "llm_brief": None, "llm_available": False}
        except Exception as e2:
            raise HTTPException(status_code=500, detail=str(e2))



# 3rd api endpoint for spillover
@app.post("/api/spillover")
def spillover(req: PredictionRequest):
    primary = predict(req)
    
    zone_row = pcis_df[pcis_df['police_station'] == req.zone].iloc[0]
    center_lat = float(zone_row['center_lat'])
    center_lon = float(zone_row['center_lon'])
    
    neighbors = []
    for _, row in pcis_df.iterrows():
        if row['police_station'] == req.zone:
            continue
        dist = haversine(center_lat, center_lon, 
                        float(row['center_lat']), float(row['center_lon']))
        if dist <= 4.0:
            neighbor_pred = predict(PredictionRequest(
                zone=row['police_station'],
                datetime_str=req.datetime_str
            ))
            spillover_factor = max(0, 1 - (dist / 4.0))
            neighbor_pred['spillover_impact'] = round(
                neighbor_pred['pcis'] * spillover_factor * 0.3, 1)
            neighbor_pred['distance_km'] = round(dist, 2)
            neighbors.append(neighbor_pred)
    
    neighbors.sort(key=lambda x: x['spillover_impact'], reverse=True)
    
    return {
        'primary_zone': primary,
        'affected_neighbors': neighbors[:4],
        'total_affected_zones': len(neighbors),
        'city_wide_impact': round(
            sum(n['spillover_impact'] for n in neighbors), 1)
    }


# 4th api endpoint for comparison of the historical avg vs the given date
@app.get("/api/historical/{zone}/{hour}")
def historical_pattern(zone: str, hour: int):
    zone_violations = pd.read_csv('data/violations_clean.csv')
    zone_data = zone_violations[
        (zone_violations['police_station'] == zone) &
        (zone_violations['hour'] == hour)
    ]
    
    daily_avg = len(zone_data) / zone_data['date'].nunique() if len(zone_data) > 0 else 0
    
    dow_pattern = zone_data.groupby('day_of_week').size()
    peak_day = int(dow_pattern.idxmax()) if len(dow_pattern) > 0 else 0
    
    day_names = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    
    return {
        'zone': zone,
        'hour': hour,
        'avg_violations_this_hour': round(daily_avg, 1),
        'peak_day_of_week': day_names[peak_day],
        'hourly_pattern': dow_pattern.to_dict(),
        'worst_violation_type': zone_data['violation_type_primary'].mode()[0] 
                                if len(zone_data) > 0 else 'WRONG PARKING'
    }


# 5th api endpoint for the alerts in 5 min polling intervals
@app.get("/api/alerts")
def get_alerts():
    from datetime import datetime
    current_hour = datetime.now().hour
    current_dt = datetime.now().strftime("%Y-%m-%dT%H:00:00")
    
    alerts = []
    for _, row in pcis_df.iterrows():
        zone = row['police_station']
        pred = predict(PredictionRequest(
            zone=zone,
            datetime_str=current_dt
        ))
        if pred['pcis'] >= 80:
            alerts.append({
                'zone': zone,
                'pcis': pred['pcis'],
                'predicted_violations': pred['predicted_violations'],
                'level': pred['priority_tier'],
                'lat': pred['lat'],
                'lon': pred['lon'],
                'message': f"{zone} is approaching critical congestion — {pred['predicted_violations']} violations predicted this hour"
            })
    
    alerts.sort(key=lambda x: x['pcis'], reverse=True)
    return {
        'timestamp': current_dt,
        'critical_zones': alerts,
        'total_critical': len(alerts)
    }


# 6th api endpoint for the zones 
@app.get("/api/zones")
def get_zones():
    return {'zones': sorted(le_station.classes_.tolist())}



# 7th api endpoint for the summary
@app.get("/api/summary")
def get_summary():
    with open('data/summary_stats.json', 'r') as f:
        return json.load(f)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
