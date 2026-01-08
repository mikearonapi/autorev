/**
 * IPhoneFrame Component
 * 
 * Reusable iPhone 17 Pro frame with accurate design:
 * - Dynamic Island (pill-shaped notch)
 * - Proper aspect ratio (19.5:9)
 * - Side buttons (volume + power)
 * - Rounded corners and bezels
 * - Content scaled to 70% for realistic presentation
 * 
 * Adapted from Tailwind reference guide to CSS Modules
 * 
 * Server component - no client-side interactivity needed
 */

import styles from './IPhoneFrame.module.css';

/**
 * @typedef {Object} IPhoneFrameProps
 * @property {ReactNode} children - The screenshot/content to display inside the frame
 * @property {'small' | 'medium' | 'large'} [size='medium'] - Size variant of the iPhone frame
 */

/**
 * @param {IPhoneFrameProps} props
 */
export default function IPhoneFrame({ 
  children, 
  size = 'medium'
}) {
  return (
    <div className={styles.wrapper}>
      <div className={`${styles.frame} ${styles[size]}`}>
        
        {/* Volume Buttons - Left side */}
        <div className={`${styles.volumeButton} ${styles.volumeTop}`} />
        <div className={`${styles.volumeButton} ${styles.volumeMiddle}`} />
        <div className={`${styles.volumeButton} ${styles.volumeBottom}`} />
        
        {/* Power Button - Right side */}
        <div className={styles.powerButton} />
        
        {/* Screen Container with rounded corners */}
        <div className={`${styles.screen} ${styles[`screen${size.charAt(0).toUpperCase() + size.slice(1)}`]}`}>
          {/* Content wrapper with inset clipping to hide screenshot corners */}
          <div className={styles.contentWrapper}>
            {/* Content scaled down to 70% for realistic presentation */}
            <div className={styles.contentScaled}>
              {children}
            </div>
          </div>
          
          {/* Dynamic Island - ALWAYS ON TOP */}
          <div className={styles.dynamicIslandWrapper}>
            <div className={`${styles.dynamicIsland} ${styles[`dynamicIsland${size.charAt(0).toUpperCase() + size.slice(1)}`]}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

