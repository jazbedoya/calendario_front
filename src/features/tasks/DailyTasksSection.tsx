import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View, Animated } from "react-native";
import { useTranslation } from "react-i18next";

import { useQueryClient } from "@tanstack/react-query";
import { useGetTodayTasks, useGetYesterdayPending, useCreateTask, useToggleTask, useDeleteTask, useGetStreak } from "./hooks";
import { TaskRow }              from "./TaskRow";
import { AddTask }              from "./AddTask";
import { CelebrationOverlay }   from "./CelebrationOverlay";
import { useTodayDate }         from "./hooks";
import type { MascotMood }      from "@/features/mascot/getMascotState";
import { colors, spacing, radius, fontSize, fontWeight, shadows } from "@/theme";

function TaskSkeleton() {
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={s.list}>
      {[0.75, 0.55, 0.65].map((w, i) => (
        <View key={i} style={[s.skeletonRow, i > 0 && s.skeletonBorder]}>
          <Animated.View style={[s.skeletonCircle, { opacity }]} />
          <Animated.View style={[s.skeletonLine, { opacity, width: `${w * 100}%` as any }]} />
        </View>
      ))}
    </View>
  );
}

function useProgressMessage(t: ReturnType<typeof useTranslation>['t']) {
  return (done: number, total: number): { msg: string; mood: MascotMood } => {
    if (total === 0)         return { msg: t('tasks.progress.empty'),                              mood: "balanced"    };
    if (done === 0)          return { msg: t('tasks.progress.start'),                              mood: "happy"       };
    if (done === total)      return { msg: t('tasks.progress.done'),                               mood: "excited"     };
    if (done / total < 0.5) return { msg: t('tasks.progress.half',    { done, total }),            mood: "happy"       };
    return                         { msg: t('tasks.progress.mostDone', { done, total }),           mood: "encouraging" };
  };
}

interface DailyTasksSectionProps {
  onInputFocus?: () => void;
}

export function DailyTasksSection({ onInputFocus }: DailyTasksSectionProps) {
  const { t } = useTranslation();
  const progressMessage = useProgressMessage(t);
  const todayStr = useTodayDate();

  const { data: tasks = [], isLoading }    = useGetTodayTasks();
  const { data: yesterdayPending = [] }    = useGetYesterdayPending();

  const { mutate: create } = useCreateTask();
  const { mutate: toggle } = useToggleTask();
  const { mutate: remove } = useDeleteTask();
  const { data: streakData, refetch: refetchStreak } = useGetStreak();
  const qc = useQueryClient();

  const done  = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct   = total > 0 ? done / total : 0;

  const { msg, mood } = useMemo(() => progressMessage(done, total), [done, total]);

  // ── Celebración al completar todas ───────────────────────────────────────
  const [celebrating, setCelebrating] = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const prevDone    = useRef(done);
  const prevTotal   = useRef(total);
  const alreadyFired = useRef(false);
  const [addedFromYesterday, setAddedFromYesterday] = useState<string[]>([]);

  useEffect(() => {
    const justFinished =
      done > 0 &&
      done === total &&
      (done > prevDone.current || total !== prevTotal.current) &&
      !alreadyFired.current;

    if (justFinished) {
      alreadyFired.current = true;
      setCelebrating(true);
      refetchStreak().finally(() => setShowModal(true));
    }

    if (done < total && done < prevDone.current) {
      alreadyFired.current = false;
    }

    prevDone.current  = done;
    prevTotal.current = total;
  }, [done, total]);

  function handleCloseModal() {
    setShowModal(false);
  }

  return (
    <>
      <View style={[s.card, shadows.card]}>
        {/* Title + subtitle */}
        <Text style={s.title}>{t('tasks.sectionTitle')}</Text>
        {!isLoading && <Text style={s.subtitle}>{msg}</Text>}

        {/* Progress bar */}
        <View style={s.progressTrack}>
          <View style={[s.progressFill, { width: `${Math.max(pct * 100, 2)}%` }]} />
        </View>

        {/* Progress label */}
        {total > 0 && (
          <View style={s.progressRow}>
            <Text style={s.progressLabel}>{t('tasks.progressLabel')}</Text>
            <Text style={s.progressCount}>
              {t('tasks.counter', { done, total, count: total })}
            </Text>
          </View>
        )}

        {/* Skeleton mientras carga */}
        {isLoading && <TaskSkeleton />}

        {/* Lista */}
        {!isLoading && tasks.length > 0 && (
          <View style={s.list}>
            {tasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                accent={colors.terracotta}
                onToggle={() => toggle({ id: task.id, done: !task.done })}
                onDelete={() => remove(task.id)}
                isLast={i === tasks.length - 1}
              />
            ))}
          </View>
        )}

        {/* Sugerencias de ayer */}
        {tasks.length === 0 && !isLoading && yesterdayPending
          .filter((yt) => !addedFromYesterday.includes(yt.id))
          .map((yt) => (
            <View key={yt.id} style={s.yesterdayRow}>
              <Text style={s.yesterdayText} numberOfLines={2}>
                {t('tasks.yesterday.pending')} <Text style={s.yesterdayTask}>{yt.text}</Text>
              </Text>
              <TouchableOpacity
                style={s.yesterdayBtn}
                activeOpacity={0.75}
                onPress={() => {
                  create(yt.text);
                  setAddedFromYesterday((prev) => [...prev, yt.id]);
                }}
              >
                <Text style={s.yesterdayBtnText}>{t('tasks.yesterday.add')}</Text>
              </TouchableOpacity>
            </View>
          ))
        }

        {/* Añadir tarea */}
        <AddTask
          accent={colors.terracotta}
          onAdd={(text) => create(text)}
          onFocus={onInputFocus}
        />
      </View>

      <CelebrationOverlay
        visible={showModal}
        streak={streakData?.current_streak ?? 1}
        onClose={handleCloseModal}
      />
    </>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    color: colors.ink,
  },
  subtitle: {
    fontSize: fontSize.bodySm,
    color: colors.textMuted,
    marginTop: -4,
  },

  // Progress bar
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceWarm,
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.terracotta,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLabel: {
    fontSize: fontSize.eyebrow,
    fontWeight: fontWeight.semibold,
    color: colors.textFaint,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  progressCount: {
    fontSize: fontSize.bodySm,
    fontWeight: fontWeight.semibold,
    color: colors.ink,
  },

  // List
  list: {
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.bg,
  },

  // Yesterday suggestions
  yesterdayRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceWarm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 10,
  },
  yesterdayText: { flex: 1, fontSize: fontSize.label, color: colors.textMuted, lineHeight: 18 },
  yesterdayTask: { color: colors.textSecondary, fontWeight: fontWeight.semibold },
  yesterdayBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    backgroundColor: colors.terracottaTint,
  },
  yesterdayBtnText: { fontSize: fontSize.label, fontWeight: fontWeight.bold, color: colors.terracotta },

  // Skeleton
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: colors.bg,
  },
  skeletonBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  skeletonCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.surfaceWarm2,
  },
  skeletonLine: {
    height: 13, borderRadius: 6,
    backgroundColor: colors.surfaceWarm2,
  },
});
