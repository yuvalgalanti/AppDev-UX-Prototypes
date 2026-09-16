import * as React from "react";
import {
  Button,
  ButtonVariant,
  Content,
  EmptyState,
  EmptyStateBody,
  Label,
  LabelGroup,
  Modal,
  ModalBody,
  ModalHeader,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { MigrationWorkflow } from "@app/api/models";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";
import {
  useFetchKnowledgeBaseEntries,
  useFetchWorkflowRuns,
} from "@app/queries/migration-workflows";

import { KnowledgeBaseEntryForm } from "./knowledge-base-entry-form";

export const KnowledgeBaseTab: React.FC<{ workflow: MigrationWorkflow }> = ({
  workflow,
}) => {
  const { entries, isFetching } = useFetchKnowledgeBaseEntries(workflow.id);
  const { runs } = useFetchWorkflowRuns(workflow.id);
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  return (
    <>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <Button
              variant={ButtonVariant.primary}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add entry
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {!isFetching && entries.length === 0 ? (
        <EmptyState
          headingLevel="h3"
          icon={CubesIcon}
          titleText="No lessons learned yet"
          variant="sm"
        >
          <EmptyStateBody>
            Save lessons learned from a completed run, or add an entry
            directly, to build this workflow&apos;s knowledge base.
          </EmptyStateBody>
        </EmptyState>
      ) : (
        <Table aria-label="Knowledge base entries table">
          <Thead>
            <Tr>
              <Th width={25}>Title</Th>
              <Th width={35}>Content</Th>
              <Th width={20}>Tags</Th>
              <Th width={10}>Linked run</Th>
              <Th width={10}>Created</Th>
            </Tr>
          </Thead>
          <Tbody>
            {entries.map((entry) => (
              <Tr key={entry.id}>
                <Td>{entry.title}</Td>
                <Td>
                  <Content component="small">{entry.content}</Content>
                </Td>
                <Td>
                  {entry.tags.length > 0 ? (
                    <LabelGroup numLabels={3}>
                      {entry.tags.map((tag) => (
                        <Label key={tag} color="grey" isCompact>
                          {tag}
                        </Label>
                      ))}
                    </LabelGroup>
                  ) : (
                    <EmptyTextMessage message="None" />
                  )}
                </Td>
                <Td>
                  {entry.runId
                    ? runs.find((r) => r.id === entry.runId)?.name ??
                      `#${entry.runId}`
                    : "—"}
                </Td>
                <Td>{new Date(entry.createdAt).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        variant="medium"
      >
        <ModalHeader title="Add knowledge base entry" />
        <ModalBody>
          <KnowledgeBaseEntryForm
            workflowId={workflow.id}
            runs={runs}
            onClose={() => setIsAddModalOpen(false)}
          />
        </ModalBody>
      </Modal>
    </>
  );
};
