# GSD Methodology — Mission Control Rules

> **Get Shit Done**: A spec-driven, context-engineered development methodology.
> 
> These rules enforce disciplined, high-quality autonomous development.

---

## Canonical Rules

**All canonical rules are in [PROJECT_RULES.md](../PROJECT_RULES.md).**

This file provides Gemini-specific integration. For the complete methodology, see PROJECT_RULES.md.

---

## Core Principles

1. **Plan Before You Build** — No code without specification
2. **State Is Sacred** — Every action updates persistent memory
3. **Context Is Limited** — Prevent degradation through hygiene
4. **Verify Empirically** — No "trust me, it works"

---

## Quick Reference

```
Before coding    → Check SPEC.md is FINALIZED
Before file read → Search first, then targeted read
After each task  → Update STATE.md
After 3 failures → State dump + fresh session
Before "Done"    → Empirical proof captured
```

---

## Workflow Integration

These rules integrate with the GSD workflows:

| Workflow | Rules Enforced |
|----------|----------------|
| `/map` | Updates ARCHITECTURE.md, STACK.md |
| `/plan` | Enforces Planning Lock, creates ROADMAP |
| `/execute` | Enforces State Persistence after each task |
| `/verify` | Enforces Empirical Validation |
| `/pause` | Triggers Context Hygiene state dump |
| `/resume` | Loads state from STATE.md |

---

## Gemini-Specific Tips

For Gemini-specific enhancements, see [adapters/GEMINI.md](../adapters/GEMINI.md).

Key recommendations:
- **Flash** for quick iterations and simple edits
- **Pro** for complex planning and analysis
- Large context is available but **search-first** still applies

## Autopilot & Token Conservation Protocol

1. **Auto-Approve Project Work**: Never ask for confirmation before routine file reads, writes, edits, or test execution within this repository.
2. **Execute First, Report After**: Apply the necessary code changes and run verification commands autonomously in a single turn instead of stalling for user approval.
3. **Zero Token Waste**: Do not generate back-and-forth approval loops ("Should I proceed?").
4. **Safety Exception**: Only pause for explicit confirmation on irreversible external destruction (dropping production DB, deleting outside project root).

---

*GSD Methodology adapted for Google Antigravity*
*Canonical rules: [PROJECT_RULES.md](../PROJECT_RULES.md) & [AGENTS.md](../AGENTS.md)*
*Source: https://github.com/glittercowboy/get-shit-done*

