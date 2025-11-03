> **Swift Implementation (2025-11-02)**: Research applies to Swift architecture. TypeScript examples → Swift equivalents during Phase 1. Core algorithms unchanged. Reference: docs/01-SWIFT-ARCHITECTURE-OVERVIEW.md


# Semantic Caching Design

**Status**: Researched (2025-10-29)
**Phase**: 03 (Semantic Caching Implementation)
**Implementation**: Week 4
**Expected Impact**: 15-25% query elimination

---

## Problem Statement

**Current**: tinyArms processes every query from scratch, even if identical/similar queries were answered recently.

**Example**:
- Query 1 (10:00am): "How do I reverse a string in Python?"
- Query 2 (10:05am): "How can I reverse a Python string?" (same question, different words)

→ Both queries go through full routing (Level 0 → Level 1 → Level 2), taking 2-3 seconds each.

**Solution**: Add **Level -1 (Semantic Cache)** that returns cached responses for similar queries in <50ms.

---

## Architecture Overview

### Routing Flow WITH Cache

```
Query arrives
  ↓
[Level -1: Semantic Cache] ← NEW
  ├─ Cache hit (similarity >0.95) → Return cached response (50ms)
  └─ Cache miss → Continue to Level 0
  ↓
Level 0: Rules
  ↓
Level 1: Embedding
  ↓
Level 2: Small LLM
  ├─ Generate response
  └─ STORE in cache ← NEW
  ↓
Level 3: Large LLM (if escalated)
  ├─ Generate response
  └─ STORE in cache ← NEW
```

### What Gets Cached

**Store**: Responses from Level 2 and Level 3 (expensive LLM calls)
**Don't store**: Level 0 (rules) and Level 1 (embedding matches) - already fast

**Reasoning**: Cache optimizes expensive operations (LLM inference), not cheap lookups.

---

## Semantic Cache Lookup

### Algorithm

1. **Embed incoming query** (reuse embeddinggemma-300m from Level 1)
2. **Search vector database** for similar cached queries
3. **Compare similarity** (cosine distance)
4. **Decision**:
   - Similarity >0.95 → Return cached response (cache hit)
   - Similarity ≤0.95 → Continue routing (cache miss)

### Implementation (Qdrant)

```python
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

# Setup once at startup
cache_client = QdrantClient(path="./qdrant_cache")
cache_client.create_collection(
    collection_name="response_cache",
    vectors_config=VectorParams(size=768, distance=Distance.COSINE)
)

def semantic_cache_lookup(query, embedding):
    """
    Check if similar query was answered recently

    Returns:
        (cached_response, similarity) if hit
        (None, 0.0) if miss
    """
    results = cache_client.search(
        collection_name="response_cache",
        query_vector=embedding,
        limit=1
    )

    if results and results[0].score > 0.95:
        # Cache hit
        return results[0].payload["response"], results[0].score
    else:
        # Cache miss
        return None, 0.0
```

---

## Cache Storage

### What to Store

```python
def cache_response(query, embedding, response, tier, metadata=None):
    """
    Store LLM response for future reuse

    Args:
        query: Original query text
        embedding: 768-dim vector from embeddinggemma
        response: Generated answer
        tier: Which tier answered ("level_2" or "level_3")
        metadata: Optional (timestamp, user_id, domain, etc.)
    """
    cache_client.upsert(
        collection_name="response_cache",
        points=[
            PointStruct(
                id=hash(query),  # Unique ID per query
                vector=embedding,
                payload={
                    "query": query,
                    "response": response,
                    "tier": tier,
                    "timestamp": time.time(),
                    "metadata": metadata or {}
                }
            )
        ]
    )
```

### When to Store

**Cache after**:
- Level 2 generates response (consistency >0.85)
- Level 3 generates response (all L3 responses cached)

**Don't cache**:
- Level 0 rule matches (not expensive)
- Level 1 embedding matches (already cached semantically)
- Error responses (don't cache failures)

---

## Similarity Threshold

### Why 0.95?

**Too high (>0.98)**: Only near-exact matches → low hit rate
**Too low (<0.90)**: False positives → wrong answers returned

**0.95 (recommended)**: Balance between hit rate and accuracy

### Examples

**Similarity 0.98** (cache hit):
- Query 1: "How do I reverse a string in Python?"
- Query 2: "How can I reverse a string in Python?" (nearly identical)

**Similarity 0.93** (cache miss):
- Query 1: "How do I reverse a string in Python?"
- Query 2: "How do I reverse a list in Python?" (different data structure)

**Similarity 0.87** (cache miss):
- Query 1: "How do I reverse a string in Python?"
- Query 2: "Explain string slicing in Python" (different intent)

---

## Cache Eviction Strategies

### Time-to-Live (TTL)

**Default**: 7 days
**Reasoning**: Code patterns change slowly, cache stays relevant for weeks

```python
def cache_with_ttl(query, embedding, response, tier, ttl_days=7):
    expiry_timestamp = time.time() + (ttl_days * 86400)

    cache_client.upsert(
        collection_name="response_cache",
        points=[
            PointStruct(
                id=hash(query),
                vector=embedding,
                payload={
                    "query": query,
                    "response": response,
                    "tier": tier,
                    "expiry": expiry_timestamp
                }
            )
        ]
    )

# Cleanup job (runs daily)
def evict_expired():
    now = time.time()
    cache_client.delete(
        collection_name="response_cache",
        points_selector={"expiry": {"$lt": now}}
    )
```

### Least Recently Used (LRU)

**Trigger**: Cache size exceeds limit (e.g., 100K entries)
**Action**: Remove oldest entries based on last access time

```python
def update_access_time(query_id):
    """Track when cached response was used"""
    cache_client.set_payload(
        collection_name="response_cache",
        payload={"last_accessed": time.time()},
        points=[query_id]
    )

def evict_lru(max_size=100000):
    current_size = cache_client.count("response_cache")
    if current_size > max_size:
        # Remove 10% least recently used
        remove_count = current_size // 10
        # Query sorted by last_accessed, delete oldest
        cache_client.delete_oldest(limit=remove_count)
```

### Per-Domain TTL (Advanced)

Different cache lifetimes for different query types:

| Domain | TTL | Reasoning |
|--------|-----|-----------|
| General coding | 7 days | Patterns change slowly |
| Documentation | 14 days | Very stable |
| API examples | 3 days | APIs change frequently |
| Configuration | 30 days | Rarely changes |

---

## Performance Characteristics

### Cache Hit Latency

**Components**:
- Embedding query: ~50ms (reuse Level 1 embeddinggemma)
- Vector similarity search: ~10ms (1M vectors in Qdrant)
- Response retrieval: <1ms
- **Total: ~60ms** (vs 2-3s for Level 2)

### Cache Miss Latency

**Overhead**: +50ms (embedding + search)
**Impact**: Minimal (50ms added to 2-3s is ~2% increase)

### Memory Usage

**Per entry**:
- Vector: 768 floats × 4 bytes = 3KB
- Metadata (query, response, tier): ~1-5KB (depends on response length)
- **Total: ~5-8KB per entry**

**For 100K entries**: 500MB-800MB RAM
**For 1M entries**: 5GB-8GB RAM

**Recommendation**: Start with 100K entry limit, monitor hit rate

---

## Expected Impact

### Industry Benchmarks

**FrugalGPT (Stanford)**:
- Semantic cache as Tier 0 (before LLM)
- **Impact**: Contributes to 98% total cost reduction

**TweakLLM (2024)**:
- Semantic cache + lightweight refinement
- **Impact**: Enables cache-hit response reuse with slight modifications

### tinyArms Projections

**Assumptions**:
- 30% of queries are repeats (similar to previous queries)
- Cache similarity threshold: 0.95
- Hit rate: 50-60% of repeats (15-18% of total queries)

**Expected outcomes**:

| Metric | Without Cache | With Cache | Improvement |
|--------|--------------|------------|-------------|
| Total queries | 100 | 100 | - |
| Cache hits | 0 | 15-18 | +15-18% |
| Level 2 calls | 80 | 65-67 | -15-18% |
| Level 3 calls | 20 | 15-17 | -15-18% |
| Avg latency | 2.5s | 2.1s | -16% |
| Cost per query | $0.003 | $0.0025 | -17% |

**Reference**: research/01-tiered-routing-validation.md:476-488

---

## Implementation Roadmap

### Week 4: Basic Semantic Cache

```python
def route_with_cache(query):
    # Get embedding (reuse for cache + Level 1)
    embedding = embed_model.encode(query)

    # LEVEL -1: Semantic Cache
    cached, similarity = semantic_cache_lookup(query, embedding)
    if cached:
        log_trace({"tier": "cache", "similarity": similarity})
        return cached

    # LEVEL 0: Rules
    if exact_match(query):
        return rule_response

    # LEVEL 1: Embedding
    similarity = semantic_search(embedding)
    if similarity > 0.90:
        return matched_response

    # LEVEL 2: Small LLM
    responses = []
    for _ in range(3):
        responses.append(qwen_3b.generate(query, temperature=0.7))

    consistency = measure_similarity(responses)
    if consistency > 0.85:
        response = responses[0]
        # STORE in cache
        cache_response(query, embedding, response, tier="level_2")
        return response

    # LEVEL 3: Large LLM
    response = qwen_7b.generate(query)
    # STORE in cache
    cache_response(query, embedding, response, tier="level_3")
    return response
```

### Week 5: Cache Monitoring

**Metrics to track**:
- Cache hit rate: `hits / (hits + misses)`
- Average similarity on hits: Distribution of scores >0.95
- Cache size: Number of entries, total memory
- Eviction rate: Entries removed per day

**Target hit rate**: 15-25% (of total queries)

### Week 6: Cache Optimization (Optional)

**If hit rate <10%**: Lower threshold to 0.93
**If false positives >5%**: Raise threshold to 0.97
**If memory issues**: Implement LRU eviction

---

## Cache Warming Strategies

### Preload Common Queries

**Approach**: Seed cache with frequently asked questions

```python
COMMON_QUERIES = [
    ("How do I reverse a string in Python?", "Use string[::-1]"),
    ("What is list comprehension?", "List comprehension is..."),
    # ... 50-100 common queries
]

def warm_cache():
    for query, response in COMMON_QUERIES:
        embedding = embed_model.encode(query)
        cache_response(query, embedding, response, tier="preloaded")
```

**When to use**: Bootstrapping new tinyArms instance (0 cache entries)

### Import from Production Logs

**Approach**: Analyze past query logs, cache top 100 most frequent

```python
def import_from_logs(log_file):
    queries = parse_logs(log_file)
    top_100 = get_top_queries(queries, limit=100)

    for query, response in top_100:
        embedding = embed_model.encode(query)
        cache_response(query, embedding, response, tier="imported")
```

---

## Advanced: Cache Analytics

### Query Clustering

**Purpose**: Identify groups of similar queries for better caching

```python
from sklearn.cluster import KMeans

# Cluster cached queries by embedding
embeddings = [entry.vector for entry in cache_client.scroll("response_cache")]
clusters = KMeans(n_clusters=10).fit(embeddings)

# Analyze clusters
for cluster_id in range(10):
    cluster_queries = get_cluster_queries(cluster_id)
    print(f"Cluster {cluster_id}: {len(cluster_queries)} queries")
    print(f"Representative: {cluster_queries[0]}")
```

**Insight**: Large clusters = common query types (cache well)

### Similarity Distribution Analysis

```python
# For cache misses, what was the top similarity?
miss_similarities = [0.93, 0.91, 0.89, 0.87, ...]
histogram(miss_similarities)

# If many misses at 0.92-0.94 → Consider lowering threshold to 0.93
```

---

## Common Issues

### Issue 1: Low Hit Rate (<10%)

**Possible causes**:
- Threshold too high (0.95 → try 0.93)
- Queries too diverse (no repeats)
- Cache too small (evicting useful entries)

**Diagnosis**: Check similarity distribution on misses

### Issue 2: False Positives (Wrong Answers)

**Possible causes**:
- Threshold too low (<0.90)
- Query ambiguity (similar wording, different intent)

**Diagnosis**: Manual review of cache hits with similarity 0.90-0.95

### Issue 3: Stale Cache

**Possible causes**:
- TTL too long (cached outdated answers)
- No eviction (old entries linger)

**Fix**: Reduce TTL to 3-5 days, implement LRU

---

## Production Examples

### FrugalGPT (Stanford, 2023)
- **Cache type**: Semantic completion cache
- **Threshold**: Similarity >0.95
- **Performance**: Contributes to 98% cost reduction

### TweakLLM (2024)
- **Cache type**: Semantic cache + response refinement
- **Threshold**: Not disclosed (likely 0.90-0.95)
- **Architecture**: Tier 0 (cache) → Tier 1 (refinement) → Tier 2 (full LLM)

**Reference**: research/01-tiered-routing-validation.md:226-235

---

## Next Steps

1. **Week 4**: Implement basic semantic cache (Qdrant + embeddinggemma)
2. **Week 5**: Deploy to production, measure hit rate
3. **Week 6**: Tune threshold if needed (target: 15-25% hit rate)
4. **Week 7+**: Optionally implement LRU eviction, per-domain TTL

**Dependencies**:
- Phase 01 tracing (log cache hits/misses)
- Qdrant vector database (local instance)
- embeddinggemma model (already used in Level 1)

**Full context**: See research/01-tiered-routing-validation.md
