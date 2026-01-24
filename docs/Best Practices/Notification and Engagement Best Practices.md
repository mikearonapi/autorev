# Notifications_and_Engagement.md

# Building Premium Notification Systems for Cross-Platform Apps

Push notifications and engagement systems separate great consumer apps from forgettable ones. Apps like Duolingo, Whoop, Strava, and Apple Fitness have mastered the art of re-engagement through sophisticated notification architecture that respects user attention while driving **3-4x retention improvements**. This document provides a complete technical blueprint for implementing production-grade notifications in a Next.js 14 + Supabase + React Native/Expo stack, covering push architecture, database design, engagement psychology, deep linking, and analytics.

The core principle underlying all effective notification systems: **deliver value at the right moment through the right channel**. Users who receive well-timed, personalized notifications are 2.4x more likely to return daily, while 71% of users uninstall apps due to annoying notifications. The difference lies in implementation quality.

---

## Part 1: Push Notification Architecture

### Unified cross-platform notification flow

The recommended architecture routes all notifications through Supabase Edge Functions, which handle platform-specific delivery to Expo Push Service (mobile) and Web Push API (browsers):

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
├─────────────────────┬───────────────────────────────────────┤
│   Next.js Web App   │      React Native/Expo App            │
│   (Service Worker)  │      (Expo Notifications)             │
└─────────────────────┴───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE                                 │
│  Database Webhook → Edge Function                           │
│       ↓                                                      │
│  ┌─────────────────────────────────────────────────┐        │
│  │            Edge Function: send-push              │        │
│  │  • Routes to Expo Push API (mobile)             │        │
│  │  • Routes to web-push (browser)                 │        │
│  │  • Handles retries & receipts                   │        │
│  └─────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────┐
│    Expo Push Service    │     │      Web Push (VAPID)   │
│    (→ FCM/APNs)         │     │      (→ Browser)        │
└─────────────────────────┘     └─────────────────────────┘
```

### Web Push with Next.js 14 App Router

Create a service worker at `public/sw.js`:

```typescript
// public/sw.js
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url,
        notificationId: data.notificationId,
      },
      actions: data.actions || [],
    }
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      // Focus existing window or open new one
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
```

Register the service worker and manage subscriptions with a custom hook:

```typescript
// hooks/usePushNotifications.ts
'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

type PermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported'

export function usePushNotifications() {
  const [permission, setPermission] = useState<PermissionState>('prompt')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PermissionState)
    
    // Check existing subscription
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then(setSubscription)
    })
  }, [])

  const subscribe = useCallback(async () => {
    if (permission === 'denied' || permission === 'unsupported') {
      return { success: false, error: 'Permission not available' }
    }

    setIsLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ),
      })

      // Store subscription in Supabase
      const { error } = await supabase.from('push_tokens').upsert({
        token: JSON.stringify(sub.toJSON()),
        platform: 'web',
        device_id: navigator.userAgent,
      })

      if (error) throw error
      
      setSubscription(sub)
      setPermission('granted')
      return { success: true, subscription: sub }
    } catch (error) {
      console.error('Push subscription failed:', error)
      return { success: false, error }
    } finally {
      setIsLoading(false)
    }
  }, [permission, supabase])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return
    
    await subscription.unsubscribe()
    await supabase.from('push_tokens')
      .delete()
      .eq('token', JSON.stringify(subscription.toJSON()))
    
    setSubscription(null)
  }, [subscription, supabase])

  return {
    permission,
    subscription,
    isLoading,
    subscribe,
    unsubscribe,
    isSupported: permission !== 'unsupported',
  }
}
```

### Expo Push Notifications for React Native

Configure Expo notifications with proper permission handling:

```typescript
// hooks/useExpoPushNotifications.ts
import { useEffect, useRef, useState } from 'react'
import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { supabase } from '@/lib/supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export function useExpoPushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [permission, setPermission] = useState<Notifications.PermissionStatus>()
  const notificationListener = useRef<Notifications.Subscription>()
  const responseListener = useRef<Notifications.Subscription>()

  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token)
        saveTokenToDatabase(token)
      }
    })

    // Handle notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification)
      }
    )

    // Handle user interaction with notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data
        handleDeepLink(data)
      }
    )

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])

  async function registerForPushNotificationsAsync() {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device')
      return null
    }

    // Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      })
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    setPermission(existingStatus)
    
    let finalStatus = existingStatus
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
      setPermission(finalStatus)
    }

    if (finalStatus !== 'granted') {
      return null
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data
    return token
  }

  async function saveTokenToDatabase(token: string) {
    const { error } = await supabase.from('push_tokens').upsert({
      token,
      platform: Platform.OS as 'ios' | 'android',
      device_id: Device.deviceName || 'unknown',
      app_version: Constants.expoConfig?.version,
      os_version: Platform.Version.toString(),
    })
    if (error) console.error('Failed to save push token:', error)
  }

  return { expoPushToken, permission }
}
```

### Provider comparison for production apps

| Feature | Expo Push | Firebase FCM | OneSignal | Knock |
|---------|-----------|--------------|-----------|-------|
| **Pricing** | Free (600/sec) | Free | Free tier → $19+/mo | Free 10k/mo |
| **Mobile Push** | ✅ iOS/Android | ✅ iOS/Android | ✅ iOS/Android | ✅ via APNs/FCM |
| **Web Push** | ❌ | ✅ | ✅ | ✅ |
| **Email/SMS** | ❌ | ❌ | ✅ | ✅ integrations |
| **Delivery Receipts** | ✅ | Limited | ✅ Confirmed | ✅ |
| **Best For** | Expo-only mobile | Custom backend | Marketing teams | Complex workflows |

**Recommendation**: Use **Expo Push for mobile** (free, zero config with EAS) combined with **web-push library for browsers**. This eliminates vendor lock-in while providing full cross-platform coverage.

### Supabase Edge Function for unified delivery

```typescript
// supabase/functions/send-notification/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

webpush.setVapidDetails(
  'mailto:notifications@yourapp.com',
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!
)

interface NotificationPayload {
  user_id: string
  title: string
  body: string
  data?: Record<string, unknown>
  url?: string
}

Deno.serve(async (req) => {
  const payload: NotificationPayload = await req.json()

  // Get user's push tokens
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('*')
    .eq('user_id', payload.user_id)
    .eq('is_active', true)

  const results = await Promise.allSettled(
    (tokens || []).map(async (token) => {
      if (token.platform === 'web') {
        // Web Push
        const subscription = JSON.parse(token.token)
        return webpush.sendNotification(
          subscription,
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            url: payload.url,
            data: payload.data,
          })
        )
      } else {
        // Expo Push (iOS/Android)
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`,
          },
          body: JSON.stringify({
            to: token.token,
            title: payload.title,
            body: payload.body,
            data: payload.data,
          }),
        })
        return response.json()
      }
    })
  )

  // Log delivery status
  await supabase.from('notification_deliveries').insert(
    results.map((result, i) => ({
      token_id: tokens?.[i]?.id,
      status: result.status === 'fulfilled' ? 'sent' : 'failed',
      error_message: result.status === 'rejected' ? result.reason?.message : null,
    }))
  )

  return new Response(JSON.stringify({ results }), { status: 200 })
})
```

---

## Part 2: Database Schema for Notifications

### Core tables with TypeScript types

```sql
-- Enums for type safety
CREATE TYPE notification_category AS ENUM (
  'marketing', 'transactional', 'social', 'system', 
  'security', 'updates', 'reminders'
);

CREATE TYPE notification_channel AS ENUM ('push', 'email', 'in_app', 'sms');
CREATE TYPE delivery_status AS ENUM ('pending', 'queued', 'sent', 'delivered', 'failed', 'bounced');
CREATE TYPE device_platform AS ENUM ('ios', 'android', 'web');

-- User profiles with timezone
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  timezone TEXT DEFAULT 'UTC' CHECK (timezone IN (SELECT name FROM pg_timezone_names)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences (global + per-category)
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  in_app_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Category-specific preferences
CREATE TABLE notification_category_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category notification_category NOT NULL,
  push_enabled BOOLEAN,
  email_enabled BOOLEAN,
  in_app_enabled BOOLEAN,
  frequency TEXT DEFAULT 'immediate', -- 'immediate', 'daily_digest', 'weekly_digest'
  UNIQUE(user_id, category)
);

-- Push tokens for multi-device support
CREATE TABLE push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  platform device_platform NOT NULL,
  device_id TEXT,
  device_name TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  failed_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications log with metadata
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category notification_category NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  action_url TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Delivery tracking per channel
CREATE TABLE notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL,
  status delivery_status DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  external_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiet hours configuration
CREATE TABLE quiet_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT false,
  start_time TIME NOT NULL DEFAULT '22:00:00',
  end_time TIME NOT NULL DEFAULT '07:00:00',
  days_of_week INTEGER[] DEFAULT '{0,1,2,3,4,5,6}',
  allow_urgent BOOLEAN DEFAULT true,
  UNIQUE(user_id)
);

-- Performance indexes
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_user_created ON notifications(user_id, created_at DESC);
CREATE INDEX idx_push_tokens_user_active ON push_tokens(user_id) WHERE is_active = true;
CREATE INDEX idx_deliveries_pending ON notification_deliveries(status) WHERE status IN ('pending', 'queued');
```

### Row Level Security policies

```sql
-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiet_hours ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users view own preferences" ON notification_preferences
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own preferences" ON notification_preferences
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users view own notifications" ON notifications
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users mark own notifications read" ON notifications
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users manage own push tokens" ON push_tokens
  FOR ALL USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users manage own quiet hours" ON quiet_hours
  FOR ALL USING ((SELECT auth.uid()) = user_id);
```

### Timezone-aware quiet hours function

```sql
CREATE OR REPLACE FUNCTION is_in_quiet_hours(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tz TEXT;
  user_local_time TIMESTAMP;
  current_time_only TIME;
  qh RECORD;
BEGIN
  SELECT COALESCE(timezone, 'UTC') INTO user_tz FROM user_profiles WHERE id = p_user_id;
  user_local_time := NOW() AT TIME ZONE user_tz;
  current_time_only := user_local_time::TIME;
  
  SELECT * INTO qh FROM quiet_hours WHERE user_id = p_user_id AND enabled = true;
  IF qh IS NULL THEN RETURN FALSE; END IF;
  
  -- Handle overnight quiet hours (e.g., 22:00 to 07:00)
  IF qh.start_time > qh.end_time THEN
    RETURN current_time_only >= qh.start_time OR current_time_only < qh.end_time;
  ELSE
    RETURN current_time_only >= qh.start_time AND current_time_only < qh.end_time;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;
```

---

## Part 3: Permission Request Strategy

### The psychology of permission timing

Research shows that **81% higher grant rates** occur when users receive context before permission requests. Asking immediately at launch is the worst pattern—users who are bombarded with permission requests at first open are **80% more likely to uninstall within 3 days**.

**Permission Grant Rates by Platform:**
- **iOS**: 44-56% (always requires explicit consent)
- **Android**: 67-85% (dropped from 91% after Android 13 required explicit consent)
- **Web Push**: ~5% overall (74% Chrome, 9% Firefox, 6% Safari)

### The double-permission pattern

Always use a "soft ask" before triggering the native system prompt:

```typescript
// components/NotificationPermissionPrimer.tsx
'use client'
import { useState } from 'react'
import { usePushNotifications } from '@/hooks/usePushNotifications'

interface Props {
  onGranted?: () => void
  onDismissed?: () => void
}

export function NotificationPermissionPrimer({ onGranted, onDismissed }: Props) {
  const [showPrimer, setShowPrimer] = useState(true)
  const { permission, subscribe } = usePushNotifications()

  if (permission === 'granted' || permission === 'denied') {
    return null
  }

  async function handleEnable() {
    const result = await subscribe()
    if (result.success) {
      onGranted?.()
    }
    setShowPrimer(false)
  }

  function handleDismiss() {
    setShowPrimer(false)
    onDismissed?.()
  }

  if (!showPrimer) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
        <div className="text-4xl text-center mb-4">🔔</div>
        <h2 className="text-xl font-semibold text-center mb-2">
          Stay in the loop
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Get notified when:
        </p>
        <ul className="space-y-2 mb-6">
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Your order ships</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Items on your wishlist go on sale</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Someone responds to your message</span>
          </li>
        </ul>
        <div className="flex gap-3">
          <button
            onClick={handleDismiss}
            className="flex-1 py-3 px-4 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Not now
          </button>
          <button
            onClick={handleEnable}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Enable notifications
          </button>
        </div>
      </div>
    </div>
  )
}
```

### Optimal timing triggers

| Trigger Point | Why It Works | Example |
|--------------|--------------|---------|
| After first value moment | User experienced benefit | After completing first workout |
| Feature-specific context | Clear connection to value | "Get notified when outbid" |
| After engagement threshold | Trust established | After 3rd session or 60 seconds |
| Post-transaction | Natural expectation | "Track your order?" |

### Handling denied permissions

```typescript
// components/NotificationSettingsPrompt.tsx
import { Linking, Platform } from 'react-native'

export function PermissionDeniedBanner() {
  const openSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:')
    } else {
      Linking.openSettings()
    }
  }

  return (
    <View className="bg-yellow-50 p-4 rounded-lg flex-row items-center">
      <Text className="flex-1 text-yellow-800">
        Notifications are disabled. You won't receive delivery updates.
      </Text>
      <TouchableOpacity onPress={openSettings}>
        <Text className="text-yellow-900 font-semibold">Settings</Text>
      </TouchableOpacity>
    </View>
  )
}
```

---

## Part 4: Engagement Loop Patterns from Premium Apps

### Duolingo's streak mechanics

Duolingo's streak system drives **$500M+ annual revenue** through sophisticated behavioral psychology. Users with 7-day streaks are **3.6x more likely to complete their course** and **2.4x more likely to return daily**.

**Technical Implementation:**
- Streak increments on completing one lesson per day (simplified from XP-based)
- **Streak Freeze**: Users can equip up to 2 freezes, purchased with in-app gems
- iOS widget display increased user commitment by **60%**
- Milestone animations (day 7, 14, 30) increased 7-day retention by **+1.7%**

```typescript
// lib/streak.ts
interface StreakData {
  currentStreak: number
  longestStreak: number
  lastActivityDate: string | null
  freezesAvailable: number
  freezesEquipped: number
}

export function calculateStreakStatus(data: StreakData) {
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  
  if (data.lastActivityDate === today) {
    return { status: 'completed', streakSafe: true }
  }
  
  if (data.lastActivityDate === yesterday) {
    return { 
      status: 'at_risk', 
      streakSafe: false,
      hoursRemaining: getHoursUntilMidnight(),
      message: `Complete a lesson to extend your ${data.currentStreak} day streak!`
    }
  }
  
  // Streak broken, but freeze might save it
  if (data.freezesEquipped > 0) {
    return { status: 'frozen', streakSafe: true }
  }
  
  return { status: 'broken', newStreak: 0 }
}

export function getStreakNotificationCopy(streakDays: number, hoursLeft: number): string {
  if (hoursLeft <= 2) {
    return `⚠️ Your ${streakDays} day streak expires in ${hoursLeft} hours!`
  }
  if (hoursLeft <= 6) {
    return `Don't lose your ${streakDays} day streak! Practice now.`
  }
  return `Keep your ${streakDays} day streak going! One quick lesson today.`
}
```

### Strava's social engagement triggers

```typescript
// Notification triggers for social engagement
const SOCIAL_NOTIFICATION_TRIGGERS = {
  kudos_received: {
    immediate: true,
    template: '{actor} gave kudos to your {activity_type}',
    action_url: '/activities/{activity_id}',
  },
  comment_received: {
    immediate: true,
    template: '{actor} commented: "{comment_preview}"',
    action_url: '/activities/{activity_id}#comments',
  },
  friend_activity: {
    batch: true,
    batchWindow: '1h',
    template: '{actor} just finished a {activity_type}',
    action_url: '/activities/{activity_id}',
  },
  segment_achievement: {
    immediate: true,
    template: '🏆 New PR on {segment_name}! You beat your previous by {time_diff}',
    action_url: '/segments/{segment_id}',
  },
}
```

### Variable reward schedules

Based on Nir Eyal's Hooked model, effective engagement uses unpredictable rewards that create anticipation:

- **Rewards of the Tribe**: Social validation (kudos, likes, comments)
- **Rewards of the Hunt**: Achievements, badges, unlocks
- **Rewards of the Self**: Personal progress, mastery indicators

```typescript
// lib/rewards.ts
interface RewardConfig {
  type: 'tribe' | 'hunt' | 'self'
  probability: number // 0-1, for variable scheduling
  cooldown: number // minutes between potential rewards
}

const REWARD_SCHEDULE: Record<string, RewardConfig> = {
  streak_milestone: { type: 'self', probability: 1, cooldown: 1440 },
  surprise_badge: { type: 'hunt', probability: 0.1, cooldown: 60 },
  social_highlight: { type: 'tribe', probability: 0.3, cooldown: 120 },
}

export function shouldTriggerReward(
  rewardType: string, 
  lastTriggered: Date | null
): boolean {
  const config = REWARD_SCHEDULE[rewardType]
  if (!config) return false
  
  // Check cooldown
  if (lastTriggered) {
    const minutesSince = (Date.now() - lastTriggered.getTime()) / 60000
    if (minutesSince < config.cooldown) return false
  }
  
  // Variable probability for engagement hooks
  return Math.random() < config.probability
}
```

---

## Part 5: In-App Notification Center

### Notification inbox component architecture

```typescript
// components/NotificationCenter.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  category: string
  title: string
  body: string
  action_url: string | null
  is_read: boolean
  created_at: string
  metadata: Record<string, unknown>
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()
    
    // Real-time subscription
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
        setUnreadCount(prev => prev + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchNotifications() {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter(n => !n.is_read).length)
    }
  }

  async function markAsRead(id: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
    
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  async function markAllAsRead() {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .in('id', unreadIds)
    
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  // Group notifications by date
  const grouped = notifications.reduce((acc, notif) => {
    const date = new Date(notif.created_at).toDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(notif)
    return acc
  }, {} as Record<string, Notification[]>)

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-xl shadow-2xl border max-h-[70vh] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
            {Object.entries(grouped).map(([date, items]) => (
              <div key={date}>
                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 font-medium">
                  {date === new Date().toDateString() ? 'Today' : date}
                </div>
                {items.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={() => markAsRead(notification.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ 
  notification, 
  onRead 
}: { 
  notification: Notification
  onRead: () => void 
}) {
  const handleClick = () => {
    if (!notification.is_read) onRead()
    if (notification.action_url) {
      window.location.href = notification.action_url
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition ${
        !notification.is_read ? 'bg-blue-50/50' : ''
      }`}
    >
      <div className="flex gap-3">
        <CategoryIcon category={notification.category} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${!notification.is_read ? 'font-semibold' : ''}`}>
            {notification.title}
          </p>
          <p className="text-sm text-gray-600 truncate">
            {notification.body}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
          </p>
        </div>
        {!notification.is_read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
        )}
      </div>
    </div>
  )
}
```

---

## Part 6: Deep Linking Architecture

### Universal Links (iOS) and App Links (Android)

**Apple App Site Association file** (`public/.well-known/apple-app-site-association`):

```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAMID.com.yourapp.app",
      "paths": ["/products/*", "/users/*", "/share/*", "/invite/*"]
    }]
  }
}
```

**Android Digital Asset Links** (`public/.well-known/assetlinks.json`):

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.yourapp.app",
    "sha256_cert_fingerprints": ["AA:BB:CC:..."]
  }
}]
```

### Unified deep link handler for React Navigation

```typescript
// navigation/linking.ts
import * as Linking from 'expo-linking'

export const linking = {
  prefixes: [
    Linking.createURL('/'),
    'https://yourapp.com',
    'yourapp://',
  ],
  
  config: {
    screens: {
      Home: '',
      ProductStack: {
        path: 'products',
        screens: {
          ProductDetail: ':productId',
          ProductReviews: ':productId/reviews',
        },
      },
      UserStack: {
        path: 'users',
        screens: {
          UserProfile: ':userId',
        },
      },
      NotFound: '*',
    },
  },
}

// hooks/useDeepLinking.ts
import { useEffect, useRef } from 'react'
import { Linking } from 'react-native'
import { NavigationContainerRef } from '@react-navigation/native'

export function useDeepLinking(
  navigationRef: React.RefObject<NavigationContainerRef<any>>
) {
  const isReady = useRef(false)
  const pendingLink = useRef<string | null>(null)

  useEffect(() => {
    // Handle cold start
    Linking.getInitialURL().then((url) => {
      if (url) {
        if (isReady.current) {
          handleDeepLink(url)
        } else {
          pendingLink.current = url
        }
      }
    })

    // Handle warm start
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url)
    })

    return () => subscription.remove()
  }, [])

  function handleDeepLink(url: string) {
    const { path, queryParams } = Linking.parse(url)
    // Navigation handled automatically by linking config
    console.log('Deep link:', path, queryParams)
  }

  function onNavigationReady() {
    isReady.current = true
    if (pendingLink.current) {
      handleDeepLink(pendingLink.current)
      pendingLink.current = null
    }
  }

  return { onNavigationReady }
}
```

### Next.js dynamic routes for web deep links

```typescript
// app/products/[productId]/page.tsx
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ productId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId } = await params
  const product = await getProduct(productId)
  
  return {
    title: product?.name ?? 'Product',
    openGraph: {
      title: product?.name,
      images: [product?.image],
      url: `https://yourapp.com/products/${productId}`,
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { productId } = await params
  const product = await getProduct(productId)
  
  if (!product) notFound()
  
  return (
    <>
      {/* Smart App Banner for iOS */}
      <meta 
        name="apple-itunes-app" 
        content={`app-id=YOUR_APP_ID, app-argument=https://yourapp.com/products/${productId}`} 
      />
      <ProductDetail product={product} />
    </>
  )
}
```

---

## Part 7: Email Integration and Coordination

### Resend + React Email with Supabase

```typescript
// supabase/functions/send-email/index.ts
import React from 'npm:react@18.3.1'
import { Resend } from 'npm:resend@4.0.0'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { OrderConfirmationEmail } from './_templates/order-confirmation.tsx'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

interface EmailPayload {
  to: string
  template: string
  data: Record<string, unknown>
}

const TEMPLATES = {
  'order-confirmation': OrderConfirmationEmail,
  'shipping-update': ShippingUpdateEmail,
  'welcome': WelcomeEmail,
}

Deno.serve(async (req) => {
  const payload: EmailPayload = await req.json()
  const Template = TEMPLATES[payload.template]
  
  if (!Template) {
    return new Response(JSON.stringify({ error: 'Unknown template' }), { status: 400 })
  }

  const html = await renderAsync(
    React.createElement(Template, payload.data)
  )

  const result = await resend.emails.send({
    from: 'YourApp <notifications@yourapp.com>',
    to: [payload.to],
    subject: getSubject(payload.template, payload.data),
    html,
    headers: {
      'List-Unsubscribe': `<https://yourapp.com/unsubscribe?email=${encodeURIComponent(payload.to)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  })

  return new Response(JSON.stringify(result), { status: 200 })
})
```

### Channel coordination to avoid double-notifications

```typescript
// lib/notification-router.ts
interface NotificationRequest {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, unknown>
  channels?: ('push' | 'email' | 'in_app')[]
  priority?: 'low' | 'normal' | 'high'
}

export async function sendNotification(request: NotificationRequest) {
  const preferences = await getUserPreferences(request.userId)
  const quietHours = await isInQuietHours(request.userId)
  
  // Determine which channels to use
  const channels = request.channels ?? ['push', 'in_app']
  const enabledChannels = channels.filter(channel => {
    if (!preferences[`${channel}_enabled`]) return false
    if (quietHours && request.priority !== 'high') return false
    return true
  })

  // Always create in-app notification
  const inAppResult = await createInAppNotification(request)

  // Send push if enabled
  if (enabledChannels.includes('push')) {
    await sendPushNotification(request)
    // Don't send email if push succeeded for transactional
    if (request.type === 'transactional') {
      return { inApp: inAppResult, push: true }
    }
  }

  // Fallback to email if push disabled/failed
  if (enabledChannels.includes('email')) {
    await sendEmailNotification(request)
  }

  return { inApp: inAppResult, channels: enabledChannels }
}
```

---

## Part 8: Analytics and Optimization

### Notification delivery tracking

```typescript
// lib/notification-analytics.ts
interface NotificationEvent {
  notification_id: string
  event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'dismissed'
  channel: 'push' | 'email' | 'in_app'
  timestamp: Date
  metadata?: Record<string, unknown>
}

export async function trackNotificationEvent(event: NotificationEvent) {
  await supabase.from('notification_events').insert({
    notification_id: event.notification_id,
    event_type: event.event_type,
    channel: event.channel,
    occurred_at: event.timestamp.toISOString(),
    metadata: event.metadata,
  })
}

// Dashboard query for delivery metrics
const DELIVERY_METRICS_QUERY = `
  SELECT 
    DATE_TRUNC('day', n.created_at) as date,
    nt.category,
    COUNT(*) as total_sent,
    COUNT(*) FILTER (WHERE d.status = 'delivered') as delivered,
    COUNT(*) FILTER (WHERE d.status = 'failed') as failed,
    COUNT(*) FILTER (WHERE ni.event_type = 'clicked') as clicked,
    ROUND(
      COUNT(*) FILTER (WHERE d.status = 'delivered')::numeric / 
      COUNT(*)::numeric * 100, 2
    ) as delivery_rate,
    ROUND(
      COUNT(*) FILTER (WHERE ni.event_type = 'clicked')::numeric / 
      NULLIF(COUNT(*) FILTER (WHERE d.status = 'delivered'), 0)::numeric * 100, 2
    ) as click_rate
  FROM notifications n
  JOIN notification_types nt ON n.type_id = nt.id
  LEFT JOIN notification_deliveries d ON n.id = d.notification_id
  LEFT JOIN notification_interactions ni ON n.id = ni.notification_id
  WHERE n.created_at >= NOW() - INTERVAL '30 days'
  GROUP BY 1, 2
  ORDER BY 1 DESC, 2
`
```

### Key metrics to monitor

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Delivery Rate | >95% | <90% |
| Click-Through Rate | >15% | <5% |
| Opt-Out Rate | <0.5%/month | >1%/month |
| Spam Complaint Rate | <0.1% | >0.3% |

---

## Part 9: Anti-Patterns to Avoid

### Notification patterns that cause uninstalls

**71% of users uninstall apps** due to annoying notifications. Critical mistakes include:

1. **Permission Request Mistakes**
   - ❌ Asking immediately on first launch
   - ❌ No context for why notifications are needed
   - ❌ Using only the generic system prompt
   - ✅ Use pre-permission primer with specific value propositions

2. **Frequency Mistakes**
   - ❌ Multiple notifications per day (except messaging apps)
   - ❌ Batch notifications without user control
   - ✅ 2-3 notifications per week is optimal for most apps
   - ✅ Respect user-set frequency preferences

3. **Content Mistakes**
   - ❌ "You have a new notification" (vague)
   - ❌ "We miss you 😢" (guilt-tripping)
   - ❌ "🔥🔥🔥 HOT DEALS!!!" (spammy)
   - ✅ "Your order #1234 shipped - arriving Tuesday" (specific, actionable)
   - ✅ "Sarah commented on your post" (personal, relevant)

4. **Timing Mistakes**
   - ❌ Notifications between 9 PM - 8 AM
   - ❌ Ignoring user timezone
   - ❌ Weekend promotions for B2B apps
   - ✅ Send during user's active hours (learned from behavior)
   - ✅ Honor device Do Not Disturb settings

### Notification fatigue detection

```typescript
// lib/fatigue-detection.ts
interface FatigueIndicators {
  dismissRate: number        // % dismissed without action
  optOutRate: number         // Recent opt-out trend
  engagementTrend: number    // Click rate change over time
  notificationFrequency: number // Notifications per week
}

export function detectNotificationFatigue(userId: string): Promise<FatigueIndicators> {
  // Query recent notification interactions
  // Flag users with:
  // - Dismiss rate > 80%
  // - Declining click rates over 2 weeks
  // - Recent opt-out from any category
  
  // Recommended actions:
  // - Reduce frequency automatically
  // - Switch to digest format
  // - Pause marketing notifications
}
```

---

## Part 10: Notification Preferences UI Component

```typescript
// components/NotificationPreferences.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Preferences {
  notifications_enabled: boolean
  push_enabled: boolean
  email_enabled: boolean
  categories: Record<string, { push: boolean; email: boolean }>
}

const CATEGORIES = [
  { id: 'transactional', label: 'Order Updates', description: 'Shipping, delivery, receipts' },
  { id: 'social', label: 'Social Activity', description: 'Comments, likes, follows' },
  { id: 'marketing', label: 'Promotions', description: 'Sales, new products, recommendations' },
  { id: 'reminders', label: 'Reminders', description: 'Streaks, goals, scheduled events' },
]

export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadPreferences()
  }, [])

  async function loadPreferences() {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .single()
    
    const { data: categoryPrefs } = await supabase
      .from('notification_category_preferences')
      .select('*')
    
    const categories = (categoryPrefs || []).reduce((acc, cp) => {
      acc[cp.category] = { push: cp.push_enabled, email: cp.email_enabled }
      return acc
    }, {} as Record<string, { push: boolean; email: boolean }>)

    setPreferences({
      notifications_enabled: prefs?.notifications_enabled ?? true,
      push_enabled: prefs?.push_enabled ?? true,
      email_enabled: prefs?.email_enabled ?? true,
      categories,
    })
  }

  async function updatePreference(key: string, value: boolean) {
    setSaving(true)
    await supabase
      .from('notification_preferences')
      .update({ [key]: value, updated_at: new Date().toISOString() })
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    
    setPreferences(prev => prev ? { ...prev, [key]: value } : null)
    setSaving(false)
  }

  async function updateCategoryPreference(
    category: string, 
    channel: 'push' | 'email', 
    value: boolean
  ) {
    setSaving(true)
    const userId = (await supabase.auth.getUser()).data.user?.id
    
    await supabase
      .from('notification_category_preferences')
      .upsert({
        user_id: userId,
        category,
        [`${channel}_enabled`]: value,
      })
    
    setPreferences(prev => {
      if (!prev) return null
      return {
        ...prev,
        categories: {
          ...prev.categories,
          [category]: {
            ...prev.categories[category],
            [channel]: value,
          },
        },
      }
    })
    setSaving(false)
  }

  if (!preferences) return <LoadingSkeleton />

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notification Preferences</h1>
      
      {/* Master toggle */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold">All Notifications</h2>
            <p className="text-sm text-gray-500">
              Master switch for all notification channels
            </p>
          </div>
          <Toggle
            checked={preferences.notifications_enabled}
            onChange={(v) => updatePreference('notifications_enabled', v)}
          />
        </div>
      </div>

      {/* Channel toggles */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <h2 className="font-semibold mb-4">Channels</h2>
        <div className="space-y-4">
          <ToggleRow
            label="Push Notifications"
            description="Alerts on your device"
            checked={preferences.push_enabled}
            onChange={(v) => updatePreference('push_enabled', v)}
            disabled={!preferences.notifications_enabled}
          />
          <ToggleRow
            label="Email"
            description="Updates in your inbox"
            checked={preferences.email_enabled}
            onChange={(v) => updatePreference('email_enabled', v)}
            disabled={!preferences.notifications_enabled}
          />
        </div>
      </div>

      {/* Category preferences */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="font-semibold mb-4">Notification Types</h2>
        <div className="space-y-6">
          {CATEGORIES.map((category) => (
            <div key={category.id} className="border-b pb-4 last:border-0">
              <div className="mb-2">
                <h3 className="font-medium">{category.label}</h3>
                <p className="text-sm text-gray-500">{category.description}</p>
              </div>
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferences.categories[category.id]?.push ?? true}
                    onChange={(e) => 
                      updateCategoryPreference(category.id, 'push', e.target.checked)
                    }
                    disabled={!preferences.push_enabled}
                    className="rounded"
                  />
                  <span className="text-sm">Push</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={preferences.categories[category.id]?.email ?? true}
                    onChange={(e) => 
                      updateCategoryPreference(category.id, 'email', e.target.checked)
                    }
                    disabled={!preferences.email_enabled}
                    className="rounded"
                  />
                  <span className="text-sm">Email</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      {saving && (
        <div className="fixed bottom-4 right-4 bg-black text-white px-4 py-2 rounded-lg">
          Saving...
        </div>
      )}
    </div>
  )
}
```

---

## Conclusion

Building a premium notification system requires balancing technical implementation with behavioral psychology. The key principles that separate apps like Duolingo, Strava, and Apple Fitness from forgettable apps are:

1. **Permission timing matters enormously**—wait for value demonstration before asking, use double-permission patterns, and never ask on first launch

2. **Streaks and variable rewards drive retention**—users with 7+ day streaks are 2-3x more likely to return daily; loss aversion messaging is powerful but must be balanced with genuine value

3. **Cross-platform consistency requires architectural planning**—unified schemas, Edge Functions routing to platform-specific providers, and deep linking that works across web and native

4. **Respect user attention**—quiet hours, frequency caps, channel preferences, and smart timing based on individual behavior patterns prevent the notification fatigue that causes 71% of uninstalls

5. **Measure what matters**—delivery rates, click-through rates, and especially opt-out trends signal notification health before users leave entirely

The complete system includes: push notification infrastructure (Web Push + Expo), comprehensive database schemas with RLS, permission request UX, engagement loop mechanics, in-app notification center, universal deep linking, email integration, and analytics. Implement these patterns incrementally, measuring impact at each stage, to build notification systems that users actually appreciate.