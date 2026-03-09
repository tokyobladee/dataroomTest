from functools import wraps
from flask import request, g, jsonify
import firebase_admin
from firebase_admin import auth as firebase_auth

# Allow up to 10 seconds of clock skew between client and server
_CLOCK_SKEW = 10


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
            decoded = firebase_auth.verify_id_token(token, clock_skew_seconds=_CLOCK_SKEW)
        except Exception as e:
            import logging
            logging.getLogger(__name__).error("verify_id_token failed: %s: %s", type(e).__name__, e)
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
                decoded = firebase_auth.verify_id_token(token, clock_skew_seconds=_CLOCK_SKEW)
                g.user_uid = decoded["uid"]
            except Exception:
                pass
        return f(*args, **kwargs)
    return decorated
