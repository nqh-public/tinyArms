# 03: Intelligence Layers (L0, L1, L2)

## Level 0: Deterministic Rules (0ms, 100% accurate when matched)

### Level0.detectFileType(filePath)
```
FLOWCHART: Determine file type from rules

INPUT: ~/Downloads/design-mockup.fig

1. Extract metadata
   - ext = path.extname() → ".fig"
   - fileName = path.basename() → "design-mockup.fig"
   - dirPath = path.dirname() → "~/Downloads"

2. Loop through configured file type rules
   FOR EACH rule IN config.rules.file_types

     A. Check extension match
        IF rule.extensions.includes(ext)
          - Move to next checks
        ELSE
          - Skip this rule

     B. Check source path (if specified in rule)
        IF rule.source_paths defined
          - Check if dirPath includes any source_path
          - IF not matched: skip this rule

     C. Check keywords in filename (if specified)
        IF rule.keywords defined
          - Check if fileName includes any keyword
          - IF yes: RETURN {type, confidence: 1.0} ← highest confidence

     D. If we reach here: extension matched
        RETURN {type, confidence: 0.9} ← good confidence

3. No rules matched
   RETURN null (escalate to Level 1)

OUTPUT: {type: 'design', confidence: 0.9}
```

### Level0.extractKeywords(text, maxKeywords=5)
```
PROCEDURE: RAKE-like keyword extraction (no AI)

INPUT: "Screenshot 2024-10-27 project mockup.png"

1. Define stop words
   CONST stopWords = SET[
     'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on',
     'at', 'to', 'for', 'of', 'with', 'by', 'from',
     'is', 'was', 'are', 'been', 'um', 'uh', ...
   ]

2. Clean and split text
   - Lowercase: "screenshot 2024-10-27 project mockup.png"
   - Remove non-alphanumeric (keep spaces): "screenshot 2024 10 27 project mockup png"
   - Split on whitespace: ["screenshot", "2024", "10", "27", "project", "mockup", "png"]

3. Filter out stop words and short words
   - Keep words: length > 2 AND not in stopWords
   - Result: ["screenshot", "project", "mockup"]

4. Count word frequency
   - frequency = {
       "screenshot": 1,
       "project": 1,
       "mockup": 1,
     }

5. Sort by frequency (descending)
   - [screenshot: 1, project: 1, mockup: 1] (all equal)

6. Return top N keywords
   - RETURN ["screenshot", "project", "mockup"] (first 5)

OUTPUT: ["screenshot", "project", "mockup"]
```

### Level0.generateFilename(keywords, extension)
```
PROCEDURE: Format keywords into clean filename

INPUT:
- keywords = ["screenshot", "project", "mockup"]
- extension = ".png"

1. Join with hyphens
   - text = "screenshot-project-mockup"

2. Lowercase and remove special chars
   - text = "screenshot-project-mockup" (already clean)

3. Collapse multiple hyphens
   - text = text.replace(/-+/g, '-')
   - text = "screenshot-project-mockup"

4. Trim and add extension
   - filename = "screenshot-project-mockup" + ".png"

OUTPUT: "screenshot-project-mockup.png"
```

### Level0.cleanVoiceTranscript(text)
```
PROCEDURE: Remove filler words from transcript

INPUT: "Um, like you know I need to, um, rename this like screenshot thing"

CONST fillers = [
  'um', 'uh', 'like', 'you know', 'sort of', 'kind of',
  'basically', 'actually', 'literally', 'i mean', 'you see'
]

FOR EACH filler IN fillers
  1. Create case-insensitive regex: /\b{filler}\b/gi
  2. Replace all occurrences with empty string
  3. Result: "  I need to,  rename this  screenshot thing"

3. Cleanup multiple spaces
   - text.replace(/\s+/g, ' ') → "I need to, rename this screenshot thing"

4. Trim edges
   - text.trim() → "I need to, rename this screenshot thing"

OUTPUT: "I need to, rename this screenshot thing"
```

---

## Level 1: Gemma 3 4B (2-4s inference, 85-90% accuracy)

### Level1 Confidence Scoring Algorithm

```
ALGORITHM: Estimate confidence for Level 1 responses

BASE CONFIDENCE = 0.85

PENALTIES:
1. Output too similar to input
   - IF generated == original.toLowerCase().replace(/\s+/g, '-')
     confidence -= 0.20  (model didn't process well)

2. Output too long
   - IF word_count > 5
     confidence -= 0.10  (should be 3-5 words)

3. Bad characters in output
   - IF NOT matches /^[a-z0-9-]+$/
     confidence -= 0.15  (contains illegal chars)

BONUSES:
1. Clean output format
   - IF length ∈ [10, 40] AND matches /^[a-z0-9-]+$/
     confidence += 0.05

FINAL CONFIDENCE = clamp(confidence, 0.0, 1.0)

EXAMPLE:
- Base: 0.85
- Model output: "hero-mockup-mobile" (clean, 3 words)
- Penalties: 0 (no issues)
- Bonuses: +0.05 (clean format)
- Final: 0.90
```

### Level1 JSON Response Confidence

```
ALGORITHM: Estimate confidence for JSON responses

BASE CONFIDENCE = 0.80

UNCERTAINTY PENALTIES:
- IF response contains: 'not sure', 'maybe', 'unclear'
  confidence -= 0.25

STRUCTURAL CHECKS:
1. Required fields present
   - FOR EACH field IN required_fields
     - IF parsed[field] is missing or null
       confidence -= 0.15
2. Array length checks
   - IF array.length < minimum_required
     confidence -= 0.20
   - ELSE IF array.length >= 3
     confidence += 0.05  (bonus for detailed output)

WELL-FORMED STRUCTURE:
- IF response is valid object with keys
  confidence += 0.05

FINAL CONFIDENCE = clamp(confidence, 0.3, 1.0)

EXAMPLE (markdown analysis):
- Base: 0.80
- Has required fields (summary, suggestions): ±0
- Suggestions array has 3 items: +0.05
- No uncertainty markers: ±0
- Final: 0.85
```

---

## Level 2: Qwen 7B (10-15s inference, 88% accuracy on code)

### Level2 Confidence Scoring Algorithm

```
ALGORITHM: Estimate confidence for Level 2 code analysis

BASE CONFIDENCE = 0.85

UNCERTAINTY PENALTIES:
- IF response contains: 'not sure', 'uncertain', 'might be'
  confidence -= 0.25

STRUCTURAL VALIDATION:
1. Issues array
   - IF issues found but array is empty
     confidence -= 0.15  (expected issues but got none)
   - IF each issue has: line, severity, message
     confidence += 0.05  (detailed issues)

2. Suggestions array
   - IF suggestions have both: suggestion + message
     confidence += 0.05  (actionable)

3. Compliance score
   - IF compliance is number between 0-1
     confidence += 0.05  (valid metric)

COMPLETENESS:
- IF response.length < 50 characters
  confidence -= 0.30  (likely incomplete)

FINAL CONFIDENCE = clamp(confidence, 0.3, 1.0)

EXAMPLE (code linting with issues found):
- Base: 0.85
- Found 3 constitutional violations: +0.05 (detailed)
- Suggestions are actionable: +0.05
- Response 500+ chars: ±0
- No uncertainty: ±0
- Final: 0.95
```

---

## Model Loading & Memory Management

### Level1.load()
```
PROCEDURE: Load Gemma 3 4B into memory

1. Trigger model load with tiny inference
   - ollama.generate({
       model: 'gemma3:4b',
       prompt: 'hello',
       options: {num_predict: 1}
     })

2. Model stays in memory until keep_alive timeout
   - Default timeout: 5 minutes
   - Subsequent calls reuse loaded model
```

### Level2.load()
```
PROCEDURE: Load Qwen 7B into memory (heavy operation)

1. Check available memory (should be done by router already)

2. Log user-facing message
   - "Loading Qwen 7B (this may take 10-15 seconds)..."

3. Trigger model load
   - ollama.generate({
       model: 'qwen2.5-coder:7b',
       prompt: 'hello',
       options: {num_predict: 1}
     })

4. Model consumes ~6GB RAM
   - Keep_alive timeout: 2 minutes for expensive model
```

### Model Unload

```
PROCEDURE: Unload model from memory

1. Call ollama.generate() with keep_alive: 0
   - ollama.generate({
       model: 'model-name',
       prompt: '',
       keep_alive: 0
     })

2. Model immediately unloaded
   - Memory freed
   - Future calls will reload (slower)
```

---

## JSON Response Cleaning

### cleanJSONResponse(rawResponse)
```
PROCEDURE: Extract valid JSON from LLM response

INPUT:
"
Here's the analysis:
```json
{
  \"issues\": [{\"line\": 42}],
  \"summary\": \"Found issues\"
}
```

Some extra text here
"

STEPS:
1. Remove markdown code block markers
   - cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '')
   - Result: "Here's the analysis: {...} Some extra text"

2. Extract JSON object with regex
   - jsonMatch = cleaned.match(/\{[\s\S]*\}/)
   - Finds first complete JSON object
   - Result: "{\"issues\": [...], \"summary\": \"...\"}"

3. IF found: return extracted JSON
   ELSE: return trimmed response

OUTPUT: '{"issues": [...], "summary": "..."}'
```

---

## Model Readiness Check

### Level.isReady()
```
PROCEDURE: Check if model is loaded

1. Query Ollama server
   - models = ollama.list()

2. Search loaded models
   - FOR EACH model IN models.models
     - IF model.name == this.modelConfig.path
       RETURN true

3. Model not found
   - RETURN false (model needs loading)
```
