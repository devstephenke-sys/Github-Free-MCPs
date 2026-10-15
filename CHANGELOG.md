# Changelog

All notable changes to this project will be documented in this file.

## [1.2.3] - 2026-10-15

### Security

- **Critical**: Updated `simple-git` from v3.27.0 to v4.0.2 to address critical security vulnerabilities:
  - CVE-2026-102828: Unsafe-operation guard does not block trailer command configuration
  - CVE-2026-102826: Command execution through unblocked Git configuration includes
  - CVE-2026-102827: Unsafe-operations plugin bypass via git long-option abbreviation
  - CVE-2026-6951: Remote Code Execution vulnerability
- Enhanced SECURITY.md with detailed security measures and write operation documentation
- Added input validation and token handling transparency documentation
- Updated dependency audit - no remaining vulnerabilities

### Changed

- Bumped version to 1.2.3
- Updated npm package with security fixes

## [1.2.1] - 2026-10-13

### Fixed
- Resolved npm staging issue to enable public publishing

## [1.2.0] - 2026-10-13

### Added

- SECURITY.md for responsible vulnerability disclosure
- Security policy and best practices documentation
- CI/CD verification script that counts registered tools (70 tools)
- Enhanced documentation for public release

### Changed

- Updated package.json with correct repository URLs
- Improved README with installation instructions for npm and source
- Added npm publish configuration for public access

### Security

- Added security checklist and token scope recommendations
- Documented safe authentication practices
- Added dependency audit information

## [1.1.0] - 2026-03-23

### Added

- Issues: create, list, get, update, comments
- Releases and tags
- Branch protection and branch listing
- Webhooks and collaborators / org teams
- GraphQL query, mutation, and repository overview helper
- Workflow run artifacts
- Fork repository
- Public release docs (`RELEASING.md`), CI workflow, MIT `LICENSE`

## [1.0.0] - 2026-03-23

### Added

- Initial MCP: repos, commits, PRs, Actions, deployments, billing, local git
