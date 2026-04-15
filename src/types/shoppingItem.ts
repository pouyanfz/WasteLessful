import type { Timestamp } from "firebase/firestore";

export interface ShoppingItemQuantity {
  amount: number;
  unit: string;
}

export type ShoppingItemStatus = "toBuy" | "bought";

export interface ShoppingList {
  id: string;
  name: string;
}

export interface ShoppingItem {
  id: string;
  groupId: string | null; // inventory group link (for auto-add, restock)
  shoppingListId: string | null; // custom shopping list (mutually exclusive with groupId usage)
  name: string;
  quantity: ShoppingItemQuantity;
  linkedRecipeId: string | null;
  linkedItemId: string | null;
  linkedItemName: string | null;
  status: ShoppingItemStatus;
  autoAdded: boolean;
  addedToInventory: boolean;
  addedBy: string;
  boughtBy: string | null;
  addedAt: Timestamp;
  boughtAt: Timestamp | null;
  updatedAt: Timestamp;
}
