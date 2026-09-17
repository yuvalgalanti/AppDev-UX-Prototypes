import * as React from "react";
import { Link } from "react-router-dom";
import {
  Content,
  ExpandableSection,
  Flex,
  FlexItem,
  Label,
} from "@patternfly/react-core";
import {
  CodeBranchIcon,
  CommentIcon,
  GithubIcon,
  GitlabIcon,
  RobotIcon,
  UserIcon,
} from "@patternfly/react-icons";

import { WorkflowCommit, WorkflowStage, WorkflowStageRunResult } from "@app/api/models";
import { EmptyTextMessage } from "@app/components/EmptyTextMessage";

import { RunStatusLabel } from "../../workflow-detail/components/run-status-label";

/** Picks a brand icon based on the commit's source repository host, for a more authentic-looking link. */
export const commitProviderIcon = (url?: string) => {
  if (url?.includes("gitlab.com")) return <GitlabIcon />;
  if (url?.includes("github.com")) return <GithubIcon />;
  return <CodeBranchIcon />;
};

export interface StageRunSectionProps {
  stage: WorkflowStage;
  stageRun?: WorkflowStageRunResult;
  commits: WorkflowCommit[];
  agentRunPath?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export const StageRunSection: React.FC<StageRunSectionProps> = ({
  stage,
  stageRun,
  commits,
  agentRunPath,
  isExpanded,
  onToggle,
}) => {
  const status = stageRun?.status ?? "Pending";
  const messages = stageRun?.messages ?? [];

  return (
    <ExpandableSection
      isExpanded={isExpanded}
      onToggle={onToggle}
      toggleContent={
        <Flex
          alignItems={{ default: "alignItemsCenter" }}
          gap={{ default: "gapSm" }}
        >
          <FlexItem>
            <strong>{stage.name}</strong>
          </FlexItem>
          <FlexItem>
            <RunStatusLabel status={status} />
          </FlexItem>
          {agentRunPath && (
            <FlexItem>
              <Link to={agentRunPath} onClick={(e) => e.stopPropagation()}>
                View agent run
              </Link>
            </FlexItem>
          )}
        </Flex>
      }
    >
      <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
        <FlexItem>
          <Content component="h4">
            <CommentIcon /> Activities
          </Content>
          {messages.length === 0 ? (
            <EmptyTextMessage message="No activity recorded for this stage yet." />
          ) : (
            <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
              {messages.map((message) => (
                <FlexItem key={message.id}>
                  <Flex
                    alignItems={{ default: "alignItemsCenter" }}
                    gap={{ default: "gapSm" }}
                  >
                    <FlexItem>
                      {message.author === "human" ? <UserIcon /> : <RobotIcon />}
                    </FlexItem>
                    <FlexItem>
                      <Content component="small">
                        <strong>{message.author === "human" ? "You" : "Agent"}</strong>{" "}
                        <span
                          style={{
                            color: "var(--pf-t--global--text--color--subtle)",
                          }}
                        >
                          {new Date(message.timestamp).toLocaleString()}
                        </span>
                      </Content>
                    </FlexItem>
                  </Flex>
                  <Content component="p">{message.content}</Content>
                </FlexItem>
              ))}
            </Flex>
          )}
        </FlexItem>
        <FlexItem>
          <Content component="h4">
            <CodeBranchIcon /> Commits
          </Content>
          {commits.length === 0 ? (
            <EmptyTextMessage message="No commits recorded for this stage." />
          ) : (
            <Flex direction={{ default: "column" }} gap={{ default: "gapSm" }}>
              {commits.map((commit) => (
                <FlexItem key={commit.id}>
                  <Flex
                    alignItems={{ default: "alignItemsCenter" }}
                    gap={{ default: "gapSm" }}
                  >
                    <FlexItem>
                      {commit.url ? (
                        <a
                          href={commit.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Label
                            isCompact
                            icon={commitProviderIcon(commit.url)}
                            color="blue"
                          >
                            {commit.sha}
                          </Label>
                        </a>
                      ) : (
                        <Label isCompact icon={<CodeBranchIcon />} color="blue">
                          {commit.sha}
                        </Label>
                      )}
                    </FlexItem>
                    <FlexItem>{commit.message}</FlexItem>
                    <FlexItem>
                      <Content
                        component="small"
                        style={{
                          color: "var(--pf-t--global--text--color--subtle)",
                        }}
                      >
                        {new Date(commit.timestamp).toLocaleString()}
                      </Content>
                    </FlexItem>
                  </Flex>
                </FlexItem>
              ))}
            </Flex>
          )}
        </FlexItem>
      </Flex>
    </ExpandableSection>
  );
};
