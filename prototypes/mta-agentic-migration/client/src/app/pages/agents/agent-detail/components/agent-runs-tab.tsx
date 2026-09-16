import * as React from "react";
import { useHistory } from "react-router-dom";
import {
  Button,
  EmptyState,
  EmptyStateBody,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { Paths } from "@app/Paths";
import { Agent, MigrationWorkflow, WorkflowRun } from "@app/api/models";
import {
  useFetchAllWorkflowRuns,
  useFetchMigrationWorkflows,
} from "@app/queries/migration-workflows";
import { formatPath } from "@app/utils/utils";

import { RunStatusLabel } from "../../../migration-workflows/workflow-detail/components/run-status-label";

interface AgentRunEntry {
  key: string;
  workflowId: number;
  workflowName: string;
  runId: number;
  runName: string;
  stageId: number;
  stageName: string;
  status: WorkflowRun["stageRuns"][number]["status"];
  startedAt?: string;
  completedAt?: string;
}

const buildAgentRunEntries = (
  agent: Agent,
  workflows: MigrationWorkflow[],
  runs: WorkflowRun[]
): AgentRunEntry[] => {
  const entries: AgentRunEntry[] = [];

  workflows.forEach((workflow) => {
    const stageIds = new Set(
      workflow.stages
        .filter((stage) => stage.agentId === agent.id)
        .map((stage) => stage.id)
    );
    if (stageIds.size === 0) return;

    runs
      .filter((run) => run.workflowId === workflow.id)
      .forEach((run) => {
        run.stageRuns
          .filter((stageRun) => stageIds.has(stageRun.stageId))
          .forEach((stageRun) => {
            const stage = workflow.stages.find(
              (s) => s.id === stageRun.stageId
            );
            entries.push({
              key: `${run.id}-${stageRun.stageId}`,
              workflowId: workflow.id,
              workflowName: workflow.name,
              runId: run.id,
              runName: run.name,
              stageId: stageRun.stageId,
              stageName: stage?.name ?? `Stage #${stageRun.stageId}`,
              status: stageRun.status,
              startedAt: stageRun.startedAt,
              completedAt: stageRun.completedAt,
            });
          });
      });
  });

  return entries.sort((a, b) => {
    const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
    const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
    return bTime - aTime;
  });
};

export const AgentRunsTab: React.FC<{ agent: Agent }> = ({ agent }) => {
  const history = useHistory();
  const { workflows } = useFetchMigrationWorkflows();
  const { runs, isFetching } = useFetchAllWorkflowRuns();

  const entries = React.useMemo(
    () => buildAgentRunEntries(agent, workflows, runs),
    [agent, workflows, runs]
  );

  const goToRunDetails = (entry: AgentRunEntry) =>
    history.push(
      formatPath(Paths.agenticAgentRunDetails, {
        agentId: agent.id,
        workflowId: entry.workflowId,
        runId: entry.runId,
        stageId: entry.stageId,
      })
    );

  if (!isFetching && entries.length === 0) {
    return (
      <EmptyState
        headingLevel="h3"
        icon={CubesIcon}
        titleText="This agent hasn't run yet"
        variant="sm"
      >
        <EmptyStateBody>
          Runs will appear here once this agent is assigned to a workflow
          stage and a workflow run is started.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Table aria-label="Agent runs table" variant="compact">
      <Thead>
        <Tr>
          <Th width={25}>Workflow</Th>
          <Th width={20}>Stage</Th>
          <Th width={15}>Status</Th>
          <Th width={20}>Started</Th>
          <Th width={20}>Completed</Th>
        </Tr>
      </Thead>
      <Tbody>
        {entries.map((entry) => (
          <Tr
            key={entry.key}
            isClickable
            onRowClick={() => goToRunDetails(entry)}
          >
            <Td dataLabel="Workflow">
              <Button
                variant="link"
                isInline
                onClick={(event) => {
                  event.stopPropagation();
                  goToRunDetails(entry);
                }}
              >
                {entry.workflowName} — {entry.runName}
              </Button>
            </Td>
            <Td dataLabel="Stage">{entry.stageName}</Td>
            <Td dataLabel="Status">
              <RunStatusLabel status={entry.status} />
            </Td>
            <Td dataLabel="Started">
              {entry.startedAt
                ? new Date(entry.startedAt).toLocaleString()
                : "—"}
            </Td>
            <Td dataLabel="Completed">
              {entry.completedAt
                ? new Date(entry.completedAt).toLocaleString()
                : "—"}
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};
