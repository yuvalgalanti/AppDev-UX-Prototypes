export interface WorkflowWizardStageValues {
  name: string;
  description: string;
  agentId: number | "";
  requiresApproval: boolean;
}

export interface WorkflowWizardFormValues {
  name: string;
  description: string;
  archetypeId: number | "";
  targetProfileIds: number[];
  saveLessonsLearned: boolean;
  autoCreatePR: boolean;
  stages: WorkflowWizardStageValues[];
}
