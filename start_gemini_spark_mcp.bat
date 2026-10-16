@echo off
title Antigravity MCP Server + Cloudflare Tunnel
echo =======================================================
echo Starting Antigravity IDE - Gemini Spark MCP Server
echo =======================================================

echo [1/3] Stopping any old MCP Server or Cloudflare processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8085 ^| findstr LISTENING') do (
    taskkill /f /pid %%a >nul 2>&1
)
taskkill /f /im cloudflared.exe >nul 2>&1
timeout /t 1 >nul

echo [2/3] Starting updated Antigravity MCP Server on port 8085...
start "Antigravity MCP Python Server" python gemini_spark_mcp_server.py
timeout /t 2 >nul

echo [3/3] Starting Cloudflare HTTPS Tunnel...
echo Copy the "https://....trycloudflare.com" URL shown below and paste into Gemini:
echo ==============================================================================
"C:\Users\nikil\AppData\Local\Microsoft\WinGet\Packages\Cloudflare.cloudflared_Microsoft.Winget.Source_8wekyb3d8bbwe\cloudflared.exe" tunnel --url http://localhost:8085 --logfile cloudflared.log

pause
