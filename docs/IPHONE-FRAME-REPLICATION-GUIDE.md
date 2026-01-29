# iPhone Frame Replication Guide

> A comprehensive guide to replicate the exact 3-phone landing page layout with realistic iPhone 17 Pro frames.

## Preview

This creates a responsive 3-phone layout with:
- Realistic iPhone 17 Pro frames with Dynamic Island
- Proper aspect ratio (19.5:9)
- Side buttons (volume + power)
- Gradient bezels matching Apple's design
- Content scaled to 70% for realistic presentation

---

## File Structure

```
src/
├── components/
│   ├── IPhoneFrame.tsx          # Core iPhone frame component
│   └── NeuralNetworkVisualization.tsx  # Middle phone animated content
├── lib/
│   └── agent-icons.tsx          # Icon helpers (optional)
└── app/
    └── globals.css              # Required animations
```

---

## 1. IPhoneFrame.tsx - Core Component

```tsx
/**
 * IPhoneFrame Component
 * 
 * Reusable iPhone 17 Pro frame with accurate design:
 * - Dynamic Island (pill-shaped notch)
 * - Proper aspect ratio (19.5:9)
 * - Side buttons (volume + power)
 * - Rounded corners and bezels
 */

'use client';

import { ReactNode } from 'react';

interface IPhoneFrameProps {
  children: ReactNode;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  label?: string;
}

export default function IPhoneFrame({ 
  children, 
  size = 'medium',
  showLabel = false,
  label = ''
}: IPhoneFrameProps) {
  // Size configurations matching iPhone 17 Pro aspect ratio (19.5:9)
  const sizes = {
    small: 'w-52 sm:w-56',
    medium: 'w-60 sm:w-64 md:w-72',
    large: 'w-72 sm:w-80 md:w-96'
  };

  const heights = {
    small: 'h-[420px] sm:h-[455px]',
    medium: 'h-[487.5px] sm:h-[520px] md:h-[585px]',
    large: 'h-[585px] sm:h-[650px] md:h-[780px]'
  };

  // Dynamic Island scaling - accurate sizes matching real iPhone proportions
  const dynamicIslandSizes = {
    small: { width: '66px', height: '18px' },
    medium: { width: '76px', height: '20px' },
    large: { width: '86px', height: '22px' }
  };

  return (
    <div className="mx-auto max-w-xs sm:max-w-none">
      <div className={`relative ${sizes[size]}`}>
        {/* iPhone Frame - Realistic gradient bezel like Apple simulator */}
        <div 
          className="relative rounded-[3rem]" 
          style={{ 
            padding: '10px',
            background: 'linear-gradient(145deg, #3a3a3a 0%, #0f0f0f 35%, #1f1f1f 65%, #3a3a3a 100%)',
            boxShadow: `
              0 15px 35px rgba(0, 0, 0, 0.25),
              0 5px 15px rgba(0, 0, 0, 0.15),
              inset 0 2px 1px rgba(255, 255, 255, 0.25),
              inset 0 -2px 1px rgba(0, 0, 0, 0.6),
              inset 2px 0 1px rgba(255, 255, 255, 0.15),
              inset -2px 0 1px rgba(255, 255, 255, 0.15)
            `
          }}
        >
          
          {/* Volume Buttons - Left side */}
          <div 
            className="absolute top-[100px] rounded-l-md" 
            style={{ 
              left: '-3px',
              width: '3px',
              height: '28px',
              background: 'linear-gradient(to right, #4a4a4a, #2a2a2a)',
              boxShadow: '-2px 0 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' 
            }}
          ></div>
          <div 
            className="absolute top-[140px] rounded-l-md" 
            style={{ 
              left: '-3px',
              width: '3px',
              height: '50px',
              background: 'linear-gradient(to right, #4a4a4a, #2a2a2a)',
              boxShadow: '-2px 0 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' 
            }}
          ></div>
          <div 
            className="absolute top-[200px] rounded-l-md" 
            style={{ 
              left: '-3px',
              width: '3px',
              height: '50px',
              background: 'linear-gradient(to right, #4a4a4a, #2a2a2a)',
              boxShadow: '-2px 0 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' 
            }}
          ></div>
          
          {/* Power Button - Right side */}
          <div 
            className="absolute top-[170px] rounded-r-md" 
            style={{ 
              right: '-3px',
              width: '3px',
              height: '70px',
              background: 'linear-gradient(to left, #4a4a4a, #2a2a2a)',
              boxShadow: '2px 0 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' 
            }}
          ></div>
          
          {/* Screen Container with rounded corners */}
          <div className={`relative bg-black rounded-[2.5rem] ${heights[size]} overflow-hidden`}>
            {/* Content wrapper with inset clipping to hide grey screenshot corners */}
            <div 
              className="absolute overflow-hidden" 
              style={{ 
                zIndex: 1,
                borderRadius: '2.5rem',
                top: '3px',
                left: '3px',
                right: '3px',
                bottom: '3px'
              }}
            >
              {/* Content scaled down to 70% for realistic presentation */}
              <div 
                className="w-full h-full overflow-hidden origin-top-left" 
                style={{ 
                  transform: 'scale(0.7)',
                  transformOrigin: 'top left',
                  width: '142.86%',
                  height: '142.86%',
                  borderRadius: '2.3rem'
                }}
              >
                {children}
              </div>
            </div>
            
            {/* Dynamic Island - ALWAYS ON TOP */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none" 
              style={{ 
                top: '12px',
                zIndex: 10001
              }}
            >
              <div 
                style={{ 
                  width: dynamicIslandSizes[size].width,
                  height: dynamicIslandSizes[size].height,
                  backgroundColor: '#000000',
                  borderRadius: '1rem',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                  position: 'relative'
                }}
              ></div>
            </div>
          </div>
        </div>
        
        {/* Optional Label */}
        {showLabel && label && (
          <p className="text-center text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 font-medium">
            {label}
          </p>
        )}
      </div>
    </div>
  );
}
```

---

## 2. NeuralNetworkVisualization.tsx - Animated Network Content

This component creates the animated neural network visualization shown in the middle phone.

```tsx
'use client';

// Helper functions for agent icons and colors
function getAgentIcon(key: string, size: number = 20, color: string = 'currentColor'): JSX.Element {
  const strokeWidth = 2.5;
  
  const icons: Record<string, JSX.Element> = {
    task: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    events: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    home_maintenance: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    auto_care: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    travel: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    health: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    meal_plan: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2zm8 0h-2a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2z" />
      </svg>
    ),
    chef: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    shopping_gifts: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
    friends_family: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    kids_activity: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    date_night: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    message: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    daily_brief: (
      <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke={color} strokeWidth={strokeWidth}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  };
  
  return icons[key] || icons.task;
}

function getAgentIconBg(key: string): string {
  const colors: Record<string, string> = {
    task: 'bg-gradient-to-br from-[#0ea5e9] to-[#0c4a6e]',
    events: 'bg-gradient-to-br from-[#ec4899] to-[#d946ef]',
    home_maintenance: 'bg-gradient-to-br from-[#059669] to-[#10b981]',
    auto_care: 'bg-gradient-to-br from-[#dc2626] to-[#991b1b]',
    travel: 'bg-gradient-to-br from-[#14b8a6] to-[#0d9488]',
    health: 'bg-gradient-to-br from-[#22c55e] to-[#16a34a]',
    meal_plan: 'bg-gradient-to-br from-[#f97316] to-[#ea580c]',
    chef: 'bg-gradient-to-br from-[#9333ea] to-[#7c3aed]',
    shopping_gifts: 'bg-gradient-to-br from-[#f59e0b] to-[#d97706]',
    friends_family: 'bg-gradient-to-br from-[#f43f5e] to-[#fb7185]',
    kids_activity: 'bg-gradient-to-br from-[#eab308] to-[#ca8a04]',
    date_night: 'bg-gradient-to-br from-[#db2777] to-[#c026d3]',
    message: 'bg-gradient-to-br from-[#6366f1] to-[#4f46e5]',
    daily_brief: 'bg-gradient-to-br from-[#64748b] to-[#475569]',
  };
  return colors[key] || 'bg-gradient-to-br from-gray-500 to-gray-600';
}

// Neural Network Visualization - The middle phone content
export function NeuralNetworkVisualization({ showAgents = true }: { showAgents?: boolean } = {}) {
  const agents = [
    { key: 'task', x: 18, y: 15 },
    { key: 'events', x: 75, y: 12 },
    { key: 'auto_care', x: 45, y: 18 },
    { key: 'meal_plan', x: 12, y: 28 },
    { key: 'health', x: 85, y: 25 },
    { key: 'chef', x: 72, y: 35 },
    { key: 'home_maintenance', x: 15, y: 48 },
    { key: 'travel', x: 82, y: 52 },
    { key: 'shopping_gifts', x: 25, y: 62 },
    { key: 'friends_family', x: 78, y: 68 },
    { key: 'kids_activity', x: 20, y: 75 },
    { key: 'message', x: 55, y: 22 },
    { key: 'date_night', x: 38, y: 82 },
    { key: 'daily_brief', x: 65, y: 85 },
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white">
      {showAgents && (
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {agents.map((agent) => (
            <line 
              key={`line-${agent.key}`} 
              x1="50%" 
              y1="50%" 
              x2={`${agent.x}%`} 
              y2={`${agent.y}%`} 
              stroke="#d1d5db" 
              strokeWidth="1.5" 
              opacity="0.4" 
            />
          ))}
        </svg>
      )}
      
      {/* Center circle with your logo/icon */}
      <div className="relative z-20 flex items-center justify-center">
        <div className="absolute w-[105px] h-[105px] bg-white rounded-full shadow-lg"></div>
        <div className="relative w-[105px] h-[105px] rounded-full overflow-hidden">
          {/* Replace with your center image/logo */}
          <img 
            src="/your-center-logo.png" 
            alt="Center Logo"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      {showAgents && agents.map((agent, i) => (
        <div 
          key={agent.key} 
          className="absolute z-10 animate-pop-in" 
          style={{ 
            left: `${agent.x}%`, 
            top: `${agent.y}%`, 
            transform: 'translate(-50%, -50%)', 
            animationDelay: `${i * 70}ms` 
          }}
        >
          <div className={`w-9 h-9 rounded-xl ${getAgentIconBg(agent.key)} flex items-center justify-center shadow-lg`}>
            {getAgentIcon(agent.key, 16, 'white')}
          </div>
        </div>
      ))}
    </div>
  );
}

export { getAgentIcon, getAgentIconBg };
```

---

## 3. The 3-Phone Layout Section (Page Component)

Use this in your landing page:

```tsx
import IPhoneFrame from '@/components/IPhoneFrame';
import { NeuralNetworkVisualization } from '@/components/NeuralNetworkVisualization';

// ... in your component:

{/* Real Data & Integrations Section */}
<section className="py-16 sm:py-20 px-4 sm:px-6 bg-white border-t-4 border-gray-100">
    <div className="max-w-6xl mx-auto">
        <div className="text-center mb-4 sm:mb-6">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 mb-3">
                Real data. Real results.
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto px-4">
                Alfred connects to 12 real external services. Live flight prices from Amadeus, 2.3 million recipes from Edamam, 
                real weather forecasts, local business search, and more. No mock data, no compromises.
            </p>
        </div>

        {/* 3 iPhone Images - Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto mt-8 sm:mt-12 mb-8 sm:mb-12">
            {/* Left: First Screenshot */}
            <div className="flex flex-col items-center">
                <div className="flex justify-center mb-6 sm:mb-8 scale-75 sm:scale-90 md:scale-100">
                    <IPhoneFrame size="small">
                        <img 
                            src="/screenshots/screenshot-1.png" 
                            alt="Talk to Alfred"
                            className="w-full h-full object-cover"
                        />
                    </IPhoneFrame>
                </div>
                <div className="text-center px-4 max-w-xs">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">Talk Naturally</h3>
                    <p className="text-sm text-gray-600">
                        Hold to speak - Alfred listens and responds with a British butler voice
                    </p>
                </div>
            </div>

            {/* Middle: Neural Network in iPhone */}
            <div className="flex flex-col items-center">
                <div className="flex justify-center mb-6 sm:mb-8 scale-75 sm:scale-90 md:scale-100">
                    <IPhoneFrame size="small">
                        <NeuralNetworkVisualization />
                    </IPhoneFrame>
                </div>
                <div className="text-center px-4 max-w-xs">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">One Butler, 15 Specialists</h3>
                    <p className="text-sm text-gray-600">
                        Alfred coordinates 14 specialized agents + AI journal seamlessly
                    </p>
                </div>
            </div>

            {/* Right: Second Screenshot */}
            <div className="flex flex-col items-center">
                <div className="flex justify-center mb-6 sm:mb-8 scale-75 sm:scale-90 md:scale-100">
                    <IPhoneFrame size="small">
                        <img 
                            src="/screenshots/screenshot-2.png" 
                            alt="Chat with Alfred"
                            className="w-full h-full object-cover"
                        />
                    </IPhoneFrame>
                </div>
                <div className="text-center px-4 max-w-xs">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">Type Anytime</h3>
                    <p className="text-sm text-gray-600">
                        Chat interface for quick questions and detailed conversations
                    </p>
                </div>
            </div>
        </div>
    </div>
</section>
```

---

## 4. Required CSS Animations

Add these to your `globals.css` file:

```css
/* ================================================
   iPhone Frame Animation Keyframes
   ================================================ */

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pop-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes scale-in {
  from {
    transform: scale(0.8);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* ================================================
   Animation Utility Classes
   ================================================ */

.animate-fade-in {
  animation: fade-in 0.6s ease-out forwards;
}

.animate-slide-up {
  animation: slide-up 0.6s ease-out forwards;
}

.animate-pop-in {
  animation: pop-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

.animate-bounce-in {
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
}

.animate-scale-in {
  animation: scale-in 0.3s ease-out forwards;
}
```

---

## 5. Key Design Specifications

### iPhone Frame Properties

| Property | Value |
|----------|-------|
| **Frame border radius** | `3rem` (outer), `2.5rem` (screen) |
| **Frame padding** | `10px` |
| **Frame gradient** | `linear-gradient(145deg, #3a3a3a 0%, #0f0f0f 35%, #1f1f1f 65%, #3a3a3a 100%)` |
| **Content scale** | `0.7` (70% scale for realistic look) |
| **Dynamic Island** | `66-86px` wide, `18-22px` tall depending on size |
| **Aspect ratio** | 19.5:9 (iPhone Pro standard) |

### Size Options

| Size | Width | Height |
|------|-------|--------|
| `small` | `w-52 sm:w-56` | `h-[420px] sm:h-[455px]` |
| `medium` | `w-60 sm:w-64 md:w-72` | `h-[487.5px] sm:h-[520px] md:h-[585px]` |
| `large` | `w-72 sm:w-80 md:w-96` | `h-[585px] sm:h-[650px] md:h-[780px]` |

### Responsive Scaling

The 3-phone layout uses these responsive scale classes:
```
scale-75 sm:scale-90 md:scale-100
```

This ensures phones look good on:
- **Mobile**: 75% scale (stacked vertically)
- **Tablet**: 90% scale (may stack or grid)
- **Desktop**: 100% scale (3-column grid)

---

## 6. Quick Start Checklist

1. [ ] Copy `IPhoneFrame.tsx` to your components folder
2. [ ] Copy `NeuralNetworkVisualization.tsx` (or create your own middle phone content)
3. [ ] Add CSS animations to `globals.css`
4. [ ] Add your screenshots to `/public/screenshots/`
5. [ ] Replace the center logo in NeuralNetworkVisualization
6. [ ] Customize icons/colors in the agent arrays
7. [ ] Update the section text and descriptions

---

## 7. Dependencies

- **Tailwind CSS** (with standard configuration)
- **React** (with 'use client' for client components)
- **Next.js** (optional, but code is written for Next.js)

No additional npm packages required!

---

## 8. Customization Tips

### Changing iPhone Color

Modify the `background` gradient in the frame div:
```tsx
// Space Gray (default)
background: 'linear-gradient(145deg, #3a3a3a 0%, #0f0f0f 35%, #1f1f1f 65%, #3a3a3a 100%)'

// Silver
background: 'linear-gradient(145deg, #e8e8e8 0%, #c0c0c0 35%, #d8d8d8 65%, #e8e8e8 100%)'

// Gold
background: 'linear-gradient(145deg, #f5e6d3 0%, #d4af37 35%, #e8d4a8 65%, #f5e6d3 100%)'
```

### Removing Side Buttons

Simply delete the volume and power button divs if you want a cleaner look.

### Changing Dynamic Island Size

Adjust the `dynamicIslandSizes` object values.

---

*Generated from the Alfred AI project - hey-alfred.app*

