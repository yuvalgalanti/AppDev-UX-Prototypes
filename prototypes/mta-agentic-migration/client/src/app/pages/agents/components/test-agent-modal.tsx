import * as React from "react";
import {
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  TextArea,
} from "@patternfly/react-core";

import { Agent } from "@app/api/models";
import { NotificationsContext } from "@app/components/NotificationsContext";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";
import { useFetchApplications } from "@app/queries/applications";

export interface TestAgentModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Modal for running a single Agent against a single application as a
 * prototype-only "test run". This does not affect the application
 * repository; it simply queues a simulated test run and notifies the user.
 */
export const TestAgentModal: React.FC<TestAgentModalProps> = ({
  agent,
  isOpen,
  onClose,
}) => {
  const { pushNotification } = React.useContext(NotificationsContext);
  const { data: applications } = useFetchApplications();

  const [applicationId, setApplicationId] = React.useState("");
  const [taskDescription, setTaskDescription] = React.useState("");

  // Reset the form each time the modal is opened for a (possibly new) agent.
  React.useEffect(() => {
    if (isOpen) {
      setApplicationId("");
      setTaskDescription("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, agent?.id]);

  const applicationOptions = applications.map((app) => ({
    value: String(app.id),
    label: app.name,
  }));

  const isValid = !!applicationId && !!taskDescription.trim();

  const handleStartTestRun = () => {
    if (!agent || !isValid) return;
    pushNotification({
      title: `Test run for ${agent.name} queued`,
      variant: "success",
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="medium"
      aria-label="Test agent"
    >
      <ModalHeader
        title={agent ? `Test ${agent.name}` : "Test agent"}
        description="Run this Agent against an application to observe its behavior."
      />
      <ModalBody>
        <Form>
          <Alert
            variant="info"
            isInline
            title="Prototype boundary"
            style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}
          >
            A test run executes this Agent against a single application.
            Results are informational and do not affect the application
            repository.
          </Alert>
          <FormGroup label="Application" isRequired fieldId="test-agent-application">
            <SimpleSelect
              toggleId="test-agent-application-toggle"
              toggleAriaLabel="Select application"
              ariaLabel="Application"
              isFullWidth
              placeholderText="Select an application..."
              value={applicationId}
              options={applicationOptions}
              onSelect={(selection) => setApplicationId(selection ?? "")}
            />
          </FormGroup>
          <FormGroup label="Task description" isRequired fieldId="test-agent-task-description">
            <TextArea
              id="test-agent-task-description"
              value={taskDescription}
              onChange={(_, value) => setTaskDescription(value)}
              aria-label="Task description"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  Describe the task the Agent should perform.
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant={ButtonVariant.primary}
          isDisabled={!isValid}
          onClick={handleStartTestRun}
        >
          Start test run
        </Button>
        <Button variant={ButtonVariant.link} onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
