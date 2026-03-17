# Recruitment-Candidate-Assessment

智聘评估 - 招聘需求智能评估系统

## Overview

A desktop application for HR recruitment assessment, powered by multiple AI providers (OpenAI / Claude / DeepSeek). Built with Svelte 5 + SvelteKit + Electron for a seamless desktop experience.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Svelte 5 + SvelteKit + TypeScript |
| Styling | Tailwind CSS v4 |
| Desktop | Electron |
| Database | SQLite (better-sqlite3) |
| AI | OpenAI / Claude / DeepSeek (Strategy Pattern) |
| Charts | Chart.js v4 |

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Type check
npm run check

# Build
npm run build
```

## Project Structure

```
src/
  routes/          # Page routes (SvelteKit)
  lib/
    components/    # UI components
    services/      # Business logic (AI, resume parsing)
    stores/        # Svelte stores
    db/            # SQLite DAO layer
    types/         # TypeScript type definitions
electron/          # Electron desktop shell
```

## Changelog

See [Releases](https://github.com/xuxianbang1993/Recruitment-Candidate-Assessment/releases) for version history.

## License

Private - Internal use only.
