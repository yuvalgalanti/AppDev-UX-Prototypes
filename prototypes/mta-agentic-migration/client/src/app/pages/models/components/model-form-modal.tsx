import * as React from "react";
import { Modal, ModalBody, ModalHeader } from "@patternfly/react-core";

import { Model } from "@app/api/models";

import { ModelForm } from "./model-form";

export interface ModelFormModalProps {
  isOpen: boolean;
  model?: Model;
  models: Model[];
  onClose: () => void;
}

export const ModelFormModal: React.FC<ModelFormModalProps> = ({
  isOpen,
  model,
  models,
  onClose,
}) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal id="model-modal" isOpen variant="medium" onClose={onClose}>
      <ModalHeader title={model ? "Edit model" : "Create new model"} />
      <ModalBody>
        <ModelForm key={model?.id ?? 0} model={model ?? null} models={models} onClose={onClose} />
      </ModalBody>
    </Modal>
  );
};
