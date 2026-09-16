import * as React from "react";
import {
  Button,
  ButtonVariant,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  List,
  ListItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import { Agent, Skill, SkillCollection } from "@app/api/models";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";

export interface CollectionViewModalProps {
  collection: SkillCollection | null;
  skills: Skill[];
  agents: Agent[];
  onClose: () => void;
  onViewSkill: (skill: Skill) => void;
  onEdit: (collection: SkillCollection) => void;
  onDelete: (collection: SkillCollection) => void;
}

const sourceTypeColor = (sourceType: Skill["sourceType"]) => {
  switch (sourceType) {
    case "Inline":
      return "purple" as const;
    case "Git":
      return "green" as const;
    case "OCI":
      return "blue" as const;
  }
};

export const CollectionViewModal: React.FC<CollectionViewModalProps> = ({
  collection,
  skills,
  agents,
  onClose,
  onViewSkill,
  onEdit,
  onDelete,
}) => {
  const memberSkills = React.useMemo(() => {
    if (!collection) return [];
    return collection.skillIds
      .map((id) => skills.find((s) => s.id === id))
      .filter((s): s is Skill => !!s);
  }, [collection, skills]);

  const usedByAgents = React.useMemo(() => {
    if (!collection) return [];
    return agents.filter((agent) =>
      (agent.skillCollections || []).includes(collection.name)
    );
  }, [collection, agents]);

  return (
    <Modal
      isOpen={!!collection}
      onClose={onClose}
      variant="large"
      aria-label="View skill collection"
    >
      <ModalHeader
        title={collection ? collection.name : "Skill collection"}
        description={collection?.description}
      />
      <ModalBody>
        {collection && (
          <DescriptionList isHorizontal>
            <DescriptionListGroup>
              <DescriptionListTerm>Skills in this collection</DescriptionListTerm>
              <DescriptionListDescription>
                {memberSkills.length > 0 ? (
                  <List isPlain>
                    {memberSkills.map((skill) => (
                      <ListItem key={skill.id}>
                        <Button
                          variant="link"
                          isInline
                          onClick={() => onViewSkill(skill)}
                        >
                          {skill.name}
                        </Button>{" "}
                        <Label
                          isCompact
                          color={sourceTypeColor(skill.sourceType)}
                        >
                          {skill.sourceType}
                        </Label>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <EmptyTextMessage message="No skills in this collection yet" />
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Used by</DescriptionListTerm>
              <DescriptionListDescription>
                {usedByAgents.length > 0 ? (
                  <List isPlain>
                    {usedByAgents.map((agent) => (
                      <ListItem key={agent.id}>{agent.name}</ListItem>
                    ))}
                  </List>
                ) : (
                  <EmptyTextMessage message="Not used by any agents" />
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Created</DescriptionListTerm>
              <DescriptionListDescription>
                {new Date(collection.createdAt).toLocaleString()}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        )}
      </ModalBody>
      <ModalFooter>
        {collection && (
          <>
            <Button
              variant={ButtonVariant.secondary}
              onClick={() => onEdit(collection)}
            >
              Edit
            </Button>
            <Button
              variant={ButtonVariant.danger}
              onClick={() => onDelete(collection)}
            >
              Delete
            </Button>
          </>
        )}
        <Button variant={ButtonVariant.link} onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};
