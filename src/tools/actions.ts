import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { owner, perPage, repo } from "../lib/fields.js";
import { getOctokit } from "../lib/github.js";
import { errorResult, jsonResult } from "../lib/response.js";

const workflowStatus = z
  .string()
  .optional()
  .describe("queued | in_progress | completed | failure | success | etc.");

export function registerActionsTools(server: McpServer): void {
  server.tool(
    "github_list_workflows",
    "List GitHub Actions workflows in a repository.",
    { owner, repo },
    async ({ owner, repo }) => {
      try {
        const { data } = await getOctokit().rest.actions.listRepoWorkflows({
          owner,
          repo,
        });
        return jsonResult(
          data.workflows.map((w) => ({
            id: w.id,
            name: w.name,
            path: w.path,
            state: w.state,
            html_url: w.html_url,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_workflow_runs",
    "List workflow runs (filter by workflow id, branch, or status).",
    {
      owner,
      repo,
      workflow_id: z.number().optional().describe("Workflow ID"),
      branch: z.string().optional(),
      status: workflowStatus,
      per_page: perPage,
    },
    async ({ owner, repo, workflow_id, branch, status, per_page }) => {
      try {
        const octokit = getOctokit();
        const common = {
          owner,
          repo,
          branch: branch ?? undefined,
          status: status as
            | "completed"
            | "action_required"
            | "cancelled"
            | "failure"
            | "neutral"
            | "skipped"
            | "stale"
            | "success"
            | "timed_out"
            | "in_progress"
            | "queued"
            | "requested"
            | "waiting"
            | "pending"
            | undefined,
          per_page: per_page ?? 20,
        };
        const { data } = workflow_id
          ? await octokit.rest.actions.listWorkflowRuns({
              ...common,
              workflow_id,
            })
          : await octokit.rest.actions.listWorkflowRunsForRepo(common);
        return jsonResult(
          data.workflow_runs.map((r) => ({
            id: r.id,
            name: r.name,
            status: r.status,
            conclusion: r.conclusion,
            head_branch: r.head_branch,
            head_sha: r.head_sha,
            event: r.event,
            html_url: r.html_url,
            created_at: r.created_at,
            updated_at: r.updated_at,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_get_workflow_run",
    "Get details for a single workflow run.",
    {
      owner,
      repo,
      run_id: z.number(),
    },
    async ({ owner, repo, run_id }) => {
      try {
        const { data } = await getOctokit().rest.actions.getWorkflowRun({
          owner,
          repo,
          run_id,
        });
        return jsonResult({
          id: data.id,
          name: data.name,
          status: data.status,
          conclusion: data.conclusion,
          head_branch: data.head_branch,
          head_sha: data.head_sha,
          html_url: data.html_url,
          jobs_url: data.jobs_url,
          run_attempt: data.run_attempt,
        });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_workflow_jobs",
    "List jobs for a workflow run (steps, conclusions).",
    {
      owner,
      repo,
      run_id: z.number(),
    },
    async ({ owner, repo, run_id }) => {
      try {
        const { data } = await getOctokit().rest.actions.listJobsForWorkflowRun({
          owner,
          repo,
          run_id,
          per_page: 100,
        });
        return jsonResult(
          data.jobs.map((j) => ({
            id: j.id,
            name: j.name,
            status: j.status,
            conclusion: j.conclusion,
            started_at: j.started_at,
            completed_at: j.completed_at,
            html_url: j.html_url,
            steps: j.steps?.map((s) => ({
              name: s.name,
              status: s.status,
              conclusion: s.conclusion,
            })),
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_rerun_workflow",
    "Re-run a failed or cancelled workflow run.",
    {
      owner,
      repo,
      run_id: z.number(),
    },
    async ({ owner, repo, run_id }) => {
      try {
        await getOctokit().rest.actions.reRunWorkflow({
          owner,
          repo,
          run_id,
        });
        return jsonResult({ ok: true, run_id, message: "Workflow re-run requested" });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_cancel_workflow_run",
    "Cancel an in-progress workflow run.",
    {
      owner,
      repo,
      run_id: z.number(),
    },
    async ({ owner, repo, run_id }) => {
      try {
        await getOctokit().rest.actions.cancelWorkflowRun({
          owner,
          repo,
          run_id,
        });
        return jsonResult({ ok: true, run_id, message: "Workflow cancel requested" });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_dispatch_workflow",
    "Trigger a workflow_dispatch event (manual CI run).",
    {
      owner,
      repo,
      workflow_id: z.string().describe("Workflow ID or filename e.g. deploy.yml"),
      ref: z.string().describe("Branch or tag to run on"),
      inputs: z
        .string()
        .optional()
        .describe("JSON object of workflow input key/value pairs"),
    },
    async ({ owner, repo, workflow_id, ref, inputs }) => {
      try {
        const parsedInputs = inputs ? (JSON.parse(inputs) as Record<string, string>) : undefined;
        await getOctokit().rest.actions.createWorkflowDispatch({
          owner,
          repo,
          workflow_id,
          ref,
          inputs: parsedInputs,
        });
        return jsonResult({ ok: true, workflow_id, ref, message: "workflow_dispatch sent" });
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_actions_secrets",
    "List Actions secret names (values are never returned).",
    { owner, repo },
    async ({ owner, repo }) => {
      try {
        const { data } = await getOctokit().rest.actions.listRepoSecrets({
          owner,
          repo,
          per_page: 100,
        });
        return jsonResult(
          data.secrets.map((s) => ({
            name: s.name,
            updated_at: s.updated_at,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_actions_variables",
    "List Actions variables for a repository (non-secret config).",
    { owner, repo },
    async ({ owner, repo }) => {
      try {
        const { data } = await getOctokit().rest.actions.listRepoVariables({
          owner,
          repo,
          per_page: 100,
        });
        return jsonResult(data.variables);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_list_workflow_run_artifacts",
    "List CI build artifacts for a workflow run.",
    {
      owner,
      repo,
      run_id: z.number(),
    },
    async ({ owner, repo, run_id }) => {
      try {
        const { data } = await getOctokit().rest.actions.listWorkflowRunArtifacts({
          owner,
          repo,
          run_id,
          per_page: 100,
        });
        return jsonResult(
          data.artifacts.map((a) => ({
            id: a.id,
            name: a.name,
            size_in_bytes: a.size_in_bytes,
            expired: a.expired,
            expires_at: a.expires_at,
            archive_download_url: a.archive_download_url,
          })),
        );
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_download_workflow_artifact",
    "Get download URL metadata for a workflow artifact (follow URL with auth to download zip).",
    {
      owner,
      repo,
      artifact_id: z.number(),
    },
    async ({ owner, repo, artifact_id }) => {
      try {
        const { data } = await getOctokit().rest.actions.downloadArtifact({
          owner,
          repo,
          artifact_id,
          archive_format: "zip",
        });
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
