# Change Log

All notable changes to the "autocommit" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [1.2.0] - 2025-12-06

### Added

- **Inline Code Edit:** Transform selected code using natural language instructions via Gemini 2.0 Flash.
- **Optimistic UI:** Visual "Red vs Green" diff view for reviewing AI code changes inline.
- **CodeLens Controls:** Interactive "Accept Change" and "Reject Change" buttons directly in the editor.
- **New Keybindings:**
  - `Ctrl+Alt+K`: Trigger Inline Edit.
  - `Ctrl+Alt+C`: Trigger Commit Message Generation.

## [1.1.0] - 2025-12-03

### New Features

- Implemented a "AutoCommit Actions" sidebar with an interactive tree view and auto-refresh.

### Improvements

- Refactored command logic into `src/commands.js` for better modularity and maintenance.
- Updated extension icons and sidebar name for improved clarity and visual appeal.

## [1.0.1] - 2025-11-29

### Changed

- Internal logic refactored into `extension.js` for better maintainability.

## [1.0.0] - 2025-11-29

### Added

- **Interactive Review:** Implemented interactive review mode with toggleable cross-check.
- **Customization:** Added custom prompt support, expanded tones, and settings for Conventional Commits.
- **Auto-Fill:** Added configuration option to auto-fill commit messages.

## [0.0.6] - 2025-11-29

### Changed

- Improved commit message generation with progress UI and error handling.

## [0.0.5] - 2025-11-29

## [0.0.1] - Initial Release

- Basic commit message generation using Gemini API.
- Support for Conventional Commits.
- Basic "Professional" tone.
