import { getDay, startOfWeek, subWeeks, endOfWeek, isWithinInterval } from 'date-fns'
import { AvailabilityPeriod, Member, Role, Schedule } from '@/types'

const MORNING_CUTOFF_HOUR = 12

/** Mirrors the Manha/Noite split members declare in their weekly availability. */
export function periodForTime(time: string): AvailabilityPeriod {
  const hour = Number(time.split(':')[0])
  return hour < MORNING_CUTOFF_HOUR ? 'Manha' : 'Noite'
}

/** Every member who served (any role) in the calendar week immediately before `date`'s week. */
function membersServedWeekBefore(date: Date, schedules: Schedule[]): Set<string> {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 })
  const prevWeekStart = subWeeks(weekStart, 1)
  const prevWeekEnd = endOfWeek(prevWeekStart, { weekStartsOn: 0 })

  const served = new Set<string>()
  for (const s of schedules) {
    if (!isWithinInterval(new Date(s.date), { start: prevWeekStart, end: prevWeekEnd })) continue
    for (const a of s.assignments) {
      if (a.memberId) served.add(a.memberId)
    }
    if (s.leitor1) served.add(s.leitor1)
    if (s.leitor2) served.add(s.leitor2)
  }
  return served
}

/** Timestamp of the member's most recent assignment across all schedules, or -Infinity if never served. */
function lastServedAt(memberId: string, schedules: Schedule[]): number {
  let latest = -Infinity
  for (const s of schedules) {
    const served =
      s.assignments.some((a) => a.memberId === memberId) || s.leitor1 === memberId || s.leitor2 === memberId
    if (served) latest = Math.max(latest, new Date(s.date).getTime())
  }
  return latest
}

/** Whoever went longest without serving (or never served) goes first, so assignments rotate. */
function pickFairest(candidates: Member[], schedules: Schedule[]): Member | undefined {
  return [...candidates].sort((a, b) => {
    const diff = lastServedAt(a.id, schedules) - lastServedAt(b.id, schedules)
    return diff !== 0 ? diff : a.name.localeCompare(b.name)
  })[0]
}

export interface AutoFillSlot {
  key: string
  roleId: string
  currentMemberId: string | null
}

export interface AutoFillResult {
  suggestions: Record<string, string>
  unfilled: string[]
}

/**
 * Suggests a member for every vacant slot, respecting: role eligibility, weekly
 * availability (day + period), and the no-two-consecutive-weeks rule (per member,
 * across any role). Already-filled slots are left untouched but still block their
 * member from being suggested twice in the same schedule.
 */
export function autoFillSchedule({
  date,
  time,
  slots,
  roles,
  members,
  schedules,
}: {
  date: Date
  time: string
  slots: AutoFillSlot[]
  roles: Role[]
  members: Member[]
  schedules: Schedule[]
}): AutoFillResult {
  const dayOfWeek = getDay(date)
  const period = periodForTime(time)
  const excludedByConsecutiveWeek = membersServedWeekBefore(date, schedules)

  const usedInThisSchedule = new Set(
    slots.filter((s) => s.currentMemberId).map((s) => s.currentMemberId as string),
  )

  const vacantWithCandidates = slots
    .filter((s) => !s.currentMemberId)
    .map((slot) => {
      const role = roles.find((r) => r.id === slot.roleId)
      const eligible = role
        ? members.filter(
            (m) =>
              m.roleIds.includes(role.id) &&
              m.status === 'Ativo' &&
              m.approvalStatus === 'Aprovado' &&
              m.availabilitySlots.some((a) => a.dayOfWeek === dayOfWeek && a.period === period) &&
              !excludedByConsecutiveWeek.has(m.id),
          )
        : []
      return { slot, eligible }
    })
    // Fill the scarcest slots first, so a role with only one possible member isn't left
    // empty because a more flexible role's fairness pick happened to take that member first.
    .sort((a, b) => a.eligible.length - b.eligible.length)

  const suggestions: Record<string, string> = {}
  const unfilled: string[] = []

  for (const { slot, eligible } of vacantWithCandidates) {
    const candidates = eligible.filter((m) => !usedInThisSchedule.has(m.id))
    const picked = pickFairest(candidates, schedules)
    if (picked) {
      suggestions[slot.key] = picked.id
      usedInThisSchedule.add(picked.id)
    } else {
      unfilled.push(slot.key)
    }
  }

  return { suggestions, unfilled }
}
