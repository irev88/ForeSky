from typing import List, Optional
from pydantic import BaseModel

class TagBase(BaseModel):
    name: str

class Tag(TagBase):
    id: int
    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    title: str
    content: Optional[str] = None
    tag_ids: List[int] = []   # references existing tags by ID

class NoteCreate(NoteBase):
    pass

class Note(NoteBase):
    id: int
    tags: List[Tag] = []
    class Config:
        from_attributes = True