import os
import json
import urllib.parse
import urllib.request
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query, Request, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel, Field

import database

app = FastAPI(title="Trova l'Ultimo - Mai più con uno in meno", version="3.0.0")

# Ensure DB initialized
database.init_db()

# Static files setup
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(STATIC_DIR, exist_ok=True)

# Pydantic Models
class MatchCreate(BaseModel):
    title: str = Field(..., example="Calcetto del giovedì - Manca 1")
    format: str = Field(..., example="5")
    field_name: str = Field(..., example="Centro Sportivo Pozzo")
    address: str = Field(..., example="Via Pozzobonelli 4")
    city: str = Field(default="Milano", example="Milano")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    maps_url: Optional[str] = None
    match_date: str = Field(..., example="2026-10-04")
    match_time: str = Field(..., example="20:30")
    end_time: Optional[str] = "21:30"
    deadline_time: Optional[str] = ""
    duration_min: int = Field(default=60)
    price_per_player: str = Field(default="8€")
    pitch_type: Optional[str] = "Sintetico 4G"
    missing_count: int = Field(default=1)
    roles_needed: List[str] = Field(..., example=["Portiere", "Difensore"])
    level: str = Field(default="Amatoriale con grinta")
    notes: Optional[str] = None
    organizer_name: str = Field(..., example="Matteo")
    organizer_phone: str = Field(..., example="+39 340 1234567")
    creator_id: Optional[str] = ""
    creator_username: Optional[str] = ""
    organizer_role: Optional[str] = "Centrocampista"

class MatchUpdate(BaseModel):
    title: Optional[str] = None
    format: Optional[str] = None
    organizer_role: Optional[str] = None
    field_name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    maps_url: Optional[str] = None
    match_date: Optional[str] = None
    match_time: Optional[str] = None
    end_time: Optional[str] = None
    deadline_time: Optional[str] = None
    duration_min: Optional[int] = None
    price_per_player: Optional[str] = None
    pitch_type: Optional[str] = None
    missing_count: Optional[int] = None
    roles_needed: Optional[List[str]] = None
    level: Optional[str] = None
    notes: Optional[str] = None
    organizer_name: Optional[str] = None
    organizer_phone: Optional[str] = None
    requester_id: Optional[str] = None

class ApplicationAction(BaseModel):
    application_id: int

class ApplicationCreate(BaseModel):
    player_id: str = "my_profile"
    player_name: str
    player_username: Optional[str] = ""
    player_role: str
    player_phone: str
    player_ovr: int = 78
    message: Optional[str] = "Sono pronto per stasera, arrivo con scarpini e quota!"

class ApplicationCancel(BaseModel):
    player_id: str
    player_role: Optional[str] = None

class PlayerProfileUpdate(BaseModel):
    name: str
    nickname: Optional[str] = ""
    photo_url: Optional[str] = "/static/avatars/bomber.svg"
    age: int = 25
    foot: str = "Destro"
    primary_role: str = "Centrocampista"
    secondary_roles: List[str] = []
    city: str = ""
    bio: Optional[str] = ""
    phone: Optional[str] = ""
    stats_vel: int = 75
    stats_tir: int = 70
    stats_pas: int = 72
    stats_dri: int = 74
    stats_dif: int = 68
    stats_fis: int = 78
    ovr: int = 75
    card_theme: str = "gold"
    badges: List[str] = []
    is_available: int = 1

class UserLogin(BaseModel):
    username: str
    password: str

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    phone: str
    primary_role: Optional[str] = "Centrocampista"
    city: Optional[str] = ""

class ReviewCreate(BaseModel):
    match_id: Optional[int] = None
    match_title: Optional[str] = "Partita di calcetto"
    reviewer_id: Optional[str] = ""
    reviewer_name: str
    target_player_id: str
    target_player_name: Optional[str] = ""
    rating_person: int = Field(default=5, ge=1, le=5)
    rating_skill: int = Field(default=5, ge=1, le=5)
    rating: Optional[int] = None
    reliability_tag: str
    comment: Optional[str] = ""
    discrepancy_type: Optional[str] = ""
    discrepancy_attributes: Optional[List[str]] = []
    discrepancy_details: Optional[str] = ""

class AvailabilityCreate(BaseModel):
    player_id: str
    player_name: str
    player_ovr: int = 75
    photo_url: Optional[str] = "/static/avatars/bomber.svg"
    primary_role: str
    city: str
    zone: str
    available_date: str
    time_slot: str
    preferred_format: Optional[str] = "5, 6 o 7"
    notes: Optional[str] = ""

class AvailabilityUpdate(BaseModel):
    available_date: Optional[str] = None
    time_slot: Optional[str] = None
    city: Optional[str] = None
    zone: Optional[str] = None
    preferred_format: Optional[str] = None
    notes: Optional[str] = None
    primary_role: Optional[str] = None

class MessageSend(BaseModel):
    availability_id: Optional[int] = None
    sender_id: str
    sender_name: str
    recipient_id: str
    recipient_name: str
    text: str

class SettingsUpdate(BaseModel):
    broadcast_alert: Optional[str] = None
    emergency_threshold_hours: Optional[str] = None
    allowed_formats: Optional[str] = None
    active_cities: Optional[str] = None

# ==========================================
# AUTH ENDPOINTS
# ==========================================
@app.post("/api/auth/login")
def login(creds: UserLogin):
    conn = database.get_db()
    cursor = conn.cursor()
    pw_hash = database.hash_password(creds.password)

    cursor.execute("""
    SELECT id, username, email, full_name, phone, is_admin FROM users
    WHERE (username = ? OR email = ?) AND password_hash = ?
    """, (creds.username, creds.username, pw_hash))
    user = cursor.fetchone()

    if not user:
        conn.close()
        raise HTTPException(status_code=401, detail="Credenziali non valide. Controlla username e password.")

    user_dict = dict(user)
    user_player_id = f"user_{user_dict['id']}"
    user_dict["player_id"] = user_player_id

    # Check if a player profile exists for this user, if not create default
    cursor.execute("SELECT id FROM players WHERE id = ? OR id = ? OR name = ?", (user_player_id, user_dict["username"], user_dict["full_name"]))
    p_row = cursor.fetchone()
    if not p_row:
        default_badges = json.dumps([
            "🍺 Terzo Tempo Garantito",
            "⚡ Fulmine del Pagamento (Quota precisa)",
            "🛡️ Zero Pacchi (Mai buche all'ultimo)"
        ])
        cursor.execute("""
        INSERT INTO players (
            id, name, nickname, photo_url, age, foot, primary_role, secondary_roles,
            city, bio, phone, stats_vel, stats_tir, stats_pas, stats_dri, stats_dif, stats_fis,
            ovr, card_theme, badges, is_available, matches_played, mvp_count, fair_play_rating, reliability_score
        ) VALUES (
            ?, ?, '', '/static/avatars/bomber.svg', 25, 'Destro', 'Centrocampista', '[]',
            '', 'Pronto a scendere in campo! Zero pacchi.', ?, 75, 75, 75, 75, 75, 75,
            75, 'gold', ?,
            1, 0, 0, 5.0, 100
        )
        """, (user_player_id, user_dict["full_name"], user_dict["phone"] or "", default_badges))
        conn.commit()

    conn.close()

    return {
        "success": True,
        "user": user_dict,
        "is_admin": bool(user_dict["is_admin"]),
        "message": f"Bentornato {user_dict['full_name']}!" if not user_dict["is_admin"] else "Accesso Amministratore effettuato!"
    }

@app.post("/api/auth/register")
def register(data: UserRegister):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE username = ? OR email = ?", (data.username, data.email))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Username o Email già in uso.")

    pw_hash = database.hash_password(data.password)
    cursor.execute("""
    INSERT INTO users (username, email, password_hash, full_name, phone, is_admin)
    VALUES (?, ?, ?, ?, ?, 0)
    """, (data.username, data.email, pw_hash, data.full_name, data.phone))
    user_id = cursor.lastrowid

    player_id = f"user_{user_id}"
    default_badges = json.dumps([
        "🍺 Terzo Tempo Garantito",
        "⚡ Fulmine del Pagamento (Quota precisa)",
        "🛡️ Zero Pacchi (Mai buche all'ultimo)"
    ])
    cursor.execute("""
    INSERT INTO players (
        id, name, nickname, photo_url, age, foot, primary_role, secondary_roles,
        city, bio, phone, stats_vel, stats_tir, stats_pas, stats_dri, stats_dif, stats_fis,
        ovr, card_theme, badges, is_available, matches_played, mvp_count, fair_play_rating, reliability_score
    ) VALUES (
        ?, ?, '', '/static/avatars/bomber.svg', 25, 'Destro', ?, '[]',
        ?, 'Pronto a scendere in campo! Zero pacchi.', ?, 75, 75, 75, 75, 75, 75,
        75, 'gold', ?,
        1, 0, 0, 5.0, 100
    )
    """, (player_id, data.full_name, data.primary_role, data.city, data.phone, default_badges))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "user": {
            "id": user_id,
            "username": data.username,
            "email": data.email,
            "full_name": data.full_name,
            "phone": data.phone,
            "is_admin": 0,
            "player_id": player_id
        },
        "message": "Registrazione completata! Ora personalizza la tua Scheda Giocatore 3D!"
    }

# ==========================================
# SCOUTING & AVAILABILITY ENDPOINTS
# ==========================================
@app.get("/api/availabilities")
def get_availabilities(
    city: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    q: Optional[str] = Query(None)
):
    conn = database.get_db()
    cursor = conn.cursor()

    query = """
    SELECT a.*, 
           COALESCE(p.reliability_score, 100) as reliability_score,
           COALESCE(p.card_accuracy_rating, 5.0) as card_accuracy_rating,
           COALESCE(p.fair_play_rating, 5.0) as fair_play_rating,
           COALESCE(p.stats_vel, 75) as stats_vel,
           COALESCE(p.stats_tir, 75) as stats_tir,
           COALESCE(p.stats_pas, 75) as stats_pas,
           COALESCE(p.stats_dri, 75) as stats_dri,
           COALESCE(p.stats_dif, 75) as stats_dif,
           COALESCE(p.stats_fis, 75) as stats_fis,
           COALESCE(p.badges, '[]') as badges,
           COALESCE(p.foot, 'Destro') as foot
    FROM availabilities a
    LEFT JOIN players p ON a.player_id = p.id
    WHERE a.status = 'active'
    """
    params = []

    if city and city != "all":
        query += " AND LOWER(a.city) LIKE ?"
        params.append(f"%{city.lower()}%")

    if role and role != "all":
        query += " AND (LOWER(a.primary_role) = ? OR LOWER(a.primary_role) = 'jolly')"
        params.append(role.lower())

    if q:
        query += " AND (LOWER(a.player_name) LIKE ? OR LOWER(a.zone) LIKE ? OR LOWER(a.city) LIKE ? OR LOWER(a.notes) LIKE ?)"
        term = f"%{q.lower()}%"
        params.extend([term, term, term, term])

    query += " ORDER BY a.created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    availabilities = [dict(r) for r in rows]
    conn.close()

    return {"availabilities": availabilities, "count": len(availabilities)}

@app.post("/api/availabilities")
def create_availability(data: AvailabilityCreate):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
    INSERT INTO availabilities (
        player_id, player_name, player_ovr, photo_url, primary_role,
        city, zone, available_date, time_slot, preferred_format, notes, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
    """, (
        data.player_id, data.player_name, data.player_ovr, data.photo_url,
        data.primary_role, data.city, data.zone, data.available_date,
        data.time_slot, data.preferred_format, data.notes
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {
        "success": True,
        "id": new_id,
        "message": "Disponibilità attivata sul Radar Scouting! Gli organizzatori possono ora contattarti."
    }

@app.put("/api/availabilities/{avail_id}")
def update_availability(avail_id: int, data: AvailabilityUpdate):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM availabilities WHERE id = ?", (avail_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Disponibilità non trovata")
    
    row_dict = dict(row)
    if row_dict.get("status") == "booked":
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Non puoi modificare la disponibilità: hai già preso un accordo confermato per questa convocazione!"
        )

    fields = []
    params = []
    for k, v in data.dict(exclude_unset=True).items():
        if v is not None:
            fields.append(f"{k} = ?")
            params.append(v)
    
    if fields:
        params.append(avail_id)
        cursor.execute(f"UPDATE availabilities SET {', '.join(fields)} WHERE id = ?", params)
        conn.commit()

    conn.close()
    return {"success": True, "message": "Disponibilità modificata con successo!"}

@app.delete("/api/availabilities/{avail_id}")
def delete_availability(avail_id: int):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM availabilities WHERE id = ?", (avail_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Disponibilità non trovata")
    
    row_dict = dict(row)
    if row_dict.get("status") == "booked":
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Non puoi rimuovere la disponibilità: hai già preso un accordo confermato per questa convocazione!"
        )

    cursor.execute("DELETE FROM availabilities WHERE id = ?", (avail_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Disponibilità rimossa dal Radar Scouting."}

# ==========================================
# IN-APP MESSAGING ENDPOINTS (SCOUTING)
# ==========================================
@app.get("/api/messages")
def get_messages(
    availability_id: Optional[int] = Query(None),
    user_id: Optional[str] = Query(None),
    partner_id: Optional[str] = Query(None)
):
    conn = database.get_db()
    cursor = conn.cursor()

    if availability_id:
        cursor.execute("SELECT * FROM messages WHERE availability_id = ? ORDER BY created_at ASC", (availability_id,))
    elif user_id and partner_id:
        cursor.execute("""
            SELECT * FROM messages 
            WHERE (sender_id = ? AND recipient_id = ?) 
               OR (sender_id = ? AND recipient_id = ?)
            ORDER BY created_at ASC
        """, (user_id, partner_id, partner_id, user_id))
    elif user_id:
        cursor.execute("SELECT * FROM messages WHERE sender_id = ? OR recipient_id = ? ORDER BY created_at ASC", (user_id, user_id))
    else:
        cursor.execute("SELECT * FROM messages ORDER BY created_at DESC LIMIT 50")

    rows = cursor.fetchall()
    messages = [dict(r) for r in rows]
    conn.close()
    return {"messages": messages, "count": len(messages)}

@app.get("/api/chat/conversations")
def get_user_conversations(user_id: str = Query(...)):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT 
            m.id as last_message_id,
            m.availability_id,
            m.text as last_message_text,
            m.created_at as last_message_time,
            CASE WHEN m.sender_id = ? THEN m.recipient_id ELSE m.sender_id END as partner_id,
            CASE WHEN m.sender_id = ? THEN m.recipient_name ELSE m.sender_name END as partner_name,
            m.sender_id as last_sender_id,
            m.sender_name as last_sender_name
        FROM messages m
        WHERE m.sender_id = ? OR m.recipient_id = ?
        ORDER BY m.created_at DESC
    """, (user_id, user_id, user_id, user_id))
    
    rows = cursor.fetchall()
    conversations_map = {}
    for r in rows:
        row_dict = dict(r)
        pid = row_dict["partner_id"]
        if pid not in conversations_map:
            cursor.execute("SELECT photo_url, primary_role, ovr, reliability_score FROM players WHERE id = ?", (pid,))
            p_info = cursor.fetchone()
            if p_info:
                p_dict = dict(p_info)
                row_dict["partner_photo"] = p_dict.get("photo_url") or "/static/avatars/bomber.svg"
                row_dict["partner_role"] = p_dict.get("primary_role") or "Giocatore"
                row_dict["partner_ovr"] = p_dict.get("ovr") or 75
                row_dict["partner_reliability"] = p_dict.get("reliability_score") or 100
            else:
                row_dict["partner_photo"] = "/static/avatars/bomber.svg"
                row_dict["partner_role"] = "Organizzatore / Giocatore"
                row_dict["partner_ovr"] = 75
                row_dict["partner_reliability"] = 100
            
            conversations_map[pid] = row_dict

    conn.close()
    return {"conversations": list(conversations_map.values())}

@app.post("/api/messages")
def send_message(msg: MessageSend):
    conn = database.get_db()
    cursor = conn.cursor()

    now_local = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
    INSERT INTO messages (availability_id, sender_id, sender_name, recipient_id, recipient_name, text, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        msg.availability_id, msg.sender_id, msg.sender_name,
        msg.recipient_id, msg.recipient_name, msg.text, now_local
    ))
    new_id = cursor.lastrowid

    # Also notify recipient in notifications
    try:
        cursor.execute("""
        INSERT INTO notifications (
            recipient_id, sender_id, sender_name, match_id, match_title, type, title, message, created_at
        ) VALUES (?, ?, ?, ?, ?, 'scout_chat', ?, ?, ?)
        """, (
            msg.recipient_id, msg.sender_id, msg.sender_name,
            msg.availability_id or 0, "Radar Scouting",
            f"Nuovo messaggio da {msg.sender_name}",
            msg.text, now_local
        ))
    except Exception:
        pass

    conn.commit()

    cursor.execute("SELECT * FROM messages WHERE id = ?", (new_id,))
    saved_msg = dict(cursor.fetchone())
    conn.close()

    return {"success": True, "message": saved_msg}

# ==========================================
# GEOCODING & REAL LOCATION RESOLUTION
# ==========================================
@app.get("/api/geocode")
def geocode_location(q: str = Query(...)):
    clean_q = q.strip().lower()
    if not clean_q:
        raise HTTPException(status_code=400, detail="Località mancante")

    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT latitude, longitude, display_name FROM geocode_cache WHERE query = ?", (clean_q,))
    cached = cursor.fetchone()
    if cached:
        row = dict(cached)
        conn.close()
        return {
            "query": clean_q,
            "latitude": row["latitude"],
            "longitude": row["longitude"],
            "display_name": row["display_name"],
            "cached": True
        }

    # Query OpenStreetMap Nominatim for accurate real-world coordinates
    try:
        url = f"https://nominatim.openstreetmap.org/search?format=json&q={urllib.parse.quote(clean_q + ', Italia')}&limit=1"
        req = urllib.request.Request(url, headers={"User-Agent": "TrovaUltimo-App/1.0 (calcio@trovaultimo.it)"})
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if data and len(data) > 0:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                disp = data[0].get("display_name", clean_q)
                cursor.execute(
                    "INSERT OR REPLACE INTO geocode_cache (query, latitude, longitude, display_name) VALUES (?, ?, ?, ?)",
                    (clean_q, lat, lon, disp)
                )
                conn.commit()
                conn.close()
                return {
                    "query": clean_q,
                    "latitude": lat,
                    "longitude": lon,
                    "display_name": disp,
                    "cached": False
                }
    except Exception as e:
        print(f"Nominatim lookup error for '{clean_q}':", e)

    conn.close()
    raise HTTPException(status_code=404, detail=f"Località '{q}' non trovata.")

# ==========================================
# MATCHES ENDPOINTS
# ==========================================
@app.get("/api/matches")
def get_matches(
    format: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    city: Optional[str] = Query(None),
    status: Optional[str] = Query("all"),
    user_id: Optional[str] = Query(None),
    q: Optional[str] = Query(None)
):
    conn = database.get_db()
    cursor = conn.cursor()

    query = "SELECT * FROM matches WHERE 1=1"
    params = []

    if status != "all":
        query += " AND status = ?"
        params.append(status)

    if format and format != "all":
        query += " AND format = ?"
        params.append(format)

    if city and city != "all":
        query += " AND LOWER(city) LIKE ?"
        params.append(f"%{city.lower()}%")

    if q:
        query += " AND (LOWER(title) LIKE ? OR LOWER(field_name) LIKE ? OR LOWER(address) LIKE ? OR LOWER(city) LIKE ?)"
        term = f"%{q.lower()}%"
        params.extend([term, term, term, term])

    query += " ORDER BY match_date ASC, match_time ASC"
    cursor.execute(query, params)
    rows = cursor.fetchall()

    matches = []
    for r in rows:
        match_dict = dict(r)
        try:
            match_dict["roles_needed"] = json.loads(match_dict["roles_needed"])
        except Exception:
            match_dict["roles_needed"] = [match_dict["roles_needed"]]

        try:
            match_dict["confirmed_players"] = json.loads(match_dict["confirmed_players"]) if match_dict["confirmed_players"] else []
        except Exception:
            match_dict["confirmed_players"] = []

        # Ensure all confirmed players have their player_username resolved for UI display
        for cp in match_dict["confirmed_players"]:
            if not cp.get("player_username"):
                pid = cp.get("player_id", "")
                uname = ""
                if pid and pid.startswith("user_"):
                    try:
                        uid = int(pid.replace("user_", ""))
                        cursor.execute("SELECT username FROM users WHERE id = ?", (uid,))
                        u_row = cursor.fetchone()
                        if u_row:
                            uname = u_row["username"]
                    except Exception:
                        pass
                if not uname and pid:
                    cursor.execute("SELECT nickname, name FROM players WHERE id = ?", (pid,))
                    p_row = cursor.fetchone()
                    if p_row:
                        uname = p_row["nickname"] or p_row["name"]
                if not uname:
                    uname = cp.get("player_name") or cp.get("name") or ""
                cp["player_username"] = uname

        if not match_dict.get("creator_username") and match_dict.get("creator_id"):
            cid = match_dict["creator_id"]
            if cid.startswith("user_"):
                try:
                    uid = int(cid.replace("user_", ""))
                    cursor.execute("SELECT username FROM users WHERE id = ?", (uid,))
                    u_row = cursor.fetchone()
                    if u_row:
                        match_dict["creator_username"] = u_row["username"]
                except Exception:
                    pass

        if not match_dict.get("maps_url"):
            query_loc = urllib.parse.quote(f"{match_dict['field_name']}, {match_dict['address']}, {match_dict['city']}")
            match_dict["maps_url"] = f"https://www.google.com/maps/search/?api=1&query={query_loc}"

        if role and role != "all":
            needed = [x.lower() for x in match_dict["roles_needed"]]
            if not any(role.lower() in x for x in needed) and "jolly" not in needed and "qualsiasi" not in needed:
                continue

        cursor.execute("SELECT COUNT(*) FROM applications WHERE match_id = ?", (match_dict["id"],))
        match_dict["applications_count"] = cursor.fetchone()[0]

        if user_id:
            cursor.execute("SELECT status, player_role FROM applications WHERE match_id = ? AND player_id = ?", (match_dict["id"], user_id))
            user_apps = [dict(r) for r in cursor.fetchall()]
            match_dict["user_applied_roles"] = [a["player_role"] for a in user_apps if a["status"] in ("pending", "accepted")]
            if any(a["status"] == "accepted" for a in user_apps):
                match_dict["user_application_status"] = "accepted"
            elif any(a["status"] == "pending" for a in user_apps):
                match_dict["user_application_status"] = "pending"
            else:
                match_dict["user_application_status"] = None
        else:
            match_dict["user_application_status"] = None
            match_dict["user_applied_roles"] = []

        matches.append(match_dict)

    conn.close()
    return {"matches": matches, "count": len(matches)}

@app.get("/api/matches/{match_id}")
def get_match_detail(match_id: int):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Partita non trovata")

    match_dict = dict(row)
    match_dict["roles_needed"] = json.loads(match_dict["roles_needed"])
    match_dict["confirmed_players"] = json.loads(match_dict["confirmed_players"]) if match_dict["confirmed_players"] else []

    if not match_dict.get("maps_url"):
        query_loc = urllib.parse.quote(f"{match_dict['field_name']}, {match_dict['address']}, {match_dict['city']}")
        match_dict["maps_url"] = f"https://www.google.com/maps/search/?api=1&query={query_loc}"

    cursor.execute("SELECT * FROM applications WHERE match_id = ? ORDER BY created_at DESC", (match_id,))
    applications = [dict(a) for a in cursor.fetchall()]
    match_dict["applications"] = applications

    conn.close()
    return match_dict

@app.post("/api/matches")
def create_match(data: MatchCreate):
    conn = database.get_db()
    cursor = conn.cursor()

    fmt = data.format
    total_slots = int(fmt) * 2
    confirmed_count = total_slots - data.missing_count

    confirmed_players = []
    roles_pool = ["Portiere", "Difensore", "Centrocampista", "Attaccante", "Jolly"]
    for i in range(1, confirmed_count + 1):
        if i == 1:
            name = f"{data.organizer_name} (Capitano)"
            r = "Centrocampista"
        elif i == 2:
            name = f"Giocatore {i}"
            r = "Portiere" if "Portiere" not in data.roles_needed else "Difensore"
        else:
            name = f"Giocatore {i}"
            r = roles_pool[i % len(roles_pool)]
        confirmed_players.append({"name": name, "role": r, "number": i})

    maps_url = data.maps_url
    if not maps_url:
        encoded_addr = urllib.parse.quote(f"{data.field_name}, {data.address}, {data.city}")
        maps_url = f"https://www.google.com/maps/search/?api=1&query={encoded_addr}"

    cursor.execute("""
    INSERT INTO matches (
        title, format, field_name, address, city, latitude, longitude, maps_url,
        match_date, match_time, end_time, deadline_time, duration_min, price_per_player, pitch_type,
        missing_count, roles_needed, level, notes, organizer_name, organizer_phone,
        status, confirmed_players, creator_id, creator_username, organizer_role
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?, ?)
    """, (
        data.title, data.format, data.field_name, data.address, data.city,
        data.latitude, data.longitude, maps_url,
        data.match_date, data.match_time, data.end_time or "", data.deadline_time or "", data.duration_min, data.price_per_player,
        data.pitch_type or "Sintetico 4G", data.missing_count, json.dumps(data.roles_needed),
        data.level, data.notes, data.organizer_name, data.organizer_phone,
        json.dumps(confirmed_players), data.creator_id or "", data.creator_username or "", data.organizer_role or "Centrocampista"
    ))
    new_id = cursor.lastrowid
    conn.commit()
    conn.close()

    return {"success": True, "id": new_id, "maps_url": maps_url, "message": "Partita e geolocalizzazione salvate con successo!"}

@app.put("/api/matches/{match_id}")
def update_match(match_id: int, data: MatchUpdate):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
    match_row = cursor.fetchone()
    if not match_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Partita non trovata")
    
    m_dict = dict(match_row)
    
    # Check if match is already finished
    today_str = datetime.now().strftime("%Y-%m-%d")
    now_time = datetime.now().strftime("%H:%M")
    if m_dict["match_date"] < today_str or (m_dict["match_date"] == today_str and (m_dict.get("end_time") or m_dict["match_time"]) < now_time):
        conn.close()
        raise HTTPException(status_code=400, detail="Non puoi modificare una partita già conclusa!")

    fields = []
    params = []
    update_data = data.dict(exclude_unset=True)
    update_data.pop("requester_id", None)

    if "roles_needed" in update_data and update_data["roles_needed"] is not None:
        update_data["roles_needed"] = json.dumps(update_data["roles_needed"])

    if "field_name" in update_data or "address" in update_data or "city" in update_data:
        f_name = update_data.get("field_name", m_dict["field_name"])
        addr = update_data.get("address", m_dict["address"])
        cit = update_data.get("city", m_dict["city"])
        encoded_addr = urllib.parse.quote(f"{f_name}, {addr}, {cit}")
        update_data["maps_url"] = f"https://www.google.com/maps/search/?api=1&query={encoded_addr}"

    for k, v in update_data.items():
        if v is not None:
            fields.append(f"{k} = ?")
            params.append(v)
    
    if fields:
        params.append(match_id)
        cursor.execute(f"UPDATE matches SET {', '.join(fields)} WHERE id = ?", params)
        conn.commit()

    conn.close()
    return {"success": True, "message": "Partita aggiornata con successo!"}

@app.delete("/api/matches/{match_id}")
def delete_match(match_id: int, user_id: Optional[str] = Query(None)):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
    match_row = cursor.fetchone()
    if not match_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Partita non trovata")
    
    m_dict = dict(match_row)
    
    # Notify applicants that match was cancelled by organizer
    cursor.execute("SELECT DISTINCT player_id, player_name FROM applications WHERE match_id = ? AND status != 'cancelled'", (match_id,))
    applicants = cursor.fetchall()
    for app in applicants:
        cursor.execute("""
        INSERT INTO notifications (
            recipient_id, sender_id, sender_name, match_id, match_title, type, title, message
        ) VALUES (?, ?, ?, ?, ?, 'match_cancelled', ?, ?)
        """, (
            app["player_id"], m_dict.get("creator_id") or "organizer", m_dict.get("organizer_name", "Organizzatore"),
            match_id, m_dict["title"],
            f"❌ Partita annullata: {m_dict['title']}",
            f"L'organizzatore ha cancellato la partita del {m_dict['match_date']} alle ore {m_dict['match_time']}. La tua candidatura o convocazione è stata revocata."
        ))

    cursor.execute("DELETE FROM applications WHERE match_id = ?", (match_id,))
    cursor.execute("DELETE FROM matches WHERE id = ?", (match_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Partita cancellata con successo."}

@app.post("/api/matches/{match_id}/apply")
def apply_to_match(match_id: int, app_data: ApplicationCreate):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
    match = cursor.fetchone()
    if not match:
        conn.close()
        raise HTTPException(status_code=404, detail="Partita non trovata")

    match_dict = dict(match)
    if match_dict["status"] == "filled" or match_dict["missing_count"] <= 0:
        conn.close()
        raise HTTPException(status_code=400, detail="I posti per questa partita sono già completati!")

    # Check if applicant is the match creator/organizer
    creator_id = str(match_dict.get("creator_id") or "").strip()
    creator_username = str(match_dict.get("creator_username") or "").strip().lower()
    organizer_name = str(match_dict.get("organizer_name") or "").strip().lower()
    organizer_phone = str(match_dict.get("organizer_phone") or "").replace(" ", "").replace("+", "").replace("-", "")

    player_id_str = str(app_data.player_id or "").strip()
    player_name_lower = str(app_data.player_name or "").strip().lower()
    player_phone_clean = str(app_data.player_phone or "").replace(" ", "").replace("+", "").replace("-", "")

    is_creator_applying = False
    if creator_id and (creator_id == player_id_str or player_id_str == f"user_{creator_id}"):
        is_creator_applying = True
    elif creator_username and (creator_username == player_name_lower or player_id_str == f"user_{creator_username}"):
        is_creator_applying = True
    elif organizer_name and organizer_name == player_name_lower:
        is_creator_applying = True
    elif organizer_phone and player_phone_clean and organizer_phone == player_phone_clean:
        is_creator_applying = True

    if is_creator_applying:
        conn.close()
        raise HTTPException(status_code=400, detail="Non puoi candidarti alla tua stessa partita! Sei tu l'organizzatore.")

    # Check deadline
    if match_dict.get("deadline_time"):
        today_str = datetime.now().strftime("%Y-%m-%d")
        if match_dict["match_date"] == today_str:
            now_time = datetime.now().strftime("%H:%M")
            if now_time > match_dict["deadline_time"]:
                conn.close()
                raise HTTPException(status_code=400, detail=f"Candidature chiuse per questa partita! L'orario limite era alle {match_dict['deadline_time']}.")

    # Clean phone and prepare WhatsApp message
    phone_clean = match_dict["organizer_phone"].replace(" ", "").replace("+", "").replace("-", "")
    msg_text = (
        f"⚽ Ciao {match_dict['organizer_name']}! Mi sono appena candidato su 'Trova l'Ultimo' "
        f"per la tua partita al {match_dict['field_name']} ({match_dict['match_time']}).\n"
        f"Nome: {app_data.player_name}\n"
        f"Ruolo: {app_data.player_role} (OVR {app_data.player_ovr})\n"
        f"Messaggio: {app_data.message}\n"
        f"Puoi confermarmi in squadra dall'app!"
    )
    whatsapp_url = f"https://wa.me/{phone_clean}?text={urllib.parse.quote(msg_text)}"

    # Check if already accepted in team
    cursor.execute("SELECT id FROM applications WHERE match_id = ? AND player_id = ? AND status = 'accepted' LIMIT 1", (match_id, app_data.player_id))
    if cursor.fetchone():
        conn.close()
        return {
            "success": True,
            "already_applied": True,
            "status": "accepted",
            "message": "Sei già stato confermato in squadra per questa partita!",
            "whatsapp_url": whatsapp_url,
            "organizer_name": match_dict["organizer_name"],
            "organizer_phone": match_dict["organizer_phone"]
        }

    # Check if already applied for THIS SPECIFIC ROLE
    cursor.execute(
        "SELECT id, status FROM applications WHERE match_id = ? AND player_id = ? AND LOWER(player_role) = LOWER(?) AND status = 'pending' LIMIT 1",
        (match_id, app_data.player_id, app_data.player_role)
    )
    existing_role = cursor.fetchone()
    if existing_role:
        conn.close()
        return {
            "success": True,
            "already_applied": True,
            "status": "pending",
            "message": f"Ti sei già candidato come {app_data.player_role} per questa partita! Scrivi all'organizzatore su WhatsApp.",
            "whatsapp_url": whatsapp_url,
            "organizer_name": match_dict["organizer_name"],
            "organizer_phone": match_dict["organizer_phone"]
        }

    # Insert pending application (do NOT decrement missing_count yet!)
    cursor.execute("""
    INSERT INTO applications (
        match_id, player_id, player_name, player_role, player_phone, player_ovr, message, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    """, (
        match_id, app_data.player_id, app_data.player_name, app_data.player_role,
        app_data.player_phone, app_data.player_ovr, app_data.message
    ))

    # Notify creator if known
    creator_target = match_dict.get("creator_id") or match_dict.get("creator_username")
    if creator_target:
        cursor.execute("""
        INSERT INTO notifications (
            recipient_id, sender_id, sender_name, match_id, match_title, type, title, message
        ) VALUES (?, ?, ?, ?, ?, 'match_application', ?, ?)
        """, (
            creator_target, app_data.player_id, app_data.player_name, match_id, match_dict["title"],
            f"⚽ Nuova candidatura da {app_data.player_name}!",
            f"{app_data.player_name} ({app_data.player_role}, OVR {app_data.player_ovr}) si è candidato per '{match_dict['title']}'. Apri la partita per confermarlo!"
        ))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": f"Candidatura registrata per {match_dict['title']}! Ora scrivi all'organizzatore su WhatsApp per farti confermare.",
        "whatsapp_url": whatsapp_url,
        "organizer_name": match_dict["organizer_name"],
        "organizer_phone": match_dict["organizer_phone"]
    }

@app.post("/api/matches/{match_id}/cancel_application")
def cancel_application(match_id: int, cancel_data: ApplicationCancel):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
    match_row = cursor.fetchone()
    if not match_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Partita non trovata")

    match_dict = dict(match_row)

    # 1. Check if already accepted: "dopo se viene accettato non puo farlo piu"
    cursor.execute("""
        SELECT id FROM applications 
        WHERE match_id = ? AND player_id = ? AND status = 'accepted'
    """, (match_id, cancel_data.player_id))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Non puoi più annullare la candidatura: sei già stato confermato ufficialmente in squadra dall'organizzatore!"
        )

    try:
        confirmed = json.loads(match_dict.get("confirmed_players") or "[]")
        if any(cp.get("player_id") == cancel_data.player_id for cp in confirmed):
            conn.close()
            raise HTTPException(
                status_code=400,
                detail="Non puoi più annullare la candidatura: sei già presente nella formazione ufficiale confermata!"
            )
    except Exception:
        pass

    # 2. Check deadline: "sempre puo farlo entro l'orario massimo impostato per iscriversi"
    deadline = match_dict.get("deadline_time") or match_dict.get("match_time")
    if deadline and match_dict.get("match_date"):
        today_str = datetime.now().strftime("%Y-%m-%d")
        now_time = datetime.now().strftime("%H:%M")
        if match_dict["match_date"] < today_str or (match_dict["match_date"] == today_str and now_time > deadline):
            conn.close()
            raise HTTPException(
                status_code=400,
                detail=f"Tempo massimo per gestire o annullare le candidature scaduto (limite: ore {deadline}). Non è più possibile ritirare la candidatura."
            )

    # 3. Find pending application(s)
    if cancel_data.player_role:
        cursor.execute("""
            SELECT * FROM applications 
            WHERE match_id = ? AND player_id = ? AND LOWER(player_role) = LOWER(?) AND status = 'pending'
        """, (match_id, cancel_data.player_id, cancel_data.player_role))
    else:
        cursor.execute("""
            SELECT * FROM applications 
            WHERE match_id = ? AND player_id = ? AND status = 'pending'
        """, (match_id, cancel_data.player_id))

    pending_apps = cursor.fetchall()
    if not pending_apps:
        conn.close()
        raise HTTPException(status_code=404, detail="Nessuna candidatura in attesa trovata per questa partita.")

    app_ids = [p["id"] for p in pending_apps]
    q_ids = ",".join("?" for _ in app_ids)
    cursor.execute(f"UPDATE applications SET status = 'cancelled' WHERE id IN ({q_ids})", app_ids)

    # Notify creator if known
    creator_target = match_dict.get("creator_id") or match_dict.get("creator_username")
    if creator_target:
        first_app = pending_apps[0]
        roles_text = ", ".join(p["player_role"] for p in pending_apps)
        cursor.execute("""
        INSERT INTO notifications (
            recipient_id, sender_id, sender_name, match_id, match_title, type, title, message
        ) VALUES (?, ?, ?, ?, ?, 'application_cancelled', ?, ?)
        """, (
            creator_target, cancel_data.player_id, first_app["player_name"], match_id, match_dict["title"],
            f"ℹ️ Candidatura ritirata da {first_app['player_name']}",
            f"{first_app['player_name']} ha ritirato la candidatura per '{match_dict['title']}' ({roles_text}) entro l'orario limite previsto."
        ))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": "Candidatura annullata con successo! Il posto è tornato disponibile."
    }

@app.get("/api/matches/{match_id}/applications")
def get_match_applications(match_id: int):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT a.*, p.photo_url, p.reliability_score, p.card_accuracy_rating, p.fair_play_rating
        FROM applications a
        LEFT JOIN players p ON a.player_id = p.id
        WHERE a.match_id = ?
        ORDER BY a.created_at DESC
    """, (match_id,))
    rows = cursor.fetchall()
    apps = [dict(r) for r in rows]
    conn.close()
    return {"applications": apps, "count": len(apps)}

@app.post("/api/matches/{match_id}/confirm_player")
def confirm_match_player(match_id: int, action: ApplicationAction):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
    match = cursor.fetchone()
    if not match:
        conn.close()
        raise HTTPException(status_code=404, detail="Partita non trovata")

    cursor.execute("SELECT * FROM applications WHERE id = ? AND match_id = ?", (action.application_id, match_id))
    app_row = cursor.fetchone()
    if not app_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Candidatura non trovata")

    if app_row["status"] == "accepted":
        conn.close()
        return {"success": True, "message": "Giocatore già confermato in squadra."}

    if match["missing_count"] <= 0:
        conn.close()
        raise HTTPException(status_code=400, detail="Tutti gli slot per questa partita sono già completati!")

    # Add to confirmed_players
    try:
        confirmed = json.loads(match["confirmed_players"] or "[]")
    except Exception:
        confirmed = []

    already_in = any(cp.get("player_id") == app_row["player_id"] for cp in confirmed)
    if not already_in:
        uname = ""
        pid = app_row["player_id"]
        if pid and pid.startswith("user_"):
            try:
                uid = int(pid.replace("user_", ""))
                cursor.execute("SELECT username FROM users WHERE id = ?", (uid,))
                urow = cursor.fetchone()
                if urow:
                    uname = urow["username"]
            except Exception:
                pass
        if not uname and pid:
            cursor.execute("SELECT nickname, name FROM players WHERE id = ?", (pid,))
            prow = cursor.fetchone()
            if prow:
                uname = prow["nickname"] or prow["name"]
        if not uname:
            uname = app_row["player_name"]

        confirmed.append({
            "player_id": app_row["player_id"],
            "player_name": app_row["player_name"],
            "player_username": uname,
            "player_role": app_row["player_role"],
            "player_phone": app_row["player_phone"],
            "player_ovr": app_row["player_ovr"],
            "joined_at": datetime.now().isoformat()
        })

    new_missing = max(0, match["missing_count"] - 1)
    new_status = "filled" if new_missing == 0 else match["status"]

    cursor.execute("""
        UPDATE matches
        SET missing_count = ?, confirmed_players = ?, status = ?
        WHERE id = ?
    """, (new_missing, json.dumps(confirmed), new_status, match_id))

    # Mark current application accepted
    cursor.execute("UPDATE applications SET status = 'accepted' WHERE id = ?", (action.application_id,))

    # Expire all OTHER pending applications for this player across any matches
    cursor.execute("""
        UPDATE applications 
        SET status = 'expired' 
        WHERE player_id = ? AND id != ? AND status = 'pending'
    """, (app_row["player_id"], action.application_id))
    expired_count = cursor.rowcount

    # Increment player's matches_played
    cursor.execute("UPDATE players SET matches_played = matches_played + 1 WHERE id = ?", (app_row["player_id"],))

    # Send Notification to confirmed player
    cursor.execute("""
    INSERT INTO notifications (
        recipient_id, sender_id, sender_name, match_id, match_title, type, title, message
    ) VALUES (?, ?, ?, ?, ?, 'match_confirmation', ?, ?)
    """, (
        app_row["player_id"], match["creator_id"] or "organizer", match["organizer_name"],
        match_id, match["title"],
        "🎉 Confermato in Squadra!",
        f"Grande notizia! L'organizzatore {match['organizer_name']} ti ha CONFERMATO per '{match['title']}' al {match['field_name']} ({match['match_date']} ore {match['match_time']}). Ci vediamo in campo!"
    ))

    if expired_count > 0:
        cursor.execute("""
        INSERT INTO notifications (
            recipient_id, sender_id, sender_name, match_id, match_title, type, title, message
        ) VALUES (?, 'system', 'Trova l''Ultimo', ?, ?, 'application_expired', ?, ?)
        """, (
            app_row["player_id"], match_id, match["title"],
            "⏱️ Altre candidature chiuse",
            f"Essendo stato confermato per {match['field_name']}, le tue altre {expired_count} candidature pendenti sono state chiuse automaticamente come scadute."
        ))

    conn.commit()
    conn.close()

    return {
        "success": True,
        "message": f"Giocatore {app_row['player_name']} confermato con successo! Posti rimasti: {new_missing}",
        "missing_count": new_missing,
        "is_filled": new_missing == 0
    }

@app.post("/api/matches/{match_id}/decline_player")
def decline_match_player(match_id: int, action: ApplicationAction):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM matches WHERE id = ?", (match_id,))
    match = cursor.fetchone()
    if not match:
        conn.close()
        raise HTTPException(status_code=404, detail="Partita non trovata")

    cursor.execute("SELECT * FROM applications WHERE id = ? AND match_id = ?", (action.application_id, match_id))
    app_row = cursor.fetchone()
    if not app_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Candidatura non trovata")

    cursor.execute("UPDATE applications SET status = 'declined' WHERE id = ?", (action.application_id,))

    cursor.execute("""
    INSERT INTO notifications (
        recipient_id, sender_id, sender_name, match_id, match_title, type, title, message
    ) VALUES (?, ?, ?, ?, ?, 'match_declined', ?, ?)
    """, (
        app_row["player_id"], match["creator_id"] or "organizer", match["organizer_name"],
        match_id, match["title"],
        "Candidatura non accettata",
        f"L'organizzatore di '{match['title']}' ha dovuto rifiutare la tua candidatura (es. slot già coperto o cambio piano). Continua a cercare sul radar!"
    ))

    conn.commit()
    conn.close()

    return {"success": True, "message": "Candidatura rifiutata."}

# ==========================================
# REVIEWS & RELIABILITY ENDPOINTS
# ==========================================
@app.post("/api/reviews")
def create_review(rev: ReviewCreate):
    conn = database.get_db()
    cursor = conn.cursor()

    # Ensure only ONE immutable review per reviewer, match, and target player
    cursor.execute("""
        SELECT id FROM reviews 
        WHERE match_id = ? AND (reviewer_id = ? OR reviewer_name = ?) AND target_player_id = ?
    """, (rev.match_id, rev.reviewer_id or "", rev.reviewer_name, rev.target_player_id))
    if cursor.fetchone():
        conn.close()
        raise HTTPException(
            status_code=400,
            detail="Hai già inviato una valutazione definitiva per questo giocatore in questa partita. La recensione è permanente e non modificabile."
        )

    overall_rating = rev.rating or round((rev.rating_person + rev.rating_skill) / 2)

    cursor.execute("""
    INSERT INTO reviews (
        match_id, match_title, reviewer_id, reviewer_name,
        target_player_id, target_player_name, rating_person, rating_skill,
        rating, reliability_tag, comment,
        discrepancy_type, discrepancy_attributes, discrepancy_details
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        rev.match_id, rev.match_title, rev.reviewer_id or "", rev.reviewer_name,
        rev.target_player_id, rev.target_player_name or "",
        rev.rating_person, rev.rating_skill,
        overall_rating, rev.reliability_tag, rev.comment,
        rev.discrepancy_type or "", json.dumps(rev.discrepancy_attributes or []),
        rev.discrepancy_details or ""
    ))

    # If skill rating is <= 2 or discrepancy advice provided, send constructive notice to player
    if rev.rating_skill <= 2 or rev.discrepancy_type:
        direction_label = "vale di meno rispetto alla scheda (statistiche gonfiate)" if rev.discrepancy_type == "overrated" else ("vale di più rispetto alla scheda (sottovalutato)" if rev.discrepancy_type == "underrated" else "ruolo o caratteristiche da verificare")
        attrs_str = ", ".join(rev.discrepancy_attributes) if rev.discrepancy_attributes else "Ruolo e skill"
        notice_title = f"⚠️ Consiglio Scheda da '{rev.reviewer_name}'"
        notice_msg = f"Dalla partita '{rev.match_title}', l'organizzatore ha segnalato una discrepanza: {direction_label} per quanto riguarda [{attrs_str}]. Dettaglio: \"{rev.discrepancy_details or 'Rivedi i valori nella tua scheda'}\". Ti invitiamo a ricalibrare la tua scheda per mantenere alta la tua affidabilità."

        cursor.execute("""
        INSERT INTO notifications (
            recipient_id, sender_id, sender_name, match_id, match_title,
            type, title, message, discrepancy_type, discrepancy_attributes,
            discrepancy_details, rating_skill, is_read
        ) VALUES (?, ?, ?, ?, ?, 'card_adjustment_advice', ?, ?, ?, ?, ?, ?, 0)
        """, (
            rev.target_player_id, rev.reviewer_id or "organizer", rev.reviewer_name,
            rev.match_id, rev.match_title, notice_title, notice_msg,
            rev.discrepancy_type or "", json.dumps(rev.discrepancy_attributes or []),
            rev.discrepancy_details or "", rev.rating_skill
        ))

    cursor.execute("""
        SELECT rating_person, rating_skill, rating, reliability_tag 
        FROM reviews WHERE target_player_id = ?
    """, (rev.target_player_id,))
    reviews = cursor.fetchall()
    total_reviews = len(reviews)

    if total_reviews > 0:
        avg_person = round(sum((r["rating_person"] or r["rating"] or 5) for r in reviews) / total_reviews, 1)
        avg_skill = round(sum((r["rating_skill"] or r["rating"] or 5) for r in reviews) / total_reviews, 1)

        negative_tags = ["Ha dato buca all'ultimo ⚠️", "Pacco ⚠️", "In ritardo di 30 min ⏱️", "Scheda Gonfiata 🧢", "Ritardatario cronico ⚠️"]
        neg_count = sum(1 for r in reviews if any(nt in (r["reliability_tag"] or "") for nt in negative_tags))
        reliability_pct = max(40, min(100, int(((total_reviews - neg_count) / total_reviews) * 100)))

        cursor.execute("""
        UPDATE players SET
            fair_play_rating = ?,
            card_accuracy_rating = ?,
            reliability_score = ?
        WHERE id = ?
        """, (avg_person, avg_skill, reliability_pct, rev.target_player_id))

    conn.commit()
    conn.close()

    return {"success": True, "message": "Recensione registrata e feedback inviato al giocatore!"}

@app.get("/api/notifications")
def get_user_notifications(user_id: str):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT u.id, u.username, u.full_name, ('user_' || u.id) as user_player_id
        FROM users u
        WHERE u.username = ? OR ('user_' || u.id) = ? OR CAST(u.id AS TEXT) = ? OR LOWER(u.full_name) = LOWER(?)
    """, (user_id, user_id, user_id, user_id))
    user_row = cursor.fetchone()
    valid_ids = [user_id]
    if user_row:
        valid_ids.extend([
            user_row["username"],
            user_row["full_name"],
            user_row["user_player_id"],
            str(user_row["id"])
        ])
    valid_ids = list(set([v for v in valid_ids if v]))
    q_marks = ",".join("?" for _ in valid_ids)

    # Check for concluded matches that need player review and create reminder notification if missing
    try:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
        cursor.execute(f"""
            SELECT * FROM matches 
            WHERE creator_id IN ({q_marks}) OR creator_username IN ({q_marks}) OR organizer_name IN ({q_marks})
        """, valid_ids * 3)
        user_matches = [dict(m) for m in cursor.fetchall()]
        for m in user_matches:
            end_t = m.get("end_time") or m.get("match_time") or "23:59"
            match_end = f"{m['match_date']} {end_t}"
            is_ended = match_end <= now_str or m.get("status") in ["filled", "finished", "completed"]
            if is_ended:
                try:
                    confirmed = json.loads(m.get("confirmed_players") or "[]")
                except Exception:
                    confirmed = []
                has_unreviewed = False
                for cp in confirmed:
                    p_id = cp.get("player_id")
                    if not p_id or p_id in valid_ids:
                        continue
                    cursor.execute(f"""
                        SELECT id FROM reviews 
                        WHERE match_id = ? AND (reviewer_id IN ({q_marks}) OR reviewer_name IN ({q_marks})) AND target_player_id = ?
                    """, [m["id"]] + valid_ids + valid_ids + [p_id])
                    if not cursor.fetchone():
                        has_unreviewed = True
                        break
                if has_unreviewed:
                    # Check if reminder already sent for this match
                    cursor.execute(f"""
                        SELECT id FROM notifications
                        WHERE recipient_id IN ({q_marks}) AND match_id = ? AND type = 'match_review_reminder'
                    """, valid_ids + [m["id"]])
                    if not cursor.fetchone():
                        cursor.execute("""
                            INSERT INTO notifications (
                                recipient_id, sender_id, sender_name, match_id, match_title, type, title, message, created_at
                            ) VALUES (?, 'system', 'Trova l''Ultimo', ?, ?, 'match_review_reminder', ?, ?, ?)
                        """, (
                            user_id, m["id"], m["title"],
                            f"⭐ Valuta i giocatori: {m['title']}",
                            f"La partita al {m['field_name']} si è conclusa! Lascia la tua recensione sui compagni per confermare o calibrare le loro schede.",
                            datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        ))
                        conn.commit()
    except Exception as e:
        print("Review reminder notification check error:", e)

    cursor.execute(f"""
        SELECT * FROM notifications
        WHERE recipient_id IN ({q_marks})
        ORDER BY created_at DESC
        LIMIT 30
    """, valid_ids)
    notifications = [dict(n) for n in cursor.fetchall()]

    cursor.execute(f"""
        SELECT COUNT(*) FROM notifications
        WHERE recipient_id IN ({q_marks}) AND is_read = 0
    """, valid_ids)
    unread_count = cursor.fetchone()[0]

    conn.close()
    return {"notifications": notifications, "unread_count": unread_count}

@app.post("/api/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE notifications SET is_read = 1 WHERE id = ?", (notification_id,))
    conn.commit()
    conn.close()
    return {"success": True}

@app.post("/api/notifications/read_all")
def mark_all_notifications_read(data: dict = Body(...)):
    user_id = data.get("user_id")
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id richiesto")
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.username, u.full_name, ('user_' || u.id) as user_player_id
        FROM users u
        WHERE u.username = ? OR ('user_' || u.id) = ? OR CAST(u.id AS TEXT) = ? OR LOWER(u.full_name) = LOWER(?)
    """, (user_id, user_id, user_id, user_id))
    user_row = cursor.fetchone()
    valid_ids = [user_id]
    if user_row:
        valid_ids.extend([
            user_row["username"],
            user_row["full_name"],
            user_row["user_player_id"],
            str(user_row["id"])
        ])
    valid_ids = list(set([v for v in valid_ids if v]))
    q_marks = ",".join("?" for _ in valid_ids)
    cursor.execute(f"UPDATE notifications SET is_read = 1 WHERE recipient_id IN ({q_marks})", valid_ids)
    conn.commit()
    conn.close()
    return {"success": True}

@app.get("/api/players/{player_id}")
def get_player_details(player_id: str):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM players WHERE id = ? OR name = ?", (player_id, player_id))
    p = cursor.fetchone()
    if not p:
        cursor.execute("SELECT * FROM users WHERE username = ? OR ('user_' || id) = ?", (player_id, player_id))
        u = cursor.fetchone()
        if u:
            cursor.execute("SELECT * FROM players WHERE id = ? OR name = ?", (f"user_{u['id']}", u["full_name"]))
            p = cursor.fetchone()
    conn.close()
    if not p:
        raise HTTPException(status_code=404, detail="Giocatore non trovato")
    p_dict = dict(p)
    p_dict["secondary_roles"] = json.loads(p_dict["secondary_roles"]) if p_dict.get("secondary_roles") else []
    p_dict["badges"] = json.loads(p_dict["badges"]) if p_dict.get("badges") else []
    return p_dict

@app.get("/api/reviews/pending")
def get_pending_reviews(user_id: Optional[str] = None):
    if not user_id:
        return {"pending_reviews": []}
    conn = database.get_db()
    cursor = conn.cursor()

    # Resolve all potential aliases for the user (username, full_name, user_<id>, id)
    cursor.execute("""
        SELECT u.id, u.username, u.full_name, ('user_' || u.id) as user_player_id
        FROM users u
        WHERE u.username = ? OR ('user_' || u.id) = ? OR CAST(u.id AS TEXT) = ? OR LOWER(u.full_name) = LOWER(?)
    """, (user_id, user_id, user_id, user_id))
    user_row = cursor.fetchone()
    valid_ids = [user_id]
    if user_row:
        valid_ids.extend([
            user_row["username"],
            user_row["full_name"],
            user_row["user_player_id"],
            str(user_row["id"])
        ])
    valid_ids = list(set([v for v in valid_ids if v]))
    q_marks = ",".join("?" for _ in valid_ids)

    # Find matches created by this user
    cursor.execute(f"""
        SELECT * FROM matches 
        WHERE creator_id IN ({q_marks}) OR creator_username IN ({q_marks}) OR organizer_name IN ({q_marks})
        ORDER BY match_date DESC, match_time DESC
    """, valid_ids * 3)
    matches = [dict(m) for m in cursor.fetchall()]

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    pending = []

    for m in matches:
        end_t = m.get("end_time") or m.get("match_time") or "23:59"
        match_end = f"{m['match_date']} {end_t}"
        # A match is eligible for post-match review if its scheduled end time has passed or status is filled/finished
        is_ended = match_end <= now_str or m.get("status") in ["filled", "finished"]
        if is_ended:
            try:
                confirmed = json.loads(m.get("confirmed_players") or "[]")
            except Exception:
                confirmed = []
            for cp in confirmed:
                p_id = cp.get("player_id")
                # Do not review oneself
                if not p_id or p_id in valid_ids:
                    continue
                # Check if this player was already reviewed by this user for this match
                cursor.execute(f"""
                    SELECT id FROM reviews 
                    WHERE match_id = ? AND (reviewer_id IN ({q_marks}) OR reviewer_name IN ({q_marks})) AND target_player_id = ?
                """, [m["id"]] + valid_ids + valid_ids + [p_id])
                if not cursor.fetchone():
                    pending.append({
                        "match_id": m["id"],
                        "match_title": m["title"],
                        "match_date": m["match_date"],
                        "match_time": m["match_time"],
                        "end_time": end_t,
                        "target_player_id": p_id,
                        "target_player_name": cp.get("player_name") or cp.get("name") or "Giocatore",
                        "target_player_role": cp.get("player_role") or cp.get("role") or "Giocatore",
                        "target_player_ovr": cp.get("player_ovr") or 80,
                        "target_player_phone": cp.get("player_phone") or ""
                    })

    conn.close()
    return {"pending_reviews": pending}

@app.get("/api/reviews/{player_id}")
def get_player_reviews(player_id: str):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reviews WHERE target_player_id = ? ORDER BY created_at DESC", (player_id,))
    rows = cursor.fetchall()
    conn.close()
    return {"reviews": [dict(r) for r in rows], "count": len(rows)}

@app.get("/api/players/{player_id}/history")
def get_player_history(player_id: str):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT u.id, u.username, u.full_name, ('user_' || u.id) as user_player_id
        FROM users u
        WHERE u.username = ? OR ('user_' || u.id) = ? OR CAST(u.id AS TEXT) = ? OR LOWER(u.full_name) = LOWER(?)
    """, (player_id, player_id, player_id, player_id))
    user_row = cursor.fetchone()
    valid_ids = [player_id]
    if user_row:
        valid_ids.extend([
            user_row["username"],
            user_row["full_name"],
            user_row["user_player_id"],
            str(user_row["id"])
        ])
    valid_ids = list(set([v for v in valid_ids if v]))
    q_marks = ",".join("?" for _ in valid_ids)

    cursor.execute("SELECT * FROM matches ORDER BY match_date DESC, match_time DESC")
    all_matches = [dict(m) for m in cursor.fetchall()]

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    history = []

    for m in all_matches:
        end_t = m.get("end_time") or m.get("match_time") or "23:59"
        match_end = f"{m['match_date']} {end_t}"
        is_ended = match_end <= now_str or m.get("status") in ["finished", "concluded"]
        if not is_ended:
            continue

        try:
            confirmed = json.loads(m.get("confirmed_players") or "[]")
        except Exception:
            confirmed = []

        is_creator = (
            (m.get("creator_id") and m["creator_id"] in valid_ids) or
            (m.get("creator_username") and m["creator_username"] in valid_ids) or
            (m.get("organizer_name") and m["organizer_name"] in valid_ids)
        )

        user_confirmed = None
        for cp in confirmed:
            cp_id = cp.get("player_id")
            cp_name = cp.get("player_name") or cp.get("name")
            if (cp_id and cp_id in valid_ids) or (cp_name and cp_name in valid_ids):
                user_confirmed = cp
                break

        if is_creator or user_confirmed:
            user_role = "👑 Organizzatore" if is_creator else f"⚽ Confermato ({user_confirmed.get('player_role') or 'In campo'})"

            unreviewed_count = 0
            if is_creator:
                for cp in confirmed:
                    p_id = cp.get("player_id")
                    if not p_id or p_id in valid_ids:
                        continue
                    cursor.execute(f"""
                        SELECT id FROM reviews 
                        WHERE match_id = ? AND (reviewer_id IN ({q_marks}) OR reviewer_name IN ({q_marks})) AND target_player_id = ?
                    """, [m["id"]] + valid_ids + valid_ids + [p_id])
                    if not cursor.fetchone():
                        unreviewed_count += 1

            history.append({
                "match_id": m["id"],
                "title": m["title"],
                "format": m["format"],
                "field_name": m["field_name"],
                "address": m["address"],
                "city": m["city"],
                "match_date": m["match_date"],
                "match_time": m["match_time"],
                "end_time": end_t,
                "price_per_player": m["price_per_player"],
                "is_creator": is_creator,
                "user_role": user_role,
                "confirmed_players_count": len(confirmed),
                "unreviewed_count": unreviewed_count,
                "status": "concluded"
            })

    # Sync real count of concluded matches in players table
    real_count = len(history)
    for p_ident in valid_ids:
        cursor.execute("UPDATE players SET matches_played = ? WHERE id = ? OR name = ?", (real_count, p_ident, p_ident))

    conn.commit()
    conn.close()
    return {"history": history, "count": len(history)}

# ==========================================
# PROFILE & PLAYERS ENDPOINTS
# ==========================================
@app.get("/api/profile")
def get_user_profile(player_id: Optional[str] = "my_profile"):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM players WHERE id = ?", (player_id,))
    row = cursor.fetchone()
    if not row and player_id != "my_profile":
        cursor.execute("SELECT * FROM players WHERE id = 'my_profile'")
        row = cursor.fetchone()

    if not row:
        conn.close()
        return {
            "id": player_id or "my_profile",
            "name": "",
            "nickname": "",
            "photo_url": "/static/avatars/bomber.svg",
            "age": 25,
            "foot": "Destro",
            "primary_role": "Centrocampista",
            "secondary_roles": [],
            "city": "",
            "bio": "",
            "phone": "",
            "stats_vel": 75,
            "stats_tir": 75,
            "stats_pas": 75,
            "stats_dri": 75,
            "stats_dif": 75,
            "stats_fis": 75,
            "ovr": 75,
            "card_theme": "gold",
            "badges": [],
            "is_available": 1,
            "matches_played": 0,
            "mvp_count": 0,
            "fair_play_rating": 5.0,
            "card_accuracy_rating": 5.0,
            "reliability_score": 100,
            "recent_reviews": []
        }

    profile = dict(row)
    if "andrea" in profile.get("name", "").lower() or profile.get("id") == "my_profile":
        if "ferri" in profile.get("name", "").lower():
            profile["name"] = ""
            profile["nickname"] = ""
        if profile.get("city") == "Milano" and profile.get("id") == "my_profile":
            profile["city"] = ""
        if profile.get("phone") == "+39 347 1234567":
            profile["phone"] = ""

    if not profile.get("photo_url"):
        profile["photo_url"] = "/static/avatars/bomber.svg"

    profile["secondary_roles"] = json.loads(profile["secondary_roles"]) if profile["secondary_roles"] else []
    profile["badges"] = json.loads(profile["badges"]) if profile["badges"] else []

    cursor.execute("SELECT * FROM reviews WHERE target_player_id = ? ORDER BY created_at DESC LIMIT 5", (profile["id"],))
    profile["recent_reviews"] = [dict(r) for r in cursor.fetchall()]

    # Follower count
    cursor.execute("SELECT COUNT(*) FROM follows WHERE followed_id = ? OR followed_id = ?", (profile["id"], profile.get("nickname", "").replace("@", "")))
    f_cnt = cursor.fetchone()
    profile["followers_count"] = f_cnt[0] if f_cnt else 0

    conn.close()
    return profile

@app.post("/api/profile")
def update_user_profile(p: PlayerProfileUpdate, player_id: Optional[str] = "my_profile"):
    conn = database.get_db()
    cursor = conn.cursor()

    if p.primary_role == "Portiere":
        calculated_ovr = int(p.stats_dif * 0.4 + p.stats_fis * 0.3 + p.stats_pas * 0.2 + p.stats_vel * 0.1)
    elif p.primary_role in ["Attaccante", "Punta"]:
        calculated_ovr = int(p.stats_tir * 0.4 + p.stats_vel * 0.25 + p.stats_dri * 0.2 + p.stats_fis * 0.15)
    elif p.primary_role in ["Difensore", "Terzino"]:
        calculated_ovr = int(p.stats_dif * 0.4 + p.stats_fis * 0.3 + p.stats_vel * 0.15 + p.stats_pas * 0.15)
    else:
        calculated_ovr = int((p.stats_vel + p.stats_tir + p.stats_pas + p.stats_dri + p.stats_dif + p.stats_fis) / 6)

    final_ovr = max(50, min(99, calculated_ovr))

    cursor.execute("""
    UPDATE players SET
        name = ?, nickname = ?, photo_url = ?, age = ?, foot = ?,
        primary_role = ?, secondary_roles = ?, city = ?, bio = ?, phone = ?,
        stats_vel = ?, stats_tir = ?, stats_pas = ?, stats_dri = ?, stats_dif = ?, stats_fis = ?,
        ovr = ?, card_theme = ?, badges = ?, is_available = ?
    WHERE id = ?
    """, (
        p.name, p.nickname, p.photo_url, p.age, p.foot,
        p.primary_role, json.dumps(p.secondary_roles), p.city, p.bio, p.phone,
        p.stats_vel, p.stats_tir, p.stats_pas, p.stats_dri, p.stats_dif, p.stats_fis,
        final_ovr, p.card_theme, json.dumps(p.badges), p.is_available, player_id
    ))

    if cursor.rowcount == 0:
        cursor.execute("""
        INSERT INTO players (
            id, name, nickname, photo_url, age, foot, primary_role, secondary_roles,
            city, bio, phone, stats_vel, stats_tir, stats_pas, stats_dri, stats_dif, stats_fis,
            ovr, card_theme, badges, is_available, matches_played, mvp_count, fair_play_rating, card_accuracy_rating, reliability_score
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, 0, 0, 5.0, 5.0, 100
        )
        """, (
            player_id, p.name, p.nickname, p.photo_url, p.age, p.foot,
            p.primary_role, json.dumps(p.secondary_roles), p.city, p.bio, p.phone,
            p.stats_vel, p.stats_tir, p.stats_pas, p.stats_dri, p.stats_dif, p.stats_fis,
            final_ovr, p.card_theme, json.dumps(p.badges), p.is_available
        ))

    conn.commit()
    conn.close()

    return {"success": True, "message": "Scheda giocatore aggiornata!", "ovr": final_ovr}

@app.get("/api/players")
def get_players():
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM players ORDER BY ovr DESC")
    rows = cursor.fetchall()
    players = []
    for r in rows:
        p = dict(r)
        p["secondary_roles"] = json.loads(p["secondary_roles"]) if p["secondary_roles"] else []
        p["badges"] = json.loads(p["badges"]) if p["badges"] else []
        players.append(p)
    conn.close()
    return {"players": players}

# ==========================================
# SOCIAL & FOLLOWS & PLAYER SEARCH ENDPOINTS
# ==========================================
class FollowRequest(BaseModel):
    follower_id: str

@app.get("/api/search/players")
@app.get("/api/players-search")
def search_players(q: Optional[str] = "", viewer_id: Optional[str] = None):
    # L'accesso con un account registrato è obbligatorio per cercare i membri
    if not viewer_id or not viewer_id.strip():
        raise HTTPException(status_code=401, detail="Devi avere un account ed effettuare l'accesso per cercare i giocatori.")

    cleaned_viewer = viewer_id.strip()
    conn = database.get_db()
    cursor = conn.cursor()

    # Verifica validità dell'account richiedente
    cursor.execute("""
        SELECT 1 FROM users WHERE username = ? OR ('user_' || id) = ? OR CAST(id AS TEXT) = ?
        UNION
        SELECT 1 FROM players WHERE id = ?
        LIMIT 1
    """, (cleaned_viewer, cleaned_viewer, cleaned_viewer, cleaned_viewer))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=401, detail="Account non riconosciuto. Effettua l'accesso per cercare i giocatori.")

    trimmed = q.strip() if q else ""
    # Se il campo di ricerca è vuoto, non restituire alcuna lista di giocatori
    if not trimmed:
        conn.close()
        return {"players": []}

    query_str = f"%{trimmed.lower()}%"

    cursor.execute("""
    SELECT 
        p.*,
        u.username as linked_username,
        u.full_name as linked_full_name,
        (SELECT COUNT(*) FROM follows WHERE followed_id = p.id OR (u.username IS NOT NULL AND followed_id = u.username)) as followers_count
    FROM players p
    LEFT JOIN users u ON (p.id = 'user_' || u.id OR p.id = u.username OR p.name = u.full_name)
    WHERE 
        LOWER(p.name) LIKE ? 
        OR LOWER(COALESCE(p.nickname, '')) LIKE ? 
        OR LOWER(COALESCE(u.username, '')) LIKE ?
        OR LOWER(COALESCE(u.full_name, '')) LIKE ?
        OR LOWER(COALESCE(p.city, '')) LIKE ?
    ORDER BY followers_count DESC, p.ovr DESC
    LIMIT 30
    """, (query_str, query_str, query_str, query_str, query_str))

    rows = cursor.fetchall()
    results = []

    following_ids = set()
    if viewer_id:
        cursor.execute("SELECT followed_id FROM follows WHERE follower_id = ?", (viewer_id,))
        following_ids = {r[0] for r in cursor.fetchall()}

    for r in rows:
        p = dict(r)
        p["secondary_roles"] = json.loads(p["secondary_roles"]) if p.get("secondary_roles") else []
        p["badges"] = json.loads(p["badges"]) if p.get("badges") else []
        pid = p["id"]
        p["is_following"] = pid in following_ids or (p.get("linked_username") and p["linked_username"] in following_ids)
        if not p.get("linked_username") and p.get("nickname"):
            p["linked_username"] = p["nickname"].replace("@", "")
        results.append(p)

    conn.close()
    return {"players": results}

@app.post("/api/players/{player_id}/toggle-follow")
def toggle_follow_player(player_id: str, req: FollowRequest):
    follower_id = req.follower_id.strip()
    if not follower_id:
        raise HTTPException(status_code=400, detail="Devi aver effettuato l'accesso per seguire un giocatore.")
    if follower_id == player_id:
        raise HTTPException(status_code=400, detail="Non puoi seguire te stesso.")

    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM follows WHERE follower_id = ? AND followed_id = ?", (follower_id, player_id))
    existing = cursor.fetchone()

    if existing:
        cursor.execute("DELETE FROM follows WHERE follower_id = ? AND followed_id = ?", (follower_id, player_id))
        is_following = False
    else:
        cursor.execute("INSERT OR IGNORE INTO follows (follower_id, followed_id) VALUES (?, ?)", (follower_id, player_id))
        is_following = True

    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM follows WHERE followed_id = ?", (player_id,))
    cnt_row = cursor.fetchone()
    followers_count = cnt_row[0] if cnt_row else 0

    conn.close()
    return {
        "success": True,
        "is_following": is_following,
        "followers_count": followers_count,
        "message": "Ora segui questo giocatore!" if is_following else "Non segui più questo giocatore."
    }

@app.get("/api/card/player/{player_id}")
@app.get("/api/players/{player_id}/card")
def get_player_full_card(player_id: str, viewer_id: Optional[str] = None):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT 
        p.*,
        u.username as linked_username,
        u.full_name as linked_full_name,
        (SELECT COUNT(*) FROM follows WHERE followed_id = p.id OR (u.username IS NOT NULL AND followed_id = u.username)) as followers_count
    FROM players p
    LEFT JOIN users u ON (p.id = 'user_' || u.id OR p.id = u.username OR p.name = u.full_name)
    WHERE p.id = ? OR p.name = ? OR (u.username IS NOT NULL AND u.username = ?)
    LIMIT 1
    """, (player_id, player_id, player_id))

    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Giocatore non trovato")

    p = dict(row)
    p["secondary_roles"] = json.loads(p["secondary_roles"]) if p.get("secondary_roles") else []
    p["badges"] = json.loads(p["badges"]) if p.get("badges") else []

    is_following = False
    if viewer_id:
        cursor.execute("SELECT id FROM follows WHERE follower_id = ? AND (followed_id = ? OR followed_id = ?)", (viewer_id, p["id"], p.get("linked_username", "")))
        is_following = bool(cursor.fetchone())
    p["is_following"] = is_following

    cursor.execute("SELECT * FROM reviews WHERE target_player_id = ? ORDER BY created_at DESC LIMIT 5", (p["id"],))
    p["recent_reviews"] = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return p
# ==========================================
@app.get("/api/admin/overview")
def admin_overview():
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM matches ORDER BY created_at DESC")
    matches = [dict(m) for m in cursor.fetchall()]

    cursor.execute("SELECT * FROM reviews ORDER BY created_at DESC")
    reviews = [dict(r) for r in cursor.fetchall()]

    cursor.execute("""
        SELECT 
            u.id, u.username, u.email, u.full_name, u.phone, u.is_admin, u.created_at,
            COALESCE(p.photo_url, '/static/avatars/bomber.svg') as photo_url,
            COALESCE(p.primary_role, 'Centrocampista') as primary_role,
            COALESCE(p.city, 'Milano') as city,
            COALESCE(p.ovr, 75) as ovr,
            COALESCE(p.reliability_score, 100) as reliability_score,
            COALESCE(p.fair_play_rating, 5.0) as fair_play_rating,
            COALESCE(p.card_accuracy_rating, 5.0) as card_accuracy_rating,
            COALESCE(p.matches_played, 0) as matches_played
        FROM users u
        LEFT JOIN players p ON p.id = 'user_' || u.id OR p.name = u.full_name
        ORDER BY u.created_at DESC
    """)
    users = [dict(u) for u in cursor.fetchall()]

    cursor.execute("SELECT key, value FROM app_settings")
    settings = {row["key"]: row["value"] for row in cursor.fetchall()}

    conn.close()
    return {
        "matches": matches,
        "reviews": reviews,
        "users": users,
        "settings": settings,
        "total_matches": len(matches),
        "total_reviews": len(reviews),
        "total_users": len(users)
    }

@app.delete("/api/admin/matches/{match_id}")
def admin_delete_match(match_id: int):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM applications WHERE match_id = ?", (match_id,))
    cursor.execute("DELETE FROM matches WHERE id = ?", (match_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Partita #{match_id} rimossa con successo dall'Admin!"}

@app.delete("/api/admin/reviews/{review_id}")
def admin_delete_review(review_id: int):
    conn = database.get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM reviews WHERE id = ?", (review_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": f"Recensione #{review_id} rimossa con successo!"}

@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: int):
    conn = database.get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    u = cursor.fetchone()
    if not u:
        conn.close()
        raise HTTPException(status_code=404, detail="Utente non trovato.")
    
    if u["is_admin"]:
        conn.close()
        raise HTTPException(status_code=400, detail="Impossibile eliminare l'account Amministratore.")

    player_id = f"user_{user_id}"
    username = u["username"]
    full_name = u["full_name"]

    # Delete related records for this user
    cursor.execute("DELETE FROM players WHERE id = ? OR id = ? OR name = ?", (player_id, username, full_name))
    cursor.execute("DELETE FROM availabilities WHERE player_id = ? OR player_id = ?", (player_id, username))
    cursor.execute("DELETE FROM applications WHERE player_id = ? OR player_id = ?", (player_id, username))
    cursor.execute("DELETE FROM reviews WHERE target_player_id = ? OR target_player_id = ? OR reviewer_id = ? OR reviewer_id = ?", (player_id, username, player_id, username))
    cursor.execute("DELETE FROM notifications WHERE recipient_id = ? OR recipient_id = ? OR sender_id = ? OR sender_id = ?", (player_id, username, player_id, username))
    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))

    conn.commit()
    conn.close()
    return {"success": True, "message": f"Utente '{full_name}' (@{username}) eliminato con successo!"}

@app.post("/api/admin/settings")
def admin_update_settings(settings: SettingsUpdate):
    conn = database.get_db()
    cursor = conn.cursor()

    if settings.broadcast_alert is not None:
        cursor.execute("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('broadcast_alert', ?)", (settings.broadcast_alert,))
    if settings.emergency_threshold_hours is not None:
        cursor.execute("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('emergency_threshold_hours', ?)", (settings.emergency_threshold_hours,))
    if settings.allowed_formats is not None:
        cursor.execute("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('allowed_formats', ?)", (settings.allowed_formats,))
    if settings.active_cities is not None:
        cursor.execute("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('active_cities', ?)", (settings.active_cities,))

    conn.commit()
    conn.close()
    return {"success": True, "message": "Impostazioni della piattaforma salvate con successo!"}

# Serve static frontend files (resilient to both static/ subfolder and root flat files)
BASE_DIR = os.path.dirname(__file__)

@app.get("/")
def read_root():
    for candidate in [os.path.join(STATIC_DIR, "index.html"), os.path.join(BASE_DIR, "index.html")]:
        if os.path.isfile(candidate):
            return FileResponse(candidate)
    return {"message": "Trova l'Ultimo running"}

@app.get("/manifest.json")
def serve_manifest():
    for candidate in [os.path.join(STATIC_DIR, "manifest.json"), os.path.join(BASE_DIR, "manifest.json")]:
        if os.path.isfile(candidate):
            return FileResponse(candidate)
    raise HTTPException(status_code=404)

@app.get("/sw.js")
def serve_sw():
    for candidate in [os.path.join(STATIC_DIR, "sw.js"), os.path.join(BASE_DIR, "sw.js")]:
        if os.path.isfile(candidate):
            return FileResponse(candidate, media_type="application/javascript")
    raise HTTPException(status_code=404)

@app.get("/static/{file_path:path}")
def serve_static_file(file_path: str):
    candidates = [
        os.path.join(STATIC_DIR, file_path),
        os.path.join(BASE_DIR, file_path),
        os.path.join(BASE_DIR, os.path.basename(file_path))
    ]
    for c in candidates:
        if os.path.isfile(c):
            return FileResponse(c)
    raise HTTPException(status_code=404, detail="File non trovato")

if os.path.isdir(STATIC_DIR) and any(os.scandir(STATIC_DIR)):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

