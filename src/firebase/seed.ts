import { Timestamp } from 'firebase/firestore'
import { addItem } from './items'
import { addShoppingItem } from './shoppingList'
import { addRecipe } from './recipes'
import type { Item, ShoppingItem, Recipe } from '../types'

function daysFromNow(n: number): Timestamp {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return Timestamp.fromDate(d)
}

export async function seedUserData(
  groupId: string,
  userId: string,
): Promise<void> {
  const now = Timestamp.now()

  const milkId = crypto.randomUUID()
  const redbullId = crypto.randomUUID()

  const items: Item[] = [
    {
      id: milkId,
      groupId,
      name: 'Milk',
      categories: ['dairy'],
      colorTag: null,
      photoURL: null,
      notes: null,
      quantity: { current: 1, initial: 1, unit: 'L' },
      dates: {
        addedAt: now,
        purchasedAt: null,
        expiresAt: daysFromNow(2),
        lastUsedAt: null,
      },
      notification: { enabled: true, daysBeforeExp: null },
      addedBy: userId,
      updatedAt: now,
      isArchived: false,
      archivedAt: null,
    },
    {
      id: redbullId,
      groupId,
      name: 'Red Bull',
      categories: ['drink'],
      colorTag: '#ef4444',
      photoURL: null,
      notes: null,
      quantity: { current: 5, initial: 12, unit: 'can' },
      dates: {
        addedAt: now,
        purchasedAt: null,
        expiresAt: null,
        lastUsedAt: null,
      },
      notification: { enabled: false, daysBeforeExp: null },
      addedBy: userId,
      updatedAt: now,
      isArchived: false,
      archivedAt: null,
    },
  ]

  const milkShoppingItem: ShoppingItem = {
    id: crypto.randomUUID(),
    groupId,
    shoppingListId: null,
    name: 'Milk',
    quantity: { amount: 1, unit: 'L' },
    linkedRecipeId: null,
    linkedItemId: milkId,
    linkedItemName: 'Milk',
    status: 'toBuy',
    autoAdded: true,
    addedToInventory: false,
    addedBy: userId,
    boughtBy: null,
    addedAt: now,
    boughtAt: null,
    updatedAt: now,
  }

  const recipeId = crypto.randomUUID()
  const pastaShoppingItemId = crypto.randomUUID()

  const pastaShoppingItem: ShoppingItem = {
    id: pastaShoppingItemId,
    groupId,
    shoppingListId: null,
    name: 'Pasta',
    quantity: { amount: 200, unit: 'g' },
    linkedRecipeId: recipeId,
    linkedItemId: null,
    linkedItemName: null,
    status: 'toBuy',
    autoAdded: false,
    addedToInventory: false,
    addedBy: userId,
    boughtBy: null,
    addedAt: now,
    boughtAt: null,
    updatedAt: now,
  }

  const recipe: Recipe = {
    id: recipeId,
    groupId,
    name: 'Pasta with Olive Oil',
    notes: 'A simple classic. Great for using up pantry staples.',
    ingredients: [
      {
        name: 'Pasta',
        quantityAmount: 200,
        quantityUnit: 'g',
        linkedItemId: null,
        shoppingItemId: pastaShoppingItemId,
        haveIt: false,
      },
      {
        name: 'Olive Oil',
        quantityAmount: 3,
        quantityUnit: 'tbsp',
        linkedItemId: null,
        shoppingItemId: null,
        haveIt: false,
      },
      {
        name: 'Garlic',
        quantityAmount: 2,
        quantityUnit: 'clove',
        linkedItemId: null,
        shoppingItemId: null,
        haveIt: false,
      },
    ],
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  }

  await Promise.all([
    ...items.map(addItem),
    addShoppingItem(milkShoppingItem),
    addShoppingItem(pastaShoppingItem),
    addRecipe(recipe),
  ])
}
