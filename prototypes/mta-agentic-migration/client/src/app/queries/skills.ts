import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";

import { New, Skill } from "@app/api/models";
import {
  createSkill,
  deleteSkill,
  getSkills,
  updateSkill,
} from "@app/api/rest";

export const SkillsQueryKey = "skills";

export const useFetchSkills = () => {
  const {
    data: skills,
    isLoading,
    isSuccess,
    error,
    refetch,
  } = useQuery<Skill[]>({
    queryKey: [SkillsQueryKey],
    queryFn: getSkills,
    onError: (err) => console.log(err),
  });

  return {
    skills: skills || [],
    isFetching: isLoading,
    isSuccess,
    fetchError: error,
    refetch,
  };
};

export const useCreateSkillMutation = (
  onSuccess: (skill: Skill) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: (obj: New<Skill>) => createSkill(obj),
    onSuccess: (skill) => {
      onSuccess(skill);
      queryClient.invalidateQueries({ queryKey: [SkillsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, isPending, error };
};

export const useUpdateSkillMutation = (
  onSuccess: (skill: Skill) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: updateSkill,
    onSuccess: (_, skill) => {
      onSuccess(skill);
      queryClient.invalidateQueries({ queryKey: [SkillsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, isPending, error };
};

export const useDeleteSkillMutation = (
  onSuccess: (id: number) => void,
  onError: (err: AxiosError) => void
) => {
  const queryClient = useQueryClient();
  const { isPending, mutate, error } = useMutation({
    mutationFn: deleteSkill,
    onSuccess: (_, id) => {
      onSuccess(id);
      queryClient.invalidateQueries({ queryKey: [SkillsQueryKey] });
    },
    onError: (err: AxiosError) => onError(err),
  });
  return { mutate, isPending, error };
};
