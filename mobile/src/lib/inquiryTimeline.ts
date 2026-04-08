import type { Inquiry } from './types'

export type InquiryTimelineEvent = {
  id: string
  at: string
  title: string
  subtitle?: string
}

function humanizeSystemMessage(body: string, perspective: 'requester' | 'owner'): string {
  const b = body.trim()
  if (/sent an inquiry for/i.test(b)) {
    return perspective === 'owner' ? 'Seeker sent an inquiry' : 'You sent an inquiry'
  }
  if (/marked this inquiry as contacted/i.test(b)) {
    return perspective === 'owner' ? 'You marked as contacted' : 'Host marked as contacted'
  }
  if (/The owner declined this inquiry/i.test(b)) {
    return perspective === 'owner' ? 'You declined this inquiry' : 'Host declined this inquiry'
  }
  if (/The owner closed this inquiry/i.test(b)) {
    return perspective === 'owner' ? 'You closed this inquiry' : 'Host closed this inquiry'
  }
  if (/Visit proposed for/i.test(b)) {
    return 'Visit proposed'
  }
  if (/seeker confirmed the visit/i.test(b)) {
    return 'Seeker confirmed the visit'
  }
  if (/cancelled the visit/i.test(b)) {
    return b.includes('owner') ? 'Host cancelled the visit' : 'Visit cancelled'
  }
  if (/marked the visit as completed/i.test(b)) {
    return perspective === 'owner' ? 'You marked the visit completed' : 'Host marked visit completed'
  }
  return b
}

/**
 * Builds a chronological progress timeline from inquiry timestamps + conversation system messages.
 */
export function buildInquiryTimeline(
  inquiry: Inquiry,
  perspective: 'requester' | 'owner',
): InquiryTimelineEvent[] {
  const events: InquiryTimelineEvent[] = [
    {
      id: 'created',
      at: inquiry.createdAt,
      title: perspective === 'owner' ? 'New inquiry received' : 'Inquiry sent',
      subtitle:
        perspective === 'owner'
          ? 'A seeker expressed interest in your listing.'
          : 'Your message was delivered to the host.',
    },
  ]

  const messages = inquiry.conversation?.messages ?? []
  const seen = new Set<string>()

  for (const m of messages) {
    if (m.messageType !== 'SYSTEM') continue
    if (/sent an inquiry for/i.test(m.body)) continue

    const label = humanizeSystemMessage(m.body, perspective)
    const key = `${m.createdAt}-${label}`
    if (seen.has(key)) continue
    seen.add(key)

    events.push({
      id: m.id,
      at: m.createdAt,
      title: label,
      subtitle: m.body.length > 120 ? undefined : m.body,
    })
  }

  if (
    inquiry.scheduledVisitAt &&
    inquiry.status === 'SCHEDULED' &&
    !events.some((e) => /visit proposed/i.test(e.title))
  ) {
    events.push({
      id: 'scheduled-visit',
      at: inquiry.scheduledVisitAt,
      title: 'Visit proposed',
      subtitle: inquiry.scheduledVisitNote ?? undefined,
    })
  }

  events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())

  const status = inquiry.status
  const last = events[events.length - 1]
  const lastTime = last ? new Date(last.at).getTime() : 0
  const updated = new Date(inquiry.updatedAt).getTime()

  const hasTerminalEvent = events.some(
    (e) =>
      /declin/i.test(e.title) ||
      /closed/i.test(e.title) ||
      /declined/i.test(e.subtitle ?? ''),
  )

  const needsTerminal =
    (status === 'DECLINED' || status === 'CLOSED') && !hasTerminalEvent

  if (needsTerminal && updated > lastTime) {
    events.push({
      id: `status-${status}`,
      at: inquiry.updatedAt,
      title: status === 'DECLINED' ? 'Declined' : 'Closed',
      subtitle:
        status === 'DECLINED'
          ? perspective === 'owner'
            ? 'You declined this inquiry.'
            : 'The host declined this inquiry.'
          : perspective === 'owner'
            ? 'You closed this inquiry.'
            : 'The host closed this inquiry.',
    })
  }

  return events
}

export function formatTimelineDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export function formatTimelineDay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

/** Compact line for inquiry list rows (seeker + host). */
export function formatInquiryActivitySummary(
  inquiry: Inquiry,
  perspective: 'requester' | 'owner',
): string {
  const events = buildInquiryTimeline(inquiry, perspective)
  if (events.length === 0) return ''
  const first = events[0]
  const last = events[events.length - 1]
  if (events.length === 1) {
    return `${formatTimelineDay(first.at)} · ${first.title}`
  }
  if (first.at === last.at && first.title === last.title) {
    return `${formatTimelineDay(first.at)} · ${first.title}`
  }
  return `${formatTimelineDay(first.at)} · ${first.title} → ${formatTimelineDay(last.at)} · ${last.title}`
}
