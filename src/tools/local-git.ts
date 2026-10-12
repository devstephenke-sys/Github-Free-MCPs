import { existsSync } from "node:fs";
import { resolve } from "node:path";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { simpleGit, type SimpleGit } from "simple-git";
import { z } from "zod";
import { errorResult, jsonResult, textResult } from "../lib/response.js";

const repoPath = z.string().describe("Path to git repository root");

function gitAt(cwd: string): SimpleGit {
  const dir = resolve(cwd);
  if (!existsSync(resolve(dir, ".git"))) {
    throw new Error(`Not a git repository: ${dir}`);
  }
  return simpleGit({ baseDir: dir });
}

export function registerLocalGitTools(server: McpServer): void {
  server.tool(
    "git_status",
    "Show working tree status in a local clone (branch, staged/unstaged files).",
    { path: repoPath },
    async ({ path }) => {
      try {
        const git = gitAt(path);
        const status = await git.status();
        return jsonResult({
          current: status.current,
          tracking: status.tracking,
          ahead: status.ahead,
          behind: status.behind,
          staged: status.staged,
          modified: status.modified,
          created: status.created,
          deleted: status.deleted,
          conflicted: status.conflicted,
          isClean: status.isClean(),
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "git_commit",
    "Stage all changes and create a local commit.",
    {
      path: repoPath,
      message: z.string().describe("Commit message"),
      all: z
        .boolean()
        .optional()
        .describe("Stage all changes (default true). If false, only staged files"),
    },
    async ({ path, message, all }) => {
      try {
        const git = gitAt(path);
        if (all !== false) {
          await git.add("-A");
        }
        const result = await git.commit(message);
        return jsonResult({
          commit: result.commit,
          summary: result.summary,
          branch: result.branch,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "git_push",
    "Push commits to remote (set upstream on first push if needed).",
    {
      path: repoPath,
      remote: z.string().optional().describe("Remote name (default origin)"),
      branch: z.string().optional().describe("Branch to push; default current branch"),
      set_upstream: z
        .boolean()
        .optional()
        .describe("Use -u on push (default true for new branches)"),
    },
    async ({ path, remote, branch, set_upstream }) => {
      try {
        const git = gitAt(path);
        const rem = remote ?? "origin";
        const status = await git.status();
        const br = branch ?? status.current ?? "HEAD";
        const args = set_upstream === false ? [rem, br] : ["-u", rem, br];
        await git.push(args);
        return jsonResult({
          pushed: true,
          remote: rem,
          branch: br,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "git_pull",
    "Pull from remote with rebase (ff-only friendly for CI branches).",
    {
      path: repoPath,
      remote: z.string().optional().describe("Default origin"),
      branch: z.string().optional(),
      rebase: z.boolean().optional().describe("Use --rebase (default true)"),
    },
    async ({ path, remote, branch, rebase }) => {
      try {
        const git = gitAt(path);
        const rem = remote ?? "origin";
        const status = await git.status();
        const br = branch ?? status.current ?? undefined;
        if (rebase !== false) {
          await git.pull(rem, br, { "--rebase": "true" });
        } else {
          await git.pull(rem, br);
        }
        return textResult(`Pulled ${rem}/${br ?? "current branch"}`);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "git_log",
    "Recent commit log on current branch.",
    {
      path: repoPath,
      max_count: z.number().optional().describe("Number of commits (default 10)"),
    },
    async ({ path, max_count }) => {
      try {
        const git = gitAt(path);
        const log = await git.log({ maxCount: max_count ?? 10 });
        return jsonResult(
          log.all.map((c) => ({
            hash: c.hash,
            date: c.date,
            message: c.message,
            author_name: c.author_name,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "git_clone",
    "Clone a repository into a directory (uses local git, not API).",
    {
      url: z.string().describe("HTTPS or SSH clone URL"),
      directory: z.string().describe("Target directory path"),
      branch: z.string().optional().describe("Optional branch to checkout"),
    },
    async ({ url, directory, branch }) => {
      try {
        const dir = resolve(directory);
        const git = simpleGit();
        await git.clone(url, dir, branch ? ["--branch", branch] : []);
        return jsonResult({ cloned: url, directory: dir, branch: branch ?? "default" });
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
