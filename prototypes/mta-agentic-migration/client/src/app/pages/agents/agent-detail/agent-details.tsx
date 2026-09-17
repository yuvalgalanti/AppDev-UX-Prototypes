import * as React from "react";
import { AxiosError } from "axios";
import { Link, useHistory, useParams } from "react-router-dom";
import {
  Alert,
  AlertVariant,
  ButtonVariant,
  Card,
  CardBody,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  MenuToggle,
  MenuToggleElement,
  Modal,
  ModalBody,
  ModalHeader,
  PageSection,
  Tab,
  TabTitleText,
  Tabs,
} from "@patternfly/react-core";

import { AgenticAgentDetailsRoute, Paths } from "@app/Paths";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { PageHeader } from "@app/components/PageHeader";
import {
  useDeleteAgentMutation,
  useFetchAgentById,
} from "@app/queries/agents";
import { useFetchMigrationWorkflows } from "@app/queries/migration-workflows";
import { useFetchModels } from "@app/queries/models";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

import { AGENT_IMAGES, modelLabel } from "../agent-catalog";
import { AgentForm } from "../components/agent-form";

import { AgentRunsTab } from "./components/agent-runs-tab";

type TabKey = "details" | "runs";

const AgentDetails: React.FC = () => {
  const history = useHistory();
  const { agentId } = useParams<AgenticAgentDetailsRoute>();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>("details");
  const [isActionsOpen, setIsActionsOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const { agent, isFetching, fetchError, refetch } = useFetchAgentById(agentId);
  const { workflows } = useFetchMigrationWorkflows();
  const { models } = useFetchModels();

  const onDeleteSuccess = () => {
    pushNotification({ title: "Agent deleted", variant: "success" });
    history.push(Paths.agenticAgents);
  };
  const onDeleteError = (error: AxiosError) => {
    pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
  };
  const { mutate: deleteAgent } = useDeleteAgentMutation(
    onDeleteSuccess,
    onDeleteError
  );

  const imageLabel = (imageKey: string) => {
    const img = AGENT_IMAGES.find((i) => i.value === imageKey);
    return img ? `${img.icon}  ${img.label}` : imageKey;
  };

  const workflowsUsingAgent = agent
    ? workflows.filter((workflow) =>
        workflow.stages.some((stage) => stage.agentId === agent.id)
      )
    : [];

  if (fetchError) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant={AlertVariant.warning} title="Agent not found">
          This agent could not be found. It may have been deleted.
        </Alert>
      </PageSection>
    );
  }

  return (
    <ConditionalRender when={isFetching && !agent} then={<AppPlaceholder />}>
      {agent && (
        <>
          <PageSection hasBodyWrapper={false}>
            <PageHeader
              title={agent.name}
              breadcrumbs={[
                { title: "Agents", path: Paths.agenticAgents },
                { title: agent.name },
              ]}
              btnActions={
                <Dropdown
                  isOpen={isActionsOpen}
                  onOpenChange={setIsActionsOpen}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      variant="secondary"
                      onClick={() => setIsActionsOpen((open) => !open)}
                      isExpanded={isActionsOpen}
                    >
                      Actions
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    <DropdownItem key="edit" onClick={() => setIsEditOpen(true)}>
                      Edit
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      isDanger
                      onClick={() => setIsDeleteOpen(true)}
                    >
                      Delete
                    </DropdownItem>
                  </DropdownList>
                </Dropdown>
              }
            />
          </PageSection>

          <PageSection hasBodyWrapper={false}>
            <Tabs
              activeKey={activeTabKey}
              onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
            >
              <Tab
                eventKey="details"
                title={<TabTitleText>Details</TabTitleText>}
              >
                <PageSection hasBodyWrapper={false}>
                  <Flex
                    direction={{ default: "column" }}
                    gap={{ default: "gapLg" }}
                  >
                    <FlexItem>
                      <Card>
                        <CardBody>
                          <DescriptionList isHorizontal>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Image</DescriptionListTerm>
                              <DescriptionListDescription>
                                <span style={{ fontSize: "1.5rem" }}>
                                  {imageLabel(agent.image)}
                                </span>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>
                                Description
                              </DescriptionListTerm>
                              <DescriptionListDescription>
                                {agent.description || (
                                  <EmptyTextMessage message="None" />
                                )}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>
                                Persona prompt
                              </DescriptionListTerm>
                              <DescriptionListDescription>
                                {agent.prompt || (
                                  <EmptyTextMessage message="None" />
                                )}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Role</DescriptionListTerm>
                              <DescriptionListDescription>
                                <Label color="blue">{agent.role}</Label>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Status</DescriptionListTerm>
                              <DescriptionListDescription>
                                <Label
                                  color={
                                    agent.status === "Active"
                                      ? "green"
                                      : "grey"
                                  }
                                >
                                  {agent.status}
                                </Label>
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Model</DescriptionListTerm>
                              <DescriptionListDescription>
                                {modelLabel(models, agent.model)}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>Skills</DescriptionListTerm>
                              <DescriptionListDescription>
                                {agent.skills.length > 0 ? (
                                  <LabelGroup>
                                    {agent.skills.map((skill) => (
                                      <Label key={skill} color="purple">
                                        {skill}
                                      </Label>
                                    ))}
                                  </LabelGroup>
                                ) : (
                                  <EmptyTextMessage message="None" />
                                )}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>
                                Skill collections
                              </DescriptionListTerm>
                              <DescriptionListDescription>
                                {agent.skillCollections &&
                                agent.skillCollections.length > 0 ? (
                                  <LabelGroup>
                                    {agent.skillCollections.map((name) => (
                                      <Label key={name} color="teal">
                                        {name}
                                      </Label>
                                    ))}
                                  </LabelGroup>
                                ) : (
                                  <EmptyTextMessage message="None" />
                                )}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>
                                MCP tools
                              </DescriptionListTerm>
                              <DescriptionListDescription>
                                {agent.mcpTools.length > 0 ? (
                                  <LabelGroup>
                                    {agent.mcpTools.map((tool) => (
                                      <Label
                                        key={tool}
                                        color="orange"
                                        isCompact
                                      >
                                        {tool}
                                      </Label>
                                    ))}
                                  </LabelGroup>
                                ) : (
                                  <EmptyTextMessage message="None" />
                                )}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>
                                Capabilities
                              </DescriptionListTerm>
                              <DescriptionListDescription>
                                {agent.capabilities &&
                                agent.capabilities.length > 0 ? (
                                  <ul style={{ margin: 0, paddingLeft: "1.1em" }}>
                                    {agent.capabilities.map((capability, i) => (
                                      <li key={i}>{capability}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <EmptyTextMessage message="None" />
                                )}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>
                                Parameters
                              </DescriptionListTerm>
                              <DescriptionListDescription>
                                {agent.parameters &&
                                agent.parameters.length > 0 ? (
                                  <Flex direction={{ default: "column" }}>
                                    {agent.parameters.map((param) => (
                                      <FlexItem key={param.name}>
                                        <Label isCompact color="grey">
                                          {param.type}
                                        </Label>{" "}
                                        <strong>{param.name}</strong>
                                        {param.description
                                          ? ` — ${param.description}`
                                          : ""}
                                        {param.defaultValue
                                          ? ` (default: ${param.defaultValue})`
                                          : ""}
                                      </FlexItem>
                                    ))}
                                  </Flex>
                                ) : (
                                  <EmptyTextMessage message="None" />
                                )}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                            <DescriptionListGroup>
                              <DescriptionListTerm>
                                Created
                              </DescriptionListTerm>
                              <DescriptionListDescription>
                                {new Date(agent.createdAt).toLocaleString()}
                              </DescriptionListDescription>
                            </DescriptionListGroup>
                          </DescriptionList>
                        </CardBody>
                      </Card>
                    </FlexItem>

                    <FlexItem>
                      <Content component="h3">
                        Used in migration workflows
                      </Content>
                      {workflowsUsingAgent.length === 0 ? (
                        <Content component="small">
                          <EmptyTextMessage message="This agent isn't assigned to any workflow stage yet." />
                        </Content>
                      ) : (
                        <Flex
                          direction={{ default: "column" }}
                          gap={{ default: "gapSm" }}
                        >
                          {workflowsUsingAgent.map((workflow) => (
                            <Card key={workflow.id} isCompact>
                              <CardBody>
                                <Flex
                                  alignItems={{ default: "alignItemsCenter" }}
                                  justifyContent={{
                                    default: "justifyContentSpaceBetween",
                                  }}
                                >
                                  <FlexItem>
                                    <Link
                                      to={formatPath(
                                        Paths.agenticWorkflowDetails,
                                        { workflowId: workflow.id }
                                      )}
                                    >
                                      {workflow.name}
                                    </Link>
                                  </FlexItem>
                                  <FlexItem>
                                    <Label isCompact>
                                      {
                                        workflow.stages.filter(
                                          (stage) =>
                                            stage.agentId === agent.id
                                        ).length
                                      }{" "}
                                      stage(s)
                                    </Label>
                                  </FlexItem>
                                </Flex>
                              </CardBody>
                            </Card>
                          ))}
                        </Flex>
                      )}
                    </FlexItem>
                  </Flex>
                </PageSection>
              </Tab>
              <Tab eventKey="runs" title={<TabTitleText>Agent runs</TabTitleText>}>
                <PageSection hasBodyWrapper={false}>
                  <AgentRunsTab agent={agent} />
                </PageSection>
              </Tab>
            </Tabs>
          </PageSection>

          <Modal
            id="edit-agent-modal"
            variant="medium"
            isOpen={isEditOpen}
            onClose={() => setIsEditOpen(false)}
          >
            <ModalHeader title="Update agent" />
            <ModalBody>
              <AgentForm
                agent={agent}
                onClose={() => {
                  setIsEditOpen(false);
                  refetch();
                }}
              />
            </ModalBody>
          </Modal>

          {isDeleteOpen && (
            <ConfirmDialog
              title="Delete agent"
              titleIconVariant="warning"
              message={`Are you sure you want to delete agent "${agent.name}"? This action cannot be undone.`}
              isOpen
              confirmBtnVariant={ButtonVariant.danger}
              confirmBtnLabel="Delete"
              cancelBtnLabel="Cancel"
              onCancel={() => setIsDeleteOpen(false)}
              onClose={() => setIsDeleteOpen(false)}
              onConfirm={() => {
                deleteAgent(agent.id);
                setIsDeleteOpen(false);
              }}
            />
          )}
        </>
      )}
    </ConditionalRender>
  );
};

export default AgentDetails;
