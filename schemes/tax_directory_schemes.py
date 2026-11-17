import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class TaxEntityBase(BaseModel):
    name: str = Field(..., max_length=255)
    tax_number: str = Field(..., max_length=50)
    entity_type: str = Field(..., max_length=100)


class TaxEntityCreate(TaxEntityBase):
    resolution: Optional[str] = None  # None | 'merge' | 'update_existing'
    existing_id: Optional[uuid.UUID] = None


class CheckDuplicateRequest(BaseModel):
    name: str = Field(..., max_length=255)
    tax_number: str = Field(..., max_length=50)
    exclude_id: Optional[uuid.UUID] = None


class CheckDuplicateResponse(BaseModel):
    is_duplicate_exact: bool
    is_duplicate_name: bool
    is_duplicate_tax: bool
    matched_by_name: Optional[Dict[str, Any]] = None
    matched_by_tax: Optional[Dict[str, Any]] = None
    suggested_merged_name: Optional[str] = None


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
    merged_count: int = 0
    duplicate_name_count: int = 0
    exact_duplicates_count: int = 0
    conflicts_count: int = 0
    samples: List[Dict[str, Any]] = []
    errors: List[str] = []


class ImportCommitResult(BaseModel):
    success: bool
    inserted: int
    merged: int = 0
    skipped: int = 0
    updated: int = 0
    total_processed: int
    message: str

