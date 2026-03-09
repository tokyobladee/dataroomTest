import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class ShareLink(Base):
    __tablename__ = "share_links"
    __table_args__ = (
        CheckConstraint("permissions IN ('viewer', 'editor')", name="valid_permissions"),
    )

    token: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataroom_id: Mapped[str] = mapped_column(String, ForeignKey("datarooms.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id: Mapped[str | None] = mapped_column(String, ForeignKey("folders.id", ondelete="SET NULL"), nullable=True)
    file_id: Mapped[str | None] = mapped_column(String, ForeignKey("files.id", ondelete="SET NULL"), nullable=True)
    permissions: Mapped[str] = mapped_column(String, nullable=False, default="viewer")
    created_by_uid: Mapped[str] = mapped_column(String, nullable=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    dataroom = relationship("Dataroom", back_populates="share_links")
