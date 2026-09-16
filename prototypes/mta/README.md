# Konveyor / MTA Prototype

A prototype of the Konveyor Tackle UI for application modernization and migration. Includes a dashboard with migration summary stats, a Migrate Application wizard for generating migration assets, and an Analysis Report wizard with configurable target selection cards.

Built with Vite + React + PatternFly v6. See the root [`CONTRIBUTING.md`](../../CONTRIBUTING.md) for how this prototype is built and deployed alongside the others in this repo.

## Using the MTA Dashboard Component in Konveyor

The MTA Dashboard is built as a self-contained meta component that can be dropped into the [konveyor/tackle2-ui](https://github.com/konveyor/tackle2-ui) codebase or any React application. It uses a provider pattern to decouple the UI from the data source.

### Exports

Everything is exported from `src/dashboard/index.ts`:

```typescript
import {
  DashboardProvider,    // React context provider — wraps the dashboard
  DashboardPage,        // Main dashboard layout (composes all sections)
  mockDashboardData,    // Mock data for standalone preview
  // Individual sections (if you only need parts of the dashboard)
  SummaryStats,
  QuickActions,
  ApplicationsOverview,
  ReportsOverview,
  MigrationStatus,
  // Wizards
  MigrateWizard,
  AnalysisWizard,
  BatchMigrationWizard,
  // Types
  DashboardData,
  DashboardContextValue,
} from './dashboard'
```

### Quick start — standalone with mock data

```tsx
import { DashboardProvider, DashboardPage, mockDashboardData } from './dashboard'

function MyPage() {
  const navigate = useNavigate()
  return (
    <DashboardProvider data={mockDashboardData} navigateTo={navigate}>
      <DashboardPage />
    </DashboardProvider>
  )
}
```

### Integration with tackle2-ui — using real API data

Create an adapter hook that transforms Konveyor API responses into the `DashboardData` shape:

```typescript
// client/src/app/pages/dashboard/useDashboardData.ts
import { useFetchApplications } from '@app/queries/applications'
import { useFetchMigrationWaves } from '@app/queries/migration-waves'
import { DashboardData } from './dashboard/types'

export function useDashboardData() {
  const { data: apps, isLoading: appsLoading } = useFetchApplications()
  const { data: waves, isLoading: wavesLoading } = useFetchMigrationWaves()

  const dashboardData: DashboardData = {
    summary: {
      totalApplications: apps?.length ?? 0,
      readyToMigrate: apps?.filter(a => a.assessment?.status === 'completed').length ?? 0,
      issuesFound: apps?.reduce((sum, a) => sum + (a.issues?.length ?? 0), 0) ?? 0,
      migrationProgress: 0, // compute from waves
      analyzedCount: apps?.filter(a => a.analysis).length ?? 0,
      pendingCount: apps?.filter(a => !a.analysis).length ?? 0,
      migratedCount: waves?.filter(w => w.status === 'completed')
        .reduce((sum, w) => sum + w.applications.length, 0) ?? 0,
      inProgressCount: waves?.filter(w => w.status === 'in-progress')
        .reduce((sum, w) => sum + w.applications.length, 0) ?? 0,
    },
    summaryStats: [], // build from summary above
    quickActions: [], // define your action cards
    applications: (apps ?? []).slice(0, 4).map(a => ({
      name: a.name,
      status: a.analysis ? 'Analyzed' : 'Pending',
      statusVariant: a.analysis ? 'info' as const : 'read' as const,
      category: a.businessService?.name ?? '',
    })),
    reports: [], // from analysis API
    migrationWaves: (waves ?? []).map(w => ({
      name: w.name,
      status: w.status,
      statusVariant: w.status === 'completed' ? 'success' as const : 'info' as const,
      apps: w.applications.length,
      progress: w.status === 'completed' ? 100 : 50,
    })),
  }

  return { data: dashboardData, isLoading: appsLoading || wavesLoading }
}
```

Then wire it into a page:

```tsx
// client/src/app/pages/dashboard/DashboardRoute.tsx
import { useHistory } from 'react-router-dom'
import { DashboardProvider, DashboardPage } from './dashboard'
import { useDashboardData } from './useDashboardData'

export function DashboardRoute() {
  const history = useHistory()
  const { data, isLoading } = useDashboardData()

  return (
    <DashboardProvider data={data} isLoading={isLoading} navigateTo={history.push}>
      <DashboardPage />
    </DashboardProvider>
  )
}
```

### Using individual sections

You can also use individual dashboard sections independently:

```tsx
import { DashboardProvider, SummaryStats, MigrationStatus } from './dashboard'

function CustomPage() {
  return (
    <DashboardProvider data={myData} navigateTo={navigate}>
      <SummaryStats />
      {/* Only show migration status, skip the rest */}
      <MigrationStatus />
    </DashboardProvider>
  )
}
```

### DashboardProvider props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `DashboardData` | Yes | All data the dashboard needs |
| `navigateTo` | `(path: string) => void` | Yes | Router navigation callback |
| `isLoading` | `boolean` | No | Shows loading state (default: `false`) |
| `error` | `Error \| null` | No | Error state (default: `null`) |
| `openExternalLink` | `(url: string) => void` | No | Opens external URLs (default: `window.open`) |
