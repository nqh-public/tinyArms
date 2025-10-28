# 01: Entry Flow (CLI → Config → Executor)

## Overview
User invokes CLI command → loads config → initializes core components → runs skill

---

## CLI Entry Points

### Command: `tinyarms run <skill> [paths...]`
```
FUNCTION execute(skillName: string, inputPaths: string[], options: {dryRun, verbose}) → SkillResult
  1. Load configuration from ~/.config/tinyarms/config.yaml
  2. Validate config against Zod schema
  3. Expand tilde (~) paths to $HOME
  4. Create core components:
     - TieredRouter(config)
     - SkillExecutor(router, config)
     - Database(config.paths.database)
  5. Initialize database (create tables if needed)
  6. Start timer
  7. Check if skill is enabled
     - IF disabled THEN return {status: 'skipped'}
  8. Call executor.execute(skillName, inputPaths, options)
  9. Save task to database (unless --dry-run)
  10. Print results to console (--json for raw output)
  11. Exit with appropriate status code (0 or 1)
```

### Command: `tinyarms status`
```
FUNCTION status(options: {json: boolean})
  1. Load config
  2. Initialize TieredRouter, Database
  3. Gather status information:
     - Ollama server status (try connection)
     - Available models (ollama list)
     - Cache statistics (hit rate, distribution)
     - Recent tasks (last 5 from database)
     - Process memory usage
  4. Format output (pretty-print or JSON)
  5. Display to user
```

### Command: `tinyarms config <action> [key] [value]`
```
FUNCTION config(action: 'get'|'set'|'validate'|'show', key?: string, value?: string)
  IF action == 'get'
    1. Validate key provided
    2. Load config
    3. Navigate object using dot notation (e.g., 'skills.file-naming.enabled')
    4. Return value

  ELSE IF action == 'set'
    1. Validate key and value provided
    2. Load config
    3. Navigate to parent object, set key = value
    4. Call ConfigLoader.save(config)
    5. Confirm success

  ELSE IF action == 'validate'
    1. Load config
    2. Run Zod schema validation
    3. Report any errors with field path

  ELSE IF action == 'show'
    1. Load config
    2. Print entire config (pretty-printed)
```

### Command: `tinyarms models list|load|unload|info`
```
FUNCTION models(action: string, modelName?: string)
  1. Load config
  2. Connect to Ollama server (config.system.ollama_host)

  IF action == 'list'
    1. Call ollama.list()
    2. Show model name, size, format

  ELSE IF action == 'load'
    1. Validate modelName provided
    2. Run tiny inference (prompt='hello', num_predict=1)
    3. Model loads into memory
    4. Confirm loaded

  ELSE IF action == 'unload'
    1. Run inference with keep_alive: 0
    2. Model unloads from memory
    3. Confirm freed

  ELSE IF action == 'info'
    1. Call ollama.show(model)
    2. Display model details (parameters, size, template)
```

---

## Configuration Loading

### ConfigLoader.load(configPath?: string)
```
FUNCTION load(customPath?)
  1. Determine config file path
     - IF customPath provided USE customPath
     - ELSE USE ~/.config/tinyarms/config.yaml

  2. Read YAML file
     - IF file not found:
       a. Log "Creating default..."
       b. Call createDefault()
       c. Return default config

  3. Parse YAML to JSON object

  4. Validate with Zod schema
     - IF validation fails:
       a. Collect all error messages with paths
       b. Throw detailed error with all failures

  5. Expand all paths
     - Replace '~' with process.env.HOME
     - For each skill:
       - Expand watch_paths (if set)
       - Expand constitution_path (if set)
       - Expand transcription_path (if set)
     - For system paths:
       - Expand logs, database, skills, cache directories

  6. Return fully validated config object
```

### ConfigLoader.expandPaths(config)
```
FUNCTION expandPaths(config)
  CONST home = process.env.HOME || ''

  FOR EACH skill IN config.skills
    IF skill.watch_paths EXISTS
      skill.watch_paths = skill.watch_paths.map(p → p.replace('~', home))

    IF skill.constitution_path EXISTS
      skill.constitution_path = skill.constitution_path.replace('~', home)

    IF skill.transcription_path EXISTS
      skill.transcription_path = skill.transcription_path.replace('~', home)

  FOR EACH path IN [config.system.paths.logs, .database, .skills, .cache]
    path = path.replace('~', home)

  FOR EACH rule IN config.rules.file_types
    rule.destination = rule.destination.replace('~', home)
    IF rule.source_paths EXISTS
      rule.source_paths = rule.source_paths.map(p → p.replace('~', home))
```

---

## Database Initialization

### Database.init()
```
FUNCTION init()
  1. Create directory if not exists (path.dirname(dbPath))
  2. Open SQLite connection with WAL mode (better concurrency)
  3. Execute SQL schema:
     a. CREATE task_history table (9 columns)
        - Indexes on skill, timestamp
     b. CREATE cache_entries table (4 columns)
        - Indexes on key, expires_at
     c. CREATE user_feedback table (6 columns)
        - Foreign key to task_history
     d. CREATE system_metrics table (4 columns)
        - Indexes on metric_type, timestamp
  4. Connection ready for queries
```

---

## Skill Executor Initialization

### SkillExecutor constructor
```
FUNCTION constructor(router: TieredRouter, config: Config)
  Store router reference (for routing decisions)
  Store config reference (for skill settings)
```

### SkillExecutor.execute() main flow
```
FUNCTION execute(skillName, inputs, options)
  1. Start timer (Date.now())
  2. Get skill config by name
  3. Check if skill is enabled
     - IF disabled: return {status: 'skipped', results: [], stats: {0 processed}}

  4. GATHER INPUTS
     - Call gatherInputs(skillName, inputs)
     - Returns array of files/data to process
     - Log count if verbose

  5. PROCESS ITEMS
     - Call processItems(skillName, items, options)
     - Route each item through TieredRouter
     - Collect results

  6. CALCULATE STATS
     - total_items = items.length
     - processed = count with status='success'
     - skipped = count with status='skipped'
     - errors = count with status='error'
     - duration_ms = Date.now() - startTime

  7. RETURN RESULT
     - status = 'success' IF errors == 0, ELSE 'error'
     - Include timestamp, skill name, all results, stats

  CATCH error
    - Return error status with error message
    - Set duration_ms before returning
```

---

## Output Formatting

### printSkillResult(result, dryRun)
```
FUNCTION printSkillResult(result, dryRun)
  1. Print header: "🦖 TinyArms - {skillName}"
  2. Print status (with dry-run marker if applicable)
  3. Print each result item
     - For file-naming: "old-name → new-name"
     - For code-linting: "file.ts: X issues found"
  4. Print statistics
     - Total items processed
     - Count of processed, skipped, errors
     - Total duration in milliseconds
  5. If verbose: print confidence scores and routing level used
```
