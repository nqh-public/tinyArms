# 04: Caching Flow (LRU Cache with Pattern Normalization)

## Overview
Cache avoids redundant AI inference by remembering decisions for similar inputs.

Example: Rename 20 similar screenshots → first decision cached, remaining 19 hits.

---

## Cache Key Generation

### RouterCache.getCacheKey(input: RouterInput)
```
FUNCTION getCacheKey(input: RouterInput) → string

  IF input.skill == 'file-naming'

    1. Normalize filename pattern
       pattern = normalizeFilename(input.data.filePath)
       Example:
       - "Screenshot 2024-10-27.png" → "screenshot-date.png"
       - "IMG_1234.jpg" → "img-number.jpg"

    2. Create hash
       cacheKey = MD5(
         "{skill}:{pattern}:{fileType or ''}"
       )
       Example: "abc123def456"

    RETURN cacheKey

  ELSE IF input.skill == 'code-linting'

    1. Hash file content (to detect changes)
       contentHash = MD5(input.data.code)

    2. Combine with filepath
       cacheKey = "{skill}:{filePath}:{contentHash}"
       Example: "code-linting:src/app.ts:xyz789"

    RETURN cacheKey

  ELSE

    1. Hash entire input object
       cacheKey = MD5(JSON.stringify(input))

    RETURN cacheKey
```

### RouterCache.normalizeFilename(filename)
```
PROCEDURE: Convert filenames to pattern form

INPUT: "Screenshot 2024-10-27 project.png"

STEPS:
1. Lowercase
   → "screenshot 2024-10-27 project.png"

2. Replace dates (YYYY-MM-DD format) with 'date'
   - Regex: /\d{4}-\d{2}-\d{2}/g
   → "screenshot date project.png"

3. Replace times (HH:MM:SS format) with 'time'
   - Regex: /\d{2}:\d{2}:\d{2}/g
   → (no change in this example)

4. Replace all numbers with 'number'
   - Regex: /\d+/g
   → "screenshot date project.png" (dates already converted)

5. Replace special characters with hyphens
   - Regex: /[^a-z0-9.-]/g
   → "screenshot-date-project.png"

RESULT: All files matching pattern use same cache key
- "Screenshot 2024-10-28 project.png" → same cache key
- "IMG_1234.jpg" → "img-number.jpg" (same pattern)
```

---

## Cache Operations

### RouterCache.get(input: RouterInput) → RouterResult | null
```
PROCEDURE: Retrieve cached result

INPUT: RouterInput for file-naming task

1. Check if cache enabled
   - IF !this.enabled: RETURN null (cache disabled)

2. Generate cache key
   - cacheKey = getCacheKey(input)

3. Look up in Map
   - entry = cache.get(cacheKey)
   - IF not found:
     stats.misses++
     RETURN null

4. Check expiration
   - IF Date.now() > entry.expiresAt
     a. Delete from cache
     b. stats.misses++
     c. RETURN null (expired)

5. Cache hit
   - stats.hits++
   - RETURN entry.result (removes 'cached' field during storage)

RETURN RouterResult | null
```

### RouterCache.set(input: RouterInput, result: RouterResult)
```
PROCEDURE: Cache a routing result

INPUT:
- input: RouterInput (original query)
- result: RouterResult (successful routing decision)

1. Check if cache enabled
   - IF !enabled: RETURN (do nothing)

2. Filter low-confidence results
   - IF result.confidence < 0.75: RETURN
     (Don't cache uncertain decisions)

3. Don't cache fallback decisions
   - IF result.level.includes('Fallback'): RETURN

4. Generate cache key
   - cacheKey = getCacheKey(input)

5. Calculate expiration
   - now = Date.now()
   - expiresAt = now + (ttlHours * 3600000)
   - Example: 24 hours from now

6. Manage cache size
   - IF cache.size >= maxEntries
     a. Find oldest entry by timestamp
     b. Delete oldest entry (LRU eviction)

7. Insert new entry
   - cache.set(cacheKey, {
       result: {...},
       timestamp: now,
       expiresAt
     })

8. Track statistics
   - levelCounts[result.level]++

RETURN void
```

---

## Cache Statistics

### RouterCache.getHitRate() → number
```
FUNCTION getHitRate() → 0.0 to 1.0

  total = stats.hits + stats.misses

  IF total == 0: RETURN 0.0

  RETURN stats.hits / total

EXAMPLE:
- 100 hits, 50 misses
- Total: 150 requests
- Hit rate: 100/150 = 0.667 (66.7%)
```

### RouterCache.getLevelDistribution() → Record<string, number>
```
FUNCTION getLevelDistribution() → {Level0: 0.4, Level1: 0.3, Level2: 0.3}

  total = sum of all level counts

  IF total == 0: RETURN {} (empty)

  FOR EACH [level, count] IN levelCounts
    distribution[level] = count / total

  RETURN distribution

EXAMPLE:
- Level 0: 40 times used
- Level 1: 30 times used
- Level 2: 30 times used
- Total: 100
- Distribution:
  Level 0: 40/100 = 0.40
  Level 1: 30/100 = 0.30
  Level 2: 30/100 = 0.30
```

---

## Cache Maintenance

### RouterCache.cleanExpired() → number
```
PROCEDURE: Remove expired entries (run periodically)

RETURNS: count of entries deleted

now = Date.now()
cleaned = 0

FOR EACH [key, entry] IN cache.entries()
  IF now > entry.expiresAt
    a. cache.delete(key)
    b. cleaned++

RETURN cleaned

EXAMPLE:
- 50 total entries
- 5 expired
- Returns: 5
- Cache now has 45 entries
```

### RouterCache.clear()
```
PROCEDURE: Clear all cache entries

1. cache.clear() (emptoes Map)

2. Reset statistics
   - stats.hits = 0
   - stats.misses = 0
   - stats.levelCounts = {}

USE CASE:
- After major config change
- Before major routing test
- Manual cache reset command
```

---

## Cache Flow in Router

### Complete request lifecycle with caching

```
FLOWCHART: Routing decision with cache

REQUEST: route(input) from SkillExecutor

┌─────────────────────────────────────┐
│ 1. Check cache                      │
│    cacheKey = getCacheKey(input)    │
│    cachedResult = cache.get(input)  │
└────────────┬────────────────────────┘
             │
      ┌──────▼──────────┐
      │ Hit or miss?    │
      └──────┬─────┬────┘
         Hit │     │ Miss
            │     │
      ┌─────▼─┐   │
      │RETURN │   │
      │cached │   │
      └───────┘   │
                  │
             ┌────▼──────────────┐
             │ 2. Try Level 0    │
             │    (0ms)          │
             └────┬───────┬──────┘
                  │       │
              Match│       │No match
                  │       │
          ┌───────▼─┐     │
          │ Found!  │     │
          │Cache+   │     │
          │Return   │     │
          └─────────┘     │
                         │
                    ┌────▼──────────────┐
                    │ 3. Try Level 1    │
                    │    (2-4s)         │
                    └────┬───────┬──────┘
                         │       │
                     Pass│       │Fail
                         │       │
                 ┌───────▼─┐     │
                 │ Found!  │     │
                 │Cache+   │     │
                 │Return   │     │
                 └─────────┘     │
                                │
                           ┌────▼──────────────┐
                           │ 4. Try Level 2    │
                           │    (10-15s)       │
                           └────┬───────┬──────┘
                                │       │
                            Pass│       │Fail
                                │       │
                        ┌───────▼─┐     │
                        │ Found!  │     │
                        │Cache+   │     │
                        │Return   │     │
                        └─────────┘     │
                                       │
                                  ┌────▼──────────────┐
                                  │ 5. All failed     │
                                  │    Fallback       │
                                  │    (no cache)     │
                                  └───────────────────┘
```

---

## Cache Behavior Examples

### Example 1: File Naming with Pattern Matching

```
REQUEST 1: Rename "Screenshot 2024-10-27.png"
→ Pattern: "screenshot-date.png"
→ Cache key: MD5("file-naming:screenshot-date.png:")
→ No cache hit
→ Route through Level 0 → "mockup-hero.png" (confidence: 0.9)
→ Cache result (TTL: 24 hours)
→ Duration: <1ms (Level 0 only)

REQUEST 2: Rename "Screenshot 2024-10-28.png" (next day)
→ Pattern: "screenshot-date.png" (SAME!)
→ Cache key: MD5("file-naming:screenshot-date.png:") (SAME!)
→ Cache HIT!
→ Return cached result immediately
→ Duration: 0ms (no routing needed)

Cache hit rate improved by 1/(1+1) = 50%
```

### Example 2: Code Linting with File Content Hash

```
REQUEST 1: Lint "src/app.ts" (current content)
→ Content hash: MD5(file contents) = "xyz123"
→ Cache key: "code-linting:src/app.ts:xyz123"
→ No cache hit
→ Route through Level 2 → 3 issues found
→ Cache result
→ Duration: 12 seconds

REQUEST 2: Lint "src/app.ts" (file unchanged)
→ Content hash: MD5(file contents) = "xyz123" (SAME)
→ Cache key: "code-linting:src/app.ts:xyz123" (SAME)
→ Cache HIT!
→ Return cached result
→ Duration: <1ms

REQUEST 3: Lint "src/app.ts" (file edited, 1 line changed)
→ Content hash: MD5(new contents) = "abc789" (DIFFERENT!)
→ Cache key: "code-linting:src/app.ts:abc789" (DIFFERENT)
→ Cache MISS (content changed)
→ Route through Level 2 again
→ Cache new result
→ Duration: 12 seconds
```

### Example 3: Low-Confidence Results Not Cached

```
REQUEST 1: Rename file (complex case)
→ Level 0: No match
→ Level 1: Generated filename with confidence 0.72
→ 0.72 < 0.75 threshold
→ NOT CACHED (too uncertain)
→ Continue to Level 2

REQUEST 2: Same file
→ No cache hit (wasn't cached)
→ Repeat routing again
→ This is expected behavior: don't cache uncertain decisions
```

### Example 4: Cache Eviction (LRU)

```
CACHE STATE:
- Max entries: 100
- Current entries: 100 (FULL!)

NEW REQUEST:
→ Decision: "level1-confidence-0.85"
→ Need to cache this

EVICTION PROCESS:
1. Find oldest entry by timestamp
   - Entry from 2 hours ago
2. Delete it
3. Insert new entry
4. Cache still has 100 entries
   (100 - 1 (evicted) + 1 (new) = 100)

RESULT: Least recently used entry discarded
```
