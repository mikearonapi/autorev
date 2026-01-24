/**
 * Commitlint Configuration
 * 
 * Enforces conventional commit message format.
 * 
 * Format: <type>(<scope>): <subject>
 * 
 * Types:
 *   feat:     New feature
 *   fix:      Bug fix
 *   docs:     Documentation changes
 *   style:    Code style changes (formatting, etc.)
 *   refactor: Code refactoring
 *   perf:     Performance improvements
 *   test:     Adding or updating tests
 *   build:    Build system changes
 *   ci:       CI/CD changes
 *   chore:    Maintenance tasks
 *   revert:   Reverting changes
 * 
 * Scopes (optional):
 *   al:        AI assistant
 *   auth:      Authentication
 *   garage:    Garage features
 *   ui:        User interface
 *   api:       API routes
 *   db:        Database
 *   analytics: Analytics
 *   stripe:    Stripe/billing
 * 
 * Examples:
 *   feat(al): add intent classification for queries
 *   fix(auth): resolve session expiry redirect
 *   docs: update DESIGN_SYSTEM.md with spacing tokens
 *   refactor(garage): extract vehicle card component
 * 
 * @module commitlint.config
 */

module.exports = {
  extends: ['@commitlint/config-conventional'],
  
  rules: {
    // Type rules
    'type-enum': [
      2, // Error
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Code style (formatting, missing semicolons, etc.)
        'refactor', // Code refactoring
        'perf',     // Performance improvement
        'test',     // Adding/updating tests
        'build',    // Build system or external dependencies
        'ci',       // CI/CD configuration
        'chore',    // Maintenance tasks
        'revert',   // Revert previous commit
        'wip',      // Work in progress (use sparingly)
      ],
    ],
    'type-case': [2, 'always', 'lowercase'],
    'type-empty': [2, 'never'],
    
    // Scope rules
    'scope-enum': [
      1, // Warning only - allow flexibility
      'always',
      [
        'al',         // AI assistant
        'auth',       // Authentication
        'garage',     // Garage features
        'builds',     // Build/tuning features
        'ui',         // User interface
        'api',        // API routes
        'db',         // Database
        'analytics',  // Analytics
        'stripe',     // Stripe/billing
        'sentry',     // Error tracking
        'events',     // Events calendar
        'community',  // Community features
        'cars',       // Car data
        'search',     // Search features
        'perf',       // Performance
        'a11y',       // Accessibility
        'deps',       // Dependencies
        'config',     // Configuration
        'tests',      // Tests
      ],
    ],
    'scope-case': [2, 'always', 'lowercase'],
    
    // Subject rules
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'subject-min-length': [2, 'always', 10],
    'subject-max-length': [2, 'always', 72],
    
    // Header rules
    'header-max-length': [2, 'always', 100],
    
    // Body rules
    'body-leading-blank': [2, 'always'],
    'body-max-line-length': [2, 'always', 100],
    
    // Footer rules
    'footer-leading-blank': [2, 'always'],
    'footer-max-line-length': [2, 'always', 100],
  },
  
  // Help message
  helpUrl: 'https://conventionalcommits.org/',
};
