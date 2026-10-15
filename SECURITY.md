# Security Policy

## Supported Versions

| Version | Supported |
|---------|------------|
| >= 1.0.0 | ✅ Yes |
| < 1.0.0 | ❌ No |

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

### How to Report

**Do not** open a public issue for security vulnerabilities.

Instead, please:

1. **Email**: Send an email to devstephen.ke@gmail.com with the subject line `[SECURITY] github-cicd-mcp vulnerability`
2. **Include**: 
   - A description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if applicable)

### What to Expect

- You will receive an acknowledgment within 48 hours
- We will work to validate and fix the issue
- A fix will be released as soon as possible
- Credit will be given in the release notes (unless you prefer to remain anonymous)

### Security Best Practices for Users

This MCP server interacts with GitHub's API and requires authentication. To keep your data secure:

- **Never commit** your `GITHUB_TOKEN` or any other credentials to version control
- Use **environment variables** or your MCP client's secret store for tokens
- Use **fine-grained personal access tokens** with minimal required scopes
- Rotate your tokens regularly
- Review the [GitHub token scopes documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) to understand permissions

### Scope Recommendations

For most use cases, the following scopes are sufficient:

- `repo` - Full control of private repositories (or use fine-grained tokens with specific permissions)
- `workflow` - Update GitHub Action workflows
- `read:org` - Read org and team membership (for billing/teams tools)

Avoid using the `admin:org` scope unless absolutely necessary.

### Allowed Dependencies

This project uses the following dependencies, which are regularly audited:

- `@modelcontextprotocol/sdk` - Official MCP SDK
- `@octokit/rest` - GitHub REST API client
- `@octokit/graphql` - GitHub GraphQL API client
- `simple-git` - Local git operations (updated to v4.0.2 to address CVE-2026-102828, CVE-2026-102826, CVE-2026-102827, CVE-2026-6951)
- `zod` - Runtime type validation

All dependencies are updated regularly, and automated security audits are run via CI.

### Recent Security Updates

**Version 1.2.3** (October 2026):
- Updated `simple-git` from v3.27.0 to v4.0.2 to address critical security vulnerabilities:
  - CVE-2026-102828: Unsafe-operation guard does not block trailer command configuration
  - CVE-2026-102826: Command execution through unblocked Git configuration includes
  - CVE-2026-102827: Unsafe-operations plugin bypass via git long-option abbreviation
  - CVE-2026-6951: Remote Code Execution vulnerability

### Write Operations and Token Scoping

This MCP includes tools that can modify repository state:

**High-impact operations** (use with caution):
- `github_merge_pull_request` - Merges pull requests
- `github_dispatch_workflow` - Triggers GitHub Actions workflows
- `github_rerun_workflow` - Re-runs failed workflows
- `github_create_release` - Creates GitHub releases
- `github_create_commit` - Creates commits via GitHub API
- `github_update_branch_protection` - Modifies branch protection rules
- `github_delete_branch_protection` - Removes branch protection rules
- `github_create_webhook` - Creates webhooks
- `github_add_collaborator` - Adds repository collaborators

**Recommendations**:
- Use **fine-grained personal access tokens** with minimal required scopes
- Consider using a separate token for read-only operations
- Enable branch protection rules to require pull request reviews
- Use organization-level policies for critical repositories
- Regularly rotate your tokens

### Input Validation

The MCP server implements the following security measures:

- All GitHub API requests use validated inputs via Zod schemas
- Branch and ref names are sanitized before API calls
- Token handling reads only from environment variables (never from user input)
- No tokens are logged or echoed in error messages
- Git arguments passed to simple-git are validated to prevent command injection

### Code Transparency

For complete security audits, all source code is available at:
- https://github.com/devstephenke-sys/Github-Free-MCPs

Key security-related files:
- `src/lib/github.ts` - GitHub client and token handling
- `src/lib/response.ts` - Response formatting
- `src/lib/fields.ts` - Field validation
- `src/tools/*` - Individual tool implementations

## Security Audits

This project uses:
- `npm audit` for dependency vulnerability scanning
- GitHub Dependabot for automated dependency updates
- CI security checks on every pull request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
