# privacy-redaction

**Status**: Planning (Phase 1)
**Created**: 2025-11-02
**Inspired By**: Apple's privacy-first approach + GDPR compliance

---

## Overview

Auto-detect and redact PII (emails, phone numbers, SSN, API keys, passwords) from screenshots, logs, and documentation.

**Use Cases**:
- Screenshot sharing → auto-blur emails/passwords
- Log sanitization → remove API keys before GitHub issue
- Documentation audit → find exposed credentials
- Pre-commit hook → block commits with secrets

---

## Model Stack

```
Level 0: Regex patterns (email, phone, SSN, credit card) <1ms
  ↓
Level 1: GLiNER-base (NER: names, locations, orgs) 100-200ms
  ↓
Level 2: embeddinggemma (semantic PII: "looks like API key") 100ms
```

**Models**:
- **GLiNER-base**: 400MB, entity extraction (Apache 2.0)
- **embeddinggemma**: 200MB, semantic similarity (already in stack)
- **Regex**: Zero-shot rules (email, phone, SSN patterns)

---

## Expected Coverage

- **Level 0 (Regex)**: 60-70% (emails, phones, SSNs, credit cards)
- **Level 1 (GLiNER)**: 25-30% (names, locations, organizations)
- **Level 2 (Semantic)**: 5-10% ("sk_live_...", "ghp_...", custom patterns)

**Accuracy**: 95%+ (Microsoft Presidio achieves this with similar stack)

**Speed**: 50-300ms per document (fast enough for pre-commit)

---

## Output Schema

```typescript
{
  original_text: string,
  redacted_text: string,
  detections: [{
    type: 'email' | 'phone' | 'ssn' | 'api_key' | 'name' | 'location',
    original: string,
    redacted: string, // "***@***.com"
    confidence: number,
    position: [start, end],
  }],
  image_redactions: [{ // For screenshots
    bbox: [x, y, w, h],
    type: 'text' | 'password_field',
  }]
}
```

---

## Integration Points

- **Pre-commit hook**: Scan staged files, block if PII detected
- **Screenshot workflow**: Auto-blur before file-naming
- **Documentation**: Audit markdown files for exposed secrets

---

## References

- **Microsoft Presidio**: [GitHub - microsoft/presidio](https://github.com/microsoft/presidio)
- **GLiNER**: [HuggingFace - urchade/gliner_base](https://huggingface.co/urchade/gliner_base)
- **Regex Patterns**: OWASP pattern library

---

**Timeline**: 2-3 weeks (Level 0 regex → GLiNER → semantic)
**Complexity**: Low-Medium (well-defined problem, existing models)
