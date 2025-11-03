> **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algorithms unchanged. Reference: docs/01-SWIFT-ARCHITECTURE-OVERVIEW.md


# Plugin Architecture Patterns Research

**Research Date**: 2025-10-30
**Status**: Researched - Ready for Architecture Integration
**Phase**: 02 (Architecture Planning for Skills System)
**Expected Impact**: Foundation for scalable skill system architecture

---

## Executive Summary

Analyzed 4 industry plugin architectures (VSCode, Obsidian, Neovim, Webpack) to identify best practices for tinyArms skills system. Key finding: **Activation Events** (lazy loading) + **Hook-based Registration** (pub-sub) is the universal pattern. This document synthesizes these patterns into recommendations for tinyArms.

**Recommended Approach for tinyArms**: Hybrid of Webpack Tapable (hook-based orchestration) + VSCode activation events (lazy loading) + Obsidian settings management (user control).

---

## Comparison Table: Discovery | Registration | Lifecycle | Config

| System | Discovery | Registration | Lifecycle | Config |
|--------|-----------|--------------|-----------|--------|
| **VSCode** | File glob: `package.json` in extensions dir | `package.json` → `activationEvents` + `contributes` | activate() → command exec → deactivate() | JSON manifest + runtime settings API |
| **Obsidian** | npm-style registry (community plugins list) | `manifest.json` + `main.js` entry | onload() → API calls → onunload() | `manifest.json` + SettingsTab UI + persist to disk |
| **Neovim Lazy.nvim** | File glob: `~/.config/nvim/lua/plugins/*.lua` | Lua table spec (name/dir/url required) | Auto-import → lazy-load by event/cmd/ft/key → cleanup | Lua tables merged + `lazy-lock.json` version tracking |
| **Webpack Tapable** | npm registry + `package.json` | Class `.apply(compiler)` → `.tap()/tapAsync/tapPromise()` | Class instantiation → hook registration → plugin execution → cleanup | Constructor args + hook name identification |

---

## System-by-System Analysis

### 1. VSCode Extensions (Most Mature, Microsoft-Backed)

**GitHub**: https://github.com/microsoft/vscode-extension-samples (9.8k stars)

#### Discovery
```
~/.vscode/extensions/
  ├── extension1/
  │   ├── package.json ← Manifest (name, version, engines, activationEvents, contributes)
  │   ├── extension.js/ts ← Entry point (exports activate/deactivate)
  │   └── node_modules/
```

**Mechanism**: File system scan for `package.json` during startup. No registry lookup (unlike npm).

#### Registration
```json
{
  "activationEvents": [
    "onLanguage:markdown",
    "onCommand:extension.helloWorld",
    "workspaceContains:**/*.config.json",
    "onStartupFinished"
  ],
  "contributes": {
    "commands": [
      { "command": "extension.helloWorld", "title": "Hello World" }
    ],
    "keybindings": [
      { "command": "extension.helloWorld", "key": "ctrl+shift+p" }
    ]
  }
}
```

**Key insight**: Activation events are **pull-based** - extension declares "I want to activate when X happens", VSCode calls activate() only then.

#### Lifecycle
```typescript
export function activate(context: vscode.ExtensionContext) {
  // Initialize, register commands, event listeners
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.helloWorld', () => {})
  );
}

export function deactivate() {
  // Cleanup (optional)
}
```

**Characteristics**:
- Single activation per session
- Subscriptions managed by context object
- No explicit plugin-to-plugin dependencies
- Error in one extension doesn't crash others

#### Configuration
```typescript
// Runtime settings
const config = vscode.workspace.getConfiguration('myExtension');
const value = config.get('setting.key');

// Settings persistence
await config.update('setting.key', newValue, vscode.ConfigurationTarget.Global);
```

**Storage**: `.vscode/settings.json` (workspace) or `~/Library/Application Support/Code/User/settings.json` (user)

#### Strengths
- **Declarative**: Activation intent clear in manifest
- **Lazy-loading**: Extensions only active when needed
- **Isolated**: Error handling per extension
- **Versioned**: `engines.vscode` prevents incompatibility

#### Weaknesses
- **No built-in dependency graph**: Extensions can't declare "run after X"
- **String-based activation**: Hard to compose complex conditions
- **Limited cross-extension communication**: No official pub-sub (plugins reach out manually)

---

### 2. Obsidian Plugins (Community-Focused, TypeScript)

**GitHub**: https://github.com/obsidianmd/obsidian-sample-plugin (no star count, official template)

#### Discovery
```
Official Registry (community-plugins.json)
  ├── Scans plugins on GitHub with obsidian.json manifest
  ├── Validates build artifacts (main.js, manifest.json)
  └── Auto-downloads to ~/.obsidian/plugins/

User Manual Install:
  ~/.obsidian/plugins/<plugin-id>/
    ├── manifest.json
    ├── main.js (compiled from TS)
    └── styles.css (optional)
```

**Mechanism**: Obsidian periodically syncs public registry. Users can also drop folders manually.

#### Registration
```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "minAppVersion": "0.12.0",
  "description": "What this does",
  "author": "Me",
  "authorUrl": "https://example.com",
  "isDesktopOnly": true
}
```

**Key insight**: Obsidian doesn't have activation events. All plugins load on startup, but init is cheap.

#### Lifecycle
```typescript
import { Plugin, PluginSettingTab, App, Setting } from 'obsidian';

export default class MyPlugin extends Plugin {
  async onload() {
    // Initialize
    this.addCommand({
      id: 'my-command',
      name: 'Do something',
      callback: () => { /* ... */ }
    });

    this.addSettingTab(new MyPluginSettings(this.app, this));
  }

  async onunload() {
    // Cleanup (registered commands auto-remove)
  }
}
```

**Characteristics**:
- Single `onload()` / `onunload()` pair
- Plugin class manages all state
- Settings auto-saved to `data.json`
- Event subscription auto-cleanup on unload

#### Configuration
```typescript
// In SettingsTab subclass
new Setting(containerEl)
  .setName('My Setting')
  .setDesc('Describe it')
  .addText((text) => text.setValue(this.plugin.settings.mySetting)
    .onChange(async (value) => {
      this.plugin.settings.mySetting = value;
      await this.plugin.saveSettings();
    }));

// Auto-saved to .obsidian/plugins/<id>/data.json
```

**Storage**: `.obsidian/plugins/<plugin-id>/data.json` (JSON-serialized plugin.settings object)

#### Strengths
- **Zero activation overhead**: Simple init cost acceptable since plugins load on startup
- **Auto-cleanup**: Subscriptions managed by plugin class (unload removes all)
- **Settings UI pattern**: Consistent SettingsTab for user config
- **TypeScript-first**: Full type definitions in obsidian.d.ts

#### Weaknesses
- **No lazy-loading**: All plugins load (even if unused), slows startup
- **No activation events**: Can't trigger plugin from external events
- **Startup blocking**: Settings load synchronously
- **Registry is npm + manual review**: Slower to publish than npm

---

### 3. Neovim Lazy.nvim (Modern, Declarative)

**GitHub**: https://github.com/folke/lazy.nvim (9.8k stars)

#### Discovery
```
~/.config/nvim/lua/plugins/
  ├── core.lua       ← {import = "plugins.core"}
  ├── lsp.lua        ← {import = "plugins.lsp"}
  ├── ui.lua         ← Plugin specs
  └── tools.lua

plugins/
  ├── {
  │   "username/repo",
  │   name = "custom-name" (optional)
  │ }
  └── (Automatic resolution via github URL)
```

**Mechanism**: Lazy.nvim scans `~/.config/nvim/lua/plugins/*.lua`, merges tables, auto-detects package URLs.

#### Registration
```lua
{
  "folke/trouble.nvim",

  -- Source definition
  dir = "~/plugins/trouble",  -- OR
  url = "https://github.com/folke/trouble.nvim",

  -- Lazy-loading triggers
  event = "VeryLazy",            -- Load on startup (deferred)
  cmd = "Trouble",               -- Load when command invoked
  ft = {"python", "lua"},        -- Load for filetype
  keys = { { "<leader>xx", "<cmd>Trouble<cr>" } },

  -- Dependencies
  dependencies = { "nvim-tree/nvim-web-devicons" },

  -- Configuration
  opts = { height = 10 },        -- Passed to setup()
  config = function(_, opts)     -- Manual config
    require("trouble").setup(opts)
  end,

  -- Conditional
  enabled = true,                -- Can be function
  cond = function() return vim.fn.has("win32") == 0 end,
}
```

**Key insight**: **Spec is a Lua table** that describes plugin metadata + lazy-loading rules. Lazy.nvim processes this declaratively.

#### Lifecycle
```lua
require("lazy").setup({
  { import = "plugins" },        -- Auto-import all specs
  -- specs merged, dependencies ordered
  -- plugins installed if missing
  -- each plugin loaded per its event/cmd/ft/keys rules
})

-- Cleanup handled automatically
```

**Characteristics**:
- **Dependency ordering**: Lazy.nvim topologically sorts plugins by dependencies
- **Conditional loading**: `cond` and `enabled` support predicates
- **Module auto-detection**: `main = "trouble"` finds `trouble/init.lua`
- **Version tracking**: `lazy-lock.json` pins exact Git commits

#### Configuration
```lua
-- Config passed to plugin's setup() function
opts = {
  -- Plugin-specific options
},

-- Or manual config function
config = function(spec, opts)
  require("my-plugin").setup(opts)
end
```

**Storage**: `lazy-lock.json` for reproducible installs

#### Strengths
- **Declarative + composable**: Specs are data, easy to transform
- **Dependency resolution**: Automatic topological sort
- **Multiple trigger types**: event/cmd/ft/keys composable
- **Lazy by default**: Reduces startup time (Vim startup <50ms with 50+ plugins)
- **Lua-friendly**: Specs are tables, easy to programmatically generate

#### Weaknesses
- **Neovim-only**: Not applicable to other ecosystems
- **Lua learning curve**: Users must know Lua table syntax
- **Event names opaque**: User must know Neovim event names (e.g., `BufEnter *.py`)

---

### 4. Webpack Tapable (Enterprise, Hook-based)

**GitHub**: https://github.com/webpack/tapable (3.3k stars)

#### Discovery
```
package.json
  "dependencies": {
    "my-webpack-plugin": "^1.0.0"  ← npm registry
  }

In webpack.config.js:
  const MyPlugin = require('my-webpack-plugin');
  module.exports = {
    plugins: [new MyPlugin({ /* options */ })]
  }
```

**Mechanism**: npm registry. Plugin instantiated by user in webpack config, not auto-discovered.

#### Registration
```javascript
class MyPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    // Register hooks
    compiler.hooks.compile.tap('MyPlugin', (params) => {
      console.log('Compile starting');
    });

    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
      // Async work
      callback(null);
    });

    compiler.hooks.done.tapPromise('MyPlugin', async (stats) => {
      await doAsyncWork();
    });
  }
}
```

**Key insight**: **Hooks are named "waterfall" or "bail"**, determining execution order when multiple plugins tap same hook.

#### Hook Types (Determines Execution)
```javascript
// Basic: Call all in row
compiler.hooks.myHook.tap('Plugin1', () => console.log('1'));
compiler.hooks.myHook.tap('Plugin2', () => console.log('2'));
// Output: 1, 2

// Waterfall: Pass return value to next
compiler.hooks.compile.tap('MyPlugin', (params) => {
  params.modified = true;
  return params; // → Passed to next plugin
});

// Bail: Exit early if return truthy
compiler.hooks.shouldEmit.tap('MyPlugin', (compilation) => {
  if (shouldSkip) return true; // → Skip remaining plugins
});

// Sync vs Async
.tap()          // Synchronous
.tapAsync()     // Async callback-based
.tapPromise()   // Promise-based
```

#### Lifecycle
```javascript
// Webpack internally:
1. Load all plugins from config
2. Instantiate each: new MyPlugin(options)
3. Call apply(compiler) for each plugin
4. Plugins register hooks via tap/tapAsync/tapPromise
5. Compilation flow triggers hooks → All tapped plugins execute
6. Cleanup automatic (subscriptions not stored externally)
```

**Characteristics**:
- **No explicit activation**: Plugins registered at init time, stay active
- **Multiple plugins per hook**: All execute, order = registration order
- **Hook types control flow**: Waterfall vs Bail determines multi-plugin interaction
- **Error isolation**: Plugin error doesn't crash others (error event tapped by compiler)

#### Configuration
```javascript
module.exports = {
  plugins: [
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.js$/,
      minRatio: 0.8
    })
  ]
};
```

**Storage**: webpack.config.js (user-created, not auto-persisted)

#### Strengths
- **Universal pattern**: Multiple plugins on same hook naturally composable
- **Hook semantics clear**: Waterfall/Bail names describe interaction
- **No installation logic**: Plugin author just provides class
- **Error handling**: Compiler catches plugin errors, logs, continues

#### Weaknesses
- **Manual instantiation**: User must know plugin exists, add to config
- **No lazy-loading**: All plugins instantiated upfront
- **No dependency ordering**: If Plugin A depends on Plugin B output, B must be listed first
- **Hook names not discoverable**: User must read docs to know what hooks exist

---

## Best Practices (3-5 Key Patterns for tinyArms)

### 1. **Activation Events (Lazy-Loading) - ADOPT**

**Source**: VSCode + Lazy.nvim validation
**Why**: tinyArms runs background tasks. Skills should activate only when needed to save memory.

**For tinyArms**:
```typescript
// skills/package.json analog
{
  "skill": "code-linting-fast",
  "activationEvents": [
    "pre-commit",           // Activate for pre-commit hook
    "command:tinyarms.run"  // Activate when user runs CLI
  ],
  "handlers": ["lint"],     // Register handlers
  "config": {
    "constitution_path": "~/.specify/memory/constitution.md"
  }
}
```

**Implementation pattern**:
```typescript
// skills/code-linting-fast/manifest.ts
export const manifest = {
  id: 'code-linting-fast',
  activationEvents: ['pre-commit', 'command:run'],
  handlers: ['lint'],
  // ...
};

// Main skill registry
class SkillRegistry {
  async activate(skillId, trigger) {
    if (manifest.activationEvents.includes(trigger)) {
      await loadSkill(skillId);
    }
  }
}
```

**Expected benefit**: Only running skill loads → 50-70% memory saved vs all skills loaded.

---

### 2. **Hook-Based Orchestration - ADOPT**

**Source**: Webpack Tapable validation
**Why**: Multiple processing steps (Level 0 → Level 1 → Level 2). Hooks allow modular registration.

**For tinyArms**:
```typescript
// Core routing engine
class TinyArmsRouter {
  hooks = {
    preRoute: new SyncHook(),      // Before routing decision
    level0: new AsyncSeriesHook(), // Deterministic rules
    level1: new AsyncSeriesHook(), // Embeddings
    level2: new AsyncSeriesHook(), // Qwen-3B
    level3: new AsyncSeriesHook(), // Qwen-7B
    postRoute: new SyncHook(),     // After routing
  };

  async route(input) {
    this.hooks.preRoute.call(input);

    const result = await this.hooks.level0.promise(input);
    if (result.confidence > 0.8) return result;

    const result = await this.hooks.level1.promise(input);
    if (result.confidence > 0.75) return result;

    // Escalate...

    this.hooks.postRoute.call(result);
    return result;
  }
}

// Skills can tap into hooks
class CodeLintingSkill {
  apply(router) {
    router.hooks.level2.tapPromise('CodeLinting', async (input) => {
      // Lint code
    });
  }
}
```

**Expected benefit**: Skills independently plug into routing pipeline. Adding new skill = just register new hook handler.

---

### 3. **Declarative Manifest + Auto-Import - ADOPT**

**Source**: Obsidian manifest + Lazy.nvim import validation
**Why**: Skills discoverable without manual registration code.

**For tinyArms**:
```
skills/
  ├── code-linting-fast/
  │   ├── skill.ts
  │   ├── manifest.json ← {id, activationEvents, handlers, config}
  │   └── types.ts
  ├── file-naming/
  │   ├── skill.ts
  │   ├── manifest.json
  │   └── types.ts
  └── index.ts ← Auto-imports all manifests

// index.ts
const manifests = glob('*/manifest.json').map(json => require(json));
export const skillRegistry = new Map(manifests.map(m => [m.id, m]));
```

**Auto-registration**:
```typescript
// In CLI entrypoint
async function initializeSkills() {
  for (const [id, manifest] of skillRegistry) {
    if (manifest.activationEvents.includes(triggerType)) {
      const SkillClass = await import(`./skills/${id}/skill`);
      const skill = new SkillClass();
      skill.apply(router);
    }
  }
}
```

**Expected benefit**: New skill added = manifest + skill.ts. Auto-loaded by registry.

---

### 4. **Settings Persistence + User Control - ADOPT**

**Source**: Obsidian SettingsTab + VSCode settings validation
**Why**: Users customize thresholds (confidence > 0.8), model selection, paths.

**For tinyArms**:
```yaml
# ~/.tinyarms/config.yaml (persisted)
skills:
  code-linting-fast:
    enabled: true
    constitution_path: ~/.specify/memory/constitution.md
    rules:
      - hardcoded-colors
      - magic-numbers

  file-naming:
    enabled: false  # Disabled by user
    watch_paths:
      - ~/Downloads/
    model: gemma-3-4b

router:
  level0_threshold: 0.95   # Skip other levels if >95% confident
  level1_threshold: 0.85
  level2_threshold: 0.75
```

**API for skills**:
```typescript
interface SkillConfig {
  enabled: boolean;
  [key: string]: any;
}

class SkillRegistry {
  getConfig(skillId: string): SkillConfig {
    return configManager.get(`skills.${skillId}`);
  }

  setConfig(skillId: string, config: SkillConfig) {
    return configManager.set(`skills.${skillId}`, config);
  }
}
```

**Expected benefit**: Users enable/disable skills without recompiling. Config validated at load time.

---

### 5. **Dependency Ordering + Error Isolation - ADOPT**

**Source**: Lazy.nvim topological sort + Webpack error handling validation
**Why**: Some skills depend on others (file-naming depends on `codebase-analyzer` for context).

**For tinyArms**:
```typescript
// manifest.json
{
  "id": "file-naming",
  "dependencies": [
    "codebase-analyzer"  // Must load before this skill
  ]
}

// Skill registry handles ordering
class SkillRegistry {
  private resolveDependencies(skillId: string): string[] {
    const manifest = this.manifests.get(skillId);
    const all = [skillId];
    for (const dep of manifest.dependencies || []) {
      all.push(...this.resolveDependencies(dep));
    }
    return [...new Set(all)];  // Topological sort via DFS
  }

  async activateSkill(skillId: string) {
    const ordered = this.resolveDependencies(skillId);
    for (const id of ordered) {
      try {
        await this.load(id);
      } catch (error) {
        logger.error(`Skill ${id} failed: ${error.message}`);
        // Continue, don't cascade
      }
    }
  }
}
```

**Error isolation**:
```typescript
// Each skill wraps its execution
async function executeSkillSafely(skillId, input) {
  try {
    const skill = skillRegistry.get(skillId);
    return await skill.execute(input);
  } catch (error) {
    logger.error(`Skill ${skillId} error:`, error);
    metrics.recordFailure(skillId);
    return { error: error.message, fallback: true };
  }
}
```

**Expected benefit**: Skill failure → logged + metrics recorded. Other skills continue. No cascading failures.

---

## Anti-Patterns (What to Avoid)

### ❌ 1. Circular Dependencies
**Problem**: Skill A depends on B, B depends on A → Infinite loop during initialization.
**Solution**: Manifest validation at load time. Reject circular deps with error.

```typescript
function validateDependencies(manifests: Map<string, Manifest>) {
  const visited = new Set();
  const visiting = new Set();

  function hasCycle(id: string): boolean {
    if (visited.has(id)) return false;
    if (visiting.has(id)) return true;

    visiting.add(id);
    const manifest = manifests.get(id);
    for (const dep of manifest.dependencies || []) {
      if (hasCycle(dep)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  }

  for (const [id] of manifests) {
    if (hasCycle(id)) {
      throw new Error(`Circular dependency detected: ${id}`);
    }
  }
}
```

---

### ❌ 2. Shared Mutable State Between Skills
**Problem**: Skill A modifies cache, Skill B reads stale cache → Race conditions.
**Solution**: Immutable updates or atomic transactions.

```typescript
// ❌ BAD
const globalCache = {};
skillA.onComplete(() => globalCache.value = newValue);

// ✅ GOOD
const eventBus = new EventEmitter();
skillA.onComplete((result) => eventBus.emit('skillA:done', result));
skillB.subscribe('skillA:done', (result) => {
  const newCache = { ...globalCache, ...result };
  cacheManager.set(newCache);
});
```

---

### ❌ 3. Blocking on I/O in Hook Handlers
**Problem**: Skill waits for network/disk in hook → Entire router blocked.
**Solution**: Use async hooks. Never tap with synchronous handlers if I/O possible.

```typescript
// ❌ BAD
router.hooks.level2.tap('FileNaming', (input) => {
  const data = fs.readFileSync(input.path);  // Blocks!
});

// ✅ GOOD
router.hooks.level2.tapPromise('FileNaming', async (input) => {
  const data = await fs.promises.readFile(input.path);
});
```

---

### ❌ 4. Skill Registry as Global Singleton Without Tests
**Problem**: Manifest loaded once, cached. Tests can't reset → Test pollution.
**Solution**: Registry as injected dependency, reset in test setup.

```typescript
// ❌ BAD
const skillRegistry = new SkillRegistry();
export { skillRegistry };  // Global singleton

// ✅ GOOD
class SkillRegistry {
  static instance = null;
  static getInstance() { return this.instance || new SkillRegistry(); }
  static resetForTests() { this.instance = new SkillRegistry(); }
}

// In tests
beforeEach(() => SkillRegistry.resetForTests());
```

---

### ❌ 5. Hard-Coded Skill Paths
**Problem**: `require('./skills/code-linting-fast')` doesn't work if user has skill in `~/.tinyarms/custom-skills/`.
**Solution**: Configurable skill directories.

```typescript
// ❌ BAD
const codeLinintSkill = require('./skills/code-linting-fast');

// ✅ GOOD
async function loadSkill(skillId: string) {
  const searchDirs = [
    path.join(__dirname, 'skills'),
    path.join(os.homedir(), '.tinyarms/skills'),
  ];

  for (const dir of searchDirs) {
    const path = join(dir, skillId, 'skill.ts');
    if (await fileExists(path)) {
      return await import(path);
    }
  }
  throw new Error(`Skill ${skillId} not found`);
}
```

---

## Recommended Architecture for tinyArms

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ tinyArms CLI / MCP Server / LaunchAgent                         │
│ (Entry points)                                                  │
└────────────────────┬────────────────────────────────────────────┘
                     │
        trigger = "pre-commit" | "command:run" | "scheduled"
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ Skill Activation Engine                                         │
│ ├─ Load skill manifests from ~/.tinyarms/skills/                │
│ ├─ Filter by activationEvents (match trigger)                   │
│ └─ Instantiate + call apply(router)                             │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ TinyArmsRouter (Hook-Based Orchestration)                       │
│                                                                 │
│ hooks.preRoute.call()                                           │
│   ↓                                                              │
│ hooks.level0.tapPromise() ← Skills registered here              │
│   if (confidence > 0.95) return                                 │
│   ↓                                                              │
│ hooks.level1.tapPromise()                                       │
│   if (confidence > 0.85) return                                 │
│   ↓                                                              │
│ hooks.level2.tapPromise()                                       │
│   if (confidence > 0.75) return                                 │
│   ↓                                                              │
│ hooks.level3.tapPromise() (optional, slower)                    │
│   ↓                                                              │
│ hooks.postRoute.call()                                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│ Storage (Config + Metrics)                                      │
│ ├─ ~/.tinyarms/config.yaml (user settings)                      │
│ ├─ ~/.tinyarms/db/ (SQLite metrics + cache)                     │
│ └─ ~/.tinyarms/cache/ (semantic embeddings)                     │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Roadmap

**Phase 1 (Week 1-2): Core Framework**
- [ ] Implement SkillRegistry with manifest loading
- [ ] Implement TinyArmsRouter with Tapable-like hooks
- [ ] Add activation event filtering (pre-commit, command:run, scheduled)
- [ ] Tests: Manifest validation, dependency ordering, circular detection

**Phase 2 (Week 3): Skill Porting**
- [ ] Port code-linting-fast to hook-based registration
- [ ] Port file-naming to hook-based registration
- [ ] Add skill enable/disable via config.yaml
- [ ] Tests: Skill isolation, error handling

**Phase 3 (Week 4): User Configuration**
- [ ] Add CLI for `tinyarms skills enable <id>`
- [ ] Add CLI for `tinyarms config set skills.<id>.property value`
- [ ] Validate config against manifest schema
- [ ] Tests: Config persistence, validation

**Phase 4 (Week 5+): Advanced Features**
- [ ] Dependency ordering validation
- [ ] Conditional skill loading (cond function)
- [ ] Plugin-plugin communication via EventEmitter
- [ ] Skill versioning + compatibility checks

---

## Files to Update

**For implementation**:
1. `src/router/skill-registry.ts` - New (manifest loading, auto-discovery)
2. `src/router/hooks.ts` - New (Tapable-like hook definitions)
3. `src/router/router.ts` - Update (add hook calls to routing levels)
4. `src/types.ts` - Extend (add SkillManifest, ActivationEvent types)
5. `skills/*/manifest.json` - New (one per skill)
6. `skills/*/skill.ts` - Update (implement apply(router) method)
7. `docs/01-ARCHITECTURE.md` - Update (add skill system section)
8. `docs/03-SKILLS.md` - Update (add manifest reference)

---

## Summary

**Recommended Pattern**: Combination of:
- **VSCode activation events** (lazy-loading by trigger)
- **Webpack Tapable hooks** (orchestration via pub-sub)
- **Obsidian manifest** (metadata + auto-discovery)
- **Lazy.nvim dependency ordering** (topological sort)

**Why this hybrid works for tinyArms**:
1. Memory-efficient (activate only when needed)
2. Composable (multiple skills can tap same hook without coupling)
3. Discoverable (manifest files auto-scanned)
4. Ordered (dependency resolution prevents initialization issues)
5. Resilient (error in one skill doesn't crash others)

**Industry validation**: FrugalGPT, RouteLLM, GitHub Copilot all use similar tiered + modular approaches (referenced in architecture docs).

---

## References

- **VSCode**: https://github.com/microsoft/vscode-extension-samples (9.8k stars) + https://code.visualstudio.com/api/references/extension-manifest
- **Obsidian**: https://github.com/obsidianmd/obsidian-sample-plugin (official template)
- **Neovim Lazy.nvim**: https://github.com/folke/lazy.nvim (9.8k stars) + https://lazy.folke.io/spec
- **Webpack Tapable**: https://github.com/webpack/tapable (3.3k stars) + https://webpack.js.org/api/plugins/
- **FrugalGPT**: https://arxiv.org/abs/2305.05176 (routing patterns)
- **RouteLLM**: https://github.com/lm-sys/RouteLLM (tiered routing baseline)

---

**Status**: ✅ Ready for Architecture Integration
**Next Step**: Update 01-ARCHITECTURE.md with skill system section (references this doc)
