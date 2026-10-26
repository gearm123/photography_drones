export const reviewFilters = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
] as const

export const profileFilters = [
  { value: 'suspended', label: 'Suspended' },
  { value: 'deactivated', label: 'Deactivated' },
] as const

export type PhotographerStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'deactivated'
export type ProfileAction = 'approve' | 'reject' | 'suspend' | 'deactivate' | 'restore'

const transitions: Record<ProfileAction, { from: PhotographerStatus[]; to: PhotographerStatus }> = {
  approve: { from: ['pending', 'rejected'], to: 'approved' },
  reject: { from: ['pending'], to: 'rejected' },
  suspend: { from: ['approved'], to: 'suspended' },
  deactivate: { from: ['approved', 'suspended'], to: 'deactivated' },
  restore: { from: ['suspended', 'deactivated'], to: 'approved' },
}

export function isPhotographerStatus(value: string): value is PhotographerStatus {
  return (
    value === 'pending' ||
    value === 'approved' ||
    value === 'rejected' ||
    value === 'suspended' ||
    value === 'deactivated'
  )
}

export function statusAfter(action: string, current: string): PhotographerStatus | null {
  if (!(action in transitions)) return null
  const rule = transitions[action as ProfileAction]
  if (!isPhotographerStatus(current) || !rule.from.includes(current)) return null
  return rule.to
}

export function statusLabel(value: string): string {
  if (value === 'pending') return 'Pending'
  if (value === 'approved') return 'Approved'
  if (value === 'rejected') return 'Rejected'
  if (value === 'suspended') return 'Suspended'
  if (value === 'deactivated') return 'Deactivated'
  return 'Pending'
}
