# jan-nano-4b Use Cases for tinyArms Research Agent

**Research completed:** 2025-10-27
**Model:** jan-nano-4b (4.3GB, Q8 quantization)
**Context:** 128K tokens
**Role:** Level 2/3 research agent for tinyArms
**Benchmark:** 83.2% SimpleQA accuracy with MCP (24% above Qwen3-4B baseline)

---

## Executive Summary

jan-nano-4b specializes in **deep research via MCP tool calling**, trained specifically for external tool integration rather than memorizing facts. This makes it ideal for research tasks that require:
- Multi-source information synthesis
- Real-time documentation lookup
- Cross-repository pattern analysis
- Dependency graph exploration

**Key strength**: "Instead of trying to know everything, jan-nano excels at knowing how to find anything"

**Context efficiency**: Offloads research tasks from Claude Code, saving 5-20K tokens per query by pre-processing multi-source information.

---

## Use Cases (Prioritized)

### 1. Library Documentation Synthesis

**Problem it solves**: Developers need up-to-date API documentation across multiple versions/sources

**MCP servers used**:
- Context7 (version-specific docs)
- GitHub (README, examples, issues)
- Filesystem (local project files)

**Input**: "Find shadcn/ui Button API for v2.1.0 with accessibility requirements"

**Output**:
```json
{
  "component": "Button",
  "version": "v2.1.0",
  "props": {
    "variant": ["default", "destructive", "outline", "secondary", "ghost", "link"],
    "size": ["default", "sm", "lg", "icon"],
    "asChild": "boolean (Radix Slot pattern)"
  },
  "accessibility": {
    "aria-label": "required if no visible text",
    "keyboard": "Enter/Space triggers onClick",
    "focus": "visible ring on focus-visible"
  },
  "examples": ["button.tsx:12-18", "examples/forms.tsx:42"],
  "breaking_changes": "v2.0.0 removed 'ghost' variant, re-added in v2.1.0"
}
```

**Value**: 4B model can parse docs + synthesize key info faster than Claude Code reading raw documentation (saves 3-5K tokens per query)

**Frequency**: High (20-30x/day during active development)

---

### 2. Dependency Chain Analysis

**Problem it solves**: Understanding what breaks when upgrading package X

**MCP servers used**:
- Filesystem (package.json, lock files)
- GitHub (dependency graphs, issues)
- npm registry (via web search MCP)

**Input**: "If I upgrade @tanstack/react-router from 1.0.0 to 1.5.0, what breaks in my codebase?"

**Output**:
```json
{
  "direct_impact": [
    "apps/ngoquochuy.com/package.json:12 (@tanstack/router-devtools incompatible)",
    "packages/shared/src/routing/hooks.ts:8 (useNavigate API changed)"
  ],
  "indirect_impact": [
    "@tanstack/react-query v5 now required (currently v4.2.0)",
    "breaking: createRoute() signature changed (adds 'id' parameter)"
  ],
  "resolution_steps": [
    "1. Upgrade @tanstack/react-query to v5.0.0+",
    "2. Update all createRoute() calls with unique IDs",
    "3. Replace useNavigate().push() with navigate()"
  ],
  "risk_level": "medium",
  "estimated_files_affected": 8
}
```

**Value**: 4B model + MCP can traverse dependency trees locally without sending full codebase to Claude Code (saves 10-15K tokens)

**Frequency**: Medium (5-10x/week during dependency updates)

---

### 3. Cross-Repository Pattern Search

**Problem it solves**: "How do other apps in this monorepo handle auth?"

**MCP servers used**:
- Filesystem (read multiple app directories)
- GitHub Code Search (if needed)
- SQLite (if tracking patterns in DB)

**Input**: "Show me all authentication patterns in apps/**/src/auth/"

**Output**:
```json
{
  "patterns": [
    {
      "pattern": "better-auth with Drizzle adapter",
      "apps": ["brandr-bookings", "latinamerica.hu"],
      "files": [
        "apps/brandr-bookings/src/auth/config.ts:12-45",
        "apps/latinamerica.hu/src/server/auth.ts:8-32"
      ],
      "shared_dependencies": ["@nqh/auth-better-auth", "drizzle-orm"]
    },
    {
      "pattern": "TanStack Start server functions",
      "apps": ["ngoquochuy.com"],
      "files": ["apps/ngoquochuy.com/src/server/auth.ts:5-28"],
      "note": "Simplified auth for static-heavy site"
    }
  ],
  "recommendation": "Use @nqh/auth-better-auth (2/3 apps), extract common config to packages/systems/auth/"
}
```

**Value**: Searches locally without loading all files into Claude Code context (saves 8-12K tokens)

**Frequency**: High (10-15x/week during code review/refactoring)

---

### 4. Configuration Drift Detection

**Problem it solves**: Detecting inconsistent config across apps (ESLint, TypeScript, Tailwind)

**MCP servers used**:
- Filesystem (read all config files)
- GitHub (PRs that changed configs)

**Input**: "Find TypeScript config differences across apps/"

**Output**:
```json
{
  "baseline": "apps/ngoquochuy.com/tsconfig.json",
  "drifts": [
    {
      "app": "brandr-bookings",
      "file": "tsconfig.json:8",
      "difference": "strict: false (baseline: true)",
      "impact": "Type safety reduced, may hide bugs",
      "last_changed": "PR #42 (2024-10-15)"
    },
    {
      "app": "latinamerica.hu",
      "file": "tsconfig.json:12",
      "difference": "target: ES2020 (baseline: ES2022)",
      "impact": "Missing modern JS features",
      "last_changed": "Initial commit"
    }
  ],
  "action": "Standardize via packages/tsconfig/base.json, extend in apps"
}
```

**Value**: Scans multiple files + synthesizes differences without loading all into Claude Code (saves 5-8K tokens)

**Frequency**: Medium (weekly during maintenance)

---

### 5. Constitutional Principle Lookup

**Problem it solves**: Quick reference to constitutional rules during code review

**MCP servers used**:
- Filesystem (read .specify/memory/constitution.md)
- Embedding search (semantic similarity, not full LLM)

**Input**: "What's the rule about file size limits and exceptions?"

**Output**:
```json
{
  "principle": "X. File Organization Standards",
  "rule": "File size: ≤350 LOC (target 300)",
  "location": "constitution.md:450-557",
  "exceptions": [
    "Generated code (migrations, GraphQL types)",
    "Type definition files (if unavoidable)"
  ],
  "enforcement": "ESLint rule max-lines, hard block in pre-commit hook",
  "related_principles": [
    "II. Evidence-Based Completion (line references required)",
    "XVII. Pragmatic Atomic Composability (decomposition rules)"
  ]
}
```

**Value**: 4B model can semantically search + extract context faster than grep + manual reading (saves 2-3K tokens)

**Frequency**: High (15-20x/day during development)

---

### 6. Migration Path Research

**Problem it solves**: "How do I migrate from X to Y?" with real-world examples

**MCP servers used**:
- Context7 (official migration guides)
- GitHub Code Search (find migration PRs in similar projects)
- Web search (community patterns)

**Input**: "Migrate from Vite to TanStack Start in Next.js-style app"

**Output**:
```json
{
  "official_guide": "tanstack.com/start/docs/migration",
  "key_changes": [
    "1. Replace vite.config.ts with app.config.ts",
    "2. Convert React Router routes to file-based routing",
    "3. Replace client-side data fetching with createFileRoute + loader",
    "4. Move API routes to server functions"
  ],
  "community_examples": [
    {
      "repo": "example-user/vite-to-start",
      "pr": "#12",
      "highlights": "Shows loader pattern for existing React Query hooks"
    }
  ],
  "estimated_effort": "4-8 hours for medium app",
  "gotchas": [
    "TanStack Start requires Node 18+",
    "SSR breaks some client-only libraries (wrap with <ClientOnly>)"
  ]
}
```

**Value**: Synthesizes multiple sources into actionable plan (saves 10-15K tokens from reading full docs + examples)

**Frequency**: Low-Medium (2-5x/month during major tech stack changes)

---

### 7. Error Pattern Diagnosis

**Problem it solves**: Understanding cryptic error messages across stack

**MCP servers used**:
- Filesystem (read stack traces, source files)
- GitHub Issues (similar errors in dependencies)
- Context7 (known issues in library docs)

**Input**: "TypeError: Cannot read property 'current' of undefined in @tanstack/react-router"

**Output**:
```json
{
  "error": "Cannot read property 'current' of undefined",
  "library": "@tanstack/react-router",
  "likely_cause": "RouterProvider not wrapping component tree",
  "evidence": [
    "apps/your-app/src/main.tsx:8 (missing RouterProvider)",
    "GitHub issue #234: Same error when RouterProvider omitted"
  ],
  "fix": [
    "1. Wrap <App /> with <RouterProvider router={router} />",
    "2. Ensure router created via createRouter() before render"
  ],
  "related_issues": [
    "@tanstack/react-router#234 (closed)",
    "Stack Overflow: 'React Router context undefined' (similar pattern)"
  ]
}
```

**Value**: Correlates local error with known patterns in docs/issues (saves 5-8K tokens from manual searching)

**Frequency**: Medium-High (10-15x/week during active development)

---

### 8. Shared Code Discovery

**Problem it solves**: "Before creating this utility, does it exist in packages/?"

**MCP servers used**:
- Filesystem (scan packages/)
- GitHub Code Search (find similar implementations)
- SQLite (query REGISTRY.md if structured)

**Input**: "Does a currency formatter utility exist in packages/?"

**Output**:
```json
{
  "found": true,
  "location": "packages/shared/src/utils/format-currency.ts",
  "exports": ["formatCurrency", "parseCurrency", "getCurrencySymbol"],
  "usage_example": "import { formatCurrency } from '@nqh/shared';\nformatCurrency(1234.5, 'USD') // '$1,234.50'",
  "consumers": [
    "apps/brandr-bookings/src/components/pricing.tsx:23",
    "apps/latinamerica.hu/src/features/payments/invoice.tsx:45"
  ],
  "alternatives": {
    "found": false,
    "suggestion": "If formatCurrency doesn't meet needs, extend rather than duplicate"
  }
}
```

**Value**: Prevents duplication by searching packages/ + REGISTRY.md before creating new code (saves 3-5K tokens from reading multiple files)

**Frequency**: High (10-20x/week, enforced by Constitutional Principle XV - DRY)

---

### 9. Breaking Change Impact Analysis

**Problem it solves**: "If I change this shared package, what breaks?"

**MCP servers used**:
- Filesystem (scan all imports)
- GitHub (find PRs that touched this code)
- AST analysis (if needed, via custom MCP server)

**Input**: "If I change formatCurrency() signature in @nqh/shared, what breaks?"

**Output**:
```json
{
  "function": "formatCurrency",
  "current_signature": "(amount: number, currency: string) => string",
  "consumers": [
    {
      "app": "brandr-bookings",
      "files": [
        "src/components/pricing.tsx:23",
        "src/features/payments/invoice.tsx:45"
      ],
      "usage_count": 12
    },
    {
      "app": "latinamerica.hu",
      "files": ["src/features/payments/invoice.tsx:18"],
      "usage_count": 3
    }
  ],
  "total_callsites": 15,
  "recommendation": "Create formatCurrencyV2() with new signature, deprecate old function, migrate callsites incrementally",
  "estimated_refactor_time": "1-2 hours"
}
```

**Value**: Traces imports without loading all files into Claude Code (saves 8-12K tokens)

**Frequency**: Medium (5-8x/month during shared code refactoring)

---

### 10. Design Token Validation

**Problem it solves**: Detecting hardcoded values that should use design tokens

**MCP servers used**:
- Filesystem (scan source files + styles/)
- Tailwind config (if needed)

**Input**: "Find hardcoded colors in apps/ngoquochuy.com/src/components/"

**Output**:
```json
{
  "violations": [
    {
      "file": "hero.tsx:12",
      "code": "className=\"bg-[#3B82F6]\"",
      "violation": "Hardcoded hex color",
      "fix": "Use bg-primary or define semantic token in globals.css",
      "principle": "IV. Zero Invention Policy (design tokens)"
    },
    {
      "file": "button.tsx:23",
      "code": "style={{ padding: '12px 24px' }}",
      "violation": "Inline style with magic numbers",
      "fix": "Use className=\"px-6 py-3\" (Tailwind spacing scale)",
      "principle": "IV. Zero Invention Policy (no magic numbers)"
    }
  ],
  "summary": "2 violations found, 0 false positives",
  "action": "Run tinyArms code-linting-fast to fix automatically"
}
```

**Value**: Pre-scans files for violations before running expensive Qwen 7B linter (saves 5-10K tokens + 10s per file)

**Frequency**: Medium-High (via pre-commit hook, 20-50 files/day)

---

## Performance Characteristics

| Use Case | Avg Latency | Context Saved | Frequency |
|----------|-------------|---------------|-----------|
| Library docs synthesis | 3-5s | 3-5K tokens | High (20-30x/day) |
| Dependency chain | 5-8s | 10-15K tokens | Medium (5-10x/week) |
| Cross-repo patterns | 4-6s | 8-12K tokens | High (10-15x/week) |
| Config drift | 3-5s | 5-8K tokens | Medium (weekly) |
| Constitutional lookup | 1-2s | 2-3K tokens | High (15-20x/day) |
| Migration research | 8-12s | 10-15K tokens | Low (2-5x/month) |
| Error diagnosis | 4-6s | 5-8K tokens | Medium-High (10-15x/week) |
| Shared code discovery | 2-4s | 3-5K tokens | High (10-20x/week) |
| Breaking change impact | 5-8s | 8-12K tokens | Medium (5-8x/month) |
| Design token validation | 3-5s | 5-10K tokens | Medium-High (20-50 files/day) |

**Total context savings estimate**: 50-100K tokens/week during active development

---

## Integration with tinyArms Architecture

### Level 2 Research Agent (jan-nano-4b)

**Role**: Pre-process multi-source information before escalating to Claude Code

**Workflow**:
```
User: "How should I migrate to TanStack Start?"
  ↓
Claude Code: Detects research task
  ↓
tinyArms MCP: Calls jan-nano-4b research skill
  ↓
jan-nano-4b: Uses Context7 + GitHub + Web Search MCPs
  ↓
Returns: Synthesized migration plan (JSON)
  ↓
Claude Code: Uses plan to generate actual migration code
```

**Model Loading**:
- **Storage**: 4.3GB (Q8 quantization)
- **RAM**: ~6GB loaded (model + KV cache)
- **Loading strategy**: Lazy load on first research request, keep loaded for 30 mins, unload if idle
- **Concurrency**: Max 1 research task at a time (queue if busy)

**Configuration**:
```yaml
models:
  level2-research: jan-nano-4b:q8

skills:
  research:
    enabled: true
    model: level2-research
    timeout: 30s
    max_mcp_calls: 10
    cache_ttl: 3600  # Cache results for 1 hour
```

---

## Why jan-nano-4b vs Alternatives?

| Criteria | jan-nano-4b | Qwen3-4B | Gemma 3 4B | Claude Code |
|----------|-------------|----------|------------|-------------|
| **MCP tool calling** | ✅ 83.2% SimpleQA | ⚠️ 59.2% | ⚠️ Not optimized | ✅ 90%+ |
| **Context efficiency** | ✅ Saves 50-100K/week | ❌ No | ❌ No | N/A |
| **Cost** | ✅ Free (local) | ✅ Free | ✅ Free | ❌ $20/month |
| **Latency (research)** | ✅ 3-12s | ⚠️ 15-30s | ⚠️ 20-40s | ⚠️ 5-20s (network) |
| **Privacy** | ✅ 100% offline | ✅ 100% offline | ✅ 100% offline | ❌ Cloud |
| **Training focus** | ✅ Deep research | ❌ General | ❌ General | ✅ Code assist |

**Decision**: Use jan-nano-4b for research tasks that require MCP tool calling. Fall back to Claude Code for complex synthesis or code generation.

---

## Implementation Priority

**Phase 1** (Critical for MVP):
1. Constitutional principle lookup (use case #5)
2. Shared code discovery (use case #8)
3. Library documentation synthesis (use case #1)

**Phase 2** (High value):
4. Cross-repository pattern search (use case #3)
5. Error pattern diagnosis (use case #7)
6. Design token validation (use case #10)

**Phase 3** (Nice to have):
7. Dependency chain analysis (use case #2)
8. Configuration drift detection (use case #4)
9. Breaking change impact analysis (use case #9)

**Phase 4** (Advanced):
10. Migration path research (use case #6)

---

## Limitations

**What jan-nano-4b CAN'T do** (requires escalation):
- ❌ Generate production code (use Claude Code)
- ❌ Complex multi-step reasoning (use Claude Code)
- ❌ Architectural design decisions (use Claude Code)
- ❌ Code refactoring (use Qwen2.5-Coder 7B or Claude Code)

**Accuracy expectations**:
- ✅ 80-90% for information retrieval (good for research)
- ⚠️ 70-80% for synthesis (human review needed)
- ❌ 50-60% for code generation (NOT recommended)

---

## Validation Checklist

Before integrating jan-nano-4b:
- [ ] Benchmark latency on M2 Air (target <10s per research task)
- [ ] Test MCP server integration (Context7, GitHub, Filesystem)
- [ ] Measure context savings (target 50K+ tokens/week)
- [ ] Validate accuracy on 10 real-world research tasks (target 80%+)
- [ ] Confirm memory usage (6GB loaded, safe for 16GB Mac)

---

## References

**Research Sources**:
- jan-nano technical report: https://arxiv.org/html/2506.22760v2
- SimpleQA benchmark: 83.2% with MCP (24% above baseline)
- MCP-agent framework: https://github.com/lastmile-ai/mcp-agent
- Context7 MCP server: https://github.com/upstash/context7
- TinyArms architecture: apps/tinyArms/docs/01-ARCHITECTURE.md

**Last updated**: 2025-10-27
**Next review**: After Phase 1 implementation + validation
