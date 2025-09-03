import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load .env locally, ignored in production since Render provides real env vars
load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# --- Safe debug logging of DB connection string (mask password) ---
if SQLALCHEMY_DATABASE_URL:
    parsed = urlparse(SQLALCHEMY_DATABASE_URL)
    safe_url = f"{parsed.scheme}://{parsed.username}:***@{parsed.hostname}:{parsed.port}{parsed.path}"
    print(f"--- Attempting to connect to DB at: '{safe_url}' ---")
else:
    print("❌ DATABASE_URL not set in environment!")

# --- Create engine with SSL + statement cache fix for PgBouncer ---
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={
        "sslmode": "require",
        "options": "-c statement_cache_size=0"   # Disable prepared statement caching (fixes PgBouncer psycopg2 bug)
    },
    pool_pre_ping=True  # keeps connections fresh, auto-reconnect if dropped
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# --- Test connection on startup ---
try:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))  # simple test query
        print("✅ Successfully connected to DB")
except Exception as e:
    print("❌ Database connection failed:", e)