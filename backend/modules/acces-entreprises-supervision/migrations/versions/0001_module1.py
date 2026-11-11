"""Initial isolated module 1 schema.

Revision ID: 0001
"""
from alembic import op
import sqlalchemy as sa

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("m1_users", sa.Column("id", sa.String(36), primary_key=True), sa.Column("email", sa.String(254), nullable=False, unique=True), sa.Column("password_hash", sa.String(100), nullable=False), sa.Column("full_name", sa.String(150), nullable=False), sa.Column("avatar_url", sa.String(2048)))
    op.create_table("m1_organizations", sa.Column("id", sa.String(36), primary_key=True), sa.Column("name", sa.String(150), nullable=False), sa.Column("kind", sa.String(20), nullable=False), sa.Column("owner_id", sa.String(36), sa.ForeignKey("m1_users.id"), nullable=False))
    op.create_table("m1_memberships", sa.Column("organization_id", sa.String(36), sa.ForeignKey("m1_organizations.id"), primary_key=True), sa.Column("user_id", sa.String(36), sa.ForeignKey("m1_users.id"), primary_key=True), sa.Column("role", sa.String(20), nullable=False))
    op.create_table("m1_sessions", sa.Column("token_hash", sa.String(64), primary_key=True), sa.Column("user_id", sa.String(36), sa.ForeignKey("m1_users.id"), nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False))
    op.create_table("m1_invitations", sa.Column("token_hash", sa.String(64), primary_key=True), sa.Column("organization_id", sa.String(36), sa.ForeignKey("m1_organizations.id"), nullable=False), sa.Column("invited_by", sa.String(36), sa.ForeignKey("m1_users.id"), nullable=False), sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False), sa.Column("accepted", sa.Boolean(), nullable=False))

def downgrade():
    for table in ("m1_invitations", "m1_sessions", "m1_memberships", "m1_organizations", "m1_users"):
        op.drop_table(table)
