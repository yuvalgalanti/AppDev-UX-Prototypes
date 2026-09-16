import * as React from "react";
import { AxiosError } from "axios";
import { useHistory } from "react-router-dom";
import {
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextInput,
} from "@patternfly/react-core";

import { Paths } from "@app/Paths";
import { Ref } from "@app/api/models";
import { MultiSelect } from "@app/components/FilterToolbar/components/MultiSelect";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useFetchApplications } from "@app/queries/applications";
import {
  useFetchMigrationWorkflows,
  useStartWorkflowRunMutation,
} from "@app/queries/migration-workflows";
import { formatPath, getAxiosErrorMessage } from "@app/utils/utils";

export interface StartWorkflowRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Application ids to pre-select in the "Applications" field, e.g. when
   * launching a run from the Application Inventory page with rows selected. */
  initialApplicationIds?: number[];
}

/**
 * Modal for starting a new migration workflow run. Lets the user pick a
 * workflow, the applications to run it against, and a target git branch.
 *
 * Shared between the global "Workflow Runs" page and the "Run migration
 * workflow" action on the Application Inventory page.
 */
export const StartWorkflowRunModal: React.FC<StartWorkflowRunModalProps> = ({
  isOpen,
  onClose,
  initialApplicationIds,
}) => {
  const history = useHistory();
  const { pushNotification } = React.useContext(NotificationsContext);

  const { workflows } = useFetchMigrationWorkflows();
  const { data: applications } = useFetchApplications();

  const [selectedWorkflowId, setSelectedWorkflowId] =
    React.useState<string>("");
  const [selectedAppIds, setSelectedAppIds] = React.useState<string[]>([]);
  const [targetBranch, setTargetBranch] = React.useState("migration/main");

  // Reset (and seed) the form state each time the modal is opened.
  React.useEffect(() => {
    if (isOpen) {
      setSelectedWorkflowId("");
      setSelectedAppIds((initialApplicationIds ?? []).map(String));
      setTargetBranch("migration/main");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const realWorkflows = workflows.filter((w) => !w.isTemplate);
  const workflowOptions = realWorkflows.map((w) => ({
    value: String(w.id),
    label: w.name,
  }));
  const appOptions = applications.map((a) => ({
    value: String(a.id),
    label: a.name,
  }));

  const onStartError = (error: AxiosError) => {
    pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
  };
  const { mutate: startRun, isPending: isStarting } =
    useStartWorkflowRunMutation((run) => {
      pushNotification({ title: "Run started", variant: "success" });
      onClose();
      history.push(
        formatPath(Paths.agenticWorkflowRunDetails, {
          workflowId: run.workflowId,
          runName: run.name,
        })
      );
    }, onStartError);

  const handleStartRun = () => {
    if (!selectedWorkflowId) return;
    const selectedApps: Ref[] = selectedAppIds
      .map((idStr) => {
        const app = applications.find((a) => a.id === Number(idStr));
        return app ? { id: app.id, name: app.name } : null;
      })
      .filter(Boolean) as Ref[];

    startRun({
      workflowId: Number(selectedWorkflowId),
      applications: selectedApps,
      targetBranch,
    });
  };

  const toggleAppSelection = (value: string) => {
    setSelectedAppIds((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="medium"
      aria-label="Start workflow run"
    >
      <ModalHeader title="Start workflow run" />
      <ModalBody>
        <Form>
          <FormGroup label="Workflow" isRequired fieldId="run-workflow">
            <SimpleSelect
              toggleId="run-workflow-toggle"
              toggleAriaLabel="Select workflow"
              ariaLabel="Workflow"
              isFullWidth
              value={selectedWorkflowId}
              options={workflowOptions}
              onSelect={(selection) => setSelectedWorkflowId(selection ?? "")}
            />
          </FormGroup>
          <FormGroup label="Applications" fieldId="run-applications">
            <MultiSelect
              toggleId="run-applications-toggle"
              toggleAriaLabel="Select applications"
              aria-label="Applications"
              placeholderText="Select applications..."
              values={selectedAppIds}
              hasChips
              options={appOptions}
              onSelect={(selection) => {
                if (selection) toggleAppSelection(selection);
              }}
              onClear={() => setSelectedAppIds([])}
            />
          </FormGroup>
          <FormGroup label="Target branch" isRequired fieldId="run-target-branch">
            <TextInput
              id="run-target-branch"
              value={targetBranch}
              onChange={(_, value) => setTargetBranch(value)}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant={ButtonVariant.primary}
          isDisabled={!selectedWorkflowId || !targetBranch.trim() || isStarting}
          isLoading={isStarting}
          onClick={handleStartRun}
        >
          Start run
        </Button>
        <Button variant={ButtonVariant.link} onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
