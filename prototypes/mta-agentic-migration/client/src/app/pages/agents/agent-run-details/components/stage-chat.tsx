import * as React from "react";
import {
  Button,
  ButtonVariant,
  Card,
  CardBody,
  Content,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  TextArea,
} from "@patternfly/react-core";
import { CommentsIcon, PaperPlaneIcon, RobotIcon, UserIcon } from "@patternfly/react-icons";

import { StageRunMessage } from "@app/api/models";

interface StageChatProps {
  agentName: string;
  messages: StageRunMessage[];
  onSend: (content: string) => void;
  isSending?: boolean;
}

export const StageChat: React.FC<StageChatProps> = ({
  agentName,
  messages,
  onSend,
  isSending = false,
}) => {
  const [draft, setDraft] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content) return;
    onSend(content);
    setDraft("");
  };

  return (
    <Card>
      <CardBody>
        <Content component="h3">Human-in-the-loop chat</Content>
        <Content component="small">
          Send guidance or questions to {agentName} while this stage runs, or
          discuss the outcome once it completes.
        </Content>
      </CardBody>
      <CardBody
        ref={scrollRef}
        style={{ maxHeight: 420, overflowY: "auto" }}
      >
        {messages.length === 0 ? (
          <EmptyState
            headingLevel="h4"
            icon={CommentsIcon}
            titleText="No messages yet"
            variant="xs"
          >
            <EmptyStateBody>
              Messages from {agentName} about this stage will appear here.
            </EmptyStateBody>
          </EmptyState>
        ) : (
          <Flex direction={{ default: "column" }} gap={{ default: "gapMd" }}>
            {messages.map((message) => {
              const isHuman = message.author === "human";
              return (
                <FlexItem
                  key={message.id}
                  alignSelf={{
                    default: isHuman ? "alignSelfFlexEnd" : "alignSelfFlexStart",
                  }}
                  style={{ maxWidth: "80%" }}
                >
                  <Card
                    isCompact
                    style={{
                      backgroundColor: isHuman
                        ? "var(--pf-t--global--background--color--secondary--default)"
                        : "var(--pf-t--global--background--color--primary--default)",
                    }}
                  >
                    <CardBody>
                      <Flex
                        alignItems={{ default: "alignItemsCenter" }}
                        gap={{ default: "gapSm" }}
                        style={{ marginBottom: "var(--pf-t--global--spacer--xs)" }}
                      >
                        <FlexItem>
                          {isHuman ? <UserIcon /> : <RobotIcon />}
                        </FlexItem>
                        <FlexItem>
                          <Content component="small">
                            <strong>{isHuman ? "You" : agentName}</strong>{" "}
                            <span style={{ color: "var(--pf-t--global--text--color--subtle)" }}>
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </Content>
                        </FlexItem>
                      </Flex>
                      <Content component="p">{message.content}</Content>
                    </CardBody>
                  </Card>
                </FlexItem>
              );
            })}
          </Flex>
        )}
      </CardBody>
      <CardBody>
        <Flex alignItems={{ default: "alignItemsFlexEnd" }} gap={{ default: "gapSm" }}>
          <FlexItem grow={{ default: "grow" }}>
            <TextArea
              id="stage-chat-input"
              aria-label="Message"
              placeholder={`Message ${agentName}...`}
              value={draft}
              onChange={(_, value) => setDraft(value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              autoResize
              rows={2}
            />
          </FlexItem>
          <FlexItem>
            <Button
              variant={ButtonVariant.primary}
              icon={<PaperPlaneIcon />}
              isDisabled={!draft.trim() || isSending}
              isLoading={isSending}
              onClick={handleSend}
            >
              Send
            </Button>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};
