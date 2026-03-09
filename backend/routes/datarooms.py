from flask import Blueprint, g, jsonify, request
from middleware.auth import require_auth

bp = Blueprint("datarooms", __name__, url_prefix="/api/datarooms")


@bp.route("", methods=["GET"])
@require_auth
def list_datarooms():
    from container import get_dataroom_service
    svc = get_dataroom_service()
    rooms = svc.list_for_user(g.user_uid)
    return jsonify([r.__dict__ for r in rooms])


@bp.route("", methods=["POST"])
@require_auth
def create_dataroom():
    from container import get_dataroom_service
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    svc = get_dataroom_service()
    room = svc.create(name, g.user_uid)
    return jsonify(room.__dict__), 201


@bp.route("/<dataroom_id>", methods=["GET"])
@require_auth
def get_dataroom(dataroom_id: str):
    from container import get_dataroom_service
    svc = get_dataroom_service()
    try:
        room = svc.get(dataroom_id, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify(room.__dict__)


@bp.route("/<dataroom_id>", methods=["PATCH"])
@require_auth
def rename_dataroom(dataroom_id: str):
    from container import get_dataroom_service
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    svc = get_dataroom_service()
    try:
        room = svc.rename(dataroom_id, name, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify(room.__dict__)


@bp.route("/<dataroom_id>", methods=["DELETE"])
@require_auth
def delete_dataroom(dataroom_id: str):
    from container import get_dataroom_service
    svc = get_dataroom_service()
    try:
        svc.delete(dataroom_id, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return "", 204
