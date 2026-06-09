/**
 * TodayPath — camino horizontal donde Tuga avanza al completar tareas.
 * Al llegar a la meta: la bandera explota de alegría.
 * El mensaje de celebración lo gestiona CelebrationOverlay (modal).
 */
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import type { MascotMood } from "@/features/mascot/getMascotState";
import { TugaAnimation } from "@/features/mascot/TugaAnimation";

interface Props {
  progress: number;   // 0–1
  mood: MascotMood;
  celebrate?: boolean;
  onCelebrationEnd?: () => void;
}

const TURTLE_W = 48;
const FLAG_W   = 32;

export function TodayPath({ progress, celebrate = false, onCelebrationEnd }: Props) {
  const translateX    = useRef(new Animated.Value(0)).current;
  const pathWidth     = useRef(0);
  const flagScale     = useRef(new Animated.Value(1)).current;
  const flagRotation  = useRef(new Animated.Value(0)).current;
  const prevCelebrate = useRef(false);

  // Turtle travel
  useEffect(() => {
    if (pathWidth.current === 0) return;
    const travel = Math.max(0, pathWidth.current - TURTLE_W - FLAG_W);
    Animated.spring(translateX, {
      toValue: progress * travel,
      tension: 55,
      friction: 9,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  // Flag explosion on celebrate trigger
  useEffect(() => {
    if (celebrate && !prevCelebrate.current) {
      Animated.sequence([
        Animated.spring(flagScale, { toValue: 2.0, tension: 300, friction: 4, useNativeDriver: true }),
        Animated.parallel([
          Animated.spring(flagScale, { toValue: 1.25, tension: 80, friction: 6, useNativeDriver: true }),
          Animated.sequence([
            Animated.timing(flagRotation, { toValue:  1,   duration: 90,  useNativeDriver: true }),
            Animated.timing(flagRotation, { toValue: -1,   duration: 110, useNativeDriver: true }),
            Animated.timing(flagRotation, { toValue:  0.5, duration: 80,  useNativeDriver: true }),
            Animated.timing(flagRotation, { toValue:  0,   duration: 80,  useNativeDriver: true }),
          ]),
        ]),
      ]).start();
    }

    if (!celebrate && prevCelebrate.current && progress < 1) {
      Animated.spring(flagScale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }).start();
    }

    prevCelebrate.current = celebrate;
  }, [celebrate, progress]);

  const tugaState  = celebrate ? "celebrating" : "walking";
  const flagRotate = flagRotation.interpolate({ inputRange: [-1, 1], outputRange: ["-25deg", "25deg"] });

  return (
    <View style={p.track}>
      <View style={p.ground} />

      <View
        style={p.pathRow}
        onLayout={(e) => {
          pathWidth.current = e.nativeEvent.layout.width;
          const travel = Math.max(0, pathWidth.current - TURTLE_W - FLAG_W);
          translateX.setValue(progress * travel);
        }}
      >
        <Animated.View style={[p.turtleSlot, { transform: [{ translateX }] }]}>
          <TugaAnimation
            state={tugaState}
            loop={!celebrate}
            style={{ width: 48, height: 48 }}
            onFinish={celebrate ? onCelebrationEnd : undefined}
          />
        </Animated.View>

        <Animated.View style={[p.flagSlot, { transform: [{ scale: flagScale }, { rotate: flagRotate }] }]}>
          <Text style={p.flag}>🏁</Text>
        </Animated.View>
      </View>

      <View style={[p.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
    </View>
  );
}

const p = StyleSheet.create({
  track:        { height: 68, justifyContent: "flex-end", marginVertical: 4 },
  ground:       { position: "absolute", bottom: 8, left: 0, right: 0, height: 5, backgroundColor: "#EDE9E5", borderRadius: 3 },
  progressFill: { position: "absolute", bottom: 8, left: 0, height: 5, backgroundColor: "#A0432B", borderRadius: 3 },
  pathRow:      { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 13, position: "relative" },
  turtleSlot:   { position: "absolute", bottom: 13, left: 0 },
  flagSlot:     { marginLeft: "auto" },
  flag:         { fontSize: 22 },
});
