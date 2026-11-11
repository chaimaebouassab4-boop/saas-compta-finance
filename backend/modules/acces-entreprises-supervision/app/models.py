from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

def new_id(): return str(uuid4())
def now(): return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "m1_users"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(254), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(100), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(2048))

class Organization(Base):
    __tablename__ = "m1_organizations"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    kind: Mapped[str] = mapped_column(String(20), nullable=False)
    owner_id: Mapped[str] = mapped_column(ForeignKey("m1_users.id"), nullable=False)

class Membership(Base):
    __tablename__ = "m1_memberships"
    organization_id: Mapped[str] = mapped_column(ForeignKey("m1_organizations.id"), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("m1_users.id"), primary_key=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)

class Session(Base):
    __tablename__ = "m1_sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("m1_users.id"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

class Invitation(Base):
    __tablename__ = "m1_invitations"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    organization_id: Mapped[str] = mapped_column(ForeignKey("m1_organizations.id"), nullable=False)
    invited_by: Mapped[str] = mapped_column(ForeignKey("m1_users.id"), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    accepted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
