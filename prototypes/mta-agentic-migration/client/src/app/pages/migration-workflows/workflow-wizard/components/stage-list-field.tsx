import * as React from "react";
import {
  Control,
  Controller,
  FieldArrayWithId,
  UseFieldArrayRemove,
} from "react-hook-form";
import {
  Button,
  Card,
  CardBody,
  Content,
  Flex,
  FlexItem,
  FormGroup,
  Switch,
  TextArea,
  TextInput,
} from "@patternfly/react-core";
import { TrashIcon } from "@patternfly/react-icons";

import { Agent } from "@app/api/models";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";

import { WorkflowWizardFormValues } from "../types";

interface StageListFieldProps {
  control: Control<WorkflowWizardFormValues>;
  fields: FieldArrayWithId<WorkflowWizardFormValues, "stages", "key">[];
  remove: UseFieldArrayRemove;
  agents: Agent[];
}

export const StageListField: React.FC<StageListFieldProps> = ({
  control,
  fields,
  remove,
  agents,
}) => {
  const agentOptions = agents.map((agent) => ({
    value: String(agent.id),
    label: `${agent.name} (${agent.role})`,
  }));

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
      {fields.map((field, index) => (
        <StageRow
          key={field.key}
          index={index}
          control={control}
          agentOptions={agentOptions}
          agents={agents}
          onRemove={() => remove(index)}
          isRemoveDisabled={fields.length <= 1}
        />
      ))}
    </Flex>
  );
};

interface StageRowProps {
  index: number;
  control: Control<WorkflowWizardFormValues>;
  agentOptions: { value: string; label: string }[];
  agents: Agent[];
  onRemove: () => void;
  isRemoveDisabled: boolean;
}

const StageRow: React.FC<StageRowProps> = ({
  index,
  control,
  agentOptions,
  agents,
  onRemove,
  isRemoveDisabled,
}) => {
  const [selectedAgentId, setSelectedAgentId] = React.useState<string>("");

  const selectedAgent = agents.find((a) => String(a.id) === selectedAgentId);

  return (
    <Card isCompact>
      <CardBody>
        <Flex
          alignItems={{ default: "alignItemsFlexStart" }}
          justifyContent={{ default: "justifyContentSpaceBetween" }}
          gap={{ default: "gapMd" }}
        >
          <FlexItem grow={{ default: "grow" }}>
            <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
              <FormGroup
                label={`Stage ${index + 1} name`}
                isRequired
                fieldId={`stage-${index}-name`}
              >
                <Controller
                  control={control}
                  name={`stages.${index}.name`}
                  render={({ field }) => (
                    <TextInput
                      id={`stage-${index}-name`}
                      aria-label={`Stage ${index + 1} name`}
                      value={field.value}
                      onChange={(_, value) => field.onChange(value)}
                    />
                  )}
                />
              </FormGroup>
              <FormGroup
                label="Description"
                fieldId={`stage-${index}-description`}
              >
                <Controller
                  control={control}
                  name={`stages.${index}.description`}
                  render={({ field }) => (
                    <TextArea
                      id={`stage-${index}-description`}
                      aria-label={`Stage ${index + 1} description`}
                      value={field.value}
                      onChange={(_, value) => field.onChange(value)}
                      autoResize
                    />
                  )}
                />
              </FormGroup>
              <FormGroup
                label="Agent"
                isRequired
                fieldId={`stage-${index}-agent`}
              >
                <Controller
                  control={control}
                  name={`stages.${index}.agentId`}
                  render={({ field }) => {
                    if (field.value && String(field.value) !== selectedAgentId) {
                      setSelectedAgentId(String(field.value));
                    }
                    return (
                      <SimpleSelect
                        toggleId={`stage-${index}-agent-toggle`}
                        toggleAriaLabel={`Stage ${index + 1} agent`}
                        ariaLabel={`Stage ${index + 1} agent`}
                        value={field.value ? String(field.value) : undefined}
                        options={agentOptions}
                        onSelect={(selection) => {
                          field.onChange(selection ? Number(selection) : "");
                          setSelectedAgentId(selection ?? "");
                        }}
                      />
                    );
                  }}
                />
                {selectedAgent?.prompt && (
                  <Content
                    component="small"
                    style={{
                      marginTop: "var(--pf-t--global--spacer--xs)",
                      color: "var(--pf-t--global--color--200)",
                    }}
                  >
                    {selectedAgent.prompt}
                  </Content>
                )}
              </FormGroup>
              <Controller
                control={control}
                name={`stages.${index}.requiresApproval`}
                render={({ field }) => (
                  <Switch
                    id={`stage-${index}-requires-approval`}
                    label={
                      field.value
                        ? "Requires human approval before continuing"
                        : "Runs automatically without approval"
                    }
                    isChecked={field.value}
                    onChange={(_, checked) => field.onChange(checked)}
                  />
                )}
              />
            </Flex>
          </FlexItem>
          <FlexItem>
            <Button
              variant="plain"
              aria-label={`Remove stage ${index + 1}`}
              isDisabled={isRemoveDisabled}
              onClick={onRemove}
              icon={<TrashIcon />}
            />
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};
