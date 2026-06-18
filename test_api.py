import requests
import json

BASE_URL = "http://localhost:8000"

# Test zones
test_zones = [
    "HAL Old Airport",      # CRITICAL
    "Upparpet",             # CRITICAL
    "Malleshwaram",         # MODERATE
    "City Market",          # MODERATE
    "Vijayanagara"          # MODERATE
]

# Test times (different scenarios)
test_times = [
    "2024-03-15T08:00:00",  # Morning rush
    "2024-03-15T14:30:00",  # Afternoon
    "2024-03-15T18:00:00",  # Evening peak
    "2024-03-15T23:00:00",  # Night
    "2024-03-16T10:00:00",  # Weekend
]

print("="*80)
print("TESTING PREDICTIONS ENDPOINT")
print("="*80)

for zone in test_zones[:3]:  # Test first 3 zones
    for time in test_times[:2]:  # Test first 2 times
        response = requests.post(
            f"{BASE_URL}/api/predict",
            json={"zone": zone, "datetime_str": time}
        )
        data = response.json()
        print(f"\n✅ Zone: {zone} | Time: {time}")
        print(f"   Predicted Violations: {data.get('predicted_violations')}")
        print(f"   PCIS: {data.get('pcis')} | Priority: {data.get('priority_tier')}")
        print(f"   Top 5 Pincodes: {len(data.get('top_pincodes', []))} returned")
        if data.get('top_pincodes'):
            print(f"   Sample Pincode: {data['top_pincodes'][0]['pincode']} ({data['top_pincodes'][0]['violations']} violations)")

print("\n" + "="*80)
print("TESTING RECOMMENDATION ENDPOINT")
print("="*80)

for zone in test_zones[:2]:
    response = requests.post(
        f"{BASE_URL}/api/recommend",
        json={
            "zone": zone,
            "datetime_str": "2024-03-15T18:00:00",
            "enforcement_boost_pct": 15.0
        }
    )
    data = response.json()
    print(f"\n✅ Zone: {zone}")
    print(f"   Officers Recommended: {data.get('officers_recommended')}")
    print(f"   Tow Vehicles: {data.get('tow_vehicles_recommended')}")
    print(f"   Capacity Recovery: {data.get('estimated_capacity_recovery_pct')}%")

print("\n" + "="*80)
print("TESTING METADATA ENDPOINTS")
print("="*80)

zones = requests.get(f"{BASE_URL}/api/zones").json()
print(f"✅ Total Zones: {len(zones['zones'])}")
print(f"   Zones: {', '.join(zones['zones'][:5])} ...")

summary = requests.get(f"{BASE_URL}/api/summary").json()
print(f"\n✅ Model Summary:")
print(f"   Total Violations: {summary['total_violations']}")
print(f"   Pincodes: {summary['n_pincodes']}")
print(f"   Model R²: {summary['model_r2']:.4f}")
print(f"   Model Type: {summary['best_model']}")

print("\n" + "="*80)
print("✅ ALL TESTS COMPLETED!")
print("="*80)