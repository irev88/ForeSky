import os
import smtplib
from email.mime.text import MIMEText
from fastapi import Depends, FastAPI, HTTPException, status, Body, Path, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text  # Added this import
from typing import List
import asyncio
from datetime import datetime

import models, schemas, security
from database import SessionLocal, engine, Base

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ForeSky API", description="FastAPI backend for ForeSky", version="1.0")

# --------------------------
# CORS
# --------------------------
origins = [
    "http://localhost:5173",                 # Local dev
    "https://metsky.netlify.app"            # Prod frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------
# KEEP-ALIVE MECHANISM (FIXED)
# --------------------------
async def keep_alive_task():
    """Background task that keeps the server active"""
    while True:
        await asyncio.sleep(840)  # 14 minutes (Render timeout is 15 mins)
        try:
            # Ping database to keep connection alive
            db = SessionLocal()
            db.execute(text("SELECT 1"))  # Fixed: using text()
            db.close()
            print(f"Keep-alive ping at {datetime.now()}")
        except Exception as e:
            print(f"Keep-alive error: {e}")

@app.on_event("startup")
async def startup_event():
    """Start background keep-alive task on server startup"""
    asyncio.create_task(keep_alive_task())


# --------------------------
# DB Session Dependency
# --------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --------------------------
# OAuth2 Scheme
# --------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = security.jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except security.jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except security.JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user


# --------------------------
# EMAIL SENDING UTILITY
# --------------------------
def send_verification_email(to_email: str, token: str):
    """
    Sends an email via Gmail SMTP with a verification link.
    """
    verify_link = f"{os.getenv('FRONTEND_URL')}/verify?token={token}"
    body = f"""
    Hi,

    Please verify your ForeSky account by clicking this link:

    {verify_link}

    This link is valid for 24 hours.
    """

    msg = MIMEText(body)
    msg["Subject"] = "Verify your ForeSky account"
    msg["From"] = os.getenv("EMAIL_FROM")
    msg["To"] = to_email

    try:
        with smtplib.SMTP(os.getenv("EMAIL_HOST"), int(os.getenv("EMAIL_PORT"))) as server:
            server.starttls()  # upgrade to secure connection
            server.login(os.getenv("EMAIL_HOST_USER"), os.getenv("EMAIL_HOST_PASSWORD"))
            server.send_message(msg)
            print(f"✅ Verification email sent to {to_email}")
    except Exception as e:
        print(f"❌ Email sending failed: {e}")


# --------------------------
# ROOT & HEALTH ENDPOINTS
# --------------------------
@app.get("/")
def root():
    return {"message": "ForeSky API is running. See /docs for API usage", "timestamp": datetime.now()}


@app.get("/health")
def health_check():
    """Health check endpoint for monitoring and keep-alive"""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "service": "ForeSky API"
    }


@app.get("/ping")
def ping():
    """Simple ping endpoint to prevent server sleep"""
    return {"pong": True, "time": datetime.now()}


# --------------------------
# AUTH ENDPOINTS
# --------------------------
@app.post("/auth/register", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_password = security.get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, is_active=True, is_verified=False)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    token = security.create_email_token(user.email)
    send_verification_email(user.email, token)

    return db_user


@app.post("/auth/resend")
def resend_verification(
    email: str = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        return {"message": "User is already verified. Please log in."}

    # generate new token and resend
    token = security.create_email_token(user.email)
    send_verification_email(user.email, token)
    return {"message": f"Verification email resent to {email}"}


@app.get("/auth/verify")
def verify_email(token: str, db: Session = Depends(get_db)):
    email = security.verify_email_token(token)
    if email is None:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    db.commit()
    return {"message": "Email verified successfully. You can now log in."}


@app.post("/auth/login", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified. Please check your inbox.")

    # Increased token expiration time to 7 days
    access_token_expires = security.timedelta(days=7)
    access_token = security.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.post("/auth/refresh", response_model=schemas.Token)
def refresh_token(current_user: schemas.User = Depends(get_current_user)):
    """Refresh access token"""
    access_token_expires = security.timedelta(days=7)
    access_token = security.create_access_token(
        data={"sub": current_user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --------------------------
# TAGS ENDPOINTS
# --------------------------
@app.post("/tags/", response_model=schemas.Tag)
def create_tag(
    tag: schemas.TagBase, 
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)  # Added auth
):
    db_tag = db.query(models.Tag).filter(models.Tag.name == tag.name).first()
    if db_tag:
        return db_tag
    new_tag = models.Tag(name=tag.name)
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return new_tag


@app.get("/tags/", response_model=List[schemas.Tag])
def get_tags(db: Session = Depends(get_db)):
    return db.query(models.Tag).all()


@app.put("/tags/{tag_id}", response_model=schemas.Tag)
def update_tag(
    tag_id: int = Path(...),
    tag_update: schemas.TagBase = Body(...),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Update a tag's name - this will affect all notes using this tag"""
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check if new name already exists
    existing = db.query(models.Tag).filter(
        models.Tag.name == tag_update.name,
        models.Tag.id != tag_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tag name already exists")
    
    db_tag.name = tag_update.name
    db.commit()
    db.refresh(db_tag)
    return db_tag


@app.delete("/tags/{tag_id}")
def delete_tag(
    tag_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(get_current_user)
):
    """Delete a tag only if no notes are using it"""
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check if any notes are using this tag
    notes_count = db.query(models.Note).join(models.note_tags).filter(
        models.note_tags.c.tag_id == tag_id
    ).count()
    
    if notes_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete tag. {notes_count} note(s) are using this tag."
        )
    
    db.delete(db_tag)
    db.commit()
    return {"message": "Tag deleted successfully"}


# --------------------------
# USER ENDPOINTS
# --------------------------
@app.get("/users/me/", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(get_current_user)):
    return current_user


# --------------------------
# NOTES ENDPOINTS
# --------------------------
@app.post("/users/me/notes/", response_model=schemas.Note)
def create_note_for_user(
    note: schemas.NoteCreate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    db_note = models.Note(title=note.title, content=note.content, owner_id=current_user.id)
    
    # Handle tags if provided
    if note.tag_ids:
        db_note.tags = db.query(models.Tag).filter(models.Tag.id.in_(note.tag_ids)).all()
    
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note


@app.get("/users/me/notes/", response_model=List[schemas.Note])
def read_own_notes(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notes = db.query(models.Note).filter(models.Note.owner_id == current_user.id).all()
    return notes


@app.put("/users/me/notes/{note_id}", response_model=schemas.Note)
def update_note(
    note_id: int = Path(...),
    note: schemas.NoteCreate = Body(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.owner_id == current_user.id
    ).first()

    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Update basic fields
    db_note.title = note.title
    db_note.content = note.content
    
    # Update tags if provided
    if note.tag_ids is not None:
        db_note.tags = db.query(models.Tag).filter(models.Tag.id.in_(note.tag_ids)).all()
    
    db.commit()
    db.refresh(db_note)
    return db_note


@app.delete("/users/me/notes/{note_id}")
def delete_note(
    note_id: int = Path(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_note = db.query(models.Note).filter(
        models.Note.id == note_id,
        models.Note.owner_id == current_user.id
    ).first()

    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")

    db.delete(db_note)
    db.commit()
    return {"message": "Note deleted successfully"}


# --------------------------
# STATS ENDPOINT
# --------------------------
@app.get("/users/me/stats")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get user statistics"""
    notes_count = db.query(models.Note).filter(models.Note.owner_id == current_user.id).count()
    tags_count = db.query(models.Tag).count()
    
    return {
        "notes_count": notes_count,
        "tags_count": tags_count,
        "user_email": current_user.email
    }