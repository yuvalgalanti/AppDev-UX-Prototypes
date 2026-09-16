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
  Modal,
  ModalBody,
  ModalHeader,
  PageSection,
  ProgressStep,
  ProgressStepper,
} from "@patternfly/react-core";

import { AgenticWorkflowRunDetailsRoute, Paths } from "@app/Paths";
import { WorkflowStageRunResult } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { PageHeader } from "@app/components/PageHeader";
import {
  useApproveStageMutation,
  useFetchMigrationWorkflowById,
  useFetchWorkflowRuns,
} from "@app/queries/migration-workflows";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

import { KnowledgeBaseEntryForm } from "../workflow-detail/components/knowledge-base-entry-form";
import { RunStatusLabel } from "../workflow-detail/components/run-status-label";

import { StageRunSection, commitProviderIcon } from "./components/stage-run-section";

const stepVariant = (
  status: WorkflowStageRunResult["status"]
): "default" | "success" | "info" | "pending" | "warning" | "danger" => {
  switch (status) {
    case "Succeeded":
      return "success";
    case "Failed":
      return "danger";
    case "Running":
      return "info";
    case "AwaitingApproval":
      return "warning";
    default:
      return "pending";
  }
};

const WorkflowRunDetails: React.FC = () => {
  const { workflowId, runName } = useParams<AgenticWorkflowRunDetailsRoute>();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { workflow, isFetching: isFetchingWorkflow } =
    useFetchMigrationWorkflowById(workflowId);
  const { runs, isFetching: isFetchingRuns } = useFetchWorkflowRuns(
    Number(workflowId)
  );
  const run = runs.find((r) => r.name === runName);

  const [expandedStages, setExpandedStages] = React.useState<Set<number>>(
    new Set()
  );
  const [isLessonsLearnedOpen, setIsLessonsLearnedOpen] = React.useState(false);

  const onError = (error: AxiosError) => {
    pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
  };

  const { mutate: approveStage, isPending: isApproving } = useApproveStageMutation(
    () => pushNotification({ title: "Stage approved", variant: "success" }),
    onError
  );

  const isLoading =
    (isFetchingWorkflow && !workflow) || (isFetchingRuns && !run);

  if (!isLoading && (!workflow || !run)) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant={AlertVariant.warning} title="Run not found">
          This workflow run could not be found. It may have been deleted.
        </Alert>
      </PageSection>
    );
  }

  const toggleStage = (stageId: number) => {
    setExpandedStages((prev) => {
      const next = new Set(prev);
      if (next.has(stageId)) {
        next.delete(stageId);
      } else {
        next.add(stageId);
      }
      return next;
    });
  };

  const awaitingStage = run?.stageRuns.find(
    (sr) => sr.status === "AwaitingApproval"
  );

  return (
    <ConditionalRender when={isLoading} then={<AppPlaceholder />}>
      {workflow && run && (
        <>
          <PageSection hasBodyWrapper={false}>
            <PageHeader
              title={
                <Flex
                  alignItems={{ default: "alignItemsCenter" }}
                  gap={{ default: "gapMd" }}
                >
                  <FlexItem>{run.name}</FlexItem>
                  <FlexItem>
                    <RunStatusLabel status={run.status} isCompact={false} />
                  </FlexItem>
                </Flex>
              }
              breadcrumbs={[
                { title: "Workflows", path: Paths.agenticWorkflows },
                {
                  title: workflow.name,
                  path: `${formatPath(Paths.agenticWorkflowDetails, {
                    workflowId: workflow.id,
                  })}?tab=runs`,
                },
                { title: run.name },
              ]}
              btnActions={
                (run.status === "Succeeded" || run.status === "Failed") && (
                  <Button
                    variant={ButtonVariant.secondary}
                    onClick={() => setIsLessonsLearnedOpen(true)}
                  >
                    Save lessons learned
                  </Button>
                )
              }
            />
          </PageSection>

          <PageSection hasBodyWrapper={false}>
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
                          {new Date(run.startedAt).toLocaleString()}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                      <DescriptionListGroup>
                        <DescriptionListTerm>Completed</DescriptionListTerm>
                        <DescriptionListDescription>
                          {run.completedAt ? (
                            new Date(run.completedAt).toLocaleString()
                          ) : (
                            <EmptyTextMessage message="In progress" />
                          )}
                        </DescriptionListDescription>
                      </DescriptionListGroup>
                    </DescriptionList>
                  </CardBody>
                </Card>
              </FlexItem>

              <FlexItem>
                <Content component="h3">Run progress</Content>
                <ProgressStepper aria-label="Workflow run progress">
                  {workflow.stages.map((stage) => {
                    const stageRun = run.stageRuns.find(
                      (sr) => sr.stageId === stage.id
                    );
                    const status = stageRun?.status ?? "Pending";
                    return (
                      <ProgressStep
                        key={stage.id}
                        id={`run-${run.id}-stage-${stage.id}`}
                        variant={stepVariant(status)}
                        isCurrent={
                          status === "Running" || status === "AwaitingApproval"
                        }
                        description={
                          <Link
                            to={formatPath(Paths.agenticAgentRunDetails, {
                              agentId: stage.agentId,
                              workflowId: workflow.id,
                              runId: run.id,
                              stageId: stage.id,
                            })}
                          >
                            View agent run
                          </Link>
                        }
                        aria-label={`${stage.name}: ${status}`}
                      >
                        {stage.name}
                      </ProgressStep>
                    );
                  })}
                </ProgressStepper>
              </FlexItem>

              {awaitingStage && (
                <FlexItem>
                  <Alert
                    variant="warning"
                    isInline
                    title="A stage is awaiting your approval"
                  >
                    <p>
                      {
                        workflow.stages.find(
                          (s) => s.id === awaitingStage.stageId
                        )?.name
                      }{" "}
                      has completed its work and requires human approval before
                      the workflow continues.
                    </p>
                    <Button
                      variant={ButtonVariant.primary}
                      isLoading={isApproving}
                      onClick={() =>
                        approveStage({
                          workflowId: workflow.id,
                          runId: run.id,
                          stageId: awaitingStage.stageId,
                        })
                      }
                    >
                      Approve and continue
                    </Button>
                  </Alert>
                </FlexItem>
              )}

              <FlexItem>
                <Content component="h3">Commits and activities by stage</Content>
                <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                  {workflow.stages.map((stage) => {
                    const stageRun = run.stageRuns.find(
                      (sr) => sr.stageId === stage.id
                    );
                    const stageCommits = (run.commits ?? []).filter(
                      (c) => c.stageId === stage.id
                    );
                    return (
                      <FlexItem key={stage.id}>
                        <StageRunSection
                          stage={stage}
                          stageRun={stageRun}
                          commits={stageCommits}
                          agentRunPath={formatPath(
                            Paths.agenticAgentRunDetails,
                            {
                              agentId: stage.agentId,
                              workflowId: workflow.id,
                              runId: run.id,
                              stageId: stage.id,
                            }
                          )}
                          isExpanded={expandedStages.has(stage.id)}
                          onToggle={() => toggleStage(stage.id)}
                        />
                      </FlexItem>
                    );
                  })}
                </Flex>
              </FlexItem>

              {run.commits?.some((c) => !c.stageId) && (
                <FlexItem>
                  <Content component="h4">Other commits</Content>
                  <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
                    {run.commits
                      .filter((c) => !c.stageId)
                      .map((commit) => (
                        <FlexItem key={commit.id}>
                          {commit.url ? (
                            <a
                              href={commit.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Label
                                isCompact
                                icon={commitProviderIcon(commit.url)}
                                color="grey"
                              >
                                {commit.sha}
                              </Label>
                            </a>
                          ) : (
                            <Label isCompact color="grey">
                              {commit.sha}
                            </Label>
                          )}{" "}
                          {commit.message}
                        </FlexItem>
                      ))}
                  </Flex>
                </FlexItem>
              )}
            </Flex>
          </PageSection>

          <Modal
            isOpen={isLessonsLearnedOpen}
            onClose={() => setIsLessonsLearnedOpen(false)}
            variant="medium"
          >
            <ModalHeader title="Save lessons learned" />
            <ModalBody>
              <KnowledgeBaseEntryForm
                workflowId={workflow.id}
                runs={runs}
                defaultRunId={run.id}
                onClose={() => setIsLessonsLearnedOpen(false)}
              />
            </ModalBody>
          </Modal>
        </>
      )}
    </ConditionalRender>
  );
};

export default WorkflowRunDetails;
