import React from 'react';

import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import SortableVehicleList from './SortableVehicleList';

// Capture props passed to CarImage
const carImageSpy = vi.fn();

vi.mock('@/components/CarImage', () => ({
  default: (props) => {
    carImageSpy(props);
    return <div data-testid="car-image" />;
  },
}));

vi.mock('@/hooks/useCarImages', () => ({
  useCarImages: () => ({
    heroImageUrl: 'https://example.com/user-hero.webp',
  }),
}));

// Simplify dnd-kit for deterministic unit testing
vi.mock('@dnd-kit/core', async () => {
  const React = await import('react');
  return {
    DndContext: ({ children }) => <div data-testid="dnd-context">{children}</div>,
    closestCenter: () => undefined,
    KeyboardSensor: function KeyboardSensor() {},
    PointerSensor: function PointerSensor() {},
    TouchSensor: function TouchSensor() {},
    useSensor: () => ({}),
    useSensors: (...sensors) => sensors,
    DragOverlay: ({ children }) => <div data-testid="drag-overlay">{children}</div>,
  };
});

vi.mock('@dnd-kit/sortable', async () => {
  const React = await import('react');
  return {
    arrayMove: (arr, from, to) => {
      const copy = [...arr];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return copy;
    },
    SortableContext: ({ children }) => <div data-testid="sortable-context">{children}</div>,
    sortableKeyboardCoordinates: () => undefined,
    useSortable: () => ({
      attributes: {},
      listeners: {},
      setNodeRef: () => {},
      transform: null,
      transition: undefined,
      isDragging: false,
    }),
    verticalListSortingStrategy: () => undefined,
  };
});

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}));

describe('SortableVehicleList (Garage list view)', () => {
  beforeEach(() => {
    carImageSpy.mockClear();
  });

  it('renders vehicle name from vehicle year/make/model (not undefined fields)', () => {
    const items = [
      {
        vehicle: { id: 'v1', year: 2020, make: 'Audi', model: 'RS5' },
        car: { slug: 'audi-rs5', name: '2020 Audi RS5', hp: 444 },
        enrichedCar: null,
      },
    ];

    render(<SortableVehicleList items={items} />);

    expect(screen.getByText('2020 Audi RS5')).toBeInTheDocument();
    expect(screen.getByText('444 HP')).toBeInTheDocument();
  });

  it('passes a car object to CarImage and wires user hero URL into imageGarageUrl', () => {
    const items = [
      {
        vehicle: { id: 'v1', year: 2020, make: 'Audi', model: 'RS5' },
        car: { slug: 'audi-rs5', name: '2020 Audi RS5', hp: 444 },
        enrichedCar: null,
      },
    ];

    render(<SortableVehicleList items={items} />);

    expect(carImageSpy).toHaveBeenCalled();
    const props = carImageSpy.mock.calls[0][0];

    expect(props.variant).toBe('garage');
    expect(props.showName).toBe(false);
    expect(props.car).toMatchObject({
      slug: 'audi-rs5',
      imageGarageUrl: 'https://example.com/user-hero.webp',
    });
  });
});
