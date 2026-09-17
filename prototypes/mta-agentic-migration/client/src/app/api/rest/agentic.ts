import axios from "axios";

import {
  Agent,
  KnowledgeBaseEntry,
  MigrationWorkflow,
  Model,
  New,
  Ref,
  Skill,
  SkillCollection,
  WorkflowRun,
} from "../models";
import { hub } from "../rest";

// ----------------------------------------------------------------------------
// Agents
// ----------------------------------------------------------------------------

const AGENTS = hub`/agents`;

export const getAgents = () =>
  axios.get<Agent[]>(AGENTS).then((response) => response.data);

export const getAgentById = (id: number | string) =>
  axios.get<Agent>(`${AGENTS}/${id}`).then((response) => response.data);

export const createAgent = (obj: New<Agent>) =>
  axios.post<Agent>(AGENTS, obj).then((response) => response.data);

export const updateAgent = (obj: Agent) =>
  axios.put<void>(`${AGENTS}/${obj.id}`, obj).then(() => {});

export const deleteAgent = (id: number) =>
  axios.delete<void>(`${AGENTS}/${id}`).then(() => {});

// ----------------------------------------------------------------------------
// Migration workflows
// ----------------------------------------------------------------------------

const MIGRATION_WORKFLOWS = hub`/migration-workflows`;

export const getMigrationWorkflows = () =>
  axios
    .get<MigrationWorkflow[]>(MIGRATION_WORKFLOWS)
    .then((response) => response.data);

export const getMigrationWorkflowById = (id: number | string) =>
  axios
    .get<MigrationWorkflow>(`${MIGRATION_WORKFLOWS}/${id}`)
    .then((response) => response.data);

export const createMigrationWorkflow = (obj: New<MigrationWorkflow>) =>
  axios
    .post<MigrationWorkflow>(MIGRATION_WORKFLOWS, obj)
    .then((response) => response.data);

export const updateMigrationWorkflow = (obj: MigrationWorkflow) =>
  axios.put<void>(`${MIGRATION_WORKFLOWS}/${obj.id}`, obj).then(() => {});

export const deleteMigrationWorkflow = (id: number) =>
  axios.delete<void>(`${MIGRATION_WORKFLOWS}/${id}`).then(() => {});

// ----------------------------------------------------------------------------
// Workflow runs
// ----------------------------------------------------------------------------

export const getWorkflowRuns = (workflowId: number) =>
  axios
    .get<WorkflowRun[]>(`${MIGRATION_WORKFLOWS}/${workflowId}/runs`)
    .then((response) => response.data);

export const getAllWorkflowRuns = () =>
  axios.get<WorkflowRun[]>(hub`/workflow-runs`).then((r) => r.data);

export const startWorkflowRun = (payload: {
  workflowId: number;
  applications: Ref[];
  targetBranch: string;
}) =>
  axios
    .post<WorkflowRun>(
      `${MIGRATION_WORKFLOWS}/${payload.workflowId}/runs`,
      payload
    )
    .then((response) => response.data);

export const approveWorkflowStage = ({
  workflowId,
  runId,
  stageId,
}: {
  workflowId: number;
  runId: number;
  stageId: number;
}) =>
  axios
    .post<WorkflowRun>(
      `${MIGRATION_WORKFLOWS}/${workflowId}/runs/${runId}/stages/${stageId}/approve`,
      {}
    )
    .then((response) => response.data);

export const sendStageRunMessage = ({
  workflowId,
  runId,
  stageId,
  content,
}: {
  workflowId: number;
  runId: number;
  stageId: number;
  content: string;
}) =>
  axios
    .post<WorkflowRun>(
      `${MIGRATION_WORKFLOWS}/${workflowId}/runs/${runId}/stages/${stageId}/messages`,
      { content }
    )
    .then((response) => response.data);

// ----------------------------------------------------------------------------
// Knowledge base (scoped to a single workflow)
// ----------------------------------------------------------------------------

export const getKnowledgeBaseEntries = (workflowId: number) =>
  axios
    .get<KnowledgeBaseEntry[]>(
      `${MIGRATION_WORKFLOWS}/${workflowId}/knowledge-base`
    )
    .then((response) => response.data);

export const createKnowledgeBaseEntry = ({
  workflowId,
  ...obj
}: New<KnowledgeBaseEntry> & { workflowId: number }) =>
  axios
    .post<KnowledgeBaseEntry>(
      `${MIGRATION_WORKFLOWS}/${workflowId}/knowledge-base`,
      obj
    )
    .then((response) => response.data);

// ----------------------------------------------------------------------------
// Skills
// ----------------------------------------------------------------------------

const SKILLS = hub`/skills`;

export const getSkills = () =>
  axios.get<Skill[]>(SKILLS).then((response) => response.data);

export const createSkill = (obj: New<Skill>) =>
  axios.post<Skill>(SKILLS, obj).then((response) => response.data);

export const updateSkill = (obj: Skill) =>
  axios.put<void>(`${SKILLS}/${obj.id}`, obj).then(() => {});

export const deleteSkill = (id: number) =>
  axios.delete<void>(`${SKILLS}/${id}`).then(() => {});

// ----------------------------------------------------------------------------
// Skill collections
// ----------------------------------------------------------------------------

const SKILL_COLLECTIONS = hub`/skill-collections`;

export const getSkillCollections = () =>
  axios
    .get<SkillCollection[]>(SKILL_COLLECTIONS)
    .then((response) => response.data);

export const createSkillCollection = (obj: New<SkillCollection>) =>
  axios
    .post<SkillCollection>(SKILL_COLLECTIONS, obj)
    .then((response) => response.data);

export const updateSkillCollection = (obj: SkillCollection) =>
  axios.put<void>(`${SKILL_COLLECTIONS}/${obj.id}`, obj).then(() => {});

export const deleteSkillCollection = (id: number) =>
  axios.delete<void>(`${SKILL_COLLECTIONS}/${id}`).then(() => {});

// ----------------------------------------------------------------------------
// Models (approved LLMs Agents may be configured to use)
// ----------------------------------------------------------------------------

const MODELS = hub`/models`;

export const getModels = () =>
  axios.get<Model[]>(MODELS).then((response) => response.data);

export const createModel = (obj: New<Model>) =>
  axios.post<Model>(MODELS, obj).then((response) => response.data);

export const updateModel = (obj: Model) =>
  axios.put<void>(`${MODELS}/${obj.id}`, obj).then(() => {});

export const deleteModel = (id: number) =>
  axios.delete<void>(`${MODELS}/${id}`).then(() => {});

export const setDefaultModel = (id: number) =>
  axios
    .post<Model>(`${MODELS}/${id}/set-default`, {})
    .then((response) => response.data);
