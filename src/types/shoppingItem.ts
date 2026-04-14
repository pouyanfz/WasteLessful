import type { Timestamp } from "firebase/firestore";

export interface ShoppingItemQuantity {
  amount: number;
  unit: string;
}

export type ShoppingItemStatus = "toBuy" | "bought";

export interface ShoppingItem {
  id: string;
  groupId: string;
  name: string;
  quantity: ShoppingItemQuantity;
  linkedRecipeId: string | null;
  linkedItemId: string | null;
  linkedItemName: string | null;
  status: ShoppingItemStatus;
  autoAdded: boolean;
  addedBy: string;
  boughtBy: string | null;
  addedAt: Timestamp;
  boughtAt: Timestamp | null;
  updatedAt: Timestamp;
}
