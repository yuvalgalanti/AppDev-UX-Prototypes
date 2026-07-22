import { Prototype } from '../../launcher/src/prototypes'

export const appDevAiSkillsPrototypes: Prototype[] = [
  {
    name: 'AppDev Jira Workflow',
    project: 'Cursor & Claude Code Agent Skills',
    product: 'AI skill',
    description:
      'Agent skill for Cursor and Claude Code covering AppDev group Jira conventions across products and programs. Covers Epic and Story templates, component title prefixes, activity types, story points, DTUX backlog defaults, uxd-applied-ai labeling, and integration with UXD Jira standards.',
    externalUrl: 'https://gitlab.cee.redhat.com/shirshbe/skill-appdev-jira-workflow',
    buttonLabel: 'View skill (VPN required)',
    path: '',
    status: 'Active',
    lastUpdated: 'Jun 29, 2026',
  },
  {
    name: 'AppDev Weekly Update',
    project: 'Cursor & Claude Code Agent Skills',
    product: 'AI skill',
    description:
      'Cursor and Claude Code agent skill for manual AppDev group weekly update entries from UX prototype and design work. Defines title, single-paragraph body with @author, and footer links with VPN labels — invoked only on explicit request, never auto-generated.',
    externalUrl: 'https://gitlab.cee.redhat.com/shirshbe/skill-appdev-weekly-update',
    buttonLabel: 'View skill (VPN required)',
    path: '',
    status: 'Active',
    lastUpdated: 'Jun 29, 2026',
  },
  {
    name: 'AppDev Quarterly Deck Stories',
    project: 'Cursor & Claude Code Agent Skills',
    product: 'AI skill',
    description:
      'Agent skill for AppDev quarterly planning decks: query Jira for closed past-quarter and open or in-progress future work, group by product and plugin or category, and generate hyperlinked HTML on the Desktop for paste into Google Slides. Covers Q1–Q4 calendar boundaries and all AppDev products — not RHDH-only.',
    externalUrl: 'https://gitlab.cee.redhat.com/shirshbe/skill-appdev-quarterly-deck-stories',
    buttonLabel: 'View skill (VPN required)',
    path: '',
    status: 'Active',
    lastUpdated: 'Jul 5, 2026',
  },
  {
    name: 'UXD Design Critic',
    project: 'Cursor & Claude Code Agent Skills',
    product: 'AI skill',
    description:
      'Deliberately skeptical peer-review skill for closing UXD prototypes: UX Critic questions, Prototype Finisher pre-demo checklist, and Prototype QA for broken flows. Writes a Working / Not working HTML report to the Desktop. Generalized for UXD across products.',
    externalUrl: 'https://gitlab.cee.redhat.com/shirshbe/skill-uxd-design-critic',
    buttonLabel: 'View skill (VPN required)',
    path: '',
    status: 'Active',
    lastUpdated: 'Jul 22, 2026',
  },
]
