import { CalendarDays } from 'lucide-react'
import { useRef } from 'react'

type Props = {
  id?: string
  value: string
  min?: string
  max?: string
  onChange: (value: string) => void
  className?: string
}

/**
 * Native date input with a visible calendar control so users reliably get the browser date picker.
 */
export function DatePickerInput({ id, value, min, max, onChange, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  function openCalendar() {
    const el = inputRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') {
      void el.showPicker()
    } else {
      el.focus()
      el.click()
    }
  }

  return (
    <div className={`date-picker-field${className ? ` ${className}` : ''}`}>
      <button
        type="button"
        className="date-picker-field-btn"
        onClick={openCalendar}
        aria-label="Open calendar"
      >
        <CalendarDays size={18} strokeWidth={2} />
      </button>
      <input
        ref={inputRef}
        className="date-picker-field-input"
        id={id}
        max={max}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        type="date"
        value={value}
      />
    </div>
  )
}
