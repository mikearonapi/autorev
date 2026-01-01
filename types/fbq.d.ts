/**
 * TypeScript declarations for Meta Pixel (Facebook Pixel)
 * 
 * Extends the Window interface to include the fbq function
 * used by Meta Pixel for conversion tracking.
 * 
 * @module types/fbq
 */

type FbqStandardEvent = 
  | 'PageView'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'Schedule'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe';

type FbqEventParams = {
  content_category?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: Array<{ id: string; quantity: number }>;
  currency?: string;
  num_items?: number;
  predicted_ltv?: number;
  search_string?: string;
  status?: string;
  value?: number;
  [key: string]: string | number | boolean | string[] | Array<{ id: string; quantity: number }> | undefined;
};

interface FbqFunction {
  (command: 'init', pixelId: string): void;
  (command: 'track', eventName: FbqStandardEvent, params?: FbqEventParams): void;
  (command: 'trackCustom', eventName: string, params?: FbqEventParams): void;
  (command: 'trackSingle', pixelId: string, eventName: FbqStandardEvent, params?: FbqEventParams): void;
  (command: 'trackSingleCustom', pixelId: string, eventName: string, params?: FbqEventParams): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[];
  push: (...args: unknown[]) => void;
  loaded: boolean;
  version: string;
}

interface Window {
  /**
   * Meta Pixel (Facebook Pixel) function
   */
  fbq: FbqFunction;
  
  /**
   * Internal Meta Pixel reference
   */
  _fbq: FbqFunction;
}

