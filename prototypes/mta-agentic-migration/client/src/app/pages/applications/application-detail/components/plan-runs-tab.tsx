import * as React from "react";
import { useHistory } from "react-router-dom";
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Flex,
  FlexItem,
  Label,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import { ActionsColumn, Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { Paths } from "@app/Paths";
import {
  useFetchAllWorkflowRuns,
  useFetchMigrationWorkflows,
} from "@app/queries/migration-workflows";
import { formatPath } from "@app/utils/utils";

import { StartMigrationModal } from "../../../migration-workflows/components/start-migration-modal";
import { RunStatusLabel } from "../../../migration-workflows/workflow-detail/components/run-status-label";

/**
 * Shows the migration workflow runs that included this specific application,
 * pulled from the same run history used by the Workflow Runs page and each
 * workflow's own "Runs" tab.
 */
export const PlanRunsTab: React.FC<{ applicationId: number }> = ({
  applicationId,
}) => {
  const history = useHistory();
  const { runs, isFetching } = useFetchAllWorkflowRuns();
  const { workflows } = useFetchMigrationWorkflows();
  const [isStartRunOpen, setIsStartRunOpen] = React.useState(false);

  const appRuns = runs
    .filter((run) => run.applications.some((app) => app.id === applicationId))
    .sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );

  const workflowNameById = (id: number) =>
    workflows.find((w) => w.id === id)?.name ?? `Workflow #${id}`;

  const goToRunDetails = (run: (typeof appRuns)[number]) =>
    history.push(
      formatPath(Paths.agenticWorkflowRunDetails, {
        workflowId: run.workflowId,
        runName: run.name,
      })
    );

  const goToWorkflow = (workflowId: number) =>
    history.push(
      `${formatPath(Paths.agenticWorkflowDetails, { workflowId })}?tab=runs`
    );

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
      <FlexItem>
        <Button
          variant={ButtonVariant.primary}
          onClick={() => setIsStartRunOpen(true)}
        >
          Start new run
        </Button>
      </FlexItem>

      {!isFetching && appRuns.length === 0 ? (
        <FlexItem>
          <EmptyState
            headingLevel="h3"
            icon={CubesIcon}
            titleText="No migration workflow runs yet"
            variant="sm"
          >
            <EmptyStateBody>
              Start a new migration workflow run for this application to see
              its progress, commits, and activity here.
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button
                  variant={ButtonVariant.primary}
                  onClick={() => setIsStartRunOpen(true)}
                >
                  Start new run
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        </FlexItem>
      ) : (
        <FlexItem>
          <Table aria-label="Plan runs for this application" variant="compact">
            <Thead>
              <Tr>
                <Th width={20}>Name</Th>
                <Th width={25}>Workflow</Th>
                <Th width={15}>Status</Th>
                <Th width={15}>Target branch</Th>
                <Th width={10}>Started</Th>
                <Th width={10}>Completed</Th>
                <Th screenReaderText="Row actions" />
              </Tr>
            </Thead>
            <Tbody>
              {appRuns.map((run) => (
                <Tr
                  key={run.id}
                  isClickable
                  onRowClick={() => goToRunDetails(run)}
                >
                  <Td dataLabel="Name">
                    <Button
                      variant="link"
                      isInline
                      onClick={(event) => {
                        event.stopPropagation();
                        goToRunDetails(run);
                      }}
                    >
                      {run.name}
                    </Button>
                  </Td>
                  <Td dataLabel="Workflow">
                    <Button
                      variant="link"
                      isInline
                      onClick={(event) => {
                        event.stopPropagation();
                        goToWorkflow(run.workflowId);
                      }}
                    >
                      {workflowNameById(run.workflowId)}
                    </Button>
                  </Td>
                  <Td dataLabel="Status">
                    <RunStatusLabel status={run.status} />
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
                          onClick: () => goToWorkflow(run.workflowId),
                        },
                      ]}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </FlexItem>
      )}

      <StartMigrationModal
        isOpen={isStartRunOpen}
        onClose={() => setIsStartRunOpen(false)}
        initialApplicationIds={[applicationId]}
      />
    </Flex>
  );
};
