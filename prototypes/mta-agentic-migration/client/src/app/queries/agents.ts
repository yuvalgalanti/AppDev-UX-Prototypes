import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { Agent, New } from "@app/api/models";
import {
  createAgent,
  deleteAgent,
  getAgentById,
  getAgents,
  updateAgent,
} from "@app/api/rest";

export const AgentsQueryKey = "agents";

export const useFetchAgents = () => {
  const {
    data: agents,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useQuery<Agent[]>({
    queryKey: [AgentsQueryKey],
    queryFn: getAgents,
    onError: (err) => console.log(err),
  });

  return {
    agents: agents || [],
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useFetchAgentById = (id?: number | string) => {
  const {
    data: agent,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useQuery<Agent>({
    queryKey: [AgentsQueryKey, id],
    queryFn: () => getAgentById(id as number | string),
    enabled: !!id,
    onError: (err) => console.log(err),
  });

  return {
    agent,
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useCreateAgentMutation = (
  onSuccess: (agent: Agent) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, mutateAsync, error } = useMutation({
    mutationFn: (obj: New<Agent>) => createAgent(obj),
    onSuccess: (agent) => {
      onSuccess(agent);
      queryClient.invalidateQueries({ queryKey: [AgentsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, mutateAsync, isPending, error };
};

export const useUpdateAgentMutation = (
  onSuccess: (agent: Agent) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: updateAgent,
    onSuccess: (_, agent) => {
      onSuccess(agent);
      queryClient.invalidateQueries({ queryKey: [AgentsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, isPending, error };
};

export const useDeleteAgentMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: deleteAgent,
    onSuccess: (_, id) => {
      onSuccess(id);
      queryClient.invalidateQueries({ queryKey: [AgentsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries({ queryKey: [AgentsQueryKey] });
    },
  });
  return { mutate, isPending, error };
};
