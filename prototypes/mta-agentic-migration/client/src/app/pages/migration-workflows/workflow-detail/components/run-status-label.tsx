import * as React from "react";
import { Label } from "@patternfly/react-core";
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  InProgressIcon,
  PauseCircleIcon,
  PendingIcon,
} from "@patternfly/react-icons";

import { WorkflowRunStatus } from "@app/api/models";

const STATUS_CONFIG: Record<
  WorkflowRunStatus,
  {
    label: string;
    status?: "success" | "warning" | "danger" | "info" | "custom";
    icon: React.ReactNode;
  }
> = {
  Pending: { label: "Pending", icon: <PendingIcon /> },
  Running: { label: "Running", status: "info", icon: <InProgressIcon /> },
  AwaitingApproval: {
    label: "Awaiting approval",
    status: "warning",
    icon: <PauseCircleIcon />,
  },
  Succeeded: { label: "Succeeded", status: "success", icon: <CheckCircleIcon /> },
  Failed: { label: "Failed", status: "danger", icon: <ExclamationCircleIcon /> },
};

export const RunStatusLabel: React.FC<{
  status: WorkflowRunStatus;
  isCompact?: boolean;
}> = ({ status, isCompact = true }) => {
  const config = STATUS_CONFIG[status];
  return (
    <Label status={config.status} icon={config.icon} isCompact={isCompact}>
      {config.label}
    </Label>
  );
};
