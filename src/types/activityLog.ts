import type { Timestamp } from 'firebase/firestore'

export type ActivityAction =
  | 'added'
  | 'reduced'
  | 'deleted'
  | 'expired'
  | 'restocked'
  | 'archived'

export interface ActivityLog {
  id: string
  groupId: string
  itemId: string | null
  itemName: string
  action: ActivityAction
  quantityDelta: number | null
  unit: string | null
  unitPrice: number | null
  performedBy: string
  timestamp: Timestamp
}
