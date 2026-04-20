import base64
import io
import logging

from src.backend.app.tasks.celery_app import celery_app

logger = logging.getLogger("skilllink.tasks")

MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def _compress_pdf(raw_bytes: bytes) -> bytes:
    import pikepdf

    pdf = pikepdf.open(io.BytesIO(raw_bytes))
    out = io.BytesIO()
    pdf.save(out, compress_streams=True, recompress_streams=True)
    return out.getvalue()


@celery_app.task(name="tasks.compress_and_store_pdf", bind=True, max_retries=3, default_retry_delay=15)
def compress_and_store_pdf(self, specialist_id: str, pdf_b64: str, db_url: str):
    import psycopg2

    try:
        raw_bytes = base64.b64decode(pdf_b64)
        original_kb = len(raw_bytes) / 1024

        if len(raw_bytes) > MAX_SIZE_BYTES:
            raise ValueError(f"PDF too large: {original_kb:.1f} KB (max {MAX_SIZE_BYTES // 1024} KB)")

        compressed = _compress_pdf(raw_bytes)
        compressed_kb = len(compressed) / 1024

        logger.info(
            f"[PDF] specialist={specialist_id} | "
            f"before={original_kb:.1f} KB | "
            f"after={compressed_kb:.1f} KB | "
            f"ratio={compressed_kb / original_kb:.1%}"
        )

        conn = psycopg2.connect(db_url)
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO accreditation
                    (id, specialist_id, pdf_data, content_type,
                     original_size_bytes, compressed_size_bytes, uploaded_at)
                    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, now())
                    """,
                    (
                        specialist_id,
                        psycopg2.Binary(compressed),
                        "application/pdf",
                        len(raw_bytes),
                        len(compressed),
                    ),
                )
        conn.close()
        logger.info(f"[PDF] Stored compressed PDF for specialist={specialist_id}")

    except Exception as exc:
        logger.error(f"[PDF] Failed for specialist={specialist_id}: {exc}")
        raise self.retry(exc=exc)