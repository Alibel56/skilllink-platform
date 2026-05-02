import time
import os
import logging
from collections import defaultdict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("skilllink")

SLOW_THRESHOLD_MS = float(os.getenv("SLOW_THRESHOLD_MS", "500"))

# Хранилище латентностей: endpoint -> [ms, ...]
# cProfile here was racy under concurrent requests (sys.setprofile is process-global) —
# дропнули per-request cProfile, оставили только сбор латентности.
_latency_store: dict = defaultdict(list)
_LATENCY_CAP = 1000  # храним последние N измерений на эндпоинт


def get_latency_report() -> dict:
    report = {}
    for endpoint, times in _latency_store.items():
        if not times:
            continue
        report[endpoint] = {
            "count": len(times),
            "avg_ms": round(sum(times) / len(times), 2),
            "max_ms": round(max(times), 2),
            "min_ms": round(min(times), 2),
        }
    return report


class ProfilingMiddleware(BaseHTTPMiddleware):

    async def dispatch(self, request: Request, call_next) -> Response:
        endpoint = request.url.path
        method = request.method
        start = time.perf_counter()

        response = await call_next(request)

        elapsed_ms = (time.perf_counter() - start) * 1000
        bucket = _latency_store[endpoint]
        bucket.append(elapsed_ms)
        if len(bucket) > _LATENCY_CAP:
            del bucket[: len(bucket) - _LATENCY_CAP]

        if elapsed_ms > SLOW_THRESHOLD_MS:
            logger.warning(
                f"[SLOW] {method} {endpoint} — {elapsed_ms:.2f}ms "
                f"(threshold={SLOW_THRESHOLD_MS}ms)"
            )

        response.headers["X-Processing-Time-Ms"] = f"{elapsed_ms:.2f}"
        return response