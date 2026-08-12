# Contributing to RoomX

Thank you for your interest in contributing to RoomX! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

- Be respectful and inclusive
- Use welcoming and inclusive language
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other contributors

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/roomx.git
   cd roomx
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/original-owner/roomx.git
   ```
4. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Prerequisites

- Node.js 20+
- pnpm 9+
- A Supabase account (for backend services)

### Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Copy environment files:
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp apps/server/.env.example apps/server/.env
   ```

3. Configure environment variables with your Supabase credentials

4. Start the development server:
   ```bash
   pnpm dev
   ```

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm test` | Run all tests |
| `pnpm clean` | Clean all node_modules and dist directories |

## Code Style

### TypeScript

- Use TypeScript for all new code
- Prefer interfaces over type aliases for object shapes
- Use explicit return types for exported functions
- Avoid `any` - use `unknown` and type guards instead

### React

- Use functional components with hooks
- Use named exports
- Keep components small and focused
- Extract reusable logic into custom hooks

### File Naming

- Use `kebab-case` for file names
- Use `PascalCase` for component files
- Use `camelCase` for utility files
- Use `UPPER_SNAKE_CASE` for constants

### Imports

- Use absolute imports from `@/`
- Group imports: external > internal > relative
- Sort imports alphabetically within groups

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semi-colons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

### Examples

```
feat(rooms): add screen sharing capability
fix(auth): resolve token refresh race condition
docs(readme): update deployment instructions
```

## Pull Request Process

1. Ensure your code follows the project's style guidelines
2. Update documentation if needed
3. Add tests for new functionality
4. Ensure all checks pass:
   ```bash
   pnpm lint
   pnpm typecheck
   pnpm test
   pnpm build
   ```
5. Write a clear PR description explaining:
   - What changes were made
   - Why the changes were necessary
   - How to test the changes
6. Request a review from maintainers

## Reporting Issues

- Use the GitHub issue tracker
- Include a clear and descriptive title
- Provide steps to reproduce the issue
- Include expected and actual behavior
- Add screenshots if applicable
- Mention your environment (OS, browser, Node version)

## Questions?

Feel free to open a discussion or reach out to the maintainers. We're happy to help!
