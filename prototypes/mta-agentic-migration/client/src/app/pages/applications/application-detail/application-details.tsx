import * as React from "react";
import { AxiosError } from "axios";
import { useHistory, useParams } from "react-router-dom";
import {
  Alert,
  AlertVariant,
  ButtonVariant,
  Divider,
  DividerVariant,
  Dropdown,
  DropdownItem,
  DropdownList,
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

import { ApplicationDetailsRoute, Paths } from "@app/Paths";
import { useHasSomeScopes } from "@app/auth";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ApplicationDependenciesForm } from "@app/components/ApplicationDependenciesFormContainer/ApplicationDependenciesForm";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { PageHeader } from "@app/components/PageHeader";
import { DrawerTabContent, ReviewFields } from "@app/components/detail-drawer";
import {
  useBulkDeleteApplicationMutation,
  useFetchApplications,
} from "@app/queries/applications";
import { useDeleteAssessmentMutation } from "@app/queries/assessments";
import { useDeleteReviewMutation } from "@app/queries/reviews";
import {
  TaskStates,
  useCancelTaskMutation,
  useFetchTaskDashboard,
} from "@app/queries/tasks";
import {
  analysesReadScopes,
  applicationsWriteScopes,
  assessmentWriteScopes,
  credentialsReadScopes,
  dependenciesWriteScopes,
  reviewsWriteScopes,
  tasksReadScopes,
  tasksWriteScopes,
} from "@app/scopes";
import { filterAndAddSeparator } from "@app/utils/grouping";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

import { TabDetailsContent } from "../application-detail-drawer/tab-details-content";
import { TabPlatformContent } from "../application-detail-drawer/tab-platform-content";
import { TabReportsContent } from "../application-detail-drawer/tab-reports-contents";
import { TabTagsContent } from "../application-detail-drawer/tab-tags-content";
import { TabTasksContent } from "../application-detail-drawer/tab-tasks-content";
import { ApplicationFormModal } from "../application-form";
import { ApplicationIdentityModal } from "../application-identity-form/application-identity-modal";
import { GenerateAssetsWizard } from "../generate-assets-wizard";
import { RetrieveConfigWizard } from "../retrieve-config-wizard";
import { DecoratedApplication, useDecoratedApplications } from "../useDecoratedApplications";

import { PlanRunsTab } from "./components/plan-runs-tab";

type TabKey =
  | "details"
  | "tags"
  | "reports"
  | "review"
  | "tasks"
  | "platform"
  | "plan-runs";

const ApplicationDetails: React.FC = () => {
  const history = useHistory();
  const { applicationId: applicationIdParam } =
    useParams<ApplicationDetailsRoute>();
  const applicationId = Number(applicationIdParam);
  const { pushNotification } = React.useContext(NotificationsContext);

  const [activeTabKey, setActiveTabKey] = React.useState<TabKey>("details");
  const [isActionsOpen, setIsActionsOpen] = React.useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [isDependenciesModalOpen, setIsDependenciesModalOpen] =
    React.useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] =
    React.useState(false);
  const [isRetrieveConfigOpen, setIsRetrieveConfigOpen] =
    React.useState(false);
  const [isGenerateAssetsOpen, setIsGenerateAssetsOpen] =
    React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isCancelOpen, setIsCancelOpen] = React.useState(false);
  const [isDiscardAssessmentOpen, setIsDiscardAssessmentOpen] =
    React.useState(false);
  const [isDiscardReviewOpen, setIsDiscardReviewOpen] = React.useState(false);

  const {
    data: baseApplications,
    isFetching: isFetchingApplications,
    error: applicationsFetchError,
  } = useFetchApplications();
  const { tasks } = useFetchTaskDashboard();
  const { applications } = useDecoratedApplications(baseApplications, tasks);

  const application = applications.find((a) => a.id === applicationId);

  const applicationWriteAccess = useHasSomeScopes(applicationsWriteScopes);
  const assessmentWriteAccess = useHasSomeScopes(assessmentWriteScopes);
  const reviewsWriteAccess = useHasSomeScopes(reviewsWriteScopes);
  const dependenciesWriteAccess = useHasSomeScopes(dependenciesWriteScopes);
  const credentialsReadAccess = useHasSomeScopes(credentialsReadScopes);
  const analysesReadAccess = useHasSomeScopes(analysesReadScopes);
  const tasksReadAccess = useHasSomeScopes(tasksReadScopes);
  const tasksWriteAccess = useHasSomeScopes(tasksWriteScopes);

  const isTaskCancellable = (app: DecoratedApplication) => {
    const task = app.tasks.currentAnalyzer;
    return !!task && !TaskStates.Terminal.includes(task?.state ?? "");
  };

  const { mutate: deleteAssessment } = useDeleteAssessmentMutation(
    (name) => {
      pushNotification({
        title: `Assessment for "${name}" discarded`,
        variant: "success",
      });
    },
    (error) => {
      pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
    }
  );

  const { mutate: deleteReview } = useDeleteReviewMutation(
    (name) => {
      pushNotification({
        title: `Review for "${name}" discarded`,
        variant: "success",
      });
    },
    (error) => {
      pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
    }
  );

  const { mutate: bulkDeleteApplication } = useBulkDeleteApplicationMutation(
    () => {
      pushNotification({
        title: `Application "${application?.name}" deleted`,
        variant: "success",
      });
      history.push(Paths.applications);
    },
    (error) => {
      pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
    }
  );

  const { mutate: cancelTask } = useCancelTaskMutation(
    () => {
      pushNotification({ title: "Task", message: "Canceled", variant: "info" });
    },
    () => {
      pushNotification({
        title: "Task",
        message: "Cancelation failed.",
        variant: "danger",
      });
    }
  );

  if (!isFetchingApplications && !application) {
    return (
      <PageSection hasBodyWrapper={false}>
        {applicationsFetchError ? (
          <Alert
            variant={AlertVariant.danger}
            title="Error loading application"
          >
            {getAxiosErrorMessage(applicationsFetchError as AxiosError)}
          </Alert>
        ) : (
          <Alert variant={AlertVariant.warning} title="Application not found">
            This application could not be found. It may have been deleted.
          </Alert>
        )}
      </PageSection>
    );
  }

  const actionItems = application
    ? filterAndAddSeparator(
        (index) => (
          <Divider key={`breakpoint-${index}`} component={DividerVariant.li} />
        ),
        [
          [
            applicationWriteAccess && (
              <DropdownItem key="edit" onClick={() => setIsEditModalOpen(true)}>
                Edit
              </DropdownItem>
            ),
          ],
          [
            assessmentWriteAccess && (
              <DropdownItem
                key="assess"
                onClick={() =>
                  history.push(
                    formatPath(Paths.applicationAssessmentActions, {
                      applicationId: application.id,
                    })
                  )
                }
              >
                Assess
              </DropdownItem>
            ),
            assessmentWriteAccess &&
              (application.assessments?.length ?? 0) > 0 && (
                <DropdownItem
                  key="discard-assessment"
                  onClick={() => setIsDiscardAssessmentOpen(true)}
                >
                  Discard assessment
                </DropdownItem>
              ),
            reviewsWriteAccess && (
              <DropdownItem
                key="review"
                onClick={() =>
                  history.push(
                    formatPath(Paths.applicationsReview, {
                      applicationId: application.id,
                    })
                  )
                }
              >
                Review
              </DropdownItem>
            ),
            reviewsWriteAccess && application.review && (
              <DropdownItem
                key="discard-review"
                onClick={() => setIsDiscardReviewOpen(true)}
              >
                Discard review
              </DropdownItem>
            ),
          ],
          [
            dependenciesWriteAccess && (
              <DropdownItem
                key="manage-dependencies"
                onClick={() => setIsDependenciesModalOpen(true)}
              >
                Manage dependencies
              </DropdownItem>
            ),
            credentialsReadAccess && applicationWriteAccess && (
              <DropdownItem
                key="manage-credentials"
                onClick={() => setIsCredentialsModalOpen(true)}
              >
                Manage credentials
              </DropdownItem>
            ),
          ],
          [
            analysesReadAccess &&
              !!application.tasks.currentAnalyzer && (
                <DropdownItem
                  key="analysis-details"
                  onClick={() => {
                    const taskId = application.tasks.currentAnalyzer?.id;
                    if (taskId) {
                      history.push(
                        formatPath(Paths.applicationsAnalysisDetails, {
                          applicationId: application.id,
                          taskId,
                        })
                      );
                    }
                  }}
                >
                  Analysis details
                </DropdownItem>
              ),
            tasksReadAccess &&
              tasksWriteAccess &&
              isTaskCancellable(application) && (
                <DropdownItem
                  key="cancel-analysis"
                  onClick={() => setIsCancelOpen(true)}
                >
                  Cancel analysis
                </DropdownItem>
              ),
          ],
          [
            applicationWriteAccess && tasksWriteAccess && (
              <DropdownItem
                key="retrieve-configurations"
                isDisabled={!application.isReadyForRetrieveConfigurations}
                onClick={() => setIsRetrieveConfigOpen(true)}
              >
                Retrieve configurations
              </DropdownItem>
            ),
            applicationWriteAccess && tasksWriteAccess && (
              <DropdownItem
                key="generate-assets"
                isDisabled={!application.isReadyForGenerateAssets}
                onClick={() => setIsGenerateAssetsOpen(true)}
              >
                Generate assets
              </DropdownItem>
            ),
          ],
          [
            applicationWriteAccess && (
              <DropdownItem
                key="delete"
                isDanger
                onClick={() => setIsDeleteOpen(true)}
              >
                Delete
              </DropdownItem>
            ),
          ],
        ]
      )
    : [];

  return (
    <ConditionalRender
      when={isFetchingApplications && !application}
      then={<AppPlaceholder />}
    >
      {application && (
        <>
          <PageSection hasBodyWrapper={false}>
            <PageHeader
              title={application.name}
              breadcrumbs={[
                { title: "Application inventory", path: Paths.applications },
                { title: application.name },
              ]}
              btnActions={
                <Dropdown
                  isOpen={isActionsOpen}
                  onOpenChange={setIsActionsOpen}
                  onSelect={() => setIsActionsOpen(false)}
                  popperProps={{ position: "right" }}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle
                      ref={toggleRef}
                      aria-label="Application actions"
                      variant="secondary"
                      onClick={() => setIsActionsOpen((open) => !open)}
                      isExpanded={isActionsOpen}
                    >
                      Actions
                    </MenuToggle>
                  )}
                >
                  <DropdownList>{actionItems}</DropdownList>
                </Dropdown>
              }
            />
          </PageSection>

          <PageSection hasBodyWrapper={false}>
            <Tabs
              activeKey={activeTabKey}
              onSelect={(_event, tabKey) => setActiveTabKey(tabKey as TabKey)}
              isOverflowHorizontal={{ showTabCount: true }}
            >
              <Tab
                eventKey="details"
                title={<TabTitleText>Details</TabTitleText>}
              >
                <PageSection hasBodyWrapper={false}>
                  <TabDetailsContent
                    application={application}
                    onCloseClick={() => {}}
                    onEditClick={() => setIsEditModalOpen(true)}
                  />
                </PageSection>
              </Tab>

              <Tab eventKey="tags" title={<TabTitleText>Tags</TabTitleText>}>
                <PageSection hasBodyWrapper={false}>
                  <TabTagsContent application={application} />
                </PageSection>
              </Tab>

              <Tab
                eventKey="reports"
                title={<TabTitleText>Reports</TabTitleText>}
              >
                <PageSection hasBodyWrapper={false}>
                  <TabReportsContent application={application} />
                </PageSection>
              </Tab>

              <Tab eventKey="review" title={<TabTitleText>Review</TabTitleText>}>
                <PageSection hasBodyWrapper={false}>
                  <DrawerTabContent>
                    <ReviewFields application={application} />
                  </DrawerTabContent>
                </PageSection>
              </Tab>

              <Tab eventKey="tasks" title={<TabTitleText>Tasks</TabTitleText>}>
                <PageSection hasBodyWrapper={false}>
                  <TabTasksContent application={application} />
                </PageSection>
              </Tab>

              <Tab
                eventKey="platform"
                title={<TabTitleText>Platform</TabTitleText>}
              >
                <PageSection hasBodyWrapper={false}>
                  <TabPlatformContent application={application} />
                </PageSection>
              </Tab>

              <Tab
                eventKey="plan-runs"
                title={<TabTitleText>Plan runs</TabTitleText>}
              >
                <PageSection hasBodyWrapper={false}>
                  <PlanRunsTab applicationId={application.id} />
                </PageSection>
              </Tab>
            </Tabs>
          </PageSection>

          <ApplicationFormModal
            isOpen={isEditModalOpen}
            application={application}
            onClose={() => setIsEditModalOpen(false)}
          />

          <ApplicationIdentityModal
            applications={isCredentialsModalOpen ? [application] : null}
            onClose={() => setIsCredentialsModalOpen(false)}
          />

          <RetrieveConfigWizard
            key={isRetrieveConfigOpen ? "retrieve-config-open" : "retrieve-config-closed"}
            applications={isRetrieveConfigOpen ? [application] : undefined}
            isOpen={isRetrieveConfigOpen}
            onClose={() => setIsRetrieveConfigOpen(false)}
          />

          <GenerateAssetsWizard
            key={isGenerateAssetsOpen ? "generate-assets-open" : "generate-assets-closed"}
            application={isGenerateAssetsOpen ? application : undefined}
            isOpen={isGenerateAssetsOpen}
            onClose={() => setIsGenerateAssetsOpen(false)}
          />

          <Modal
            isOpen={isDependenciesModalOpen}
            variant="medium"
            onClose={() => setIsDependenciesModalOpen(false)}
          >
            <ModalHeader
              title={`Manage dependencies for ${application.name}`}
            />
            <ModalBody>
              <ApplicationDependenciesForm
                application={application._}
                onCancel={() => setIsDependenciesModalOpen(false)}
              />
            </ModalBody>
          </Modal>

          <ConfirmDialog
            title={`Delete application "${application.name}"`}
            titleIconVariant="warning"
            isOpen={isDeleteOpen}
            message="This action cannot be undone."
            aria-label="Delete application"
            confirmBtnVariant={ButtonVariant.danger}
            confirmBtnLabel="Delete"
            cancelBtnLabel="Cancel"
            onCancel={() => setIsDeleteOpen(false)}
            onClose={() => setIsDeleteOpen(false)}
            onConfirm={() => {
              bulkDeleteApplication({ ids: [application.id] });
              setIsDeleteOpen(false);
            }}
          />

          <ConfirmDialog
            title="Cancel task"
            titleIconVariant="warning"
            isOpen={isCancelOpen}
            message="Are you sure you want to cancel this task?"
            aria-label="Cancel analysis task"
            confirmBtnVariant={ButtonVariant.danger}
            confirmBtnLabel="Cancel task"
            cancelBtnLabel="Cancel"
            onCancel={() => setIsCancelOpen(false)}
            onClose={() => setIsCancelOpen(false)}
            onConfirm={() => {
              const taskId = application.tasks.currentAnalyzer?.id;
              if (taskId) cancelTask(taskId);
              setIsCancelOpen(false);
            }}
          />

          <ConfirmDialog
            title="Discard assessment"
            titleIconVariant="warning"
            isOpen={isDiscardAssessmentOpen}
            message={`Are you sure you want to discard the assessment for "${application.name}"? This action cannot be undone.`}
            confirmBtnVariant={ButtonVariant.primary}
            confirmBtnLabel="Continue"
            cancelBtnLabel="Cancel"
            onCancel={() => setIsDiscardAssessmentOpen(false)}
            onClose={() => setIsDiscardAssessmentOpen(false)}
            onConfirm={() => {
              application.assessments?.forEach((assessment) => {
                deleteAssessment({
                  assessmentId: assessment.id,
                  applicationName: application.name,
                });
              });
              setIsDiscardAssessmentOpen(false);
            }}
          />

          <ConfirmDialog
            title="Discard review"
            titleIconVariant="warning"
            isOpen={isDiscardReviewOpen}
            message={`Are you sure you want to discard the review for "${application.name}"? This action cannot be undone.`}
            confirmBtnVariant={ButtonVariant.primary}
            confirmBtnLabel="Continue"
            cancelBtnLabel="Cancel"
            onCancel={() => setIsDiscardReviewOpen(false)}
            onClose={() => setIsDiscardReviewOpen(false)}
            onConfirm={() => {
              if (application.review) {
                deleteReview({
                  id: application.review.id,
                  name: application.name,
                });
              }
              setIsDiscardReviewOpen(false);
            }}
          />
        </>
      )}
    </ConditionalRender>
  );
};

export default ApplicationDetails;
