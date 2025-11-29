# Change Log

All notable changes to the "autocommit" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## [0.0.6] - 2025-11-29

### Added
- **Interactive Review Mode:** Introduced a "Cross-Check" menu that lets you Accept, Regenerate, or Copy the generated commit message before applying it.
- **New Configuration Settings:**
  - `commitMessageGenerator.crossCheck`: Enable/disable the interactive review menu.
  - `commitMessageGenerator.customPrompt`: specificy custom system instructions to override default tones.
  - `commitMessageGenerator.useCustomPrompt`: Toggle to easily switch between custom prompts and preset tones.
- **New Commands:**
  - `AutoCommit : Toggle Commit Cross-Check`
  - `AutoCommit : Set Custom Prompt`
  - `AutoCommit : Toggle Custom Prompt`
- **Expanded Tones:** Added new fun personalities including "Bollywood Drama", "Cyberpunk", "Anime Tsundere", "Medieval", and more.

### Changed
- **Refactoring:** Moved core logic and command handlers to `commands.js` to improve code maintainability and separation of concerns.
- **Documentation:** completely rewrote `README.md` to accurately reflect all features, configuration options, and commands.
- **File Structure:** Renamed `discription.md` to `description.md`.

## [0.0.1] - Initial Release
- Basic commit message generation using Gemini API.
- Support for Conventional Commits.
- Basic "Professional" tone.
