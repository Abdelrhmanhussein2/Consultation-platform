from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class Entity360SearchItem(BaseModel):
    id: UUID
    title: str
    subtitle: Optional[str] = None
    type: str  # 'user', 'consultant', 'session'
    status: Optional[str] = None
    created_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None

class Entity360Response(BaseModel):
    entity_id: UUID
    entity_type: str
    overview: Dict[str, Any]
    timeline: List[Dict[str, Any]] = []
    related_records: Dict[str, Any] = {}
