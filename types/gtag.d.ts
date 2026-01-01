/**
 * TypeScript declarations for Google Analytics gtag.js
 * 
 * Extends the Window interface to include the gtag function
 * and dataLayer array used by Google Analytics 4.
 * 
 * @module types/gtag
 */

type GtagConfigParams = {
  page_path?: string;
  page_title?: string;
  page_location?: string;
  send_page_view?: boolean;
  [key: string]: string | number | boolean | undefined;
};

type GtagEventParams = {
  [key: string]: string | number | boolean | undefined;
};

type GtagCommand = 'config' | 'event' | 'js' | 'set' | 'get' | 'consent';

interface Window {
  /**
   * Google Analytics gtag function
   */
  gtag: {
    (command: 'config', targetId: string, config?: GtagConfigParams): void;
    (command: 'event', eventName: string, eventParams?: GtagEventParams): void;
    (command: 'js', date: Date): void;
    (command: 'set', params: Record<string, unknown>): void;
    (command: 'get', targetId: string, fieldName: string, callback: (value: unknown) => void): void;
    (command: 'consent', action: 'default' | 'update', params: Record<string, string>): void;
  };
  
  /**
   * Google Analytics data layer
   */
  dataLayer: Array<unknown>;
}

