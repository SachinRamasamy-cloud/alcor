import time
from uuid import uuid4

from redis.asyncio import Redis
from redis.exceptions import RedisError

from app.core.errors import AppError

# One atomic sliding-window operation; rejected calls do not consume allowance.
LUA = """
local key, now, minute, second = KEYS[1], tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - 60000)
local count = redis.call('ZCARD', key)
local recent = redis.call('ZCOUNT', key, now - 1000, '+inf')
if count >= minute then
  local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
  return math.max(1, math.ceil((tonumber(oldest[2]) + 60000 - now) / 1000))
end
if second > 0 and recent >= second then return 1 end
redis.call('ZADD', key, now, ARGV[4])
redis.call('PEXPIRE', key, 60001)
return 0
"""


class RateLimiter:
    def __init__(self, url: str):
        self.redis = Redis.from_url(url, socket_connect_timeout=1, socket_timeout=1)

    async def check(self, scope: str, per_minute: int, per_second: int = 0) -> int:
        try:
            return int(
                await self.redis.eval(
                    LUA,
                    1,
                    f"alcor:v1:limit:{scope}",
                    int(time.time() * 1000),
                    per_minute,
                    per_second,
                    str(uuid4()),
                )
            )
        except RedisError as exc:
            raise AppError(
                503,
                "LIMITER_UNAVAILABLE",
                "The service is temporarily unavailable.",
                retryable=True,
            ) from exc

    async def close(self):
        await self.redis.aclose()
