import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { graphql } from "@octokit/graphql";
import { z } from "zod";
import { getToken } from "../lib/github.js";
import { errorResult, jsonResult } from "../lib/response.js";

function graphqlClient() {
  const baseUrl =
    process.env.GITHUB_GRAPHQL_URL ??
    (process.env.GITHUB_HOST && process.env.GITHUB_HOST !== "github.com"
      ? `https://${process.env.GITHUB_HOST}/api/graphql`
      : undefined);

  return graphql.defaults({
    headers: {
      authorization: `token ${getToken()}`,
    },
    ...(baseUrl ? { baseUrl } : {}),
  });
}

export function registerGraphqlTools(server: McpServer): void {
  server.tool(
    "github_graphql_query",
    "Run a read-only GitHub GraphQL query (https://docs.github.com/en/graphql). Variables optional.",
    {
      query: z.string().describe("GraphQL query string"),
      variables: z.string().optional().describe("JSON object of GraphQL variables"),
    },
    async ({ query, variables }) => {
      try {
        const trimmed = query.trim();
        if (/^\s*mutation\b/i.test(trimmed)) {
          throw new Error(
            "Mutations are blocked in this tool. Use REST tools or github_graphql_mutation explicitly.",
          );
        }
        const vars = variables ? (JSON.parse(variables) as Record<string, unknown>) : undefined;
        const data = await graphqlClient()(query, vars);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_graphql_mutation",
    "Run a GitHub GraphQL mutation (create/update via GraphQL API). Use with care.",
    {
      query: z.string().describe("GraphQL mutation string"),
      variables: z.string().optional().describe("JSON object of GraphQL variables"),
    },
    async ({ query, variables }) => {
      try {
        const vars = variables ? (JSON.parse(variables) as Record<string, unknown>) : undefined;
        const data = await graphqlClient()(query, vars);
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );

  server.tool(
    "github_graphql_repository_overview",
    "Quick GraphQL snapshot: repo, default branch, latest commit, open PR count.",
    {
      owner: z.string(),
      name: z.string().describe("Repository name"),
    },
    async ({ owner, name }) => {
      try {
        const data = await graphqlClient()(
          `
          query RepoOverview($owner: String!, $name: String!) {
            repository(owner: $owner, name: $name) {
              nameWithOwner
              description
              isPrivate
              defaultBranchRef { name }
              pushedAt
              openPullRequests: pullRequests(states: OPEN) { totalCount }
              openIssues: issues(states: OPEN) { totalCount }
              primaryLanguage { name }
            }
          }
        `,
          { owner, name },
        );
        return jsonResult(data);
      } catch (e) {
        return errorResult(e);
      }
    },
  );
}
