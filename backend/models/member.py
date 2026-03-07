import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base

ROLES = ("owner", "editor", "viewer")


class DataroomMember(Base):
    __tablename__ = "dataroom_members"
    __table_args__ = (
        CheckConstraint("role IN ('owner', 'editor', 'viewer')", name="valid_role"),
    )

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    dataroom_id: Mapped[str] = mapped_column(String, ForeignKey("datarooms.id", ondelete="CASCADE"), nullable=False, index=True)
    user_uid: Mapped[str] = mapped_column(String, nullable=False, index=True)
    role: Mapped[str] = mapped_column(String, nullable=False)
    invited_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    dataroom = relationship("Dataroom", back_populates="members")
