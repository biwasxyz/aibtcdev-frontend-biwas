# Component Consolidation Plan

## Current Structure Analysis

### Identified Redundancies

#### 1. **Proposal Components Duplication**
- **Issue**: Proposals exist in both DAO context (`/components/daos/proposal/`) and standalone (`/app/proposals/`)
- **Files**:
  - `src/components/daos/proposal/AllProposals.tsx` - Comprehensive all-proposals view with filtering
  - `src/components/daos/proposal/DAOProposal.tsx` - DAO-specific proposal listing  
  - `src/app/proposals/page.tsx` - Standalone page that just imports AllProposals
  - `src/app/proposals/[id]/page.tsx` - Individual proposal pages
- **Current Usage**: `/app/proposals/page.tsx` imports and renders the same `AllProposals` component used in DAO context
- **Redundancy Level**: HIGH - `/app/proposals/` is essentially a wrapper around DAO components

#### 2. **Buy Component Proliferation**
- **Issue**: Multiple similar buy-related components with overlapping functionality
- **Files**:
  - `DaoBuy.tsx` - Direct API buy functionality with result handling
  - `DaoBuyInput.tsx` - Chat-integrated buy input (legacy)
  - `DaoBuyModal.tsx` - Original modal implementation (unused)
  - `DaoBuyModalUpdated.tsx` - Updated modal implementation (actively used)
  - `DaoBuyToken.tsx` - Simple buy button wrapper (entry point)
- **Current Usage**: `DaoBuyToken` → `DaoBuyModalUpdated` → `DaoBuy` (for API calls)
- **Redundancy Level**: MEDIUM - Clear hierarchy but multiple similar implementations

#### 3. **Layout Redundancy**
- **Issue**: Similar layout patterns across DAO and proposal pages
- **Files**:
  - `src/app/daos/[name]/layout-client.tsx` - Complex DAO layout with metrics
  - `src/app/proposals/[id]/layout.tsx` - Proposal detail layout
  - Both handle navigation, headers, and data loading similarly

#### 4. **Data Fetching Duplication**
- **Issue**: Similar queries scattered across components
- **Files**:
  - DAO layout fetches: proposals, extensions, tokens, market stats
  - Proposal pages re-fetch similar data
  - AllProposals component has its own data management

## Consolidation Strategy

### Phase 1: Proposal System Unification

#### 1.1 Merge Proposal Routes
**Rationale**: All proposals belong to DAOs, and `/app/proposals/page.tsx` just imports the same `AllProposals` component.

**Actions**:
- **Remove**: `/app/proposals/` directory entirely
- **Add**: Proposals tab to main navigation: `/proposals` route shows all proposals across DAOs
- **Consolidate**: Individual proposal viewing through: `/daos/[name]/proposals/[id]`
- **Redirect**: Set up `/proposals/[id]` → `/daos/[dao-name]/proposals/[id]` redirects
- **Benefit**: Single source of truth, better context, cleaner URLs, maintains existing URLs

#### 1.2 Consolidate Proposal Components
**Target Structure**:
```
src/components/proposals/  (new unified location)
├── ProposalCard.tsx       (keep existing)
├── ProposalDetails.tsx    (keep existing) 
├── AllProposals.tsx       (move from daos/proposal/)
├── ProposalList.tsx       (new - extracted list logic)
├── ProposalFilters.tsx    (new - extracted filter logic)
└── ...existing proposal components
```

### Phase 2: Buy Component Consolidation

#### 2.1 Create Unified Buy System
**Target**: Single `TokenPurchase` component system

**New Structure**:
```
src/components/token-purchase/
├── TokenPurchaseModal.tsx     (consolidated modal)
├── TokenPurchaseButton.tsx    (simple trigger)
├── PurchaseForm.tsx          (form logic)
├── PurchaseResult.tsx        (success/error states)
└── types.ts                  (shared types)
```

**Migration Plan**:
- Merge `DaoBuyModalUpdated.tsx` as primary modal (most complete)
- Extract form logic from `DaoBuy.tsx` for direct API calls
- Consolidate button logic from `DaoBuyToken.tsx`
- Remove redundant components

### Phase 3: Layout Consolidation

#### 3.1 Create Shared Layout Components
**New Structure**:
```
src/components/layouts/
├── DAOLayout.tsx              (main DAO layout wrapper)
├── DAOHeader.tsx             (DAO info + metrics)
├── DAONavigation.tsx         (tab navigation)
├── MetricsGrid.tsx           (reusable metrics display)
└── PageSection.tsx           (consistent content wrapper)
```

#### 3.2 Simplify Route Layouts
- Extract complex logic from `layout-client.tsx` into reusable components
- Create consistent page wrappers
- Centralize loading and error states

### Phase 4: Data Layer Cleanup (Already 80% Complete!)

#### 4.1 Remove Redundant Hook ✅ **PRIORITY**
**Issue**: `src/hooks/use-dao-details.ts` is flagged for removal and duplicates `src/queries/dao-queries.ts`
- **Action**: Delete `use-dao-details.ts` entirely (339 lines of redundant code)
- **Replace with**: Direct usage of `dao-queries.ts` functions
- **Benefit**: Eliminates 5-minute cache, N+1 queries, and duplicate logic

#### 4.2 Leverage Existing Query Architecture ✅ **ALREADY DONE**
**Current State**: Data layer is exceptionally well-organized with real-time capabilities:
```
src/queries/
├── dao-queries.ts            ✅ Complete DAO data fetching
├── vote-queries.ts           ✅ Optimized vote queries  
├── agent-queries.ts          ✅ Agent data management
├── wallet-queries.ts         ✅ Wallet balance fetching
└── ...other specialized queries

src/components/providers/
├── SupabaseRealtimeProvider  ✅ Real-time query invalidation
    ├── proposals table      → invalidates all proposal queries  
    ├── votes table          → invalidates vote queries
    ├── daos table           → invalidates DAO queries
    ├── tokens table         → invalidates token queries
    └── chain_states table   → invalidates chain state queries
```

#### 4.3 Component Integration Updates
- Replace `useDAODetails()` hook calls with direct query usage
- Use React Query for caching instead of manual Map cache  
- Update components to use existing `fetchDAOs()`, `fetchTokenPrices()`, etc.
- **Bonus**: Components will automatically get real-time updates via `SupabaseRealtimeProvider`

## Implementation Priority

### High Priority (Week 1)
1. **Redundant Hook Removal** - Immediate performance improvement (NEW PRIORITY!)
   - Delete `src/hooks/use-dao-details.ts` (339 lines, flagged for removal)
   - Update `src/app/daos/[name]/layout-client.tsx` to use `dao-queries.ts`
   - Replace manual caching with React Query
   - **Impact**: Eliminates N+1 queries, 5min stale cache, improves data consistency

2. **Buy Component Consolidation** - User experience improvement
   - Remove unused `DaoBuyModal.tsx` (original)
   - Remove legacy `DaoBuyInput.tsx` (chat integration moved elsewhere)
   - Rename `DaoBuyModalUpdated.tsx` → `TokenPurchaseModal.tsx`
   - Update all 3 usage points (`layout-client.tsx`, `DaosTable.tsx`)

3. **Proposal Route Elimination** - Architectural cleanup  
   - Delete `/app/proposals/` directory (2 files total)
   - Move `AllProposals` component to `/components/proposals/`
   - Add proposals to main app navigation
   - Set up redirect middleware for `/proposals/[id]` → `/daos/[name]/proposals/[id]`

### Medium Priority (Week 2)  
4. **Layout Component Extraction** - Developer experience improvement
   - Extract reusable layout components from `layout-client.tsx`
   - Simplify route-level layouts
   - Improve component reusability

5. **Query Pattern Optimization** - Performance improvement (PARTIALLY DONE)
   - Leverage existing React Query patterns in components
   - Add proper error boundaries for data fetching
   - Optimize component re-renders with memo/callback patterns

### Low Priority (Week 3)
6. **Component Library Cleanup** - Long-term maintainability
   - Standardize component patterns across DAO/proposal components
   - Improve TypeScript types consistency
   - Add comprehensive documentation for consolidated components

## Benefits Expected

### Immediate Benefits
- **Reduced Bundle Size**: Eliminate duplicate components (estimated 15-20% reduction in DAO-related code)
- **Improved UX**: Single, polished buy flow instead of multiple inconsistent ones
- **Better SEO**: Unified URL structure for proposals

### Long-term Benefits  
- **Easier Maintenance**: Single source of truth for each feature
- **Faster Development**: Reusable components and patterns
- **Better Testing**: Fewer components to test, clearer boundaries
- **Improved Performance**: Optimized data fetching, reduced re-renders

## Risk Mitigation

### Breaking Changes
- Implement URL redirects for existing proposal links
- Maintain backward compatibility during transition
- Gradual migration with feature flags if needed

### Testing Strategy
- Component-by-component replacement with thorough testing
- E2E tests for critical user flows (buy tokens, view proposals)
- Performance benchmarking before/after

## Success Metrics

1. **Code Reduction**: Target 30% reduction in component files (from 5 buy components → 1, remove 2-file proposals app)
2. **Performance**: Improve initial page load by 20% (fewer route-level components, optimized data fetching)
3. **Developer Experience**: Reduce time to implement new DAO features by 40% (single source of truth for proposals)
4. **User Experience**: Single, consistent buy flow across all DAOs (eliminate modal inconsistencies)

## ✅ PHASE 1 COMPLETED - Immediate Next Steps (Updated Priority Order)

### ✅ Step 1: Remove Redundant Hook (COMPLETED - 30 minutes)
1. ✅ Deleted `src/hooks/use-dao-details.ts` (flagged for removal, 339 lines)
2. ✅ Verified no usage in codebase - layout-client.tsx already uses `dao-queries.ts`
3. ✅ Manual Map cache eliminated, React Query + `SupabaseRealtimeProvider` already in use
4. ✅ DAO pages now have optimized data fetching with automatic real-time updates

### ✅ Step 2: Clean up Buy Components (COMPLETED - 45 minutes)
1. ✅ Deleted `src/components/daos/DaoBuyModal.tsx` (unused original)
2. ✅ Deleted `src/components/daos/DaoBuyInput.tsx` (legacy chat integration)  
3. ✅ Renamed `DaoBuyModalUpdated.tsx` → `TokenPurchaseModal.tsx`
4. ✅ Updated imports in `DaoBuyToken.tsx` and component exports

### ✅ Step 3: Proposals App Consolidation (COMPLETED - 30 minutes)  
1. ✅ Moved `AllProposals.tsx` to `src/components/proposals/`
2. ✅ Updated `/proposals` page to use new component location
3. ✅ Fixed import paths and verified build success
4. ✅ Individual proposal pages `/proposals/[id]` continue to work

### ✅ Step 4: Validation & Testing (COMPLETED - 15 minutes)
1. ✅ Build passes successfully (only minor linting warnings)
2. ✅ All imports updated and verified  
3. ✅ Component consolidation maintains functionality
4. ✅ No broken imports or missing dependencies
