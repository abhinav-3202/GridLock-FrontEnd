# ParkSense AI – Parking-Induced Congestion Intelligence System

## 1) Problem Statement

**Theme 1: Poor Visibility on Parking-Induced Congestion**

The core problem is that on-street illegal parking and spillover parking near commercial areas, metro stations, markets, and intersections reduce usable road width and cause localized congestion. Today, enforcement is mostly reactive, and traffic authorities do not have a clear, data-driven way to identify the worst hotspots or estimate how much traffic impact they create. Our project solves that by turning parking violation data into a hotspot map + congestion risk score + enforcement recommendation engine.

---

## 2) What problem it is solving

We are not claiming to solve all Bengaluru traffic. We are solving one narrower and defendable problem:

> “Where and when does illegal parking hurt traffic the most, and how many officers / tow vehicles should be deployed there?”

That is the right scope for a hackathon because it is practical, measurable, and easy to demo.

---

## 3) What the final user should be able to see

### Page 1: City Dashboard

The user opens the app and sees:

- total violations analyzed
- number of critical zones
- top hotspot zones
- a city-wide overview map with colored zones

This page is only for quick visibility and summary. It should feel like a live dashboard, but it can be based on precomputed values.

**Example:**  
A user opens the dashboard and immediately sees that MG Road, Brigade Road, and a metro-adjacent zone are marked as critical hotspots.

---

### Page 2: Main Interactive Page

This is the main demo page and the most important one.

The user:

- selects a zone from a dropdown or by clicking on the Google Map
- enters an exact date and time like `6:00 AM`, `6:00 PM`, `10:00 PM`
- sees the predicted congestion risk for that zone
- sees nearby affected zones
- moves a slider to simulate enforcement strength
- instantly sees the map color change and the officer/tow recommendation update

The report specifically says this should be one interactive page, not many separate pages, because splitting it would hurt the demo experience.

**Example:**  
The user selects `MG Road` and `6:00 PM`. The system predicts high parking-induced congestion, highlights nearby zones, and recommends officers and tow vehicles.

---

## 4) What the map should show

Google Maps is only the visualization layer.

It should show:

- the selected zone
- surrounding nearby zones
- red/yellow/green severity coloring
- hotspot markers
- a radius or spillover effect around the selected zone

The map itself does not do the prediction. Our backend and ML do that. Google Maps only displays the output. The spillover view for nearby zones is important because congestion in one zone affects adjacent zones too.

**Example:**  
If MG Road is congested, Church Street and Brigade Road should also show elevated risk.

---

## 5) What the ML system should do

The notebook is not trying to build deep learning. It is a hybrid analytics + ML + geospatial decision system.

From the notebook/report flow, the main ML and analytics pieces are:

- hotspot detection using clustering
- congestion risk scoring using PCIS
- violation prediction for a selected zone and time
- recommendation logic for officers and tow vehicles
- bounded historical scoring so values stay realistic

The notebook currently uses 21 features after festival removal, and the model ceiling is around **R² ≈ 0.69** based on the reported run, which is acceptable for a hackathon if you explain it honestly as a strong predictive signal rather than exact traffic truth.

**Example:**  
The model does not claim perfect traffic forecasting. It gives a realistic risk estimate that helps make enforcement decisions.

---

## 6) How the whole pipeline should work

### Step A: Data intake

We start from the company-provided Bengaluru dataset. The notebook already reflects the cleaned version with festival removed and 21 features.

---

### Step B: Zone-level feature building

For each zone and time:

- violations
- severity
- repeat offenders
- temporal concentration
- zone-level density
- time-derived features from exact datetime

Our `datetime_input` should be an exact timestamp, and the backend should derive hour, weekday/weekend, month/day features from it. That is better than forcing a “morning/noon/night” bucket.

**Example:**  
If the user enters `2026-07-15 06:00 PM`, the backend can derive:
- hour = 18
- weekday/weekend
- day of month
- month

---

### Step C: PCIS calculation

PCIS is our **Parking Congestion Impact Score**.

It should not be an artificial 0–100 scale that makes the best zone 100 and the worst zone 0 just because of one sample. The report recommends using historical bounds and clipping the final score into a realistic range like `5 to 95` so the score stays believable.

**Example:**  
A zone should not show `PCIS = 100` just because it is the worst zone in a small sample.  
A more realistic score would be something like `PCIS = 87`.

---

### Step D: ML prediction

The selected zone and exact datetime go into `/api/predict`, which returns:

- predicted violations
- PCIS
- severity level
- estimated speed impact
- capacity loss

Nearby zones do not need fresh ML prediction every time; their PCIS can be looked up from stored values based on proximity.

**Example response:**

- predicted violations = 95
- PCIS = 82
- severity = High
- estimated speed = 18 km/h
- capacity loss = 35%

---

### Step E: Simulation

The user moves a slider that represents enforcement intensity.

Example:

- `0%` = baseline
- `50%` = moderate enforcement
- `100%` = maximum intervention

As the slider changes:

- PCIS reduces
- predicted violations reduce
- estimated speed improves
- the map color changes live

This should feel interactive, but the math can be lightweight client-side computation.

**Example:**  
If enforcement goes from `0%` to `60%`, PCIS may reduce from `82` to `55`, and the zone color may shift from red to yellow.

---

### Step F: Recommendation engine

Then `/api/recommend` converts the simulated risk into action:

- total officers required
- number of tow vehicles needed
- static posts / barricade points
- maybe temporary no-parking hours

The report’s recommendation logic increases officer count when PCIS is high and scales towing with predicted violations.

**Example recommendation:**

- officers required: 5
- tow vehicles needed: 2
- barricade points: 1
- no-parking window: 6 PM to 8 PM

---

## 7) Who does what in the system

### Frontend

Frontend should handle:

- Google Maps view
- dropdown / zone selection
- datetime picker
- slider for enforcement intensity
- cards showing prediction result
- recommendation section
- live color changes on the map

Frontend is about user experience and making the system feel responsive.

**Example:**  
The user clicks a zone on the map, moves the slider, and sees the color update instantly.

---

### Backend

Backend should handle:

- loading model artifacts
- preprocessing features
- deriving hour/day/month from datetime
- running the ML model
- returning PCIS and violation predictions
- returning officer/tow recommendations

Backend is about logic, inference, and API response.

**Example:**  
The backend receives `zone = MG Road` and `datetime = 6:00 PM`, then returns the prediction and recommendation data.

---

### ML / Analytics

ML should handle:

- hotspot detection
- violation prediction
- learned risk patterns
- validation of zone-level risk

Analytics should handle:

- PCIS design
- spillover logic
- realistic bounds
- explainable scoring

**Example:**  
DBSCAN can identify hotspots, while the scoring logic converts those hotspots into PCIS and enforcement priority.

---

## 8) What the sliding button should control

The slider should control how strong the intervention is.

It should not be a random parameter.

Best interpretation:

> slider = enforcement boost %

Higher boost = more officers, more towing, lower violations, lower PCIS

That is the most intuitive and explainable option.

**Example:**  
A slider at `20%` means light intervention.  
A slider at `80%` means aggressive enforcement.

---

## 9) Important edge cases you must handle

### PCIS should not be unrealistic

- no zone should automatically become 100 just because it is the worst in the sample
- no zone should become 0 just because it is the best in the sample
- use bounded normalization and clipping into a realistic range like `5–95`

---

### Violations should not become zero

Zero violations is not realistic for this use case, so the system should floor predictions at a small positive number. The report explicitly recommends avoiding literal zero in the prediction path.

**Example:**  
Even a low-risk zone should still show a small nonzero violation estimate.

---

### Time input should be exact

Use `6:00 AM`, `6:00 PM`, `10:00 PM` style inputs, not just “night/morning.” The backend can derive all time features automatically.

---

### Nearby-zone spillover

A selected zone should show 5–6 nearby zones too, because traffic does not stop at the boundary of one zone. That is a strong visual and analytical feature.

**Example:**  
If the user selects Indiranagar, nearby zones like 100 Feet Road and surrounding junctions should also appear as affected zones.

---

## 10) What the final demo story should be

The best story for the jury is:

> “A traffic officer selects a zone and time. The system predicts parking-induced congestion risk, shows nearby spillover areas, simulates intervention intensity, and recommends how many officers and tow vehicles are needed.”

That is a clean, practical, and easy-to-understand pitch. The report repeatedly narrows the project to exactly this.

---

## 11) What makes this hackathon-worthy

The strongest wow moment is not just a static map.

It is:

- user selects a zone and time
- hotspot appears
- nearby zones light up
- slider changes intervention strength
- map color shifts live
- officer/towing counts update instantly

That live response loop is the most convincing part of the project.

**Example:**  
The judge picks `MG Road`, sets `6:00 PM`, moves the slider from `0%` to `60%`, and instantly sees the risk drop and the officer recommendation change.

---

## 12) Advanced Enforcement Recommendation Engine ⭐⭐⭐⭐⭐

This is one of the most impactful modules of our system.

Traditional systems often stop at displaying a risk score:

```text
Risk Score = 91
```

However, a risk score alone does not help traffic authorities take action.

Our system converts predictions into actionable recommendations.

---

### Example Scenario

**User Input:**

- Zone: KR Market Junction
- Date: 15 July 2026
- Time: 8:00 AM

**Model Prediction:**

```text
Predicted Violations: 95
PCIS: 88 (Critical)
Estimated Speed: 18 km/h
Capacity Loss: 35%
```

---

### AI-Generated Enforcement Recommendation

```text
Recommendation:

Increase patrolling between 8–11 AM.

Focus on buses and commercial vehicles.

Deploy enforcement near KR Market Junction.

Assign 5 traffic officers.

Deploy 2 towing vehicles.

Place 1 barricade near Metro Exit 2.

Activate temporary no-parking restrictions from 8–11 AM.
```

---

### Expected Impact After Enforcement

```text
Violations ↓ 28%

PCIS ↓ 24 points

Traffic Speed ↑ 6 km/h

Capacity Loss ↓ 18%
```

---

### Recommendation Confidence

```text
Recommendation Confidence: 87%
```

This helps authorities understand the reliability of the generated actions.

---

### Generate Enforcement Brief

The system can automatically generate a human-readable report:

> KR Market Junction is expected to experience critical parking-induced congestion between 8–11 AM due to high commercial vehicle activity and repeat violations. Deploy 5 officers and 2 towing vehicles. Temporary no-parking restrictions are recommended.

---

### Recommendation Generation Logic

Recommendations are generated using:

- PCIS score
- Predicted violations
- Time of day
- Historical violation trends
- Repeat offender statistics
- Zone severity

Example logic:

```python
if pcis > 80:
    officers = 5
    tow_vehicles = 2
    no_parking = True

elif pcis > 60:
    officers = 3
    tow_vehicles = 1
    no_parking = False

else:
    officers = 1
    tow_vehicles = 0
```

---

### Why is this important?

Now we are not just predicting.

We are helping decision-makers act.

This transforms traffic management from:

```text
Reactive Enforcement
        ↓
Proactive Intelligence
```

---

### Key Advantage

Most systems stop at:

```text
Prediction
```

Our system goes further:

```text
Prediction
    ↓
Recommendation
    ↓
Simulation
    ↓
Expected Impact
```

This makes the solution practical, explainable, and deployable for smart-city traffic management.

---

## 13) Do you need OSMnx?

Not necessarily.

Use Google Maps for:

- rendering the map
- markers
- visual hotspot display
- simple zone selection

Use OSMnx only if you want road network intelligence like:

- graph-based routing
- road centrality
- diversion path analysis
- network topology

So for your current deadline, Google Maps is enough. OSMnx is optional, not mandatory.

---

## 14) Final recommended build order

- Freeze the scope: parking-induced congestion only
- Keep the 2-page structure
- Finish the dashboard page
- Build the interactive prediction page
- Add datetime-based prediction
- Add the enforcement slider
- Add officer/towing recommendation
- Add nearby-zone spillover
- Add bounded PCIS
- Add one collapsible enforcement brief section

---

## Final Project Philosophy

> Prediction → Action → Impact

We are not just detecting violations. We are helping authorities make better decisions.