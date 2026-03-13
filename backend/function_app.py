import azure.functions as func
from app.main import app

# Azure Functions v2 プログラミングモデル — FastAPI を ASGI でラップ
# 認証は FastAPI 側の JWT で処理するため、http_auth_level は ANONYMOUS に設定
app_func = func.AsgiFunctionApp(app=app, http_auth_level=func.AuthLevel.ANONYMOUS)
