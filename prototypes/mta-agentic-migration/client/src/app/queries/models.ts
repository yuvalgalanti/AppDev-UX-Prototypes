import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { Model, New } from "@app/api/models";
import {
  createModel,
  deleteModel,
  getModels,
  setDefaultModel,
  updateModel,
} from "@app/api/rest";

export const ModelsQueryKey = "models";

export const useFetchModels = () => {
  const {
    data: models,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useQuery<Model[]>({
    queryKey: [ModelsQueryKey],
    queryFn: getModels,
    onError: (err) => console.log(err),
  });

  return {
    models: models || [],
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useCreateModelMutation = (
  onSuccess: (model: Model) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, mutateAsync, error } = useMutation({
    mutationFn: (obj: New<Model>) => createModel(obj),
    onSuccess: (model) => {
      onSuccess(model);
      queryClient.invalidateQueries({ queryKey: [ModelsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, mutateAsync, isPending, error };
};

export const useUpdateModelMutation = (
  onSuccess: (model: Model) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: updateModel,
    onSuccess: (_, model) => {
      onSuccess(model);
      queryClient.invalidateQueries({ queryKey: [ModelsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, isPending, error };
};

export const useDeleteModelMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: deleteModel,
    onSuccess: (_, id) => {
      onSuccess(id);
      queryClient.invalidateQueries({ queryKey: [ModelsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries({ queryKey: [ModelsQueryKey] });
    },
  });
  return { mutate, isPending, error };
};

export const useSetDefaultModelMutation = (
  onSuccess: (model: Model) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: (id: number) => setDefaultModel(id),
    onSuccess: (model) => {
      onSuccess(model);
      queryClient.invalidateQueries({ queryKey: [ModelsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, isPending, error };
};
