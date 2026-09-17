import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { New, SkillCollection } from "@app/api/models";
import {
  createSkillCollection,
  deleteSkillCollection,
  getSkillCollections,
  updateSkillCollection,
} from "@app/api/rest";

export const SkillCollectionsQueryKey = "skillCollections";

export const useFetchSkillCollections = () => {
  const {
    data: skillCollections,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useQuery<SkillCollection[]>({
    queryKey: [SkillCollectionsQueryKey],
    queryFn: getSkillCollections,
    onError: (err) => console.log(err),
  });

  return {
    skillCollections: skillCollections || [],
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useCreateSkillCollectionMutation = (
  onSuccess: (skillCollection: SkillCollection) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, mutateAsync, error } = useMutation({
    mutationFn: (obj: New<SkillCollection>) => createSkillCollection(obj),
    onSuccess: (skillCollection) => {
      onSuccess(skillCollection);
      queryClient.invalidateQueries({ queryKey: [SkillCollectionsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, mutateAsync, isPending, error };
};

export const useUpdateSkillCollectionMutation = (
  onSuccess: (skillCollection: SkillCollection) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: updateSkillCollection,
    onSuccess: (_, skillCollection) => {
      onSuccess(skillCollection);
      queryClient.invalidateQueries({ queryKey: [SkillCollectionsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, isPending, error };
};

export const useDeleteSkillCollectionMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: deleteSkillCollection,
    onSuccess: (_, id) => {
      onSuccess(id);
      queryClient.invalidateQueries({ queryKey: [SkillCollectionsQueryKey] });
    },
    onError: (err: AxiosError) => {
      onError(err);
      queryClient.invalidateQueries({ queryKey: [SkillCollectionsQueryKey] });
    },
  });
  return { mutate, isPending, error };
};
