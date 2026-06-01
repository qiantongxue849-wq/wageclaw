# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.3.x   | :white_check_mark: |
| < 0.3   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability in WageClaw, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please send an email to [INSERT_EMAIL] with:

1. A description of the vulnerability
2. Steps to reproduce the issue
3. Potential impact
4. Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 48 hours
- **Initial assessment**: Within 1 week
- **Fix or mitigation**: Depending on severity, within 2 weeks for critical issues

### Scope

This policy covers:
- The WageClaw desktop application
- Electron main process security (IPC, context isolation)
- Dependency vulnerabilities
- Data handling (localStorage, no network transmission)

### Out of Scope

- Social engineering attacks
- Physical access to the user's device
- Issues in third-party dependencies (report to the respective maintainers)

## Security Measures

WageClaw implements the following security practices:

- **Context Isolation**: Electron `contextIsolation: true` — renderer cannot access Node.js APIs directly
- **No Node Integration**: `nodeIntegration: false` in all renderer processes
- **Preload Bridge**: All IPC communication goes through `preload.cjs` with explicit channel allowlisting
- **Local-only Storage**: All user data stored in `localStorage`, never transmitted over the network
- **Sensitive Content Filtering**: AI Office Ninja and community features auto-redact personal information (names, companies, locations)
