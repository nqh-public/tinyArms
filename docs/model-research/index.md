# Model Research Index

Quick reference for all researched models with recommendations beyond tinyArms core use cases.

---

## Quick Reference Table

| Model | Size | Role | Best For | Status |
|-------|------|------|----------|--------|
| [embeddinggemma-300m](#embeddinggemma-300m) | 622MB | Level 1 Routing | Semantic similarity, classification | ✅ Production |
| [qwen2.5-coder-3b](#qwen25-coder-3b) | 1.9GB | Level 2 Primary | Code linting, generation | ✅ Production |
| [qwen2.5-coder-7b](#qwen25-coder-7b) | 4.7GB | Level 3 Deep | Architectural analysis | ⚠️ Optional |
| [qwen3-4b](#qwen3-4b) | 2.5GB | Level 2 Secondary | General reasoning, multilingual | ⚠️ Optional |
| [gemma-3-4b](#gemma-3-4b) | 3.3GB | Specialist | Vision + multilingual | ⚠️ Optional |
| [granite-4.0-nano](#granite-40-nano) | 1-1.5GB | Level 1.5 Tools | MCP tool calling | 🔬 Validate |
| [jan-nano-4b](#jan-nano-4b) | 2.3-4.3GB | Research Agent | Multi-source research | 🔬 Validate |

**Legend**: ✅ Production ready | ⚠️ Optional add-on | 🔬 Requires validation

---

## Semantic Routing Models

### embeddinggemma-300m

**What it is**: Encoder-only embedding model (308M params, 622MB)
**Best benchmark**: 61.15 MTEB Multilingual, 69.67 English, 68.76 Code
**Selected for**: Level 1 semantic routing in tinyArms

#### tinyArms Use Cases
- File type classification (screenshot, code, design, doc)
- Intent extraction (fix, feature, refactor)
- Constitutional principle matching (which of 17 applies?)
- Task routing (Level 0 rules → Level 1 embedding → Level 2 LLM)

#### Beyond tinyArms (Broader Applications)
**Document Management**:
- Email categorization (support, sales, billing)
- PDF document clustering by topic
- Legal contract classification (NDA, MSA, SOW)

**E-commerce**:
- Product similarity search ("find similar items")
- Customer query routing (which department?)
- Review sentiment clustering

**Knowledge Base**:
- FAQ semantic search (question-answer matching)
- Documentation retrieval (relevant docs for query)
- Multi-language content deduplication

**Content Moderation**:
- Duplicate content detection
- Spam classification
- Topic-based content filtering

**Why this model**: Best multilingual quality under 500M, supports 100+ languages including Hungarian/Vietnamese

**Limitations**: ❌ Cannot generate text (encoder-only), ❌ NO M2 Air speed benchmarks yet

**Doc**: [embeddinggemma-300m.md](embeddinggemma-300m.md)

---

## Code-Specialized Models

### qwen2.5-coder-3b

**What it is**: Code-specialized LLM (3.09B params, 1.9GB, trained on 5.5T code tokens)
**Best benchmark**: 84.1% HumanEval, 73.6% MBPP, 35.8 BigCodeBench
**Selected for**: Level 2 Primary (core code linting) in tinyArms

#### tinyArms Use Cases
- Constitutional enforcement (17 principles)
- Hardcoded color/magic number detection
- File size violations (>350 LOC)
- Import alias violations
- DRY violations (simple semantic duplication)
- Design token violations

#### Beyond tinyArms (Broader Applications)
**Code Review Automation**:
- Pre-merge quality checks (style, patterns, best practices)
- Security vulnerability detection (SQL injection, XSS patterns)
- Dependency version consistency checks
- License compliance scanning

**Developer Tools**:
- Inline code suggestions (IDE plugins)
- Git commit message generation
- Code comment generation
- Unit test scaffolding

**Documentation**:
- API documentation from code
- README generation from project structure
- Code-to-diagram conversion (mermaid, plantuml)

**Learning Platforms**:
- Student code grading (auto-feedback)
- Coding challenge validation
- Tutorial code verification

**CI/CD**:
- Build failure root cause analysis
- Flaky test detection
- Performance regression detection

**Why this model**: Best HumanEval in sub-4B class, 2-3s per file (pre-commit compatible)

**Limitations**: ❌ NO tool calling benchmarks, ❌ NO instruction-following benchmarks

**Doc**: [qwen2.5-coder-3b-instruct.md](qwen2.5-coder-3b-instruct.md)

---

### qwen2.5-coder-7b

**What it is**: Larger code-specialized LLM (7.61B params, 4.7GB)
**Best benchmark**: 88.4% HumanEval (+5.1% over 3B), 83.5% MBPP, 37.6 LiveCodeBench
**Selected for**: OPTIONAL Level 3 (weekly deep scans only)

#### tinyArms Use Cases
- Architectural anti-pattern detection (God objects, circular deps)
- Complex DRY violations (semantic duplication across files)
- Cross-file pattern analysis
- Weekly deep scans (NOT pre-commit - too slow)

#### Beyond tinyArms (Broader Applications)
**Enterprise Code Audits**:
- Codebase-wide refactoring analysis (impact assessment)
- Technical debt quantification
- Security audit automation (OWASP Top 10)
- Compliance validation (SOC2, HIPAA code requirements)

**Migration Planning**:
- Framework upgrade impact analysis (React 17→18, Vue 2→3)
- API deprecation detection (find all usages)
- Breaking change assessment

**Architecture Review**:
- Microservice boundary analysis
- Component coupling detection
- Performance bottleneck identification

**Legacy Code Modernization**:
- Code smell detection (large classes, long methods)
- Design pattern recognition (refactoring opportunities)
- Dead code elimination

**Why this model**: 10% accuracy improvement over 3B for complex analysis

**Limitations**: ❌ Too slow for pre-commit (10-15s per file), ❌ 2.5x larger storage

**Doc**: [qwen2.5-coder-7b.md](qwen2.5-coder-7b.md)

---

## General-Purpose Models

### qwen3-4b

**What it is**: General reasoning LLM (4B params, 2.5GB, 36T token training)
**Best benchmark**: 87.0 IFEval (instruction-following), 83.7 MMLU-Redux, 119 languages
**Selected for**: OPTIONAL Level 2 Secondary (general tasks, NOT code)

#### tinyArms Use Cases
- File naming (screenshots, downloads)
- Markdown content analysis
- Multilingual content handling (Hungarian, Vietnamese comments)
- Complex multi-step reasoning

#### Beyond tinyArms (Broader Applications)
**Content Creation**:
- Blog post drafting (outlines, sections)
- Social media caption generation
- Email response templates
- Meeting notes summarization

**Data Extraction**:
- Invoice parsing (extract line items)
- Resume information extraction
- Form data normalization
- Log file analysis (error patterns)

**Customer Support**:
- FAQ answer generation
- Ticket categorization
- Response suggestion (support agents)
- Sentiment analysis (customer feedback)

**Productivity**:
- Task breakdown (project → subtasks)
- Calendar event extraction (from email)
- To-do prioritization (urgency, importance)

**Education**:
- Homework help (step-by-step explanations)
- Study guide generation
- Quiz question creation

**Why this model**: Best instruction-following in sub-5B class, 119 languages

**Limitations**: ❌ NOT code-specialized (use Qwen2.5-Coder for code), ❌ NO tool calling benchmarks

**Doc**: [qwen3-4b-instruct.md](qwen3-4b-instruct.md)

---

## Multimodal Specialist Models

### gemma-3-4b

**What it is**: Vision-capable LLM (4B params, 3.3GB, text + image understanding)
**Best benchmark**: 90.2 IFEval, 71.3% HumanEval, 75.8 DocVQA, 68.8 ChartQA
**Selected for**: OPTIONAL specialist (vision + multilingual tasks)

#### tinyArms Use Cases
- Screenshot filename generation (understand content → name file)
- Markdown image analysis (extract text from diagrams)
- Design mockup description (for documentation)
- Audio transcription structuring (MacWhisper → actions)

#### Beyond tinyArms (Broader Applications)
**Document Processing**:
- Invoice OCR + extraction (scanned invoices → JSON)
- Receipt categorization (meal, travel, supplies)
- ID verification (driver's license, passport)
- Handwritten note digitization

**Accessibility**:
- Image alt-text generation (for visually impaired)
- Chart description (data visualization → text)
- Diagram explanation (flowcharts, architecture diagrams)

**E-commerce**:
- Product image tagging (auto-categorization)
- Visual similarity search (find similar products)
- Defect detection (QA images)

**Education**:
- Homework grading (math problems, diagrams)
- Lab report image analysis
- Textbook diagram explanation

**Design QA**:
- Screenshot-to-code verification (does code match design?)
- Style guide compliance (color, spacing checks)
- Responsive design validation (mobile vs desktop)

**Content Moderation**:
- NSFW image detection
- Logo/brand detection (trademark infringement)
- Meme classification

**Why this model**: UNIQUE vision capability in 4B class, can reuse from Cotypist (zero marginal cost)

**Limitations**: ❌ 15% lower code quality than Qwen2.5-Coder (71.3% vs 84.1% HumanEval)

**Doc**: [gemma-3-4b.md](gemma-3-4b.md)

---

## Tool Calling Specialists

### granite-4.0-nano

**What it is**: Hybrid-SSM architecture (1B params, 1-1.5GB, 9:1 Mamba-2/Transformer ratio)
**Best benchmark**: 78.5 IFEval, 54.8 BFCLv3 (tool calling - BEST in 1-2B class)
**Selected for**: Potential Level 1.5 (MCP tool orchestration)

#### tinyArms Use Cases
- MCP tool orchestration (filesystem, GitHub, Context7 servers)
- Multi-step tool workflows (search → filter → analyze)
- Function calling for API integration
- External service coordination

#### Beyond tinyArms (Broader Applications)
**Workflow Automation**:
- API chaining (GitHub → Jira → Slack → Email)
- Data pipeline orchestration (fetch → transform → load)
- Multi-service coordination (payment + inventory + shipping)

**Smart Assistants**:
- Home automation (lights, thermostat, security)
- Calendar management (schedule → email → reminder)
- Travel booking (flights + hotel + car + itinerary)

**DevOps**:
- Deployment orchestration (build → test → deploy → notify)
- Incident response (detect → page → create ticket → notify)
- Log aggregation (fetch from services → parse → alert)

**Business Intelligence**:
- Report generation (query DB → analyze → visualize → email)
- Data sync (CRM → data warehouse → analytics)
- ETL pipeline coordination

**Customer Service**:
- Ticket routing (classify → assign → notify → track)
- Order fulfillment (inventory check → payment → shipping → tracking)
- Refund processing (verify → approve → process → notify)

**Why this model**: 2-3x better tool calling than competitors (54.8 vs ~20-30 for Gemma/Llama)

**Limitations**: ❌ NO HumanEval/MBPP (code quality unknown), ❌ Requires validation on Mac

**Doc**: [granite-4.0-nano.md](granite-4.0-nano.md)

---

## Research Specialists

### jan-nano-4b

**What it is**: Research-specialized LLM (4B params, 2.3-4.3GB, trained with RLVR)
**Best benchmark**: 83.2% SimpleQA with MCP (+24pp over Qwen3-4B baseline)
**Selected for**: OPTIONAL Level 2 Research Agent (MCP-heavy research)

#### tinyArms Use Cases
- Library documentation synthesis (Context7 + GitHub + web)
- Dependency chain analysis (package.json → lock files → GitHub issues)
- Cross-repository pattern search (find auth patterns across apps/)
- Constitutional principle lookup (search constitution.md)
- Migration path research (official guides + community + PRs)
- Breaking change impact (find all callsites)

#### Beyond tinyArms (Broader Applications)
**Academic Research**:
- Literature review (arXiv + PubMed + Google Scholar)
- Citation network analysis (paper → references → citations)
- Research question answering (multi-hop queries)

**Market Research**:
- Competitive analysis (websites + news + social media)
- Product feature comparison (docs + reviews + forums)
- Pricing intelligence (e-commerce + catalogs)

**Legal Research**:
- Case law search (precedents across jurisdictions)
- Contract clause comparison (similar agreements)
- Regulatory compliance (laws + regulations + guidance)

**Technical Research**:
- API integration research (official docs + GitHub + Stack Overflow)
- Technology evaluation (benchmarks + case studies + community feedback)
- Security vulnerability research (CVE databases + advisories + patches)

**Financial Research**:
- Company due diligence (SEC filings + news + analyst reports)
- Investment research (financials + trends + competitors)
- Risk assessment (news + regulatory + industry)

**Why this model**: 83.2% SimpleQA (24pp above baseline), trained specifically for research via MCP

**Limitations**: ❌ NO HumanEval/MMLU (NOT for code/general tasks), ❌ Research-only specialization

**Doc**: jan-nano-4b.md (documentation pending - agent research complete)

---

## Model Selection Decision Tree

### Use Case → Model Mapping

**Need semantic similarity/classification?**
→ embeddinggemma-300m (Level 1)

**Need code linting/generation?**
→ Fast (<5s): qwen2.5-coder-3b (Level 2)
→ Accurate (weekly scans): qwen2.5-coder-7b (Level 3)

**Need general reasoning/writing?**
→ qwen3-4b (Level 2 Secondary)

**Need vision/image understanding?**
→ gemma-3-4b (Specialist)

**Need tool calling/API orchestration?**
→ granite-4.0-nano (Level 1.5, validate first)

**Need multi-source research?**
→ jan-nano-4b (Research Agent, validate first)

---

## Recommended Stacks by Use Case

### Minimal Stack (Code Linting Only)
```yaml
Total: 2.5GB
- embeddinggemma-300m (622MB) - routing
- qwen2.5-coder-3b (1.9GB) - linting
```
**Use when**: Pre-commit hooks, basic constitutional enforcement

---

### Balanced Stack (Code + General)
```yaml
Total: 5.0GB
- embeddinggemma-300m (622MB) - routing
- qwen2.5-coder-3b (1.9GB) - code linting
- qwen3-4b (2.5GB) - general tasks, file naming
```
**Use when**: Mixed workload (code + docs + multilingual)

---

### Complete Stack (All Capabilities)
```yaml
Total: 9.3GB
- embeddinggemma-300m (622MB) - routing
- qwen2.5-coder-3b (1.9GB) - code linting
- qwen3-4b (2.5GB) - general tasks
- qwen2.5-coder-7b (4.7GB) - weekly deep scans
```
**Use when**: Enterprise code audits, full automation

---

### Tool Calling Stack (MCP Integration)
```yaml
Total: 4.0GB
- embeddinggemma-300m (622MB) - routing
- qwen2.5-coder-3b (1.9GB) - code tasks
- granite-4.0-nano (1.5GB) - MCP tool calling
```
**Use when**: Multi-service coordination, API orchestration

---

### Research Stack (Documentation/Research)
```yaml
Total: 6.5GB
- embeddinggemma-300m (622MB) - routing
- qwen2.5-coder-3b (1.9GB) - code tasks
- jan-nano-4b (4.3GB Q8) - research agent
```
**Use when**: Library research, dependency analysis, migration planning

---

### Vision Stack (Multimodal)
```yaml
Total: 5.8GB
- embeddinggemma-300m (622MB) - routing
- qwen2.5-coder-3b (1.9GB) - code tasks
- gemma-3-4b (3.3GB) - vision + multilingual
```
**Use when**: Screenshot processing, document OCR, image analysis

---

## Hardware Requirements by Stack

| Stack | RAM (Minimum) | RAM (Recommended) | Storage |
|-------|---------------|-------------------|---------|
| Minimal | 8GB | 16GB | 2.5GB |
| Balanced | 16GB | 24GB | 5.0GB |
| Complete | 16GB | 32GB | 9.3GB |
| Tool Calling | 16GB | 24GB | 4.0GB |
| Research | 16GB | 32GB | 6.5GB |
| Vision | 16GB | 24GB | 5.8GB |

**Notes**:
- Minimum RAM: Allows running ONE model at a time (swap when needed)
- Recommended RAM: Allows concurrent model loading (faster routing)
- Storage: Disk space for quantized models (Q4_K_M or Q8_0)

---

## Performance Characteristics

| Model | Speed (M2 Air) | Latency Target | Use Case |
|-------|----------------|----------------|----------|
| embeddinggemma-300m | <15ms (EdgeTPU) | <100ms P95 | Routing (instant) |
| qwen2.5-coder-3b | 80-110 tok/s (est.) | 2-3s per file | Pre-commit hooks |
| qwen2.5-coder-7b | 30-50 tok/s (est.) | 10-15s per file | Weekly scans |
| qwen3-4b | 70-90 tok/s (est.) | 2-4s per task | General tasks |
| gemma-3-4b | 60-80 tok/s (est.) | 3-5s per task | Vision tasks |
| granite-4.0-nano | Unknown (likely 80-120 tok/s) | <2s per task | Tool calling |
| jan-nano-4b | Unknown (likely 50-80 tok/s) | 3-10s per research | Research tasks |

**Note**: All speeds marked "(est.)" require M2 Air validation

---

## Next Steps

### Immediate Validation (Week 1-2)
1. **embeddinggemma-300m**: M2 Air speed benchmark (<100ms P95 target)
2. **qwen2.5-coder-3b**: Code linting accuracy (≥85% target on 20 files)
3. **Similarity threshold tuning**: Test 0.6-0.85 range (routing accuracy)

### Optional Validation (Week 3-4)
4. **granite-4.0-nano**: Tool calling test (20 MCP scenarios)
5. **qwen3-4b**: Instruction-following (10 general tasks)
6. **gemma-3-4b**: Screenshot filename generation (10 diverse tests)

### Advanced Validation (Month 2)
7. **qwen2.5-coder-7b**: Complex violation detection (architectural anti-patterns)
8. **jan-nano-4b**: Multi-source research (10 tinyArms use cases)

---

## Related Documentation

- **Individual model research**: See `*.md` files in this directory
- **Research standards**: [CLAUDE.md](CLAUDE.md)
- **Research process**: [README.md](README.md)
- **tinyArms architecture**: `../01-MODELS.md`, `../01-ARCHITECTURE.md`

---

**Last Updated**: 2025-10-28
**Research Status**: 7 models analyzed, 3 in production, 4 optional/validation pending
