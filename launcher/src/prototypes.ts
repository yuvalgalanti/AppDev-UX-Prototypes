import { appDevAiSkillsPrototypes } from '../../prototypes/appdev-ai-skills/prototypes'
import { podmanDesktopPrototypes } from '../../prototypes/podman-desktop/prototypes'
import { rhdhPrototypes } from '../../prototypes/rhdh/prototypes'
import { devSpacesPrototypes } from '../../prototypes/dev-spaces/prototypes'
import { tasPrototypes } from '../../prototypes/tas/prototypes'
import { tektonPrototypes } from '../../prototypes/tekton/prototypes'
import { tpaPrototypes } from '../../prototypes/tpa/prototypes'

export type Product =
  | 'RHDH'
  | 'MTA'
  | 'Konflux'
  | 'TPA'
  | 'TAS'
  | 'Podman Desktop'
  | 'RHCL'
  | 'DevSpaces'
  | 'Tekton'
  | 'AI skill'

export const allProducts: Product[] = [
  'RHDH',
  'MTA',
  'Konflux',
  'TPA',
  'TAS',
  'Podman Desktop',
  'RHCL',
  'DevSpaces',
  'Tekton',
  'AI skill',
]

export type PrototypeTagColor = 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'teal' | 'yellow' | 'grey' | 'orangered'

export interface PrototypeTag {
  label: string
  color: PrototypeTagColor
  icon?: 'stars'
}

export interface Prototype {
  name: string
  project: string
  product: Product
  description: string
  path: string
  externalUrl?: string
  buttonLabel?: string
  tags?: PrototypeTag[]
  status: 'Active' | 'In Progress' | 'Planned'
  lastUpdated: string
}

export const prototypes: Prototype[] = [
  {
    name: 'Konveyor / MTA',
    project: 'Migration Toolkit for Applications',
    product: 'MTA',
    description: 'A prototype of the Konveyor Tackle UI for application modernization and migration. Includes a dashboard with migration summary stats, a Migrate Application wizard for generating migration assets, and an Analysis Report wizard with configurable target selection cards.',
    path: '/AppDev-UX-Prototypes/mta/',
    status: 'Active',
    lastUpdated: 'Apr 21, 2026',
  },
  {
    name: 'MTA for RHDH',
    project: 'MTA Integration in Developer Hub',
    product: 'MTA',
    description:
      'Migration Toolkit for Applications integrated into Red Hat Developer Hub as dynamic plugins. Includes onboarding, migration analysis, target selection, and deployment asset workflows within the RHDH catalog.',
    externalUrl: 'https://mta-prototype-dcohenrh-dev.apps.rm3.7wse.p1.openshiftapps.com',
    buttonLabel: 'Launch prototype',
    path: '',
    tags: [{ label: 'RHDH', color: 'purple' }],
    status: 'Active',
    lastUpdated: 'Jul 5, 2026',
  },
  ...tasPrototypes,
  ...tektonPrototypes,
  ...tpaPrototypes,
  ...rhdhPrototypes,
  ...devSpacesPrototypes,
  ...podmanDesktopPrototypes,
  ...appDevAiSkillsPrototypes,
]
