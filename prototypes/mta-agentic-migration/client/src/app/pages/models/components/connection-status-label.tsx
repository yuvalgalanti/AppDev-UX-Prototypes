import * as React from "react";
import { Label, Popover } from "@patternfly/react-core";

import { Model } from "@app/api/models";

const statusToColor: Record<Model["connectionStatus"], React.ComponentProps<typeof Label>["color"]> = {
  Verified: "green",
  Pending: "orange",
  Unreachable: "red",
};

export const ConnectionStatusLabel: React.FC<{ model: Model }> = ({
  model,
}) => {
  const label = (
    <Label color={statusToColor[model.connectionStatus]} isCompact>
      {model.connectionStatus}
    </Label>
  );

  if (!model.connectionMessage) {
    return label;
  }

  return (
    <Popover
      triggerAction="hover"
      aria-label="connection status details"
      bodyContent={model.connectionMessage}
    >
      <span style={{ cursor: "pointer" }}>{label}</span>
    </Popover>
  );
};
