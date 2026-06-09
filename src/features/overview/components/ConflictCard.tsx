import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { LAYER_COLORS, LAYER_LABELS, type Conflict } from '../types';

interface ConflictCardProps {
  conflict: Conflict;
  timezone: string;
  onResolve: (conflict: Conflict) => void;
}

export function ConflictCard({ conflict, timezone, onResolve }: ConflictCardProps) {
  const { type, eventA, eventB, marginMinutes } = conflict;

  const endTimeA   = formatInTimeZone(parseISO(eventA.endAt),   timezone, 'HH:mm');
  const startTimeB = formatInTimeZone(parseISO(eventB.startAt), timezone, 'HH:mm');

  const typeLabel =
    type === 'overlap' ? 'Solapamiento' : 'Margen ajustado';

  const marginText =
    type === 'overlap'
      ? `Se solapan ${Math.abs(marginMinutes)} min`
      : `Margen: ${marginMinutes} min`;

  return (
    <View style={styles.card}>
      {/* Cabecera */}
      <View style={styles.header}>
        <Ionicons name="warning" size={15} color="#D97706" />
        <Text style={styles.headerText} numberOfLines={1}>
          {typeLabel}
          {'  '}
          <Text style={[styles.layerTag, { color: LAYER_COLORS[conflict.layers[0]] }]}>
            {LAYER_LABELS[conflict.layers[0]]}
          </Text>
          <Text style={styles.vs}>{' vs '}</Text>
          <Text style={[styles.layerTag, { color: LAYER_COLORS[conflict.layers[1]] }]}>
            {LAYER_LABELS[conflict.layers[1]]}
          </Text>
        </Text>
      </View>

      {/* Detalle de eventos */}
      <Text style={styles.detail}>
        <Text style={styles.quote}>"{eventA.title}"</Text>
        {' acaba '}
        <Text style={styles.time}>{endTimeA}</Text>
      </Text>
      <Text style={styles.detail}>
        <Text style={styles.quote}>"{eventB.title}"</Text>
        {' empieza '}
        <Text style={styles.time}>{startTimeB}</Text>
      </Text>

      {/* Pie: margen + botón */}
      <View style={styles.footer}>
        <Text style={styles.marginText}>{marginText}</Text>
        <TouchableOpacity
          style={styles.resolveBtn}
          onPress={() => onResolve(conflict)}
          activeOpacity={0.8}
        >
          <Text style={styles.resolveTxt}>Resolver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    marginBottom: 8,
    gap: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
    flex: 1,
  },
  layerTag: {
    fontWeight: '700',
  },
  vs: {
    color: '#92400E',
    fontWeight: '400',
  },
  detail: {
    fontSize: 13,
    color: '#78350F',
    marginLeft: 21,
  },
  quote: {
    fontStyle: 'italic',
  },
  time: {
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 21,
  },
  marginText: {
    fontSize: 12,
    color: '#92400E',
    fontStyle: 'italic',
  },
  resolveBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 8,
  },
  resolveTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
