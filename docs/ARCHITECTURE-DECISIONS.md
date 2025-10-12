# Architecture Decision Records (ADRs)

This document tracks key architectural decisions made during NutriScan AI development.

---

## ADR-001: JSON Storage for History (Sprint 4)

**Date**: October 12, 2025  
**Status**: Accepted  
**Context**: Sprint 4 - Scan History & Favorites

### Decision

Use **JSON-based storage** (via expo-secure-store) for scan history and favorites, rather than SQLite or cloud database.

### Rationale

**Pros:**
- ✅ **Simple Implementation** - 1-2 days vs 1 week for SQLite setup
- ✅ **Low Volume** - Expected < 1000 entries in first year
- ✅ **No Relationships** - Flat data structure (no foreign keys needed)
- ✅ **Flexible Schema** - Easy to add/modify fields without migrations
- ✅ **Built-in Security** - expo-secure-store provides encryption at rest
- ✅ **Easy Debugging** - JSON is human-readable
- ✅ **Offline-First** - No network dependency

**Cons:**
- ⚠️ **Linear Search** - O(n) complexity for filtering (acceptable for < 1000 items)
- ⚠️ **Full File I/O** - Must read/write entire file on updates
- ⚠️ **Memory Overhead** - All data loaded into memory at once
- ⚠️ **No Indexing** - Can't optimize queries

**Trade-offs Accepted:**
- Linear search is acceptable for < 1000 items (< 100ms on modern devices)
- Memory usage is acceptable for estimated data size (< 10MB for 1000 scans)
- Full file writes are acceptable due to low write frequency (1-5 times per day)

### Performance Targets

| Operation | Target | Worst Case (1000 items) |
|-----------|--------|-------------------------|
| Load all | < 100ms | 200ms |
| Search | < 50ms | 100ms |
| Add scan | < 30ms | 50ms |
| Toggle favorite | < 30ms | 50ms |

### Migration Path (Future)

**Phase 1: JSON** (Current - Sprint 4)
- < 1K items
- Simple CRUD operations
- Local-only storage

**Phase 2: SQLite** (When: > 1K items OR search > 200ms)
- 1K-10K items
- Complex queries with indexes
- Still offline-first
- Migration utility: JSON → SQLite

**Phase 3: Cloud Database** (When: Multi-device sync needed)
- 10K+ items
- Real-time sync
- Social features
- Options: Firebase, Supabase, AWS Amplify

### Implementation Details

**Storage Key**: `nutriscan_scan_history`  
**Max Items**: 1000 (hard limit)  
**Max Size**: 100MB total  
**Cache TTL**: 5 minutes  

**Data Structure**:
```typescript
interface ScanHistory {
  version: number;              // Schema version (for future migrations)
  items: ScanHistoryItem[];    // All scans (newest first)
  metadata: {
    totalScans: number;
    lastScanAt: number;
    storageVersion: string;
  };
}
```

### Monitoring & Review

**Review Triggers:**
- User reports > 1000 scans
- Performance metrics show search > 200ms
- User requests advanced features (sync, comparisons)

**Success Metrics:**
- 99%+ save success rate
- < 100ms average load time
- < 1% error rate
- 85%+ test coverage

### Alternatives Considered

#### Alternative 1: SQLite (via expo-sqlite)

**Pros:**
- Fast indexed queries
- Handles millions of rows
- ACID transactions
- Industry standard

**Cons:**
- 1 week setup time (schema, migrations, ORM)
- Overkill for MVP volume
- More complex debugging
- Migration overhead for schema changes

**Decision**: Rejected for Sprint 4, considered for Phase 2

#### Alternative 2: Cloud Database (Firebase/Supabase)

**Pros:**
- Multi-device sync
- Real-time updates
- Automatic backups
- Scalable

**Cons:**
- Requires authentication
- Network dependency
- Privacy concerns (data leaves device)
- Monthly costs
- 2-3 week implementation time

**Decision**: Rejected for MVP, considered for v2.0

#### Alternative 3: AsyncStorage (plain text)

**Pros:**
- Built into React Native
- No dependencies
- Simple API

**Cons:**
- Not encrypted (security risk)
- Limited to 6MB on Android
- Deprecated in favor of alternatives

**Decision**: Rejected due to security and size limits

### References

- [expo-secure-store docs](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [When to use SQLite](https://www.sqlite.org/whentouse.html)
- [React Native data storage comparison](https://reactnative.dev/docs/asyncstorage)

---

## ADR-002: Neon Clarity Design System

**Date**: October 1, 2025  
**Status**: Accepted  
**Context**: Initial design phase

### Decision

Use **Neon Clarity** design system - dark theme with glassmorphism effects and neon gradients.

### Rationale

**User Benefits:**
- Reduces eye strain (dark background)
- Improves battery life on OLED screens
- Modern, premium aesthetic
- High contrast for readability

**Technical Benefits:**
- Consistent with nutrition app trends (health/wellness)
- Vibrant colors draw attention to important data (threshold alerts)
- Glassmorphism adds depth without heavy shadows
- Gradient buttons are visually engaging

### Implementation

- **Primary Gradient**: Teal (#34D399) → Lime (#A3E635)
- **Background**: Deep Space Blue (#111827)
- **Effects**: Blur + translucency for cards
- **Typography**: Inter font family
- **Animations**: 300ms transitions with ease-out

**References**: [00-design-system-summary.md](./00-design-system-summary.md)

---

## ADR-003: OpenAI Vision API for Label Extraction

**Date**: October 1, 2025  
**Status**: Accepted  
**Context**: AI model selection

### Decision

Use **OpenAI Vision API (gpt-4o)** for nutrition label extraction.

### Rationale

**Pros:**
- High accuracy on Australian nutrition labels
- Handles variations in label formats
- JSON output with structured data
- No training required
- Continuous model improvements

**Cons:**
- API cost ($0.01 per image)
- Network dependency
- 30-second timeout risk
- Rate limiting

**Mitigations:**
- Implement retry logic with exponential backoff
- Compress images to < 1MB before upload
- Cache results in history
- Provide offline fallback (manual entry)

**Alternatives Considered:**
- Google Cloud Vision (less accurate for nutrition data)
- AWS Textract (requires additional parsing)
- On-device ML (TensorFlow Lite) - too complex for MVP

**References**: [03-api-integration.md](./03-api-integration.md)

---

## ADR-004: Expo Framework

**Date**: September 28, 2025  
**Status**: Accepted  
**Context**: Framework selection

### Decision

Use **Expo SDK 51+** instead of bare React Native.

### Rationale

**Pros:**
- Faster development (managed workflow)
- Built-in services (camera, image picker, secure storage)
- OTA updates without app store review
- EAS Build for CI/CD
- Excellent documentation

**Cons:**
- Larger app bundle size
- Some native modules not available
- Vendor lock-in to Expo ecosystem

**Decision**: Accepted - MVP speed more important than bundle size optimization

---

## ADR-005: TypeScript Strict Mode

**Date**: September 28, 2025  
**Status**: Accepted  
**Context**: Type safety requirements

### Decision

Enable **TypeScript strict mode** from day one.

### Rationale

**Benefits:**
- Catch errors at compile time
- Better IDE autocomplete
- Self-documenting code
- Easier refactoring
- Production-grade quality

**Cost:**
- 10-15% slower initial development
- Learning curve for strict null checks

**Decision**: Accepted - Quality over speed for MVP

---

## ADR-006: No Redux for State Management

**Date**: September 30, 2025  
**Status**: Accepted  
**Context**: Sprint 1-3 implementation

### Decision

Use **React Context API + Custom Hooks** instead of Redux.

### Rationale

**Context API + Hooks:**
- ✅ Built into React (no dependencies)
- ✅ Simpler mental model
- ✅ Less boilerplate
- ✅ Sufficient for MVP scope

**Redux:**
- ❌ Overkill for current state complexity
- ❌ More boilerplate (actions, reducers, middleware)
- ❌ Learning curve for team members
- ❌ 100KB+ bundle size

**State Strategy:**
- **Local State** (useState): Component UI, forms, modals
- **Context API**: User thresholds, app settings
- **Custom Hooks**: Business logic (useCamera, useThresholds, etc.)

**Review Trigger**: If state management becomes complex in v2.0, reconsider Redux Toolkit or Zustand

---

## ADR-007: Test-Driven Development (TDD)

**Date**: October 5, 2025  
**Status**: Accepted  
**Context**: Sprint 2-3 implementation

### Decision

Adopt **test-driven development** approach with 85%+ coverage target.

### Rationale

**Benefits Observed:**
- Caught 12 bugs before reaching production
- Easier refactoring (confidence in changes)
- Living documentation (tests as specs)
- Faster debugging (tests pinpoint issues)

**Metrics (Sprint 3):**
- 319 tests passing (100%)
- 85%+ coverage
- 0 production bugs
- Average fix time: 15 minutes

**Cost:**
- 30% more development time upfront
- Pays off during refactoring and bug fixes

**Decision**: Continue TDD for all new features

---

## Template for New ADRs

```markdown
## ADR-XXX: [Decision Title]

**Date**: [YYYY-MM-DD]  
**Status**: [Proposed | Accepted | Deprecated | Superseded]  
**Context**: [What situation led to this decision?]

### Decision

[What did we decide?]

### Rationale

**Pros:**
- [Benefit 1]
- [Benefit 2]

**Cons:**
- [Trade-off 1]
- [Trade-off 2]

### Alternatives Considered

**Alternative 1**: [Name]
- [Pros/cons]
- [Why rejected]

### Implementation

[Key details]

### Review Triggers

[When should we revisit this decision?]

### References

- [Link 1]
- [Link 2]
```

---

**Last Updated**: October 12, 2025  
**Next Review**: After Sprint 4 completion
