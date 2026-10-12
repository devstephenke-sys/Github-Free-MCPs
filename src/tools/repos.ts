import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getOctokit } from "../lib/github.js";
import { owner, perPage, repo } from "../lib/fields.js";
import { errorResult, jsonResult } from "../lib/response.js";

export function registerRepoTools(server: McpServer): void {
  server.tool(
    "github_get_authenticated_user",
    "Get the authenticated GitHub user (validates token and shows login).",
    {},
    async () => {
      try {
        const { data } = await getOctokit().rest.users.getAuthenticated();
        return jsonResult({
          login: data.login,
          id: data.id,
          name: data.name,
          type: data.type,
          html_url: data.html_url,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_get_rate_limit",
    "Check REST API rate limit status for the current token.",
    {},
    async () => {
      try {
        const { data } = await getOctokit().rest.rateLimit.get();
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_create_repository",
    "Create a new repository for the authenticated user or an organization.",
    {
      name: z.string().describe("Repository name"),
      description: z.string().optional().describe("Short description"),
      private: z.boolean().optional().describe("Private repo (default false)"),
      org: z.string().optional().describe("Organization login; omit for user account"),
      auto_init: z.boolean().optional().describe("Initialize with README (default true)"),
      gitignore_template: z.string().optional().describe("Gitignore template name, e.g. Node"),
    },
    async ({ name, description, private: isPrivate, org, auto_init, gitignore_template }) => {
      try {
        const octokit = getOctokit();
        const body = {
          name,
          description: description ?? undefined,
          private: isPrivate ?? false,
          auto_init: auto_init ?? true,
          gitignore_template: gitignore_template ?? undefined,
        };
        const { data } = org
          ? await octokit.rest.repos.createInOrg({ org, ...body })
          : await octokit.rest.repos.createForAuthenticatedUser(body);
        return jsonResult({
          full_name: data.full_name,
          html_url: data.html_url,
          clone_url: data.clone_url,
          default_branch: data.default_branch,
          private: data.private,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_get_repository",
    "Get repository metadata.",
    { owner, repo },
    async ({ owner, repo }) => {
      try {
        const { data } = await getOctokit().rest.repos.get({ owner, repo });
        return jsonResult({
          full_name: data.full_name,
          description: data.description,
          default_branch: data.default_branch,
          html_url: data.html_url,
          clone_url: data.clone_url,
          private: data.private,
          open_issues: data.open_issues_count,
          pushed_at: data.pushed_at,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_repositories",
    "List repositories for a user or organization.",
    {
      owner,
      type: z
        .string()
        .optional()
        .describe("For orgs: all | public | private | forks | sources | member"),
      per_page: perPage,
    },
    async ({ owner, type, per_page }) => {
      try {
        const octokit = getOctokit();
        const { data: user } = await octokit.rest.users.getByUsername({ username: owner });
        let repos;
        if (user.type === "Organization") {
          const res = await octokit.rest.repos.listForOrg({
            org: owner,
            type: (type as "all") ?? "all",
            per_page: per_page ?? 30,
          });
          repos = res.data;
        } else {
          const res = await octokit.rest.repos.listForUser({
            username: owner,
            per_page: per_page ?? 30,
          });
          repos = res.data;
        }
        return jsonResult(
          repos.map((r) => ({
            full_name: r.full_name,
            private: r.private,
            default_branch: r.default_branch,
            html_url: r.html_url,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_create_branch",
    "Create a branch from an existing ref (e.g. main).",
    {
      owner,
      repo,
      branch: z.string().describe("New branch name"),
      from_ref: z
        .string()
        .optional()
        .describe("Source ref (branch or SHA). Default: default branch"),
    },
    async ({ owner, repo, branch, from_ref }) => {
      try {
        const octokit = getOctokit();
        let sha: string;
        if (from_ref) {
          const ref = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${from_ref}`,
          });
          sha = ref.data.object.sha;
        } else {
          const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
          const ref = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${repoData.default_branch}`,
          });
          sha = ref.data.object.sha;
        }
        const { data } = await octokit.rest.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branch}`,
          sha,
        });
        return jsonResult({ ref: data.ref, url: data.url });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_fork_repository",
    "Fork a repository to the authenticated user or an organization.",
    {
      owner,
      repo,
      organization: z.string().optional().describe("Org to fork into; default: your user"),
      default_branch_only: z.boolean().optional().describe("Fork only default branch"),
    },
    async ({ owner, repo, organization, default_branch_only }) => {
      try {
        const { data } = await getOctokit().rest.repos.createFork({
          owner,
          repo,
          organization: organization ?? undefined,
          default_branch_only: default_branch_only ?? undefined,
        });
        return jsonResult({
          full_name: data.full_name,
          html_url: data.html_url,
          clone_url: data.clone_url,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
