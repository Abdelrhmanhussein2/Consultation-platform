import base64
import hashlib
import logging
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from helpers.config import settings

logger = logging.getLogger(__name__)

def _get_fernet_key() -> bytes:
    """
    Derives a valid 32-byte url-safe base64-encoded key for Fernet encryption
    from APP_ENCRYPTION_KEY or SECRET_KEY.
    """
    raw_key = getattr(settings, "APP_ENCRYPTION_KEY", None) or settings.SECRET_KEY
    if not raw_key:
        raw_key = "default_consultation_platform_fallback_encryption_key_2026"
    
    # Hash to 32 bytes and base64-urlencode
    digest = hashlib.sha256(raw_key.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(digest)


_fernet_instance: Optional[Fernet] = None

def get_fernet() -> Fernet:
    global _fernet_instance
    if _fernet_instance is None:
        key = _get_fernet_key()
        _fernet_instance = Fernet(key)
    return _fernet_instance


def encrypt_text(plain_text: Optional[str]) -> Optional[str]:
    """
    Encrypts a plaintext string using AES-256 (Fernet).
    Returns None if input is None or empty.
    """
    if plain_text is None:
        return None
    if not plain_text.strip():
        return ""
    
    try:
        f = get_fernet()
        cipher_bytes = f.encrypt(plain_text.encode("utf-8"))
        return cipher_bytes.decode("utf-8")
    except Exception as e:
        logger.error(f"Encryption error: {e}")
        raise ValueError(f"Failed to encrypt data: {e}")


def decrypt_text(cipher_text: Optional[str]) -> Optional[str]:
    """
    Decrypts a Fernet-encrypted ciphertext string.
    Gracefully returns plain_text if the string is not encrypted (backward compatibility).
    """
    if cipher_text is None:
        return None
    if not cipher_text.strip():
        return ""
    
    try:
        f = get_fernet()
        plain_bytes = f.decrypt(cipher_text.encode("utf-8"))
        return plain_bytes.decode("utf-8")
    except (InvalidToken, Exception):
        # Graceful fallback: return as-is in case it was stored unencrypted before migration
        return cipher_text


def mask_bank_account(account_number: Optional[str]) -> Optional[str]:
    """
    Masks a bank account number showing only the last 4 digits.
    Example: '123456789012' -> '**** **** 9012'
    """
    if not account_number:
        return None
    clean = str(account_number).strip()
    if len(clean) <= 4:
        return "****"
    last_four = clean[-4:]
    masked_part = "*" * (len(clean) - 4)
    # Format into groups of 4 if long enough
    if len(clean) >= 8:
        return f"**** **** **** {last_four}"
    return f"{masked_part}{last_four}"


def mask_iban(iban: Optional[str]) -> Optional[str]:
    """
    Masks an IBAN showing country code and last 4 digits.
    Example: 'EG123456789012345678901234567' -> 'EG** **** **** **** **** 4567'
    """
    if not iban:
        return None
    clean = str(iban).strip().upper()
    if len(clean) <= 4:
        return "****"
    country_prefix = clean[:2]
    last_four = clean[-4:]
    return f"{country_prefix}** **** **** **** **** {last_four}"


def mask_string(val: Optional[str], visible_suffix: int = 4) -> Optional[str]:
    """
    Masks any sensitive string showing only the suffix.
    """
    if not val:
        return None
    clean = str(val).strip()
    if len(clean) <= visible_suffix:
        return "••••••••"
    return f"••••••••••••{clean[-visible_suffix:]}"
