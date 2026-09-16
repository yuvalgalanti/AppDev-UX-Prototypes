import * as React from "react";
import { AxiosError } from "axios";
import {
  Alert,
  Button,
  ButtonVariant,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Radio,
  TextInput,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { Application, MigrationWorkflow, Ref } from "@app/api/models";
import { MultiSelect } from "@app/components/FilterToolbar/components/MultiSelect";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useFetchArchetypes } from "@app/queries/archetypes";
import { useFetchApplications } from "@app/queries/applications";
import {
  useFetchMigrationWorkflows,
  useStartWorkflowRunMutation,
} from "@app/queries/migration-workflows";
import { getAxiosErrorMessage } from "@app/utils/utils";

export interface StartMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Application ids to pre-select, e.g. when launching from the Application
   * Inventory page or an Application's own "Plan runs" tab with rows already
   * selected. When provided, the Applications picker is hidden and the modal
   * simply reviews readiness for this fixed set. */
  initialApplicationIds?: number[];
}

type PlanMode = "recommended" | "override";

/**
 * Modal for starting a migration for one or more applications. Resolves each
 * application's recommended Plan (via its Archetype), lets the user override
 * that resolution with a specific Plan, and reviews readiness before kicking
 * off one run per resolved Plan.
 *
 * Shared between the global "Plan Runs" page, an Application's "Plan runs"
 * tab, and the "Run migration plan" action on the Application Inventory page.
 */
export const StartMigrationModal: React.FC<StartMigrationModalProps> = ({
  isOpen,
  onClose,
  initialApplicationIds,
}) => {
  const { pushNotification } = React.useContext(NotificationsContext);

  const { workflows } = useFetchMigrationWorkflows();
  const { data: applications } = useFetchApplications();
  const { archetypesById } = useFetchArchetypes();

  const [selectedAppIds, setSelectedAppIds] = React.useState<string[]>([]);
  const [planMode, setPlanMode] = React.useState<PlanMode>("recommended");
  const [overrideWorkflowId, setOverrideWorkflowId] = React.useState("");
  const [targetBranch, setTargetBranch] = React.useState("migration/main");

  // Reset (and seed) the form state each time the modal is opened.
  React.useEffect(() => {
    if (isOpen) {
      setSelectedAppIds((initialApplicationIds ?? []).map(String));
      setPlanMode("recommended");
      setOverrideWorkflowId("");
      setTargetBranch("migration/main");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const showApplicationPicker = !initialApplicationIds?.length;

  const realWorkflows = workflows.filter((w) => !w.isTemplate);
  const workflowOptions = realWorkflows.map((w) => ({
    value: String(w.id),
    label: w.name,
  }));
  const appOptions = applications.map((a) => ({
    value: String(a.id),
    label: a.name,
  }));

  const selectedApps = selectedAppIds
    .map((idStr) => applications.find((a) => a.id === Number(idStr)))
    .filter((a): a is Application => !!a);

  /** For "recommended" mode, resolve a Plan from the application's Archetype. */
  const recommendedWorkflowFor = (app: Application) => {
    const archetypeIds = (app.archetypes ?? []).map((a) => a.id);
    return realWorkflows.find(
      (w) => w.archetypeId != null && archetypeIds.includes(w.archetypeId)
    );
  };

  const overrideWorkflow =
    planMode === "override"
      ? realWorkflows.find((w) => w.id === Number(overrideWorkflowId))
      : undefined;

  const targetProfileNames = (workflow: MigrationWorkflow) => {
    const archetype = workflow.archetypeId
      ? archetypesById[workflow.archetypeId]
      : undefined;
    if (!archetype) return [];
    return (workflow.targetProfileIds ?? [])
      .map((id) => archetype.profiles?.find((p) => p.id === id)?.name)
      .filter((name): name is string => !!name);
  };

  const rows = selectedApps.map((app) => {
    const workflow =
      planMode === "override" ? overrideWorkflow : recommendedWorkflowFor(app);
    return {
      app,
      workflow,
      targetProfiles: workflow ? targetProfileNames(workflow) : [],
      isReady: !!workflow,
    };
  });

  const readyRows = rows.filter((r) => r.isReady);

  const onStartError = (error: AxiosError) => {
    pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
  };
  const { mutateAsync: startRun, isPending: isStarting } =
    useStartWorkflowRunMutation(() => {
      // Per-run success is consolidated into a single notification below.
    }, onStartError);

  const handleStart = async () => {
    if (readyRows.length === 0 || !targetBranch.trim()) return;

    const appsByWorkflowId = new Map<number, Ref[]>();
    readyRows.forEach(({ app, workflow }) => {
      if (!workflow) return;
      const list = appsByWorkflowId.get(workflow.id) ?? [];
      list.push({ id: app.id, name: app.name });
      appsByWorkflowId.set(workflow.id, list);
    });

    try {
      await Promise.all(
        Array.from(appsByWorkflowId.entries()).map(([workflowId, apps]) =>
          startRun({ workflowId, applications: apps, targetBranch })
        )
      );
      pushNotification({
        title: `Started migration for ${readyRows.length} application${
          readyRows.length === 1 ? "" : "s"
        }`,
        variant: "success",
      });
      onClose();
    } catch {
      // Individual errors are already surfaced via onStartError.
    }
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
      variant="large"
      aria-label="Start Migration"
    >
      <ModalHeader
        title="Start Migration"
        description={`Review the resolved Plan and readiness for ${selectedApps.length} selected application${selectedApps.length === 1 ? "" : "s"}.`}
      />
      <ModalBody>
        <Form>
          <Alert
            variant="info"
            isInline
            title="Application-specific validation"
            style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}
          >
            Preflight is a Hub UX projection for the selected application,
            resolved Plan, credential references, parameters, Model
            availability, and Skills. The current Hub OpenAPI does not yet
            define this endpoint.
          </Alert>

          {showApplicationPicker && (
            <FormGroup label="Applications" isRequired fieldId="start-migration-applications">
              <MultiSelect
                toggleId="start-migration-applications-toggle"
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
          )}

          <FormGroup role="radiogroup" label="Plan selection" fieldId="start-migration-plan-mode">
            <Radio
              id="plan-mode-recommended"
              name="plan-mode"
              label="Use recommended Plan"
              description="Each application will use the Plan assigned to its migration path."
              isChecked={planMode === "recommended"}
              onChange={() => setPlanMode("recommended")}
            />
            <Radio
              id="plan-mode-override"
              name="plan-mode"
              label="Override with a specific Plan"
              description="All selected applications will use this Plan regardless of their archetype or target profile."
              isChecked={planMode === "override"}
              onChange={() => setPlanMode("override")}
            />
          </FormGroup>

          {planMode === "override" && (
            <>
              <FormGroup label="Plan override" isRequired fieldId="start-migration-plan-override">
                <SimpleSelect
                  toggleId="start-migration-plan-override-toggle"
                  toggleAriaLabel="Plan override"
                  ariaLabel="Plan override"
                  isFullWidth
                  placeholderText="Select a Plan..."
                  value={overrideWorkflowId}
                  options={workflowOptions}
                  onSelect={(selection) => setOverrideWorkflowId(selection ?? "")}
                />
              </FormGroup>
              <Alert
                variant="warning"
                isInline
                title="Expert override"
                style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}
              >
                Overriding the recommended Plan bypasses archetype and target
                profile resolution. Use only when a specific Plan is
                required.
              </Alert>
            </>
          )}

          <FormGroup label="Target branch" isRequired fieldId="start-migration-target-branch">
            <TextInput
              id="start-migration-target-branch"
              value={targetBranch}
              onChange={(_, value) => setTargetBranch(value)}
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  The Git branch where migration changes will be committed.
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          {rows.length > 0 && (
            <Table aria-label="Migration readiness table" variant="compact">
              <Thead>
                <Tr>
                  <Th>Application</Th>
                  <Th>Target profiles</Th>
                  <Th>Resolved Plan</Th>
                  <Th>Readiness</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.map(({ app, workflow, targetProfiles, isReady }) => (
                  <Tr key={app.id}>
                    <Td dataLabel="Application">{app.name}</Td>
                    <Td dataLabel="Target profiles">
                      {targetProfiles.length > 0 ? targetProfiles.join(", ") : "—"}
                    </Td>
                    <Td dataLabel="Resolved Plan">
                      {workflow ? workflow.name : "—"}
                    </Td>
                    <Td dataLabel="Readiness">
                      <Label isCompact color={isReady ? "green" : "grey"}>
                        {isReady ? "Ready" : "Not ready"}
                      </Label>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant={ButtonVariant.primary}
          isDisabled={readyRows.length === 0 || !targetBranch.trim() || isStarting}
          isLoading={isStarting}
          onClick={handleStart}
        >
          {`Start ${readyRows.length} Ready Application${readyRows.length === 1 ? "" : "s"}`}
        </Button>
        <Button variant={ButtonVariant.link} onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
