# Web Scraper Skill - Implementation Ideas

**Status**: Idea phase - NOT implemented
**Purpose**: Extract structured data from web pages using MIT-licensed tools
**Stack**: node-html-markdown (MIT) + NuExtract-1.5-tiny (MIT)

---

## Decision Flowchart

```mermaid
flowchart TD
    Start([Web Page URL]) --> CheckFormat{What format<br/>is the source?}

    CheckFormat -->|Raw HTML| NeedsConversion[HTML → Markdown conversion needed]
    CheckFormat -->|Clean Markdown| DirectExtract[Skip to extraction]
    CheckFormat -->|Plain Text| DirectExtract
    CheckFormat -->|JSON/Structured| NoExtract[Already structured,<br/>no extraction needed]

    NeedsConversion --> LicenseChoice{License constraints?}

    LicenseChoice -->|Commercial use| UseMIT[Use node-html-markdown<br/>MIT licensed]
    LicenseChoice -->|Non-commercial OK| UseReaderLM[Use ReaderLM-v2<br/>Best quality]
    LicenseChoice -->|Research only| UseReaderLM

    UseMIT --> CheckLength{Markdown length?}
    UseReaderLM --> CheckLength

    CheckLength -->|< 15k tokens| DirectExtract
    CheckLength -->|> 15k tokens| NeedChunk[Chunking required]

    NeedChunk --> ChunkStrategy{Chunking strategy?}
    ChunkStrategy -->|By sections| SplitSections[Split on ## headers]
    ChunkStrategy -->|Pre-filter| FilterContent[Extract main content<br/>before conversion]
    ChunkStrategy -->|Larger model| UseNuExtract15[Use NuExtract-1.5 3.8B<br/>128K context]

    SplitSections --> DirectExtract
    FilterContent --> DirectExtract
    UseNuExtract15 --> DirectExtract

    DirectExtract --> HasSchema{Have JSON schema?}

    HasSchema -->|Yes| UseNuExtract[NuExtract-1.5-tiny<br/>Structured extraction]
    HasSchema -->|No| DefineSchema[Define schema first]

    DefineSchema --> UseNuExtract

    UseNuExtract --> ValidateJSON{Valid JSON?}

    ValidateJSON -->|Yes| Success([Structured data ready])
    ValidateJSON -->|No - Repeated text| FixTemp[Check temperature=0<br/>Ollama config]
    ValidateJSON -->|No - Invalid format| RetrySchema[Refine schema]

    FixTemp --> UseNuExtract
    RetrySchema --> UseNuExtract

    NoExtract --> Success

    style UseMIT fill:#90EE90
    style UseReaderLM fill:#FFB6C6
    style UseNuExtract fill:#90EE90
    style Success fill:#87CEEB
```

---

## Tool Comparison Matrix

| Criteria | node-html-markdown | ReaderLM-v2 | NuExtract-1.5-tiny |
|----------|-------------------|-------------|-------------------|
| **License** | ✅ MIT | ❌ CC BY-NC 4.0 | ✅ MIT |
| **Commercial use** | ✅ Allowed | ❌ Prohibited | ✅ Allowed |
| **Input format** | HTML | HTML | ANY text |
| **Output format** | Markdown | Markdown/JSON | JSON only |
| **Size** | ~50KB (library) | 935MB-3.1GB | 500MB |
| **Speed** | ⚡ Instant (rule-based) | 🐌 67/36 tok/s | ⚡ ~100-150 tok/s |
| **Context limit** | ♾️ Unlimited | 512K tokens | 8-20K tokens |
| **Quality** | ⭐⭐⭐ Good | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐⭐ GPT-4o-level |
| **Customization** | ⚠️ Limited | ❌ None | ✅ Fine-tunable |
| **Hallucinations** | 🚫 Zero (rules) | ⚠️ Low (generative) | 🚫 Zero (copy-paste) |
| **Ollama support** | N/A (library) | ✅ milkey/reader-lm-v2 | ✅ sroecker/nuextract-tiny-v1.5 |
| **tinyArms status** | ✅ Recommended | ❌ Excluded | ✅ Recommended |

---

## Pipeline Options

### Option A: Minimal (MIT-only, Fast)
```
HTML → node-html-markdown → Markdown → NuExtract-1.5-tiny → JSON
       (instant, rules)                  (500MB, <1s)
```

**Pros**:
- ✅ MIT licensed (no restrictions)
- ✅ Fastest (no LLM for HTML)
- ✅ Smallest footprint (500MB model only)

**Cons**:
- ⚠️ Lower HTML quality (10-30% vs ReaderLM)
- ⚠️ Requires chunking (8-20k limit)
- ⚠️ Struggles with very noisy HTML

**Best for**: Pre-commit hooks, fast extraction, clean HTML sources

---

### Option B: Quality (Hybrid, Slower)
```
HTML → ReaderLM-v2 → Markdown → NuExtract-1.5-tiny → JSON
       (935MB, 2-5s)            (500MB, <1s)
```

**Pros**:
- ✅ Best HTML quality (ROUGE-L 0.86)
- ✅ 512K context (no chunking)
- ✅ Handles noisy HTML perfectly

**Cons**:
- ❌ **LICENSE BLOCKER** (non-commercial only)
- ⚠️ Slower (LLM inference for HTML)
- ⚠️ Larger (935MB + 500MB = 1.4GB)

**Best for**: Non-commercial research, quality-critical projects

---

### Option C: Extended Context (MIT-only, Larger)
```
HTML → node-html-markdown → Markdown → NuExtract-1.5 (3.8B) → JSON
       (instant, rules)                  (2.18GB, 2-3s)
```

**Pros**:
- ✅ MIT licensed
- ✅ 128K context (less chunking)
- ✅ Better extraction quality

**Cons**:
- ⚠️ Larger model (2.18GB vs 500MB)
- ⚠️ Slower inference (~30-50 tok/s)
- ⚠️ Same HTML quality issues

**Best for**: Long documents, complex extraction, storage not constrained

---

## When to Use Which Approach

### Use **node-html-markdown alone** (no extraction):
- Converting documentation sites to Markdown
- Archiving web content
- Preparing content for human reading
- Creating offline documentation

### Use **NuExtract alone** (no HTML parsing):
- Extracting from API responses (already JSON/text)
- Parsing log files (plain text)
- Extracting from Markdown docs (already clean)
- Parsing config files (YAML, TOML, INI)

### Use **Full Pipeline** (HTML → Markdown → JSON):
- Scraping product data from e-commerce sites
- Extracting article metadata (author, date, tags)
- Parsing API documentation (endpoints, parameters)
- Building structured datasets from websites

### Use **Chunking Strategy**:
- Long articles (>15k tokens after Markdown conversion)
- Multi-page documentation
- API reference sites with many endpoints
- Academic papers (if HTML source)

---

## Implementation Considerations

### 1. Context Length Management

**Problem**: NuExtract-1.5-tiny has 8-20k token limit

**Solutions**:

**A. Chunk by sections** (Recommended for docs):
```typescript
function chunkMarkdown(markdown: string, maxTokens: number) {
  // Split on ## headers
  const sections = markdown.split(/^## /gm);

  const chunks = [];
  let currentChunk = '';

  for (const section of sections) {
    const tokens = estimateTokens(section);

    if (tokens > maxTokens) {
      // Section too large, split by paragraphs
      chunks.push(...splitByParagraphs(section, maxTokens));
    } else if (estimateTokens(currentChunk + section) > maxTokens) {
      // Current chunk full, start new one
      chunks.push(currentChunk);
      currentChunk = section;
    } else {
      // Add to current chunk
      currentChunk += '\n\n## ' + section;
    }
  }

  if (currentChunk) chunks.push(currentChunk);
  return chunks;
}
```

**B. Pre-filter content** (Recommended for web scraping):
```typescript
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

function extractMainContent(html: string) {
  const doc = new JSDOM(html);
  const reader = new Readability(doc.window.document);
  const article = reader.parse();

  return article?.content || html; // Fallback to full HTML
}
```

**C. Use larger model**:
```typescript
// Check content size, switch model dynamically
const tokens = estimateTokens(markdown);

const model = tokens > 15000
  ? 'nuextract:1.5' // 3.8B, 128K context
  : 'sroecker/nuextract-tiny-v1.5'; // 494M, 8-20K context
```

---

### 2. Temperature Configuration (CRITICAL)

**NuExtract requires `temperature: 0`** (Ollama defaults to 0.7)

**Problem**: Higher temperature causes text repetition, invalid JSON

**Solution**:
```typescript
import ollama from 'ollama';

async function nuextract(text: string, schema: object) {
  const response = await ollama.generate({
    model: 'sroecker/nuextract-tiny-v1.5',
    prompt: buildPrompt(text, schema),
    options: {
      temperature: 0, // REQUIRED for NuExtract
      num_predict: 2048
    }
  });

  return JSON.parse(response.response);
}
```

---

### 3. Schema Design

**Good schema** (explicit, typed):
```json
{
  "article": {
    "title": "string",
    "author": "string",
    "published_date": "date-time",
    "tags": ["string"],
    "word_count": "integer"
  }
}
```

**Bad schema** (vague, untyped):
```json
{
  "data": "object",
  "info": "string"
}
```

**Tips**:
- Use descriptive field names
- Specify types (string, integer, date-time, enum)
- Use arrays for multi-value fields
- Provide enums for known values
- Include optional fields explicitly

---

### 4. Error Handling

```typescript
async function extractWithRetry(
  html: string,
  schema: object,
  maxRetries: number = 3
): Promise<object> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Step 1: HTML → Markdown
      const markdown = nodeHtmlMarkdown(html, {
        useLinkReferenceDefinitions: false,
        useInlineLinks: true
      });

      // Step 2: Check length
      const tokens = estimateTokens(markdown);

      if (tokens > 15000) {
        // Chunk and extract
        const chunks = chunkMarkdown(markdown, 15000);
        const results = await Promise.all(
          chunks.map(chunk => nuextract(chunk, schema))
        );
        return mergeResults(results);
      }

      // Step 3: Extract
      return await nuextract(markdown, schema);

    } catch (error) {
      if (attempt === maxRetries) throw error;

      // Exponential backoff
      await sleep(1000 * Math.pow(2, attempt));
    }
  }
}
```

---

## Performance Estimates (M2 MacBook Air)

| Pipeline | HTML Size | Processing Time | Memory | Accuracy |
|----------|-----------|----------------|--------|----------|
| node-html-markdown + NuExtract-tiny | 100KB | <2s | ~1GB | ⭐⭐⭐⭐ |
| node-html-markdown + NuExtract-tiny | 1MB | 3-5s | ~1GB | ⭐⭐⭐⭐ |
| ReaderLM-v2 + NuExtract-tiny | 100KB | 5-8s | ~2GB | ⭐⭐⭐⭐⭐ |
| ReaderLM-v2 + NuExtract-tiny | 1MB | 10-15s | ~2GB | ⭐⭐⭐⭐⭐ |

**Note**: All estimates marked "(est.)" require M2 Air validation

---

## Example Use Cases

### 1. Scrape Product Data (E-commerce)
```typescript
const schema = {
  "product": {
    "name": "string",
    "price": "number",
    "currency": "string",
    "in_stock": "boolean",
    "rating": "number",
    "review_count": "integer",
    "images": ["string"]
  }
};

const html = await fetch('https://example.com/product/123');
const data = await extractWithPipeline(html, schema);
// → { product: { name: "Widget", price: 29.99, ... } }
```

### 2. Extract Article Metadata (Content Sites)
```typescript
const schema = {
  "article": {
    "title": "string",
    "author": "string",
    "published_date": "date-time",
    "updated_date": "date-time",
    "tags": ["string"],
    "category": "string",
    "summary": "string"
  }
};

const html = await fetch('https://blog.example.com/post/456');
const metadata = await extractWithPipeline(html, schema);
// → { article: { title: "How to...", author: "Jane", ... } }
```

### 3. Parse API Documentation (Developer Tools)
```typescript
const schema = {
  "endpoints": [{
    "method": "enum[GET,POST,PUT,DELETE,PATCH]",
    "path": "string",
    "description": "string",
    "parameters": [{
      "name": "string",
      "type": "string",
      "required": "boolean",
      "description": "string"
    }],
    "response_example": "string"
  }]
};

const html = await fetch('https://api.example.com/docs/reference');
const apiSpec = await extractWithPipeline(html, schema);
// → { endpoints: [{ method: "GET", path: "/users", ... }] }
```

---

## Integration with tinyArms

### Skill Configuration
```yaml
# apps/tinyArms/config/skills/web-scraper.yaml
name: web-scraper
description: Extract structured data from web pages
level: 2
routing_keywords:
  - scrape
  - extract from url
  - parse website
  - web data

dependencies:
  npm:
    - node-html-markdown
    - jsdom
    - @mozilla/readability
  ollama:
    - sroecker/nuextract-tiny-v1.5

config:
  default_parser: node-html-markdown # MIT licensed
  max_tokens: 15000 # Chunk threshold
  temperature: 0 # NuExtract requirement
  retry_attempts: 3
```

### CLI Usage
```bash
# Extract product data
tinyarms scrape https://example.com/product/123 \
  --schema product-schema.json \
  --output product-data.json

# Extract article metadata (with chunking)
tinyarms scrape https://longform.com/article \
  --schema article-schema.json \
  --chunk-size 15000

# Use larger model for long content
tinyarms scrape https://docs.example.com/api \
  --schema api-schema.json \
  --model nuextract:1.5 # 3.8B, 128K context
```

---

## Next Steps

1. **Validation Testing** (Week 1):
   - Install node-html-markdown + NuExtract-1.5-tiny on M2 Air
   - Test 50 web pages (clean, noisy, long)
   - Measure speed, memory, accuracy
   - Document real performance vs estimates

2. **Schema Library** (Week 2):
   - Create common schemas (product, article, API, event)
   - Test extraction quality per schema
   - Refine field definitions based on results

3. **Chunking Strategy** (Week 3):
   - Implement section-based chunking
   - Test on long documents (>20k tokens)
   - Measure quality degradation from chunking
   - Optimize merge logic for multi-chunk results

4. **CLI Implementation** (Week 4):
   - Build `tinyarms scrape` command
   - Add schema validation
   - Implement retry logic
   - Add progress indicators

5. **Documentation** (Week 5):
   - Create user guide with examples
   - Document common pitfalls (temperature, context)
   - Add troubleshooting section
   - Update index.md with web scraping use cases

---

## References

- **Model Research**: `docs/model-research/nuextract.md`
- **License Analysis**: `docs/model-research/readerlm-v2.md`
- **Index**: `docs/model-research/index.md` (Web Scraping & Extraction Models section)
- **node-html-markdown**: https://github.com/crosstype/node-html-markdown (MIT)
- **NuExtract**: https://huggingface.co/numind/NuExtract-1.5 (MIT)
- **Readability.js**: https://github.com/mozilla/readability (Apache 2.0)

---

**Last Updated**: 2025-10-28
**Status**: Idea phase - awaiting validation testing
