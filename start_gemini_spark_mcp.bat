@echo off
echo =======================================================
echo Starting Antigravity IDE - Gemini Spark MCP Server
echo =======================================================

start "Antigravity MCP Server" python gemini_spark_mcp_server.py
timeout /t 2 >nul

echo Starting Cloudflare HTTPS Tunnel...
"C:\Users\nikil\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe" tunnel --url http://localhost:8085

pause
