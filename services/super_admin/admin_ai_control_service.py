import json
from typing import Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime

from models.platform_setting import PlatformSetting
from schemes.ai_control_schemas import AIServiceConfigUpdate

_DEFAULT_CONFIG = {
    "primary_model": "gpt-4o",
    "fallback_model": "claude-3-5-sonnet",
    "temperature": 0.7,
    "max_tokens": 2048,
    "ai_legal_assistant_enabled": True,
    "auto_summarize_sessions": True,
    "ai_matching_enabled": True
}

class AdminAIControlService:
    SETTING_KEY = "ai_control_config"

    @staticmethod
    def _load_config(setting: PlatformSetting) -> Dict[str, Any]:
        if setting and setting.value_json:
            try:
                return json.loads(setting.value_json)
            except (json.JSONDecodeError, TypeError):
                pass
        return dict(_DEFAULT_CONFIG)

    @staticmethod
    def get_ai_config_and_stats(db: Session) -> Dict[str, Any]:
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == AdminAIControlService.SETTING_KEY).first()
        config = AdminAIControlService._load_config(setting)

        return {
            "config": config,
            "stats": {
                "total_tokens_month": 1425000,
                "active_conversations": 42,
                "avg_response_time_ms": 1240.5,
                "cost_estimate_usd": 28.50,
                "services_status": {
                    "legal_assistant": config.get("ai_legal_assistant_enabled", True),
                    "auto_summarizer": config.get("auto_summarize_sessions", True),
                    "smart_matcher": config.get("ai_matching_enabled", True)
                }
            }
        }

    @staticmethod
    def update_ai_config(db: Session, update_in: AIServiceConfigUpdate) -> Dict[str, Any]:
        setting = db.query(PlatformSetting).filter(PlatformSetting.key == AdminAIControlService.SETTING_KEY).first()
        current = AdminAIControlService._load_config(setting)

        current.update(update_in.dict(exclude_unset=True))

        if not setting:
            setting = PlatformSetting(
                key=AdminAIControlService.SETTING_KEY,
                value_json=json.dumps(current),
                description="AI Control Center configurations"
            )
            db.add(setting)
        else:
            setting.value_json = json.dumps(current)

        db.commit()
        db.refresh(setting)
        return AdminAIControlService.get_ai_config_and_stats(db)
