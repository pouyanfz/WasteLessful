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
  const eggsId = crypto.randomUUID()
  const redbullID = crypto.randomUUID()
  const chickenId = crypto.randomUUID()
  const oliveOilId = crypto.randomUUID()

  const items: Item[] = [
    {
      id: milkId,
      groupId,
      name: 'Milk',
      categories: ['dairy'],
      colorTag: null,
      photoURL: null,
      notes: null,
      quantity: { current: 1, initial: 4, unit: 'L' },
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
      id: eggsId,
      groupId,
      name: 'Eggs',
      categories: ['dairy'],
      colorTag: null,
      photoURL: null,
      notes: null,
      quantity: { current: 12, initial: 12, unit: 'pack' },
      dates: {
        addedAt: now,
        purchasedAt: null,
        expiresAt: daysFromNow(3),
        lastUsedAt: null,
      },
      notification: { enabled: true, daysBeforeExp: null },
      addedBy: userId,
      updatedAt: now,
      isArchived: false,
      archivedAt: null,
    },
    {
      id: redbullID,
      groupId,
      name: 'Redbull',
      categories: ['drink'],
      colorTag: '#ef4444',
      photoURL: null,
      notes: null,
      quantity: { current: 2, initial: 20, unit: 'can' },
      dates: {
        addedAt: now,
        purchasedAt: null,
        expiresAt: daysFromNow(-1),
        lastUsedAt: null,
      },
      notification: { enabled: true, daysBeforeExp: null },
      addedBy: userId,
      updatedAt: now,
      isArchived: false,
      archivedAt: null,
    },
    {
      id: chickenId,
      groupId,
      name: 'Chicken Breast',
      categories: ['meat'],
      colorTag: null,
      photoURL: null,
      notes: null,
      quantity: { current: 400, initial: 500, unit: 'g' },
      dates: {
        addedAt: now,
        purchasedAt: null,
        expiresAt: daysFromNow(14),
        lastUsedAt: null,
      },
      notification: { enabled: true, daysBeforeExp: null },
      addedBy: userId,
      updatedAt: now,
      isArchived: false,
      archivedAt: null,
    },
    {
      id: oliveOilId,
      groupId,
      name: 'Olive Oil',
      categories: ['pantry'],
      colorTag: null,
      photoURL: null,
      notes: null,
      quantity: { current: 300, initial: 500, unit: 'mL' },
      dates: {
        addedAt: now,
        purchasedAt: null,
        expiresAt: daysFromNow(180),
        lastUsedAt: null,
      },
      notification: { enabled: true, daysBeforeExp: null },
      addedBy: userId,
      updatedAt: now,
      isArchived: false,
      archivedAt: null,
    },
  ]

  const recipeId = crypto.randomUUID()
  const pastaShoppingItemId = crypto.randomUUID()

  const milkShoppingItem: ShoppingItem = {
    id: crypto.randomUUID(),
    groupId,
    shoppingListId: null,
    name: 'Milk',
    quantity: { amount: 2, unit: 'L' },
    linkedRecipeId: null,
    linkedItemId: milkId,
    linkedItemName: 'Milk',
    status: 'toBuy',
    autoAdded: false,
    addedToInventory: false,
    addedBy: userId,
    boughtBy: null,
    addedAt: now,
    boughtAt: null,
    updatedAt: now,
  }

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
    notes:
      'A Simple classic that I saw on youtube. Great for using up pantry staples.',
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
        linkedItemId: oliveOilId,
        shoppingItemId: null,
        haveIt: true,
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
