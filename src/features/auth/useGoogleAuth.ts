import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useRef } from "react";
import { useRouter } from "expo-router";
import { getMeApi } from "@/features/auth/api";
import { getGoogleRedirectUri } from "@/lib/getGoogleRedirectUri";
import { useAuthStore } from "@/stores/authStore";
import { useMascotStore } from "@/features/mascot/mascotStore";

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

export function useGoogleAuth(onError?: (msg: string) => void) {
  const router = useRouter();
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
        onErrorRef.current?.(`Error de Google: ${params.error}`);
        return;
      }

      const accessToken  = params.access_token  as string | undefined;
      const refreshToken = params.refresh_token as string | undefined;

      if (!accessToken || !refreshToken) {
        onErrorRef.current?.("No se pudo obtener el token");
        return;
      }

      await setTokens(accessToken, refreshToken);

      const finishLogin = async () => {
        const me = await getMeApi();
        setUser(me);
        await syncMascotName(me.mascot_name);
        if (me.mascot_name === "Tuga") {
          // Usuario nuevo — dejar que onboarding complete el flujo
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
      onErrorRef.current?.("Error al iniciar sesión con Google");
    } finally {
      launchingRef.current = false;
    }
  };

  return { promptAsync: handlePrompt, disabled: false };
}
