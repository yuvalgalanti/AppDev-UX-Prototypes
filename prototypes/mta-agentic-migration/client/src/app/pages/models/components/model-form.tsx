import * as React from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { object, string } from "yup";
import { ActionGroup, Button, ButtonVariant, Form } from "@patternfly/react-core";

import { Model, New } from "@app/api/models";
import SimpleSelect from "@app/components/FilterToolbar/components/SimpleSelect";
import {
  HookFormPFGroupController,
  HookFormPFTextInput,
} from "@app/components/HookFormPFFields";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { useFetchIdentities } from "@app/queries/identities";
import {
  useCreateModelMutation,
  useUpdateModelMutation,
} from "@app/queries/models";
import { duplicateNameCheck } from "@app/utils/utils";

interface FormValues {
  name: string;
  description: string;
  provider: string;
  modelId: string;
  endpoint: string;
  credentialId: string;
}

export interface ModelFormProps {
  model: Model | null;
  models: Model[];
  onClose: () => void;
}

export const ModelForm: React.FC<ModelFormProps> = ({
  model,
  models,
  onClose,
}) => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const { identities } = useFetchIdentities();

  const credentialOptions = identities.map((identity) => ({
    value: String(identity.id),
    label: identity.name,
  }));

  const onCreateOrUpdateSuccess = (data: Model) => {
    pushNotification({
      title: t(model ? "toastr.success.saveWhat" : "toastr.success.createWhat", {
        type: "Model",
        what: data.name,
      }),
      variant: "success",
    });
    onClose();
  };

  const onCreateOrUpdateError = (_error: AxiosError) => {
    pushNotification({
      title: t(model ? "toastr.fail.save" : "toastr.fail.create", {
        type: "Model",
      }),
      variant: "danger",
    });
  };

  const { mutate: createModel } = useCreateModelMutation(
    onCreateOrUpdateSuccess,
    onCreateOrUpdateError
  );
  const { mutate: updateModel } = useUpdateModelMutation(
    onCreateOrUpdateSuccess,
    onCreateOrUpdateError
  );

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .test(
        "Duplicate name",
        "A Model with this name already exists. Use a different name.",
        (value) => duplicateNameCheck(models, model || null, value || "")
      ),
    description: string(),
    provider: string().trim().required(t("validation.required")),
    modelId: string().trim().required(t("validation.required")),
    endpoint: string(),
    credentialId: string().required(t("validation.required")),
  });

  const {
    handleSubmit,
    formState: { isSubmitting, isValidating, isValid, isDirty },
    control,
  } = useForm<FormValues>({
    defaultValues: {
      name: model?.name || "",
      description: model?.description || "",
      provider: model?.provider || "",
      modelId: model?.modelId || "",
      endpoint: model?.endpoint || "",
      credentialId: model?.credentialId ? String(model.credentialId) : "",
    },
    resolver: yupResolver(validationSchema),
    mode: "all",
  });

  const onSubmit = (formValues: FormValues) => {
    const payload: New<Model> = {
      name: formValues.name.trim(),
      description: formValues.description.trim() || undefined,
      provider: formValues.provider.trim(),
      modelId: formValues.modelId.trim(),
      endpoint: formValues.endpoint.trim() || undefined,
      credentialId: Number(formValues.credentialId),
      connectionStatus: model?.connectionStatus ?? "Pending",
      connectionMessage:
        model?.connectionMessage ??
        "Verification has not been run for this Model.",
      isDefault: model?.isDefault ?? false,
      createdAt: model?.createdAt || new Date().toISOString(),
    };

    if (model) {
      updateModel({ id: model.id, ...payload });
    } else {
      createModel(payload);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <HookFormPFTextInput
        control={control}
        name="name"
        label={t("terms.name")}
        fieldId="model-name"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="description"
        label="Description"
        fieldId="model-description"
      />
      <HookFormPFTextInput
        control={control}
        name="provider"
        label="Provider"
        fieldId="model-provider"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="modelId"
        label="Model ID"
        fieldId="model-model-id"
        isRequired
      />
      <HookFormPFTextInput
        control={control}
        name="endpoint"
        label="Endpoint"
        fieldId="model-endpoint"
      />
      <HookFormPFGroupController
        control={control}
        name="credentialId"
        label="Credential"
        fieldId="model-credential-select"
        isRequired
        helperText="Select the credential reference used to connect to this provider. Secret values are not shown here."
        renderInput={({ field: { value, name, onChange } }) => (
          <SimpleSelect
            toggleId="model-credential-select-toggle"
            toggleAriaLabel="Model credential select dropdown toggle"
            ariaLabel={name}
            placeholderText="Select a credential..."
            value={value}
            options={credentialOptions}
            onSelect={(selection) => onChange(selection ?? "")}
          />
        )}
      />
      <ActionGroup>
        <Button
          type="submit"
          id="submit"
          aria-label="submit"
          variant={ButtonVariant.primary}
          isDisabled={!isValid || isSubmitting || isValidating || !isDirty}
        >
          {!model ? t("actions.create") : t("actions.save")}
        </Button>
        <Button
          type="button"
          id="cancel"
          aria-label="cancel"
          variant={ButtonVariant.link}
          isDisabled={isSubmitting || isValidating}
          onClick={onClose}
        >
          {t("actions.cancel")}
        </Button>
      </ActionGroup>
    </Form>
  );
};
