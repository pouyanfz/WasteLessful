import { Timestamp } from 'firebase/firestore'

export const nowTimestamp = (): Timestamp => Timestamp.now()
export const dateToTimestamp = (date: Date): Timestamp =>
  Timestamp.fromDate(date)
export const dateStringToTimestamp = (s: string): Timestamp =>
  Timestamp.fromDate(new Date(s))
