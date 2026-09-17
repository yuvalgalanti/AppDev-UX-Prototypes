import * as React from "react";
import { useHistory } from "react-router-dom";
import {
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { Paths } from "@app/Paths";
import { MigrationWorkflow, WorkflowRun } from "@app/api/models";
import { useFetchWorkflowRuns } from "@app/queries/migration-workflows";
import { formatPath } from "@app/utils/utils";

import { RunStatusLabel } from "./run-status-label";

const isNonTerminal = (run: WorkflowRun) =>
  run.status === "Pending" ||
  run.status === "Running" ||
  run.status === "AwaitingApproval";

export const RunsTab: React.FC<{ workflow: MigrationWorkflow }> = ({
  workflow,
}) => {
  const history = useHistory();
  const { runs, isFetching } = useFetchWorkflowRuns(workflow.id);

  const hasActiveRun = runs.some(isNonTerminal);

  const goToRunDetails = (run: WorkflowRun) =>
    history.push(
      formatPath(Paths.agenticWorkflowRunDetails, {
        workflowId: workflow.id,
        runName: run.name,
      })
    );

  return (
    <Flex direction={{ default: "column" }} gap={{ default: "gapLg" }}>
      <FlexItem>
        <Button
          variant={ButtonVariant.primary}
          isDisabled={hasActiveRun}
          onClick={() => history.push(Paths.agenticWorkflowRuns)}
        >
          Start new run
        </Button>
      </FlexItem>

      {!isFetching && runs.length === 0 && (
        <FlexItem>
          <EmptyState
            headingLevel="h3"
            icon={CubesIcon}
            titleText="This workflow hasn't been run yet"
            variant="sm"
          >
            <EmptyStateBody>
              Start a run to see agents progress through each stage.
            </EmptyStateBody>
          </EmptyState>
        </FlexItem>
      )}

      {runs.length > 0 && (
        <FlexItem>
          <Table aria-label="Run history table" variant="compact">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Applications</Th>
                <Th>Target branch</Th>
                <Th>Started</Th>
                <Th>Completed</Th>
              </Tr>
            </Thead>
            <Tbody>
              {runs.map((run) => (
                <Tr key={run.id} isClickable onRowClick={() => goToRunDetails(run)}>
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
                  <Td dataLabel="Status">
                    <RunStatusLabel status={run.status} />
                  </Td>
                  <Td dataLabel="Applications">
                    {run.applications.length > 0
                      ? run.applications.map((a) => a.name).join(", ")
                      : "—"}
                  </Td>
                  <Td dataLabel="Target branch">{run.targetBranch || "—"}</Td>
                  <Td dataLabel="Started">
                    {new Date(run.startedAt).toLocaleString()}
                  </Td>
                  <Td dataLabel="Completed">
                    {run.completedAt
                      ? new Date(run.completedAt).toLocaleString()
                      : "—"}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </FlexItem>
      )}
    </Flex>
  );
};
