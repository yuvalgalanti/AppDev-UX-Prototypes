import * as React from "react";
import { AxiosError } from "axios";
import { useHistory, useLocation, useParams } from "react-router-dom";
import {
  Alert,
  AlertVariant,
  ButtonVariant,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  PageSection,
  Tab,
  TabTitleText,
  Tabs,
} from "@patternfly/react-core";

import { AgenticWorkflowDetailsRoute, Paths } from "@app/Paths";
import { MigrationWorkflow } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { PageHeader } from "@app/components/PageHeader";
import { useFetchAgents } from "@app/queries/agents";
import {
  useDeleteMigrationWorkflowMutation,
  useFetchMigrationWorkflowById,
} from "@app/queries/migration-workflows";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

import { MigrationWorkflowWizard } from "../workflow-wizard/migration-workflow-wizard";

import { KnowledgeBaseTab } from "./components/knowledge-base-tab";
import { OverviewTab } from "./components/overview-tab";
import { RunsTab } from "./components/runs-tab";

type TabKey = "overview" | "runs" | "knowledge-base";

const MigrationWorkflowDetails: React.FC = () => {
  const history = useHistory();
  const location = useLocation();
  const { workflowId } = useParams<AgenticWorkflowDetailsRoute>();
  const { pushNotification } = React.useContext(NotificationsContext);

  const initialTab =
    new URLSearchParams(location.search).get("tab") === "runs"
      ? "runs"
      : "overview";
  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>(initialTab);

  const [isActionsOpen, setIsActionsOpen] = React.useState(false);
  const [isEditWizardOpen, setIsEditWizardOpen] = React.useState(false);
  const [duplicateSeed, setDuplicateSeed] = React.useState<MigrationWorkflow | null>(
    null
  );
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

  const { workflow, isFetching, fetchError, refetch } =
    useFetchMigrationWorkflowById(workflowId);
  const { agents } = useFetchAgents();

  const onDeleteSuccess = () => {
    pushNotification({ title: "Migration workflow deleted", variant: "success" });
    history.push(Paths.agenticWorkflows);
  };
  const onDeleteError = (error: AxiosError) => {
    pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
  };
  const { mutate: deleteWorkflow } = useDeleteMigrationWorkflowMutation(
    onDeleteSuccess,
    onDeleteError
  );

  if (fetchError) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Alert variant={AlertVariant.warning} title="Workflow not found">
          This migration workflow could not be found. It may have been
          deleted.
        </Alert>
      </PageSection>
    );
  }

  return (
    <ConditionalRender when={isFetching && !workflow} then={<AppPlaceholder />}>
      {workflow && (
        <>
          <PageSection hasBodyWrapper={false}>
            <PageHeader
              title={workflow.name}
              breadcrumbs={[
                { title: "Migration Plans", path: Paths.agenticWorkflows },
                { title: workflow.name },
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
                    <DropdownItem
                      key="edit"
                      onClick={() => setIsEditWizardOpen(true)}
                    >
                      Edit
                    </DropdownItem>
                    <DropdownItem
                      key="duplicate"
                      onClick={() => setDuplicateSeed(workflow)}
                    >
                      Duplicate
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
                eventKey="overview"
                title={<TabTitleText>Overview</TabTitleText>}
              >
                <PageSection hasBodyWrapper={false}>
                  <OverviewTab workflow={workflow} agents={agents} />
                </PageSection>
              </Tab>
              <Tab eventKey="runs" title={<TabTitleText>Runs</TabTitleText>}>
                <PageSection hasBodyWrapper={false}>
                  <RunsTab workflow={workflow} />
                </PageSection>
              </Tab>
              <Tab
                eventKey="knowledge-base"
                title={<TabTitleText>Knowledge base</TabTitleText>}
              >
                <PageSection hasBodyWrapper={false}>
                  <KnowledgeBaseTab workflow={workflow} />
                </PageSection>
              </Tab>
            </Tabs>
          </PageSection>

          {isEditWizardOpen && (
            <MigrationWorkflowWizard
              isOpen
              workflow={workflow}
              onClose={() => setIsEditWizardOpen(false)}
              onSaved={() => {
                setIsEditWizardOpen(false);
                refetch();
              }}
            />
          )}

          {duplicateSeed && (
            <MigrationWorkflowWizard
              isOpen
              seedFrom={duplicateSeed}
              onClose={() => setDuplicateSeed(null)}
              onSaved={(created) => {
                setDuplicateSeed(null);
                history.push(
                  formatPath(Paths.agenticWorkflowDetails, {
                    workflowId: created.id,
                  })
                );
              }}
            />
          )}

          {isDeleteOpen && (
            <ConfirmDialog
              title="Delete migration workflow"
              titleIconVariant="warning"
              message={`Are you sure you want to delete "${workflow.name}"? This action cannot be undone.`}
              isOpen
              confirmBtnVariant={ButtonVariant.danger}
              confirmBtnLabel="Delete"
              cancelBtnLabel="Cancel"
              onCancel={() => setIsDeleteOpen(false)}
              onClose={() => setIsDeleteOpen(false)}
              onConfirm={() => {
                deleteWorkflow(workflow.id);
                setIsDeleteOpen(false);
              }}
            />
          )}
        </>
      )}
    </ConditionalRender>
  );
};

export default MigrationWorkflowDetails;
