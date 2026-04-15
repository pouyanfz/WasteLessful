import type { Recipe } from "../types";
import { daysAgo } from "./mockTimestamp";

export const mockRecipes: Recipe[] = [
  {
    id: "recipe-1",
    groupId: "group-1",
    name: "Ghormeh Sabzi",
    notes: "Traditional Persian herb stew. Serve with saffron rice.",
    ingredients: [
      {
        name: "Lamb",
        quantityAmount: 500,
        quantityUnit: "g",
        linkedItemId: null,
        shoppingItemId: null,
        haveIt: false,
      },
      {
        name: "Kidney Beans",
        quantityAmount: 1,
        quantityUnit: "can",
        linkedItemId: null,
        shoppingItemId: null,
        haveIt: false,
      },
      {
        name: "Dried Fenugreek",
        quantityAmount: 2,
        quantityUnit: "pack",
        linkedItemId: null,
        shoppingItemId: null,
        haveIt: false,
      },
      {
        name: "Onion",
        quantityAmount: 2,
        quantityUnit: "piece",
        linkedItemId: null,
        shoppingItemId: null,
        haveIt: false,
      },
    ],
    createdBy: "user-1",
    createdAt: daysAgo(5) as never,
    updatedAt: daysAgo(5) as never,
  },
  {
    id: "recipe-2",
    groupId: "group-1",
    name: "Omelette",
    notes: null,
    ingredients: [
      {
        name: "Eggs",
        quantityAmount: 3,
        quantityUnit: "piece",
        linkedItemId: null,
        shoppingItemId: null,
        haveIt: false,
      },
      {
        name: "Butter",
        quantityAmount: 1,
        quantityUnit: "pack",
        linkedItemId: null,
        shoppingItemId: null,
        haveIt: false,
      },
      {
        name: "Salt",
        quantityAmount: null,
        quantityUnit: null,
        linkedItemId: null,
        shoppingItemId: null,
        haveIt: false,
      },
    ],
    createdBy: "user-1",
    createdAt: daysAgo(2) as never,
    updatedAt: daysAgo(2) as never,
  },
];
