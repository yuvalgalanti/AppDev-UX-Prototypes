import { AgentRole, Model } from "@app/api/models";

// Static selection catalogs for the agent configuration form and detail
// page. These aren't Hub-backed entities (unlike agents themselves) — they
// represent the fixed set of choices an operator can pick from when wiring
// up an agent's model, skills, and MCP tool access.

export const AGENT_ROLES: AgentRole[] = [
  "Code Analysis",
  "Dependency Mapping",
  "Refactoring",
  "Test Generation",
  "Validation",
  "Documentation",
  "Custom",
];

export interface AgentImageOption {
  value: string;
  label: string;
  /** PatternFly icon name or emoji used as a visual stand-in for the avatar. */
  icon: string;
}

export const AGENT_IMAGES: AgentImageOption[] = [
  { value: "robot-blue", label: "Blue Robot", icon: "🤖" },
  { value: "robot-green", label: "Green Robot", icon: "🦾" },
  { value: "brain", label: "Brain", icon: "🧠" },
  { value: "magnifier", label: "Magnifier", icon: "🔍" },
  { value: "gear", label: "Gear", icon: "⚙️" },
  { value: "wrench", label: "Wrench", icon: "🔧" },
  { value: "shield", label: "Shield", icon: "🛡️" },
  { value: "flask", label: "Flask", icon: "🧪" },
  { value: "book", label: "Book", icon: "📚" },
  { value: "rocket", label: "Rocket", icon: "🚀" },
];

/**
 * Formats an Agent's `model` (a `Model.modelId`) into a human-readable label
 * by looking it up in the Models registry. Falls back to the raw modelId if
 * no matching Model is found (e.g. the Model was since deleted).
 */
export const modelLabel = (models: Model[], modelId: string): string => {
  const model = models.find((m) => m.modelId === modelId);
  return model ? `${model.name} (${model.provider})` : modelId;
};

export const AGENT_SKILLS: string[] = [
  "Static code analysis",
  "Dependency graph analysis",
  "Java to Quarkus migration",
  "Spring Boot upgrades",
  ".NET modernization",
  "SQL schema translation",
  "Containerization",
  "Kubernetes manifests",
  "Unit test generation",
  "Contract test generation",
  "Performance benchmarking",
  "Security & secrets scanning",
  "Technical documentation",
  "Architecture diagramming",
  "Root cause analysis",
];

export const AGENT_MCP_TOOLS: string[] = [
  "filesystem",
  "git",
  "github",
  "jira",
  "slack",
  "postgres",
  "kubernetes",
  "sonarqube",
  "confluence",
  "web-search",
  "shell",
];

export interface GoalTemplateOption {
  value: string;
  label: string;
  goalText: string;
}

export const GOAL_TEMPLATES: GoalTemplateOption[] = [
  {
    value: "java-to-quarkus",
    label: "Java EE → Quarkus",
    goalText:
      "Migrate the application from Java EE (Jakarta EE) to Quarkus, replacing EJBs with CDI beans, updating persistence to Panache, and ensuring zero-downtime deployment on Kubernetes.",
  },
  {
    value: "spring-boot-upgrade",
    label: "Spring Boot 2.x → 3.x",
    goalText:
      "Upgrade the application from Spring Boot 2.x to 3.x, migrating to Jakarta EE 10 namespace, updating deprecated APIs, and verifying all tests pass.",
  },
  {
    value: "dotnet-modernize",
    label: ".NET Framework → .NET 8",
    goalText:
      "Modernize the application from .NET Framework to .NET 8, containerize it for Linux, and validate functional parity with the legacy deployment.",
  },
  {
    value: "containerize",
    label: "Containerization",
    goalText:
      "Containerize the application with a production-ready Dockerfile, create Kubernetes manifests, and establish a CI/CD pipeline for image builds.",
  },
  {
    value: "cloud-readiness",
    label: "Cloud readiness assessment",
    goalText:
      "Assess the application for cloud readiness, identify blockers and risks, propose a remediation plan, and generate a migration effort estimate.",
  },
  {
    value: "custom",
    label: "Custom goal",
    goalText: "",
  },
];
