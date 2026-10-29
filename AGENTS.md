# AGENTS.md — Autopilot & Autonomous Execution Policy

## 🚀 Autonomous Execution Mode (Autopilot)

This project operates in **Autopilot / Zero-Friction Autonomous Mode** to maximize development velocity and eliminate token waste from unnecessary permission prompts:

### 1. In-Project File Operations (100% Auto-Approved)
- **Read & Search**: Automatically inspect, search, and read any file in `NIKIL-LABCORE-ELIS-OS` without asking for permission.
- **Create & Write**: Automatically create new files, directories, and boilerplate needed for feature implementation or testing.
- **Edit & Refactor**: Automatically apply code changes, surgical line edits, bug fixes, and updates directly to existing files.
- **NO Approval Stalls**: Never ask "Should I proceed?", "Do you want me to edit this?", or "May I make this change?". Proceed immediately with implementation.

### 2. Terminal & Command Execution (100% Auto-Approved)
- Automatically run all required commands:
  - `npm`, `npx`, `node`, `python`, `git`
  - TypeScript compilation and typechecks (`npm run typecheck`, `tsc --noEmit`)
  - Test suites (`npm test`)
  - Prisma generation (`prisma generate`, `prisma migrate`)
- Inspect command outputs and self-correct errors autonomously without stopping to ask the user.

### 3. Token Conservation Protocol
- Consolidate actions: Perform multi-file edits and verification in the same execution turn.
- Do not waste round-trip turns on conversational acknowledgments before taking action.
- Report exact diffs and verification proofs upon completion.

### 4. Safety Guardrails (Only Exceptions Requiring Prompt)
- Destructive operations targeting files outside this repository directory.
- Deletion or exposure of private credentials or secrets (`.env` production secrets).
- Dropping production databases or irreversible data destruction.
