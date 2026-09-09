from pydantic import BaseModel, Field
from typing import Optional, Any, Dict
from datetime import datetime
from uuid import UUID

class AutomationRuleBase(BaseModel):
    name: str = Field(..., max_length=255, description="Rule name")
    description: Optional[str] = Field(None, description="Rule description")
    trigger_event: str = Field(..., description="Event that triggers this rule")
    condition_field: Optional[str] = Field(None, description="Field path to check in context")
    condition_op: Optional[str] = Field("always", description="Operator: lte, gte, eq, contains, always")
    condition_value: Optional[str] = Field(None, description="Value to compare against")
    action_type: str = Field(..., description="Action to take: notify_admin, notify_consultant, escalate_ticket, pause_consultant, flag_risk, send_email")
    action_config: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Custom params for action")
    status: Optional[str] = Field("active", description="Status: active, paused, needs_review")

class AutomationRuleCreate(AutomationRuleBase):
    pass

class AutomationRuleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_event: Optional[str] = None
    condition_field: Optional[str] = None
    condition_op: Optional[str] = None
    condition_value: Optional[str] = None
    action_type: Optional[str] = None
    action_config: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class AutomationRuleOut(AutomationRuleBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    run_count: int = 0
    last_run_at: Optional[datetime] = None
    success_rate: float = 100.0
    last_effect: Optional[str] = None

    class Config:
        from_attributes = True
