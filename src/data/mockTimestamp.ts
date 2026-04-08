// Lightweight Firestore Timestamp shim for mock data and tests.
// Real Timestamp is only available when Firebase is initialised.
export function makeTimestamp(date: Date) {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: 0,
  }
}

export function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(0, 0, 0, 0)
  return makeTimestamp(d)
}

export function daysAgo(n: number) {
  return daysFromNow(-n)
}
