# Hot Update Feature Design

## Overview

Add a "Check for Updates" button to the sidebar that pulls the latest code from GitHub, installs dependencies if needed, and lets Vite HMR hot-reload changes automatically.

## Target Environment

- Local development: `git clone` + `npm run dev` (Vite dev server)
- Browser access at `localhost:5173`
- No exe packaging involved

## Architecture

```
User clicks "Check Updates"
    |
GET /api/system/update       <-- check for new version
    | (git fetch + compare HEAD)
Has updates -> show commit list
    |
User confirms -> POST /api/system/update  <-- apply update
    |
git pull -> detect package.json changes -> npm install (if needed)
    |
Vite HMR auto-reloads -> page refreshes automatically
    |
Done (prompt restart only if dependencies changed)
```

## Components

### 1. Backend API: `src/routes/api/system/update/+server.ts`

**GET** - Check for updates:
- Run `git fetch origin main`
- Compare local HEAD vs `origin/main` HEAD
- Return: `{ hasUpdate, currentVersion, commits[], behindCount }`

**POST** - Apply update:
- Record current `package.json` hash
- Run `git pull origin main`
- Compare `package.json` hash — if changed, run `npm install`
- Return: `{ success, updatedFiles, needsRestart }`

### 2. Version API: `src/routes/api/system/version/+server.ts`

**GET** - Return current version from `package.json`

### 3. Frontend UI: Sidebar bottom section

- Current version display (e.g., "v1.4.0")
- "Check Updates" button
- Update progress overlay with steps: pulling... installing... done
- Result notification

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Update source | `git pull origin main` | Simplest for git-managed deployment |
| Hot reload | Rely on Vite HMR | Dev mode natively supports it |
| Dependency update | Detect package.json change, auto `npm install` | Ensure new deps are installed |
| Manual restart | Only when deps change | Prompt via dialog |
| Version source | `package.json` version field | Single source of truth |

## Security

- API runs on `127.0.0.1` only, not exposed externally
- Use `execFile` (not `exec`) to avoid command injection
- Only pull from `origin main`, no user-configurable remote
- Git operations run in the project root (cwd), not user-supplied paths

## Files to Create/Modify

1. **NEW** `src/lib/server/services/updater.ts` — git operations service
2. **NEW** `src/routes/api/system/update/+server.ts` — update API
3. **NEW** `src/routes/api/system/version/+server.ts` — version API
4. **MODIFY** `src/lib/components/layout/Sidebar.svelte` — add update button + version display
