"""
Gemini Spark / Gemini 4 Argon to Antigravity IDE Bridge - MCP Server
Exposes full Antigravity IDE workspace operations (Read, Write, Edit, Create, List, Search)
to Gemini Spark via Model Context Protocol (MCP).
"""

import os
import sys
import json
import uuid
import glob
import shutil
import asyncio
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn

WORKSPACE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="Antigravity IDE MCP Bridge for Gemini Spark")

# Allow all origins (including gemini.google.com, AI Studio, Cloudflare tunnels, and localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

def _resolve_safe_path(rel_path: str) -> Optional[Path]:
    """Resolve a relative workspace path safely, ensuring no path traversal outside workspace."""
    if not rel_path:
        return None
    clean = rel_path.strip().replace("\\", "/").lstrip("/")
    target = (WORKSPACE_DIR / clean).resolve()
    try:
        target.relative_to(WORKSPACE_DIR)
        return target
    except ValueError:
        return None

# Tool Definitions compliant with MCP Schema
TOOLS_DEFINITION = [
    {
        "name": "get_antigravity_ide_status",
        "description": "Get current Antigravity IDE status, active workspace details, and server state.",
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
        "description": "List files and subdirectories in the Antigravity workspace. Supports optional subfolder and recursive exploration.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "subfolder": {
                    "type": "string",
                    "description": "Optional subfolder relative to workspace root (e.g. 'frontend', 'src', 'backend')."
                },
                "recursive": {
                    "type": "boolean",
                    "description": "Whether to list files recursively (default: false)."
                },
                "max_depth": {
                    "type": "integer",
                    "description": "Maximum directory depth when recursive is true (default: 3)."
                }
            },
            "required": []
        }
    },
    {
        "name": "read_workspace_file",
        "description": "Read the contents of a specific file inside the Antigravity workspace with pagination and line number options.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Relative path to the file inside workspace (e.g. 'package.json' or 'frontend/src/App.tsx')."
                },
                "start_line": {
                    "type": "integer",
                    "description": "Starting line number (1-indexed, default: 1)."
                },
                "max_lines": {
                    "type": "integer",
                    "description": "Maximum number of lines to read (default: 1000, 0 for unlimited)."
                }
            },
            "required": ["file_path"]
        }
    },
    {
        "name": "write_workspace_file",
        "description": "Create, paste, or overwrite a file inside the Antigravity workspace. Automatically creates parent folders.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Relative path to the file inside workspace (e.g. 'frontend/src/components/NewComponent.tsx')."
                },
                "content": {
                    "type": "string",
                    "description": "Full text or code content to write into the file."
                }
            },
            "required": ["file_path", "content"]
        }
    },
    {
        "name": "edit_workspace_file",
        "description": "Edit an existing file by searching for target text and replacing it with new text.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Relative path to the file inside workspace."
                },
                "target_text": {
                    "type": "string",
                    "description": "Exact text substring in the file to be replaced."
                },
                "replacement_text": {
                    "type": "string",
                    "description": "New text to substitute in place of target_text."
                },
                "allow_multiple": {
                    "type": "boolean",
                    "description": "If true, replaces all occurrences. Default is false (single replacement)."
                }
            },
            "required": ["file_path", "target_text", "replacement_text"]
        }
    },
    {
        "name": "create_workspace_folder",
        "description": "Create a new directory/folder hierarchy inside the workspace.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "folder_path": {
                    "type": "string",
                    "description": "Relative path of the folder to create (e.g. 'frontend/src/utils/new_module')."
                }
            },
            "required": ["folder_path"]
        }
    },
    {
        "name": "delete_workspace_file",
        "description": "Delete a file or folder inside the workspace.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Relative path of the file or folder to delete."
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
                    "description": "Optional file extension to restrict search (e.g. '.js', '.py', '.json', '.tsx')."
                },
                "max_results": {
                    "type": "integer",
                    "description": "Maximum search matches to return (default: 30)."
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "get_audit_plan",
        "description": "Get key findings, checklist items, and architecture notes from the Enterprise ELIS OS Audit Plan (DAY-1 GEMINI 4 ARGON).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "max_lines": {
                    "type": "integer",
                    "description": "Maximum lines of audit notes to return (default: 150)."
                }
            },
            "required": []
        }
    }
]

def execute_tool(name: str, arguments: Dict[str, Any]) -> str:
    """Execute requested MCP tool and return string result."""
    try:
        if name == "get_antigravity_ide_status":
            return json.dumps({
                "status": "connected",
                "ide": "Google Antigravity IDE",
                "active_project": "NIKIL-LABCORE-ELIS-OS",
                "workspace_path": str(WORKSPACE_DIR),
                "mcp_version": "2024-11-05",
                "bridge": "Active - Live StreamableHTTP / SSE",
                "available_tools": [t["name"] for t in TOOLS_DEFINITION]
            }, indent=2)

        elif name == "get_workspace_summary":
            return (
                "Project: NIKIL-LABCORE-ELIS-OS\n"
                "Description: Laboratory Information System (LIS) / Clinical LabCore Operating System.\n"
                "Architecture: Full-stack node & python architecture with client portal, backend APIs, "
                "patient registration, billing audit, clinical diagnostics, and adapters.\n"
                f"Root Directory: {WORKSPACE_DIR}\n"
            )

        elif name == "get_audit_plan":
            audit_file = WORKSPACE_DIR / "ANTIGRAVITY DAY-1.txt"
            if not audit_file.exists():
                return "Audit plan file 'ANTIGRAVITY DAY-1.txt' not found."
            max_lines = int(arguments.get("max_lines", 150))
            lines = audit_file.read_text(encoding="utf-8", errors="replace").splitlines()
            return "\n".join(lines[:max_lines])

        elif name == "list_workspace_files":
            sub = arguments.get("subfolder", "").strip()
            recursive = bool(arguments.get("recursive", False))
            max_depth = int(arguments.get("max_depth", 3))
            target = _resolve_safe_path(sub) if sub else WORKSPACE_DIR
            if not target or not target.exists():
                return f"Path does not exist: {sub}"

            ignored_dirs = {".git", "node_modules", ".venv", "__pycache__", ".next", "dist", "build", ".turbo", ".agent"}
            entries = []

            if recursive:
                for root, dirs, files in os.walk(target):
                    rel_root = Path(root).relative_to(WORKSPACE_DIR)
                    depth = len(rel_root.parts) if str(rel_root) != "." else 0
                    if depth > max_depth:
                        continue
                    # Exclude noise folders from recursive traversal
                    dirs[:] = [d for d in dirs if d not in ignored_dirs and not d.startswith(".git")]
                    for d in sorted(dirs):
                        p = Path(root) / d
                        entries.append(f"[DIR]  {p.relative_to(WORKSPACE_DIR)}")
                        if len(entries) >= 200:
                            break
                    for f in sorted(files):
                        p = Path(root) / f
                        entries.append(f"[FILE] {p.relative_to(WORKSPACE_DIR)}")
                        if len(entries) >= 200:
                            break
                    if len(entries) >= 200:
                        entries.append("... [Truncated at 200 entries]")
                        break
            else:
                for item in sorted(target.iterdir()):
                    if item.name.startswith(".git") or item.name in ignored_dirs:
                        continue
                    kind = "[DIR] " if item.is_dir() else "[FILE]"
                    entries.append(f"{kind} {item.name}")
                    if len(entries) >= 150:
                        entries.append("... [Truncated at 150 entries]")
                        break

            return "\n".join(entries) if entries else "(empty folder)"

        elif name == "read_workspace_file":
            rel_path = arguments.get("file_path", "")
            target = _resolve_safe_path(rel_path)
            if not target:
                return "Error: Cannot access files outside the workspace."
            if not target.exists() or not target.is_file():
                return f"Error: File not found: {rel_path}"

            start_line = max(1, int(arguments.get("start_line", 1)))
            max_lines = int(arguments.get("max_lines", 1000))
            lines = target.read_text(encoding="utf-8", errors="replace").splitlines()
            total_lines = len(lines)

            start_idx = start_line - 1
            if max_lines > 0:
                selected = lines[start_idx:start_idx + max_lines]
            else:
                selected = lines[start_idx:]

            snippet = "\n".join(selected)
            if start_idx + len(selected) < total_lines:
                snippet += f"\n... [Truncated: showing {len(selected)} lines (lines {start_line}-{start_idx + len(selected)}) of {total_lines} total lines]"
            return snippet

        elif name == "write_workspace_file":
            rel_path = arguments.get("file_path", "")
            content = arguments.get("content", "")
            target = _resolve_safe_path(rel_path)
            if not target:
                return "Error: Cannot write files outside the workspace."
            if target.is_dir():
                return f"Error: Target path '{rel_path}' is an existing directory, not a file."

            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")
            return f"Successfully wrote {len(content)} characters to {rel_path}"

        elif name == "edit_workspace_file":
            rel_path = arguments.get("file_path", "")
            target_text = arguments.get("target_text", "")
            replacement_text = arguments.get("replacement_text", "")
            allow_multiple = bool(arguments.get("allow_multiple", False))

            target = _resolve_safe_path(rel_path)
            if not target:
                return "Error: Cannot edit files outside the workspace."
            if not target.exists() or not target.is_file():
                return f"Error: File not found: {rel_path}"

            content = target.read_text(encoding="utf-8", errors="replace")
            if target_text not in content:
                return f"Error: target_text was not found in {rel_path}."

            occurrences = content.count(target_text)
            if occurrences > 1 and not allow_multiple:
                return f"Error: target_text occurs {occurrences} times in {rel_path}. Set allow_multiple=True or provide a more specific unique snippet."

            new_content = content.replace(target_text, replacement_text) if allow_multiple else content.replace(target_text, replacement_text, 1)
            target.write_text(new_content, encoding="utf-8")
            return f"Successfully edited {rel_path} ({occurrences if allow_multiple else 1} occurrence(s) replaced)."

        elif name == "create_workspace_folder":
            folder_path = arguments.get("folder_path", "")
            target = _resolve_safe_path(folder_path)
            if not target:
                return "Error: Cannot create folders outside the workspace."

            target.mkdir(parents=True, exist_ok=True)
            return f"Successfully created folder: {folder_path}"

        elif name == "delete_workspace_file":
            rel_path = arguments.get("file_path", "")
            target = _resolve_safe_path(rel_path)
            if not target:
                return "Error: Cannot delete files outside the workspace."
            if not target.exists():
                return f"Error: Path does not exist: {rel_path}"
            if target == WORKSPACE_DIR:
                return "Error: Cannot delete the root workspace directory."

            if target.is_file():
                target.unlink()
                return f"Successfully deleted file: {rel_path}"
            elif target.is_dir():
                shutil.rmtree(target)
                return f"Successfully deleted directory: {rel_path}"

        elif name == "search_workspace_code":
            query = arguments.get("query", "").lower()
            ext = arguments.get("extension", "")
            max_results = int(arguments.get("max_results", 30))
            matches = []

            for path in WORKSPACE_DIR.rglob("*"):
                if path.is_file() and not any(p in path.parts for p in [".git", "node_modules", ".venv", "__pycache__", ".next", "dist", "build"]):
                    if ext and not path.name.endswith(ext):
                        continue
                    try:
                        content = path.read_text(encoding="utf-8", errors="ignore")
                        for idx, line in enumerate(content.splitlines(), start=1):
                            if query in line.lower():
                                rel = path.relative_to(WORKSPACE_DIR)
                                matches.append(f"{rel}:{idx}: {line.strip()[:140]}")
                                if len(matches) >= max_results:
                                    break
                    except Exception:
                        pass
                if len(matches) >= max_results:
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
        protocol_version = params.get("protocolVersion", "2024-11-05")
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": protocol_version,
                "capabilities": {
                    "tools": {"listChanged": False},
                    "resources": {"subscribe": False, "listChanged": False},
                    "prompts": {"listChanged": False}
                },
                "serverInfo": {
                    "name": "NIKIL-LABCORE-ELIS-OS",
                    "version": "1.1.0"
                }
            }
        }

    elif method in ["notifications/initialized", "initialized"]:
        # Notification: no response required
        return None

    elif method == "ping":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {}
        }

    elif method in ["tools/list", "tool/list"]:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "tools": TOOLS_DEFINITION
            }
        }

    elif method in ["resources/list", "resource/list"]:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "resources": []
            }
        }

    elif method in ["prompts/list", "prompt/list"]:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "prompts": []
            }
        }

    elif method in ["tools/call", "tool/call"]:
        tool_name = params.get("name") or params.get("tool")
        tool_args = params.get("arguments") or params.get("parameters") or {}
        if not isinstance(tool_args, dict):
            tool_args = {}

        print(f"[MCP] Calling tool: {tool_name} with args {tool_args}")
        tool_output = execute_tool(tool_name, tool_args)
        is_error = isinstance(tool_output, str) and (tool_output.startswith("Error:") or tool_output.startswith("Tool execution failed:"))

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
                "isError": is_error
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
@app.get("/sse")
async def mcp_get(request: Request):
    """Handle GET requests - returns server info or SSE stream if requested."""
    accept = request.headers.get("accept", "")
    is_sse = "text/event-stream" in accept or request.url.path == "/sse"

    if is_sse:
        session_id = str(uuid.uuid4())
        async def event_generator():
            yield f"event: endpoint\ndata: /mcp?sessionId={session_id}\n\n"
            try:
                while True:
                    await asyncio.sleep(15)
                    yield ": ping\n\n"
            except asyncio.CancelledError:
                pass
        return StreamingResponse(
            event_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    return JSONResponse({
        "status": "online",
        "service": "NIKIL-LABCORE-ELIS-OS MCP Server for Gemini Spark & Gemini 4 Argon",
        "mcp_endpoint": "/mcp",
        "version": "1.1.0",
        "available_tools": [t["name"] for t in TOOLS_DEFINITION]
    })


@app.post("/")
@app.post("/mcp")
@app.post("/sse")
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
