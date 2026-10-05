import sqlite3
import json
import os
import hashlib
from datetime import datetime, timedelta

DEFAULT_TURSO_URL = "https://trova-lultimo-tommasocarreraoo5-rgb.aws-eu-west-1.turso.io"
DEFAULT_TURSO_TOKEN = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTEyMTcyMjIsImlkIjoiMDFhMTBjZGMtZTIwMS03OTI1LTlhNjEtYTg1NjBkNzNiNTVkIiwia2lkIjoiSllIb2tEOWNxLVFDUGx2UHp4Vzl0UF85WlI4Sm93MXpsT21CRVR4MW00RSIsInJpZCI6IjRhYmY0YmQ3LWY4NTMtNGU2ZC04OTBiLTc0ZTVjNjlkN2YyYyJ9.iBzkMVLlu0fT3iPN2m9_S0ucXvIohC1ODzMnrYYv2wP05AVhSVnO7bmLqwOaaRXRGQhcPGt3wSYrV373otfPDQ"

TURSO_DATABASE_URL = os.environ.get("TURSO_DATABASE_URL", DEFAULT_TURSO_URL)
TURSO_AUTH_TOKEN = os.environ.get("TURSO_AUTH_TOKEN", DEFAULT_TURSO_TOKEN)

class TursoRow:
    def __init__(self, cols, vals):
        self._d = dict(zip(cols, vals))
        self._v = list(vals)
    def __getitem__(self, k):
        if isinstance(k, str):
            return self._d[k]
        return self._v[k]
    def get(self, k, default=None):
        return self._d.get(k, default)
    def keys(self):
        return self._d.keys()
    def values(self):
        return self._d.values()
    def items(self):
        return self._d.items()
    def __iter__(self):
        return iter(self._d.keys())
    def __contains__(self, k):
        return k in self._d
    def __len__(self):
        return len(self._v)
    def __repr__(self):
        return f"<TursoRow {self._d}>"

class TursoCursor:
    def __init__(self, client):
        self._client = client
        self._rows = []
        self._pos = 0
        self.lastrowid = None
        self.rowcount = 0

    def execute(self, sql, params=None):
        if params is None:
            params = []
        elif isinstance(params, (tuple, list)):
            params = list(params)
        else:
            params = [params]
        res = self._client.execute(sql, params)
        self.lastrowid = getattr(res, "last_insert_rowid", None)
        self.rowcount = getattr(res, "rows_affected", 0)
        cols = getattr(res, "columns", ())
        raw_rows = getattr(res, "rows", [])
        self._rows = [TursoRow(cols, r) for r in raw_rows]
        self._pos = 0
        return self

    def executemany(self, sql, seq_of_params):
        for p in seq_of_params:
            self.execute(sql, p)
        return self

    def fetchone(self):
        if self._pos < len(self._rows):
            r = self._rows[self._pos]
            self._pos += 1
            return r
        return None

    def fetchall(self):
        res = self._rows[self._pos:]
        self._pos = len(self._rows)
        return res

class TursoConnection:
    def __init__(self, url, token):
        import libsql_client
        clean_url = url
        if clean_url.startswith("libsql://"):
            clean_url = "https://" + clean_url[len("libsql://"):]
        self._client = libsql_client.create_client_sync(url=clean_url, auth_token=token)
        self.row_factory = None

    def cursor(self):
        return TursoCursor(self._client)

    def execute(self, sql, params=None):
        cur = self.cursor()
        return cur.execute(sql, params)

    def commit(self):
        pass

    def rollback(self):
        pass

    def close(self):
        try:
            self._client.close()
        except Exception:
            pass

DB_PATH = os.path.join(os.path.dirname(__file__), "data", "trova_ultimo.db")

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def get_db():
    if TURSO_DATABASE_URL and TURSO_AUTH_TOKEN:
        try:
            return TursoConnection(TURSO_DATABASE_URL, TURSO_AUTH_TOKEN)
        except Exception as e:
            print("Turso connection warning, falling back to SQLite:", e)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    cursor = conn.cursor()

    # Matches table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS matches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        format TEXT NOT NULL, -- '5', '6', '7'
        field_name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        maps_url TEXT,
        match_date TEXT NOT NULL, -- YYYY-MM-DD
        match_time TEXT NOT NULL, -- HH:MM
        end_time TEXT DEFAULT '',
        deadline_time TEXT DEFAULT '',
        duration_min INTEGER DEFAULT 60,
        price_per_player TEXT DEFAULT '8€',
        pitch_type TEXT DEFAULT 'Sintetico 4G',
        missing_count INTEGER DEFAULT 1,
        roles_needed TEXT NOT NULL, -- JSON array of strings e.g. ["Portiere", "Difensore"]
        level TEXT DEFAULT 'Amatoriale con grinta',
        notes TEXT,
        organizer_name TEXT NOT NULL,
        organizer_phone TEXT NOT NULL,
        status TEXT DEFAULT 'open', -- 'open', 'filled', 'cancelled'
        confirmed_players TEXT, -- JSON array of objects
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Players table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        nickname TEXT,
        photo_url TEXT,
        age INTEGER DEFAULT 25,
        foot TEXT DEFAULT 'Destro',
        primary_role TEXT NOT NULL,
        secondary_roles TEXT, -- JSON array
        city TEXT DEFAULT '',
        bio TEXT,
        phone TEXT,
        stats_vel INTEGER DEFAULT 75,
        stats_tir INTEGER DEFAULT 70,
        stats_pas INTEGER DEFAULT 72,
        stats_dri INTEGER DEFAULT 74,
        stats_dif INTEGER DEFAULT 68,
        stats_fis INTEGER DEFAULT 78,
        ovr INTEGER DEFAULT 75,
        card_theme TEXT DEFAULT 'gold', -- 'gold', 'icon', 'emerald', 'neon', 'panini'
        badges TEXT, -- JSON array
        is_available INTEGER DEFAULT 1,
        matches_played INTEGER DEFAULT 0,
        mvp_count INTEGER DEFAULT 0,
        fair_play_rating REAL DEFAULT 5.0,
        reliability_score INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Applications table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER NOT NULL,
        player_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        player_role TEXT NOT NULL,
        player_phone TEXT NOT NULL,
        player_ovr INTEGER DEFAULT 75,
        message TEXT,
        status TEXT DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (match_id) REFERENCES matches (id)
    )
    """)

    # Users Table for Auth
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT NOT NULL,
        phone TEXT DEFAULT '',
        is_admin INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Post-Match Reviews & Reliability Feedback Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        match_id INTEGER,
        match_title TEXT,
        reviewer_name TEXT NOT NULL,
        target_player_id TEXT NOT NULL,
        rating INTEGER NOT NULL,
        reliability_tag TEXT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # App Settings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

    # Player Availabilities / Scouting Instances Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS availabilities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        player_ovr INTEGER DEFAULT 75,
        photo_url TEXT,
        primary_role TEXT NOT NULL,
        city TEXT NOT NULL,
        zone TEXT NOT NULL,
        available_date TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        preferred_format TEXT DEFAULT '5, 6 o 7',
        notes TEXT,
        status TEXT DEFAULT 'active', -- 'active', 'booked', 'expired'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # In-App Scouting Messages Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        availability_id INTEGER,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        recipient_id TEXT NOT NULL,
        recipient_name TEXT NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # User notifications table (e.g. card adjustment feedback, scouting alerts)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        match_id INTEGER,
        match_title TEXT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        discrepancy_type TEXT DEFAULT '',
        discrepancy_attributes TEXT DEFAULT '[]',
        discrepancy_details TEXT DEFAULT '',
        rating_skill INTEGER DEFAULT 5,
        is_read INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Follows Table (Social feature)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS follows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        follower_id TEXT NOT NULL,
        followed_id TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(follower_id, followed_id)
    )
    """)
    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_follows_followed ON follows(followed_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)")
    except Exception:
        pass

    # Add columns if migrating existing DB
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE matches ADD COLUMN latitude REAL")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE matches ADD COLUMN longitude REAL")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE matches ADD COLUMN maps_url TEXT")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE matches ADD COLUMN end_time TEXT DEFAULT ''")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE matches ADD COLUMN deadline_time TEXT DEFAULT ''")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE matches ADD COLUMN creator_id TEXT DEFAULT ''")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE matches ADD COLUMN creator_username TEXT DEFAULT ''")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE matches ADD COLUMN organizer_role TEXT DEFAULT 'Centrocampista'")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE reviews ADD COLUMN reviewer_id TEXT DEFAULT ''")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE reviews ADD COLUMN target_player_name TEXT DEFAULT ''")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE reviews ADD COLUMN rating_person INTEGER DEFAULT 5")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE reviews ADD COLUMN rating_skill INTEGER DEFAULT 5")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE reviews ADD COLUMN discrepancy_type TEXT DEFAULT ''")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE reviews ADD COLUMN discrepancy_attributes TEXT DEFAULT '[]'")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE reviews ADD COLUMN discrepancy_details TEXT DEFAULT ''")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE players ADD COLUMN reliability_score INTEGER DEFAULT 100")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE players ADD COLUMN card_accuracy_rating REAL DEFAULT 5.0")
    except Exception:
        pass
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS geocode_cache (
            query TEXT PRIMARY KEY,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            display_name TEXT
        )
        """)
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE availabilities ADD COLUMN latitude REAL")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE availabilities ADD COLUMN longitude REAL")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE players ADD COLUMN latitude REAL")
    except Exception:
        pass
    try:
        cursor.execute("ALTER TABLE players ADD COLUMN longitude REAL")
    except Exception:
        pass

    conn.commit()

    # Seed Admin & Default data
    seed_auth_and_settings(conn)
    seed_availabilities_data(conn)
    seed_matches_data(conn)
    seed_geocode_cache(conn)

    conn.close()

def seed_geocode_cache(conn):
    cursor = conn.cursor()
    seeds = [
        ("scordia", 37.2964, 14.8462, "Scordia, Catania, Sicilia"),
        ("catania", 37.5079, 15.0873, "Catania, Sicilia"),
        ("palermo", 38.1157, 13.3615, "Palermo, Sicilia"),
        ("messina", 38.1938, 15.5540, "Messina, Sicilia"),
        ("siracusa", 37.0755, 15.2866, "Siracusa, Sicilia"),
        ("ragusa", 36.9269, 14.7306, "Ragusa, Sicilia"),
        ("caltagirone", 37.2382, 14.5126, "Caltagirone, Catania, Sicilia"),
        ("lentini", 37.2858, 14.9996, "Lentini, Siracusa, Sicilia"),
        ("francofonte", 37.2285, 14.8772, "Francofonte, Siracusa, Sicilia"),
        ("palagonia", 37.3323, 14.7478, "Palagonia, Catania, Sicilia"),
        ("militello in val di catania", 37.2742, 14.7937, "Militello in Val di Catania, Sicilia"),
        ("milano", 45.4642, 9.1900, "Milano, Lombardia"),
        ("monza", 45.5845, 9.2744, "Monza, Lombardia"),
        ("sesto san giovanni", 45.5328, 9.2274, "Sesto San Giovanni, Milano, Lombardia"),
        ("cinisello balsamo", 45.5562, 9.2139, "Cinisello Balsamo, Milano, Lombardia"),
        ("rho", 45.5317, 9.0402, "Rho, Milano, Lombardia"),
        ("bergamo", 45.6983, 9.6773, "Bergamo, Lombardia"),
        ("brescia", 45.5416, 10.2118, "Brescia, Lombardia"),
        ("roma", 41.9028, 12.4964, "Roma, Lazio"),
        ("napoli", 40.8518, 14.2681, "Napoli, Campania"),
        ("torino", 45.0703, 7.6869, "Torino, Piemonte"),
        ("bologna", 44.4949, 11.3426, "Bologna, Emilia-Romagna"),
        ("firenze", 43.7696, 11.2558, "Firenze, Toscana"),
        ("genova", 44.4056, 8.9463, "Genova, Liguria"),
        ("verona", 45.4384, 10.9916, "Verona, Veneto"),
        ("padova", 45.4064, 11.8768, "Padova, Veneto"),
        ("venezia", 45.4408, 12.3155, "Venezia, Veneto"),
        ("bari", 41.1171, 16.8719, "Bari, Puglia"),
        ("salerno", 40.6824, 14.7681, "Salerno, Campania")
    ]
    for q, lat, lon, disp in seeds:
        cursor.execute("INSERT OR IGNORE INTO geocode_cache (query, latitude, longitude, display_name) VALUES (?, ?, ?, ?)", (q, lat, lon, disp))
    
    # Backfill coordinates for existing data
    cursor.execute("UPDATE players SET latitude = 37.2964, longitude = 14.8462 WHERE LOWER(city) = 'scordia'")
    cursor.execute("UPDATE players SET latitude = 45.4642, longitude = 9.1900 WHERE LOWER(city) = 'milano' AND (latitude IS NULL OR latitude = 0)")
    cursor.execute("UPDATE availabilities SET latitude = 37.2964, longitude = 14.8462 WHERE LOWER(city) = 'scordia'")
    cursor.execute("UPDATE availabilities SET latitude = 45.4642, longitude = 9.1900 WHERE LOWER(city) = 'milano' AND (latitude IS NULL OR latitude = 0)")
    conn.commit()

def seed_auth_and_settings(conn):
    cursor = conn.cursor()

    # Admin User (No hints in the UI - private)
    admin_user = "admin"
    admin_email = "admin@trovalultimo.it"
    admin_pw_hash = hash_password("68700005Tc_-+-")

    cursor.execute("""
    INSERT INTO users (username, email, password_hash, full_name, phone, is_admin)
    VALUES (?, ?, ?, 'Amministratore Master', '+39 340 0000000', 1)
    ON CONFLICT(username) DO UPDATE SET password_hash=excluded.password_hash
    """, (admin_user, admin_email, admin_pw_hash))
    cursor.execute("UPDATE users SET password_hash = ? WHERE username = ?", (admin_pw_hash, admin_user))

    # App Settings
    default_settings = [
        ("broadcast_alert", "🚨 Stasera a Milano: Cerca l'ultimo uomo per la tua squadra o attiva la tua disponibilità per essere convocato!"),
        ("emergency_threshold_hours", "3"),
        ("allowed_formats", "5,6,7"),
        ("active_cities", "Milano,Roma,Torino,Napoli,Bologna,Firenze"),
        ("third_half_mandatory", "true"),
        ("min_reliability_threshold", "70")
    ]

    for key, val in default_settings:
        cursor.execute("INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)", (key, val))

    conn.commit()

def seed_availabilities_data(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM availabilities")
    if cursor.fetchone()[0] == 0:
        today_str = datetime.now().strftime("%Y-%m-%d")
        tomorrow_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

        availabilities = [
            (
                "player_gianlu", "Gianluigi Riva", 86, "/static/avatars/portiere.svg",
                "Portiere", "Milano", "Milano Nord / Bicocca / Pozzo",
                today_str, "Dalle 20:00 alle 23:00", "Calcio a 5 o 7",
                "Portiere pronto e munito di guanti professionali. Auto-munito, arrivo ovunque in zona Nord.",
                "active"
            ),
            (
                "player_bomber", "Manuel Esposito", 83, "/static/avatars/fenomeno.svg",
                "Attaccante", "Milano", "Milano Ovest / San Siro / Lotto",
                today_str, "Dalle 20:30 in poi", "Calcio a 5, 6 o 7",
                "Punta mancina in cerca di partita per stasera. Massima serietà, pronto anche se manca solo 1 ora!",
                "active"
            ),
            (
                "player_roccia", "Fabio Conti", 82, "/static/avatars/roccia.svg",
                "Difensore", "Milano", "Milano Centro / Navigli",
                tomorrow_str, "Fascia 19:30 - 22:00", "Calcio a 7 preferito",
                "Centrale difensivo roccioso. Zero pacchi, pago con Satispay all'arrivo.",
                "active"
            ),
            (
                "player_jolly", "Simone De Luca", 80, "/static/avatars/metronomo.svg",
                "Jolly", "Milano", "Città Studi / Piola / Lambrate",
                today_str, "Dalle 21:00 alle 23:30", "Qualsiasi formato",
                "Jolly tuttocampista, disponibile per stasera. Posso giocare sia dietro che in mezzo.",
                "active"
            )
        ]

        for av in availabilities:
            cursor.execute("""
            INSERT INTO availabilities (
                player_id, player_name, player_ovr, photo_url, primary_role,
                city, zone, available_date, time_slot, preferred_format, notes, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, av)

        # Seed sample messages
        cursor.execute("""
        INSERT INTO messages (availability_id, sender_id, sender_name, recipient_id, recipient_name, text)
        VALUES (1, 'user_organizer', 'Marco (Capitano Pozzo)', 'player_gianlu', 'Gianluigi Riva', 'Ciao Gianluigi! Ti ho visto su Trova l''Ultimo: abbiamo una partita a 5 alle 21:00 al Campo Pozzo, ti andrebbe di venire a giocare con noi?')
        """)

        cursor.execute("""
        INSERT INTO messages (availability_id, sender_id, sender_name, recipient_id, recipient_name, text)
        VALUES (1, 'player_gianlu', 'Gianluigi Riva', 'user_organizer', 'Marco (Capitano Pozzo)', 'Ciao Marco! Sì, sono libero e pronto. Arrivo per le 20:45 per il riscaldamento. Ci scambiamo il numero?')
        """)

        conn.commit()

def seed_matches_data(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM matches")
    if cursor.fetchone()[0] == 0:
        yesterday_str = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
        today_str = datetime.now().strftime("%Y-%m-%d")
        tomorrow_str = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")

        # 1. Finished Match (ready for post-match review test)
        confirmed_finished = [
            {
                "player_id": "player_bomber",
                "player_name": "Manuel 'Il Bomber' Esposito",
                "player_role": "Attaccante",
                "player_phone": "+39 349 9876543",
                "player_ovr": 83,
                "joined_at": f"{yesterday_str}T19:30:00"
            }
        ]

        cursor.execute("""
        INSERT INTO matches (
            title, format, field_name, address, city, latitude, longitude, maps_url,
            match_date, match_time, end_time, duration_min, price_per_player, pitch_type,
            missing_count, roles_needed, level, notes, organizer_name, organizer_phone,
            status, confirmed_players, creator_id, creator_username
        ) VALUES (
            'Calciotto del Giovedì - Sfida tra amici', '7', 'Centro Sportivo Pozzo', 'Via Pozzobonelli 4', 'Milano',
            45.4982, 9.1921, 'https://www.google.com/maps/search/?api=1&query=Centro+Sportivo+Pozzo,+Via+Pozzobonelli+4,+Milano',
            ?, '20:00', '21:15', 75, '9€', 'Sintetico 4G',
            0, '["Attaccante"]', 'Amatoriale con grinta', 'Partita epica conclusa! Grazie a tutti i presenti.',
            'Marco Rossi', '+39 340 1122334',
            'filled', ?, 'user_2', 'marco_rossi'
        )
        """, (yesterday_str, json.dumps(confirmed_finished)))

        # 2. Open SOS Match (Calcio a 5)
        cursor.execute("""
        INSERT INTO matches (
            title, format, field_name, address, city, latitude, longitude, maps_url,
            match_date, match_time, end_time, duration_min, price_per_player, pitch_type,
            missing_count, roles_needed, level, notes, organizer_name, organizer_phone,
            status, confirmed_players, creator_id, creator_username
        ) VALUES (
            '🚨 SOS: Manca 1 Portiere per stasera!', '5', 'Sporting Club San Siro', 'Via Tesio 15', 'Milano',
            45.4781, 9.1239, 'https://www.google.com/maps/search/?api=1&query=Sporting+Club+San+Siro,+Via+Tesio+15,+Milano',
            ?, '21:30', '22:30', 60, 'GRATIS per portiere', 'Sintetico 4G',
            1, '["Portiere"]', 'Buon livello amatoriale', 'Il nostro portiere ha avuto un imprevisto. Maglia e guanti disponibili se servono!',
            'Matteo Galli', '+39 340 1234567',
            'open', '[]', 'user_1', 'admin'
        )
        """, (today_str,))

        # 3. Open Match (Calcio a 7)
        cursor.execute("""
        INSERT INTO matches (
            title, format, field_name, address, city, latitude, longitude, maps_url,
            match_date, match_time, end_time, duration_min, price_per_player, pitch_type,
            missing_count, roles_needed, level, notes, organizer_name, organizer_phone,
            status, confirmed_players, creator_id, creator_username
        ) VALUES (
            'Calciotto del Weekend - Mancano 2', '7', 'C.S. Cimiano', 'Via Don Calabria 16', 'Milano',
            45.5015, 9.2431, 'https://www.google.com/maps/search/?api=1&query=CS+Cimiano,+Via+Don+Calabria+16,+Milano',
            ?, '20:30', '21:45', 75, '8€', 'Erba Sintetica',
            2, '["Difensore", "Centrocampista"]', 'Tranquilla tra colleghi', 'Terzo tempo con birra garantita a fine match!',
            'Lorenzo Riva', '+39 348 7654321',
            'open', '[]', 'user_1', 'admin'
        )
        """, (tomorrow_str,))

        conn.commit()

if __name__ == "__main__":
    init_db()
    print("Database updated with availabilities and messaging system!")
