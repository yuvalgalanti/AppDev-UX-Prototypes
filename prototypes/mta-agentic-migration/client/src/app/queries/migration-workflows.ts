import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import {
  KnowledgeBaseEntry,
  MigrationWorkflow,
  New,
  Ref,
  WorkflowRun,
} from "@app/api/models";
import {
  approveWorkflowStage,
  createKnowledgeBaseEntry,
  createMigrationWorkflow,
  deleteMigrationWorkflow,
  getAllWorkflowRuns,
  getKnowledgeBaseEntries,
  getMigrationWorkflowById,
  getMigrationWorkflows,
  getWorkflowRuns,
  sendStageRunMessage,
  startWorkflowRun,
  updateMigrationWorkflow,
} from "@app/api/rest";

export const MigrationWorkflowsQueryKey = "migrationWorkflows";
const WorkflowRunsQueryKey = "workflowRuns";
const KnowledgeBaseQueryKey = "workflowKnowledgeBase";

const isRunNonTerminal = (run: WorkflowRun) =>
  run.status === "Pending" ||
  run.status === "Running" ||
  run.status === "AwaitingApproval";

export const useFetchMigrationWorkflows = () => {
  const {
    data: workflows,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useQuery<MigrationWorkflow[]>({
    queryKey: [MigrationWorkflowsQueryKey],
    queryFn: getMigrationWorkflows,
    onError: (err) => console.log(err),
  });

  return {
    workflows: workflows || [],
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useFetchMigrationWorkflowById = (id?: number | string) => {
  const {
    data: workflow,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useQuery<MigrationWorkflow>({
    queryKey: [MigrationWorkflowsQueryKey, id],
    queryFn: () => getMigrationWorkflowById(id as number | string),
    enabled: !!id,
    onError: (err) => console.log(err),
  });

  return {
    workflow,
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useCreateMigrationWorkflowMutation = (
  onSuccess: (workflow: MigrationWorkflow) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, mutateAsync, error } = useMutation({
    mutationFn: (obj: New<MigrationWorkflow>) => createMigrationWorkflow(obj),
    onSuccess: (workflow) => {
      onSuccess(workflow);
      queryClient.invalidateQueries({ queryKey: [MigrationWorkflowsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, mutateAsync, isPending, error };
};

export const useUpdateMigrationWorkflowMutation = (
  onSuccess: (workflow: MigrationWorkflow) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, mutateAsync, error } = useMutation({
    mutationFn: updateMigrationWorkflow,
    onSuccess: (_, workflow) => {
      onSuccess(workflow);
      queryClient.invalidateQueries({ queryKey: [MigrationWorkflowsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, mutateAsync, isPending, error };
};

export const useDeleteMigrationWorkflowMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: deleteMigrationWorkflow,
    onSuccess: (_, id) => {
      onSuccess(id);
      queryClient.invalidateQueries({ queryKey: [MigrationWorkflowsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries({ queryKey: [MigrationWorkflowsQueryKey] });
    },
  });
  return { mutate, isPending, error };
};

/**
 * Fetches the run history for a workflow. Automatically polls while any run
 * is non-terminal (Pending/Running/AwaitingApproval) so the mock, time-based
 * run simulation animates in the UI, and stops polling once every run has
 * settled into a terminal state.
 */
export const useFetchWorkflowRuns = (workflowId?: number) => {
  const {
    data: runs,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useQuery<WorkflowRun[]>({
    queryKey: [WorkflowRunsQueryKey, workflowId],
    queryFn: () => getWorkflowRuns(workflowId as number),
    enabled: !!workflowId,
    onError: (err) => console.log(err),
    refetchInterval: (data) =>
      data?.some(isRunNonTerminal) ? 1500 : false,
  });

  return {
    runs: runs || [],
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useFetchAllWorkflowRuns = () => {
  const {
    data: runs,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useQuery<WorkflowRun[]>({
    queryKey: [WorkflowRunsQueryKey, "all"],
    queryFn: getAllWorkflowRuns,
    onError: (err) => console.log(err),
    refetchInterval: (data) =>
      data?.some(isRunNonTerminal) ? 1500 : false,
  });

  return {
    runs: runs || [],
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useStartWorkflowRunMutation = (
  onSuccess: (run: WorkflowRun) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, mutateAsync, error } = useMutation({
    mutationFn: (payload: {
      workflowId: number;
      applications: Ref[];
      targetBranch: string;
    }) => startWorkflowRun(payload),
    onSuccess: (run) => {
      onSuccess(run);
      queryClient.invalidateQueries({ queryKey: [WorkflowRunsQueryKey] });
      queryClient.invalidateQueries({ queryKey: [MigrationWorkflowsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, mutateAsync, isPending, error };
};

export const useApproveStageMutation = (
  onSuccess: (run: WorkflowRun) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: approveWorkflowStage,
    onSuccess: (run) => {
      onSuccess(run);
      queryClient.invalidateQueries({ queryKey: [WorkflowRunsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, isPending, error };
};

export const useSendStageMessageMutation = (
  onSuccess: (run: WorkflowRun) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: sendStageRunMessage,
    onSuccess: (run) => {
      onSuccess(run);
      queryClient.invalidateQueries({ queryKey: [WorkflowRunsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, isPending, error };
};

export const useFetchKnowledgeBaseEntries = (workflowId?: number) => {
  const {
    data: entries,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useQuery<KnowledgeBaseEntry[]>({
    queryKey: [KnowledgeBaseQueryKey, workflowId],
    queryFn: () => getKnowledgeBaseEntries(workflowId as number),
    enabled: !!workflowId,
    onError: (err) => console.log(err),
  });

  return {
    entries: entries || [],
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useCreateKnowledgeBaseEntryMutation = (
  onSuccess: (entry: KnowledgeBaseEntry) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: createKnowledgeBaseEntry,
    onSuccess: (entry) => {
      onSuccess(entry);
      queryClient.invalidateQueries({ queryKey: [KnowledgeBaseQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, isPending, error };
};
