import type { Timestamp } from "firebase/firestore";

export interface RecipeIngredient {
  name: string;
  quantityAmount: number | null;
  quantityUnit: string | null;
  linkedItemId: string | null;
  shoppingItemId: string | null;
}

export interface Recipe {
  id: string;
  groupId: string;
  name: string;
  notes: string | null;
  ingredients: RecipeIngredient[];
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
