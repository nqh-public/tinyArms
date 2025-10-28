# 05: Database Flow (SQLite Persistence)

## Overview
SQLite database stores task history, feedback, metrics, and cache entries for learning and analysis.

---

## Database Schema

### Table: task_history
```
SCHEMA:
┌──────────────┬───────────┬─────────────────────────────────┐
│ Column       │ Type      │ Purpose                         │
├──────────────┼───────────┼─────────────────────────────────┤
│ id           │ INTEGER   │ Primary key (auto-increment)    │
│ skill        │ TEXT      │ Which skill executed            │
│ timestamp    │ TEXT      │ User-provided timestamp         │
│ status       │ TEXT      │ 'success'/'error'/'skipped'     │
│ input        │ TEXT      │ JSON: what was passed to skill  │
│ output       │ TEXT      │ JSON: result from skill         │
│ level        │ TEXT      │ Which AI level handled it       │
│ confidence   │ REAL      │ Confidence 0.0-1.0              │
│ duration_ms  │ INTEGER   │ Milliseconds to execute         │
│ created_at   │ TEXT      │ Database timestamp              │
└──────────────┴───────────┴─────────────────────────────────┘

INDEXES:
- idx_task_skill ON skill (fast filtering by skill)
- idx_task_timestamp ON timestamp (fast filtering by date)

EXAMPLE ROW:
┌────┬───────────────┬──────────────────────┬─────────┬───────┬───────┬────────────────┬────────────┬──────────┐
│ id │ skill         │ timestamp            │ status  │ input │output │ level          │ confidence │ duration │
├────┼───────────────┼──────────────────────┼─────────┼───────┼───────┼────────────────┼────────────┼──────────┤
│ 1  │ file-naming   │ 2024-10-27T14:30:00Z │ success │ {...} │ {...} │ Level 0: Rules │ 0.9        │ 2        │
└────┴───────────────┴──────────────────────┴─────────┴───────┴───────┴────────────────┴────────────┴──────────┘
```

### Table: cache_entries
```
SCHEMA:
┌────────────┬───────────┬──────────────────────────────────┐
│ Column     │ Type      │ Purpose                          │
├────────────┼───────────┼──────────────────────────────────┤
│ id         │ INTEGER   │ Primary key                      │
│ key        │ TEXT      │ Cache key (MD5 hash)             │
│ value      │ TEXT      │ JSON-encoded RouterResult        │
│ created_at │ TEXT      │ When cached                      │
│ expires_at │ TEXT      │ When to discard                  │
└────────────┴───────────┴──────────────────────────────────┘

INDEXES:
- idx_cache_key ON key (fast lookup)
- idx_cache_expires ON expires_at (cleanup queries)

EXAMPLE:
┌────┬─────────────────────────┬───────────┬──────────────────┬──────────────────┐
│ id │ key                     │ value     │ created_at       │ expires_at       │
├────┼─────────────────────────┼───────────┼──────────────────┼──────────────────┤
│ 1  │ abc123def456 (MD5 hash) │ {...}     │ 2024-10-27 14:30 │ 2024-10-28 14:30 │
└────┴─────────────────────────┴───────────┴──────────────────┴──────────────────┘
```

### Table: user_feedback
```
SCHEMA:
┌──────────────────┬───────────┬──────────────────────────────────┐
│ Column           │ Type      │ Purpose                          │
├──────────────────┼───────────┼──────────────────────────────────┤
│ id               │ INTEGER   │ Primary key                      │
│ task_id          │ INTEGER   │ Foreign key to task_history      │
│ feedback_type    │ TEXT      │ 'thumbs_up'/'thumbs_down'/'correction'│
│ original_output  │ TEXT      │ What AI produced                 │
│ corrected_output │ TEXT      │ What user corrected to           │
│ comment          │ TEXT      │ Optional user comment            │
│ created_at       │ TEXT      │ When feedback given              │
└──────────────────┴───────────┴──────────────────────────────────┘

USAGE:
- "I renamed this wrong" (correction)
- "Great job!" (thumbs_up)
- "That was incorrect" (thumbs_down)

EXAMPLE:
┌────┬─────────┬────────────────┬───────────────────┬────────────────┬──────────┐
│ id │ task_id │ feedback_type  │ original_output   │ corrected_output│ comment │
├────┼─────────┼────────────────┼───────────────────┼────────────────┼──────────┤
│ 1  │ 42      │ correction     │ "wrong-name.png"  │ "correct-name.png" │ null │
└────┴─────────┴────────────────┴───────────────────┴────────────────┴──────────┘
```

### Table: system_metrics
```
SCHEMA:
┌───────────────┬───────────┬──────────────────────────────┐
│ Column        │ Type      │ Purpose                      │
├───────────────┼───────────┼──────────────────────────────┤
│ id            │ INTEGER   │ Primary key                  │
│ metric_type   │ TEXT      │ 'memory'/'battery'/'cache'   │
│ value         │ REAL      │ Metric value                 │
│ timestamp     │ TEXT      │ When recorded                │
└───────────────┴───────────┴──────────────────────────────┘

INDEXES:
- idx_metrics_type ON metric_type
- idx_metrics_timestamp ON timestamp

EXAMPLE:
┌────┬──────────────┬───────┬──────────────────┐
│ id │ metric_type  │ value │ timestamp        │
├────┼──────────────┼───────┼──────────────────┤
│ 1  │ cache_hit_rate│ 0.72 │ 2024-10-27 14:30 │
│ 2  │ memory_used  │ 2048  │ 2024-10-27 14:30 │
│ 3  │ battery_pct  │ 85    │ 2024-10-27 14:30 │
└────┴──────────────┴───────┴──────────────────┘
```

---

## Database Operations

### Database.init()
```
PROCEDURE: Initialize SQLite database

1. Ensure directory exists
   - dirPath = path.dirname(dbPath)
   - IF !exists: mkdir(dirPath, recursive: true)

2. Open database connection
   - db = new Database(dbPath)

3. Set WAL mode (Write-Ahead Logging)
   - db.pragma('journal_mode = WAL')
   - Better concurrency for multiple readers

4. Create schema if not exists
   - CREATE TABLE task_history (...)
   - CREATE TABLE cache_entries (...)
   - CREATE TABLE user_feedback (...)
   - CREATE TABLE system_metrics (...)
   - CREATE INDEX ... (for performance)

5. Connection ready
```

### Database.saveTaskHistory(task)
```
PROCEDURE: Record task execution

INPUT:
{
  skill: 'file-naming',
  timestamp: '2024-10-27T14:30:00Z',
  status: 'success',
  input: '["~/Downloads"]',
  output: '[{"original": "IMG_1234.jpg", "renamed": "sunset-photo.jpg"}]',
  level: 'Level 0: Deterministic Rules',
  confidence: 0.9,
  duration_ms: 2
}

1. Prepare INSERT statement
   SQL: INSERT INTO task_history (skill, timestamp, status, input, output, level, confidence, duration_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)

2. Bind parameters (safe from SQL injection)
   - skill
   - timestamp
   - status
   - input (JSON string)
   - output (JSON string)
   - level
   - confidence
   - duration_ms

3. Execute
   - stmt.run(...)

4. Record stored in database with auto-generated ID
```

### Database.getTaskHistory(options)
```
PROCEDURE: Query task history with filters

INPUT: {limit: 100, skill: 'file-naming', status: 'success', since: '2024-10-26T00:00:00Z'}

ALGORITHM:
1. Start with base query
   query = "SELECT * FROM task_history WHERE 1=1"
   params = []

2. Apply filters dynamically
   IF options.skill:
     query += " AND skill = ?"
     params.push(options.skill)

   IF options.status:
     query += " AND status = ?"
     params.push(options.status)

   IF options.since:
     query += " AND timestamp >= ?"
     params.push(options.since)

3. Order by most recent
   query += " ORDER BY created_at DESC"

4. Apply limit
   IF options.limit:
     query += " LIMIT ?"
     params.push(options.limit)

5. Execute and return
   stmt = db.prepare(query)
   RETURN stmt.all(...params)

EXAMPLE QUERIES GENERATED:
- Get last 10 tasks: "SELECT * FROM task_history ORDER BY created_at DESC LIMIT ?"
- Get file-naming only: "SELECT * FROM task_history WHERE skill = ? ORDER BY created_at DESC"
- Get errors only: "SELECT * FROM task_history WHERE status = ? ORDER BY created_at DESC"
```

### Database.saveFeedback(feedback)
```
PROCEDURE: Record user feedback on task

INPUT:
{
  taskId: 42,
  type: 'correction',
  originalOutput: 'wrong-name.png',
  correctedOutput: 'correct-name.png',
  comment: 'Date should come first'
}

1. Prepare INSERT
   SQL: INSERT INTO user_feedback (task_id, feedback_type, original_output, corrected_output, comment)
        VALUES (?, ?, ?, ?, ?)

2. Bind parameters
   - taskId
   - type (converted to snake_case)
   - originalOutput or null
   - correctedOutput or null
   - comment or null

3. Execute
   - stmt.run(...)

4. Record stored with auto-generated ID
   - Links to original task_history entry
```

### Database.getStats()
```
PROCEDURE: Get aggregated statistics for analysis

1. COUNT total tasks
   SELECT COUNT(*) FROM task_history
   RETURN: {count: 1250}

2. COUNT tasks by skill
   SELECT skill, COUNT(*) as count FROM task_history GROUP BY skill
   RETURN: {
     'file-naming': 800,
     'code-linting': 400,
     'markdown-analysis': 50
   }

3. COUNT tasks by status
   SELECT status, COUNT(*) as count FROM task_history GROUP BY status
   RETURN: {
     'success': 1200,
     'skipped': 30,
     'error': 20
   }

4. AVERAGE metrics
   SELECT AVG(duration_ms) as avgDuration, AVG(confidence) as avgConfidence
   FROM task_history
   RETURN: {avgDuration: 4.5, avgConfidence: 0.87}

5. RETURN aggregated stats object
```

---

## Data Cleanup

### Database.cleanup(options)
```
PROCEDURE: Remove old data to save space

INPUT: {olderThanDays: 30, keepFeedback: true}

ALGORITHM:
1. Calculate cutoff date
   - cutoffDate = today - 30 days
   - cutoff = '2024-09-27T00:00:00Z'

2. Delete old task history
   IF !keepFeedback:
     DELETE FROM task_history WHERE created_at < '2024-09-27'
   ELSE:
     DELETE FROM task_history
     WHERE created_at < '2024-09-27'
     AND id NOT IN (SELECT task_id FROM user_feedback)
     (Keep tasks that have user feedback)

3. Delete expired cache entries
   DELETE FROM cache_entries WHERE expires_at < now()

4. Delete old metrics
   DELETE FROM system_metrics WHERE timestamp < '2024-09-27'

5. Vacuum database
   VACUUM (reclaim disk space)

RESULT:
- Database smaller
- Query performance may improve
- Old data discarded
```

### Cache Cleanup (Periodic)

```
PROCEDURE: Run periodically (e.g., hourly) to maintain cache

1. Call db.cleanExpired() OR cache.cleanExpired()

2. OR let cache_entries expire naturally
   - Queries with cleanup: DELETE FROM cache_entries WHERE expires_at < now()

3. OR combine with VACUUM for space reclamation
```

---

## Data Export

### Database.export(format='json')
```
PROCEDURE: Export database for analysis

INPUT: format = 'json' or 'csv'

IF format == 'json':
  1. Fetch all data
     - tasks = SELECT * FROM task_history (all rows)
     - feedback = SELECT * FROM user_feedback (all rows)
     - metrics = SELECT * FROM system_metrics (all rows)
     - stats = getStats()

  2. Create export object
     export = {
       tasks: [...],
       feedback: [...],
       metrics: [...],
       stats: {...}
     }

  3. Serialize to JSON
     RETURN JSON.stringify(export, null, 2)

IF format == 'csv':
  1. Create CSV header
     csv = "skill,timestamp,status,level,confidence,duration_ms\n"

  2. For each task
     FOR EACH task IN tasks
       csv += "{skill},{timestamp},{status},{level},{confidence},{duration_ms}\n"

  3. RETURN csv string

USAGE:
- Send to external analysis tools
- Create reports
- Machine learning on past decisions
```

---

## Database Connection Management

### Database.close()
```
PROCEDURE: Close database connection

1. db.close()

WHEN TO USE:
- Application shutdown
- Graceful shutdown before restart
- Error recovery
```

---

## Data Recovery & Integrity

### WAL Mode Benefits
```
WRITE-AHEAD LOGGING (enabled with pragma('journal_mode = WAL'))

BENEFITS:
1. Better concurrency
   - Readers don't block writers
   - Writers don't block readers
   - Multiple readers can run simultaneously

2. Safer writes
   - Changes written to WAL log first
   - Then committed to main database
   - If crash: WAL log replayed on recovery

3. Reduced disk churn
   - Fewer fsync() calls
   - Better for SSDs

TRADE-OFF:
- Requires more disk space (WAL file)
- Not suitable for network filesystems

FOR TINYARMS:
- Local SQLite: WAL is perfect
- Typically one process: no concurrency issues
- But handles edge cases better
```
