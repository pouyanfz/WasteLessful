import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type { Item, Group, ShoppingItem, ShoppingList, Recipe } from "../types";
import { mockItems } from "../data/mockItems";
import { mockGroups } from "../data/mockGroups";
import { mockShoppingItems } from "../data/mockShoppingItems";
import { mockShoppingLists } from "../data/mockShoppingLists";
import { mockRecipes } from "../data/mockRecipes";

interface AppData {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  shoppingItems: ShoppingItem[];
  setShoppingItems: React.Dispatch<React.SetStateAction<ShoppingItem[]>>;
  shoppingLists: ShoppingList[];
  setShoppingLists: React.Dispatch<React.SetStateAction<ShoppingList[]>>;
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
}

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>(mockItems);
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>(mockShoppingItems);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>(mockShoppingLists);
  const [recipes, setRecipes] = useState<Recipe[]>(mockRecipes);

  return (
    <AppDataContext.Provider value={{ items, setItems, groups, setGroups, shoppingItems, setShoppingItems, shoppingLists, setShoppingLists, recipes, setRecipes }}>
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}
