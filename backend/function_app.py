"""
Azure Functions v2 エントリポイント
FastAPI アプリ (app.main.app) を AsgiFunctionApp でラップして Azure Functions として公開する。

注意:
- http_auth_level は ANONYMOUS に設定（認証は FastAPI 側の JWT ミドルウェアで処理）
- host.json の routePrefix を空文字にすることで FastAPI の /api/* パスが二重にならない
- 既存の app/main.py の Mangum ハンドラは AWS Lambda 専用。Azure Functions はこのファイルをエントリポイントとして使う
"""

import azure.functions as func
from app.main import app as fastapi_app

# AsgiFunctionApp が FastAPI の ASGI インターフェースをラップして HTTP トリガーとして登録する
azure_app = func.AsgiFunctionApp(
    app=fastapi_app,
    http_auth_level=func.AuthLevel.ANONYMOUS,
)
