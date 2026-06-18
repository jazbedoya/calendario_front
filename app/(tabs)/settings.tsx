import { useState } from "react";
import { StreakPill } from "@/features/tasks/StreakPill";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "react-native";
import { useTranslation } from "react-i18next";

import { useAuthStore }              from "@/stores/authStore";
import { useMascotStore }            from "@/features/mascot/mascotStore";
import { useCelebrationSettings }    from "@/stores/celebrationSettingsStore";
import { getHours } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { getMascotState }            from "@/features/mascot/getMascotState";
import { Mascot } from "@/features/mascot/Mascot";
import {
  useCalendarStatus,
  useSyncCalendar,
  useDisconnectCalendar,
} from "@/features/calendar/useCalendarSync";
import { getCalendarConnectUrlApi } from "@/features/calendar/api";
import { getGoogleRedirectUri } from "@/lib/getGoogleRedirectUri";
import { useCalendarStore }          from "@/features/calendar/calendarStore";
import { useLanguageStore }          from "@/features/settings/languageStore";
import { useHolidayStore }           from "@/features/settings/holidayStore";
import type { HolidayCountry }       from "@/features/overview/getHolidays";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

// ─── Row component ────────────────────────────────────────────────────────────

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor?: string;
  label: string;
  sublabel?: string;
  onPress?: () => void;
  rightText?: string;
  destructive?: boolean;
  disabled?: boolean;
  loading?: boolean;
  noChevron?: boolean;
  last?: boolean;
}

function Row({
  icon, iconBg, iconColor, label, sublabel,
  onPress, rightText, destructive, disabled, loading, noChevron, last,
}: RowProps) {
  const iColor = destructive ? "#C8553D" : (iconColor ?? "#555555");
  return (
    <TouchableOpacity
      style={[r.row, !last && r.border]}
      onPress={onPress}
      disabled={disabled || loading || !onPress}
      activeOpacity={0.6}
    >
      <View style={[r.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color={iColor} />
      </View>
      <View style={r.labelWrap}>
        <Text style={[r.label, destructive && r.labelRed]}>{label}</Text>
        {sublabel ? <Text style={r.sublabel}>{sublabel}</Text> : null}
      </View>
      {loading ? (
        <ActivityIndicator size="small" color="#AAAAAA" style={r.right} />
      ) : rightText ? (
        <Text style={r.rightText}>{rightText}</Text>
      ) : noChevron ? null : (
        <Ionicons name="chevron-forward" size={14} color="#CCCCCC" style={r.right} />
      )}
    </TouchableOpacity>
  );
}

const r = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  border:   { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EFEFEF" },
  iconBox:  { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 14 },
  labelWrap:{ flex: 1 },
  label:    { fontSize: 15, fontWeight: "500", color: "#1A1A1A" },
  labelRed: { color: "#C8553D" },
  sublabel: { fontSize: 12, color: "#8A8A8A", marginTop: 2 },
  right:    { marginLeft: 8 },
  rightText:{ fontSize: 13, color: "#8A8A8A", marginLeft: 8 },
});

// ─── Language picker ──────────────────────────────────────────────────────────

const LANG_ICONS: Record<SupportedLanguage, string> = {
  es: "🇪🇸", en: "🇬🇧", fr: "🇫🇷", de: "🇩🇪",
};

function LanguagePicker() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  return (
    <View style={lp.row}>
      {SUPPORTED_LANGUAGES.map((lang, idx) => {
        const active = lang === language;
        const isLast = idx === SUPPORTED_LANGUAGES.length - 1;
        return (
          <TouchableOpacity
            key={lang}
            style={[lp.pill, active && lp.pillActive, !isLast && lp.pillBorder]}
            onPress={() => setLanguage(lang)}
            activeOpacity={0.7}
          >
            <Text style={lp.flag}>{LANG_ICONS[lang]}</Text>
            <Text style={[lp.pillTxt, active && lp.pillTxtActive]}>
              {t(`settings.language.${lang}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const lp = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
    flexWrap: "wrap",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    backgroundColor: "#F5F5F5",
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  pillActive:    { backgroundColor: "#FFF3E8", borderColor: "#C8553D", borderWidth: 2 },
  pillBorder:    {},
  flag:          { fontSize: 17 },
  pillTxt:       { fontSize: 14, fontWeight: "500", color: "#5A5A5A" },
  pillTxtActive: { color: "#C8553D", fontWeight: "700" },
});

// ─── Country picker ───────────────────────────────────────────────────────────

const COUNTRY_FLAGS: Record<HolidayCountry, string> = {
  ES: "🇪🇸", PY: "🇵🇾",
};

const HOLIDAY_COUNTRIES: HolidayCountry[] = ["ES", "PY"];

function CountryPicker() {
  const { t } = useTranslation();
  const { country, setCountry } = useHolidayStore();

  return (
    <View style={lp.row}>
      {HOLIDAY_COUNTRIES.map((c, idx) => {
        const active = c === country;
        const isLast = idx === HOLIDAY_COUNTRIES.length - 1;
        return (
          <TouchableOpacity
            key={c}
            style={[lp.pill, active && lp.pillActive, !isLast && lp.pillBorder]}
            onPress={() => setCountry(c)}
            activeOpacity={0.7}
          >
            <Text style={lp.flag}>{COUNTRY_FLAGS[c]}</Text>
            <Text style={[lp.pillTxt, active && lp.pillTxtActive]}>
              {t(`settings.country.${c}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const { mascotName, setMascotName } = useMascotStore();
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(mascotName);
  const deviceTz    = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localHour   = getHours(toZonedTime(new Date(), deviceTz));
  const mascotState = getMascotState({ hourOfDay: localHour });

  const { hapticsEnabled, setHapticsEnabled } = useCelebrationSettings();

  const qc = useQueryClient();
  const { isConnecting, setConnecting } = useCalendarStore();
  const { data: calStatus } = useCalendarStatus();
  const syncMutation       = useSyncCalendar();
  const disconnectMutation = useDisconnectCalendar();

  function startEdit() {
    setDraft(mascotName);
    setEditing(true);
  }

  async function saveEdit() {
    const trimmed = draft.trim();
    if (!trimmed) {
      Alert.alert(t("settings.mascot.invalidName"), t("settings.mascot.invalidNameMsg"));
      return;
    }
    await setMascotName(trimmed);
    setEditing(false);
  }

  function cancelEdit() {
    setDraft(mascotName);
    setEditing(false);
  }

  async function handleConnectCalendar() {
    try {
      setConnecting(true);
      const redirectTo = Linking.createURL("calendar/connected");
      const url = await getCalendarConnectUrlApi(redirectTo, getGoogleRedirectUri());
      if (Platform.OS === "web") {
        window.location.href = url;
      } else {
        const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
        if (result.type === "success") qc.invalidateQueries({ queryKey: ["calendar-status"] });
        setConnecting(false);
      }
    } catch {
      Alert.alert(t("settings.calendar.errorTitle"), t("settings.calendar.connectError"));
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    if (Platform.OS === "web") {
      if (window.confirm(t("settings.calendar.disconnectMsg"))) {
        disconnectMutation.mutate();
      }
    } else {
      Alert.alert(
        t("settings.calendar.disconnectTitle"),
        t("settings.calendar.disconnectMsg"),
        [
          { text: t("common.cancel"), style: "cancel" },
          { text: t("settings.calendar.disconnectConfirm"), style: "destructive", onPress: () => disconnectMutation.mutate() },
        ],
      );
    }
  }

  function formatLastSync(iso: string | null | undefined): string {
    if (!iso) return "–";
    return new Date(iso).toLocaleString(undefined, {
      day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
    });
  }

  const isConnected = calStatus?.connected ?? false;

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.titleRow}>
          <Text style={s.screenTitle}>{t("settings.title")}</Text>
          <StreakPill />
        </View>

        {/* ── Tu tortuga ──────────────────────────────────────── */}
        <Text style={s.sectionLabel}>{t("settings.mascot.section")}</Text>
        <View style={s.card}>
          <View style={s.tugaBox}>
            <Mascot name={mascotName} mood={mascotState.mood} message="" size="small" showName />
          </View>

          <View style={s.cardDivider} />

          {editing ? (
            <View style={s.editBlock}>
              <TextInput
                style={s.input}
                value={draft}
                onChangeText={setDraft}
                placeholder={t("settings.mascot.namePlaceholder")}
                placeholderTextColor="#CCCCCC"
                maxLength={20}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={saveEdit}
              />
              <TouchableOpacity style={s.saveBtn} onPress={saveEdit} activeOpacity={0.8}>
                <Text style={s.saveBtnTxt}>{t("settings.mascot.saveBtn")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelLink} onPress={cancelEdit}>
                <Text style={s.cancelLinkTxt}>{t("settings.mascot.cancelBtn")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Row
              icon="pencil-outline"
              iconBg="#E8F5E9"
              iconColor="#4CAF50"
              label={t("settings.mascot.changeName")}
              onPress={startEdit}
              last
            />
          )}
        </View>

        {/* ── Google Calendar ─────────────────────────────────── */}
        <Text style={s.sectionLabel}>{t("settings.calendar.section")}</Text>
        <View style={s.card}>
          {isConnected ? (
            <>
              <View style={s.accountRow}>
                <View style={s.statusDotWrap}>
                  <View style={s.statusDot} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.accountEmailRow}>
                    <Text style={s.accountEmail}>{calStatus?.google_email}</Text>
                    <View style={s.connectedBadge}>
                      <Text style={s.connectedBadgeTxt}>{t("settings.calendar.connected")}</Text>
                    </View>
                  </View>
                  <Text style={s.accountMeta}>
                    {calStatus?.last_synced_at
                      ? `${t("settings.calendar.lastSync", { date: formatLastSync(calStatus.last_synced_at) })}${syncMutation.isSuccess ? `  ·  ${t("settings.calendar.imported", { count: syncMutation.data.synced })}` : ""}`
                      : t("settings.calendar.noSync")}
                  </Text>
                </View>
              </View>
              <View style={s.cardDivider} />
              <Row
                icon="refresh-outline"
                iconBg="#E3F2FD"
                iconColor="#1976D2"
                label={t("settings.calendar.sync")}
                onPress={() => syncMutation.mutate()}
                loading={syncMutation.isPending}
                disabled={syncMutation.isPending}
              />
              <Row
                icon="unlink-outline"
                iconBg="#FDECEC"
                label={t("settings.calendar.disconnect")}
                onPress={handleDisconnect}
                disabled={disconnectMutation.isPending}
                loading={disconnectMutation.isPending}
                destructive
                noChevron
                last
              />
            </>
          ) : (
            <>
              <Text style={s.calDesc}>{t("settings.calendar.description")}</Text>
              <View style={s.cardDivider} />
              <Row
                icon="calendar-outline"
                iconBg="#F3F3F3"
                iconColor="#1A1A1A"
                label={t("settings.calendar.connect")}
                onPress={handleConnectCalendar}
                loading={isConnecting}
                disabled={isConnecting}
                last
              />
            </>
          )}
        </View>

        {/* ── Idioma ──────────────────────────────────────────── */}
        <Text style={s.sectionLabel}>{t("settings.language.section")}</Text>
        <View style={s.card}>
          <LanguagePicker />
        </View>

        {/* ── País de festivos ────────────────────────────────── */}
        <Text style={s.sectionLabel}>{t("settings.country.section")}</Text>
        <View style={s.card}>
          <CountryPicker />
        </View>

        {/* ── Celebración ─────────────────────────────────────── */}
        <Text style={s.sectionLabel}>{t("settings.celebration.section")}</Text>
        <View style={s.card}>
          <View style={r.row}>
            <View style={[r.iconBox, { backgroundColor: "#FFF4E8" }]}>
              <Ionicons name="phone-portrait-outline" size={17} color="#C8553D" />
            </View>
            <View style={r.labelWrap}>
              <Text style={r.label}>{t("settings.celebration.haptics")}</Text>
              <Text style={r.sublabel}>{t("settings.celebration.hapticsHint")}</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: "#E0E0E0", true: "#C8553D" }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ── Sesión ──────────────────────────────────────────── */}
        <Text style={s.sectionLabel}>{t("settings.session.section")}</Text>
        <View style={s.card}>
          <Row
            icon="log-out-outline"
            iconBg="#FDECEC"
            label={t("settings.session.logout")}
            onPress={async () => {
              await logout();
              router.replace("/(auth)/login");
            }}
            destructive
            noChevron
            last
          />
        </View>

        {/* ── Acerca de ────────────────────────────────────── */}
        <Text style={s.sectionLabel}>{t("settings.about.section")}</Text>
        <View style={s.card}>
          <View style={s.aboutBlock}>
            <View style={s.aboutHeader}>
              <View style={s.aboutIconBox}>
                <Ionicons name="leaf-outline" size={18} color="#4A6FA5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.aboutTitle}>{t("settings.about.title")}</Text>
                <Text style={s.aboutTagline}>{t("settings.about.tagline")}</Text>
              </View>
            </View>
            <Text style={s.aboutDescription}>{t("settings.about.description", { mascotName })}</Text>
            <View style={s.creditsBlock}>
              <Text style={s.creditsTitle}>{t("settings.about.credits")}</Text>
              <Text style={s.creditsText}>{t("settings.about.creditsText")}</Text>
            </View>
            <Text style={s.aboutVersion}>{t("settings.about.version")} 1.0.0</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: "#F8F6F2" },
  scroll:      { flex: 1 },
  content:     { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 48 },

  titleRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 28 },
  screenTitle: { fontSize: 28, fontWeight: "800", color: "#1A1A1A", letterSpacing: -0.3 },

  sectionLabel: {
    fontSize: 11, fontWeight: "700", color: "#666666",
    textTransform: "uppercase", letterSpacing: 1.2,
    marginBottom: 10, marginLeft: 4, marginTop: 32,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  cardDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#EFEFEF" },

  tugaBox: { alignItems: "center", paddingTop: 20, paddingBottom: 12 },

  editBlock: { padding: 18, gap: 10 },
  input: {
    height: 48, borderRadius: 12,
    borderWidth: 1.5, borderColor: "#E0DDD8",
    paddingHorizontal: 14, fontSize: 16, color: "#1A1A1A",
    backgroundColor: "#FAFAFA",
  },
  saveBtn: {
    height: 46, borderRadius: 12,
    backgroundColor: "#4CAF50",
    alignItems: "center", justifyContent: "center",
  },
  saveBtnTxt:   { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
  cancelLink:   { alignItems: "center", paddingVertical: 4 },
  cancelLinkTxt:{ fontSize: 14, color: "#8A8A8A" },

  accountRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 18, paddingVertical: 14, gap: 12,
  },
  statusDotWrap:     { justifyContent: "center", marginTop: 2 },
  statusDot:         { width: 9, height: 9, borderRadius: 5, backgroundColor: "#4CAF50" },
  accountEmailRow:   { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  accountEmail:      { fontSize: 14, fontWeight: "600", color: "#1A1A1A", flexShrink: 1 },
  connectedBadge:    { backgroundColor: "#E8F5E9", borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  connectedBadgeTxt: { fontSize: 11, fontWeight: "600", color: "#388E3C" },
  accountMeta:       { fontSize: 12, color: "#8A8A8A", marginTop: 3 },
  calDesc: {
    fontSize: 14, color: "#6A6A6A", lineHeight: 20,
    padding: 18, paddingBottom: 14,
  },

  aboutBlock: { padding: 20, gap: 14 },
  aboutHeader: { flexDirection: "row", alignItems: "center", gap: 14 },
  aboutIconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "#EEF2FF",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  aboutTitle:       { fontSize: 15, fontWeight: "700", color: "#1A1A1A" },
  aboutTagline:     { fontSize: 12, color: "#8A8A8A", marginTop: 2 },
  aboutDescription: { fontSize: 14, color: "#4A4A4A", lineHeight: 22 },
  creditsBlock:     { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#EFEFEF", paddingTop: 12 },
  creditsTitle:     { fontSize: 12, fontWeight: "600", color: "#8A8A8A", marginBottom: 4 },
  creditsText:      { fontSize: 12, color: "#AAAAAA", lineHeight: 18 },
  aboutVersion:     { fontSize: 12, color: "#BBBBBB", textAlign: "right" },
});
