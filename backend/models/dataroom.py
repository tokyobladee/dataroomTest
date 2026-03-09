import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .base import Base


class Dataroom(Base):
    __tablename__ = "datarooms"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String, nullable=False)
    owner_uid: Mapped[str] = mapped_column(String, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    folders = relationship("Folder", back_populates="dataroom", cascade="all, delete-orphan")
    files = relationship("File", back_populates="dataroom", cascade="all, delete-orphan")
    members = relationship("DataroomMember", back_populates="dataroom", cascade="all, delete-orphan")
    share_links = relationship("ShareLink", back_populates="dataroom", cascade="all, delete-orphan")
