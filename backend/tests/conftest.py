"""
テスト全体の共通設定。
アプリのモジュールよりも先に環境変数を上書きして、
テスト専用の MongoDB データベースを使用する。
"""
import os

# --- アプリのインポートより前に環境変数を設定 ---
os.environ.setdefault("MONGODB_URL", "mongodb://localhost:27017")
os.environ["MONGODB_DB_NAME"] = "teamboard_test"
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-for-testing-only")
os.environ["ALLOWED_EMAILS"] = ""  # 全員許可
