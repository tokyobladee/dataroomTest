from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from .base import Base


class DriveToken(Base):
    __tablename__ = "drive_tokens"

    user_uid: Mapped[str] = mapped_column(String, primary_key=True)
    # refresh_token is stored encrypted (Fernet)
    refresh_token_encrypted: Mapped[str] = mapped_column(String, nullable=False)
    # access_token cached to avoid unnecessary refreshes; expires_at tracks its validity
    access_token: Mapped[str | None] = mapped_column(String, nullable=True)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
