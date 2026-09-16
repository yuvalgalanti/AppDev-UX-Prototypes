import * as React from "react";
import { AxiosError } from "axios";
import { useHistory } from "react-router-dom";
import {
  Button,
  ButtonVariant,
  Content,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateBody,
  Label,
  MenuToggle,
  MenuToggleElement,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
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
import { MigrationWorkflow } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { NotificationsContext } from "@app/components/NotificationsContext";
import {
  useDeleteMigrationWorkflowMutation,
  useFetchMigrationWorkflows,
} from "@app/queries/migration-workflows";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

import { RunStatusLabel } from "./workflow-detail/components/run-status-label";
import { MigrationWorkflowWizard } from "./workflow-wizard/migration-workflow-wizard";

export const MigrationWorkflows: React.FC = () => {
  const history = useHistory();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { workflows, isFetching, fetchError, refetch } =
    useFetchMigrationWorkflows();

  const realWorkflows = workflows.filter((w) => !w.isTemplate);
  const templates = workflows.filter((w) => w.isTemplate);

  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = React.useState(false);

  const [wizardState, setWizardState] = React.useState<
    | { mode: "create" }
    | { mode: "edit"; workflow: MigrationWorkflow }
    | { mode: "seed"; seedFrom: MigrationWorkflow }
    | null
  >(null);

  const [workflowToDelete, setWorkflowToDelete] =
    React.useState<MigrationWorkflow>();

  const onDeleteSuccess = () => {
    pushNotification({ title: "Migration plan deleted", variant: "success" });
  };
  const onDeleteError = (error: AxiosError) => {
    pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
  };
  const { mutate: deleteWorkflow } = useDeleteMigrationWorkflowMutation(
    onDeleteSuccess,
    onDeleteError
  );

  const goToDetails = (workflow: MigrationWorkflow) =>
    history.push(formatPath(Paths.agenticWorkflowDetails, { workflowId: workflow.id }));

  const closeWizard = () => {
    setWizardState(null);
    refetch();
  };

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">Migration Plans</Content>
        </Content>
        <Content>
          <Content component="p">
            Build multi-stage migration workflows that delegate each stage to
            an agent. Define the plan&apos;s goal, run it, and capture lessons
            learned along the way.
          </Content>
        </Content>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <ConditionalRender
          when={isFetching && !(workflows || fetchError)}
          then={<AppPlaceholder />}
        >
          <Toolbar>
            <ToolbarContent>
              <ToolbarGroup variant="action-group">
                <ToolbarItem>
                  <Button
                    id="create-migration-workflow"
                    variant={ButtonVariant.primary}
                    onClick={() => setWizardState({ mode: "create" })}
                  >
                    Create plan
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Dropdown
                    isOpen={isTemplateMenuOpen}
                    onOpenChange={setIsTemplateMenuOpen}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle
                        ref={toggleRef}
                        variant="secondary"
                        isDisabled={templates.length === 0}
                        onClick={() => setIsTemplateMenuOpen((open) => !open)}
                        isExpanded={isTemplateMenuOpen}
                      >
                        Start from template
                      </MenuToggle>
                    )}
                  >
                    <DropdownList>
                      {templates.map((template) => (
                        <DropdownItem
                          key={template.id}
                          onClick={() => {
                            setWizardState({ mode: "seed", seedFrom: template });
                            setIsTemplateMenuOpen(false);
                          }}
                        >
                          {template.name}
                        </DropdownItem>
                      ))}
                    </DropdownList>
                  </Dropdown>
                </ToolbarItem>
              </ToolbarGroup>
            </ToolbarContent>
          </Toolbar>

          {realWorkflows.length === 0 ? (
            <EmptyState
              headingLevel="h2"
              icon={CubesIcon}
              titleText="No migration plans yet"
              variant="sm"
            >
              <EmptyStateBody>
                Create a plan, or start from one of the available templates,
                to build your first agentic migration plan.
              </EmptyStateBody>
            </EmptyState>
          ) : (
            <Table aria-label="Migration plans table" variant="compact">
              <Thead>
                <Tr>
                  <Th width={25}>Name</Th>
                  <Th width={35}>Goal</Th>
                  <Th width={10}>Stages</Th>
                  <Th width={15}>Last run</Th>
                  <Th screenReaderText="Row actions" />
                </Tr>
              </Thead>
              <Tbody>
                {realWorkflows.map((workflow) => (
                  <Tr key={workflow.id}>
                    <Td dataLabel="Name">
                      <Button
                        variant="link"
                        isInline
                        onClick={() => goToDetails(workflow)}
                      >
                        {workflow.name}
                      </Button>
                    </Td>
                    <Td dataLabel="Goal">
                      <Content component="small">{workflow.goal}</Content>
                    </Td>
                    <Td dataLabel="Stages">
                      <Label color="blue" isCompact>
                        {workflow.stages.length} stage
                        {workflow.stages.length === 1 ? "" : "s"}
                      </Label>
                    </Td>
                    <Td dataLabel="Last run">
                      {workflow.lastRun ? (
                        <RunStatusLabel status={workflow.lastRun.status} />
                      ) : (
                        <Label color="grey" isCompact>
                          Never run
                        </Label>
                      )}
                    </Td>
                    <Td isActionCell>
                      <ActionsColumn
                        items={[
                          {
                            title: "Run",
                            onClick: () =>
                              history.push(Paths.agenticWorkflowRuns),
                          },
                          {
                            title: "View workflow",
                            onClick: () => goToDetails(workflow),
                          },
                          {
                            title: "Edit",
                            onClick: () =>
                              setWizardState({ mode: "edit", workflow }),
                          },
                          {
                            title: "Duplicate",
                            onClick: () =>
                              setWizardState({ mode: "seed", seedFrom: workflow }),
                          },
                          {
                            title: "Delete",
                            onClick: () => setWorkflowToDelete(workflow),
                            isDanger: true,
                          },
                        ]}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </ConditionalRender>
      </PageSection>

      {wizardState && (
        <MigrationWorkflowWizard
          key={
            wizardState.mode === "edit"
              ? `edit-${wizardState.workflow.id}`
              : wizardState.mode === "seed"
                ? `seed-${wizardState.seedFrom.id}`
                : "create"
          }
          isOpen={true}
          onClose={closeWizard}
          onSaved={closeWizard}
          workflow={wizardState.mode === "edit" ? wizardState.workflow : null}
          seedFrom={wizardState.mode === "seed" ? wizardState.seedFrom : null}
        />
      )}

      {workflowToDelete && (
        <ConfirmDialog
          title="Delete migration plan"
          titleIconVariant="warning"
          message={`Are you sure you want to delete "${workflowToDelete.name}"? This action cannot be undone.`}
          isOpen={true}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel="Delete"
          cancelBtnLabel="Cancel"
          onCancel={() => setWorkflowToDelete(undefined)}
          onClose={() => setWorkflowToDelete(undefined)}
          onConfirm={() => {
            deleteWorkflow(workflowToDelete.id);
            setWorkflowToDelete(undefined);
          }}
        />
      )}
    </>
  );
};
