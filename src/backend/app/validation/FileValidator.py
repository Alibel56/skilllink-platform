from __future__ import annotations

class FileValidator:
    """Валидация загружаемых файлов."""

    MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

    @staticmethod
    def ensure_image(content_type: str, size: int) -> None:
        from src.backend.app.exceptions.Base import FileTooLargeException, InvalidFileTypeException
        if not content_type.startswith("image/"):
            raise InvalidFileTypeException("Only image files are accepted")
        if size > FileValidator.MAX_SIZE_BYTES:
            raise FileTooLargeException("Max file size is 10 MB")

    @staticmethod
    def ensure_pdf(content_type: str, size: int) -> None:
        from src.backend.app.exceptions.Base import FileTooLargeException, InvalidFileTypeException
        if content_type != "application/pdf":
            raise InvalidFileTypeException("Only PDF files are accepted")
        if size > FileValidator.MAX_SIZE_BYTES:
            raise FileTooLargeException("Max file size is 10 MB")