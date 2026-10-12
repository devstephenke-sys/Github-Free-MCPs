import { Octokit } from "@octokit/rest";

let octokitInstance: Octokit | null = null;

export function getToken(): string {
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";
  if (!token) {
    throw new Error(
      "Missing GITHUB_TOKEN (or GH_TOKEN). Create a PAT: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens",
    );
  }
  return token;
}

export function getOctokit(): Octokit {
  if (!octokitInstance) {
    const baseUrl =
      process.env.GITHUB_API_URL ??
      (process.env.GITHUB_HOST && process.env.GITHUB_HOST !== "github.com"
        ? `https://${process.env.GITHUB_HOST}/api/v3`
        : undefined);

    octokitInstance = new Octokit({
      auth: getToken(),
      userAgent: "github-cicd-mcp/1.1.0",
      ...(baseUrl ? { baseUrl } : {}),
    });
  }
  return octokitInstance;
}

export const ownerRepoSchema = {
  owner: { type: "string" as const, description: "Repository owner (user or org login)" },
  repo: { type: "string" as const, description: "Repository name" },
};
