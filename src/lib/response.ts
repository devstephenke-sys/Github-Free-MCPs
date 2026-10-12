import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { RequestError } from "@octokit/request-error";

function formatUnknownError(err: unknown): string {
  if (err instanceof RequestError) {
    const detail =
      err.response?.data !== undefined
        ? typeof err.response.data === "string"
          ? err.response.data
          : JSON.stringify(err.response.data, null, 2)
        : "";
    const requestId =
      err.response?.headers && "x-github-request-id" in err.response.headers
        ? String(err.response.headers["x-github-request-id"])
        : undefined;
    return [
      `GitHub API ${err.status}: ${err.message}`,
      requestId ? `request-id: ${requestId}` : "",
      detail ? detail : "",
    ]
      .filter(Boolean)
      .join("\n");
  }
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return String(err);
}

export function jsonResult(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function textResult(message: string): CallToolResult {
  return {
    content: [{ type: "text", text: message }],
  };
}

export function errorResult(err: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: `Error: ${formatUnknownError(err)}` }],
    isError: true,
  };
}
