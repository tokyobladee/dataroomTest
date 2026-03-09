"""add file_id to share_links

Revision ID: b1c2d3e4f5a6
Revises: 22b0d353dd47
Create Date: 2026-03-09 00:00:00

"""
from alembic import op
import sqlalchemy as sa

revision = 'b1c2d3e4f5a6'
down_revision = '22b0d353dd47'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('share_links', sa.Column('file_id', sa.String(), nullable=True))
    op.create_foreign_key('fk_share_links_file_id', 'share_links', 'files', ['file_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    op.drop_constraint('fk_share_links_file_id', 'share_links', type_='foreignkey')
    op.drop_column('share_links', 'file_id')
