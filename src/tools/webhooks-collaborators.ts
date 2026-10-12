import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { owner, perPage, repo } from "../lib/fields.js";
import { getOctokit } from "../lib/github.js";
import { errorResult, jsonResult } from "../lib/response.js";

export function registerWebhookTools(server: McpServer): void {
  server.tool(
    "github_list_webhooks",
    "List repository webhooks.",
    { owner, repo, per_page: perPage },
    async ({ owner, repo, per_page }) => {
      try {
        const { data } = await getOctokit().rest.repos.listWebhooks({
          owner,
          repo,
          per_page: per_page ?? 30,
        });
        return jsonResult(
          data.map((h) => ({
            id: h.id,
            name: h.name,
            active: h.active,
            events: h.events,
            url: h.config.url,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_create_webhook",
    "Create a repository webhook (e.g. for CI notifications).",
    {
      owner,
      repo,
      url: z.string().describe("Payload URL"),
      secret: z.string().optional().describe("Webhook secret"),
      events: z
        .string()
        .optional()
        .describe('JSON array of events, default ["push","pull_request"]'),
      active: z.boolean().optional(),
    },
    async ({ owner, repo, url, secret, events, active }) => {
      try {
        const eventList = events
          ? (JSON.parse(events) as string[])
          : ["push", "pull_request"];
        const { data } = await getOctokit().rest.repos.createWebhook({
          owner,
          repo,
          config: {
            url,
            content_type: "json",
            secret: secret ?? undefined,
            insecure_ssl: "0",
          },
          events: eventList,
          active: active ?? true,
        });
        return jsonResult({ id: data.id, url: data.config.url, events: data.events });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_delete_webhook",
    "Delete a repository webhook by ID.",
    {
      owner,
      repo,
      hook_id: z.number(),
    },
    async ({ owner, repo, hook_id }) => {
      try {
        await getOctokit().rest.repos.deleteWebhook({ owner, repo, hook_id });
        return jsonResult({ ok: true, hook_id });
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}

export function registerCollaboratorTools(server: McpServer): void {
  server.tool(
    "github_list_collaborators",
    "List collaborators and their permissions.",
    { owner, repo, per_page: perPage },
    async ({ owner, repo, per_page }) => {
      try {
        const { data } = await getOctokit().rest.repos.listCollaborators({
          owner,
          repo,
          per_page: per_page ?? 100,
        });
        return jsonResult(
          data.map((c) => ({
            login: c.login,
            permissions: c.permissions,
            role_name: c.role_name,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_add_collaborator",
    "Invite or add a collaborator to a repository.",
    {
      owner,
      repo,
      username: z.string(),
      permission: z
        .string()
        .optional()
        .describe("pull | push | admin | maintain | triage (default push)"),
    },
    async ({ owner, repo, username, permission }) => {
      try {
        await getOctokit().rest.repos.addCollaborator({
          owner,
          repo,
          username,
          permission: permission as "pull" | "push" | "admin" | "maintain" | "triage" | undefined,
        });
        return jsonResult({ ok: true, username, permission: permission ?? "push" });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_teams",
    "List teams in an organization (for CI/CD access planning).",
    {
      org: z.string(),
      per_page: perPage,
    },
    async ({ org, per_page }) => {
      try {
        const { data } = await getOctokit().rest.teams.list({
          org,
          per_page: per_page ?? 100,
        });
        return jsonResult(
          data.map((t) => ({
            id: t.id,
            name: t.name,
            slug: t.slug,
            privacy: t.privacy,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
