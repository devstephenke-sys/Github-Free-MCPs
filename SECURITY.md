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
- `simple-git` - Local git operations
- `zod` - Runtime type validation

All dependencies are updated regularly, and automated security audits are run via CI.

## Security Audits

This project uses:
- `npm audit` for dependency vulnerability scanning
- GitHub Dependabot for automated dependency updates
- CI security checks on every pull request

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
