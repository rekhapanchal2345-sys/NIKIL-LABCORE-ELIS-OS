"""
Gemini Spark to Antigravity IDE Bridge - MCP Server
Exposes Antigravity IDE workspace and tools to Gemini Spark via Model Context Protocol (MCP).
"""

import os
import sys
import json
import uuid
import glob
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn

WORKSPACE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="Antigravity IDE MCP Bridge for Gemini Spark")

# Enable wide CORS for Google Cloud and browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tool Definitions compliant with MCP Schema
TOOLS_DEFINITION = [
    {
        "name": "get_antigravity_ide_status",
        "description": "Get current Antigravity IDE status, active workspace details, and environment state.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "get_workspace_summary",
        "description": "Get high-level summary and architecture overview of the current Antigravity project workspace.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": []
        }
    },
    {
        "name": "list_workspace_files",
        "description": "List files and subdirectories in the Antigravity workspace.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "subfolder": {
                    "type": "string",
                    "description": "Optional subfolder relative to workspace root (e.g. 'src', 'backend', 'client')."
                }
            },
            "required": []
        }
    },
    {
        "name": "read_workspace_file",
        "description": "Read the contents of a specific file inside the Antigravity workspace.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Relative path to the file inside workspace (e.g. 'package.json' or 'backend/server.js')."
                },
                "max_lines": {
                    "type": "integer",
                    "description": "Optional maximum number of lines to read (default: 300)."
                }
            },
            "required": ["file_path"]
        }
    },
    {
        "name": "search_workspace_code",
        "description": "Search for a keyword, function name, or pattern across files in the workspace.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Keyword or phrase to search for."
                },
                "extension": {
                    "type": "string",
                    "description": "Optional file extension to restrict search (e.g. '.js', '.py', '.json')."
                }
            },
            "required": ["query"]
        }
    }
]

def execute_tool(name: str, arguments: Dict[str, Any]) -> str:
    """Execute tool and return string result."""
    try:
        if name == "get_antigravity_ide_status":
            return json.dumps({
                "status": "connected",
                "ide": "Google Antigravity IDE",
                "active_project": "NIKIL-LABCORE-ELIS-OS",
                "workspace_path": str(WORKSPACE_DIR),
                "mcp_version": "2024-11-05",
                "bridge": "Active - Live StreamableHTTP"
            }, indent=2)

        elif name == "get_workspace_summary":
            return (
                "Project: NIKIL-LABCORE-ELIS-OS\n"
                "Description: Laboratory Information System (LIS) / Clinical LabCore Operating System.\n"
                "Architecture: Full-stack node & python architecture with client portal, backend APIs, "
                "patient registration, billing audit, clinical diagnostics, and adapters.\n"
                f"Root Directory: {WORKSPACE_DIR}\n"
            )

        elif name == "list_workspace_files":
            sub = arguments.get("subfolder", "").strip("/\\")
            target = WORKSPACE_DIR / sub if sub else WORKSPACE_DIR
            if not target.exists():
                return f"Path does not exist: {sub}"
            
            entries = []
            for item in sorted(target.iterdir()):
                if item.name.startswith(".git"):
                    continue
                kind = "[DIR] " if item.is_dir() else "[FILE]"
                entries.append(f"{kind} {item.name}")
            return "\n".join(entries[:100])

        elif name == "read_workspace_file":
            rel_path = arguments.get("file_path", "").strip("/\\")
            target = (WORKSPACE_DIR / rel_path).resolve()
            
            # Security check: must stay inside workspace
            if not str(target).startswith(str(WORKSPACE_DIR)):
                return "Error: Cannot access files outside the workspace."
            
            if not target.exists() or not target.is_file():
                return f"Error: File not found: {rel_path}"
            
            max_lines = int(arguments.get("max_lines", 300))
            lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
            snippet = "\n".join(lines[:max_lines])
            if len(lines) > max_lines:
                snippet += f"\n... [Truncated: showing {max_lines} of {len(lines)} lines]"
            return snippet

        elif name == "search_workspace_code":
            query = arguments.get("query", "").lower()
            ext = arguments.get("extension", "")
            matches = []
            
            for path in WORKSPACE_DIR.rglob("*"):
                if path.is_file() and not any(p in path.parts for p in [".git", "node_modules", ".venv", "__pycache__"]):
                    if ext and not path.name.endswith(ext):
                        continue
                    try:
                        content = path.read_text(encoding="utf-8", errors="ignore")
                        for idx, line in enumerate(content.splitlines(), start=1):
                            if query in line.lower():
                                rel = path.relative_to(WORKSPACE_DIR)
                                matches.append(f"{rel}:{idx}: {line.strip()[:120]}")
                                if len(matches) >= 30:
                                    break
                    except Exception:
                        pass
                if len(matches) >= 30:
                    break
            
            if not matches:
                return f"No matches found for query: '{query}'"
            return "\n".join(matches)

        else:
            return f"Unknown tool: {name}"

    except Exception as e:
        return f"Tool execution failed: {str(e)}"


def handle_jsonrpc(req_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Handle standard JSON-RPC 2.0 requests for MCP."""
    req_id = req_data.get("id")
    method = req_data.get("method")
    params = req_data.get("params", {})

    print(f"[MCP] Received method: {method} (id={req_id})")

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "tools": {"listChanged": False}
                },
                "serverInfo": {
                    "name": "Antigravity-IDE-Bridge",
                    "version": "1.0.0"
                }
            }
        }

    elif method == "notifications/initialized":
        # Notification: no response required
        return None

    elif method == "ping":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {}
        }

    elif method == "tools/list":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": TOOLS_DEFINITION
            }
        }

    elif method == "tools/call":
        tool_name = params.get("name")
        tool_args = params.get("arguments", {})
        print(f"[MCP] Calling tool: {tool_name} with args {tool_args}")
        tool_output = execute_tool(tool_name, tool_args)
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "content": [
                    {
                        "type": "text",
                        "text": tool_output
                    }
                ],
                "isError": False
            }
        }

    else:
        # Default fallback for unimplemented or optional MCP methods
        if req_id is not None:
            return {
                "jsonrpc": "2.0",
                "id": req_id,
                "result": {}
            }
        return None


@app.get("/")
@app.get("/mcp")
async def mcp_get(request: Request):
    """Handle GET requests - returns server info or SSE stream if requested."""
    accept = request.headers.get("accept", "")
    if "text/event-stream" in accept:
        session_id = str(uuid.uuid4())
        async def event_generator():
            yield f"event: endpoint\ndata: /mcp?sessionId={session_id}\n\n"
        return StreamingResponse(event_generator(), media_type="text/event-stream")
    
    return JSONResponse({
        "status": "online",
        "service": "Antigravity IDE MCP Server for Gemini Spark",
        "mcp_endpoint": "/mcp",
        "version": "1.0.0",
        "available_tools": [t["name"] for t in TOOLS_DEFINITION]
    })


@app.post("/")
@app.post("/mcp")
@app.post("/messages")
async def mcp_post(request: Request):
    """Handle POST JSON-RPC requests."""
    try:
        body = await request.json()
    except Exception:
        return Response(status_code=400, content="Invalid JSON body")

    if isinstance(body, list):
        # Batch requests
        responses = []
        for single in body:
            resp = handle_jsonrpc(single)
            if resp:
                responses.append(resp)
        return JSONResponse(responses)
    else:
        resp = handle_jsonrpc(body)
        if resp is None:
            return Response(status_code=204)
        return JSONResponse(resp)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8085))
    print(f"[START] Starting Antigravity MCP Server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
