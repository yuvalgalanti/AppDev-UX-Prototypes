import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError } from "axios";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { array, mixed, object, string } from "yup";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Content,
  Divider,
  Flex,
  FlexItem,
  FormGroup,
  Form,
  Switch,
  TextInput,
} from "@patternfly/react-core";
import { TrashIcon } from "@patternfly/react-icons";

import { Agent, AgentParameterType, AgentRole, New } from "@app/api/models";
import { MultiSelect } from "@app/components/FilterToolbar/components/MultiSelect";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";
import {
  HookFormPFGroupController,
  HookFormPFTextArea,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useCreateAgentMutation,
  useFetchAgents,
  useUpdateAgentMutation,
} from "@app/queries/agents";
import { useFetchModels } from "@app/queries/models";
import { useFetchSkillCollections } from "@app/queries/skill-collections";
import { duplicateNameCheck } from "@app/utils/utils";

import {
  AGENT_IMAGES,
  AGENT_MCP_TOOLS,
  AGENT_ROLES,
  AGENT_SKILLS,
} from "../agent-catalog";

const PARAMETER_TYPES: AgentParameterType[] = ["string", "number", "boolean"];

interface ParameterFormValue {
  name: string;
  type: AgentParameterType;
  description: string;
  defaultValue: string;
}

interface FormValues {
  name: string;
  description: string;
  role: AgentRole;
  image: string;
  model: string;
  skills: string[];
  skillCollections: string[];
  mcpTools: string[];
  prompt: string;
  capabilities: string;
  parameters: ParameterFormValue[];
  isActive: boolean;
}

const blankParameter = (): ParameterFormValue => ({
  name: "",
  type: "string",
  description: "",
  defaultValue: "",
});

export interface AgentFormProps {
  agent: Agent | null;
  onClose: () => void;
}

export const AgentForm: React.FC<AgentFormProps> = ({ agent, onClose }) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const { agents } = useFetchAgents();
  const { models } = useFetchModels();
  const { skillCollections } = useFetchSkillCollections();

  const onCreateOrUpdateSuccess = (data: Agent) => {
    pushNotification({
      title: t(agent ? "toastr.success.saveWhat" : "toastr.success.createWhat", {
        type: "agent",
        what: data.name,
      }),
      variant: "success",
    });
    onClose();
  };

  const onCreateOrUpdateError = (_error: AxiosError) => {
    pushNotification({
      title: t(agent ? "toastr.fail.save" : "toastr.fail.create", {
        type: "agent",
      }),
      variant: "danger",
    });
  };

  const { mutate: createAgent } = useCreateAgentMutation(
    onCreateOrUpdateSuccess,
    onCreateOrUpdateError
  );
  const { mutate: updateAgent } = useUpdateAgentMutation(
    onCreateOrUpdateSuccess,
    onCreateOrUpdateError
  );

  const roleOptions = AGENT_ROLES.map((role) => ({ value: role, label: role }));
  const imageOptions = AGENT_IMAGES.map((img) => ({
    value: img.value,
    label: img.label,
  }));
  // Only Models with a Verified connection may be assigned to an Agent. If
  // the Agent being edited already references a Model that is no longer
  // Verified, keep it selectable so editing the Agent doesn't silently drop
  // its current selection.
  const verifiedModels = models.filter((m) => m.connectionStatus === "Verified");
  const selectableModels = verifiedModels.some((m) => m.modelId === agent?.model)
    ? verifiedModels
    : [
        ...verifiedModels,
        ...models.filter((m) => m.modelId === agent?.model),
      ];
  const modelOptions = selectableModels.map((model) => ({
    value: model.modelId,
    label:
      model.connectionStatus === "Verified"
        ? `${model.name} (${model.provider})`
        : `${model.name} (${model.provider}) — ${model.connectionStatus}`,
  }));
  const skillOptions = AGENT_SKILLS.map((skill) => ({ value: skill, label: skill }));
  const skillCollectionOptions = skillCollections.map((collection) => ({
    value: collection.name,
    label: collection.name,
  }));
  const mcpToolOptions = AGENT_MCP_TOOLS.map((tool) => ({ value: tool, label: tool }));
  const parameterTypeOptions = PARAMETER_TYPES.map((type) => ({
    value: type,
    label: type.charAt(0).toUpperCase() + type.slice(1),
  }));

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 }))
      .test(
        "Duplicate name",
        "An agent with this name already exists. Use a different name.",
        (value) => duplicateNameCheck(agents, agent || null, value || "")
      ),
    description: string().trim(),
    prompt: string()
      .trim()
      .max(2000, t("validation.maxLength", { length: 2000 })),
    role: string().required(t("validation.required")),
    image: string().required(t("validation.required")),
    model: string().required(t("validation.required")),
    skills: array().of(string()),
    skillCollections: array().of(string()),
    mcpTools: array().of(string()),
    capabilities: string(),
    parameters: array().of(
      object().shape({
        name: string().trim().required(t("validation.required")),
        type: mixed<AgentParameterType>().oneOf(PARAMETER_TYPES).required(),
        description: string(),
        defaultValue: string(),
      })
    ),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      name: agent?.name || "",
      description: agent?.description || "",
      role: agent?.role || "Code Analysis",
      image: agent?.image || AGENT_IMAGES[0].value,
      model: agent?.model || verifiedModels[0]?.modelId || "",
      skills: agent?.skills || [],
      skillCollections: agent?.skillCollections || [],
      mcpTools: agent?.mcpTools || [],
      prompt: agent?.prompt || "",
      capabilities: (agent?.capabilities || []).join("\n"),
      parameters: agent?.parameters?.length
        ? agent.parameters.map((param) => ({
            name: param.name,
            type: param.type,
            description: param.description || "",
            defaultValue: param.defaultValue || "",
          }))
        : [],
      isActive: agent ? agent.status === "Active" : true,
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "parameters",
    keyName: "key",
  });

  const onSubmit = (formValues: FormValues) => {
    const payload: New<Agent> = {
      name: formValues.name.trim(),
      description: formValues.description.trim() || undefined,
      prompt: formValues.prompt.trim(),
      role: formValues.role,
      image: formValues.image,
      model: formValues.model,
      skills: formValues.skills,
      skillCollections: formValues.skillCollections,
      mcpTools: formValues.mcpTools,
      capabilities: formValues.capabilities
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      parameters: formValues.parameters.map((param) => ({
        name: param.name.trim(),
        type: param.type,
        description: param.description?.trim() || undefined,
        defaultValue: param.defaultValue?.trim() || undefined,
      })),
      status: formValues.isActive ? "Active" : "Inactive",
      createdAt: agent?.createdAt || new Date().toISOString(),
    };

    if (agent) {
      updateAgent({ id: agent.id, ...payload });
    } else {
      createAgent(payload);
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
        fieldId="agent-name"
        isRequired
      />
      <HookFormPFTextArea
        control={control}
        name="description"
        label="Description"
        fieldId="agent-description"
      />
      <Flex gap={{ default: "gapMd" }}>
        <FlexItem grow={{ default: "grow" }}>
          <HookFormPFGroupController
            control={control}
            name="role"
            label="Role"
            fieldId="agent-role-select"
            isRequired
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                toggleId="agent-role-select-toggle"
                toggleAriaLabel="Agent role select dropdown toggle"
                ariaLabel={name}
                value={value}
                options={roleOptions}
                onSelect={(selection) => onChange(selection ?? "")}
              />
            )}
          />
        </FlexItem>
        <FlexItem grow={{ default: "grow" }}>
          <HookFormPFGroupController
            control={control}
            name="image"
            label="Image"
            fieldId="agent-image-select"
            isRequired
            renderInput={({ field: { value, name, onChange } }) => (
              <SimpleSelect
                toggleId="agent-image-select-toggle"
                toggleAriaLabel="Agent image select dropdown toggle"
                ariaLabel={name}
                value={value}
                options={imageOptions}
                onSelect={(selection) => onChange(selection ?? "")}
              />
            )}
          />
        </FlexItem>
      </Flex>
      <HookFormPFGroupController
        control={control}
        name="model"
        label="Model"
        fieldId="agent-model-select"
        isRequired
        helperText="Select the approved Model this Agent uses."
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            toggleId="agent-model-select-toggle"
            toggleAriaLabel="Agent model select dropdown toggle"
            ariaLabel={name}
            placeholderText="Select a Model..."
            value={value}
            options={modelOptions}
            onSelect={(selection) => onChange(selection ?? "")}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="skills"
        label="Skills"
        fieldId="agent-skills-select"
        renderInput={({ field: { value, name, onChange } }) => (
          <MultiSelect
            toggleId="agent-skills-select-toggle"
            toggleAriaLabel="Agent skills select dropdown toggle"
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
      <HookFormPFGroupController
        control={control}
        name="skillCollections"
        label="Skill collections"
        fieldId="agent-skill-collections-select"
        helperText="Skill collections bundle related Skills together."
        renderInput={({ field: { value, name, onChange } }) => (
          <MultiSelect
            toggleId="agent-skill-collections-select-toggle"
            toggleAriaLabel="Agent skill collections select dropdown toggle"
            aria-label={name}
            placeholderText="Add Skill collection"
            values={value}
            hasChips
            hasCheckbox
            options={skillCollectionOptions}
            onSelect={(selection) => {
              if (!selection) return;
              toggleSelection(value, selection, onChange);
            }}
            onClear={() => onChange([])}
          />
        )}
      />
      <HookFormPFGroupController
        control={control}
        name="mcpTools"
        label="MCP tools"
        fieldId="agent-mcp-tools-select"
        renderInput={({ field: { value, name, onChange } }) => (
          <MultiSelect
            toggleId="agent-mcp-tools-select-toggle"
            toggleAriaLabel="Agent MCP tools select dropdown toggle"
            aria-label={name}
            placeholderText="Select MCP tools..."
            values={value}
            hasChips
            hasCheckbox
            options={mcpToolOptions}
            onSelect={(selection) => {
              if (!selection) return;
              toggleSelection(value, selection, onChange);
            }}
            onClear={() => onChange([])}
          />
        )}
      />
      <HookFormPFTextArea
        control={control}
        name="prompt"
        label="Persona prompt"
        fieldId="agent-prompt"
        helperText="System prompt that defines the Agent's behavior and expertise."
      />
      <HookFormPFTextArea
        control={control}
        name="capabilities"
        label="Capabilities"
        fieldId="agent-capabilities"
        helperText="Enter one capability per line."
        rows={4}
      />

      <FormGroup label="Parameters" fieldId="agent-parameters">
        <Content component="small">
          Declare the typed inputs this Agent accepts.
        </Content>
      </FormGroup>
      {fields.map((field, index) => (
        <React.Fragment key={field.key}>
          {index > 0 && <Divider />}
          <Flex gap={{ default: "gapMd" }} alignItems={{ default: "alignItemsFlexEnd" }}>
            <FlexItem grow={{ default: "grow" }}>
              <Controller
                control={control}
                name={`parameters.${index}.name`}
                render={({ field: nameField }) => (
                  <FormGroup
                    label="Name"
                    isRequired
                    fieldId={`agent-parameter-${index}-name`}
                  >
                    <TextInput
                      id={`agent-parameter-${index}-name`}
                      value={nameField.value}
                      onChange={(_, value) => nameField.onChange(value)}
                    />
                  </FormGroup>
                )}
              />
            </FlexItem>
            <FlexItem>
              <Controller
                control={control}
                name={`parameters.${index}.type`}
                render={({ field: typeField }) => (
                  <FormGroup
                    label="Type"
                    fieldId={`agent-parameter-${index}-type`}
                  >
                    <SimpleSelect
                      toggleId={`agent-parameter-${index}-type-toggle`}
                      toggleAriaLabel="Parameter type select"
                      ariaLabel="Parameter type"
                      value={typeField.value}
                      options={parameterTypeOptions}
                      onSelect={(selection) =>
                        typeField.onChange(
                          (selection as AgentParameterType) ?? "string"
                        )
                      }
                    />
                  </FormGroup>
                )}
              />
            </FlexItem>
            <FlexItem>
              <Button
                variant="plain"
                aria-label="Remove Parameter"
                icon={<TrashIcon />}
                onClick={() => remove(index)}
              />
            </FlexItem>
          </Flex>
          <Flex gap={{ default: "gapMd" }}>
            <FlexItem grow={{ default: "grow" }}>
              <Controller
                control={control}
                name={`parameters.${index}.description`}
                render={({ field: descField }) => (
                  <FormGroup
                    label="Description"
                    fieldId={`agent-parameter-${index}-description`}
                  >
                    <TextInput
                      id={`agent-parameter-${index}-description`}
                      value={descField.value}
                      onChange={(_, value) => descField.onChange(value)}
                    />
                  </FormGroup>
                )}
              />
            </FlexItem>
            <FlexItem grow={{ default: "grow" }}>
              <Controller
                control={control}
                name={`parameters.${index}.defaultValue`}
                render={({ field: defField }) => (
                  <FormGroup
                    label="Default value"
                    fieldId={`agent-parameter-${index}-default`}
                  >
                    <TextInput
                      id={`agent-parameter-${index}-default`}
                      value={defField.value}
                      onChange={(_, value) => defField.onChange(value)}
                    />
                  </FormGroup>
                )}
              />
            </FlexItem>
          </Flex>
        </React.Fragment>
      ))}
      <Button variant="link" onClick={() => append(blankParameter())}>
        Add Parameter
      </Button>

      <Controller
        control={control}
        name="isActive"
        render={({ field: { onChange, value, name } }) => (
          <Switch
            id="agent-status-switch"
            name={name}
            label={value ? "Active" : "Inactive"}
            isChecked={value}
            onChange={(_, checked) => onChange(checked)}
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
          {!agent ? t("actions.create") : t("actions.save")}
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
