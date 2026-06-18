from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import pickle, json, pandas as pd, numpy as np
from scipy.spatial import cKDTree

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

class PredictionRequest(BaseModel):
    zone: str
    datetime_str: str   # IST time, e.g. "2024-03-15T23:00:00"

class EnforcementRequest(BaseModel):
    zone: str
    datetime_str: str   # IST time
    enforcement_boost_pct: float

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
        
        avg_hourly = zone_violation_rate / 24
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
            'violations_prev_day': avg_hourly, 'violations_prev_week': avg_hourly,
            'violations_prev_hour': avg_hourly, 'rolling_7day_avg': zone_violation_rate,
        }
        
        X = np.array([[feature_values[f] for f in ALL_FEATURES]])
        predicted_violations = max(0, int(best_model.predict(X)[0]))
        
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

@app.get("/api/zones")
def get_zones():
    return {'zones': sorted(le_station.classes_.tolist())}

@app.get("/api/summary")
def get_summary():
    with open('data/summary_stats.json', 'r') as f:
        return json.load(f)

if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='0.0.0.0', port=8000)
