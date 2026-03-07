from flask import Blueprint, g, jsonify, request
from middleware.auth import require_auth

bp = Blueprint("folders", __name__, url_prefix="/api/datarooms/<dataroom_id>/folders")


@bp.route("", methods=["GET"])
@require_auth
def list_folders(dataroom_id: str):
    from container import get_folder_service
    svc = get_folder_service()
    try:
        folders = svc.list(dataroom_id, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    return jsonify([f.__dict__ for f in folders])


@bp.route("", methods=["POST"])
@require_auth
def create_folder(dataroom_id: str):
    from container import get_folder_service
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    parent_id = data.get("parentId") or None
    if not name:
        return jsonify({"error": "name is required"}), 400
    svc = get_folder_service()
    try:
        folder = svc.create(dataroom_id, name, parent_id, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 409
    return jsonify(folder.__dict__), 201


@bp.route("/<folder_id>", methods=["PATCH"])
@require_auth
def rename_folder(dataroom_id: str, folder_id: str):
    from container import get_folder_service
    data = request.get_json(force=True)
    name = (data.get("name") or "").strip()
    if not name:
        return jsonify({"error": "name is required"}), 400
    svc = get_folder_service()
    try:
        folder = svc.rename(folder_id, name, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 409
    return jsonify(folder.__dict__)


@bp.route("/<folder_id>", methods=["DELETE"])
@require_auth
def delete_folder(dataroom_id: str, folder_id: str):
    from container import get_folder_service
    svc = get_folder_service()
    try:
        svc.delete(folder_id, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return "", 204
