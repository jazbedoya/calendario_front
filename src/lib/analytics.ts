/**
 * PostHog analytics wrapper (v3).
 * All tracking goes through this module — never import PostHog directly elsewhere.
 */
import PostHog from "posthog-react-native";
import { Platform } from "react-native";
import Constants from "expo-constants";

const POSTHOG_KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = "https://us.i.posthog.com";

let posthog: PostHog | null = null;

export async function initAnalytics(): Promise<void> {
  if (!POSTHOG_KEY || posthog) return;
  posthog = await PostHog.initAsync(POSTHOG_KEY, {
    host: POSTHOG_HOST,
  });
}

export function getPostHog(): PostHog | null {
  return posthog;
}

// ── Identify ─────────────────────────────────────────────────────────────────

export function identifyUser(userId: string, properties: {
  email?: string;
  language?: string;
  country?: string;
  createdAt?: string;
  turtleName?: string;
  hasGoogleConnected?: boolean;
}) {
  posthog?.identify(userId, {
    email: properties.email,
    language: properties.language,
    country: properties.country,
    created_at: properties.createdAt,
    turtle_name: properties.turtleName,
    platform: Platform.OS,
    app_version: Constants.expoConfig?.version ?? "1.0.0",
    has_google_connected: properties.hasGoogleConnected ?? false,
  });
}

export function resetUser() {
  posthog?.reset();
}

// ── Capture ──────────────────────────────────────────────────────────────────

export function capture(event: string, properties?: Record<string, any>) {
  posthog?.capture(event, properties);
}

// ── Consent ──────────────────────────────────────────────────────────────────

export function optIn() {
  posthog?.optIn();
}

export function optOut() {
  posthog?.optOut();
}

// ── Screen tracking ──────────────────────────────────────────────────────────

export function screenView(screen: string) {
  posthog?.screen(screen);
}
