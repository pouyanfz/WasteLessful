import type { Timestamp } from "firebase/firestore";

export type QuantityUnit =
  | "pieces"
  | "pack"
  | "box"
  | "can"
  | "%"
  | "slice"
  | string;

export interface ItemQuantity {
  current: number;
  initial: number;
  unit: QuantityUnit;
}

export interface ItemDates {
  addedAt: Timestamp;
  purchasedAt: Timestamp | null;
  expiresAt: Timestamp | null;
  lastUsedAt: Timestamp | null;
}

export interface ItemNotification {
  enabled: boolean;
  daysBeforeExp: number | null;
}

export interface Item {
  id: string;
  groupId: string;
  name: string;
  categories: string[];
  colorTag: string | null;
  photoURL: string | null;
  notes: string | null;
  quantity: ItemQuantity;
  dates: ItemDates;
  notification: ItemNotification;
  addedBy: string;
  updatedAt: Timestamp;
  isArchived: boolean;
  archivedAt: Timestamp | null;
}
