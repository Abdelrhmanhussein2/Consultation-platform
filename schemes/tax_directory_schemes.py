import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class TaxEntityBase(BaseModel):
    name: str = Field(..., max_length=255)
    tax_number: str = Field(..., max_length=50)
    entity_type: str = Field(..., max_length=100)


class TaxEntityCreate(TaxEntityBase):
    pass


class TaxEntityUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=255)
    tax_number: Optional[str] = Field(default=None, max_length=50)
    entity_type: Optional[str] = Field(default=None, max_length=100)
    is_active: Optional[bool] = None


class TaxEntityOut(TaxEntityBase):
    id: uuid.UUID
    name_normalized: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[uuid.UUID] = None
    updated_by: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


class TaxDirectoryStats(BaseModel):
    total_records: int
    active_records: int
    categories_count: int
    categories: List[str]


class ImportPreviewItem(BaseModel):
    name: str
    tax_number: str
    entity_type: str
    action: str  # 'insert' | 'update' | 'conflict' | 'skip'
    diff: Optional[Dict[str, Any]] = None


class ImportDryRunResult(BaseModel):
    total_parsed: int
    valid_count: int
    inserted_count: int
    updated_count: int
    conflicts_count: int
    samples: List[ImportPreviewItem]
    errors: List[str]


class ImportCommitResult(BaseModel):
    success: bool
    inserted: int
    updated: int
    total_processed: int
    message: str

