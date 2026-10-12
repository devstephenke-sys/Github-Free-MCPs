# Releasing github-cicd-mcp for the public

This guide covers how to publish the MCP so **other developers** can install it without cloning your Desktop folder.

## What you are publishing

| Channel | Best for |
|---------|----------|
| **Public GitHub repo** | Source code, issues, stars, contributions |
| **npm package** | One-line install via `npx` in Cursor / Claude Desktop |
| **GitHub Release** | Versioned downloads and changelog |

You typically do **all three**: repo → npm → tag a GitHub Release when you bump version.

---

## 1. Create a public GitHub repository

1. On [GitHub](https://github.com/new), create a repo (e.g. `github-cicd-mcp`), **Public**, no README (you already have one).
2. From your project folder:

```bash
git init
git add .
git commit -m "Initial public release of GitHub CI/CD MCP"
git branch -M main
git remote add origin https://github.com/devstephenke-sys/Github-Free-MCPs.git
git push -u origin main
```

3. In `package.json`, set `repository`, `bugs`, and `homepage` to your real GitHub URLs (replace `YOUR_USERNAME`).

---

## 2. Publish to npm (recommended for MCP users)

### One-time setup

1. Create an [npm account](https://www.npmjs.com/signup).
2. Log in locally: `npm login`
3. Choose a package name:
   - **Unscoped:** `github-cicd-mcp` (must be unused on npm)
   - **Scoped (safer):** `@your-npm-user/github-cicd-mcp` — set `"name"` in `package.json` and add `"publishConfig": { "access": "public" }`

### Publish

```bash
npm run build
npm publish --access public
```

For scoped packages, `--access public` is required on first publish.

### Bump versions

```bash
npm version patch   # 1.0.0 → 1.0.1
npm publish --access public
git push && git push --tags
```

---

## 3. How users install your MCP (share this in the README)

### Option A — npm + npx (easiest for others)

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

Use `@your-npm-user/github-cicd-mcp` in `args` if you published a scoped package.

Set `GITHUB_TOKEN` in the OS environment or in the MCP `env` block (never commit tokens).

### Option B — clone from GitHub

```json
{
  "mcpServers": {
    "github-cicd": {
      "command": "node",
      "args": ["/path/to/github-cicd-mcp/dist/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_..."
      }
    }
  }
}
```

After clone: `npm install && npm run build`.

---

## 4. GitHub Release (optional but professional)

1. Update `CHANGELOG.md` (or release notes in the GitHub UI).
2. Create a tag matching `package.json` version:

```bash
git tag v1.0.0
git push origin v1.0.0
```

3. On GitHub: **Releases → Draft a new release** → choose tag `v1.0.0`, describe tools and breaking changes.

CI in `.github/workflows/ci.yml` runs on every push/PR; you can add npm publish via `NPM_TOKEN` secret later.

---

## 5. Listing in MCP directories (optional)

- **[Model Context Protocol servers](https://github.com/modelcontextprotocol/servers)** — community catalog; open a PR to add your server if they accept external entries.
- **Awesome MCP lists** — search GitHub for “awesome-mcp” and submit a PR with your repo link.
- **Your README** — badges: npm version, license, CI status (after enabling Actions on GitHub).

---

## 6. Security checklist before going public

- [ ] No tokens or `.env` in git (`.gitignore` includes `.env`)
- [ ] README explains **minimum PAT scopes**
- [ ] Issues enabled on GitHub for bug reports
- [ ] Consider `SECURITY.md` for responsible disclosure

---

## 7. Automated npm publish (optional)

Add repository secrets: `NPM_TOKEN` (Automation type on npm).

Uncomment the publish job in `.github/workflows/release.yml` when ready, or run `npm publish` manually for v1.
