/**
 * TugaAnimation — Lottie wrapper para la mascota Tuga.
 *
 * Para sustituir un placeholder por la animación final de Tuga,
 * cambia SOLO el require() de ese estado en ANIMATIONS.
 *
 * Estados disponibles:
 *   idle        — loop suave (mood: happy, balanced)
 *   celebrating — one-shot al completar objetivos (mood: excited)
 *   encouraging — loop con bote (mood: encouraging)
 *   sleeping    — loop lento (mood: sleepy)
 *   walking     — loop para el camino de Tareas de Hoy
 */
import LottieView from "lottie-react-native";
import type { AnimationObject } from "lottie-react-native";
import type { CSSProperties } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import type { MascotMood } from "./getMascotState";

export type TugaState =
  | "idle"
  | "celebrating"
  | "encouraging"
  | "sleeping"
  | "walking";

// ── Mapa estado → archivo Lottie ──────────────────────────────────────────
// Para reemplazar una animación: cambia solo el require() de esa línea.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ANIMATIONS: Record<TugaState, AnimationObject> = {
  idle:        require("../../../assets/lottie/tuga-idle.json"),
  celebrating: require("../../../assets/lottie/tuga-celebrating.json"),
  encouraging: require("../../../assets/lottie/tuga-encouraging.json"),
  sleeping:    require("../../../assets/lottie/tuga-sleeping.json"),
  walking:     require("../../../assets/lottie/tuga-walking.json"),
};

// ── Velocidad de reproducción por estado ─────────────────────────────────
const SPEED: Record<TugaState, number> = {
  idle:        0.8,
  celebrating: 1.4,
  encouraging: 1.0,
  sleeping:    0.5,
  walking:     1.0,
};

// ── Mood → estado por defecto ─────────────────────────────────────────────
export const MOOD_TO_STATE: Record<MascotMood, TugaState> = {
  happy:       "idle",
  excited:     "celebrating",
  sleepy:      "sleeping",
  encouraging: "encouraging",
  balanced:    "idle",
};

// ─────────────────────────────────────────────────────────────────────────

interface Props {
  state: TugaState;
  /** Dimensión cuadrada. Usa `style` para dimensiones no cuadradas. */
  size?: number;
  /** Sobreescribe width/height para dimensiones no cuadradas (ej. camino). */
  style?: StyleProp<ViewStyle>;
  /** true = loop infinito (default). false = reproduce una vez y llama onFinish. */
  loop?: boolean;
  /** Llamado al terminar una animación no-loop. */
  onFinish?: () => void;
}

export function TugaAnimation({ state, size = 120, style, loop = true, onFinish }: Props) {
  // On native: `style` controls dimensions.
  // On web: LottieView ignores `style` and uses only `webStyle` (DotLottieReact).
  // Both must be set to the same dimensions so the canvas doesn't expand freely.
  const flatStyle = style ? (style as ViewStyle) : null;
  const webStyle: CSSProperties = {
    width:  typeof flatStyle?.width  === "number" ? flatStyle.width  : size,
    height: typeof flatStyle?.height === "number" ? flatStyle.height : size,
  };

  return (
    <LottieView
      key={state}
      source={ANIMATIONS[state]}
      autoPlay
      loop={loop}
      speed={SPEED[state]}
      // eslint-disable-next-line react-native/no-inline-styles
      style={[{ width: size, height: size }, style]}
      webStyle={webStyle}
      onAnimationFinish={() => {
        if (!loop) onFinish?.();
      }}
      resizeMode="contain"
    />
  );
}
