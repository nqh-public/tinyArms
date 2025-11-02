# Changelog

All notable changes to tinyArms will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-11-02

### Added

#### Phase 1: Environment Setup
- **Dependencies**: Clean npm install with all production and dev dependencies
- **Build System**: TypeScript compilation working correctly (`npm run build`)
- **ESLint Config**: Basic configuration for TypeScript linting
- **Package Distribution**: Added `files` field to package.json for npm publishing

#### Core CLI Implementation
- **CLI Framework**: Commander.js-based CLI with `--version` support
- **Constitutional Linting**: Complete `lint <file>` command implementation
  - Constitution loading from `~/.tinyarms/principles.md`
  - Ollama integration via qwen2.5-coder:3b-instruct model
  - Token budget enforcement (25k max response tokens)
  - Response format control (concise/detailed modes)
  - Exit codes (0 = clean, 1 = violations or error)
- **Skills Management**: `skills list` and `skills info` commands
  - Auto-discovery from `skills/` directory
  - YAML frontmatter parsing
  - Token budget tracking per skill

#### Infrastructure
- **Skill Registry**: Auto-discovery system for skills with metadata
  - Discovered: `code-linting-fast` (15k token budget)
  - Format: OpenSkills-compatible SKILL.md files
- **Logging System**: SQLite + JSON Lines for lint execution tracking
- **Model Management**: ModelChecker utility for Ollama model availability
- **Token Counting**: Token budget enforcement and response truncation

#### MCP Server (Stub)
- **Server Structure**: MCP SDK integration with stdio transport
- **Tools Defined**: review_code, organize_files, research_context
- **Type Safety**: Proper MCP response format with content blocks
- **Status**: Stubs only, returns placeholder data

### Fixed
- ES module imports now include `.js` extensions for Node.js compatibility
- MCP server type errors resolved (CallToolRequestSchema handler)
- TypeScript compilation now completes without errors

### Documentation
- Comprehensive architecture documentation (40+ files)
- CLAUDE.md for AI assistant context
- QUICKSTART.md for user onboarding
- README.md with project overview
- Skills documentation (code-linting-fast SKILL.md)

### Testing Requirements
- **Runtime Dependency**: Requires Ollama running locally
- **Model Required**: qwen2.5-coder:3b-instruct (~1.9GB download)
- **Constitution File**: Needs `~/.tinyarms/principles.md` for linting
- **Test File**: `test-example.ts` provided for manual testing

### Known Limitations
- Ollama must be installed and running (not included in package)
- Model download is manual (1.9GB, one-time)
- Only `code-linting-fast` skill is functional
- MCP tools are stubs (TODO implementation)
- No automated tests yet (vitest configured but tests need Ollama)
- Tiered routing not implemented (direct Level 2 calls only)
- Semantic caching not implemented

### Technical Details
- **Node.js**: >=18.0.0 required
- **Package Type**: ES modules
- **TypeScript**: Strict mode enabled
- **Dependencies**: 16 production packages
- **Dev Dependencies**: 245 total packages (includes transitive)
- **Build Output**: `dist/` directory with compiled JavaScript
- **Binary**: `dist/cli.js` (executable via `tinyarms` command)

### Resource Profile
- **Base Memory**: ~50-100MB (Node.js + app)
- **With Ollama**: +1-2GB (Ollama daemon)
- **With Model Loaded**: +2GB (qwen2.5-coder:3b in memory)
- **Total Runtime**: ~3-4GB RAM recommended

### Distribution Readiness
- ✅ Package.json properly configured
- ✅ Build pipeline functional
- ✅ CLI entry point working
- ✅ Files whitelist for npm
- ⚠️ No prepublishOnly hook yet
- ⚠️ No setup.sh script (referenced in docs)
- ⚠️ No CI/CD workflow
- ❌ Tests cannot run without Ollama

### Next Steps (v0.2.0)
- Add setup.sh script for installation
- Implement MCP tool logic (wire to existing linter)
- Add CI/CD workflow (GitHub Actions)
- Create integration tests (with Ollama mock)
- Implement prepublishOnly hook
- Add progress indicators (ora/listr)
- Implement tiered routing (Level 0-3)
- Add semantic caching

---

## [Unreleased]

### Planned Features
- LaunchAgent integration for macOS background watching
- File naming skill implementation
- Markdown analysis skill implementation
- Audio actions skill implementation
- Prompt evolution system
- Multi-model support (Gemma 3, jan-nano)
- Linux support
- Homebrew tap distribution

[0.1.0]: https://github.com/nqh-public/tinyArms/releases/tag/v0.1.0
