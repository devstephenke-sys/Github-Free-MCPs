# github-cicd-mcp

[![CI](https://github.com/devstephenke-sys/Github-Free-MCPs/actions/workflows/ci.yml/badge.svg)](https://github.com/devstephenke-sys/Github-Free-MCPs/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/github-cicd-mcp.svg)](https://www.npmjs.com/package/github-cicd-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Model Context Protocol (MCP) server** for [GitHub REST](https://docs.github.com/en/rest) and [GraphQL](https://docs.github.com/en/graphql) — built for **CI/CD and DevOps** workflows in Cursor, Claude Desktop, and other MCP clients.

Give your AI agent tools to manage repos, commits, pull requests, issues, GitHub Actions, deployments, billing, releases, branch protection, webhooks, and local `git` — without leaving the editor.

---

## Use this folder on your machine (local build)

```bash
cd "Github MCPs"
npm install
npm run build
npm run verify
```

Add to **Cursor → Settings → MCP** (merge into your config):

```json
{
  "mcpServers": {
    "github-cicd": {
      "command": "node",
      "args": ["C:/Users/DBTECH AFRICA/Desktop/Github MCPs/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    }
  }
}
```

Set `GITHUB_TOKEN` in Windows environment variables (or your client’s secret store). Restart MCP after changes. See also `cursor-mcp.example.json`.

---

## Install (for developers using your published package)

### npm / npx (recommended)

After the package is [published to npm](RELEASING.md):

```json
{
  "mcpServers": {
    "github-cicd": {
      "command": "npx",
      "args": ["-y", "github-cicd-mcp"],
      "env": {
        "GITHUB_TOKEN": "${env:GITHUB_TOKEN}"
      }
    }
  }
}
```

Set `GITHUB_TOKEN` (or `GH_TOKEN`) in your system environment, or replace `${env:GITHUB_TOKEN}` with a secret reference your client supports.

### From source

```bash
git clone https://github.com/devstephenke-sys/Github-Free-MCPs.git
cd Github-Free-MCPs
npm install
npm run build
```

Point MCP at `node /absolute/path/to/github-cicd-mcp/dist/index.js`.

---

## Authentication

Create a [personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens):

| Need | Scopes / permissions |
|------|----------------------|
| Repos, PRs, commits, issues | `repo` or fine-grained **Contents**, **Pull requests**, **Issues** |
| Actions | `workflow` |
| Org billing | `read:org` + org billing role |
| Admin (branch protection, webhooks) | Admin access on the repo/org |

Never commit tokens. Use environment variables only.

---

## Tool reference

### Core & repos

`github_get_authenticated_user`, `github_get_rate_limit`, `github_create_repository`, `github_get_repository`, `github_list_repositories`, `github_create_branch`, `github_fork_repository`

### Commits & CI status

`github_list_commits`, `github_get_commit`, `github_compare_commits`, `github_create_commit`, `github_get_combined_status`, `github_list_check_runs_for_ref`

### Pull requests

`github_create_pull_request`, `github_list_pull_requests`, `github_get_pull_request`, `github_merge_pull_request`, `github_update_pull_request`, `github_list_pull_request_files`, `github_create_pull_request_review`

### Issues

`github_create_issue`, `github_list_issues`, `github_get_issue`, `github_update_issue`, `github_add_issue_comment`, `github_list_issue_comments`

### Releases & tags

`github_list_releases`, `github_get_release_by_tag`, `github_create_release`, `github_list_tags`, `github_create_tag`

### Branches & protection

`github_list_branches`, `github_get_branch`, `github_get_branch_protection`, `github_update_branch_protection`, `github_delete_branch_protection`

### GitHub Actions

`github_list_workflows`, `github_list_workflow_runs`, `github_get_workflow_run`, `github_list_workflow_jobs`, `github_rerun_workflow`, `github_cancel_workflow_run`, `github_dispatch_workflow`, `github_list_actions_secrets`, `github_list_actions_variables`, `github_list_workflow_run_artifacts`, `github_download_workflow_artifact`

### Deployments (CD)

`github_list_deployments`, `github_create_deployment`, `github_create_deployment_status`, `github_list_environments`

### Billing

`github_get_user_billing_actions`, `github_get_org_billing_actions`, `github_get_org_billing_overview`, `github_get_org_billing_usage_report`

### Webhooks & access

`github_list_webhooks`, `github_create_webhook`, `github_delete_webhook`, `github_list_collaborators`, `github_add_collaborator`, `github_list_teams`

### GraphQL

`github_graphql_query`, `github_graphql_mutation`, `github_graphql_repository_overview`

### Local git

`git_status`, `git_commit`, `git_push`, `git_pull`, `git_log`, `git_clone`

---

## GitHub Enterprise

- `GITHUB_HOST` — hostname (when not `github.com`)
- `GITHUB_API_URL` — REST base, e.g. `https://github.example.com/api/v3`
- `GITHUB_GRAPHQL_URL` — GraphQL endpoint override

---

## Publish your own fork

See **[RELEASING.md](RELEASING.md)** for:

- Public GitHub repo setup  
- npm publish (`npm publish --access public`)  
- GitHub Releases and optional MCP directory listings  

---

## License

[MIT](LICENSE)
