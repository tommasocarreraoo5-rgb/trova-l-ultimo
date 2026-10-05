from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def run_tests():
    # 1. Test root page
    res = client.get("/")
    assert res.status_code == 200, f"Root failed: {res.status_code}"
    print("[OK] Root index.html served (status 200)")

    # 2. Test matches
    res = client.get("/api/matches")
    assert res.status_code == 200
    data = res.json()
    assert "matches" in data
    print(f"[OK] Fetched {len(data['matches'])} matches")

    # 3. Test filter format
    res5 = client.get("/api/matches?format=5")
    assert res5.status_code == 200
    print(f"[OK] Calcio a 5 filter: {len(res5.json()['matches'])} matches")

    res7 = client.get("/api/matches?format=7")
    assert res7.status_code == 200
    print(f"[OK] Calcio a 7 filter: {len(res7.json()['matches'])} matches")

    # 4. Test profile
    res_prof = client.get("/api/profile")
    assert res_prof.status_code == 200
    prof = res_prof.json()
    print(f"[OK] Profile loaded: {prof['name']} (OVR {prof['ovr']})")

    # 5. Test apply to match
    match_id = data['matches'][0]['id'] if data.get('matches') else 1
    res_app = client.post(f"/api/matches/{match_id}/apply", json={
        "player_id": "my_profile",
        "player_name": prof["name"] or "Gigi Riva",
        "player_role": prof.get("primary_role") or "Attaccante",
        "player_phone": prof.get("phone") or "+39 340 0000000",
        "player_ovr": prof.get("ovr", 75),
        "message": "Arrivo con gli scarpini e la quota pronta!"
    })
    assert res_app.status_code == 200
    app_data = res_app.json()
    assert app_data["success"] is True
    print(f"[OK] Application to match {match_id} succeeded")

    # 6. Test players
    res_pl = client.get("/api/players")
    assert res_pl.status_code == 200
    print(f"[OK] Free agents market: {len(res_pl.json()['players'])} players")

    # 7. Test match creation
    res_create = client.post("/api/matches", json={
        "title": "Calcetto di test tra amici",
        "format": "5",
        "field_name": "Test Arena",
        "address": "Via Roma 1",
        "city": "Milano",
        "match_date": "2026-10-05",
        "match_time": "20:00",
        "duration_min": 60,
        "price_per_player": "8€",
        "pitch_type": "Sintetico 4G",
        "missing_count": 1,
        "roles_needed": ["Portiere"],
        "level": "Amatoriale",
        "notes": "Test partita",
        "organizer_name": "Test Organizzatore",
        "organizer_phone": "+39 333 1122334"
    })
    assert res_create.status_code == 200
    print("[OK] Match creation endpoint passed")

    print("\n========================================")
    print("  TUTTI I TEST SUPERATI CON SUCCESSO!  ")
    print("========================================")

if __name__ == "__main__":
    run_tests()
