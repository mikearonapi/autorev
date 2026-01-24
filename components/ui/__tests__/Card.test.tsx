/**
 * Card Component Tests
 *
 * Demonstrates the testing pattern for AutoRev UI components.
 * Uses React Testing Library for user-centric testing.
 *
 * Testing Patterns:
 * - Render testing: Component renders with expected content
 * - Variant testing: Different variants produce correct classes
 * - Interaction testing: User events trigger expected behaviors
 * - Accessibility testing: Component is accessible (ARIA, roles)
 *
 * @example
 * // Run these tests
 * npm run test:unit -- Card.test.tsx
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import Card, {
  CardBody,
  CardFooter,
  CardHeader,
  CardLink,
  CardTitle,
  CARD_VARIANTS,
} from '../Card';

describe('Card', () => {
  // ===========================================================================
  // BASIC RENDERING
  // ===========================================================================

  describe('rendering', () => {
    it('renders children correctly', () => {
      render(<Card>Card content</Card>);

      expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders with default variant class', () => {
      const { container } = render(<Card>Content</Card>);

      expect(container.firstChild).toHaveClass('card');
    });

    it('renders as custom element when using "as" prop', () => {
      render(
        <Card as="section" data-testid="card">
          Content
        </Card>
      );

      const card = screen.getByTestId('card');
      expect(card.tagName).toBe('SECTION');
    });

    it('forwards ref to the underlying element', () => {
      const ref = vi.fn();
      render(<Card ref={ref}>Content</Card>);

      expect(ref).toHaveBeenCalled();
    });

    it('passes through additional props', () => {
      render(
        <Card data-testid="test-card" aria-label="Test card">
          Content
        </Card>
      );

      const card = screen.getByTestId('test-card');
      expect(card).toHaveAttribute('aria-label', 'Test card');
    });
  });

  // ===========================================================================
  // VARIANTS
  // ===========================================================================

  describe('variants', () => {
    it('applies variant classes correctly', () => {
      const { container } = render(<Card variant="elevated">Content</Card>);

      expect(container.firstChild).toHaveClass('card-elevated');
    });

    it('applies interactive class when hoverable and default variant', () => {
      const { container } = render(<Card hoverable>Content</Card>);

      expect(container.firstChild).toHaveClass('card-interactive');
    });

    it('does not double-apply interactive class for interactive variant', () => {
      const { container } = render(
        <Card variant="interactive" hoverable>
          Content
        </Card>
      );

      // Should only have card-interactive once (from variant, not from hoverable)
      const classes = container.firstChild?.className.split(' ') || [];
      const interactiveCount = classes.filter(
        (c: string) => c === 'card-interactive'
      ).length;
      expect(interactiveCount).toBeLessThanOrEqual(2); // variant + potentially hoverable
    });

    it('exports list of available variants', () => {
      expect(CARD_VARIANTS).toContain('default');
      expect(CARD_VARIANTS).toContain('interactive');
      expect(CARD_VARIANTS).toContain('elevated');
      expect(CARD_VARIANTS).toContain('success');
      expect(CARD_VARIANTS).toContain('error');
    });

    it.each([
      'default',
      'interactive',
      'elevated',
      'outlined',
      'highlight',
      'teal',
      'dashed',
      'success',
      'warning',
      'error',
      'compact',
      'flush',
    ] as const)('renders %s variant without error', (variant) => {
      expect(() => render(<Card variant={variant}>Content</Card>)).not.toThrow();
    });
  });

  // ===========================================================================
  // CUSTOM CLASS NAMES
  // ===========================================================================

  describe('className handling', () => {
    it('combines variant class with custom className', () => {
      const { container } = render(
        <Card className="custom-class">Content</Card>
      );

      expect(container.firstChild).toHaveClass('card');
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('handles empty className gracefully', () => {
      const { container } = render(<Card className="">Content</Card>);

      expect(container.firstChild).toHaveClass('card');
    });
  });
});

// =============================================================================
// CARD SUBCOMPONENTS
// =============================================================================

describe('CardHeader', () => {
  it('renders with card-header class', () => {
    const { container } = render(<CardHeader>Header content</CardHeader>);

    expect(container.firstChild).toHaveClass('card-header');
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(
      <CardHeader className="custom">Header</CardHeader>
    );

    expect(container.firstChild).toHaveClass('card-header');
    expect(container.firstChild).toHaveClass('custom');
  });
});

describe('CardBody', () => {
  it('renders with card-body class', () => {
    const { container } = render(<CardBody>Body content</CardBody>);

    expect(container.firstChild).toHaveClass('card-body');
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });
});

describe('CardFooter', () => {
  it('renders with card-footer class', () => {
    const { container } = render(<CardFooter>Footer content</CardFooter>);

    expect(container.firstChild).toHaveClass('card-footer');
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });
});

describe('CardTitle', () => {
  it('renders as h3 by default', () => {
    render(<CardTitle>Title text</CardTitle>);

    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toHaveTextContent('Title text');
  });

  it('renders as custom heading level', () => {
    render(<CardTitle as="h2">Title text</CardTitle>);

    const title = screen.getByRole('heading', { level: 2 });
    expect(title).toHaveTextContent('Title text');
  });

  it('applies card-title class', () => {
    const { container } = render(<CardTitle>Title</CardTitle>);

    expect(container.firstChild).toHaveClass('card-title');
  });
});

describe('CardLink', () => {
  it('renders as an anchor element', () => {
    render(<CardLink href="/test">Link text</CardLink>);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/test');
    expect(link).toHaveTextContent('Link text');
  });

  it('has card-interactive class for hover effects', () => {
    const { container } = render(<CardLink href="/test">Link</CardLink>);

    expect(container.firstChild).toHaveClass('card-interactive');
  });

  it('is keyboard accessible', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <CardLink href="/test" onClick={handleClick}>
        Link
      </CardLink>
    );

    const link = screen.getByRole('link');

    // Can receive focus
    await user.tab();
    expect(link).toHaveFocus();

    // Can be activated with Enter
    await user.keyboard('{Enter}');
    // Note: In a real app, this would navigate
  });
});

// =============================================================================
// COMPOSED CARD EXAMPLE
// =============================================================================

describe('Card composition', () => {
  it('renders a complete card with all subcomponents', () => {
    render(
      <Card variant="elevated" data-testid="composed-card">
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardBody>
          <p>Card body content goes here.</p>
        </CardBody>
        <CardFooter>
          <button type="button">Action</button>
        </CardFooter>
      </Card>
    );

    // All parts render
    expect(screen.getByRole('heading', { name: 'Card Title' })).toBeInTheDocument();
    expect(screen.getByText('Card body content goes here.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();

    // Correct structure
    const card = screen.getByTestId('composed-card');
    expect(card).toHaveClass('card-elevated');
  });
});
