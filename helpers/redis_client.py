import redis
from helpers.config import settings

# Initialize Redis client connection pool
# decode_responses=True ensures we get string keys and values instead of bytes
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

def get_redis() -> redis.Redis:
    """
    FastAPI dependency to retrieve the Redis client instance.
    """
    return redis_client
