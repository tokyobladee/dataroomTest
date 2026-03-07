from datetime import datetime, timezone, timedelta

from cryptography.fernet import Fernet
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

from repositories.base import DriveTokenRepository, FileRepository, MemberRepository, FileDTO
from storage.base import StorageBackend

DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


class DriveService:
    def __init__(
        self,
        drive_token_repo: DriveTokenRepository,
        file_repo: FileRepository,
        member_repo: MemberRepository,
        storage: StorageBackend,
        client_id: str,
        client_secret: str,
        redirect_uri: str,
        encryption_key: bytes,
    ):
        self._tokens = drive_token_repo
        self._files = file_repo
        self._members = member_repo
        self._storage = storage
        self._client_id = client_id
        self._client_secret = client_secret
        self._redirect_uri = redirect_uri
        self._fernet = Fernet(encryption_key)

    # ------------------------------------------------------------------
    # OAuth flow
    # ------------------------------------------------------------------

    def get_authorization_url(self, state: str) -> str:
        flow = self._make_flow()
        auth_url, _ = flow.authorization_url(
            access_type="offline",
            include_granted_scopes="true",
            state=state,
            prompt="consent",  # always prompt to ensure refresh_token is returned
        )
        return auth_url

    def handle_callback(self, user_uid: str, code: str) -> None:
        flow = self._make_flow()
        flow.fetch_token(code=code)
        creds = flow.credentials

        refresh_token_encrypted = self._fernet.encrypt(creds.refresh_token.encode()).decode()
        expires_at = creds.expiry.replace(tzinfo=timezone.utc) if creds.expiry else None

        self._tokens.upsert(
            user_uid=user_uid,
            refresh_token_encrypted=refresh_token_encrypted,
            access_token=creds.token,
            expires_at=expires_at,
        )

    def get_access_token(self, user_uid: str) -> str:
        """Return a valid access token, refreshing if needed."""
        token = self._tokens.get(user_uid)
        if not token:
            raise PermissionError("Drive not connected")

        now = datetime.now(timezone.utc)
        needs_refresh = token.expires_at is None or token.expires_at <= now + timedelta(minutes=5)

        if needs_refresh or not token.access_token:
            refresh_token = self._fernet.decrypt(token.refresh_token_encrypted.encode()).decode()
            creds = Credentials(
                token=None,
                refresh_token=refresh_token,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=self._client_id,
                client_secret=self._client_secret,
            )
            creds.refresh(Request())  # noqa: F821 — imported below

            expires_at = creds.expiry.replace(tzinfo=timezone.utc) if creds.expiry else None
            self._tokens.upsert(
                user_uid=user_uid,
                refresh_token_encrypted=token.refresh_token_encrypted,
                access_token=creds.token,
                expires_at=expires_at,
            )
            return creds.token

        return token.access_token

    def disconnect(self, user_uid: str) -> None:
        self._tokens.delete(user_uid)

    def is_connected(self, user_uid: str) -> bool:
        return self._tokens.get(user_uid) is not None

    def list_drive_files(self, user_uid: str, page_token: str | None = None) -> dict:
        """Return a page of files from the user's Google Drive."""
        access_token = self.get_access_token(user_uid)
        creds = Credentials(token=access_token)
        drive = build("drive", "v3", credentials=creds)
        params = {
            "pageSize": 50,
            "fields": "nextPageToken,files(id,name,size,mimeType,modifiedTime)",
            "q": "trashed=false",
        }
        if page_token:
            params["pageToken"] = page_token
        result = drive.files().list(**params).execute()
        return result

    # ------------------------------------------------------------------
    # Import
    # ------------------------------------------------------------------

    def import_file(self, dataroom_id: str, folder_id: str | None,
                    drive_file_id: str, user_uid: str) -> FileDTO:
        self._assert_role(dataroom_id, user_uid, ("owner", "editor"))

        access_token = self.get_access_token(user_uid)
        creds = Credentials(token=access_token)
        drive = build("drive", "v3", credentials=creds)

        # Fetch metadata
        meta = drive.files().get(
            fileId=drive_file_id,
            fields="id,name,size,mimeType"
        ).execute()

        # Download file bytes
        request = drive.files().get_media(fileId=drive_file_id)
        data = request.execute()

        import uuid
        file_id = str(uuid.uuid4())
        storage_path = self._storage.save(file_id, data)

        return self._files.create(
            dataroom_id=dataroom_id,
            folder_id=folder_id,
            name=meta["name"],
            size=int(meta.get("size", len(data))),
            mime_type=meta.get("mimeType", "application/pdf"),
            storage_path=storage_path,
            uploaded_by_uid=user_uid,
        )

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _make_flow(self) -> Flow:
        return Flow.from_client_config(
            {
                "web": {
                    "client_id": self._client_id,
                    "client_secret": self._client_secret,
                    "redirect_uris": [self._redirect_uri],
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                }
            },
            scopes=DRIVE_SCOPES,
            redirect_uri=self._redirect_uri,
        )

    def _assert_role(self, dataroom_id: str, user_uid: str, allowed_roles: tuple) -> None:
        member = self._members.get(dataroom_id, user_uid)
        if not member or member.role not in allowed_roles:
            raise PermissionError("Insufficient permissions")


# Lazy import to avoid circular issues
from google.auth.transport.requests import Request  # noqa: E402
