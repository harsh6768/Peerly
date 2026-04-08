import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { useEffect, useState } from 'react'
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { colors, fontSizes, fontWeights, radius, spacing } from '../constants/theme'

function toYyyyMmDd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseYyyyMmDd(s: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null
  const d = new Date(`${s}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

type Props = {
  value: string
  onChange: (yyyyMmDd: string) => void
  placeholder?: string
  minimumDate?: Date
  maximumDate?: Date
}

export function DatePickerField({ value, onChange, placeholder, minimumDate, maximumDate }: Props) {
  const [open, setOpen] = useState(false)
  const [tempDate, setTempDate] = useState(() => parseYyyyMmDd(value) ?? new Date())

  useEffect(() => {
    if (open) {
      setTempDate(parseYyyyMmDd(value) ?? new Date())
    }
  }, [open, value])

  function handleAndroidChange(event: DateTimePickerEvent, date?: Date) {
    setOpen(false)
    if (event.type === 'set' && date) {
      onChange(toYyyyMmDd(date))
    }
  }

  function confirmIos() {
    onChange(toYyyyMmDd(tempDate))
    setOpen(false)
  }

  return (
    <>
      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(true)} style={styles.touchWrap}>
        <TextInput
          editable={false}
          placeholder={placeholder ?? 'Select date'}
          placeholderTextColor={colors.textTertiary}
          pointerEvents="none"
          style={styles.input}
          value={value}
        />
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal animationType="fade" transparent visible={open} onRequestClose={() => setOpen(false)}>
          <View style={styles.backdrop}>
            <Pressable onPress={() => setOpen(false)} style={StyleSheet.absoluteFillObject} />
            <View style={styles.sheet}>
              <Text style={styles.sheetTitle}>Move-in date</Text>
              <DateTimePicker
                display="inline"
                maximumDate={maximumDate}
                minimumDate={minimumDate}
                mode="date"
                onChange={(_e, d) => {
                  if (d) setTempDate(d)
                }}
                style={styles.iosPicker}
                value={tempDate}
              />
              <View style={styles.sheetActions}>
                <TouchableOpacity onPress={() => setOpen(false)} style={styles.sheetBtnGhost}>
                  <Text style={styles.sheetBtnGhostText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={confirmIos} style={styles.sheetBtnPrimary}>
                  <Text style={styles.sheetBtnPrimaryText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : open ? (
        <DateTimePicker
          display="default"
          maximumDate={maximumDate}
          minimumDate={minimumDate}
          mode="date"
          onChange={handleAndroidChange}
          value={tempDate}
        />
      ) : null}
    </>
  )
}

const styles = StyleSheet.create({
  touchWrap: {},
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSizes.base,
    color: colors.textPrimary,
    backgroundColor: colors.white,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    zIndex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sheetTitle: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.sm,
  },
  iosPicker: { alignSelf: 'stretch' },
  sheetActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  sheetBtnGhost: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  sheetBtnGhostText: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.textSecondary },
  sheetBtnPrimary: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  sheetBtnPrimaryText: { fontSize: fontSizes.base, fontWeight: fontWeights.semibold, color: colors.white },
})
