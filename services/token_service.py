import hashlib
import uuid
from datetime import datetime, timezone
from sqlalchemy.orm import Session
import redis
from models.refresh_token import RefreshToken

class TokenService:
    @staticmethod
    def _hash_token(token: str) -> str:
        """
        Computes the SHA-256 hash of a token.
        """
        return hashlib.sha256(token.encode()).hexdigest()

    @staticmethod
    def store_refresh_token(
        db: Session, user_id: uuid.UUID, token: str, expires_at: datetime, device_info: str = None
    ) -> RefreshToken:
        """
        Hashes a refresh token and stores it in the database.
        """
        token_hash = TokenService._hash_token(token)
        db_token = RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at,
            device_info=device_info
        )
        db.add(db_token)
        db.commit()
        db.refresh(db_token)
        return db_token

    @staticmethod
    def get_valid_refresh_token(db: Session, token: str) -> RefreshToken | None:
        """
        Retrieves a refresh token from database only if it is active, not revoked, and not expired.
        """
        token_hash = TokenService._hash_token(token)
        # Ensure comparison is done with timezone-aware datetime or local matching database column
        # To avoid timezone naive/aware comparison issues, we do a normal datetime query.
        now = datetime.now(timezone.utc)
        db_token = db.query(RefreshToken).filter(
            RefreshToken.token_hash == token_hash,
            RefreshToken.is_revoked == False,
            RefreshToken.expires_at > now
        ).first()
        return db_token

    @staticmethod
    def revoke_refresh_token(db: Session, token: str) -> bool:
        """
        Revokes a single refresh token by its value.
        """
        token_hash = TokenService._hash_token(token)
        db_token = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        if db_token:
            db_token.is_revoked = True
            db.commit()
            return True
        return False

    @staticmethod
    def revoke_all_user_tokens(db: Session, user_id: uuid.UUID) -> int:
        """
        Revokes all refresh tokens belonging to a user (e.g. log out from all devices).
        """
        updated = db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False
        ).update({"is_revoked": True}, synchronize_session=False)
        db.commit()
        return updated

    # Redis Blacklisting operations for Access Token JTIs
    @staticmethod
    def blacklist_jti(redis_client: redis.Redis, jti: str, ttl_seconds: int) -> bool:
        """
        Caches a JTI in Redis with a TTL so it is blacklisted until its natural expiry.
        """
        redis_key = f"blacklist:{jti}"
        # Store with value "1" and expire after ttl_seconds
        redis_client.setex(redis_key, ttl_seconds, "1")
        return True

    @staticmethod
    def is_jti_blacklisted(redis_client: redis.Redis, jti: str) -> bool:
        """
        Checks if a JTI exists in the Redis blacklist.
        """
        redis_key = f"blacklist:{jti}"
        return redis_client.exists(redis_key) > 0
