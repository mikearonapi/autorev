# Contributing to AutoRev

Thank you for your interest in contributing to AutoRev! This document provides guidelines for contributing to the project.

## Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/mikearonapi/autorev.git
   cd autorev
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env.local
   # Fill in required values (see README.md)
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## Code Quality Standards

### Before Committing

All commits are automatically checked by our pre-commit hooks (Husky + lint-staged):

- **Prettier** - Code formatting
- **ESLint** - Linting and code quality

To manually run these:
```bash
npm run lint        # Check for ESLint issues
npm run format      # Format all files with Prettier
npm run format:check # Check formatting without changes
```

### Code Style

- **JavaScript** - We use JavaScript (not TypeScript) for this project
- **Components** - React functional components with hooks
- **CSS** - CSS Modules for component-scoped styles
- **API Routes** - Next.js App Router API routes

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfileCard.jsx` |
| Hooks | camelCase with `use` prefix | `useUserProfile.js` |
| Utilities | camelCase, verb-first | `formatVehiclePrice.js` |
| Services | camelCase with `Service` suffix | `userDataService.js` |
| API routes | kebab-case folders | `app/api/user-profile/` |
| CSS modules | PascalCase matching component | `UserProfileCard.module.css` |

## Making Changes

### Before You Code

1. **Search existing code** - Check if similar functionality exists
2. **Read documentation** - See `docs/SOURCE_OF_TRUTH.md` for patterns
3. **Plan your approach** - Consider existing patterns before creating new ones

### During Development

1. **Make focused changes** - Small, reviewable PRs are preferred
2. **Add tests** - For new features or bug fixes
3. **Update documentation** - If your change affects APIs or interfaces

### Submitting Changes

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** - Following the guidelines above

3. **Test locally**
   ```bash
   npm test              # Run unit tests
   npm run test:e2e      # Run E2E tests
   npm run lint          # Check for issues
   ```

4. **Commit with clear message**
   ```bash
   git commit -m "feat: add user profile caching"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Message Format

We follow conventional commits:

```
<type>(<scope>): <description>

[optional body]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting (no code change)
- `refactor:` - Code change (no new feature/fix)
- `perf:` - Performance improvement
- `test:` - Adding/updating tests
- `chore:` - Maintenance tasks

**Examples:**
```
feat(garage): add vehicle mileage tracking
fix(auth): resolve session refresh on mobile
docs(api): update rate limiting documentation
```

## Project Structure

```
/app/                  # Next.js pages & API routes
/components/           # React components
/lib/                  # Business logic & services
/hooks/                # Custom React hooks
/styles/               # Global styles
/docs/                 # Documentation
/tests/                # Test files
```

## Questions?

- Check `docs/` folder for detailed documentation
- Open an issue for bugs or feature requests
- See `README.md` for project overview

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

Thank you for contributing!
