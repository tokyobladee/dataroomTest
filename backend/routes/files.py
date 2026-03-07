from flask import Blueprint, g, jsonify, request, send_file
import io
from middleware.auth import require_auth

bp = Blueprint("files", __name__, url_prefix="/api/datarooms/<dataroom_id>/files")


@bp.route("", methods=["GET"])
@require_auth
def list_files(dataroom_id: str):
    from container import get_file_service
    folder_id = request.args.get("folderId") or None
    svc = get_file_service()
    try:
        files = svc.list(dataroom_id, g.user_uid, folder_id)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    return jsonify([f.__dict__ for f in files])


@bp.route("", methods=["POST"])
@require_auth
def upload_file(dataroom_id: str):
    from container import get_file_service
    if "file" not in request.files:
        return jsonify({"error": "file is required"}), 400
    upload = request.files["file"]
    folder_id = request.form.get("folderId") or None
    name = upload.filename or "untitled"
    data = upload.read()
    mime_type = upload.mimetype or "application/octet-stream"
    svc = get_file_service()
    try:
        file_dto = svc.upload(dataroom_id, folder_id, name, data, mime_type, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    return jsonify(file_dto.__dict__), 201


@bp.route("/<file_id>", methods=["GET"])
@require_auth
def download_file(dataroom_id: str, file_id: str):
    from container import get_file_service
    svc = get_file_service()
    try:
        data, mime_type, file_name = svc.get_content(dataroom_id, file_id, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    as_attachment = request.args.get("download") == "1"
    return send_file(
        io.BytesIO(data),
        mimetype=mime_type or "application/octet-stream",
        as_attachment=as_attachment,
        download_name=file_name if as_attachment else None,
    )


@bp.route("/<file_id>", methods=["PATCH"])
@require_auth
def update_file(dataroom_id: str, file_id: str):
    from container import get_file_service
    data = request.get_json(force=True)
    svc = get_file_service()
    try:
        if "folderId" in data:
            folder_id = data.get("folderId")  # may be None (move to root)
            file_dto = svc.move(dataroom_id, file_id, folder_id, g.user_uid)
        else:
            name = (data.get("name") or "").strip()
            if not name:
                return jsonify({"error": "name is required"}), 400
            file_dto = svc.rename(dataroom_id, file_id, name, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify(file_dto.__dict__)


@bp.route("/<file_id>", methods=["DELETE"])
@require_auth
def delete_file(dataroom_id: str, file_id: str):
    from container import get_file_service
    svc = get_file_service()
    try:
        svc.delete(dataroom_id, file_id, g.user_uid)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 403
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    return "", 204
