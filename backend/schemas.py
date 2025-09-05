from pydantic import BaseModel
from typing import List, Optional

class NoteBase(BaseModel):
    title: str
    content: Optional[str] = None
    tag_ids: List[int] = []   # references existing tags by ID

class NoteCreate(NoteBase):
    pass

class TagBase(BaseModel):
    name: str

class Tag(TagBase):
    id: int
    class Config:
        from_attributes = True

class Note(NoteBase):
    id: int
    tags: List[Tag] = []
    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    notes: List[Note] = []
    class Config:
        from_attributes = True
        
# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
