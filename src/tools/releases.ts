import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { owner, perPage, repo } from "../lib/fields.js";
import { getOctokit } from "../lib/github.js";
import { errorResult, jsonResult } from "../lib/response.js";

export function registerReleaseTools(server: McpServer): void {
  server.tool(
    "github_list_releases",
    "List releases for a repository.",
    {
      owner,
      repo,
      per_page: perPage,
    },
    async ({ owner, repo, per_page }) => {
      try {
        const { data } = await getOctokit().rest.repos.listReleases({
          owner,
          repo,
          per_page: per_page ?? 30,
        });
        return jsonResult(
          data.map((r) => ({
            id: r.id,
            tag_name: r.tag_name,
            name: r.name,
            draft: r.draft,
            prerelease: r.prerelease,
            published_at: r.published_at,
            html_url: r.html_url,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_get_release_by_tag",
    "Get a release by tag name.",
    {
      owner,
      repo,
      tag: z.string().describe("Tag name, e.g. v1.0.0"),
    },
    async ({ owner, repo, tag }) => {
      try {
        const { data } = await getOctokit().rest.repos.getReleaseByTag({
          owner,
          repo,
          tag,
        });
        return jsonResult({
          id: data.id,
          tag_name: data.tag_name,
          name: data.name,
          body: data.body,
          draft: data.draft,
          prerelease: data.prerelease,
          html_url: data.html_url,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_create_release",
    "Create a GitHub release (optionally from an existing tag).",
    {
      owner,
      repo,
      tag_name: z.string().describe("Tag for the release, e.g. v1.0.0"),
      name: z.string().optional().describe("Release title"),
      body: z.string().optional().describe("Release notes (markdown)"),
      draft: z.boolean().optional(),
      prerelease: z.boolean().optional(),
      target_commitish: z.string().optional().describe("Branch or commit if tag is new"),
    },
    async ({ owner, repo, tag_name, name, body, draft, prerelease, target_commitish }) => {
      try {
        const { data } = await getOctokit().rest.repos.createRelease({
          owner,
          repo,
          tag_name,
          name: name ?? undefined,
          body: body ?? undefined,
          draft: draft ?? false,
          prerelease: prerelease ?? false,
          target_commitish: target_commitish ?? undefined,
        });
        return jsonResult({
          id: data.id,
          tag_name: data.tag_name,
          html_url: data.html_url,
          upload_url: data.upload_url,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_tags",
    "List git tags in a repository.",
    {
      owner,
      repo,
      per_page: perPage,
    },
    async ({ owner, repo, per_page }) => {
      try {
        const { data } = await getOctokit().rest.repos.listTags({
          owner,
          repo,
          per_page: per_page ?? 30,
        });
        return jsonResult(
          data.map((t) => ({
            name: t.name,
            sha: t.commit.sha,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_create_tag",
    "Create a lightweight or annotated tag ref via the Git API.",
    {
      owner,
      repo,
      tag: z.string().describe("Tag name, e.g. v1.0.0"),
      sha: z.string().describe("Commit SHA to tag"),
      message: z.string().optional().describe("If set, creates an annotated tag object"),
    },
    async ({ owner, repo, tag, sha, message }) => {
      try {
        const octokit = getOctokit();
        if (message) {
          const { data: tagObj } = await octokit.rest.git.createTag({
            owner,
            repo,
            tag,
            message,
            object: sha,
            type: "commit",
          });
          await octokit.rest.git.createRef({
            owner,
            repo,
            ref: `refs/tags/${tag}`,
            sha: tagObj.sha,
          });
          return jsonResult({ tag, sha: tagObj.sha, annotated: true });
        }
        const { data } = await octokit.rest.git.createRef({
          owner,
          repo,
          ref: `refs/tags/${tag}`,
          sha,
        });
        return jsonResult({ ref: data.ref, sha, annotated: false });
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
