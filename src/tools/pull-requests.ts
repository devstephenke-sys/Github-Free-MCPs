import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { owner, perPage, repo } from "../lib/fields.js";
import { getOctokit } from "../lib/github.js";
import { errorResult, jsonResult } from "../lib/response.js";

export function registerPullRequestTools(server: McpServer): void {
  server.tool(
    "github_create_pull_request",
    "Open a pull request (base ← head).",
    {
      owner,
      repo,
      title: z.string(),
      head: z.string().describe("Head branch (or user:branch for forks)"),
      base: z.string().describe("Base branch (e.g. main)"),
      body: z.string().optional().describe("PR description (markdown)"),
      draft: z.boolean().optional().describe("Create as draft PR"),
    },
    async ({ owner, repo, title, head, base, body, draft }) => {
      try {
        const { data } = await getOctokit().rest.pulls.create({
          owner,
          repo,
          title,
          head,
          base,
          body: body ?? undefined,
          draft: draft ?? undefined,
        });
        return jsonResult({
          number: data.number,
          title: data.title,
          state: data.state,
          html_url: data.html_url,
          mergeable: data.mergeable,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_pull_requests",
    "List pull requests for a repository.",
    {
      owner,
      repo,
      state: z.string().optional().describe("open | closed | all (default open)"),
      per_page: perPage,
    },
    async ({ owner, repo, state, per_page }) => {
      try {
        const { data } = await getOctokit().rest.pulls.list({
          owner,
          repo,
          state: (state as "open" | "closed" | "all") ?? "open",
          per_page: per_page ?? 30,
        });
        return jsonResult(
          data.map((pr) => ({
            number: pr.number,
            title: pr.title,
            state: pr.state,
            user: pr.user?.login,
            head: pr.head.ref,
            base: pr.base.ref,
            html_url: pr.html_url,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_get_pull_request",
    "Get pull request details including merge status.",
    {
      owner,
      repo,
      pull_number: z.number(),
    },
    async ({ owner, repo, pull_number }) => {
      try {
        const { data } = await getOctokit().rest.pulls.get({
          owner,
          repo,
          pull_number,
        });
        return jsonResult({
          number: data.number,
          title: data.title,
          body: data.body,
          state: data.state,
          merged: data.merged,
          mergeable: data.mergeable,
          mergeable_state: data.mergeable_state,
          head: { ref: data.head.ref, sha: data.head.sha },
          base: { ref: data.base.ref, sha: data.base.sha },
          html_url: data.html_url,
          changed_files: data.changed_files,
          additions: data.additions,
          deletions: data.deletions,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_merge_pull_request",
    "Merge a pull request when checks pass (squash, merge, or rebase).",
    {
      owner,
      repo,
      pull_number: z.number(),
      merge_method: z
        .string()
        .optional()
        .describe("merge | squash | rebase (default squash)"),
      commit_title: z.string().optional(),
      commit_message: z.string().optional(),
    },
    async ({ owner, repo, pull_number, merge_method, commit_title, commit_message }) => {
      try {
        const { data } = await getOctokit().rest.pulls.merge({
          owner,
          repo,
          pull_number,
          merge_method: (merge_method as "merge" | "squash" | "rebase") ?? "squash",
          commit_title: commit_title ?? undefined,
          commit_message: commit_message ?? undefined,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_update_pull_request",
    "Update PR title, body, or state (open/closed).",
    {
      owner,
      repo,
      pull_number: z.number(),
      title: z.string().optional(),
      body: z.string().optional(),
      state: z.string().optional().describe("open | closed"),
    },
    async ({ owner, repo, pull_number, title, body, state }) => {
      try {
        const { data } = await getOctokit().rest.pulls.update({
          owner,
          repo,
          pull_number,
          title: title ?? undefined,
          body: body ?? undefined,
          state: state as "open" | "closed" | undefined,
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
    "github_list_pull_request_files",
    "List files changed in a pull request.",
    {
      owner,
      repo,
      pull_number: z.number(),
    },
    async ({ owner, repo, pull_number }) => {
      try {
        const { data } = await getOctokit().rest.pulls.listFiles({
          owner,
          repo,
          pull_number,
          per_page: 100,
        });
        return jsonResult(
          data.map((f) => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
            patch: f.patch?.slice(0, 2000),
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_create_pull_request_review",
    "Submit a PR review (comment, approve, or request changes).",
    {
      owner,
      repo,
      pull_number: z.number(),
      event: z.string().describe("COMMENT | APPROVE | REQUEST_CHANGES"),
      body: z.string().optional().describe("Review comment"),
    },
    async ({ owner, repo, pull_number, event, body }) => {
      try {
        const { data } = await getOctokit().rest.pulls.createReview({
          owner,
          repo,
          pull_number,
          event: event as "COMMENT" | "APPROVE" | "REQUEST_CHANGES",
          body: body ?? undefined,
        });
        return jsonResult({
          id: data.id,
          state: data.state,
          html_url: data.html_url,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
