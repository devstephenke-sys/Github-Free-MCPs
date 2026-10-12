import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { owner, perPage, repo } from "../lib/fields.js";
import { getOctokit } from "../lib/github.js";
import { errorResult, jsonResult } from "../lib/response.js";

export function registerDeploymentTools(server: McpServer): void {
  server.tool(
    "github_list_deployments",
    "List deployments for a repository (CD history).",
    {
      owner,
      repo,
      environment: z.string().optional().describe("Filter by environment name"),
      per_page: perPage,
    },
    async ({ owner, repo, environment, per_page }) => {
      try {
        const { data } = await getOctokit().rest.repos.listDeployments({
          owner,
          repo,
          environment: environment ?? undefined,
          per_page: per_page ?? 30,
        });
        return jsonResult(
          data.map((d) => ({
            id: d.id,
            ref: d.ref,
            sha: d.sha,
            environment: d.environment,
            description: d.description,
            created_at: d.created_at,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_create_deployment",
    "Create a deployment for a ref (triggers deployment workflows / environments).",
    {
      owner,
      repo,
      ref: z.string().describe("Branch, tag, or SHA"),
      environment: z.string().optional().describe("e.g. production, staging"),
      description: z.string().optional(),
      auto_merge: z.boolean().optional().describe("Merge default branch into ref"),
      required_contexts: z
        .string()
        .optional()
        .describe('JSON array of status check names, or "[]" for none'),
    },
    async ({ owner, repo, ref, environment, description, auto_merge, required_contexts }) => {
      try {
        const contexts = required_contexts ? (JSON.parse(required_contexts) as string[]) : undefined;
        const { data } = await getOctokit().rest.repos.createDeployment({
          owner,
          repo,
          ref,
          environment: environment ?? "production",
          description: description ?? undefined,
          auto_merge: auto_merge ?? false,
          required_contexts: contexts,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_create_deployment_status",
    "Update deployment status (success, failure, in_progress) for CD observability.",
    {
      owner,
      repo,
      deployment_id: z.number(),
      state: z
        .string()
        .describe("error | failure | inactive | in_progress | queued | pending | success"),
      environment_url: z.string().optional().describe("Live site URL"),
      description: z.string().optional(),
    },
    async ({ owner, repo, deployment_id, state, environment_url, description }) => {
      try {
        const { data } = await getOctokit().rest.repos.createDeploymentStatus({
          owner,
          repo,
          deployment_id,
          state: state as
            | "error"
            | "failure"
            | "inactive"
            | "in_progress"
            | "queued"
            | "pending"
            | "success",
          environment_url: environment_url ?? undefined,
          description: description ?? undefined,
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_environments",
    "List deployment environments and protection rules.",
    { owner, repo },
    async ({ owner, repo }) => {
      try {
        const { data } = await getOctokit().rest.repos.getAllEnvironments({
          owner,
          repo,
        });
        return jsonResult(data.environments);
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
