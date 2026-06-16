import { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { Mascot } from "@/features/mascot/Mascot";
import { resendVerificationApi } from "@/features/auth/api";
import { Colors } from "@/lib/theme";

const COOLDOWN_SECONDS = 60;

export default function PendingVerificationScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(COOLDOWN_SECONDS);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!email || cooldown > 0 || sending) return;
    setSending(true);
    setSent(false);
    try {
      await resendVerificationApi(email);
      setSent(true);
      startCooldown();
    } catch {
      // Silent — backend rate limit returns 429, just keep cooldown
      startCooldown();
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Mascot name="" mood="happy" message="" size="large" showName={false} />

        <Text style={styles.title}>{t("auth.pendingVerification.title")}</Text>
        <Text style={styles.subtitle}>
          {t("auth.pendingVerification.subtitle")}
        </Text>
        {email ? <Text style={styles.email}>{email}</Text> : null}

        <Text style={styles.instruction}>
          {t("auth.pendingVerification.instruction")}
        </Text>

        {sent && (
          <Text style={styles.sentMsg}>{t("auth.pendingVerification.resentOk")}</Text>
        )}

        <TouchableOpacity
          style={[styles.resendBtn, cooldown > 0 && styles.resendBtnDisabled]}
          onPress={handleResend}
          disabled={cooldown > 0 || sending}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator color={Colors.primary} />
          ) : (
            <Text style={[styles.resendBtnText, cooldown > 0 && styles.resendBtnTextDisabled]}>
              {cooldown > 0
                ? t("auth.pendingVerification.resendCooldown", { seconds: cooldown })
                : t("auth.pendingVerification.resendBtn")}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.replace("/(auth)/login" as any)} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>{t("auth.pendingVerification.backToLogin")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.midnight,
    textAlign: "center",
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  email: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    textAlign: "center",
  },
  instruction: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 4,
  },
  sentMsg: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
    textAlign: "center",
  },
  resendBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 220,
  },
  resendBtnDisabled: {
    borderColor: Colors.border,
  },
  resendBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.primary,
  },
  resendBtnTextDisabled: {
    color: Colors.textMuted,
  },
  loginLink: {
    marginTop: 16,
    padding: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: "underline",
  },
});
