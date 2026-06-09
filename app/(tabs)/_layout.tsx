import { Tabs } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Keyboard } from "react-native";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  index:    "home",
  layers:   "layers",
  stats:    "bar-chart",
  settings: "settings",
};

const ICON_OUTLINE_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  index:    "home-outline",
  layers:   "layers-outline",
  stats:    "bar-chart-outline",
  settings: "settings-outline",
};

const LABEL_KEY_MAP: Record<string, string> = {
  index:    "tabs.home",
  layers:   "tabs.all",
  stats:    "tabs.balance",
  settings: "tabs.settings",
};

const ACTIVE_COLOR   = "#C8553D";
const INACTIVE_COLOR = "#9A9A9A";

const MAIN_TABS = ["index", "layers", "stats", "settings"];

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { t } = useTranslation();
  const visibleRoutes = state.routes.filter((r) => MAIN_TABS.includes(r.name));
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  if (keyboardVisible) return null;

  return (
    <View style={styles.barWrapper}>
      <View style={styles.bar}>
        {visibleRoutes.map((route) => {
          const index = state.routes.indexOf(route);
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const iconName  = ICON_MAP[route.name] ?? "ellipse";
          const label     = LABEL_KEY_MAP[route.name] ? t(LABEL_KEY_MAP[route.name]) : route.name;

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              {isFocused ? (
                <View style={styles.activeCircle}>
                  <Ionicons name={iconName} size={18} color="#FFFFFF" />
                </View>
              ) : (
                <Ionicons
                  name={ICON_OUTLINE_MAP[route.name] ?? "ellipse-outline"}
                  size={20}
                  color={INACTIVE_COLOR}
                />
              )}
              <Text style={[styles.label, isFocused && styles.labelActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index"    options={{ title: "Inicio" }} />
      <Tabs.Screen name="layers"   options={{ title: "Vistas" }} />
      <Tabs.Screen name="stats"    options={{ title: "Estadísticas" }} />
      <Tabs.Screen name="settings" options={{ title: "Ajustes" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  barWrapper: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 28 : 20,
    left: 24,
    right: 24,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
    width: "100%",
    justifyContent: "space-around",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingVertical: 4,
  },
  activeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ACTIVE_COLOR,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: INACTIVE_COLOR,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: ACTIVE_COLOR,
  },
});
