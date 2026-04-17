import type { User } from "../types";
import { daysAgo } from "./mockTimestamp";

// Cast needed because mock timestamps don't implement full Firestore Timestamp
export const mockUsers: User[] = [
  {
    uid: "user-1",
    displayName: "Alice",
    email: "alice@example.com",
    isAnonymous: false,
    photoURL: null,
    groupIds: ["group-1", "group-2"],
    activeGroupId: "group-1",
    groupNicknames: {},
    createdAt: daysAgo(30) as never,
    updatedAt: daysAgo(1) as never,
    settings: {
      theme: "system",
      notifyDaysBeforeExpiry: 3,
      notifyOnExpired: true,
      notifyOnLowQuantity: true,
      lowQuantityThreshold: 25,
      notifyUnusedAfterDays: 14,
      weeklyReport: false,
      autoAddToShoppingListOnExpiry: true,
      autoAddToShoppingListOnLowQuantity: false,
      getGroupNotifications: true,
      archiveRetentionDays: null,
      archiveMaxItems: null,
    },
  },
  {
    uid: "user-2",
    displayName: "Bob",
    email: null,
    isAnonymous: true,
    photoURL: null,
    groupIds: ["group-1"],
    activeGroupId: "group-1",
    groupNicknames: {},
    createdAt: daysAgo(5) as never,
    updatedAt: daysAgo(5) as never,
    settings: {
      theme: "light",
      notifyDaysBeforeExpiry: 7,
      notifyOnExpired: true,
      notifyOnLowQuantity: false,
      lowQuantityThreshold: 20,
      notifyUnusedAfterDays: null,
      weeklyReport: false,
      autoAddToShoppingListOnExpiry: false,
      autoAddToShoppingListOnLowQuantity: false,
      getGroupNotifications: false,
      archiveRetentionDays: 30,
      archiveMaxItems: 50,
    },
  },
];

export const mockUser = mockUsers[0];
