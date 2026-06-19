# ParkSense Bengaluru — Frontend API Reference

Base URL: http://localhost:8000

All endpoints return JSON. POST endpoints need header: Content-Type: application/json

---

## 1. POST /api/predict

Call this when user selects a zone + date/time.
* const datetime_str = `${year}-${month}-${day}T${hour}:${minute}:00`;  -- this is hot u need to send the date and time

### INPUT

```json
{
  "zone": "Upparpet",
  "datetime_str": "2024-03-15T10:00:00"
}
```

### OUTPUT

```json
{
  "zone": "Upparpet",
  "predicted_violations": 15,
  "pcis": 72.6,
  "priority_tier": "CRITICAL",
  "estimated_speed_kmh": 25.5,
  "capacity_loss_pct": 25.4,
  "lat": 12.9766,
  "lon": 77.5774,
  "junction_breakdown": [
    {
      "junction": "Hotspot 0",
      "violations": 29458,
      "lat": 12.9766,
      "lon": 77.5773
    }
  ],
  "top_pincodes": [
    {
      "pincode": "560009",
      "violations": 27663,
      "pcis": 63.2,
      "avg_severity": 1.65,
      "lat": 12.9765,
      "lon": 77.5774
    }
  ]
}
```

### DISPLAY THIS

* predicted_violations -> big number on main card
* pcis -> gauge/progress bar, colored by value (red >70, yellow 40-70, green <40) ---- a 0-100 score showing how badly illegal parking is congesting that zone right now (higher = worse).
* priority_tier -> colored text badge (CRITICAL / MODERATE / LOW)
* estimated_speed_kmh -> small stat card
* capacity_loss_pct -> small stat card  ---- same thing as PCIS, just shown as "% of road space unusable" instead of a score, so it's easier to read at a glance.
* lat, lon -> place main marker on map (don't show as text).  ---- draw a semi-transparent colored circle using this coordinate as the center just to roughly represent the zone
* top_pincodes -> place small markers on map at each pincode's lat/lon. Array length varies 0 to 5 - loop through whatever is present, don't assume fixed count.

---

## 2. POST /api/recommend

Instead use the slider logic in the frontend code directly so as to produce the details seamless and continuously - note that this is different from the recommend system

## Slider Logic (Client-Side, No API Call Per Tick)

Do NOT call /api/recommend on every slider movement. Compute live using
the same formula the backend uses, then only hit the API once when
zone/time changes or when generating the LLM brief.

### Setup (after /api/predict response is received)
```javascript
let baseViolations = predictResponse.predicted_violations;
let basePcis = predictResponse.pcis;
```

### Live slider handler (runs on every drag, no network call)
```javascript
function onSliderChange(enforcementPct) {
  const reduction = Math.min(enforcementPct * 0.6, 70);

  const reducedViolations = Math.max(1, Math.round(baseViolations * (1 - reduction / 100)));
  const reducedPcis = Math.max(5, Math.round(basePcis * (1 - reduction / 100)));

  const officers = reducedPcis > 80 ? 6 : reducedPcis > 60 ? 4 : reducedPcis > 40 ? 3 : 2;
  const towVehicles = reducedPcis > 40 ? Math.max(1, Math.ceil(reducedViolations / 30)) : 0;
  const capacityRecovery = Math.min(100, reduction * 0.8);

  updateUI({
    violations: reducedViolations,
    pcis: reducedPcis,
    officers: officers,
    towVehicles: towVehicles,
    capacityRecovery: capacityRecovery
  });
}
```

### DISPLAY THIS
* reducedViolations, reducedPcis -> update the same gauge/number from /api/predict live, computed client-side on every slider move
* officers -> icon + number card ("Officers: 2")
* towVehicles -> icon + number card ("Tow Vehicles: 1")
* capacityRecovery -> small text "+24% capacity recovered"
* baseViolations, basePcis -> used only as the starting reference for the formula, DO NOT display directly

---

## 3. POST /api/recommend/llm

Call this only when user clicks "Generate Enforcement Brief" button.
Do not call on slider drag - this is slower (1-2 sec).

### INPUT
Send the zone, datetime, and the CURRENT slider value at time of click
(not a fixed number - whatever enforcementPct currently is)
```json
{
  "zone": "Upparpet",
  "datetime_str": "2024-03-15T10:00:00",
  "enforcement_boost_pct": 50
}
```

### OUTPUT
```json
{
  "zone": "Upparpet",
  "reduced_violations": 10,
  "reduced_pcis": 50,
  "officers_recommended": 2,
  "tow_vehicles_recommended": 1,
  "estimated_capacity_recovery_pct": 24.0,
  "llm_brief": "SITUATION:\nUpparpet is experiencing critical congestion...\n\nDEPLOYMENT ORDER:\n1. Assign 2 officers...\n\nEXPECTED OUTCOME:\n- Violations drop from 15 to 10...",
  "llm_available": true,
  "top_pincodes": [],
  "lat": 12.9766,
  "lon": 77.5774
}
```

### DISPLAY THIS
* llm_brief -> split text on "\n\n" into 3 sections (SITUATION, DEPLOYMENT ORDER, EXPECTED OUTCOME), show as formatted card with section headers
* llm_available -> if false, llm_brief is null. Show message "Brief unavailable, showing static recommendation" and display the client-side computed numbers (reducedViolations, reducedPcis, officers, towVehicles) instead
* reduced_violations, reduced_pcis, officers_recommended, tow_vehicles_recommended, estimated_capacity_recovery_pct in this response -> these should match what's already shown on screen from client-side slider math; use them only as a backend confirmation, no need to re-render duplicate numbers
* top_pincodes, lat, lon -> IGNORE, already have these from /api/predict, do not duplicate

---

## 4. POST /api/spillover

Call this right after /api/predict, using the same zone + datetime. This is the main visual feature - shows how congestion spreads to nearby zones.

### INPUT

```json
{
  "zone": "Upparpet",
  "datetime_str": "2024-03-15T10:00:00"
}
```

### OUTPUT

```json
{
  "primary_zone": {
    "zone": "Upparpet",
    "predicted_violations": 15,
    "pcis": 72.6,
    "priority_tier": "CRITICAL",
    "lat": 12.9766,
    "lon": 77.5774
  },
  "affected_neighbors": [
    {
      "zone": "City Market",
      "predicted_violations": 11,
      "pcis": 53.8,
      "priority_tier": "MODERATE",
      "estimated_speed_kmh": 29.2,
      "lat": 12.9645,
      "lon": 77.5771,
      "spillover_impact": 10.7,
      "distance_km": 1.35
    }
  ],
  "total_affected_zones": 15,
  "city_wide_impact": 52.1
}
```

### DISPLAY THIS

* primary_zone -> large circle marker on map, colored by priority_tier
* affected_neighbors -> array has max 4 items. For each: small circle marker at lat/lon, colored by priority_tier. Draw a line from primary_zone's lat/lon to this neighbor's lat/lon. Line opacity and circle opacity = spillover_impact / 15 (higher impact = more visible)
* affected_neighbors[].distance_km -> show only on marker click/hover, e.g. "1.35 km away"
* affected_neighbors[].spillover_impact -> DO NOT show as text, only use to control visual opacity/line thickness
* total_affected_zones -> headline stat card: "15 zones affected"
* city_wide_impact -> headline stat card: "52.1 city-wide impact score"
* DO NOT render top_pincodes or junction_breakdown for neighbor zones even if present in nested data - only show these for primary_zone

---

## 5. GET /api/historical/{zone}/{hour}

Example:

```http
GET /api/historical/Upparpet/10
```

No request body. Pass zone and hour as URL path values.

### OUTPUT

```json
{
  "zone": "Upparpet",
  "hour": 10,
  "avg_violations_this_hour": 12.4,
  "peak_day_of_week": "Sun",
  "hourly_pattern": {
    "0": 245,
    "1": 198
  },
  "worst_violation_type": "WRONG PARKING"
}
```

### DISPLAY THIS

* avg_violations_this_hour -> comparison line: "Historical average: 12.4 - Today's prediction: [predicted_violations from /api/predict]"
* worst_violation_type -> small badge "Most common: WRONG PARKING"
* peak_day_of_week, hourly_pattern -> DO NOT display, internal use only

---

## 6. GET /api/alerts

No request body. Call this in background every 5 minutes, not on page load (takes 2-3 sec to respond).

### OUTPUT

```json
{
  "timestamp": "2026-06-19T14:00:00",
  "critical_zones": [
    {
      "zone": "Upparpet",
      "pcis": 87.1,
      "predicted_violations": 15,
      "level": "CRITICAL",
      "lat": 12.9766,
      "lon": 77.5774,
      "message": "Upparpet is approaching critical congestion - 15 violations predicted this hour"
    }
  ],
  "total_critical": 1
}
```

### DISPLAY THIS

* If total_critical > 0, trigger a browser notification using the message field from each item in critical_zones
* Clicking a notification should pan/zoom the map to that zone's lat/lon

---

## 7. GET /api/zones

No request body, no parameters.

### OUTPUT

```json
{
  "zones": ["Adugodi", "Ashok Nagar", "Banashankari"]
}
```

### DISPLAY THIS

* Populate the zone selection dropdown with this list

---

## 8. GET /api/summary

No request body, no parameters. Call once on app load.

### OUTPUT

```json
{
  "total_violations": 298450,
  "critical_hotspots": 12,
  "top_zone": "Upparpet",
  "top_zone_pcis": 95.0,
  "n_zones": 52,
  "n_clusters": 47,
  "best_model": "XGBoost",
  "model_r2": 0.693
}
```

### DISPLAY THIS

* All fields shown as headline stat cards on the landing/dashboard page
* best_model and model_r2 -> optional small footer text "Powered by XGBoost (R-squared 0.69)"

---

# FULL EXAMPLE - One Complete User Flow

User selects zone "Upparpet" and time "2024-03-15T10:00:00"

### STEP 1 - Call POST /api/predict

```json
{
  "zone": "Upparpet",
  "datetime_str": "2024-03-15T10:00:00"
}
```

Show: big number "15 violations", PCIS gauge at 72.6, "CRITICAL" badge, marker at (12.9766, 77.5774)

### STEP 2 - Call POST /api/spillover (same input)

Show: 4 smaller markers around the main one, connected with lines, "15 zones affected" stat card

### STEP 3 - Call GET /api/historical/Upparpet/10

Show: "Historical average: 12.4 - Today: 15 (21% above average)"

### STEP 4 - User drags slider to 50%, releases it

Call POST /api/recommend with enforcement_boost_pct: 50

Update: number changes from 15 to 10, PCIS gauge moves from 72.6 to 50, show "2 officers, 1 tow vehicle"

### STEP 5 - User clicks "Generate Enforcement Brief"

Call POST /api/recommend/llm with same data

Show: formatted text card with SITUATION / DEPLOYMENT ORDER / EXPECTED OUTCOME sections

That's the complete flow, one zone, one time, no extra page navigation.
