import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError } from "axios";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { array, boolean, number, object, string } from "yup";
import {
  Button,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Form,
  FormGroup,
  Modal,
  Switch,
  TextArea,
  TextInput,
  Wizard,
  WizardHeader,
  WizardStep,
} from "@patternfly/react-core";

import { Agent, MigrationWorkflow, New } from "@app/api/models";
import { MultiSelect } from "@app/components/FilterToolbar/components/MultiSelect";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useFetchAgents } from "@app/queries/agents";
import { useFetchArchetypes } from "@app/queries/archetypes";
import {
  useCreateMigrationWorkflowMutation,
  useUpdateMigrationWorkflowMutation,
} from "@app/queries/migration-workflows";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { StageListField } from "./components/stage-list-field";
import { WorkflowWizardFormValues } from "./types";

const blankStage = (): WorkflowWizardFormValues["stages"][number] => ({
  name: "",
  description: "",
  agentId: "",
  requiresApproval: false,
});

const validationSchema = object().shape({
  name: string()
    .trim()
    .required("A plan name is required.")
    .min(3, "Must be at least 3 characters.")
    .max(120, "Must be 120 characters or fewer."),
  description: string().trim().max(500, "Must be 500 characters or fewer."),
  archetypeId: number()
    .typeError("Select an archetype for this plan.")
    .required("Select an archetype for this plan."),
  targetProfileIds: array().of(number()),
  saveLessonsLearned: boolean(),
  autoCreatePR: boolean(),
  stages: array()
    .of(
      object().shape({
        name: string().trim().required("A stage name is required."),
        description: string(),
        agentId: number()
          .typeError("Select an agent for this stage.")
          .required("Select an agent for this stage."),
        requiresApproval: boolean(),
      })
    )
    .min(1, "Add at least one stage."),
});

export interface MigrationWorkflowWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (workflow: MigrationWorkflow) => void;
  workflow?: MigrationWorkflow | null;
  seedFrom?: MigrationWorkflow | null;
}

export const MigrationWorkflowWizard: React.FC<MigrationWorkflowWizardProps> = ({
  isOpen,
  onClose,
  onSaved,
  workflow = null,
  seedFrom = null,
}) => {
  const { pushNotification } = React.useContext(NotificationsContext);
  const source = workflow ?? seedFrom;

  const { agents } = useFetchAgents();
  const activeAgents: Agent[] = agents.filter((a) => a.status === "Active");
  const { archetypes } = useFetchArchetypes();

  const archetypeOptions = archetypes.map((archetype) => ({
    value: String(archetype.id),
    label: archetype.name,
  }));

  const onCreateOrUpdateSuccess = (savedWorkflow: MigrationWorkflow) => {
    pushNotification({
      title: workflow
        ? `Migration plan "${savedWorkflow.name}" saved`
        : `Migration plan "${savedWorkflow.name}" created`,
      variant: "success",
    });
    onSaved(savedWorkflow);
  };
  const onCreateOrUpdateError = (error: AxiosError) => {
    pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
  };

  const { mutateAsync: createWorkflow } = useCreateMigrationWorkflowMutation(
    onCreateOrUpdateSuccess,
    onCreateOrUpdateError
  );
  const { mutateAsync: updateWorkflow } = useUpdateMigrationWorkflowMutation(
    onCreateOrUpdateSuccess,
    onCreateOrUpdateError
  );

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<WorkflowWizardFormValues>({
    defaultValues: {
      name: workflow
        ? workflow.name
        : seedFrom
          ? `${seedFrom.name} (copy)`
          : "",
      description: source?.goal || "",
      archetypeId: source?.archetypeId ?? "",
      targetProfileIds: source?.targetProfileIds ?? [],
      saveLessonsLearned: source?.saveLessonsLearned ?? true,
      autoCreatePR: source?.autoCreatePR ?? false,
      stages: source?.stages.length
        ? source.stages.map((stage) => ({
            name: stage.name,
            description: stage.description || "",
            agentId: stage.agentId,
            requiresApproval: stage.requiresApproval,
          }))
        : [blankStage()],
    },
    resolver: yupResolver(validationSchema),
    mode: "onChange",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "stages",
    keyName: "key",
  });

  const name = useWatch({ control, name: "name" });
  const description = useWatch({ control, name: "description" });
  const archetypeId = useWatch({ control, name: "archetypeId" });
  const targetProfileIds = useWatch({ control, name: "targetProfileIds" });
  const stagesValues = useWatch({ control, name: "stages" });
  const saveLessonsLearned = useWatch({ control, name: "saveLessonsLearned" });
  const autoCreatePR = useWatch({ control, name: "autoCreatePR" });

  const selectedArchetype = archetypes.find((a) => a.id === archetypeId);
  const targetProfileOptions = (selectedArchetype?.profiles ?? []).map(
    (profile) => ({
      value: String(profile.id),
      label: profile.name,
    })
  );

  const isDetailsStepValid =
    !errors.name && !errors.archetypeId && !!name?.trim() && archetypeId !== "";
  const isStagesStepValid =
    stagesValues.length > 0 &&
    stagesValues.every((stage) => !!stage.name?.trim() && stage.agentId !== "");

  const onArchetypeChange = (selection: string) => {
    const newArchetypeId = selection ? Number(selection) : "";
    setValue("archetypeId", newArchetypeId, { shouldValidate: true });
    // Reset target profiles when the archetype changes since they belong to
    // the previously selected archetype.
    setValue("targetProfileIds", []);
  };

  const onSubmit = async (values: WorkflowWizardFormValues) => {
    const payload: New<MigrationWorkflow> = {
      name: values.name.trim(),
      goal: values.description.trim(),
      archetypeId: values.archetypeId === "" ? undefined : values.archetypeId,
      targetProfileIds: values.targetProfileIds,
      saveLessonsLearned: values.saveLessonsLearned,
      autoCreatePR: values.autoCreatePR,
      isTemplate: false,
      owner: workflow?.owner || { id: 1, name: "Demo User" },
      createdAt: workflow?.createdAt || new Date().toISOString(),
      stages: values.stages.map((stage, index) => ({
        id: index + 1,
        name: stage.name.trim(),
        description: stage.description?.trim(),
        agentId: Number(stage.agentId),
        requiresApproval: stage.requiresApproval,
      })),
    };

    if (workflow) {
      await updateWorkflow({ id: workflow.id, ...payload });
    } else {
      await createWorkflow(payload);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      aria-label="Migration workflow wizard modal"
      onEscapePress={onClose}
      variant="large"
    >
      <Wizard
        onClose={onClose}
        header={
          <WizardHeader
            onClose={onClose}
            title={workflow ? "Edit Plan" : "Create Plan"}
            description={
              seedFrom && !workflow ? `Starting from "${seedFrom.name}"` : undefined
            }
          />
        }
      >
        <WizardStep
          key="step-plan-details"
          id="step-plan-details"
          name="Plan details"
          footer={{ isNextDisabled: !isDetailsStepValid }}
        >
          <Form>
            <FormGroup label="Name" isRequired fieldId="workflow-name">
              <Controller
                control={control}
                name="name"
                render={({ field }) => (
                  <TextInput
                    id="workflow-name"
                    placeholder="For example, Java EE to Quarkus"
                    value={field.value}
                    onChange={(_, value) => field.onChange(value)}
                  />
                )}
              />
            </FormGroup>
            <FormGroup label="Description" fieldId="workflow-description">
              <Controller
                control={control}
                name="description"
                render={({ field }) => (
                  <TextArea
                    id="workflow-description"
                    value={field.value}
                    onChange={(_, value) => field.onChange(value)}
                    autoResize
                    placeholder="Describe the goal of this Plan..."
                  />
                )}
              />
            </FormGroup>
            <FormGroup label="Archetype" isRequired fieldId="workflow-archetype">
              <Controller
                control={control}
                name="archetypeId"
                render={({ field }) => (
                  <SimpleSelect
                    toggleId="workflow-archetype-toggle"
                    toggleAriaLabel="Archetype select"
                    ariaLabel="Archetype"
                    isFullWidth
                    placeholderText="Select an archetype"
                    value={field.value === "" ? undefined : String(field.value)}
                    options={archetypeOptions}
                    onSelect={(selection) => onArchetypeChange(selection ?? "")}
                  />
                )}
              />
            </FormGroup>
            <FormGroup
              label="Target profiles"
              fieldId="workflow-target-profiles"
            >
              <Controller
                control={control}
                name="targetProfileIds"
                render={({ field }) => (
                  <MultiSelect
                    toggleId="workflow-target-profiles-toggle"
                    toggleAriaLabel="Target profiles select"
                    ariaLabel="Target profiles"
                    isFullWidth
                    isDisabled={archetypeId === ""}
                    hasCheckbox
                    hasChips
                    placeholderText="Select target profiles"
                    values={field.value.map(String)}
                    options={targetProfileOptions}
                    onSelect={(selection) => {
                      if (!selection) return;
                      const id = Number(selection);
                      const exists = field.value.includes(id);
                      field.onChange(
                        exists
                          ? field.value.filter((v) => v !== id)
                          : [...field.value, id]
                      );
                    }}
                    onClear={() => field.onChange([])}
                  />
                )}
              />
            </FormGroup>
          </Form>
        </WizardStep>

        <WizardStep
          key="step-stages"
          id="step-stages"
          name="Stages"
          footer={{ isNextDisabled: !isStagesStepValid }}
        >
          <Content component="p">
            Build the workflow as an ordered list of stages. Each stage
            delegates its work to an agent, and can optionally require human
            approval before the workflow continues.
          </Content>
          <StageListField
            control={control}
            fields={fields}
            remove={remove}
            agents={activeAgents}
          />
          <Button
            variant="link"
            onClick={() => append(blankStage())}
            style={{ marginTop: "var(--pf-t--global--spacer--md)" }}
          >
            Add stage
          </Button>
          <div style={{ marginTop: "var(--pf-t--global--spacer--lg)" }}>
            <Controller
              control={control}
              name="saveLessonsLearned"
              render={({ field }) => (
                <Switch
                  id="workflow-save-lessons"
                  label={
                    field.value
                      ? "Save lessons learned to knowledge base: On"
                      : "Save lessons learned to knowledge base: Off"
                  }
                  isChecked={field.value}
                  onChange={(_, checked) => field.onChange(checked)}
                />
              )}
            />
          </div>
          <div style={{ marginTop: "var(--pf-t--global--spacer--sm)" }}>
            <Controller
              control={control}
              name="autoCreatePR"
              render={({ field }) => (
                <Switch
                  id="workflow-auto-pr"
                  label={
                    field.value
                      ? "Automatically create pull request: On"
                      : "Automatically create pull request: Off"
                  }
                  isChecked={field.value}
                  onChange={(_, checked) => field.onChange(checked)}
                />
              )}
            />
          </div>
        </WizardStep>

        <WizardStep
          key="step-review"
          id="step-review"
          name="Review"
          footer={{
            nextButtonText: workflow ? "Save" : "Create",
            isNextDisabled: !isDetailsStepValid || !isStagesStepValid,
            onNext: handleSubmit(onSubmit),
          }}
        >
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>Name</DescriptionListTerm>
              <DescriptionListDescription>{name}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Description</DescriptionListTerm>
              <DescriptionListDescription>
                {description || <em>None</em>}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Archetype</DescriptionListTerm>
              <DescriptionListDescription>
                {selectedArchetype?.name ?? <em>None selected</em>}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Target profiles</DescriptionListTerm>
              <DescriptionListDescription>
                {targetProfileIds.length > 0 ? (
                  targetProfileOptions
                    .filter((opt) => targetProfileIds.includes(Number(opt.value)))
                    .map((opt) => opt.label)
                    .join(", ")
                ) : (
                  <em>None selected</em>
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Save lessons learned</DescriptionListTerm>
              <DescriptionListDescription>
                {saveLessonsLearned ? "Yes" : "No"}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Auto-create PR</DescriptionListTerm>
              <DescriptionListDescription>
                {autoCreatePR ? "Yes" : "No"}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Stages</DescriptionListTerm>
              <DescriptionListDescription>
                <ol>
                  {stagesValues.map((stage, index) => {
                    const agent = activeAgents.find(
                      (a) => a.id === Number(stage.agentId)
                    );
                    return (
                      <li key={index}>
                        <strong>{stage.name || `Stage ${index + 1}`}</strong>
                        {" — "}
                        {agent?.name ?? "No agent selected"}
                        {stage.requiresApproval ? " (requires approval)" : ""}
                      </li>
                    );
                  })}
                </ol>
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </WizardStep>
      </Wizard>
    </Modal>
  );
};
