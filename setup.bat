@echo off
setlocal enabledelayedexpansion
chcp 65001 > nul

:: ============================================================
::  TeamManagementTool - セットアップスクリプト (Windows)
:: ============================================================

set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "VENV=%BACKEND%\.venv"
set "ENV_FILE=%BACKEND%\.env"

call :print_header

:: ============================================================
:: [1] 前提条件チェック
:: ============================================================
call :section "前提条件の確認"

:: Python チェック
call :check_command python --version "Python"
if errorlevel 1 (
    call :error "Python が見つかりません。https://www.python.org/ からインストールしてください。"
    goto :abort
)

:: Node.js チェック
call :check_command node --version "Node.js"
if errorlevel 1 (
    call :error "Node.js が見つかりません。https://nodejs.org/ からインストールしてください。"
    goto :abort
)

:: npm チェック
call :check_command npm --version "npm"
if errorlevel 1 (
    call :error "npm が見つかりません。Node.js を再インストールしてください。"
    goto :abort
)

call :ok "前提条件の確認が完了しました"

:: ============================================================
:: [2] バックエンド - 仮想環境の作成
:: ============================================================
call :section "バックエンド: Python 仮想環境の作成"

if exist "%VENV%\Scripts\python.exe" (
    call :info "仮想環境が既に存在します。スキップします。"
) else (
    call :run "python -m venv "%VENV%""
    if errorlevel 1 (
        call :error "仮想環境の作成に失敗しました。"
        goto :abort
    )
    call :ok "仮想環境を作成しました: %VENV%"
)

:: ============================================================
:: [3] バックエンド - 依存パッケージのインストール
:: ============================================================
call :section "バックエンド: 依存パッケージのインストール"

call :run ""%VENV%\Scripts\pip.exe" install --upgrade pip -q"
call :run ""%VENV%\Scripts\pip.exe" install -r "%BACKEND%\requirements.txt""
if errorlevel 1 (
    call :error "pip install に失敗しました。"
    goto :abort
)
call :ok "バックエンドの依存パッケージをインストールしました"

:: ============================================================
:: [4] バックエンド - .env ファイルの作成
:: ============================================================
call :section "バックエンド: .env ファイルの設定"

if exist "%ENV_FILE%" (
    call :info ".env が既に存在します。スキップします。"
) else (
    (
        echo MONGODB_URL=mongodb://localhost:27017
        echo MONGODB_DB_NAME=teamboard
        echo JWT_SECRET_KEY=change-this-secret-key-in-production
        echo JWT_ACCESS_TOKEN_EXPIRE_MINUTES=480
        echo CORS_ORIGINS=http://localhost:5173
    ) > "%ENV_FILE%"
    if errorlevel 1 (
        call :error ".env ファイルの作成に失敗しました。"
        goto :abort
    )
    call :ok ".env ファイルを作成しました: %ENV_FILE%"
    call :warn "本番環境では JWT_SECRET_KEY を必ず変更してください。"
)

:: ============================================================
:: [5] フロントエンド - npm install
:: ============================================================
call :section "フロントエンド: npm パッケージのインストール"

call :run "npm install --prefix "%FRONTEND%""
if errorlevel 1 (
    call :error "npm install に失敗しました。"
    goto :abort
)
call :ok "フロントエンドの依存パッケージをインストールしました"

:: ============================================================
:: 完了メッセージ
:: ============================================================
echo.
echo ============================================================
echo   セットアップが完了しました！
echo ============================================================
echo.
echo  起動方法:
echo.
echo  [1] MongoDB を起動してください。
echo.
echo  [2] バックエンドを起動:
echo      %BACKEND%\.venv\Scripts\activate
echo      uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
echo      (カレントディレクトリを %BACKEND% に移動してから実行)
echo.
echo  [3] フロントエンドを起動:
echo      cd %FRONTEND%
echo      npm run dev
echo.
echo  アクセス先:
echo    フロントエンド : http://localhost:5173
echo    バックエンド   : http://localhost:8000
echo    Swagger UI     : http://localhost:8000/docs
echo.
echo  デフォルトアカウント:
echo    admin   : admin@teamboard.example    / admin1234
echo    manager : manager@teamboard.example  / manager1234
echo.
goto :end

:abort
echo.
echo ============================================================
echo   セットアップが中断されました。
echo   エラーを修正してから再実行してください。
echo ============================================================
echo.
exit /b 1

:end
pause
exit /b 0

:: ============================================================
:: サブルーチン
:: ============================================================

:print_header
echo.
echo ============================================================
echo   TeamManagementTool - セットアップスクリプト
echo ============================================================
echo.
exit /b 0

:section
echo.
echo ---- %~1 ----
exit /b 0

:check_command
for /f "tokens=*" %%v in ('%~1 2^>^&1') do set "_ver=%%v"
if errorlevel 1 (
    echo   [ERROR] %~2 : 未検出
    exit /b 1
)
echo   [OK]    %~2 : !_ver!
exit /b 0

:run
echo   ^> %~1
%~1
exit /b %errorlevel%

:ok
echo   [OK]    %~1
exit /b 0

:info
echo   [INFO]  %~1
exit /b 0

:warn
echo   [WARN]  %~1
exit /b 0

:error
echo   [ERROR] %~1
exit /b 0
