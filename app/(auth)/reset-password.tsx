import { zodResolver } from "@hookform/resolvers/zod";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
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
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { resetPasswordApi } from "@/features/auth/api";
import { Colors } from "@/lib/theme";

type FormData = { token: string; password: string; confirm: string };

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const schema = z
    .object({
      token: z.string().min(1, t("auth.validation.required")),
      password: z.string().min(8, t("auth.validation.minChars_other", { count: 8 })),
      confirm: z.string().min(1, t("auth.validation.required")),
    })
    .refine((d) => d.password === d.confirm, {
      message: t("auth.resetPw.errorMismatch"),
      path: ["confirm"],
    });

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { token: tokenParam ?? "", password: "", confirm: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await resetPasswordApi(data.token, data.password);
      Alert.alert(
        t("auth.resetPw.title"),
        t("auth.forgotPw.backToLogin"),
        [{ text: "OK", onPress: () => router.replace("/(auth)/login" as any) }]
      );
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 400) {
        setError("root", { message: t("auth.resetPw.errorToken") });
      } else {
        setError("root", { message: t("auth.errors.connectionError") });
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topHeader}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
            </Pressable>
          </View>

          <Text style={styles.title}>{t("auth.resetPw.title")}</Text>
          <Text style={styles.subtitle}>{t("auth.resetPw.subtitle")}</Text>

          {/* Token field — hidden if came from deep link */}
          {!tokenParam && (
            <>
              <Text style={[styles.label, { marginTop: 32 }]}>{t("auth.resetPw.tokenLabel")}</Text>
              <Controller
                control={control}
                name="token"
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    style={[styles.input, errors.token && styles.inputError]}
                    placeholder={t("auth.resetPw.tokenPlaceholder")}
                    placeholderTextColor={Colors.placeholder}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                  />
                )}
              />
              {errors.token && <Text style={styles.fieldError}>{errors.token.message}</Text>}
            </>
          )}

          <Text style={[styles.label, { marginTop: tokenParam ? 32 : 16 }]}>
            {t("auth.resetPw.passwordLabel")}
          </Text>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={[styles.passwordRow, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.placeholder}
                  secureTextEntry={!showPassword}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                  <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                </Pressable>
              </View>
            )}
          />
          {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}

          <Text style={[styles.label, styles.labelSpaced]}>{t("auth.resetPw.confirmLabel")}</Text>
          <Controller
            control={control}
            name="confirm"
            render={({ field: { onChange, value, onBlur } }) => (
              <View style={[styles.passwordRow, errors.confirm && styles.inputError]}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.placeholder}
                  secureTextEntry={!showConfirm}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                />
                <Pressable onPress={() => setShowConfirm(!showConfirm)} hitSlop={8}>
                  <Ionicons name={showConfirm ? "eye-off-outline" : "eye-outline"} size={20} color="#9CA3AF" />
                </Pressable>
              </View>
            )}
          />
          {errors.confirm && <Text style={styles.fieldError}>{errors.confirm.message}</Text>}

          {errors.root && <Text style={styles.rootError}>{errors.root.message}</Text>}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.85}
          >
            {isSubmitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>{t("auth.resetPw.submitBtn")}</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingBottom: 40 },

  topHeader: { paddingTop: 8, paddingBottom: 16 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
    color: Colors.midnight,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  label: { fontSize: 13, fontWeight: "600", color: Colors.textPrimary, marginBottom: 6 },
  labelSpaced: { marginTop: 16 },

  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.inputBg,
  },
  inputError: { borderColor: Colors.error },

  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    backgroundColor: Colors.inputBg,
  },
  passwordInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },

  fieldError: { fontSize: 12, color: Colors.error, marginTop: 4 },
  rootError: { fontSize: 13, color: Colors.error, marginTop: 12, textAlign: "center" },

  primaryBtn: {
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },
});
