import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { owner, perPage, repo } from "../lib/fields.js";
import { getOctokit } from "../lib/github.js";
import { errorResult, jsonResult } from "../lib/response.js";

export function registerIssueTools(server: McpServer): void {
  server.tool(
    "github_create_issue",
    "Create an issue in a repository.",
    {
      owner,
      repo,
      title: z.string(),
      body: z.string().optional(),
      labels: z.string().optional().describe("JSON array of label names"),
      assignees: z.string().optional().describe("JSON array of GitHub usernames"),
    },
    async ({ owner, repo, title, body, labels, assignees }) => {
      try {
        const { data } = await getOctokit().rest.issues.create({
          owner,
          repo,
          title,
          body: body ?? undefined,
          labels: labels ? (JSON.parse(labels) as string[]) : undefined,
          assignees: assignees ? (JSON.parse(assignees) as string[]) : undefined,
        });
        return jsonResult({
          number: data.number,
          title: data.title,
          state: data.state,
          html_url: data.html_url,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_issues",
    "List issues (excludes pull requests unless filtered).",
    {
      owner,
      repo,
      state: z.string().optional().describe("open | closed | all"),
      labels: z.string().optional().describe("Comma-separated label names"),
      per_page: perPage,
    },
    async ({ owner, repo, state, labels, per_page }) => {
      try {
        const { data } = await getOctokit().rest.issues.listForRepo({
          owner,
          repo,
          state: (state as "open" | "closed" | "all") ?? "open",
          labels: labels ?? undefined,
          per_page: per_page ?? 30,
        });
        return jsonResult(
          data
            .filter((i) => !i.pull_request)
            .map((i) => ({
              number: i.number,
              title: i.title,
              state: i.state,
              user: i.user?.login,
              labels: i.labels.map((l) => (typeof l === "string" ? l : l.name)),
              html_url: i.html_url,
            })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_get_issue",
    "Get issue details by number.",
    {
      owner,
      repo,
      issue_number: z.number(),
    },
    async ({ owner, repo, issue_number }) => {
      try {
        const { data } = await getOctokit().rest.issues.get({
          owner,
          repo,
          issue_number,
        });
        return jsonResult({
          number: data.number,
          title: data.title,
          body: data.body,
          state: data.state,
          user: data.user?.login,
          labels: data.labels.map((l) => (typeof l === "string" ? l : l.name)),
          assignees: data.assignees?.map((a) => a.login),
          html_url: data.html_url,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_update_issue",
    "Update issue title, body, state, or labels.",
    {
      owner,
      repo,
      issue_number: z.number(),
      title: z.string().optional(),
      body: z.string().optional(),
      state: z.string().optional().describe("open | closed"),
      labels: z.string().optional().describe("JSON array of label names (replaces all labels)"),
    },
    async ({ owner, repo, issue_number, title, body, state, labels }) => {
      try {
        const { data } = await getOctokit().rest.issues.update({
          owner,
          repo,
          issue_number,
          title: title ?? undefined,
          body: body ?? undefined,
          state: state as "open" | "closed" | undefined,
          labels: labels ? (JSON.parse(labels) as string[]) : undefined,
        });
        return jsonResult({
          number: data.number,
          title: data.title,
          state: data.state,
          html_url: data.html_url,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_add_issue_comment",
    "Add a comment to an issue or pull request.",
    {
      owner,
      repo,
      issue_number: z.number(),
      body: z.string(),
    },
    async ({ owner, repo, issue_number, body }) => {
      try {
        const { data } = await getOctokit().rest.issues.createComment({
          owner,
          repo,
          issue_number,
          body,
        });
        return jsonResult({
          id: data.id,
          html_url: data.html_url,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_issue_comments",
    "List comments on an issue or PR.",
    {
      owner,
      repo,
      issue_number: z.number(),
      per_page: perPage,
    },
    async ({ owner, repo, issue_number, per_page }) => {
      try {
        const { data } = await getOctokit().rest.issues.listComments({
          owner,
          repo,
          issue_number,
          per_page: per_page ?? 30,
        });
        return jsonResult(
          data.map((c) => ({
            id: c.id,
            user: c.user?.login,
            body: c.body,
            created_at: c.created_at,
            html_url: c.html_url,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
