/**
 * Tests for UpgradeCenter Component
 * 
 * This test file verifies the checkbox functionality in the Tuning Shop upgrade selection.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UpgradeCenter from '../UpgradeCenter';

// Mock dependencies
jest.mock('../providers/AuthProvider', () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

jest.mock('../providers/SavedBuildsProvider', () => ({
  useSavedBuilds: () => ({
    saveBuild: jest.fn(),
    updateBuild: jest.fn(),
    getBuildById: jest.fn(),
    canSave: true,
  }),
}));

jest.mock('../CarImage', () => {
  return function CarImage() {
    return <div data-testid="car-image">Car Image</div>;
  };
});

jest.mock('../UpgradeDetailModal', () => {
  return function UpgradeDetailModal() {
    return <div data-testid="upgrade-detail-modal">Modal</div>;
  };
});

jest.mock('../PerformanceData', () => ({
  DynoDataSection: () => <div>Dyno Data</div>,
  LapTimesSection: () => <div>Lap Times</div>,
}));

// Mock car data
const mockCar = {
  slug: 'toyota-gr86-2023',
  name: '2023 Toyota GR86',
  hp: 228,
  tier: 'collector',
  drivetrain: 'RWD',
  engine: '2.4L Boxer',
  zeroToSixty: 6.1,
  lateralG: 0.98,
  braking60To0: 107,
};

describe('UpgradeCenter - Checkbox Functionality', () => {
  it('should render checkboxes in category popup', async () => {
    const { container } = render(<UpgradeCenter car={mockCar} />);
    
    // Switch to Custom mode
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);
    
    // Open a category (Power)
    const powerCategory = screen.getByText('Power');
    fireEvent.click(powerCategory);
    
    // Wait for popup to appear
    await waitFor(() => {
      expect(screen.getByRole('checkbox', { name: /intake/i })).toBeInTheDocument();
    });
  });

  it('should have disabled checkboxes when not in Custom mode', () => {
    render(<UpgradeCenter car={mockCar} />);
    
    // Start in Stock mode (default)
    // Open a category
    const powerCategory = screen.getByText('Power');
    fireEvent.click(powerCategory);
    
    // Checkboxes should be disabled
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeDisabled();
    });
  });

  it('should enable checkboxes in Custom mode', async () => {
    render(<UpgradeCenter car={mockCar} />);
    
    // Switch to Custom mode
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);
    
    // Open a category
    const powerCategory = screen.getByText('Power');
    fireEvent.click(powerCategory);
    
    // Wait for popup and verify checkboxes are enabled
    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeDisabled();
      });
    });
  });

  it('should toggle upgrade selection when checkbox is clicked in Custom mode', async () => {
    render(<UpgradeCenter car={mockCar} />);
    
    // Switch to Custom mode
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);
    
    // Open Power category
    const powerCategory = screen.getByText('Power');
    fireEvent.click(powerCategory);
    
    // Find and click a checkbox
    const intakeCheckbox = await screen.findByRole('checkbox', { name: /cold air intake/i });
    
    // Should be unchecked initially
    expect(intakeCheckbox).toHaveAttribute('aria-checked', 'false');
    
    // Click to select
    fireEvent.click(intakeCheckbox);
    
    // Should now be checked
    await waitFor(() => {
      expect(intakeCheckbox).toHaveAttribute('aria-checked', 'true');
    });
    
    // Click again to deselect
    fireEvent.click(intakeCheckbox);
    
    // Should be unchecked again
    await waitFor(() => {
      expect(intakeCheckbox).toHaveAttribute('aria-checked', 'false');
    });
  });

  it('should not respond to clicks when checkbox is disabled', () => {
    const { container } = render(<UpgradeCenter car={mockCar} />);
    
    // Stay in Stock mode (checkboxes disabled)
    const powerCategory = screen.getByText('Power');
    fireEvent.click(powerCategory);
    
    // Get a disabled checkbox
    const checkboxes = screen.getAllByRole('checkbox');
    const firstCheckbox = checkboxes[0];
    
    // Verify it's disabled
    expect(firstCheckbox).toBeDisabled();
    
    // Try to click it
    fireEvent.click(firstCheckbox);
    
    // State should not change (still unchecked)
    expect(firstCheckbox).toHaveAttribute('aria-checked', 'false');
  });

  it('should show conflict badge when upgrade would replace another', async () => {
    render(<UpgradeCenter car={mockCar} />);
    
    // Switch to Custom mode
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);
    
    // Open category
    const powerCategory = screen.getByText('Power');
    fireEvent.click(powerCategory);
    
    // Select first upgrade (e.g., Stage 1 Tune)
    const stage1 = await screen.findByRole('checkbox', { name: /stage 1/i });
    fireEvent.click(stage1);
    
    // Look for conflict indicator on conflicting upgrade (e.g., Stage 2 Tune)
    const stage2Row = screen.getByText(/stage 2/i).closest('.upgradeRow');
    
    // Should show replacement/conflict indicator
    await waitFor(() => {
      expect(stage2Row).toHaveClass('upgradeRowConflict');
    });
  });

  it('should display HP gains for selected upgrades', async () => {
    render(<UpgradeCenter car={mockCar} />);
    
    // Switch to Custom mode
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);
    
    // Open category
    const powerCategory = screen.getByText('Power');
    fireEvent.click(powerCategory);
    
    // Select an upgrade with HP gain
    const intakeCheckbox = await screen.findByRole('checkbox', { name: /cold air intake/i });
    fireEvent.click(intakeCheckbox);
    
    // Verify HP badge appears in header
    await waitFor(() => {
      expect(screen.getByText(/\+\d+ HP/)).toBeInTheDocument();
    });
  });
});

describe('UpgradeCenter - Edge Cases', () => {
  it('should handle rapid checkbox clicks without state corruption', async () => {
    render(<UpgradeCenter car={mockCar} />);
    
    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);
    
    const powerCategory = screen.getByText('Power');
    fireEvent.click(powerCategory);
    
    const checkbox = await screen.findByRole('checkbox', { name: /cold air intake/i });
    
    // Rapid clicks
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    fireEvent.click(checkbox);
    
    // Should end up in a consistent state (checked or unchecked, not broken)
    await waitFor(() => {
      const isChecked = checkbox.getAttribute('aria-checked');
      expect(['true', 'false']).toContain(isChecked);
    });
  });

  it('should prevent clicks via pointer-events CSS on disabled buttons', () => {
    const { container } = render(<UpgradeCenter car={mockCar} />);
    
    // Open category in non-custom mode
    const powerCategory = screen.getByText('Power');
    fireEvent.click(powerCategory);
    
    // Get disabled button
    const disabledButton = container.querySelector('.upgradeToggle:disabled');
    
    // Verify pointer-events: none is applied
    const styles = window.getComputedStyle(disabledButton);
    expect(styles.pointerEvents).toBe('none');
  });
});
