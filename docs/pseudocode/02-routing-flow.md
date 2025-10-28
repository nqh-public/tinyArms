# 02: Routing Flow (Tiered Intelligence)

## Overview
The TieredRouter evaluates each task through 3 levels of increasing complexity, escalating only when confidence is insufficient.

---

## Main Routing Algorithm

### TieredRouter.route(input: RouterInput)
```
FUNCTION route(input: RouterInput) → RouterResult

  1. CHECK CACHE FIRST
     - cacheKey = cache.getCacheKey(input)
     - cachedResult = cache.get(cacheKey)
     - IF cachedResult found AND not expired
       RETURN {cached: true, ...cachedResult}

  2. DEFINE LEVEL HIERARCHY
     ARRAY levels = [
       {name: 'Level 0: Deterministic Rules',    threshold: 1.0,   fn: tryLevel0},
       {name: 'Level 1: Gemma 3 4B',             threshold: 0.75,  fn: tryLevel1},
       {name: 'Level 2: Qwen 7B',                threshold: 0.80,  fn: tryLevel2},
     ]

  3. TRY EACH LEVEL IN ORDER
     FOR EACH level IN levels
       a. IF level requires memory (L1 or L2)
          - Check memory availability
          - IF insufficient: skip to next level with warning

       b. Record startTime

       c. TRY to execute level
          - result = level.fn(input)
          - latencyMs = Date.now() - startTime

       d. IF result AND result.confidence ≥ level.threshold
          - Cache successful result
          - RETURN result with latency + level name

       e. ELSE IF result exists but confidence too low
          - Log escalation message with confidence + threshold
          - Continue to next level

       f. CATCH error
          - Log error message
          - Continue to next level

  4. ALL LEVELS FAILED
     - Call handleFallback(input)
     - RETURN fallback response based on config
```

---

## Level 0: Deterministic Rules

### TieredRouter.tryLevel0(input)
```
FUNCTION tryLevel0(input: RouterInput)

  SWITCH input.skill

    CASE 'file-naming'
      1. Call level0.autoRenameFile(filePath, context)
      2. IF result is null (no rule matched)
         RETURN null (escalate to Level 1)
      3. ELSE RETURN {output: result, confidence: 1.0}

    CASE 'voice-actions'
      1. Call level0.cleanVoiceTranscript(text)
      2. IF level0.hasSimpleKeywords(cleaned)
         a. Extract keywords
         b. RETURN {output: {cleaned, keywords}, confidence: 1.0}
      3. ELSE RETURN null (needs AI)

    DEFAULT
      RETURN null (no Level 0 handler)
```

### Level0.autoRenameFile(filePath, context?)
```
FUNCTION autoRenameFile(filePath, context?)

  1. DETECT FILE TYPE
     - typeResult = detectFileType(filePath)
     - IF no type detected: RETURN null (need AI)

  2. EXTRACT TEXT FOR KEYWORDS
     - text = context OR filename without extension
     - IF !hasSimpleKeywords(text): RETURN null (need AI)

  3. EXTRACT KEYWORDS
     - keywords = extractKeywords(text, maxKeywords=5)

  4. GENERATE NEW FILENAME
     - ext = file extension
     - newName = generateFilename(keywords, ext)

  5. INFER DESTINATION DIRECTORY
     - destination = inferDirectory(filePath, typeResult.type)

  6. RETURN {newName, destination, confidence: typeResult.confidence}
```

---

## Level 1: Gemma 3 4B

### TieredRouter.tryLevel1(input)
```
FUNCTION tryLevel1(input: RouterInput)

  SWITCH input.skill

    CASE 'file-naming'
      1. Call level1.generateFilename({originalName, fileType, context})
      2. Get destination using Level0.detectFileType rules
      3. RETURN {output: {newName, destination}, confidence: result.confidence}

    CASE 'markdown-analysis'
      1. Call level1.analyzeMarkdownChanges(input.data.changes)
      2. RETURN {output: result, confidence: result.confidence}

    CASE 'voice-actions'
      1. Call level1.extractIntent(input.data.text)
      2. RETURN {output: result, confidence: result.confidence}

    DEFAULT
      RETURN null
```

### Level1.generateFilename(input)
```
FUNCTION generateFilename(input: {originalName, fileType?, context?})

  1. BUILD PROMPT
     prompt = "You are a file naming expert. Generate a clean, descriptive filename.

     Input:
     - Original: {originalName}
     {IF fileType: - Type: {fileType}}
     {IF context: - Context: {context}}

     Rules:
     1. Use kebab-case (lowercase with hyphens)
     2. Descriptive but concise (3-5 words max)
     3. Remove dates, 'screenshot', 'untitled'
     4. Only filename, no extension

     Examples:
     - 'Screenshot 2024-10-27.png' → 'hero-mockup-mobile'
     - 'Untitled design.fig' → 'dashboard-redesign'
     - 'IMG_1234.jpg' → 'golden-gate-sunset'

     Output ONLY the filename, nothing else."

  2. CALL OLLAMA
     - model = gemma3:4b
     - temperature = 0.7
     - num_predict = 50
     - response = ollama.generate(prompt)

  3. CLEAN OUTPUT
     - filename = response.trim().toLowerCase()

  4. ESTIMATE CONFIDENCE
     - confidence = estimateConfidence(filename, originalName)
     - Base: 0.85
     - Penalty if too similar to original (-0.2)
     - Penalty if too long (-0.1)
     - Penalty if bad characters (-0.15)
     - Bonus if clean format (+0.05)
     - Clamp: 0.0 to 1.0

  5. RETURN {filename, confidence}
```

### Level1.extractIntent(text)
```
FUNCTION extractIntent(text: string)

  1. BUILD PROMPT
     prompt = "Extract the user's intent from this text.

     Text: \"{text}\"

     Output as JSON:
     {
       \"intent\": \"brief description of what user wants\",
       \"action\": \"specific action (e.g., 'rename_file', 'move_file')\",
       \"parameters\": {\"key\": \"value\"}
     }

     Output ONLY the JSON, no explanation."

  2. CALL OLLAMA
     - temperature = 0.3 (lower for structured output)
     - num_predict = 200
     - response = ollama.generate(prompt)

  3. CLEAN JSON
     - Remove markdown code blocks
     - Extract JSON object with regex

  4. PARSE
     - parsed = JSON.parse(cleaned)
     - IF parse fails: throw error

  5. ESTIMATE CONFIDENCE
     - Base: 0.80
     - Penalties for uncertainty markers (-0.25)
     - Check required fields present (-0.15 per missing)
     - Bonus for well-structured output (+0.05)
     - Clamp: 0.3 to 1.0

  6. RETURN {intent, action, parameters, confidence}
```

---

## Level 2: Qwen 7B (Code Specialist)

### TieredRouter.tryLevel2(input)
```
FUNCTION tryLevel2(input: RouterInput)

  IF input.skill != 'code-linting'
    RETURN null (Level 2 only handles code)

  1. ENSURE MODEL LOADED
     - IF !level2.isReady()
       CALL level2.load() (triggers 10-15s load)

  2. CALL LINTING
     - result = level2.lintCode({
         filePath: input.data.filePath,
         code: input.data.code,
         constitutionPath: input.context?.constitutionPath
       })

  3. RETURN {output: result, confidence: result.confidence}
```

### Level2.lintCode(input)
```
FUNCTION lintCode(input: {filePath, code, constitutionPath?})

  1. LOAD CONSTITUTION (if provided)
     - IF constitutionPath provided
       TRY constitution = fs.readFile(constitutionPath)
       CATCH (warn and continue with empty)

  2. BUILD LINTING PROMPT
     prompt = "You are a constitutional code linter.

     File: {filePath}

     {IF constitution: Constitution:\n{constitution}\n}

     Code:
     ```
     {code}
     ```

     Find issues:
     1. Violations of constitutional principles
     2. Code quality problems
     3. Potential bugs
     4. Security vulnerabilities

     Format as JSON:
     {
       \"issues\": [
         {\"line\": N, \"severity\": \"error|warning|info\",
          \"category\": \"constitutional|quality|bug|security\",
          \"message\": \"...\", \"suggestion\": \"...\"}
       ],
       \"summary\": \"Brief overview\"
     }

     Output ONLY the JSON."

  3. CALL OLLAMA
     - model = qwen2.5-coder:7b
     - temperature = config value
     - num_predict = 2000
     - response = ollama.generate(prompt)

  4. CLEAN & PARSE JSON
     - Remove markdown blocks
     - Extract JSON with regex
     - parsed = JSON.parse(cleaned)

  5. ESTIMATE CONFIDENCE
     - Base: 0.85
     - Penalties for uncertainty markers (-0.25)
     - Verify expected structure (issues array present)
     - Bonus if detailed issues with line numbers (+0.05)
     - Penalty if output too short (-0.30)
     - Clamp: 0.3 to 1.0

  6. RETURN {issues, summary, confidence}
```

---

## Memory Availability Check

### TieredRouter.checkMemoryAvailability(levelName)
```
FUNCTION checkMemoryAvailability(levelName: string)

  1. GET SYSTEM MEMORY
     - freeMemGB = os.freemem() / (1024^3)
     - totalMemGB = os.totalmem() / (1024^3)
     - usedMemGB = totalMemGB - freeMemGB

  2. DETERMINE REQUIREMENTS
     - IF levelName includes 'Level 2'
       requiredGB = 7.0  (Qwen 7B: 6GB model + 1GB cache)
     - ELSE
       requiredGB = 4.0  (Gemma 3 4B: 3GB model + 1GB cache)

  3. CHECK THRESHOLD
     - IF freeMemGB < requiredGB
       WARN user about memory shortage
       RETURN {ok: false, message: '...'}
     - ELSE IF freeMemGB < requiredGB + 1
       WARN about tight memory situation
     - RETURN {ok: true, message: '...'}
```

---

## Cache Integration

### TieredRouter cache flow
```
FUNCTION route flow with cache

  1. BEFORE routing: cacheKey = cache.getCacheKey(input)
  2. IF cacheKey in cache AND not expired
     a. cache.stats.hits++
     b. RETURN cached result immediately

  3. AFTER successful routing (confidence ≥ threshold)
     a. IF result.confidence ≥ 0.75 AND result.level != 'Fallback'
        cache.set(input, result)
        - Stores with TTL (default 24 hours)
        - Evicts oldest if cache full

  4. Cache hit rate tracked for `tinyarms status`
```

---

## Fallback Handling

### TieredRouter.handleFallback(input)
```
FUNCTION handleFallback(input: RouterInput)

  fallbackStrategy = config.system.routing.fallback

  SWITCH fallbackStrategy

    CASE 'ask_user'
      RETURN {
        output: {
          status: 'needs_review',
          message: "I'm not confident about this task. Please review manually.",
          data: input.data
        },
        confidence: 0.0,
        level: 'Fallback: Ask User',
        latencyMs: 0
      }

    CASE 'skip'
      RETURN {
        output: {status: 'skipped', message: 'Task skipped due to low confidence'},
        confidence: 0.0,
        level: 'Fallback: Skip',
        latencyMs: 0
      }

    CASE 'error'
      THROW Error("All routing levels failed for skill: {input.skill}")

    DEFAULT
      THROW Error("Unknown fallback strategy: {fallbackStrategy}")
```
