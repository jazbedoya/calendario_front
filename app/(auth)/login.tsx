import { zodResolver } from "@hookform/resolvers/zod";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { loginApi, getMeApi } from "@/features/auth/api";
import { useAuthStore } from "@/stores/authStore";
import { useMascotStore } from "@/features/mascot/mascotStore";
import { TugaAnimation } from "@/features/mascot/TugaAnimation";
import { useGoogleAuth } from "@/features/auth/useGoogleAuth";
import { colors, spacing, radius, fontSize, fontWeight, shadows } from "@/theme";

type FormData = { email: string; password: string };

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const syncMascotName     = useMascotStore((s) => s.syncMascotName);
  const completeOnboarding = useMascotStore((s) => s.completeOnboarding);
  const [showPassword, setShowPassword] = useState(false);

  const schema = z.object({
    email: z.string().email(t("auth.validation.emailInvalid")),
    password: z.string().min(1, t("auth.validation.required")),
  });

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const { promptAsync, disabled: googleDisabled } = useGoogleAuth(
    (msg) => setError("root", { message: msg })
  );

  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const onSubmit = async (data: FormData) => {
    const attempt = async () => {
      const tokens = await loginApi(data);
      await setTokens(tokens.access_token, tokens.refresh_token);
      const me = await getMeApi();
      setUser(me);
      await syncMascotName(me.mascot_name);
      const isNewAccount = Date.now() - new Date(me.created_at).getTime() < 120_000;
      if (isNewAccount) {
        router.replace("/onboarding");
      } else {
        await completeOnboarding();
        router.replace("/");
      }
    };

    try {
      await attempt();
    } catch (e: any) {
      const status = e?.response?.status;
      if (!status) {
        try { await attempt(); return; } catch {}
      }
      let message: string;
      if (status === 401) {
        message = t("auth.errors.wrongCredentials");
      } else if (status === 403 && e?.response?.data?.detail === "email_not_verified") {
        message = t("auth.errors.emailNotVerified");
      } else if (status >= 500) {
        message = t("auth.errors.serverError");
      } else if (!e?.response) {
        message = t("auth.errors.connectionError");
      } else {
        message = t("auth.errors.unexpected");
      }
      setError("root", { message });
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <Text style={s.brand}>A V A N T E</Text>

          {/* Tuga + Títulos */}
          {!(Platform.OS === "android" && keyboardVisible) && (
            <View style={s.heroSection}>
              <View style={s.tugaCircle}>
                <TugaAnimation state="idle" size={90} />
              </View>
              <Text style={s.title}>{t("auth.login.title")}</Text>
              <Text style={s.subtitle}>{t("auth.login.subtitle")}</Text>
            </View>
          )}

          {/* Google */}
          <TouchableOpacity
            style={[s.googleBtn, shadows.soft]}
            onPress={() => promptAsync()}
            disabled={googleDisabled}
            activeOpacity={0.8}
          >
            <AntDesign name="google" size={18} color="#4285F4" />
            <Text style={s.googleBtnText}>{t("auth.login.googleBtn")}</Text>
          </TouchableOpacity>

          {/* Separador */}
          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>{t("auth.login.divider")}</Text>
            <View style={s.dividerLine} />
          </View>

          {/* Email */}
          <Text style={s.label}>{t("auth.login.emailLabel")}</Text>
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={[s.inputRow, errors.email && s.inputError]}>
                <Ionicons name="mail-outline" size={18} color={colors.fieldIcon} style={s.inputIcon} />
                <TextInput
                  style={s.inputField}
                  placeholder="tu@email.com"
                  placeholderTextColor={colors.fieldPlaceholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
              </View>
            )}
          />
          {errors.email && <Text style={s.fieldError}>{errors.email.message}</Text>}

          {/* Contraseña */}
          <Text style={[s.label, s.labelSpaced]}>{t("auth.login.passwordLabel")}</Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={[s.inputRow, errors.password && s.inputError]}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.fieldIcon} style={s.inputIcon} />
                <TextInput
                  style={s.inputField}
                  placeholder={t("auth.login.passwordPlaceholder") ?? "Tu contraseña"}
                  placeholderTextColor={colors.fieldPlaceholder}
                  secureTextEntry={!showPassword}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={colors.fieldIcon}
                  />
                </Pressable>
              </View>
            )}
          />
          {errors.password && <Text style={s.fieldError}>{errors.password.message}</Text>}

          <Pressable onPress={() => router.push("/(auth)/forgot-password" as any)}>
            <Text style={s.forgotPassword}>{t("auth.login.forgotPassword")}</Text>
          </Pressable>

          {errors.root && <Text style={s.rootError}>{errors.root.message}</Text>}

          {/* Botón Entrar */}
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={s.primaryBtnInner}>
                  <Text style={s.primaryBtnText}>{t("auth.login.submitBtn")}</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.white} />
                </View>
              )}
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>{t("auth.login.noAccount")} </Text>
            <Link href={"/(auth)/signup" as any} asChild>
              <Pressable>
                <Text style={s.footerLink}>{t("auth.login.createAccount")}</Text>
              </Pressable>
            </Link>
          </View>

          <View style={s.legalBlock}>
            <View style={s.legalRow}>
              <Text style={s.legalLink} onPress={() => Linking.openURL("https://jazbedoya.github.io/avante-legal/privacy.html")}>Privacy Policy</Text>
              <Text style={s.legalDot}> · </Text>
              <Text style={s.legalLink} onPress={() => Linking.openURL("https://jazbedoya.github.io/avante-legal/terms.html")}>Terms of Service</Text>
            </View>
            <Text style={s.legalCopy}>{t("auth.login.copyright")}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surfaceWarm },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: spacing.screenX, paddingBottom: 40 },

  brand: {
    textAlign: "center", fontSize: fontSize.label, fontWeight: fontWeight.semibold,
    color: colors.ink, letterSpacing: 6, paddingTop: spacing.lg, paddingBottom: spacing.sm,
  },

  heroSection: { alignItems: "center", marginBottom: spacing["2xl"] },
  tugaCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.border, ...shadows.card,
    overflow: "hidden",
  },
  title: {
    textAlign: "center", fontSize: fontSize.display, fontWeight: fontWeight.bold,
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
    color: colors.ink, marginTop: spacing.xl,
  },
  subtitle: {
    textAlign: "center", fontSize: fontSize.bodySm, fontStyle: "italic",
    color: colors.textMuted, marginTop: 6,
  },

  googleBtn: {
    width: "100%", height: 56, borderRadius: radius.hero,
    borderWidth: 1, borderColor: colors.fieldBorder, backgroundColor: colors.surface,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12,
    ...shadows.soft,
  },
  googleBtnText: { fontSize: fontSize.body, fontWeight: fontWeight.semibold, color: colors.ink },

  divider: { flexDirection: "row", alignItems: "center", marginVertical: spacing.xl },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.hairline },
  dividerText: {
    marginHorizontal: 12, fontSize: fontSize.caption, fontWeight: fontWeight.medium,
    color: colors.textFaint,
  },

  label: { fontSize: fontSize.bodySm, fontWeight: fontWeight.semibold, color: colors.ink, marginBottom: 6 },
  labelSpaced: { marginTop: spacing.lg },

  inputRow: {
    flexDirection: "row", alignItems: "center", height: 54, borderRadius: radius.field,
    borderWidth: 1, borderColor: colors.fieldBorder, paddingHorizontal: spacing.lg,
    backgroundColor: colors.surfaceWarm, gap: spacing.sm,
  },
  inputIcon: { opacity: 0.7 },
  inputField: { flex: 1, fontSize: fontSize.body, color: colors.ink },
  inputError: { borderColor: colors.invalid },

  forgotPassword: {
    textAlign: "right", color: colors.terracotta, fontSize: fontSize.label,
    fontWeight: fontWeight.medium, marginTop: spacing.sm,
  },

  fieldError: { fontSize: fontSize.caption, color: colors.invalid, marginTop: spacing.xs },
  rootError: { fontSize: fontSize.label, color: colors.invalid, marginTop: spacing.md, textAlign: "center" },

  primaryBtn: {
    height: 56, borderRadius: radius.hero, backgroundColor: colors.terracotta,
    alignItems: "center", justifyContent: "center", marginTop: spacing["2xl"],
    ...shadows.fab,
  },
  primaryBtnInner: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  primaryBtnText: { fontSize: fontSize.bodyLg, fontWeight: fontWeight.bold, color: colors.white },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing["2xl"] },
  footerText: { fontSize: fontSize.bodySm, color: colors.textSecondary },
  footerLink: { fontSize: fontSize.bodySm, fontWeight: fontWeight.bold, color: colors.ink, textDecorationLine: "underline" },

  legalBlock: { alignItems: "center", marginTop: spacing["2xl"], gap: spacing.xs },
  legalRow: { flexDirection: "row", alignItems: "center" },
  legalLink: { fontSize: fontSize.micro, color: colors.textMuted, textDecorationLine: "underline" },
  legalDot: { fontSize: fontSize.micro, color: colors.textDisabled },
  legalCopy: { fontSize: fontSize.micro, color: colors.textDisabled },
});
