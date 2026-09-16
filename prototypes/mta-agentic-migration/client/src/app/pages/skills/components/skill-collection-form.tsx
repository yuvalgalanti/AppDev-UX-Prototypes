import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { array, number, object, string } from "yup";
import { ActionGroup, Button, ButtonVariant, Form } from "@patternfly/react-core";

import { New, SkillCollection } from "@app/api/models";
import { MultiSelect } from "@app/components/FilterToolbar/components/MultiSelect";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useCreateSkillCollectionMutation,
  useUpdateSkillCollectionMutation,
} from "@app/queries/skill-collections";
import { useFetchSkills } from "@app/queries/skills";
import { duplicateNameCheck } from "@app/utils/utils";

interface FormValues {
  name: string;
  description: string;
  skillIds: string[];
}

export interface SkillCollectionFormProps {
  skillCollection: SkillCollection | null;
  skillCollections: SkillCollection[];
  /** Pre-select these Skill ids when creating a new collection, e.g. from a bulk "Create collection" action. Ignored when editing. */
  initialSkillIds?: number[];
  onClose: () => void;
}

export const SkillCollectionForm: React.FC<SkillCollectionFormProps> = ({
  skillCollection,
  skillCollections,
  initialSkillIds,
  onClose,
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const { skills } = useFetchSkills();

  const skillOptions = skills.map((skill) => ({
    value: String(skill.id),
    label: skill.name,
  }));

  const onCreateOrUpdateSuccess = (data: SkillCollection) => {
    pushNotification({
      title: t(
        skillCollection ? "toastr.success.saveWhat" : "toastr.success.createWhat",
        { type: "skill collection", what: data.name }
      ),
      variant: "success",
    });
    onClose();
  };

  const onCreateOrUpdateError = (_error: AxiosError) => {
    pushNotification({
      title: t(skillCollection ? "toastr.fail.save" : "toastr.fail.create", {
        type: "skill collection",
      }),
      variant: "danger",
    });
  };

  const { mutate: createSkillCollection } = useCreateSkillCollectionMutation(
    onCreateOrUpdateSuccess,
    onCreateOrUpdateError
  );
  const { mutate: updateSkillCollection } = useUpdateSkillCollectionMutation(
    onCreateOrUpdateSuccess,
    onCreateOrUpdateError
  );

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .test(
        "Duplicate name",
        "A Skill collection with this name already exists. Use a different name.",
        (value) =>
          duplicateNameCheck(skillCollections, skillCollection || null, value || "")
      ),
    description: string(),
    skillIds: array().of(number()),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      name: skillCollection?.name || "",
      description: skillCollection?.description || "",
      skillIds: (skillCollection?.skillIds || initialSkillIds || []).map(String),
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onSubmit = (formValues: FormValues) => {
    const payload: New<SkillCollection> = {
      name: formValues.name.trim(),
      description: formValues.description.trim() || undefined,
      skillIds: formValues.skillIds.map(Number),
      createdAt: skillCollection?.createdAt || new Date().toISOString(),
    };

    if (skillCollection) {
      updateSkillCollection({ id: skillCollection.id, ...payload });
    } else {
      createSkillCollection(payload);
    }
  };

  const toggleSelection = (
    current: string[],
    value: string,
    onChange: (next: string[]) => void
  ) => {
    if (current.includes(value)) {
      onChange(current.filter((item) => item !== value));
    } else {
      onChange([...current, value]);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <HookFormPFTextInput
        control={control}
        name="name"
        label={t("terms.name")}
        fieldId="skill-collection-name"
        isRequired
      />
      <HookFormPFTextArea
        control={control}
        name="description"
        label="Description"
        fieldId="skill-collection-description"
      />
      <HookFormPFGroupController
        control={control}
        name="skillIds"
        label="Skills"
        fieldId="skill-collection-skills-select"
        helperText="Skills bundled together under this collection."
        renderInput={({ field: { value, name, onChange } }) => (
          <MultiSelect
            toggleId="skill-collection-skills-select-toggle"
            toggleAriaLabel="Skill collection skills select dropdown toggle"
            aria-label={name}
            placeholderText="Add a Skill..."
            values={value}
            hasChips
            hasCheckbox
            options={skillOptions}
            onSelect={(selection) => {
              if (!selection) return;
              toggleSelection(value, selection, onChange);
            }}
            onClear={() => onChange([])}
          />
        )}
      />
      <ActionGroup>
        <Button
          type="submit"
          id="submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!skillCollection ? t("actions.create") : t("actions.save")}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
