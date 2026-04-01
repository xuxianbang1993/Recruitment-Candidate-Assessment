# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-03-31

### Added
- `docx ^9.6.1` dependency for Word document generation support
- `marked ^17.0.4` dependency for Markdown parsing support

### Removed
- Archived Phase 3 checkpoint and review documents

## [1.1.0] - 2026-03-25

### Added
- Job category selector (management/sales/expert/support) with auto-fill dimensions and weights
- `job-templates.ts` config module — single source of truth for 4 V2.0 category templates
- Behavioral anchor context in AI evaluation and report prompts
- Dimension definitions display in ReportDimensions component
- Interview question suggestions in ReportSuggestions with low-score highlighting
- DB migration 002: `jobs.category` column
- Pure helper modules: `job-form-helpers.ts`, `report-data.ts`
- 4 targeted test files for new logic

### Changed
- `Job` type now includes `category` field
- AI prompts include behavioral anchors when job has a category set
- VisualReport passes `category` and `scores` to sub-components

## [1.0.0] - 2026-03-19

### Added
- Phase 0-5 complete: scaffold, data layer, resume parsing, AI services, API routes, frontend UI, Electron desktop packaging
- SQLite database with WAL mode, 5 DAOs
- AI evaluation with OpenAI/Claude/DeepSeek strategy pattern
- Resume parsing for PDF/Word/TXT
- Visual report with radar chart, KPI cards, dimension analysis
- Electron desktop app packaging
