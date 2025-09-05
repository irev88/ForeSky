from pydantic import BaseModel
from typing import List, Optional

# ----- TAG -----
class TagBase(BaseModel):
    name: str

class Tag(TagBase):
    id: int
    class Config:
        from_attributes = True

# ----- NOTE -----
class NoteBase(BaseModel):
    title: str
    content: Optional[str] = None
    tag_ids: List[int] = []   # for create/update

class NoteCreate(NoteBase):
    pass

class Note(NoteBase):
    id: int
    tags: List[Tag] = []   # include full tag objects
    class Config:
        from_attributes = True

# ----- USER -----
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    notes: List[Note] = []
    class Config:
        from_attributes = True

# ----- TOKENS -----
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None