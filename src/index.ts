#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerActionsTools } from "./tools/actions.js";
import { registerBillingTools } from "./tools/billing.js";
import { registerBranchProtectionTools } from "./tools/branch-protection.js";
import { registerCommitTools } from "./tools/commits.js";
import { registerDeploymentTools } from "./tools/deployments.js";
import { registerGraphqlTools } from "./tools/graphql.js";
import { registerIssueTools } from "./tools/issues.js";
import { registerLocalGitTools } from "./tools/local-git.js";
import { registerPullRequestTools } from "./tools/pull-requests.js";
import { registerReleaseTools } from "./tools/releases.js";
import { registerRepoTools } from "./tools/repos.js";
import {
  registerCollaboratorTools,
  registerWebhookTools,
} from "./tools/webhooks-collaborators.js";

const server = new McpServer(
  {
    name: "github-cicd-mcp",
    version: "1.1.0",
  },
  {
    instructions: `GitHub CI/CD assistant (REST + GraphQL): https://docs.github.com/en/rest and /en/graphql.
github_* — remote API (repos, commits, PRs, issues, releases, branch protection, Actions, deployments, billing, webhooks).
git_* — local clone/commit/push/pull.
Requires GITHUB_TOKEN or GH_TOKEN (repo, workflow; read:org for org billing).`,
  },
);

registerRepoTools(server);
registerCommitTools(server);
registerPullRequestTools(server);
registerActionsTools(server);
registerDeploymentTools(server);
registerBillingTools(server);
registerIssueTools(server);
registerReleaseTools(server);
registerBranchProtectionTools(server);
registerWebhookTools(server);
registerCollaboratorTools(server);
registerGraphqlTools(server);
registerLocalGitTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
