"""
Dependency injection container.

All service instances are created per-request using Flask's `g` object
so that the SQLAlchemy session is properly scoped to the request lifetime.
"""
from flask import g, current_app
from extensions import db
from repositories.postgres.dataroom_repo import PostgresDataroomRepository
from repositories.postgres.folder_repo import PostgresFolderRepository
from repositories.postgres.file_repo import PostgresFileRepository
from repositories.postgres.member_repo import PostgresMemberRepository
from repositories.postgres.share_link_repo import PostgresShareLinkRepository
from repositories.postgres.drive_token_repo import PostgresDriveTokenRepository
from services.dataroom_service import DataroomService
from services.folder_service import FolderService
from services.file_service import FileService
from services.drive_service import DriveService
from services.member_service import MemberService
from services.share_service import ShareService
from storage.disk import DiskStorage


def _session():
    return db.session


def _storage():
    if "storage" not in g:
        base_path = current_app.config.get("STORAGE_PATH", "./uploads")
        g.storage = DiskStorage(base_path)
    return g.storage


def get_dataroom_service() -> DataroomService:
    session = _session()
    return DataroomService(
        dataroom_repo=PostgresDataroomRepository(session),
        member_repo=PostgresMemberRepository(session),
    )


def get_folder_service() -> FolderService:
    session = _session()
    return FolderService(
        folder_repo=PostgresFolderRepository(session),
        member_repo=PostgresMemberRepository(session),
    )


def get_file_service() -> FileService:
    session = _session()
    return FileService(
        file_repo=PostgresFileRepository(session),
        member_repo=PostgresMemberRepository(session),
        storage=_storage(),
    )


def get_drive_service() -> DriveService:
    session = _session()
    cfg = current_app.config
    return DriveService(
        drive_token_repo=PostgresDriveTokenRepository(session),
        file_repo=PostgresFileRepository(session),
        member_repo=PostgresMemberRepository(session),
        storage=_storage(),
        client_id=cfg["GOOGLE_CLIENT_ID"],
        client_secret=cfg["GOOGLE_CLIENT_SECRET"],
        redirect_uri=cfg["GOOGLE_REDIRECT_URI"],
        encryption_key=cfg["ENCRYPTION_KEY"],
    )


def get_member_service() -> MemberService:
    session = _session()
    return MemberService(
        member_repo=PostgresMemberRepository(session),
    )


def get_share_service() -> ShareService:
    session = _session()
    return ShareService(
        share_repo=PostgresShareLinkRepository(session),
        member_repo=PostgresMemberRepository(session),
        folder_repo=PostgresFolderRepository(session),
        file_repo=PostgresFileRepository(session),
    )
