import * as React from "react";
import { AxiosError } from "axios";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Card,
  CardBody,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  PageSection,
} from "@patternfly/react-core";

import { AgenticAgentRunDetailsRoute, Paths } from "@app/Paths";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { PageHeader } from "@app/components/PageHeader";
import { useFetchAgentById } from "@app/queries/agents";
import {
  useApproveStageMutation,
  useFetchMigrationWorkflowById,
  useFetchWorkflowRuns,
  useSendStageMessageMutation,
} from "@app/queries/migration-workflows";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

import { RunStatusLabel } from "../../migration-workflows/workflow-detail/components/run-status-label";

import { StageChat } from "./components/stage-chat";

const AgentRunDetails: React.FC = () => {
  const { agentId, workflowId, runId, stageId } =
    useParams<AgenticAgentRunDetailsRoute>();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { agent, isFetching: isFetchingAgent } = useFetchAgentById(agentId);
  const { workflow, isFetching: isFetchingWorkflow } =
    useFetchMigrationWorkflowById(workflowId);
  const { runs, isFetching: isFetchingRuns } = useFetchWorkflowRuns(
    Number(workflowId)
  );

  const run = runs.find((r) => r.id === Number(runId));
  const stage = workflow?.stages.find((s) => s.id === Number(stageId));
  const stageRun = run?.stageRuns.find((sr) => sr.stageId === Number(stageId));

  const onError = (error: AxiosError) => {
    pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
  };

  const { mutate: approveStage, isPending: isApproving } = useApproveStageMutation(
    () => pushNotification({ title: "Stage approved", variant: "success" }),
    onError
  );

  const { mutate: sendMessage, isPending: isSending } = useSendStageMessageMutation(
    () => undefined,
    onError
  );

  const isLoading =
    (isFetchingAgent && !agent) ||
    (isFetchingWorkflow && !workflow) ||
    (isFetchingRuns && !run);

  if (!isLoading && (!agent || !workflow)) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant={AlertVariant.warning} title="Agent or workflow not found">
          This agent or migration workflow could not be found. It may have
          been deleted.
        </Alert>
      </PageSection>
    );
  }

  return (
    <ConditionalRender when={isLoading} then={<AppPlaceholder />}>
      {agent && workflow && (
        <>
          <PageSection hasBodyWrapper={false}>
            <PageHeader
              title={
                stage && run
                  ? `${stage.name} — ${run.name}`
                  : run
                    ? run.name
                    : `Run #${runId}`
              }
              breadcrumbs={[
                { title: "Agents", path: Paths.agenticAgents },
                {
                  title: agent.name,
                  path: formatPath(Paths.agenticAgentDetails, {
                    agentId: agent.id,
                  }),
                },
                { title: run ? run.name : `Run #${runId}` },
              ]}
            />
          </PageSection>

          <PageSection hasBodyWrapper={false}>
            {!run || !stage || !stageRun ? (
              <Alert variant={AlertVariant.warning} title="Run not found">
                This agent run could not be found. It may have been part of a
                workflow run that no longer exists.
              </Alert>
            ) : (
              <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
                <FlexItem>
                  <Card>
                    <CardBody>
                      <DescriptionList isHorizontal>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Workflow</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Link
                              to={`${formatPath(Paths.agenticWorkflowDetails, {
                                workflowId: workflow.id,
                              })}?tab=runs`}
                            >
                              {workflow.name}
                            </Link>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Stage</DescriptionListTerm>
                          <DescriptionListDescription>
                            {stage.name}
                            {stage.description && (
                              <Content component="small">
                                {stage.description}
                              </Content>
                            )}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Status</DescriptionListTerm>
                          <DescriptionListDescription>
                            <RunStatusLabel status={stageRun.status} isCompact={false} />
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Applications</DescriptionListTerm>
                          <DescriptionListDescription>
                            {run.applications.length > 0 ? (
                              <LabelGroup>
                                {run.applications.map((app) => (
                                  <Label key={app.id} isCompact>
                                    {app.name}
                                  </Label>
                                ))}
                              </LabelGroup>
                            ) : (
                              <EmptyTextMessage message="None" />
                            )}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Target branch</DescriptionListTerm>
                          <DescriptionListDescription>
                            <Label isCompact color="blue">
                              {run.targetBranch}
                            </Label>
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Started</DescriptionListTerm>
                          <DescriptionListDescription>
                            {stageRun.startedAt
                              ? new Date(stageRun.startedAt).toLocaleString()
                              : "—"}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        <DescriptionListGroup>
                          <DescriptionListTerm>Completed</DescriptionListTerm>
                          <DescriptionListDescription>
                            {stageRun.completedAt
                              ? new Date(stageRun.completedAt).toLocaleString()
                              : "—"}
                          </DescriptionListDescription>
                        </DescriptionListGroup>
                        {stageRun.approvedAt && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>Approved</DescriptionListTerm>
                            <DescriptionListDescription>
                              {new Date(stageRun.approvedAt).toLocaleString()}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                        {stageRun.output && (
                          <DescriptionListGroup>
                            <DescriptionListTerm>Output</DescriptionListTerm>
                            <DescriptionListDescription>
                              {stageRun.output}
                            </DescriptionListDescription>
                          </DescriptionListGroup>
                        )}
                      </DescriptionList>
                    </CardBody>
                  </Card>
                </FlexItem>

                {stage.requiresApproval &&
                  stageRun.status === "AwaitingApproval" && (
                    <FlexItem>
                      <Alert
                        variant="warning"
                        isInline
                        title="This stage requires your approval"
                      >
                        <p>
                          {agent.name} has finished this stage and is waiting
                          for human approval before the workflow continues.
                        </p>
                        <Button
                          variant={ButtonVariant.primary}
                          isLoading={isApproving}
                          onClick={() =>
                            approveStage({
                              workflowId: workflow.id,
                              runId: run.id,
                              stageId: stage.id,
                            })
                          }
                        >
                          Approve and continue
                        </Button>
                      </Alert>
                    </FlexItem>
                  )}

                <FlexItem>
                  <StageChat
                    agentName={agent.name}
                    messages={stageRun.messages ?? []}
                    isSending={isSending}
                    onSend={(content) =>
                      sendMessage({
                        workflowId: workflow.id,
                        runId: run.id,
                        stageId: stage.id,
                        content,
                      })
                    }
                  />
                </FlexItem>
              </Flex>
            )}
          </PageSection>
        </>
      )}
    </ConditionalRender>
  );
};

export default AgentRunDetails;
