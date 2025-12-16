/**
 * Footer Component Tests
 */

import { render, screen } from '@testing-library/react';
import Footer from '../Footer';

// Mock next/link
jest.mock('next/link', () => {
  const MockLink = ({ children, href }) => <a href={href}>{children}</a>;
  MockLink.displayName = 'Link';
  return MockLink;
});

describe('Footer', () => {
  it('renders the footer with brand logo', () => {
    render(<Footer />);
    expect(screen.getByText(/AutoRev/)).toBeInTheDocument();
  });

  it('renders all navigation sections', () => {
    render(<Footer />);
    expect(screen.getByText('Research')).toBeInTheDocument();
    expect(screen.getByText('Ownership')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Company')).toBeInTheDocument();
  });

  it('renders popular brand links', () => {
    render(<Footer />);
    expect(screen.getByText('Porsche')).toBeInTheDocument();
    expect(screen.getByText('BMW')).toBeInTheDocument();
    expect(screen.getByText('Ferrari')).toBeInTheDocument();
  });

  it('renders newsletter form', () => {
    render(<Footer />);
    expect(screen.getByPlaceholderText('Get updates')).toBeInTheDocument();
  });

  it('renders copyright', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });

  it('has proper semantic structure', () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('footer')).toBeInTheDocument();
    expect(container.querySelectorAll('nav').length).toBeGreaterThan(0);
  });
});
