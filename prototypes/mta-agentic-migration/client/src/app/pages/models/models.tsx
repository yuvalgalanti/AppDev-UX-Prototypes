import * as React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Content,
  EmptyState,
  EmptyStateBody,
  Label,
  PageSection,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { CubesIcon, PencilAltIcon, StarIcon } from "@patternfly/react-icons";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { Model } from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { OverflowActionMenu } from "@app/components/overflow-action-menu";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useFetchAgents } from "@app/queries/agents";
import {
  useDeleteModelMutation,
  useFetchModels,
  useSetDefaultModelMutation,
} from "@app/queries/models";
import { addSeparatorForOverflow } from "@app/utils/grouping";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { ConnectionStatusLabel } from "./components/connection-status-label";
import { ModelFormModal } from "./components/model-form-modal";

export const Models: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);

  const [modelToDelete, setModelToDelete] = React.useState<Model>();
  const [createUpdateModalState, setCreateUpdateModalState] = React.useState<
    "create" | Model | undefined
  >(undefined);

  const { models, isFetching, fetchError } = useFetchModels();
  const { agents } = useFetchAgents();
  const deletedModelNameRef = React.useRef<string>("");

  const usedByCount = React.useMemo(() => {
    const counts: Record<string, number> = {};
    agents.forEach((agent) => {
      if (agent.model) {
        counts[agent.model] = (counts[agent.model] || 0) + 1;
      }
    });
    return counts;
  }, [agents]);

  const onMutationError = (error: AxiosError) => {
    pushNotification({
      title: getAxiosErrorMessage(error),
      variant: "danger",
    });
  };

  const { mutate: deleteModel } = useDeleteModelMutation(() => {
    pushNotification({
      title: t("toastr.success.deletedWhat", {
        what: deletedModelNameRef.current,
        type: "Model",
      }),
      variant: "success",
    });
  }, onMutationError);

  const { mutate: setDefaultModel } = useSetDefaultModelMutation(() => {
    pushNotification({
      title: "Default model updated",
      variant: "success",
    });
  }, onMutationError);

  const tableControls = useLocalTableControls({
    tableName: "models-table",
    idProperty: "id",
    dataNameProperty: "name",
    items: models,
    columnNames: {
      name: t("terms.name"),
      provider: "Provider",
      modelId: "Model ID",
      connectionStatus: "Connection",
      usedBy: "Used by",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    hasActionsColumn: true,
    filterCategories: [
      {
        categoryKey: "name",
        title: "Name",
        type: FilterType.search,
        placeholderText: "Filter by name...",
        getItemValue: (item) => item?.name || "",
      },
      {
        categoryKey: "provider",
        title: "Provider",
        type: FilterType.search,
        placeholderText: "Filter by provider...",
        getItemValue: (item) => item?.provider || "",
      },
      {
        categoryKey: "connectionStatus",
        title: "Connection",
        type: FilterType.select,
        placeholderText: "Filter by connection status...",
        selectOptions: [
          { value: "Verified", label: "Verified" },
          { value: "Pending", label: "Pending" },
          { value: "Unreachable", label: "Unreachable" },
        ],
        getItemValue: (item) => item.connectionStatus || "",
      },
    ],
    initialItemsPerPage: 10,
    sortableColumns: ["name", "provider", "connectionStatus"],
    initialSort: { columnKey: "name", direction: "asc" },
    getSortValues: (item) => ({
      name: item?.name || "",
      provider: item?.provider || "",
      connectionStatus: item?.connectionStatus || "",
    }),
    isLoading: isFetching,
  });

  const {
    currentPageItems,
    numRenderedColumns,
    propHelpers: {
      toolbarProps,
      filterToolbarProps,
      paginationToolbarItemProps,
      paginationProps,
      tableProps,
      getThProps,
      getTrProps,
      getTdProps,
    },
  } = tableControls;

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">Models</Content>
          <Content component="p">
            Approved LLMs that can be assigned to Agents. Configure the
            provider connection details and mark one Model as the
            organizational default.
          </Content>
        </Content>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <ConditionalRender
          when={isFetching && !(models || fetchError)}
          then={<AppPlaceholder />}
        >
          <div
            style={{
              backgroundColor:
                "var(--pf-t--global--background--color--primary--default)",
            }}
          >
            <Toolbar {...toolbarProps}>
              <ToolbarContent>
                <FilterToolbar {...filterToolbarProps} />
                <ToolbarGroup variant="action-group">
                  <ToolbarItem>
                    <Button
                      size="sm"
                      onClick={() => setCreateUpdateModalState("create")}
                      variant="primary"
                      id="create-model-button"
                    >
                      Create model
                    </Button>
                  </ToolbarItem>
                </ToolbarGroup>
                <ToolbarItem {...paginationToolbarItemProps}>
                  <SimplePagination
                    idPrefix="models-table"
                    isTop
                    paginationProps={paginationProps}
                  />
                </ToolbarItem>
              </ToolbarContent>
            </Toolbar>

            <Table {...tableProps} id="models-table" aria-label="Models table">
              <Thead>
                <Tr>
                  <TableHeaderContentWithControls {...tableControls}>
                    <Th width={25} {...getThProps({ columnKey: "name" })} />
                    <Th width={15} {...getThProps({ columnKey: "provider" })} />
                    <Th width={20} {...getThProps({ columnKey: "modelId" })} />
                    <Th
                      width={15}
                      {...getThProps({ columnKey: "connectionStatus" })}
                    />
                    <Th width={10} {...getThProps({ columnKey: "usedBy" })} />
                    <Th screenReaderText={t("actions.rowActions")} />
                  </TableHeaderContentWithControls>
                </Tr>
              </Thead>
              <ConditionalTableBody
                isLoading={isFetching}
                isError={!!fetchError}
                isNoData={currentPageItems.length === 0}
                noDataEmptyState={
                  <EmptyState
                    headingLevel="h2"
                    icon={CubesIcon}
                    titleText="No models available"
                    variant="sm"
                  >
                    <EmptyStateBody>
                      Create a Model to make it available for Agents.
                    </EmptyStateBody>
                  </EmptyState>
                }
                numRenderedColumns={numRenderedColumns}
              >
                <Tbody>
                  {currentPageItems?.map((model, rowIndex) => (
                    <Tr key={model.id} {...getTrProps({ item: model })}>
                      <TableRowContentWithControls
                        {...tableControls}
                        item={model}
                        rowIndex={rowIndex}
                      >
                        <Td
                          modifier="truncate"
                          width={25}
                          {...getTdProps({ columnKey: "name" })}
                        >
                          {model.name}
                          {model.isDefault && (
                            <Label
                              isCompact
                              color="blue"
                              icon={<StarIcon />}
                              style={{ marginLeft: 8 }}
                            >
                              Default
                            </Label>
                          )}
                        </Td>
                        <Td
                          modifier="truncate"
                          width={15}
                          {...getTdProps({ columnKey: "provider" })}
                        >
                          {model.provider}
                        </Td>
                        <Td
                          modifier="truncate"
                          width={20}
                          {...getTdProps({ columnKey: "modelId" })}
                        >
                          <code>{model.modelId}</code>
                        </Td>
                        <Td
                          width={15}
                          {...getTdProps({ columnKey: "connectionStatus" })}
                        >
                          <ConnectionStatusLabel model={model} />
                        </Td>
                        <Td width={10} {...getTdProps({ columnKey: "usedBy" })}>
                          {usedByCount[model.modelId] || 0} agent
                          {(usedByCount[model.modelId] || 0) === 1 ? "" : "s"}
                        </Td>
                        <Td isActionCell>
                          <OverflowActionMenu
                            toggleId="row-actions"
                            toggleAriaLabel={t("actions.rowActions")}
                            items={addSeparatorForOverflow(
                              (index, isShared) => ({
                                isSeparator: true,
                                itemKey: `separator-${index}`,
                                isShared,
                              }),
                              [
                                [
                                  {
                                    title: t("actions.edit"),
                                    "aria-label": t("actions.edit"),
                                    variant: "plain",
                                    icon: <PencilAltIcon />,
                                    itemKey: "edit",
                                    isShared: true,
                                    ouiaId: "pencil-action",
                                    useOnlyIconWhenShared: true,
                                    tooltipProps: {
                                      content: t("actions.edit"),
                                    },
                                    onClick: () =>
                                      setCreateUpdateModalState(model),
                                  },
                                ],
                                [
                                  !model.isDefault && {
                                    title: "Set as default",
                                    itemKey: "setAsDefault",
                                    onClick: () => setDefaultModel(model.id),
                                  },
                                ],
                                [
                                  {
                                    isDanger: true,
                                    title: t("actions.delete"),
                                    itemKey: "delete",
                                    onClick: () => setModelToDelete(model),
                                    isAriaDisabled: model.isDefault,
                                    tooltipProps: model.isDefault
                                      ? {
                                          content:
                                            "The default Model cannot be deleted.",
                                        }
                                      : undefined,
                                  },
                                ],
                              ]
                            )}
                          />
                        </Td>
                      </TableRowContentWithControls>
                    </Tr>
                  ))}
                </Tbody>
              </ConditionalTableBody>
            </Table>
            <SimplePagination
              idPrefix="models-table"
              isTop={false}
              paginationProps={paginationProps}
            />
          </div>
        </ConditionalRender>

        <ModelFormModal
          isOpen={createUpdateModalState !== undefined}
          model={
            createUpdateModalState === "create"
              ? undefined
              : createUpdateModalState
          }
          models={models}
          onClose={() => setCreateUpdateModalState(undefined)}
        />

        {modelToDelete ? (
          <ConfirmDialog
            title={t("dialog.title.deleteWithName", {
              what: "model",
              name: modelToDelete.name,
            })}
            titleIconVariant="warning"
            message={t("dialog.message.delete")}
            isOpen
            confirmBtnVariant={ButtonVariant.danger}
            confirmBtnLabel={t("actions.delete")}
            cancelBtnLabel={t("actions.cancel")}
            onCancel={() => setModelToDelete(undefined)}
            onClose={() => setModelToDelete(undefined)}
            onConfirm={() => {
              deletedModelNameRef.current = modelToDelete.name;
              deleteModel(modelToDelete.id);
              setModelToDelete(undefined);
            }}
          />
        ) : null}
      </PageSection>
    </>
  );
};

export default Models;
