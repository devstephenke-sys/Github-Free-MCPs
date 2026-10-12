import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { owner, perPage, repo } from "../lib/fields.js";
import { getOctokit } from "../lib/github.js";
import { errorResult, jsonResult } from "../lib/response.js";

export function registerCommitTools(server: McpServer): void {
  server.tool(
    "github_list_commits",
    "List commits on a branch or for the whole repo.",
    {
      owner,
      repo,
      sha: z.string().optional().describe("Branch or commit SHA to start from"),
      per_page: perPage,
    },
    async ({ owner, repo, sha, per_page }) => {
      try {
        const { data } = await getOctokit().rest.repos.listCommits({
          owner,
          repo,
          sha: sha ?? undefined,
          per_page: per_page ?? 30,
        });
        return jsonResult(
          data.map((c) => ({
            sha: c.sha,
            message: c.commit.message,
            author: c.commit.author?.name,
            date: c.commit.author?.date,
            html_url: c.html_url,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_get_commit",
    "Get a single commit with files changed.",
    {
      owner,
      repo,
      ref: z.string().describe("Commit SHA"),
    },
    async ({ owner, repo, ref }) => {
      try {
        const { data } = await getOctokit().rest.repos.getCommit({
          owner,
          repo,
          ref,
        });
        return jsonResult({
          sha: data.sha,
          message: data.commit.message,
          author: data.commit.author,
          stats: data.stats,
          files: data.files?.map((f) => ({
            filename: f.filename,
            status: f.status,
            additions: f.additions,
            deletions: f.deletions,
          })),
          html_url: data.html_url,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_compare_commits",
    "Compare two commits (base...head) — useful for release notes and PR scope.",
    {
      owner,
      repo,
      base: z.string().describe("Base ref or SHA"),
      head: z.string().describe("Head ref or SHA"),
    },
    async ({ owner, repo, base, head }) => {
      try {
        const { data } = await getOctokit().rest.repos.compareCommitsWithBasehead({
          owner,
          repo,
          basehead: `${base}...${head}`,
        });
        return jsonResult({
          status: data.status,
          ahead_by: data.ahead_by,
          behind_by: data.behind_by,
          total_commits: data.total_commits,
          commits: data.commits?.map((c) => ({
            sha: c.sha,
            message: c.commit.message,
          })),
          files: data.files?.map((f) => f.filename),
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_create_commit",
    "Create a commit on a branch by updating one or more files (GitHub Git API — no local clone required).",
    {
      owner,
      repo,
      branch: z.string().describe("Branch to commit to"),
      message: z.string().describe("Commit message"),
      files: z
        .string()
        .describe(
          'JSON array of { "path": "src/a.ts", "content": "...", "encoding": "utf-8" | "base64" }',
        ),
    },
    async ({ owner, repo, branch, message, files }) => {
      try {
        const fileList = JSON.parse(files) as Array<{
          path: string;
          content: string;
          encoding?: "utf-8" | "base64";
        }>;
        if (!Array.isArray(fileList) || fileList.length === 0) {
          throw new Error("files must be a non-empty JSON array");
        }

        const octokit = getOctokit();
        const refRes = await octokit.rest.git.getRef({
          owner,
          repo,
          ref: `heads/${branch}`,
        });
        const parentSha = refRes.data.object.sha;

        const { data: parentCommit } = await octokit.rest.git.getCommit({
          owner,
          repo,
          commit_sha: parentSha,
        });

        const treeItems: Array<{
          path: string;
          mode: "100644";
          type: "blob";
          sha: string;
        }> = [];

        for (const file of fileList) {
          const encoding = file.encoding ?? "utf-8";
          const { data: blob } = await octokit.rest.git.createBlob({
            owner,
            repo,
            content: file.content,
            encoding: encoding === "base64" ? "base64" : "utf-8",
          });
          treeItems.push({
            path: file.path,
            mode: "100644",
            type: "blob",
            sha: blob.sha,
          });
        }

        const { data: tree } = await octokit.rest.git.createTree({
          owner,
          repo,
          base_tree: parentCommit.tree.sha,
          tree: treeItems,
        });

        const { data: commit } = await octokit.rest.git.createCommit({
          owner,
          repo,
          message,
          tree: tree.sha,
          parents: [parentSha],
        });

        await octokit.rest.git.updateRef({
          owner,
          repo,
          ref: `heads/${branch}`,
          sha: commit.sha,
        });

        return jsonResult({
          sha: commit.sha,
          message: commit.message,
          branch,
          html_url: `https://github.com/${owner}/${repo}/commit/${commit.sha}`,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_get_combined_status",
    "Get combined commit status (legacy statuses + check runs summary) for CI/CD gates.",
    {
      owner,
      repo,
      ref: z.string().describe("Commit SHA or ref"),
    },
    async ({ owner, repo, ref }) => {
      try {
        const { data } = await getOctokit().rest.repos.getCombinedStatusForRef({
          owner,
          repo,
          ref,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_check_runs_for_ref",
    "List GitHub Actions check runs for a commit ref.",
    {
      owner,
      repo,
      ref: z.string().describe("Commit SHA"),
    },
    async ({ owner, repo, ref }) => {
      try {
        const { data } = await getOctokit().rest.checks.listForRef({
          owner,
          repo,
          ref,
          per_page: 100,
        });
        return jsonResult(
          data.check_runs.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            conclusion: c.conclusion,
            html_url: c.html_url,
            started_at: c.started_at,
            completed_at: c.completed_at,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
