import * as React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";
import {
  Button,
  ButtonVariant,
  Content,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateBody,
  FileUpload,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Label,
  LabelGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  TextArea,
  TextInput,
  ToggleGroup,
  ToggleGroupItem,
  Toolbar,
  ToolbarContent,
  ToolbarGroup,
  ToolbarItem,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";
import {
  ActionsColumn,
  IAction,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import {
  New,
  Skill,
  SkillAssociation,
  SkillCollection,
  SkillSource,
  SkillSourceType,
} from "@app/api/models";
import { AppPlaceholder } from "@app/components/AppPlaceholder";
import { ConditionalRender } from "@app/components/ConditionalRender";
import { ConfirmDialog } from "@app/components/ConfirmDialog";
import { FilterToolbar, FilterType } from "@app/components/FilterToolbar";
import { MultiSelect } from "@app/components/FilterToolbar/components/MultiSelect";
import { NotificationsContext } from "@app/components/NotificationsContext";
import { SimplePagination } from "@app/components/SimplePagination";
import {
  ConditionalTableBody,
  TableHeaderContentWithControls,
  TableRowContentWithControls,
} from "@app/components/TableControls";
import { ToolbarBulkSelector } from "@app/components/ToolbarBulkSelector";
import { useBulkSelection } from "@app/hooks/selection/useBulkSelection";
import { useLocalTableControls } from "@app/hooks/table-controls";
import { useFetchAgents } from "@app/queries/agents";
import { useFetchApplications } from "@app/queries/applications";
import { useFetchArchetypes } from "@app/queries/archetypes";
import {
  useDeleteSkillCollectionMutation,
  useFetchSkillCollections,
} from "@app/queries/skill-collections";
import {
  useCreateSkillMutation,
  useDeleteSkillMutation,
  useFetchSkills,
  useUpdateSkillMutation,
} from "@app/queries/skills";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { CollectionViewModal } from "./components/collection-view-modal";
import { SkillCollectionFormModal } from "./components/skill-collection-form-modal";

const sourceTypeColor = (sourceType: SkillSourceType) => {
  switch (sourceType) {
    case "Inline":
      return "purple" as const;
    case "Git":
      return "green" as const;
    case "OCI":
      return "blue" as const;
  }
};

/** Encodes a SkillAssociation as a string value for the MultiSelect, e.g. "Agent:3". */
const associationValue = (type: string, id: number) => `${type}:${id}`;

/** A single row in the merged Skills list: either an individual Skill or a Skill collection. */
type SkillsListItem =
  | { key: string; kind: "skill"; name: string; skill: Skill }
  | { key: string; kind: "collection"; name: string; collection: SkillCollection };

const Skills: React.FC = () => {
  const { t } = useTranslation();
  const { pushNotification } = React.useContext(NotificationsContext);
  const {
    skills,
    isFetching: isFetchingSkills,
    fetchError: skillsFetchError,
  } = useFetchSkills();
  const {
    skillCollections,
    isFetching: isFetchingCollections,
    fetchError: collectionsFetchError,
  } = useFetchSkillCollections();
  const { agents } = useFetchAgents();
  const { archetypes } = useFetchArchetypes();
  const { data: applications } = useFetchApplications();

  const isFetching = isFetchingSkills || isFetchingCollections;
  const fetchError = skillsFetchError || collectionsFetchError;

  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [skillToDelete, setSkillToDelete] = React.useState<Skill>();
  const [skillToView, setSkillToView] = React.useState<Skill | null>(null);
  const [viewContent, setViewContent] = React.useState("");

  // Skill collection modal state
  const [collectionToView, setCollectionToView] =
    React.useState<SkillCollection | null>(null);
  const [collectionToDelete, setCollectionToDelete] =
    React.useState<SkillCollection>();
  const [collectionFormState, setCollectionFormState] = React.useState<
    "create" | SkillCollection | undefined
  >(undefined);
  const [collectionFormInitialSkillIds, setCollectionFormInitialSkillIds] =
    React.useState<number[]>([]);
  const deletedCollectionNameRef = React.useRef<string>("");

  // Create Skill modal state
  const [newName, setNewName] = React.useState("");
  const [newDescription, setNewDescription] = React.useState("");
  const [newSourceType, setNewSourceType] =
    React.useState<SkillSourceType>("Inline");
  const [newContent, setNewContent] = React.useState("");
  const [newRepositoryUrl, setNewRepositoryUrl] = React.useState("");
  const [newBranch, setNewBranch] = React.useState("main");
  const [newPath, setNewPath] = React.useState("/");
  const [newImageReference, setNewImageReference] = React.useState("");
  const [newAssociationValues, setNewAssociationValues] = React.useState<
    string[]
  >([]);

  const [importFileName, setImportFileName] = React.useState("");
  const [importContent, setImportContent] = React.useState("");
  const [isFileLoading, setIsFileLoading] = React.useState(false);

  const resetForm = () => {
    setNewName("");
    setNewDescription("");
    setNewSourceType("Inline");
    setNewContent("");
    setNewRepositoryUrl("");
    setNewBranch("main");
    setNewPath("/");
    setNewImageReference("");
    setNewAssociationValues([]);
    setImportFileName("");
    setImportContent("");
  };

  const onMutationError = (error: AxiosError) => {
    pushNotification({ title: getAxiosErrorMessage(error), variant: "danger" });
  };

  const onCreateSuccess = (skill: Skill) => {
    pushNotification({
      title: `Skill "${skill.name}" created`,
      variant: "success",
    });
    setIsCreateOpen(false);
    resetForm();
  };
  const { mutate: createSkill, isPending: isCreating } = useCreateSkillMutation(
    onCreateSuccess,
    onMutationError
  );

  const onDeleteSuccess = () => {
    pushNotification({ title: "Skill deleted", variant: "success" });
  };
  const { mutate: deleteSkill } = useDeleteSkillMutation(
    onDeleteSuccess,
    onMutationError
  );

  const onUpdateSuccess = (skill: Skill) => {
    pushNotification({
      title: `Skill "${skill.name}" saved`,
      variant: "success",
    });
    setSkillToView(null);
  };
  const { mutate: updateSkill, isPending: isSaving } = useUpdateSkillMutation(
    onUpdateSuccess,
    onMutationError
  );

  const { mutate: deleteSkillCollection } = useDeleteSkillCollectionMutation(
    () => {
      pushNotification({
        title: t("toastr.success.deletedWhat", {
          what: deletedCollectionNameRef.current,
          type: "skill collection",
        }),
        variant: "success",
      });
    },
    onMutationError
  );

  const openViewModal = (skill: Skill) => {
    setSkillToView(skill);
    setViewContent(skill.content ?? "");
  };

  const handleSaveContent = () => {
    if (!skillToView) return;
    updateSkill({ ...skillToView, content: viewContent });
  };

  const usedByAgentsCount = React.useCallback(
    (collectionName: string) =>
      agents.filter((agent) => (agent.skillCollections || []).includes(collectionName))
        .length,
    [agents]
  );

  const closeCollectionForm = () => {
    setCollectionFormState(undefined);
    setCollectionFormInitialSkillIds([]);
  };

  // Options for the "Associated to" multiselect: Agents, Archetypes, Target
  // profiles (nested under archetypes), and Applications, each tagged with a
  // groupLabel badge so they render the same way as the reference prototype.
  const associationOptions = React.useMemo(() => {
    const options: {
      value: string;
      label: string;
      groupLabel: string;
    }[] = [];

    agents.forEach((agent) => {
      options.push({
        value: associationValue("Agent", agent.id),
        label: agent.name,
        groupLabel: "Agent",
      });
    });
    archetypes.forEach((archetype) => {
      options.push({
        value: associationValue("Archetype", archetype.id),
        label: archetype.name,
        groupLabel: "Archetype",
      });
    });
    archetypes.forEach((archetype) => {
      (archetype.profiles ?? []).forEach((profile) => {
        options.push({
          value: associationValue("Target profile", profile.id),
          label: `${profile.name} (${archetype.name})`,
          groupLabel: "Target profile",
        });
      });
    });
    (applications ?? []).forEach((application) => {
      options.push({
        value: associationValue("Application", application.id),
        label: application.name,
        groupLabel: "Application",
      });
    });
    return options;
  }, [agents, archetypes, applications]);

  const toggleAssociation = (value: string) => {
    setNewAssociationValues((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value]
    );
  };

  const resolveAssociations = (values: string[]): SkillAssociation[] =>
    values
      .map((value) => {
        const option = associationOptions.find((opt) => opt.value === value);
        const [type, idStr] = value.split(":");
        if (!option) return null;
        return {
          type: type as SkillAssociation["type"],
          id: Number(idStr),
          name: option.label,
        };
      })
      .filter((item): item is SkillAssociation => item !== null);

  const isCreateValid =
    !!newName.trim() &&
    (newSourceType === "Inline"
      ? !!newContent.trim()
      : newSourceType === "Git"
        ? !!newRepositoryUrl.trim()
        : !!newImageReference.trim());

  const handleCreate = () => {
    const payload: New<Skill> = {
      name: newName.trim(),
      description: newDescription.trim(),
      source: "Custom",
      provider: "Your organization",
      sourceType: newSourceType,
      createdAt: new Date().toISOString(),
      associations: resolveAssociations(newAssociationValues),
      ...(newSourceType === "Inline" && { content: newContent }),
      ...(newSourceType === "Git" && {
        repositoryUrl: newRepositoryUrl.trim(),
        branch: newBranch.trim() || "main",
        path: newPath.trim() || "/",
      }),
      ...(newSourceType === "OCI" && {
        imageReference: newImageReference.trim(),
      }),
    };
    createSkill(payload);
  };

  const handleImport = () => {
    const lines = importContent.split("\n");
    const nameLine = lines.find((l) => l.startsWith("# "));
    const skillName = nameLine
      ? nameLine.replace(/^#+\s*/, "").trim()
      : importFileName.replace(/\.[^.]+$/, "");

    const payload: New<Skill> = {
      name: skillName || importFileName,
      description: `Imported from ${importFileName}`,
      source: "Custom",
      provider: "Imported",
      sourceType: "Inline",
      content: importContent,
      createdAt: new Date().toISOString(),
    };
    createSkill(payload);
    setIsImportOpen(false);
    resetForm();
  };

  const sourceOptions: { value: SkillSource; label: string }[] = [
    { value: "Red Hat", label: "Red Hat" },
    { value: "Organization", label: "Organization" },
    { value: "Custom", label: "Custom" },
  ];

  const sourceTypeOptions: { value: SkillSourceType; label: string }[] = [
    { value: "Inline", label: "Inline" },
    { value: "Git", label: "Git" },
    { value: "OCI", label: "OCI" },
  ];

  const kindOptions: { value: "skill" | "collection"; label: string }[] = [
    { value: "skill", label: "Skills" },
    { value: "collection", label: "Skill collections" },
  ];

  // Merge Skills and Skill collections into a single list of rows.
  const listItems: SkillsListItem[] = React.useMemo(() => {
    const skillItems: SkillsListItem[] = skills.map((skill) => ({
      key: `skill-${skill.id}`,
      kind: "skill",
      name: skill.name,
      skill,
    }));
    const collectionItems: SkillsListItem[] = skillCollections.map(
      (collection) => ({
        key: `collection-${collection.id}`,
        kind: "collection",
        name: collection.name,
        collection,
      })
    );
    return [...skillItems, ...collectionItems];
  }, [skills, skillCollections]);

  const tableControls = useLocalTableControls({
    tableName: "skills-table",
    idProperty: "key",
    dataNameProperty: "name",
    items: listItems,
    columnNames: {
      name: "Name",
      kind: "Type",
      description: "Description",
      sourceType: "Source type",
      source: "Owner",
      associations: "Associated to / Used by",
    },
    isFilterEnabled: true,
    isSortEnabled: true,
    isPaginationEnabled: true,
    isSelectionEnabled: true,
    hasActionsColumn: true,
    filterCategories: [
      {
        categoryKey: "name",
        title: t("terms.name"),
        type: FilterType.search,
        placeholderText: "Filter by name...",
        getItemValue: (item) => item.name,
      },
      {
        categoryKey: "kind",
        title: "Type",
        type: FilterType.select,
        selectOptions: kindOptions,
        getItemValue: (item) => item.kind,
      },
      {
        categoryKey: "sourceType",
        title: "Source type",
        type: FilterType.multiselect,
        selectOptions: sourceTypeOptions,
        getItemValue: (item) => (item.kind === "skill" ? item.skill.sourceType : ""),
      },
      {
        categoryKey: "source",
        title: "Owner",
        type: FilterType.multiselect,
        selectOptions: sourceOptions,
        getItemValue: (item) => (item.kind === "skill" ? item.skill.source : ""),
      },
    ],
    initialItemsPerPage: 10,
    sortableColumns: ["name", "kind", "sourceType", "source"],
    initialSort: { columnKey: "name", direction: "asc" },
    getSortValues: (item) => ({
      name: item.name,
      kind: item.kind,
      sourceType: item.kind === "skill" ? item.skill.sourceType : "",
      source: item.kind === "skill" ? item.skill.source : "",
    }),
    isLoading: isFetching,
  });

  const {
    filteredItems,
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

  // Bulk-selection of Skill rows only, used to create a new Skill collection
  // from a set of selected Skills. Skill collection rows are not selectable.
  const skillItemsOnPage = currentPageItems
    .filter((item) => item.kind === "skill")
    .map((item) => (item as Extract<SkillsListItem, { kind: "skill" }>).skill);
  const filteredSkillItems = (filteredItems ?? [])
    .filter((item) => item.kind === "skill")
    .map((item) => (item as Extract<SkillsListItem, { kind: "skill" }>).skill);

  const {
    selectedItems: selectedSkills,
    propHelpers: { toolbarBulkSelectorProps, getSelectCheckboxTdProps },
  } = useBulkSelection<Skill>({
    isEqual: (a, b) => a.id === b.id,
    filteredItems: filteredSkillItems,
    currentPageItems: skillItemsOnPage,
  });

  const getSelectCheckboxTdPropsForRow = ({
    item,
    rowIndex,
  }: {
    item: SkillsListItem;
    rowIndex: number;
  }) =>
    item.kind === "skill"
      ? getSelectCheckboxTdProps({ item: item.skill, rowIndex })
      : {};

  const onCreateCollectionFromSelected = () => {
    setCollectionFormInitialSkillIds(selectedSkills.map((s) => s.id));
    setCollectionFormState("create");
  };

  const skillRowActions = (skill: Skill): IAction[] => [
    {
      title: skill.sourceType === "Inline" ? "View / Edit" : "View details",
      onClick: () => openViewModal(skill),
    },
    {
      title: "Delete",
      onClick: () => setSkillToDelete(skill),
      isDanger: true,
      isDisabled: skill.source === "Red Hat",
    },
  ];

  const collectionRowActions = (collection: SkillCollection): IAction[] => [
    {
      title: "View",
      onClick: () => setCollectionToView(collection),
    },
    {
      title: "Edit",
      onClick: () => {
        setCollectionFormState(collection);
        setCollectionFormInitialSkillIds([]);
      },
    },
    {
      title: "Delete",
      onClick: () => setCollectionToDelete(collection),
      isDanger: true,
    },
  ];

  return (
    <>
      <PageSection hasBodyWrapper={false}>
        <Content>
          <Content component="h1">Skills</Content>
        </Content>
        <Content>
          <Content component="p">
            Codify migration knowledge for Agents to consume at execution time
            using inline guidance, a git repository, or an OCI image, and
            bundle related Skills together into reusable collections.
          </Content>
        </Content>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        <ConditionalRender
          when={isFetching && listItems.length === 0 && !fetchError}
          then={<AppPlaceholder />}
        >
          <Toolbar {...toolbarProps}>
            <ToolbarContent>
              <ToolbarBulkSelector {...toolbarBulkSelectorProps} />
              <FilterToolbar {...filterToolbarProps} />
              <ToolbarGroup variant="action-group">
                <ToolbarItem>
                  <Button
                    variant={ButtonVariant.primary}
                    onClick={() => setIsCreateOpen(true)}
                  >
                    Create skill
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Button
                    variant={ButtonVariant.secondary}
                    isDisabled={selectedSkills.length === 0}
                    onClick={onCreateCollectionFromSelected}
                  >
                    {selectedSkills.length > 0
                      ? `Create collection (${selectedSkills.length})`
                      : "Create collection"}
                  </Button>
                </ToolbarItem>
                <ToolbarItem>
                  <Button
                    variant={ButtonVariant.secondary}
                    onClick={() => setIsImportOpen(true)}
                  >
                    Import skill file
                  </Button>
                </ToolbarItem>
              </ToolbarGroup>
              <ToolbarItem {...paginationToolbarItemProps}>
                <SimplePagination
                  idPrefix="skills-table"
                  isTop
                  paginationProps={paginationProps}
                />
              </ToolbarItem>
            </ToolbarContent>
          </Toolbar>
          <Table {...tableProps} aria-label="Skills table">
            <Thead>
              <Tr>
                <TableHeaderContentWithControls {...tableControls}>
                  <Th {...getThProps({ columnKey: "name" })} width={20} />
                  <Th {...getThProps({ columnKey: "kind" })} width={10} />
                  <Th {...getThProps({ columnKey: "description" })} width={20} />
                  <Th {...getThProps({ columnKey: "sourceType" })} width={10} />
                  <Th {...getThProps({ columnKey: "source" })} width={10} />
                  <Th {...getThProps({ columnKey: "associations" })} width={20} />
                  <Th screenReaderText="Row actions" />
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
                  titleText="No skills yet"
                  variant="sm"
                >
                  <EmptyStateBody>
                    Create a skill, import a skill file, or bundle skills into
                    a collection to get started.
                  </EmptyStateBody>
                </EmptyState>
              }
              numRenderedColumns={numRenderedColumns}
            >
              {currentPageItems?.map((item, rowIndex) => (
                <Tbody key={item.key}>
                  <Tr {...getTrProps({ item })}>
                    <TableRowContentWithControls
                      {...tableControls}
                      getSelectCheckboxTdProps={getSelectCheckboxTdPropsForRow}
                      item={item}
                      rowIndex={rowIndex}
                    >
                      <Td width={20} {...getTdProps({ columnKey: "name" })}>
                        {item.kind === "skill" ? (
                          <Button
                            variant="link"
                            isInline
                            onClick={() => openViewModal(item.skill)}
                          >
                            {item.skill.name}
                          </Button>
                        ) : (
                          <>
                            <Button
                              variant="link"
                              isInline
                              onClick={() => setCollectionToView(item.collection)}
                            >
                              {item.collection.name}
                            </Button>{" "}
                            <Label isCompact color="grey">
                              {item.collection.skillIds.length} skill
                              {item.collection.skillIds.length === 1 ? "" : "s"}
                            </Label>
                          </>
                        )}
                      </Td>
                      <Td width={10} {...getTdProps({ columnKey: "kind" })}>
                        {item.kind === "collection" ? (
                          <Label isCompact color="teal">
                            Collection
                          </Label>
                        ) : (
                          <Label isCompact variant="outline">
                            Skill
                          </Label>
                        )}
                      </Td>
                      <Td width={20} {...getTdProps({ columnKey: "description" })}>
                        {(item.kind === "skill"
                          ? item.skill.description
                          : item.collection.description) || "—"}
                      </Td>
                      <Td width={10} {...getTdProps({ columnKey: "sourceType" })}>
                        {item.kind === "skill" ? (
                          <Label
                            color={sourceTypeColor(item.skill.sourceType)}
                            isCompact
                          >
                            {item.skill.sourceType}
                          </Label>
                        ) : (
                          "—"
                        )}
                      </Td>
                      <Td width={10} {...getTdProps({ columnKey: "source" })}>
                        {item.kind === "skill" ? item.skill.source : "—"}
                      </Td>
                      <Td width={20} {...getTdProps({ columnKey: "associations" })}>
                        {item.kind === "skill" ? (
                          item.skill.associations?.length ? (
                            <LabelGroup numLabels={2}>
                              {item.skill.associations.map((assoc) => (
                                <Label
                                  key={`${assoc.type}-${assoc.id}`}
                                  isCompact
                                  variant="outline"
                                >
                                  {assoc.name}
                                </Label>
                              ))}
                            </LabelGroup>
                          ) : (
                            "—"
                          )
                        ) : (
                          <>
                            {usedByAgentsCount(item.collection.name)} agent
                            {usedByAgentsCount(item.collection.name) === 1
                              ? ""
                              : "s"}
                          </>
                        )}
                      </Td>
                      <Td isActionCell>
                        <ActionsColumn
                          items={
                            item.kind === "skill"
                              ? skillRowActions(item.skill)
                              : collectionRowActions(item.collection)
                          }
                        />
                      </Td>
                    </TableRowContentWithControls>
                  </Tr>
                </Tbody>
              ))}
            </ConditionalTableBody>
          </Table>
          <SimplePagination
            idPrefix="skills-table"
            isTop={false}
            paginationProps={paginationProps}
          />
        </ConditionalRender>
      </PageSection>

      {/* Create skill modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          resetForm();
        }}
        variant="medium"
        aria-label="Create Skill"
      >
        <ModalHeader title="Create Skill" />
        <ModalBody>
          <Form>
            <FormGroup label="Name" isRequired fieldId="skill-name">
              <TextInput
                id="skill-name"
                value={newName}
                onChange={(_, value) => setNewName(value)}
              />
            </FormGroup>
            <FormGroup label="Description" fieldId="skill-description">
              <TextInput
                id="skill-description"
                value={newDescription}
                onChange={(_, value) => setNewDescription(value)}
              />
            </FormGroup>
            <FormGroup label="Source type" isRequired fieldId="skill-source-type">
              <ToggleGroup aria-label="Skill source type">
                {sourceTypeOptions.map((option) => (
                  <ToggleGroupItem
                    key={option.value}
                    text={option.label}
                    buttonId={`skill-source-type-${option.value}`}
                    isSelected={newSourceType === option.value}
                    onChange={() => setNewSourceType(option.value)}
                  />
                ))}
              </ToggleGroup>
            </FormGroup>

            {newSourceType === "Inline" && (
              <FormGroup label="Content" isRequired fieldId="skill-content">
                <TextArea
                  id="skill-content"
                  value={newContent}
                  onChange={(_, value) => setNewContent(value)}
                  placeholder="Write migration knowledge in markdown..."
                  autoResize
                  style={{ fontFamily: "monospace", minHeight: "200px" }}
                />
              </FormGroup>
            )}

            {newSourceType === "Git" && (
              <>
                <FormGroup
                  label="Repository URL"
                  isRequired
                  fieldId="skill-repository-url"
                >
                  <TextInput
                    id="skill-repository-url"
                    value={newRepositoryUrl}
                    onChange={(_, value) => setNewRepositoryUrl(value)}
                    placeholder="https://github.com/org/repo"
                  />
                </FormGroup>
                <FormGroup label="Branch" fieldId="skill-branch">
                  <TextInput
                    id="skill-branch"
                    value={newBranch}
                    onChange={(_, value) => setNewBranch(value)}
                    placeholder="main"
                  />
                </FormGroup>
                <FormGroup label="Path" fieldId="skill-path">
                  <TextInput
                    id="skill-path"
                    value={newPath}
                    onChange={(_, value) => setNewPath(value)}
                    placeholder="/"
                  />
                  <FormHelperText>
                    <HelperText>
                      <HelperTextItem>
                        Path within the repository to the Skill file or
                        directory.
                      </HelperTextItem>
                    </HelperText>
                  </FormHelperText>
                </FormGroup>
              </>
            )}

            {newSourceType === "OCI" && (
              <FormGroup
                label="Image reference"
                isRequired
                fieldId="skill-image-reference"
              >
                <TextInput
                  id="skill-image-reference"
                  value={newImageReference}
                  onChange={(_, value) => setNewImageReference(value)}
                  placeholder="quay.io/org/skill-name:latest"
                />
              </FormGroup>
            )}

            <FormGroup label="Associated to" fieldId="skill-associations">
              <MultiSelect
                toggleId="skill-associations-select-toggle"
                toggleAriaLabel="Skill associations select dropdown"
                aria-label="Associated to"
                placeholderText="Select associations..."
                values={newAssociationValues}
                hasChips
                options={associationOptions}
                onSelect={(selection) => {
                  if (!selection) return;
                  toggleAssociation(selection);
                }}
                onClear={() => setNewAssociationValues([])}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem>
                    Associate this Skill with one or more Agents, archetypes,
                    target profiles, or applications.
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            variant={ButtonVariant.primary}
            isDisabled={!isCreateValid || isCreating}
            isLoading={isCreating}
            onClick={handleCreate}
          >
            Create
          </Button>
          <Button
            variant={ButtonVariant.link}
            onClick={() => {
              setIsCreateOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* Import skill file modal */}
      <Modal
        isOpen={isImportOpen}
        onClose={() => {
          setIsImportOpen(false);
          resetForm();
        }}
        variant="medium"
        aria-label="Import skill file"
      >
        <ModalHeader title="Import skill file" />
        <ModalBody>
          <Form>
            <FormGroup
              label="Skill file"
              isRequired
              fieldId="skill-file-upload"
            >
              <FileUpload
                id="skill-file-upload"
                type="text"
                value={importContent}
                filename={importFileName}
                filenamePlaceholder="Drop a file here or click to upload"
                onFileInputChange={(_event, file) => {
                  setImportFileName(file.name);
                }}
                onDataChange={(_event, value) => setImportContent(value)}
                onTextChange={(_event, value) => setImportContent(value)}
                isLoading={isFileLoading}
                onReadStarted={() => setIsFileLoading(true)}
                onReadFinished={() => setIsFileLoading(false)}
                onClearClick={() => {
                  setImportFileName("");
                  setImportContent("");
                }}
                browseButtonText="Browse"
                allowEditingUploadedText
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            variant={ButtonVariant.primary}
            isDisabled={!importContent.trim() || isCreating}
            isLoading={isCreating}
            onClick={handleImport}
          >
            Import
          </Button>
          <Button
            variant={ButtonVariant.link}
            onClick={() => {
              setIsImportOpen(false);
              resetForm();
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      {/* View / Edit skill content modal */}
      <Modal
        isOpen={!!skillToView}
        onClose={() => setSkillToView(null)}
        variant="large"
        aria-label="View skill content"
      >
        <ModalHeader
          title={skillToView ? `${skillToView.name}` : "Skill"}
          description={skillToView?.description}
        />
        <ModalBody>
          {skillToView?.associations?.length ? (
            <DescriptionList
              isHorizontal
              style={{ marginBottom: "var(--pf-t--global--spacer--md)" }}
            >
              <DescriptionListGroup>
                <DescriptionListTerm>Associated to</DescriptionListTerm>
                <DescriptionListDescription>
                  <LabelGroup>
                    {skillToView.associations.map((assoc) => (
                      <Label
                        key={`${assoc.type}-${assoc.id}`}
                        isCompact
                        variant="outline"
                      >
                        {assoc.name}
                      </Label>
                    ))}
                  </LabelGroup>
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          ) : null}

          {skillToView?.sourceType === "Git" && (
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>Repository URL</DescriptionListTerm>
                <DescriptionListDescription>
                  {skillToView.repositoryUrl}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Branch</DescriptionListTerm>
                <DescriptionListDescription>
                  {skillToView.branch || "main"}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Path</DescriptionListTerm>
                <DescriptionListDescription>
                  {skillToView.path || "/"}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          )}

          {skillToView?.sourceType === "OCI" && (
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>Image reference</DescriptionListTerm>
                <DescriptionListDescription>
                  {skillToView.imageReference}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          )}

          {(!skillToView || skillToView.sourceType === "Inline") && (
            <TextArea
              id="skill-view-content"
              value={viewContent}
              onChange={(_, value) => setViewContent(value)}
              aria-label="Skill file content"
              autoResize
              style={{ fontFamily: "monospace", minHeight: "300px" }}
            />
          )}
        </ModalBody>
        <ModalFooter>
          {(!skillToView || skillToView.sourceType === "Inline") && (
            <Button
              variant={ButtonVariant.primary}
              isDisabled={
                isSaving || viewContent === (skillToView?.content ?? "")
              }
              isLoading={isSaving}
              onClick={handleSaveContent}
            >
              Save
            </Button>
          )}
          <Button
            variant={ButtonVariant.link}
            onClick={() => setSkillToView(null)}
          >
            Close
          </Button>
        </ModalFooter>
      </Modal>

      {skillToDelete && (
        <ConfirmDialog
          title="Delete skill"
          titleIconVariant="warning"
          message={`Are you sure you want to delete skill "${skillToDelete.name}"? This action cannot be undone.`}
          isOpen={true}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel="Delete"
          cancelBtnLabel="Cancel"
          onCancel={() => setSkillToDelete(undefined)}
          onClose={() => setSkillToDelete(undefined)}
          onConfirm={() => {
            deleteSkill(skillToDelete.id);
            setSkillToDelete(undefined);
          }}
        />
      )}

      {/* View skill collection modal */}
      <CollectionViewModal
        collection={collectionToView}
        skills={skills}
        agents={agents}
        onClose={() => setCollectionToView(null)}
        onViewSkill={(skill) => {
          // Keep the collection modal open behind the skill modal so
          // closing the skill modal returns the user to the collection.
          openViewModal(skill);
        }}
        onEdit={(collection) => {
          setCollectionToView(null);
          setCollectionFormState(collection);
          setCollectionFormInitialSkillIds([]);
        }}
        onDelete={(collection) => {
          setCollectionToView(null);
          setCollectionToDelete(collection);
        }}
      />

      {/* Create / Edit skill collection modal */}
      <SkillCollectionFormModal
        isOpen={collectionFormState !== undefined}
        skillCollection={
          collectionFormState === "create" ? undefined : collectionFormState
        }
        skillCollections={skillCollections}
        initialSkillIds={
          collectionFormState === "create"
            ? collectionFormInitialSkillIds
            : undefined
        }
        onClose={closeCollectionForm}
      />

      {collectionToDelete && (
        <ConfirmDialog
          title={t("dialog.title.deleteWithName", {
            what: "skill collection",
            name: collectionToDelete.name,
          })}
          titleIconVariant="warning"
          message={t("dialog.message.delete")}
          isOpen={true}
          confirmBtnVariant={ButtonVariant.danger}
          confirmBtnLabel={t("actions.delete")}
          cancelBtnLabel={t("actions.cancel")}
          onCancel={() => setCollectionToDelete(undefined)}
          onClose={() => setCollectionToDelete(undefined)}
          onConfirm={() => {
            deletedCollectionNameRef.current = collectionToDelete.name;
            deleteSkillCollection(collectionToDelete.id);
            setCollectionToDelete(undefined);
          }}
        />
      )}
    </>
  );
};

export default Skills;
