/**
 * Returns the Google OAuth callback URI.
 * Uses EXPO_PUBLIC_GOOGLE_REDIRECT_URI if set (recommended).
 * Falls back to EXPO_PUBLIC_API_URL + /auth/google/callback.
 *
 * Must match a URI registered in Google Cloud Console.
 * GCP only accepts `localhost` or real domains — never raw IPs like 10.0.2.2.
 *
 * For Android emulator: run `adb reverse tcp:9001 tcp:9001` and use
 *   EXPO_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:9001/auth/google/callback
 */
export function getGoogleRedirectUri(): string {
  return (
    process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI ??
    `${process.env.EXPO_PUBLIC_API_URL}/auth/google/callback`
  );
}
