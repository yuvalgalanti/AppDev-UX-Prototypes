import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { object, string } from "yup";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Form,
} from "@patternfly/react-core";

import { WorkflowRun } from "@app/api/models";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useCreateKnowledgeBaseEntryMutation } from "@app/queries/migration-workflows";
import { getAxiosErrorMessage } from "@app/utils/utils";

interface FormValues {
  title: string;
  content: string;
  tagsText: string;
  runId: string;
}

export interface KnowledgeBaseEntryFormProps {
  workflowId: number;
  runs: WorkflowRun[];
  defaultRunId?: number;
  onClose: () => void;
}

export const KnowledgeBaseEntryForm: React.FC<KnowledgeBaseEntryFormProps> = ({
  workflowId,
  runs,
  defaultRunId,
  onClose,
}) => {
  const { pushNotification } = React.useContext(NotificationsContext);

  const onSuccess = () => {
    pushNotification({ title: "Knowledge base entry saved", variant: "success" });
    onClose();
  };
  const onError = (error: AxiosError) => {
    pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
  };
  const { mutate: createEntry } = useCreateKnowledgeBaseEntryMutation(
    onSuccess,
    onError
  );

  const runOptions = [
    { value: "none", label: "Not linked to a specific run" },
    ...runs.map((run) => ({
      value: String(run.id),
      label: `${run.name} — ${new Date(run.startedAt).toLocaleString()}`,
    })),
  ];

  const validationSchema = object().shape({
    title: string().trim().required("A title is required.").max(120),
    content: string().trim().required("Add the lesson learned."),
    tagsText: string(),
    runId: string(),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      title: "",
      content: "",
      tagsText: "",
      runId: defaultRunId ? String(defaultRunId) : "none",
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onSubmit = (values: FormValues) => {
    createEntry({
      workflowId,
      title: values.title.trim(),
      content: values.content.trim(),
      tags: values.tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      runId: values.runId === "none" ? undefined : Number(values.runId),
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <HookFormPFTextInput
        control={control}
        name="title"
        label="Title"
        fieldId="kb-entry-title"
        isRequired
      />
      <HookFormPFTextArea
        control={control}
        name="content"
        label="Lesson learned"
        fieldId="kb-entry-content"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="tagsText"
        label="Tags"
        fieldId="kb-entry-tags"
        helperText="Comma-separated, e.g. quarkus, dependencies"
      />
      <HookFormPFGroupController
        control={control}
        name="runId"
        label="Linked run"
        fieldId="kb-entry-run"
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            toggleId="kb-entry-run-toggle"
            toggleAriaLabel="Linked run select"
            ariaLabel={name}
            isFullWidth
            value={value}
            options={runOptions}
            onSelect={(selection) => onChange(selection ?? "none")}
          />
        )}
      />
      <ActionGroup>
        <Button
          type="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || !isDirty}
        >
          Save entry
        </Button>
        <Button type="button" variant={ButtonVariant.link} onClick={onClose}>
          Cancel
        </Button>
      </ActionGroup>
    </Form>
  );
};
