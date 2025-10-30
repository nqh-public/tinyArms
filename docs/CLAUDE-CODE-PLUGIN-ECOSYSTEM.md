# Claude Code Plugin Ecosystem Research Report

**Date**: 2025-10-30
**Scope**: Skills, MCP servers, Hooks, Slash Commands, and Subagents architecture
**Codebase**: /Users/huy/CODES/nqh/.claude/ + /Users/huy/.claude/ + tinyArms-specific

---

## EXECUTIVE SUMMARY

Claude Code's plugin ecosystem consists of **5 integration layers**:

1. **MCP Servers** (external tool registration) - stdio/HTTP transports
2. **Skills** (reusable workflows) - Markdown manifests with YAML frontmatter
3. **Slash Commands** (/keyword workflows) - Markdown-based orchestrators
4. **Hooks** (pre/post execution interception) - CLI commands or Python scripts
5. **Subagents** (specialized LLM personas) - Markdown prompts with task-driven dispatch

**Key insight**: Everything is **Markdown-first** with YAML metadata. No binary plugins, no registry system. All discoverable by directory structure.

---

## 1. SKILLS (Reusable Execution Units)

### Location & Discovery
```
.claude/skills/{skill-name}/
├── SKILL.md          (manifest + documentation)
├── reference/        (optional: advanced docs)
└── [other files]     (optional: depends on skill)
```

**Discovery**: Glob pattern: `.claude/skills/*/SKILL.md`

### SKILL.md Frontmatter Format

```yaml
---
name: figma-token-sync
description: Bi-directional sync between CSS variables and Figma Variables API...
---

# Figma Token Sync

## PURPOSE
[Markdown content describing skill]
```

**Required fields**:
- `name`: kebab-case identifier (matches directory)
- `description`: One-liner + activation triggers

**Optional fields**:
- Version info (conventions vary)
- Metadata about tools/models used

### Example: figma-token-sync Skill

**Path**: `/Users/huy/CODES/nqh/.claude/skills/figma-token-sync/SKILL.md` (445 lines)

**Activation triggers** (in description):
- User says: "sync tokens to Figma"
- User says: "push to figma"
- User says: "figma:push-tokens"
- After CSS token changes

**Content structure**:
1. PURPOSE - What it does
2. WHEN TO USE - Triggers + scenarios
3. PREREQUISITES - Requirements (Figma token, file key, etc.)
4. AVAILABLE TOOLS - Functions/APIs documented
5. WORKFLOW STEPS - 5 detailed steps with pseudocode
6. SUCCESS CRITERIA - Validation checklist
7. ERROR HANDLING - 4+ common errors + fixes
8. ADVANCED USAGE - Optional features
9. REFERENCE - Links to docs

**Integration points**:
- Tools provided by Claude Code (ability to read files, call APIs)
- External APIs: Figma Variables API (POST/GET/DELETE)
- Scripts: `packages/figma-workflow/src/token-sync/index.ts`

**No skill triggers itself** - Activation happens by:
- User explicitly mentioning keywords
- Slash command invocation
- Manual user request

### Invocation Mechanism

**How Claude Code finds & uses skills**:

1. User mentions skill activation keyword (e.g., "sync tokens")
2. Claude Code searches `.claude/skills/*/SKILL.md` descriptions
3. If match found → Load skill markdown
4. Present skill to Claude as context for this conversation
5. Claude uses skill instructions to guide execution

**No formal registration** - just directory scanning.

### Other Skills in Ecosystem

**Located at**: `/Users/huy/CODES/nqh/.claude/skills/`

- `figma-code-connect.backup/` - Figma Code Connect setup
- `figma-token-sync/` - CSS↔Figma token sync
- `design-system-architect/` - Design system creation
- `design-system-enforcer/` - Enforce design compliance
- `shadcn-ui-composer/` - Create shadcn components
- `better-auth/` - Auth integration
- `tanstack-start/` - TanStack Start setup
- `railway/` - Railway deployment
- `visual-code-validator/` - UI visual testing
- `figma-asset-export/` - Figma asset exports
- `figma-to-react/` - Figma→React code generation
- `mcp-builder/` - MCP server creation
- `skill-creator/` - Skill scaffolding

**Structure varies** - Some just have SKILL.md, others have `/reference/` subdirs for advanced documentation.

---

## 2. MCP SERVERS (External Tool Registration)

### Configuration Location

**User level**: `/Users/huy/.claude/.mcp.json`

**Project level**: `/Users/huy/.claude/.mcp.json` (deprecated per CLAUDE.md instructions)

**Correct format**: `.claude/settings.local.json` with `enabledMcpjsonServers` array

### Configuration Schema

**File**: `/Users/huy/.claude/.mcp.json` (13 servers configured)

```json
{
  "mcpServers": {
    "gmail-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["/Users/huy/.claude/gmail-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_OAUTH_CREDENTIALS_PATH": "...",
        "GOOGLE_OAUTH_TOKEN_PATH": "..."
      }
    },
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    ...
  }
}
```

### Transport Types Supported

1. **stdio** - Direct process communication (most common)
   ```json
   {
     "type": "stdio",
     "command": "node",
     "args": ["script.js"],
     "env": { "KEY": "value" }
   }
   ```

2. **npx** - Load from npm package
   ```json
   {
     "command": "npx",
     "args": ["-y", "package-name@version"]
   }
   ```

3. **sse** - Server-Sent Events (remote)
   ```json
   {
     "command": "npx",
     "args": ["-y", "mcp-remote", "https://url/sse?id=...", "--transport", "sse-only"]
   }
   ```

### Registered MCP Servers (13 Total)

| Server | Type | Source | Purpose |
|--------|------|--------|---------|
| gmail-mcp-server | stdio | local | Email access via OAuth |
| shadcn | npx | npm | shadcn/ui component queries |
| context7 | npx | npm | Documentation lookup |
| framer | sse | remote | Framer design tool |
| chrome-devtools | npx | npm | Browser automation |
| mermaid | npx | npm | Diagram generation |
| exa | sse | remote | Web search |
| tailwindcss | npx | npm | Tailwind class lookup |
| drizzle | npx | npm | ORM query building |
| railway | npx | npm | Railway deployment |
| figma | npx | npm | Figma API access |

### Activation & Tool Discovery

**In settings.local.json**:
```json
{
  "enabledMcpjsonServers": ["context7", "chrome-devtools", "mermaid"],
  ...
}
```

**Claude Code behavior**:
1. Reads `.mcp.json` for server definitions
2. Starts enabled servers on startup
3. Introspects available tools via MCP protocol
4. Exposes tools as first-class capabilities

**Usage in prompts**:
- `mcp__shadcn__get-components` - Call specific tool
- `WebFetch(domain:...)` - High-level wrapper tool
- `Bash` - Integrated shell access

---

## 3. SLASH COMMANDS (/keyword Workflows)

### Location & Discovery

```
.claude/commands/{command-name}.md
```

**Discover via**: Glob pattern: `.claude/commands/*.md`

### Command Markdown Format

```yaml
---
description: Command description
argument-hint: (optional: hint for arguments)
allowed-tools: Read, Task, Glob, Write
---

**PHASE 1: LOAD CONTEXT**
[Detailed execution steps in markdown]

**PHASE 2: DELEGATE & EXECUTE**
[More phases as needed]
```

**Required sections**:
- YAML frontmatter with `description`
- Numbered phases with clear instructions
- Tool requirements documented

### Example Commands (20 total in project)

**Located at**: `/Users/huy/CODES/nqh/.claude/commands/`

| Command | Purpose | Phases | Allowed Tools |
|---------|---------|--------|---------------|
| `/research` | Phase B - Research orchestrator | 2 phases | Read, Task, Glob, Write |
| `/implement` | Phase C - Execution by delegation | 2+ phases | Any (execution context) |
| `/execute` | Phase C - Delegate to agents | Multiple | Task, Bash |
| `/start` | Phase A - Context discovery | 3 phases | Glob, Read, Write, Task |
| `/clarify` | Ask 5 targeted questions | 2 phases | Read, Glob |
| `/specify` | Convert to feature spec | 1 phase | Read, Write |
| `/plan` | Generate implementation plan | 1 phase | Task |
| `/tasks` | Ordered task list from plan | 1 phase | Read, Write |
| `/prep` | Load project intelligence | 1 phase | Read, Glob |
| `/analyze` | Cross-artifact validation | 1 phase | Read, Glob |
| `/audit` | Pre-commit validation | 1 phase | Read, Bash |
| `/cleanup` | Pattern extraction & docs | 1 phase | Read, Write |
| `/constitution` | Update constitution | 9 steps | Read, Write, Bash |

### Invocation Mechanism

**User input**: `/research` → Claude Code:
1. Looks up `.claude/commands/research.md`
2. Reads frontmatter & description
3. Loads markdown as system context
4. Shows user command prompt
5. Executes phases sequentially

**Parameters passed via**: `$ARGUMENTS` token in markdown (bash-style substitution)

### Complex Example: /implement Command

**File**: `/Users/huy/CODES/nqh/.claude/commands/implement.md` (40 lines shown)

**Execution flow**:
1. PHASE 1: LOAD CONTEXT
   - Run prerequisite check script
   - Read agent-prompt-base.md
   - Load feature-specific context
   - Load tasks.md

2. PHASE 2: LOAD BATCH EXECUTION PLAN
   - Parse tasks.md batch structure
   - Extract batch metadata
   - Validate batch integrity
   - Display execution plan

3. [PHASE 3+]: DELEGATE TO AGENTS
   - Spawn agents in parallel per batch
   - Stream progress
   - Collect results
   - Synthesize output

---

## 4. HOOKS (Pre/Post Execution Interception)

### Configuration Location

```json
// .claude/settings.local.json
{
  "hooks": {
    "PostToolUse": [...],
    "PreToolUse": [...]
  }
}
```

### Hook Events

**PostToolUse** - After tool execution (Edit, Write, MultiEdit, Bash)
**PreToolUse** - Before tool execution (Bash, etc.)

### Hook Structure

```json
{
  "matcher": "Edit|MultiEdit|Write|Bash",
  "hooks": [
    {
      "type": "command",
      "command": "shell command or script path"
    }
  ]
}
```

### Registered Hooks (7 Total)

**Location**: `/Users/huy/CODES/nqh/.claude/settings.local.json:110-186`

| Event | Matcher | Action | Purpose |
|-------|---------|--------|---------|
| PostToolUse | Edit | git add + git commit | Auto-commit file changes |
| PostToolUse | Write | git add + git commit | Auto-commit new files |
| PostToolUse | Edit | npm audit, safety check | Dependency security scan |
| PostToolUse | Edit/MultiEdit | echo to changes.log | Track modifications |
| PostToolUse | Write | echo to changes.log | Track creation |
| PostToolUse | Edit | prettier/black/gofmt | Auto-format code |
| PostToolUse | Edit | npm test / pytest | Auto-run tests |
| PreToolUse | Bash | validate-branch-name.py | Enforce Git Flow |

### Hook Implementation: validate-branch-name.py

**File**: `/Users/huy/CODES/nqh/.claude/hooks/validate-branch-name.py` (97 lines)

**Intercepts**: `git checkout -b` commands

**Validation**:
```python
# Only allow Git Flow patterns:
# ✅ feature/descriptive-name
# ✅ release/vMAJOR.MINOR.PATCH
# ✅ hotfix/descriptive-name
# ❌ feat/name, fix/name, main, develop (unless explicitly allowed)
```

**Hook protocol**:
```python
# Input: JSON via stdin
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "git checkout -b feature/new-auth"
  }
}

# Output: JSON via stdout
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",  # or "allow"
    "permissionDecisionReason": "..."
  }
}
```

**Exit codes**:
- `0` = Allow execution
- Non-zero = Deny with printed error

---

## 5. SUBAGENTS (Specialized LLM Personas)

### Location & Discovery

```
.claude/agents/{agent-name}.md
```

**Total**: 49 agents (downloaded from wshobson/agents)

**Discover via**: Directory listing of `.claude/agents/`

### Agent Markdown Format

```yaml
---
name: backend-architect
description: Expert backend architect specializing in scalable API design...
model: sonnet
---

You are a backend system architect...

## Purpose
[Detailed persona + capabilities]

## Constitutional Compliance
[NQH-specific constraints]

## Core Philosophy
[How this agent thinks]
```

**Required fields**:
- `name`: agent identifier
- `description`: What it does
- `model`: claude-opus / claude-sonnet / claude-haiku

**Sections**:
- Purpose & Philosophy
- Constitutional Alignment
- How to Use
- Limitations
- Examples (sometimes)

### Agent Selection Algorithm

**Implemented in**: `/tasks` and `/implement` commands

**Process**:
1. Parse task attributes: language, domain, specialty, complexity
2. Score agents: match against task
3. Select highest-scoring agent
4. Fallback to general approach if no match

**Example scoring**:

```
Task: "Debug TypeScript security vulnerability in React auth"

Scoring:
- frontend-security-coder: 90% ✅ BEST (Security + Frontend)
- debugger: 60% (Debugging only)
- typescript-pro: 40% (Language only)
- security-auditor: 50% (Security only)

→ Select: frontend-security-coder
```

### Agent Tiers (49 Total)

**Tier 1: Essential (20 agents)** - Daily use, core tech stack
- api-documenter, architect-review, backend-architect, code-reviewer
- debugger, deployment-engineer, frontend-developer, graphql-architect
- javascript-pro, python-pro, rust-pro, tdd-orchestrator, test-automator
- terraform-specialist, tutorial-engineer, typescript-pro
- (+ 4 language specialists: golang, django, fastapi, elixir)

**Tier 2: High Value (18 agents)** - Security, mobile, infrastructure
- backend-security-coder, cloud-architect, kubernetes-architect
- flutter-expert, ios-developer, mobile-developer, mobile-security-coder
- observability-engineer, performance-engineer, ui-ux-designer
- (+ 8 more infrastructure specialists)

**Tier 3: Database/Low Priority (1)** - content-marketer

**Tier 4: SEO Specialists (10)** - Low priority for dev work
- seo-content-writer, seo-keyword-strategist, etc.

### Agent Delegation Pattern

**Used in**: `/implement`, `/research` commands

**Template**: `/Users/huy/CODES/nqh/.claude/commands/execute.md`

```
**AGENT DELEGATION PATTERN**

For each task batch:
1. Analyze task attributes
2. Score available agents
3. Spawn agent with Task tool
4. Pass task + required context
5. Agent reports back concisely

Example Task spawn:
```
[Task] backend-architect: Design Order Service API
Context: Project uses TanStack Start + TypeScript
Expected output: api/orders/service.ts with boundaries
```
```

### Constitutional Compliance in Agents

**Example**: backend-architect agent (`/Users/huy/CODES/nqh/.claude/agents/backend-architect.md`)

```yaml
## Constitutional Compliance

This agent operates under the NQH Monorepo Constitution (v2.2.0)

**Execution constraints:**
- ✅ Evidence-Based Completion (II): All designs include file:line references
- ✅ Universal Reusability (I): Services reusable across apps
- ✅ Architecture-First (III): Research patterns before custom design
- ✅ Scope Guard (V): Challenge feature requests
- ✅ DRY Enforcement (XV): Prevent duplicate patterns
```

**Key point**: Agents explicitly document which constitutional principles they enforce.

---

## INTEGRATION PATTERNS: HOW PLUGINS WORK TOGETHER

### Pattern 1: Skill Activation → MCP Tool Usage

```
User: "Sync tokens to Figma"
  ↓
Claude Code finds figma-token-sync skill
  ↓
Skill uses: Figma MCP server tools (API calls)
  ↓
MCP server: Figma API
  ↓
Returns: Structured result (sync report)
```

### Pattern 2: Slash Command → Agent Delegation

```
User: /implement
  ↓
Command loads tasks.md (batch structure)
  ↓
For each batch: Spawn agent via Task tool
  ↓
Agent: Loads context, executes tasks
  ↓
Agent reports: Progress + results
```

### Pattern 3: Hook → Auto-Enforcement

```
User edits file.tsx
  ↓
PostToolUse hook fires
  ↓
Hook 1: prettier --write (format)
  ↓
Hook 2: npm test (validate)
  ↓
Hook 3: git add + git commit (save)
```

### Pattern 4: Skill + Hook + Agent

```
User: "Extract design patterns"
  ↓
Skill: design-system-architect (loads context)
  ↓
Skill uses: chrome-devtools MCP (screenshot analysis)
  ↓
Skill uses: Figma MCP (token sync)
  ↓
PostToolUse hook: Auto-commit changes
  ↓
Result: Design tokens in CSS
```

---

## TINYARMS-SPECIFIC INTEGRATION POINTS

### Current Status: 0% Implemented

**What exists**:
- Architecture design documents
- Type definitions
- Model research
- Ideation for MCP server

**What doesn't exist**:
- Working inference code
- MCP server implementation
- Skill definitions
- Hook scripts
- Subagent integration

### Planned tinyArms MCP Server

**File**: `/Users/huy/CODES/nqh/apps/tinyArms/docs/04-mcp-server-ideations.md`

**Design**:
```
tinyArms MCP Server exposes 5 tools:

1. rename_file - Intelligent file renaming (tiered routing)
2. lint_code - Constitutional code review
3. analyze_changes - Markdown change detection
4. extract_keywords - Intent from text
5. query_system - Query tinyArms state

Transport: stdio (no HTTP needed for local usage)

Agent integration:
- Agents can call tinyarms tools via MCP
- No manual CLI needed
- Results streaming for long operations
```

**Configuration (future)**:
```json
{
  "mcpServers": {
    "tinyarms": {
      "command": "node",
      "args": ["/usr/local/bin/tinyarms", "mcp-server"],
      "env": {"TINYARMS_CONFIG": "~/.config/tinyarms/config.yaml"}
    }
  }
}
```

### Planned tinyArms Skills

**Location**: `/Users/huy/CODES/nqh/apps/tinyArms/skills/`

**Structure**:
```
skills/{skill-name}/
└── idea.md  (decision guide, NOT implementation)
```

**Standards** (from `/Users/huy/CODES/nqh/apps/tinyArms/skills/CLAUDE.md`):

- idea.md = decision flowchart (Mermaid) for model/tool selection
- No code examples (implementation structure undecided)
- No performance estimates (needs validation)
- Reference model research with line numbers

**Example**: `web-scraper/idea.md` (217 lines)
- Decides: Which HTML→Markdown→JSON tools?
- Compares: Beautiful Soup vs jsdom vs cheerio
- Trade-offs: Speed vs accuracy vs dependencies

---

## CRITICAL ARCHITECTURAL INSIGHTS FOR TINYARMS

### 1. MCP Registration Pattern

**tinyArms should NOT be a local service** that needs manual startup.

**Instead**: Register as MCP server in `.mcp.json`

```json
{
  "tinyarms": {
    "command": "node",
    "args": ["/path/to/tinyarms/dist/mcp-server.js"],
    "env": {"TINYARMS_CONFIG": "~/.config/tinyarms/config.yaml"}
  }
}
```

**Benefits**:
- Auto-started by Claude Code
- Agents access tools automatically
- No manual CLI needed
- Streaming support for long operations

### 2. Tool Exposure Pattern

**tinyArms tools should follow MCP schema**:

```typescript
interface MCPTool {
  name: string           // "tinyarms_lint_code"
  description: string    // What it does
  inputSchema: object    // JSON Schema for inputs
  handler: function      // Async execution
}
```

**Tools discoverable by**:
- `mcp__tinyarms__lint_code`
- `mcp__tinyarms__rename_file`
- etc.

### 3. Skill Definition Pattern

**tinyArms skills should follow SKILL.md format**:

```markdown
---
name: constitutional-linting
description: Real-time code linting against constitutional principles...
---

# Constitutional Linting

## WHEN TO USE
- Before git commit (pre-hook)
- User says "lint this file"
- CI/CD validation

## WORKFLOW
[Tiered routing logic...]
```

### 4. Hook Integration Pattern

**tinyArms could provide hooks for:**

```json
{
  "PreToolUse": [
    {
      "matcher": "Bash",
      "hooks": [
        {
          "command": "tinyarms lint-code --file \"$CLAUDE_TOOL_FILE_PATH\""
        }
      ]
    }
  ]
}
```

**This would**:
- Auto-lint files before committing
- Enforce constitution principles
- Provide fast feedback (Level 1 routing)

### 5. Subagent Integration Pattern

**tinyArms could support specialized agents**:

```yaml
---
name: tinyarms-constitutional-enforcer
description: Enforces NQH constitution principles at pre-commit...
model: haiku
---

You are a constitutional enforcement agent...
```

**Use in**: `/audit` command or pre-commit validation

---

## FILE ORGANIZATION REFERENCE

### User-Level Files

```
/Users/huy/.claude/
├── .mcp.json                    (MCP server definitions)
├── settings.json                (general settings)
├── settings.local.json          (hooks, output style, env)
├── hooks/                       (hook scripts)
│   └── validate-branch-name.py
├── plugins/                     (extension metadata)
├── agents/                      (49 downloaded agent prompts)
├── commands/                    (global slash commands)
├── skills/                      (global skills)
│   ├── better-auth/
│   ├── railway/
│   ├── shadcn-ui-composer/
│   └── ...
└── gmail-mcp-server/            (custom MCP implementation)
```

### Project-Level Files

```
/Users/huy/CODES/nqh/.claude/
├── .mcp.json                    (deprecated - use settings.local.json)
├── settings.local.json          (project-specific settings)
├── hooks/                       (project hooks)
│   └── validate-branch-name.py
├── agents/                      (49 agents, same as user-level)
├── agents-catalog.md            (index of agents)
├── commands/                    (20 project slash commands)
│   ├── research.md
│   ├── implement.md
│   ├── execute.md
│   ├── start.md
│   ├── /tasks
│   └── ...
└── skills/                      (project-specific skills)
    ├── figma-token-sync/
    ├── design-system-architect/
    ├── design-system-enforcer/
    └── ...
```

### tinyArms-Specific Files

```
/Users/huy/CODES/nqh/apps/tinyArms/
├── CLAUDE.md                    (tinyArms-specific config)
├── src/
│   ├── cli.ts                   (CLI entry point)
│   ├── types.ts                 (TypeScript definitions)
│   ├── linting/                 (constitutional linting)
│   ├── logging/                 (SQLite logging)
│   └── utils/                   (model checking, etc.)
├── tests/                       (unit tests)
├── skills/
│   ├── CLAUDE.md                (skill development standards)
│   └── web-scraper/
│       └── idea.md              (decision guide, no code yet)
├── docs/
│   ├── INDEX.md                 (auto-generated navigation)
│   ├── 01-ARCHITECTURE.md       (4-tier design)
│   ├── 01-MODELS.md             (model selection research)
│   ├── research/                (industry validation)
│   └── 04-mcp-server-ideations.md (future MCP design)
└── .claude/                     (project-specific Claude config)
    └── (empty - setup in progress)
```

---

## CONFIGURATION PATTERNS & BEST PRACTICES

### 1. Frontmatter Metadata

**Skills use**:
```yaml
---
name: kebab-case-name
description: One-liner + activation keywords
---
```

**Agents use**:
```yaml
---
name: agent-name
description: Full capability description
model: claude-opus | claude-sonnet | claude-haiku
---
```

**Commands use**:
```yaml
---
description: What command does
argument-hint: (optional) how to pass args
allowed-tools: Tool1, Tool2, Tool3
---
```

### 2. Markdown Structure Conventions

**Skills**: PURPOSE → WHEN TO USE → PREREQUISITES → TOOLS → WORKFLOW STEPS → SUCCESS CRITERIA → ERROR HANDLING → ADVANCED

**Agents**: Purpose → Philosophy → Constitutional Compliance → Core Skills → How to Use → Limitations → Examples

**Commands**: PHASE N: [STEP 1, STEP 2...] repeated for each phase

### 3. Tool Calling Patterns

**MCP tools**:
```
mcp__{server}__{tool_name}
mcp__figma__create_variables
mcp__context7__resolve_library_id
```

**Skill tools**:
```
Skill({skill-name})
Skill(design-system-architect)
```

**Native Claude Code tools**:
```
Read(//path)
Write(//path)
Edit(//path, line_offset, content)
Bash(command)
Glob(pattern)
Grep(pattern)
Task(prompt)  // Spawn subagent
```

### 4. Permission Model

**In settings.local.json**:
```json
{
  "permissions": {
    "allow": ["Tool(pattern)", ...],
    "deny": ["Tool(pattern)", ...],
    "ask": ["Tool(pattern)", ...]
  }
}
```

**Example**:
```json
{
  "allow": [
    "Bash(npm run test:*)",
    "Bash(git add:*)",
    "mcp__figma__create_variables",
    "Skill(design-system-architect)"
  ],
  "deny": ["Bash(rm -rf /)", "Edit(/etc/passwd)"],
  "ask": ["Bash(curl:*)", "WebFetch(domain:*)"]
}
```

---

## HOW TINYARMS COULD EXPOSE ITSELF AS A PLUGIN

### Option 1: MCP Server (Recommended for Claude Code)

**Implement**:
```typescript
// tinyarms/src/mcp-server.ts

import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

const server = new Server({
  name: "tinyarms",
  version: "0.1.0"
})

server.setRequestHandler(
  ListToolsRequestSchema,
  () => ({
    tools: [
      {
        name: "tinyarms_lint_code",
        description: "Lint code against constitutional principles...",
        inputSchema: { /* JSON Schema */ }
      },
      {
        name: "tinyarms_rename_file",
        description: "Intelligent file renaming...",
        inputSchema: { /* JSON Schema */ }
      },
      // ... 5 total tools
    ]
  })
)

server.setRequestHandler(
  CallToolRequestSchema,
  async (request) => {
    // Route to tiered linter / analyzer
  }
)
```

**Register** in `~/.claude/.mcp.json`:
```json
{
  "tinyarms": {
    "command": "node",
    "args": ["/usr/local/bin/tinyarms-mcp-server"],
    "env": {"TINYARMS_CONFIG": "~/.config/tinyarms/config.yaml"}
  }
}
```

**Result**: Agents call `mcp__tinyarms__lint_code` directly

### Option 2: Skill (For Guided Workflows)

**Create** `apps/tinyArms/skills/constitutional-linting/SKILL.md`:

```markdown
---
name: constitutional-linting
description: Real-time code linting against NQH constitutional principles. Activates when user says "lint this", "check constitution", or "validate code"
---

# Constitutional Linting

## PURPOSE
Real-time, fast code linting using tiered routing...

## WHEN TO USE
- User says "lint this file"
- Before committing code
- Code review process

## WORKFLOW STEPS
### Step 1: Fast Rules (Level 0)
Check file size, imports, naming...

### Step 2: Semantic Routing (Level 1)
...
```

**Result**: User mentions "lint this" → Claude Code loads skill → Guides execution

### Option 3: Hook (For Pre-Commit Enforcement)

**Create** `apps/tinyArms/.claude/hooks/constitutional-lint.py`:

```python
#!/usr/bin/env python3
import json, sys

data = json.load(sys.stdin)

if data["tool_name"] == "Bash" and "git commit" in data["tool_input"]["command"]:
    # Run tinyArms linting
    result = subprocess.run(
        ["tinyarms", "lint", "--staged"],
        capture_output=True
    )
    
    if result.returncode != 0:
        # Deny commit
        print(json.dumps({
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": f"Constitutional violations found:\n{result.stdout}"
            }
        }))
        sys.exit(0)
    
sys.exit(0)
```

**Register** in `settings.local.json`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 $CLAUDE_PROJECT_DIR/apps/tinyArms/.claude/hooks/constitutional-lint.py"
          }
        ]
      }
    ]
  }
}
```

**Result**: Pre-commit validation before commits allowed

### Option 4: Subagent (For Specialized Linting)

**Create** `/Users/huy/CODES/nqh/.claude/agents/constitutional-enforcer.md`:

```yaml
---
name: constitutional-enforcer
description: Specialized agent for enforcing NQH constitutional principles in code review
model: haiku
---

You are a constitutional enforcement specialist...
```

**Use in** `/audit` or custom command:
```
Task: constitutional-enforcer: Review code/file.ts for constitutional violations
```

---

## KEY TAKEAWAYS FOR TINYARMS IMPLEMENTATION

1. **MCP Server is primary integration** for Claude Code
   - Exposes tools agents can discover and use
   - Handles stdio communication
   - Tools: lint_code, rename_file, analyze_changes, extract_keywords, query_system

2. **Skills are for guided workflows**
   - Markdown manifests with YAML frontmatter
   - Activated by user keywords or explicit slash commands
   - Directory: `apps/tinyArms/skills/{name}/SKILL.md`

3. **Hooks enable enforcement**
   - Pre/post execution interception
   - Validates commits, formats code, runs tests
   - Python scripts that return JSON permit/deny

4. **Subagents provide specialization**
   - Use Task tool to delegate complex analysis
   - Example: `constitutional-enforcer` agent for policy checks
   - Haiku model sufficient for focused linting

5. **Configuration is location-based**
   - User: `~/.claude/.mcp.json`
   - Project: `.claude/settings.local.json`
   - Skills/commands/agents: auto-discovered by directory

6. **No registry needed**
   - Everything is file-based
   - Discovery via glob patterns
   - YAML metadata is all that's needed

---

## REFERENCES

**Configuration Files**:
- `/Users/huy/.claude/.mcp.json` - MCP servers (13 servers)
- `/Users/huy/CODES/nqh/.claude/settings.local.json` - Hooks, permissions, env
- `/Users/huy/CODES/nqh/.claude/agents-catalog.md` - Agent index

**Documentation**:
- `/Users/huy/CODES/nqh/CLAUDE.md` - Project constitutional alignment
- `/Users/huy/CODES/nqh/apps/tinyArms/CLAUDE.md` - tinyArms-specific
- `/Users/huy/CODES/nqh/apps/tinyArms/skills/CLAUDE.md` - Skill standards
- `/Users/huy/CODES/nqh/apps/tinyArms/docs/04-mcp-server-ideations.md` - MCP design

**Example Implementations**:
- Skills: `/Users/huy/CODES/nqh/.claude/skills/figma-token-sync/` (445 lines)
- Commands: `/Users/huy/CODES/nqh/.claude/commands/implement.md` (40 lines shown)
- Hooks: `/Users/huy/CODES/nqh/.claude/hooks/validate-branch-name.py` (97 lines)
- Agents: `/Users/huy/CODES/nqh/.claude/agents/backend-architect.md` (60 lines shown)
