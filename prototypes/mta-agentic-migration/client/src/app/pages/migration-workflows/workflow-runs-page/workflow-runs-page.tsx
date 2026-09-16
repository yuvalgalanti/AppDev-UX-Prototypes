import * as React from "react";
import { useHistory } from "react-router-dom";
import {
  Button,
  ButtonVariant,
  Content,
  EmptyState,
  EmptyStateBody,
  Label,
  LabelGroup,
  PageSection,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import {
  ActionsColumn,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import { Paths } from "@app/Paths";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import {
  useFetchAllWorkflowRuns,
  useFetchMigrationWorkflows,
} from "@app/queries/migration-workflows";
import { formatPath } from "@app/utils/utils";

import { StartMigrationModal } from "../components/start-migration-modal";
import { RunStatusLabel } from "../workflow-detail/components/run-status-label";

const WorkflowRunsPage: React.FC = () => {
  const history = useHistory();

  const { runs, isFetching } = useFetchAllWorkflowRuns();
  const { workflows } = useFetchMigrationWorkflows();

  const [isStartRunOpen, setIsStartRunOpen] = React.useState(false);

  const workflowNameById = (id: number) =>
    workflows.find((w) => w.id === id)?.name ?? `Workflow #${id}`;

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">Plan Runs</Content>
        </Content>
        <Content>
          <Content component="p">
            View all migration plan runs across your plans, or start
            a new run by selecting a plan and the applications to migrate.
          </Content>
        </Content>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <ConditionalRender when={isFetching && !runs.length} then={<AppPlaceholder />}>
          <div style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}>
            <Button
              variant={ButtonVariant.primary}
              onClick={() => setIsStartRunOpen(true)}
            >
              Start new run
            </Button>
          </div>

          {runs.length === 0 ? (
            <EmptyState
              headingLevel="h2"
              icon={CubesIcon}
              titleText="No plan runs yet"
              variant="sm"
            >
              <EmptyStateBody>
                Start a new run to see agents progress through migration
                plan stages.
              </EmptyStateBody>
            </EmptyState>
          ) : (
            <Table aria-label="All workflow runs table" variant="compact">
              <Thead>
                <Tr>
                  <Th width={15}>Name</Th>
                  <Th width={20}>Migration Plan</Th>
                  <Th width={15}>Status</Th>
                  <Th width={20}>Applications</Th>
                  <Th width={15}>Target branch</Th>
                  <Th width={10}>Started</Th>
                  <Th width={10}>Completed</Th>
                  <Th screenReaderText="Row actions" />
                </Tr>
              </Thead>
              <Tbody>
                {runs.map((run) => {
                  const goToRunDetails = () =>
                    history.push(
                      formatPath(Paths.agenticWorkflowRunDetails, {
                        workflowId: run.workflowId,
                        runName: run.name,
                      })
                    );
                  return (
                    <Tr key={run.id} isClickable onRowClick={goToRunDetails}>
                      <Td dataLabel="Name">
                        <Button
                          variant="link"
                          isInline
                          onClick={(event) => {
                            event.stopPropagation();
                            goToRunDetails();
                          }}
                        >
                          {run.name}
                        </Button>
                      </Td>
                      <Td dataLabel="Migration Plan">
                        <Button
                          variant="link"
                          isInline
                          onClick={(event) => {
                            event.stopPropagation();
                            history.push(
                              `${formatPath(Paths.agenticWorkflowDetails, {
                                workflowId: run.workflowId,
                              })}?tab=runs`
                            );
                          }}
                        >
                          {workflowNameById(run.workflowId)}
                        </Button>
                      </Td>
                      <Td dataLabel="Status">
                        <RunStatusLabel status={run.status} />
                      </Td>
                      <Td dataLabel="Applications">
                        {run.applications.length > 0 ? (
                          <LabelGroup numLabels={3}>
                            {run.applications.map((app) => (
                              <Label key={app.id} isCompact>
                                {app.name}
                              </Label>
                            ))}
                          </LabelGroup>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td dataLabel="Target branch">
                        <Label isCompact color="blue">
                          {run.targetBranch}
                        </Label>
                      </Td>
                      <Td dataLabel="Started">
                        {new Date(run.startedAt).toLocaleString()}
                      </Td>
                      <Td dataLabel="Completed">
                        {run.completedAt
                          ? new Date(run.completedAt).toLocaleString()
                          : "—"}
                      </Td>
                      <Td isActionCell>
                        <ActionsColumn
                          items={[
                            {
                              title: "View workflow",
                              onClick: () =>
                                history.push(
                                  `${formatPath(Paths.agenticWorkflowDetails, {
                                    workflowId: run.workflowId,
                                  })}?tab=runs`
                                ),
                            },
                          ]}
                        />
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          )}
        </ConditionalRender>
      </PageSection>

      <StartMigrationModal
        isOpen={isStartRunOpen}
        onClose={() => setIsStartRunOpen(false)}
      />
    </>
  );
};

export default WorkflowRunsPage;
