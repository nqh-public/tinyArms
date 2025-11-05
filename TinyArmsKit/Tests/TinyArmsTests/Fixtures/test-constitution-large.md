# Large Constitutional Principles Document

This document contains extensive principles for testing constitution truncation (>10KB).

## Principle I: Universal Reusability

All code must be designed for reuse by others. This means:

- Abstract away application-specific details
- Use generic types where appropriate
- Provide clear interfaces and documentation
- Avoid tight coupling to specific implementations
- Design for composability and extensibility

Code should be written as if it will be extracted into a library tomorrow. Ask yourself: "Could another developer use this in a completely different project?"

Examples of reusable code:
- Utility functions that operate on standard types
- Protocol-based designs that allow for multiple implementations
- Generic algorithms that work with any conforming type

Examples of non-reusable code:
- Functions that directly access global application state
- Hard-coded references to specific view controllers or models
- Logic that assumes a specific database schema

## Principle II: Architecture-First Development

Before writing custom code, search for existing solutions:

1. **Search npm/GitHub first**: Check if a package exists
2. **Evaluate options**: Compare features, maintenance, license
3. **Only invent when necessary**: If no suitable option exists
4. **Document decision**: Record why custom code was needed

This principle prevents "not invented here" syndrome and leverages community expertise.

Red flags:
- Writing custom debounce/throttle (use lodash)
- Custom HTTP client (use Axios/Fetch)
- Custom date formatting (use date-fns/Moment)
- Custom routing (use React Router/Next.js)

## Principle III: Zero Invention Policy

New patterns require approval. This includes:

- Design tokens (colors, spacing, typography)
- State management patterns
- API communication patterns
- File organization structures
- Naming conventions

Why this matters:
- Consistency across codebase
- Easier onboarding for new developers
- Reduced cognitive load
- Better maintainability

When you need a new pattern:
1. Document the need
2. Propose the pattern
3. Get team approval
4. Document the decision
5. Update style guides

## Principle IV: Pragmatic Atomic Composability (DRY)

Extract logic after 3+ duplicates:

```
1st time: Write inline
2nd time: Copy with caution
3rd time: Extract to function/component
```

Don't over-abstract:
- Wait for real duplication (not speculative)
- Keep abstractions simple
- Prefer composition over inheritance
- Make refactoring easy

Examples of when to extract:
- Same validation logic in 3+ forms
- Identical API call patterns
- Repeated error handling
- Common data transformations

Examples of premature abstraction:
- Creating utils for one use case
- Building frameworks before patterns emerge
- Over-engineering for flexibility

## Principle V: Type Safety

Use TypeScript strictly:

```typescript
// Good
interface User {
  id: string;
  name: string;
  email: string;
}

// Bad
const user: any = { ... };
```

Type safety prevents bugs:
- Catch errors at compile time
- Enable refactoring confidence
- Serve as documentation
- Enable IDE autocomplete

Avoid type escape hatches:
- `any` (use `unknown` instead)
- `@ts-ignore` (fix the error)
- Type assertions (only when certain)

## Principle VI: Testing

Test behavior, not implementation:

```typescript
// Good: Tests what the function does
test('validates email format', () => {
  expect(validateEmail('test@example.com')).toBe(true);
  expect(validateEmail('invalid')).toBe(false);
});

// Bad: Tests how it's implemented
test('uses regex pattern', () => {
  expect(validateEmail.toString()).toContain('\\@');
});
```

Testing pyramid:
- Many unit tests (fast, isolated)
- Some integration tests (realistic)
- Few E2E tests (expensive)

## Principle VII: Documentation

Code should be self-documenting:

1. Use clear naming
2. Write small functions
3. Extract constants
4. Add comments for "why", not "what"

```typescript
// Bad
function calc(x: number): number {
  return x * 0.15; // What is 0.15?
}

// Good
const DISCOUNT_RATE = 0.15;

function calculateDiscount(price: number): number {
  return price * DISCOUNT_RATE;
}
```

When to add comments:
- Explaining business logic
- Warning about edge cases
- Documenting workarounds
- Clarifying complex algorithms

## Principle VIII: Error Handling

Handle errors explicitly:

```typescript
// Good
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  logger.error('Operation failed', { error });
  throw new OperationError('Failed to complete operation', error);
}

// Bad
const result = await riskyOperation(); // Unhandled rejection
```

Error handling best practices:
- Catch at appropriate level
- Log with context
- Re-throw with useful message
- Don't swallow errors silently

## Principle IX: Performance

Optimize when measured:

1. **Measure first**: Use profiler to identify bottlenecks
2. **Optimize hot paths**: Focus on critical code
3. **Measure again**: Verify improvement
4. **Document**: Explain optimization

Premature optimization wastes time. Profile before optimizing.

Common performance wins:
- Memoization for expensive calculations
- Virtualization for long lists
- Debouncing for frequent events
- Lazy loading for routes/components

## Principle X: Security

Security is not optional:

- Sanitize user input
- Use parameterized queries
- Implement CSRF protection
- Enable CORS properly
- Hash passwords (never plain text)
- Use HTTPS everywhere

Security checklist:
- [ ] Input validation
- [ ] Output encoding
- [ ] Authentication
- [ ] Authorization
- [ ] Secure session management
- [ ] Dependency scanning

## Principle XI: Accessibility

Build for everyone:

- Semantic HTML
- ARIA labels
- Keyboard navigation
- Screen reader support
- Color contrast (WCAG AA)
- Focus indicators

Accessibility is inclusive design:
- Helps users with disabilities
- Improves UX for everyone
- Often required by law
- Right thing to do

## Principle XII: Code Review

Review checklist:

- [ ] Does it work? (tested)
- [ ] Is it readable?
- [ ] Follows conventions?
- [ ] Handles errors?
- [ ] Has tests?
- [ ] Updated docs?

Code review is:
- Teaching opportunity
- Quality assurance
- Knowledge sharing
- Team alignment

Be kind in reviews:
- Praise good work
- Ask questions, don't demand
- Suggest alternatives
- Focus on principles, not preferences

---

**Total document size**: This document intentionally exceeds 10KB to test constitution truncation logic. The actual content above demonstrates comprehensive principles that a real codebase might use.

