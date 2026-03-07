import os
from flask import Flask, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials

from config import configs as config_by_name
from extensions import db


def create_app(config_name: str | None = None) -> Flask:
    if config_name is None:
        config_name = os.environ.get("FLASK_ENV", "development")

    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # --- Extensions ---
    db.init_app(app)
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", "*")}},
        allow_headers=["Authorization", "Content-Type"],
        methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    )

    # --- Firebase Admin SDK ---
    if not firebase_admin._apps:
        service_account_path = app.config.get("FIREBASE_SERVICE_ACCOUNT_PATH")
        if service_account_path and os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
        else:
            # Fallback: use Application Default Credentials (Cloud Run / GCP)
            cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)

    # --- Blueprints ---
    from routes.datarooms import bp as datarooms_bp
    from routes.folders import bp as folders_bp
    from routes.files import bp as files_bp
    from routes.members import bp as members_bp
    from routes.share import bp as share_bp
    from routes.drive import bp as drive_bp

    app.register_blueprint(datarooms_bp)
    app.register_blueprint(folders_bp)
    app.register_blueprint(files_bp)
    app.register_blueprint(members_bp)
    app.register_blueprint(share_bp)
    app.register_blueprint(drive_bp)

    # --- Request lifecycle: commit or rollback ---
    @app.teardown_appcontext
    def shutdown_session(exc):
        if exc is None:
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
                raise
        else:
            db.session.rollback()
        db.session.remove()

    # --- Global error handlers ---
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"error": "Internal server error"}), 500

    # --- Health check ---
    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
