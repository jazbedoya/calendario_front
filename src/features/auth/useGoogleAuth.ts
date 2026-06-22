import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useRef } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { getMeApi, patchMeApi } from "@/features/auth/api";
import { getGoogleRedirectUri } from "@/lib/getGoogleRedirectUri";
import { useAuthStore } from "@/stores/authStore";
import { useMascotStore } from "@/features/mascot/mascotStore";
import { capture } from "@/lib/analytics";

// Build the Google OAuth URL entirely on the client — avoids a backend round-trip
// that can time out on slow mobile connections. The state is base64 JSON (no JWT
// signature) which the backend callback accepts as a fallback.
function _buildGoogleAuthUrl(redirectTo: string, callbackUri: string): string {
  const state = btoa(JSON.stringify({ rto: redirectTo, cbk: callbackUri, type: "login" }));
  const params: Record<string, string> = {
    client_id: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID!,
    redirect_uri: callbackUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  };
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");
  return `https://accounts.google.com/o/oauth2/v2/auth?${qs}`;
}

const GOOGLE_ERROR_KEYS: Record<string, string> = {
  access_denied:          "auth.googleError.accessDenied",
  popup_closed_by_user:   "auth.googleError.cancelled",
  interaction_required:   "auth.googleError.cancelled",
  server_error:           "auth.googleError.server",
  temporarily_unavailable:"auth.googleError.server",
};

export function useGoogleAuth(onError?: (msg: string) => void) {
  const router = useRouter();
  const { t } = useTranslation();
  const { setTokens, setUser } = useAuthStore();
  const syncMascotName     = useMascotStore((s) => s.syncMascotName);
  const completeOnboarding = useMascotStore((s) => s.completeOnboarding);
  const launchingRef = useRef(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const handlePrompt = async () => {
    console.log("[GoogleAuth] handlePrompt called, launching=", launchingRef.current);
    if (launchingRef.current) return;
    launchingRef.current = true;

    try {
      const redirectTo = Linking.createURL("google-login-callback");
      const callbackUri = getGoogleRedirectUri();
      console.log("[GoogleAuth] redirectTo:", redirectTo);
      console.log("[GoogleAuth] callbackUri:", callbackUri);

      const url = _buildGoogleAuthUrl(redirectTo, callbackUri);
      console.log("[GoogleAuth] url (client-side):", url.substring(0, 80));

      // openAuthSessionAsync uses SFSafariViewController on iOS and Chrome Custom Tab
      // on Android — both handle the exp:// redirect back to the app natively.
      console.log("[GoogleAuth] opening auth session...");
      const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
      console.log("[GoogleAuth] auth session result type:", result.type);

      if (result.type !== "success") return; // cancelled or dismissed

      const params = Linking.parse(result.url).queryParams ?? {};
      console.log("[GoogleAuth] deep-link params:", JSON.stringify(params));

      if (params.error) {
        const errorCode = String(params.error);
        const msgKey = GOOGLE_ERROR_KEYS[errorCode] ?? "auth.googleError.generic";
        onErrorRef.current?.(t(msgKey));
        return;
      }

      const accessToken  = params.access_token  as string | undefined;
      const refreshToken = params.refresh_token as string | undefined;

      if (!accessToken || !refreshToken) {
        onErrorRef.current?.(t("auth.googleError.noToken"));
        return;
      }

      await setTokens(accessToken, refreshToken);

      const finishLogin = async () => {
        const me = await getMeApi();
        setUser(me);
        await syncMascotName(me.mascot_name);
        // Sync device timezone to backend
        const deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (deviceTz && deviceTz !== me.timezone) {
          patchMeApi({ timezone: deviceTz }).catch(() => {});
        }
        const isNewAccount = Date.now() - new Date(me.created_at).getTime() < 120_000;
        capture(isNewAccount ? "user_signed_up" : "user_logged_in", { method: "google" });
        if (isNewAccount) {
          router.replace("/onboarding");
        } else {
          await completeOnboarding();
          router.replace("/");
        }
      };

      try {
        await finishLogin();
      } catch (e: any) {
        if (!e?.response) {
          // Primer fallo sin respuesta HTTP (tunnel handshake) → reintentar una vez
          await finishLogin();
        } else {
          throw e;
        }
      }
    } catch (e: any) {
      console.error("[GoogleAuth] error:", e?.message);
      onErrorRef.current?.(t("auth.googleError.generic"));
    } finally {
      launchingRef.current = false;
    }
  };

  return { promptAsync: handlePrompt, disabled: false };
}
