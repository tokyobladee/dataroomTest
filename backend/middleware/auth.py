from functools import wraps
from flask import request, g, jsonify
import firebase_admin
from firebase_admin import auth as firebase_auth


def require_auth(f):
    """
    Decorator that verifies the Firebase ID token in the Authorization header.
    Sets g.user_uid to the verified UID on success.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid Authorization header"}), 401
        token = auth_header[len("Bearer "):]
        try:
            decoded = firebase_auth.verify_id_token(token)
        except firebase_admin.exceptions.FirebaseError:
            return jsonify({"error": "Invalid or expired token"}), 401
        g.user_uid = decoded["uid"]
        return f(*args, **kwargs)
    return decorated


def optional_auth(f):
    """
    Like require_auth but doesn't reject unauthenticated requests.
    Sets g.user_uid to None if no valid token is present.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        g.user_uid = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer "):]
            try:
                decoded = firebase_auth.verify_id_token(token)
                g.user_uid = decoded["uid"]
            except Exception:
                pass
        return f(*args, **kwargs)
    return decorated
