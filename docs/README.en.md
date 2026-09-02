# docs — Project documentation (SSOT)

> 🇰🇷 [README.md](./README.md) is canonical. This file mirrors it in English.

This folder is the **single source of truth** for both humans and AI tools (Claude, ChatGPT/Codex, Cursor, Copilot, …). The root `AGENTS.md`, `CLAUDE.md` and `ChatGPT.md` all point here. If code and docs disagree, fix one of them so they match.

## Folders

| Folder | Contents | Update when |
|---|---|---|
| [`progress/`](./progress/README.md) | Progress log (newest first), [roadmap](./progress/roadmap.md) | **every work session** |
| [`tech/`](./tech/README.md) | Technical docs — product overview, architecture, data model, data sources, AI, setup, decision records (ADR) | structure / schema / sources / AI / setup change |
| [`logs/`](./logs/README.md) | Run logs, errors and how they were fixed | when hitting or fixing an error |
| [`review/`](./review/README.md) | Code review records — findings, suggestions, whether applied | when reviewing |
| [`verification/`](./verification/README.md) | Per-AI-model verification records — who actually ran and confirmed what, and what nobody has checked yet | **every work session** (update the status table) |
| [`prompts/`](./prompts/README.md) | Model-agnostic prompts — copy the session-start, per-task and session-end prompts from here whatever model you use | when a prompt is lacking or a model keeps making the same mistake |

## Rules for AI tools

0. Start a new session by pasting `prompts/00-bootstrap.md` and end it with `prompts/90-session-end.md`.
1. Before working, read `progress/README.md`, `tech/overview.md`, `tech/architecture.md`, plus the `tech/` doc for the area you touch.
2. **Do not guess** what the docs don't say — check the code or ask the user.
3. After working, always add an entry to `progress/README.md` (date, what was done, next steps).
4. If you changed structure / schema / sources / AI / setup, update the matching `tech/` doc; add an ADR under `tech/decisions/` for significant technical choices.
5. Record errors in `logs/`, code reviews in `review/`.
6. Each session, write `verification/YYYY-MM-DD-<model>.md` with **what was actually executed and confirmed** and **what was not**, and update the status table in `verification/README.md`. Never mark something verified that was not run.
7. Docs are in Korean (English mirrors as `*.en.md` for core docs); code identifiers stay in English.
