/**
 * MSW request handlers backing the entire Hub REST API with the fixture data
 * from ./fixtures.ts. Enabled by setting the MOCK env var to include "full",
 * e.g. MOCK=full or MOCK=full.stub=*
 *
 * Simplifications made for demo purposes:
 *  - List endpoints ignore incoming filter/sort params and return the full
 *    fixture array (with an `x-total` header for paginated endpoints).
 *  - Create/update/delete mutate the in-memory fixture arrays so the app
 *    feels alive during a session, but nothing persists across a reload.
 */
import { type RestHandler, rest } from "msw";

import {
  MigrationWorkflow,
  StageRunMessage,
  WorkflowCommit,
  WorkflowRun,
} from "@app/api/models";
import { hub } from "@app/api/rest";

import * as fx from "./fixtures";

// ---------------------------------------------------------------------------
// Generic CRUD helper for simple `{ id, ... }` collections
// ---------------------------------------------------------------------------

function nextIdFor(store: { id: number }[]): number {
  return store.reduce((max, item) => Math.max(max, item.id), 0) + 1;
}

function crud<T extends { id: number }>(
  basePath: string,
  store: T[],
  { bulkDelete = false }: { bulkDelete?: boolean } = {}
): RestHandler[] {
  const handlers: RestHandler[] = [
    rest.get(basePath, (_req, res, ctx) => res(ctx.json(store))),

    rest.get(`${basePath}/:id`, (req, res, ctx) => {
      const item = store.find((x) => String(x.id) === req.params.id);
      return item
        ? res(ctx.json(item))
        : res(ctx.status(404), ctx.json({ message: "Not found" }));
    }),

    rest.post(basePath, async (req, res, ctx) => {
      const body = (await req.json()) as Partial<T>;
      const created = { ...body, id: nextIdFor(store) } as T;
      store.push(created);
      return res(ctx.status(201), ctx.json(created));
    }),

    rest.put(`${basePath}/:id`, async (req, res, ctx) => {
      const id = Number(req.params.id);
      const body = (await req.json()) as Partial<T>;
      const idx = store.findIndex((x) => x.id === id);
      if (idx !== -1) {
        store[idx] = { ...store[idx], ...body, id };
      }
      return res(ctx.status(204));
    }),

    rest.delete(`${basePath}/:id`, (req, res, ctx) => {
      const id = Number(req.params.id);
      const idx = store.findIndex((x) => x.id === id);
      if (idx !== -1) store.splice(idx, 1);
      return res(ctx.status(204));
    }),
  ];

  if (bulkDelete) {
    handlers.push(
      rest.delete(basePath, async (req, res, ctx) => {
        const ids = (await req.json()) as number[];
        ids.forEach((id) => {
          const idx = store.findIndex((x) => x.id === id);
          if (idx !== -1) store.splice(idx, 1);
        });
        return res(ctx.status(200));
      })
    );
  }

  return handlers;
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

const controlsHandlers: RestHandler[] = [
  ...crud(hub`/businessservices`, fx.businessServices),
  ...crud(hub`/stakeholders`, fx.stakeholders),
  ...crud(hub`/stakeholdergroups`, fx.stakeholderGroups),
  ...crud(hub`/jobfunctions`, fx.jobFunctions),
  ...crud(hub`/tags`, fx.tags),
  ...crud(hub`/tagcategories`, fx.tagCategories),
];

// ---------------------------------------------------------------------------
// Identities / Proxies / Settings
// ---------------------------------------------------------------------------

const adminHandlers: RestHandler[] = [
  ...crud(hub`/identities`, fx.identities),
  ...crud(hub`/proxies`, fx.proxies as (typeof fx.proxies[number] & { id: number })[]),

  rest.get(`${hub`/settings`}/:key`, (req, res, ctx) => {
    const key = req.params.key as string;
    return res(ctx.json(fx.settingsStore[key] ?? null));
  }),
  rest.put(`${hub`/settings`}/:key`, async (req, res, ctx) => {
    const key = req.params.key as string;
    fx.settingsStore[key] = await req.json();
    return res(ctx.status(200));
  }),
];

// ---------------------------------------------------------------------------
// Migration waves & tickets/trackers
// ---------------------------------------------------------------------------

const wavesAndTicketingHandlers: RestHandler[] = [
  ...crud(hub`/migrationwaves`, fx.migrationWaves),
  ...crud(hub`/tickets`, fx.tickets),
  ...crud(hub`/trackers`, fx.trackers),

  rest.get(`${hub`/trackers`}/:id/projects`, (_req, res, ctx) =>
    res(
      ctx.json([
        { id: "10000", name: "Migration" },
        { id: "10001", name: "Platform" },
      ])
    )
  ),
  rest.get(`${hub`/trackers`}/:id/projects/:projectId/issuetypes`, (_req, res, ctx) =>
    res(
      ctx.json([
        { id: "1", name: "Task" },
        { id: "2", name: "Story" },
      ])
    )
  ),
];

// ---------------------------------------------------------------------------
// Applications & Archetypes
// ---------------------------------------------------------------------------

const applicationsAndArchetypesHandlers: RestHandler[] = [
  ...crud(hub`/applications`, fx.applications, { bulkDelete: true }),
  ...crud(hub`/archetypes`, fx.archetypes),
  ...crud(hub`/reviews`, fx.reviews),

  rest.get(hub`/applications/:id/manifest`, (req, res, ctx) => {
    const id = Number(req.params.id);
    return res(
      ctx.json({
        id,
        application: { id, name: fx.applications.find((a) => a.id === id)?.name ?? "" },
        content: { note: "Mock manifest content for demo purposes" },
      })
    );
  }),

  rest.get(hub`/applications/:id/facts`, (_req, res, ctx) =>
    res(ctx.json({ "mock.fact": "This application has mock facts for demo purposes" }))
  ),

  rest.get(hub`/dependencies`, (req, res, ctx) => {
    const fromId = req.url.searchParams.get("from.id");
    const toId = req.url.searchParams.get("to.id");
    let data = fx.applicationDependencies;
    if (fromId) data = data.filter((d) => String(d.from.id) === fromId);
    if (toId) data = data.filter((d) => String(d.to.id) === toId);
    return res(ctx.json(data));
  }),
  rest.post(hub`/dependencies`, async (req, res, ctx) => {
    const body = await req.json();
    const created = { ...body, id: nextIdFor(fx.applicationDependencies as { id: number }[]) };
    fx.applicationDependencies.push(created);
    return res(ctx.status(201), ctx.json(created));
  }),
  rest.delete(hub`/dependencies/:id`, (req, res, ctx) => {
    const id = Number(req.params.id);
    const idx = fx.applicationDependencies.findIndex((d) => d.id === id);
    if (idx !== -1) fx.applicationDependencies.splice(idx, 1);
    return res(ctx.status(204));
  }),
];

// ---------------------------------------------------------------------------
// Assessments & Questionnaires
// ---------------------------------------------------------------------------

const assessmentsAndQuestionnairesHandlers: RestHandler[] = [
  ...crud(hub`/assessments`, fx.assessments),
  ...crud(hub`/questionnaires`, fx.questionnaires),

  rest.get(hub`/archetypes/:id/assessments`, (req, res, ctx) => {
    const id = Number(req.params.id);
    return res(ctx.json(fx.assessments.filter((a) => a.archetype?.id === id)));
  }),
  rest.post(hub`/archetypes/:id/assessments`, async (req, res, ctx) => {
    const id = Number(req.params.id);
    const archetype = fx.archetypes.find((a) => a.id === id);
    const body = await req.json();
    const created = {
      ...body,
      id: nextIdFor(fx.assessments),
      archetype: archetype ? { id: archetype.id, name: archetype.name } : undefined,
      status: "empty",
      risk: "unknown",
    };
    fx.assessments.push(created);
    return res(ctx.status(201), ctx.json(created));
  }),

  rest.get(hub`/applications/:id/assessments`, (req, res, ctx) => {
    const id = Number(req.params.id);
    return res(ctx.json(fx.assessments.filter((a) => a.application?.id === id)));
  }),
  rest.post(hub`/applications/:id/assessments`, async (req, res, ctx) => {
    const id = Number(req.params.id);
    const application = fx.applications.find((a) => a.id === id);
    const body = await req.json();
    const created = {
      ...body,
      id: nextIdFor(fx.assessments),
      application: application ? { id: application.id, name: application.name } : undefined,
      status: "empty",
      risk: "unknown",
    };
    fx.assessments.push(created);
    return res(ctx.status(201), ctx.json(created));
  }),
];

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

const tasksHandlers: RestHandler[] = [
  rest.get(hub`/tasks/report/dashboard`, (_req, res, ctx) =>
    res(ctx.json(fx.taskDashboard))
  ),
  rest.get(hub`/tasks/report/queue`, (_req, res, ctx) => res(ctx.json(fx.taskQueue))),

  rest.get(hub`/tasks`, (_req, res, ctx) =>
    res(ctx.set("x-total", String(fx.tasks.length)), ctx.json(fx.tasks))
  ),
  rest.get(hub`/tasks/:id`, (req, res, ctx) => {
    const id = Number(req.params.id);
    const task = fx.tasks.find((t) => t.id === id);
    return task
      ? res(ctx.json(task))
      : res(ctx.status(404), ctx.json({ message: "Task not found" }));
  }),
  rest.put(hub`/tasks/:id/cancel`, (req, res, ctx) => {
    const id = Number(req.params.id);
    const task = fx.tasks.find((t) => t.id === id);
    if (task) task.state = "Canceled";
    return res(ctx.status(200));
  }),
  rest.put(hub`/tasks/cancel`, (_req, res, ctx) => res(ctx.status(200))),
  rest.patch(hub`/tasks/:id`, async (req, res, ctx) => {
    const id = Number(req.params.id);
    const idx = fx.tasks.findIndex((t) => t.id === id);
    const body = await req.json();
    if (idx !== -1) fx.tasks[idx] = { ...fx.tasks[idx], ...body };
    return res(ctx.status(200), ctx.json(fx.tasks[idx]));
  }),
  rest.delete(hub`/tasks/:id`, (req, res, ctx) => {
    const id = Number(req.params.id);
    const idx = fx.tasks.findIndex((t) => t.id === id);
    if (idx !== -1) fx.tasks.splice(idx, 1);
    return res(ctx.status(204));
  }),
  rest.post(hub`/tasks`, async (req, res, ctx) => {
    const body = await req.json();
    const created = { ...body, id: nextIdFor(fx.tasks), state: "Ready" };
    fx.tasks.push(created);
    return res(ctx.status(201), ctx.json(created));
  }),

  ...crud(hub`/taskgroups`, [] as { id: number }[]),
  rest.put(hub`/taskgroups/:id/submit`, (_req, res, ctx) => res(ctx.status(200))),
  rest.post(hub`/taskgroups/:id/bucket/*`, (_req, res, ctx) => res(ctx.status(200))),
  rest.delete(hub`/taskgroups/:id/bucket/*`, (_req, res, ctx) => res(ctx.status(200))),
];

// ---------------------------------------------------------------------------
// Custom migration targets / Analysis profiles / Asset generators / Platforms
// ---------------------------------------------------------------------------

const targetsAndProfilesHandlers: RestHandler[] = [
  ...crud(hub`/targets`, fx.targets),
  ...crud(hub`/analysis/profiles`, fx.analysisProfiles),
  ...crud(hub`/generators`, fx.generators),
  ...crud(hub`/platforms`, fx.platforms),
];

// ---------------------------------------------------------------------------
// Analysis reports: issues, insights, dependencies
// ---------------------------------------------------------------------------

const isIssueFilter = (filter: string | null) => (filter ?? "").includes(">0");

const toAnalysisReportInsight = (r: fx.RuleInsightFixture) => ({
  ruleset: r.ruleset,
  rule: r.rule,
  name: r.name,
  description: r.description,
  category: r.category,
  effort: r.effort,
  labels: r.labels,
  links: [],
  applications: r.applicationIds.length,
});

const toAnalysisReportApplicationInsight = (r: fx.RuleInsightFixture) => ({
  id: r.id,
  ruleset: r.ruleset,
  rule: r.rule,
  name: r.name,
  description: r.description,
  category: r.category,
  effort: r.effort,
  labels: r.labels,
  links: [],
  files: Math.max(1, r.applicationIds.length - 1),
});

const toAnalysisReportInsightApplication = (
  r: fx.RuleInsightFixture,
  appId: number
) => {
  const app = fx.applications.find((a) => a.id === appId);
  return {
    id: appId,
    name: app?.name ?? `Application ${appId}`,
    description: app?.description ?? "",
    businessService: app?.businessService?.name ?? "",
    effort: r.effort,
    incidents: 1 + (appId % 5),
    files: 1 + (appId % 3),
    insight: {
      id: r.id,
      name: r.name,
      description: r.description,
      ruleset: r.ruleset,
      rule: r.rule,
    },
  };
};

const analysisReportsHandlers: RestHandler[] = [
  rest.get(hub`/analyses/report/rules`, (req, res, ctx) => {
    const filter = req.url.searchParams.get("filter");
    const wantIssues = isIssueFilter(filter);
    const data = fx.ruleInsights
      .filter((r) => (wantIssues ? r.effort > 0 : r.effort === 0))
      .map(toAnalysisReportInsight);
    return res(ctx.set("x-total", String(data.length)), ctx.json(data));
  }),

  rest.get(hub`/analyses/report/applications/:id/insights`, (req, res, ctx) => {
    const id = Number(req.params.id);
    const filter = req.url.searchParams.get("filter");
    const wantIssues = isIssueFilter(filter);
    const data = fx.ruleInsights
      .filter((r) => (wantIssues ? r.effort > 0 : r.effort === 0))
      .filter((r) => r.applicationIds.includes(id))
      .map(toAnalysisReportApplicationInsight);
    return res(ctx.set("x-total", String(data.length)), ctx.json(data));
  }),

  rest.get(hub`/analyses/report/insights/applications`, (req, res, ctx) => {
    const filter = req.url.searchParams.get("filter");
    const wantIssues = isIssueFilter(filter);
    const matching = fx.ruleInsights.filter((r) =>
      wantIssues ? r.effort > 0 : r.effort === 0
    );
    const seen = new Set<number>();
    const data = matching.flatMap((r) =>
      r.applicationIds
        .filter((appId) => {
          if (seen.has(appId)) return false;
          seen.add(appId);
          return true;
        })
        .map((appId) => toAnalysisReportInsightApplication(r, appId))
    );
    return res(ctx.set("x-total", String(data.length)), ctx.json(data));
  }),

  rest.get(hub`/analyses/insights/:id`, (req, res, ctx) => {
    const id = Number(req.params.id);
    const r = fx.ruleInsights.find((ri) => ri.id === id);
    if (!r) return res(ctx.status(404));
    return res(
      ctx.json({
        id: r.id,
        analysis: 1,
        ruleset: r.ruleset,
        rule: r.rule,
        name: r.name,
        description: r.description,
        category: r.category,
        effort: r.effort,
        labels: r.labels,
        links: [],
      })
    );
  }),

  rest.get(hub`/analyses/insights/:id/incidents`, (req, res, ctx) => {
    const id = Number(req.params.id);
    const r = fx.ruleInsights.find((ri) => ri.id === id);
    const data = (r?.applicationIds ?? []).map((appId, idx) => ({
      id: id * 100 + idx,
      insight: id,
      file: `src/main/java/com/example/app${appId}/Service.java`,
      line: 42 + idx,
      message: r?.description ?? "",
      codeSnip: "// affected code snippet",
      facts: {},
    }));
    return res(ctx.set("x-total", String(data.length)), ctx.json(data));
  }),

  rest.get(hub`/analyses/report/insights/:id/files`, (req, res, ctx) => {
    const id = Number(req.params.id);
    const r = fx.ruleInsights.find((ri) => ri.id === id);
    const data = (r?.applicationIds ?? []).map((appId) => ({
      insightId: id,
      file: `src/main/java/com/example/app${appId}/Service.java`,
      incidents: 1 + (appId % 3),
      effort: r?.effort ?? 0,
    }));
    return res(ctx.set("x-total", String(data.length)), ctx.json(data));
  }),

  rest.get(hub`/analyses/report/dependencies`, (_req, res, ctx) =>
    res(
      ctx.set("x-total", String(fx.analysisDependencies.length)),
      ctx.json(fx.analysisDependencies)
    )
  ),
  rest.get(hub`/analyses/report/dependencies/applications`, (_req, res, ctx) =>
    res(
      ctx.set("x-total", String(fx.analysisAppDependencies.length)),
      ctx.json(fx.analysisAppDependencies)
    )
  ),
];

// ---------------------------------------------------------------------------
// Agentic migration (UI concept only - not part of the Konveyor Hub API)
//
// Workflow runs are simulated with a simple "tick on read" state machine:
// each time a non-terminal run is fetched, its current stage is advanced to
// "Succeeded" once it has been "Running" for STAGE_RUNNING_MS, at which point
// the next stage starts "Running". A stage with `requiresApproval` stops at
// "AwaitingApproval" instead of auto-succeeding, and only advances once the
// dedicated approve endpoint is called. This keeps the whole simulation
// stateless-ish (no timers/intervals) while still animating in the UI as the
// Runs tab polls.
// ---------------------------------------------------------------------------

const STAGE_RUNNING_MS = 4000;

let messageIdSeq = 10000;

function pushMessage(
  stageRun: WorkflowRun["stageRuns"][number],
  author: StageRunMessage["author"],
  content: string
) {
  if (!stageRun.messages) stageRun.messages = [];
  stageRun.messages.push({
    id: messageIdSeq++,
    author,
    content,
    timestamp: new Date().toISOString(),
  });
}

const RUN_NAME_STOPWORDS = new Set([
  "to",
  "and",
  "the",
  "of",
  "for",
  "a",
  "an",
  "on",
  "in",
]);

/** Derives a short, workflow-specific code from its name, e.g. "Customer Portal to Quarkus" -> "cpq". */
function shortCode(workflowName: string): string {
  const words = workflowName
    .split(/[^a-zA-Z0-9]+/)
    .filter((w) => w && !RUN_NAME_STOPWORDS.has(w.toLowerCase()));
  const initials = words
    .map((w) => w[0].toLowerCase())
    .join("")
    .slice(0, 4);
  if (initials.length >= 2) return initials;
  return workflowName.replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toLowerCase() || "run";
}

const RUN_SUFFIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

function randomSuffix(length = 5): string {
  let suffix = "";
  for (let i = 0; i < length; i++) {
    suffix += RUN_SUFFIX_CHARS[Math.floor(Math.random() * RUN_SUFFIX_CHARS.length)];
  }
  return suffix;
}

/** Generates a Kubernetes/Argo-style run name, e.g. "cpq-8f3k1", unique among existing runs. */
function generateRunName(workflow: MigrationWorkflow): string {
  const prefix = shortCode(workflow.name);
  let name = `${prefix}-${randomSuffix()}`;
  while (fx.workflowRuns.some((r) => r.name === name)) {
    name = `${prefix}-${randomSuffix()}`;
  }
  return name;
}

let commitIdSeq = 20000;

/**
 * Builds a mock link to the commit in the application's source repository
 * (GitHub, GitLab, etc), falling back to a made-up GitHub URL when the
 * application has no repository configured. Purely cosmetic - for demo
 * purposes only.
 */
function commitUrlFor(run: WorkflowRun, sha: string): string {
  const app = fx.applications.find((a) =>
    run.applications.some((ra) => ra.id === a.id)
  );
  const repoUrl = app?.repository?.url;
  if (repoUrl) {
    const base = repoUrl.replace(/\.git$/, "").replace(/\/$/, "");
    return base.includes("gitlab.com")
      ? `${base}/-/commit/${sha}`
      : `${base}/commit/${sha}`;
  }
  const slug = (app?.name ?? "migration-repo")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `https://github.com/konveyor-demo/${slug}/commit/${sha}`;
}

function pushCommit(run: WorkflowRun, stageId: number, message: string) {
  if (!run.commits) run.commits = [];
  const sha = randomSuffix(7);
  const commit: WorkflowCommit = {
    id: commitIdSeq++,
    sha,
    message,
    stageId,
    timestamp: new Date().toISOString(),
    url: commitUrlFor(run, sha),
  };
  run.commits.unshift(commit);
}

/** Produces a plausible canned agent reply to a human chat message, for demo purposes only. */
function simulateAgentReply(
  humanMessage: string,
  stageStatus: WorkflowRun["stageRuns"][number]["status"]
): string {
  const lower = humanMessage.toLowerCase();
  if (
    lower.includes("approve") ||
    lower.includes("looks good") ||
    lower.includes("lgtm")
  ) {
    return "Acknowledged — use the Approve button above to confirm, and I'll continue with the next stage.";
  }
  if (lower.includes("?")) {
    return "Good question. Let me know if you'd like me to re-run any part of this stage with more detail in the output.";
  }
  if (stageStatus === "Failed") {
    return "Understood. I've flagged this for a retry once the underlying issue is resolved.";
  }
  return "Got it, thanks for the input — I'll factor that in as I continue.";
}

function tickRun(workflow: MigrationWorkflow, run: WorkflowRun) {
  if (run.status !== "Pending" && run.status !== "Running") {
    return run;
  }

  const currentStageRun =
    run.stageRuns.find((sr) => sr.status === "Running") ??
    run.stageRuns.find((sr) => sr.status === "Pending");
  if (!currentStageRun) {
    run.status = "Succeeded";
    run.completedAt = new Date().toISOString();
    return run;
  }

  const stage = workflow.stages.find((s) => s.id === currentStageRun.stageId);
  if (!stage) return run;

  if (currentStageRun.status === "Pending") {
    currentStageRun.status = "Running";
    currentStageRun.startedAt = new Date().toISOString();
    run.status = "Running";
    pushMessage(currentStageRun, "agent", `Starting "${stage.name}"...`);
    return run;
  }

  const startedAt = new Date(currentStageRun.startedAt ?? run.startedAt).getTime();
  const elapsed = Date.now() - startedAt;
  if (elapsed < STAGE_RUNNING_MS) {
    return run;
  }

  if (stage.requiresApproval) {
    currentStageRun.status = "AwaitingApproval";
    run.status = "AwaitingApproval";
    pushMessage(
      currentStageRun,
      "agent",
      `I've finished "${stage.name}". This stage requires your approval before I continue — please review and approve.`
    );
    return run;
  }

  currentStageRun.status = "Succeeded";
  currentStageRun.completedAt = new Date().toISOString();
  pushMessage(currentStageRun, "agent", `Completed "${stage.name}".`);
  pushCommit(
    run,
    stage.id,
    `Stage ${workflow.stages.indexOf(stage) + 1} (${stage.name}): ${stage.description ?? "completed successfully"}`
  );
  advanceToNextStage(workflow, run, currentStageRun.stageId);
  return run;
}

function advanceToNextStage(
  workflow: MigrationWorkflow,
  run: WorkflowRun,
  completedStageId: number
) {
  const stageIndex = workflow.stages.findIndex((s) => s.id === completedStageId);
  const nextStage = workflow.stages[stageIndex + 1];
  if (!nextStage) {
    run.status = "Succeeded";
    run.completedAt = new Date().toISOString();
    return;
  }

  const nextStageRun = run.stageRuns.find((sr) => sr.stageId === nextStage.id);
  if (nextStageRun) {
    nextStageRun.status = "Running";
    nextStageRun.startedAt = new Date().toISOString();
  }
  run.status = "Running";
}

function syncLastRun(workflowId: number, run: WorkflowRun) {
  const workflow = fx.migrationWorkflows.find((w) => w.id === workflowId);
  if (!workflow) return;
  workflow.lastRun = {
    id: run.id,
    status: run.status,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
  };
}

const agenticMigrationHandlers: RestHandler[] = [
  ...crud(hub`/agents`, fx.agents),
  ...crud(hub`/migration-workflows`, fx.migrationWorkflows),
  ...crud(hub`/skills`, fx.skills),
  ...crud(hub`/skill-collections`, fx.skillCollections),
  ...crud(hub`/models`, fx.models),

  rest.post(hub`/models/:id/set-default`, (req, res, ctx) => {
    const id = Number(req.params.id);
    fx.models.forEach((model) => {
      model.isDefault = model.id === id;
    });
    const model = fx.models.find((m) => m.id === id);
    return model
      ? res(ctx.json(model))
      : res(ctx.status(404), ctx.json({ message: "Not found" }));
  }),

  rest.get(hub`/workflow-runs`, (_req, res, ctx) => {
    const runs = fx.workflowRuns.map((run) => {
      const workflow = fx.migrationWorkflows.find((w) => w.id === run.workflowId);
      if (workflow) {
        tickRun(workflow, run);
        syncLastRun(run.workflowId, run);
      }
      return run;
    }).sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    return res(ctx.json(runs));
  }),

  rest.get(hub`/migration-workflows/:workflowId/runs`, (req, res, ctx) => {
    const workflowId = Number(req.params.workflowId);
    const workflow = fx.migrationWorkflows.find((w) => w.id === workflowId);
    const runs = fx.workflowRuns
      .filter((r) => r.workflowId === workflowId)
      .map((run) => {
        if (workflow) {
          tickRun(workflow, run);
          syncLastRun(workflowId, run);
        }
        return run;
      })
      .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
    return res(ctx.json(runs));
  }),

  rest.post(hub`/migration-workflows/:workflowId/runs`, async (req, res, ctx) => {
    const workflowId = Number(req.params.workflowId);
    const workflow = fx.migrationWorkflows.find((w) => w.id === workflowId);
    if (!workflow) {
      return res(ctx.status(404), ctx.json({ message: "Not found" }));
    }
    const body = (await req.json()) as {
      applications?: { id: number; name: string }[];
      targetBranch?: string;
    };

    const newRun: WorkflowRun = {
      id: nextIdFor(fx.workflowRuns),
      workflowId,
      name: generateRunName(workflow),
      status: "Pending",
      applications: body.applications ?? [],
      targetBranch: body.targetBranch ?? "main",
      startedAt: new Date().toISOString(),
      stageRuns: workflow.stages.map((stage) => ({
        stageId: stage.id,
        status: "Pending",
        messages: [],
      })),
      commits: [],
    };
    fx.workflowRuns.push(newRun);
    tickRun(workflow, newRun);
    syncLastRun(workflowId, newRun);
    return res(ctx.status(201), ctx.json(newRun));
  }),

  rest.post(
    hub`/migration-workflows/:workflowId/runs/:runId/stages/:stageId/approve`,
    (req, res, ctx) => {
      const workflowId = Number(req.params.workflowId);
      const runId = Number(req.params.runId);
      const stageId = Number(req.params.stageId);

      const workflow = fx.migrationWorkflows.find((w) => w.id === workflowId);
      const run = fx.workflowRuns.find((r) => r.id === runId && r.workflowId === workflowId);
      if (!workflow || !run) {
        return res(ctx.status(404), ctx.json({ message: "Not found" }));
      }

      const stageRun = run.stageRuns.find((sr) => sr.stageId === stageId);
      if (!stageRun || stageRun.status !== "AwaitingApproval") {
        return res(ctx.status(409), ctx.json({ message: "Stage is not awaiting approval" }));
      }

      const now = new Date().toISOString();
      stageRun.status = "Succeeded";
      stageRun.approvedAt = now;
      stageRun.completedAt = now;
      pushMessage(
        stageRun,
        "agent",
        "Approved by reviewer. Continuing to the next stage."
      );
      const stageIndex = workflow.stages.findIndex((s) => s.id === stageId);
      const stage = workflow.stages[stageIndex];
      if (stage) {
        pushCommit(
          run,
          stage.id,
          `Stage ${stageIndex + 1} (${stage.name}): ${stage.description ?? "approved and completed"}`
        );
      }
      advanceToNextStage(workflow, run, stageId);
      syncLastRun(workflowId, run);
      return res(ctx.json(run));
    }
  ),

  rest.post(
    hub`/migration-workflows/:workflowId/runs/:runId/stages/:stageId/messages`,
    async (req, res, ctx) => {
      const workflowId = Number(req.params.workflowId);
      const runId = Number(req.params.runId);
      const stageId = Number(req.params.stageId);

      const run = fx.workflowRuns.find(
        (r) => r.id === runId && r.workflowId === workflowId
      );
      const stageRun = run?.stageRuns.find((sr) => sr.stageId === stageId);
      if (!run || !stageRun) {
        return res(ctx.status(404), ctx.json({ message: "Not found" }));
      }

      const body = (await req.json()) as { content?: string };
      const content = (body.content ?? "").trim();
      if (!content) {
        return res(
          ctx.status(400),
          ctx.json({ message: "Message content is required" })
        );
      }

      pushMessage(stageRun, "human", content);
      pushMessage(stageRun, "agent", simulateAgentReply(content, stageRun.status));
      return res(ctx.json(run));
    }
  ),

  rest.get(hub`/migration-workflows/:workflowId/knowledge-base`, (req, res, ctx) => {
    const workflowId = Number(req.params.workflowId);
    return res(
      ctx.json(fx.knowledgeBaseEntries.filter((entry) => entry.workflowId === workflowId))
    );
  }),

  rest.post(hub`/migration-workflows/:workflowId/knowledge-base`, async (req, res, ctx) => {
    const workflowId = Number(req.params.workflowId);
    const body = (await req.json()) as Partial<(typeof fx.knowledgeBaseEntries)[number]>;
    const created = {
      ...body,
      id: nextIdFor(fx.knowledgeBaseEntries),
      workflowId,
      createdAt: new Date().toISOString(),
    } as (typeof fx.knowledgeBaseEntries)[number];
    fx.knowledgeBaseEntries.push(created);
    return res(ctx.status(201), ctx.json(created));
  }),
];

// ---------------------------------------------------------------------------
// Auth (only reached in AUTH_REQUIRED=true setups)
// ---------------------------------------------------------------------------

const authHandlers: RestHandler[] = [
  rest.get(hub`/auth/self`, (_req, res, ctx) =>
    res(
      ctx.json({
        user: {
          id: 1,
          subject: "demo-user",
          login: "demo-user",
          name: "Demo User",
          email: "demo-user@example.com",
          roles: [{ id: 1, name: "admin" }],
          tokens: [],
          createUser: "admin",
          updateUser: "admin",
          createTime: "2026-01-01T00:00:00Z",
        },
        scopes: ["*:*"],
      })
    )
  ),
  rest.get(hub`/auth/scopes`, (_req, res, ctx) =>
    res(ctx.json([{ name: "*:*", resource: "*", verb: "*" }]))
  ),
];

// ---------------------------------------------------------------------------
// Misc admin/low-traffic endpoints - kept minimal so secondary pages don't
// error out, without needing full fixture data for every corner of the app.
// ---------------------------------------------------------------------------

const miscHandlers: RestHandler[] = [
  rest.get(hub`/imports`, (_req, res, ctx) => res(ctx.json([]))),
  rest.get(hub`/importsummaries`, (_req, res, ctx) => res(ctx.json([]))),
  rest.get(hub`/cache/m2`, (_req, res, ctx) =>
    res(ctx.json({ path: "/cache/m2", capacity: "20Gi", used: "1.2Gi", exists: true }))
  ),
  rest.get(hub`/roles`, (_req, res, ctx) =>
    res(ctx.json([{ id: 1, name: "admin", scopes: ["*:*"], createUser: "admin", updateUser: "admin", createTime: "2026-01-01T00:00:00Z" }]))
  ),
  rest.get(hub`/users`, (_req, res, ctx) =>
    res(
      ctx.json([
        {
          id: 1,
          subject: "demo-user",
          login: "demo-user",
          name: "Demo User",
          email: "demo-user@example.com",
          roles: [{ id: 1, name: "admin" }],
          tokens: [],
          createUser: "admin",
          updateUser: "admin",
          createTime: "2026-01-01T00:00:00Z",
        },
      ])
    )
  ),
  rest.get(hub`/auth/tokens`, (_req, res, ctx) => res(ctx.json([]))),
  rest.get(hub`/schemas`, (_req, res, ctx) => res(ctx.json([]))),
];

export const fullMockHandlers: RestHandler[] = [
  ...controlsHandlers,
  ...adminHandlers,
  ...wavesAndTicketingHandlers,
  ...applicationsAndArchetypesHandlers,
  ...assessmentsAndQuestionnairesHandlers,
  ...tasksHandlers,
  ...targetsAndProfilesHandlers,
  ...analysisReportsHandlers,
  ...agenticMigrationHandlers,
  ...authHandlers,
  ...miscHandlers,
];

export default fullMockHandlers;
