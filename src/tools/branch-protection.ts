import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { owner, repo } from "../lib/fields.js";
import { getOctokit } from "../lib/github.js";
import { errorResult, jsonResult } from "../lib/response.js";

export function registerBranchProtectionTools(server: McpServer): void {
  server.tool(
    "github_get_branch",
    "Get branch metadata including protection status.",
    {
      owner,
      repo,
      branch: z.string(),
    },
    async ({ owner, repo, branch }) => {
      try {
        const { data } = await getOctokit().rest.repos.getBranch({
          owner,
          repo,
          branch,
        });
        return jsonResult({
          name: data.name,
          protected: data.protected,
          commit_sha: data.commit.sha,
          protection: data.protection,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_get_branch_protection",
    "Get branch protection rules for a branch.",
    {
      owner,
      repo,
      branch: z.string(),
    },
    async ({ owner, repo, branch }) => {
      try {
        const { data } = await getOctokit().rest.repos.getBranchProtection({
          owner,
          repo,
          branch,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_update_branch_protection",
    "Update branch protection (require PR reviews, status checks, admins).",
    {
      owner,
      repo,
      branch: z.string(),
      required_status_checks: z
        .string()
        .optional()
        .describe('JSON: { "strict": true, "contexts": ["ci/build"] }'),
      enforce_admins: z.boolean().optional(),
      required_pull_request_reviews: z
        .string()
        .optional()
        .describe('JSON: { "required_approving_review_count": 1 }'),
      restrictions: z
        .string()
        .optional()
        .describe('JSON: { "users": [], "teams": [], "apps": [] } or null to disable'),
      allow_force_pushes: z.boolean().optional(),
      allow_deletions: z.boolean().optional(),
    },
    async ({
      owner,
      repo,
      branch,
      required_status_checks,
      enforce_admins,
      required_pull_request_reviews,
      restrictions,
      allow_force_pushes,
      allow_deletions,
    }) => {
      try {
        const { data } = await getOctokit().rest.repos.updateBranchProtection({
          owner,
          repo,
          branch,
          required_status_checks: required_status_checks
            ? (JSON.parse(required_status_checks) as {
                strict: boolean;
                contexts: string[];
              })
            : null,
          enforce_admins: enforce_admins ?? null,
          required_pull_request_reviews: required_pull_request_reviews
            ? (JSON.parse(required_pull_request_reviews) as {
                required_approving_review_count: number;
              })
            : null,
          restrictions: restrictions ? JSON.parse(restrictions) : null,
          allow_force_pushes: allow_force_pushes ?? false,
          allow_deletions: allow_deletions ?? false,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_delete_branch_protection",
    "Remove branch protection from a branch.",
    {
      owner,
      repo,
      branch: z.string(),
    },
    async ({ owner, repo, branch }) => {
      try {
        await getOctokit().rest.repos.deleteBranchProtection({
          owner,
          repo,
          branch,
        });
        return jsonResult({ ok: true, branch, message: "Branch protection removed" });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_branches",
    "List branches in a repository.",
    {
      owner,
      repo,
      per_page: z.number().optional(),
    },
    async ({ owner, repo, per_page }) => {
      try {
        const { data } = await getOctokit().rest.repos.listBranches({
          owner,
          repo,
          per_page: per_page ?? 100,
        });
        return jsonResult(
          data.map((b) => ({
            name: b.name,
            protected: b.protected,
            sha: b.commit.sha,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
