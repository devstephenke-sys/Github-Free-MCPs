import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getOctokit } from "../lib/github.js";
import { errorResult, jsonResult } from "../lib/response.js";

const org = z.string().describe("Organization login");

export function registerBillingTools(server: McpServer): void {
  server.tool(
    "github_get_user_billing_actions",
    "Get GitHub Actions billing summary for the authenticated user (minutes, included vs paid).",
    {},
    async () => {
      try {
        const octokit = getOctokit();
        const { data: me } = await octokit.rest.users.getAuthenticated();
        const { data } = await octokit.rest.billing.getGithubActionsBillingUser({
          username: me.login,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_get_org_billing_actions",
    "Get GitHub Actions billing for an organization.",
    { org },
    async ({ org }) => {
      try {
        const { data } = await getOctokit().rest.billing.getGithubActionsBillingOrg({
          org,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_get_org_billing_overview",
    "Get combined billing overview for an org (Actions, Packages, shared storage).",
    { org },
    async ({ org }) => {
      try {
        const octokit = getOctokit();
        const [actions, packages, storage] = await Promise.allSettled([
          octokit.rest.billing.getGithubActionsBillingOrg({ org }),
          octokit.rest.billing.getGithubPackagesBillingOrg({ org }),
          octokit.rest.billing.getSharedStorageBillingOrg({ org }),
        ]);
        return jsonResult({
          actions: actions.status === "fulfilled" ? actions.value.data : { error: String(actions.reason) },
          packages: packages.status === "fulfilled" ? packages.value.data : { error: String(packages.reason) },
          shared_storage:
            storage.status === "fulfilled" ? storage.value.data : { error: String(storage.reason) },
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_get_org_billing_usage_report",
    "Request billing usage export metadata (org plans — requires billing admin).",
    { org },
    async ({ org }) => {
      try {
        const octokit = getOctokit();
        const { data: usage } = await octokit.request(
          "GET /orgs/{org}/settings/billing/usage",
          { org },
        );
        return jsonResult(usage);
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
