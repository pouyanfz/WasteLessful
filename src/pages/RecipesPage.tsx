import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/AppDataContext";
import { makeTimestamp } from "../data/mockTimestamp";
import { groupBadgeBg } from "../data/groupColors";
import type { Recipe, RecipeIngredient, ShoppingItem, ShoppingList } from "../types";

const UNITS = ["piece", "g", "kg", "mL", "L", "pack", "can", "bottle", "box", "tbsp", "tsp", "cup"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ingredientStatus(
  ingredient: RecipeIngredient,
  shoppingItems: ShoppingItem[],
): "purchased" | "haveIt" | "onList" | "ready" {
  if (ingredient.shoppingItemId) {
    const si = shoppingItems.find((s) => s.id === ingredient.shoppingItemId);
    if (si) return si.status === "bought" ? "purchased" : "onList";
  }
  if (ingredient.haveIt) return "haveIt";
  return "ready";
}

// ─── Add ingredient sheet ─────────────────────────────────────────────────────

function AddIngredientSheet({
  lists,
  groups,
  onAdd,
  onClose,
}: {
  lists: ShoppingList[];
  groups: { id: string; name: string }[];
  onAdd: (ingredient: RecipeIngredient, addToList: string | null) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number | "">(1);
  const [unit, setUnit] = useState("piece");
  const [isCustomUnit, setIsCustomUnit] = useState(false);
  const [customUnit, setCustomUnit] = useState("");
  const [haveIt, setHaveIt] = useState(false);
  const [addToList, setAddToList] = useState(false);
  const [destTab, setDestTab] = useState<string>(lists[0]?.id ?? groups[0]?.id ?? "");

  const allDests = [
    ...lists.map((l) => ({ id: l.id, name: l.name, isGroup: false })),
    ...groups.map((g) => ({ id: g.id, name: g.name, isGroup: true })),
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const resolvedUnit = isCustomUnit ? (customUnit.trim() || unit) : unit;
    const ingredient: RecipeIngredient = {
      name: name.trim(),
      quantityAmount: amount === "" ? null : amount,
      quantityUnit: amount === "" ? null : resolvedUnit,
      linkedItemId: null,
      shoppingItemId: null,
      haveIt,
    };
    onAdd(ingredient, haveIt ? null : (addToList ? destTab : null));
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add Ingredient</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Onion, Lamb…" autoFocus
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Quantity <span className="text-gray-400 font-normal">(optional)</span></label>
            <div className="flex gap-2">
              <input
                type="number" min={0} step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="—"
                className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              />
              <select
                value={isCustomUnit ? "__custom__" : unit}
                onChange={(e) => {
                  if (e.target.value === "__custom__") setIsCustomUnit(true);
                  else { setIsCustomUnit(false); setUnit(e.target.value); }
                }}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                <option value="__custom__">custom…</option>
              </select>
            </div>
            {isCustomUnit && (
              <input
                type="text" value={customUnit} onChange={(e) => setCustomUnit(e.target.value)}
                placeholder="e.g. jar, bunch…"
                className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 mt-1"
              />
            )}
          </div>

          {/* Already have it */}
          <div className="flex items-center justify-between bg-green-50 rounded-xl p-4">
            <div>
              <p className="text-sm font-medium text-green-800">I already have this</p>
              <p className="text-xs text-green-600 mt-0.5">Don't need to buy it</p>
            </div>
            <button
              type="button"
              onClick={() => { setHaveIt((v) => !v); if (!haveIt) setAddToList(false); }}
              className={`w-11 h-6 rounded-full transition-colors relative ${haveIt ? "bg-green-500" : "bg-gray-200"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${haveIt ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>

          {/* Add to shopping list toggle */}
          {!haveIt && (
            <div className="flex flex-col gap-3 bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Add to shopping list</p>
                  <p className="text-xs text-gray-400 mt-0.5">So you remember to buy it</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddToList((v) => !v)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${addToList ? "bg-green-500" : "bg-gray-200"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${addToList ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </div>

              {addToList && allDests.length > 0 && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs text-gray-500">Which list?</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allDests.map((d) => (
                      <button
                        key={d.id} type="button"
                        onClick={() => setDestTab(d.id)}
                        className={`text-xs rounded-full px-3 py-1.5 border font-medium transition-colors ${destTab === d.id ? "bg-green-500 text-white border-green-500" : "bg-white text-gray-500 border-gray-200 hover:border-green-400"}`}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit" disabled={!name.trim()}
            className="bg-green-500 text-white rounded-xl py-3 font-medium text-sm disabled:opacity-40 hover:bg-green-600 transition-colors"
          >
            Add ingredient
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Recipe detail sheet ──────────────────────────────────────────────────────

function RecipeDetailSheet({
  recipe,
  shoppingItems,
  shoppingLists,
  groups,
  onUpdate,
  onDelete,
  onAddToShoppingList,
  onRemoveFromList,
  onToggleHaveIt,
  onClose,
}: {
  recipe: Recipe;
  shoppingItems: ShoppingItem[];
  shoppingLists: ShoppingList[];
  groups: { id: string; name: string }[];
  onUpdate: (updated: Recipe) => void;
  onDelete: (id: string) => void;
  onAddToShoppingList: (recipeId: string, ingredient: RecipeIngredient, destId: string) => void;
  onRemoveFromList: (recipeId: string, ingredient: RecipeIngredient) => void;
  onToggleHaveIt: (recipeId: string, ingredient: RecipeIngredient) => void;
  onClose: () => void;
}) {
  const [showAddIngredient, setShowAddIngredient] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(recipe.name);
  const [notesInput, setNotesInput] = useState(recipe.notes ?? "");

  function saveNameEdit() {
    if (nameInput.trim() && nameInput.trim() !== recipe.name) {
      onUpdate({ ...recipe, name: nameInput.trim() });
    }
    setEditingName(false);
  }

  function saveNotes() {
    const val = notesInput.trim();
    if (val !== (recipe.notes ?? "")) {
      onUpdate({ ...recipe, notes: val || null });
    }
  }

  function handleAddIngredient(ingredient: RecipeIngredient, destId: string | null) {
    const updated = { ...recipe, ingredients: [...recipe.ingredients, ingredient] };
    onUpdate(updated);
    if (destId) {
      onAddToShoppingList(recipe.id, ingredient, destId);
    }
  }

  function removeIngredient(idx: number) {
    const updated = { ...recipe, ingredients: recipe.ingredients.filter((_, i) => i !== idx) };
    onUpdate(updated);
  }

  const allDests = [
    ...shoppingLists.map((l) => ({ id: l.id, name: l.name })),
    ...groups.map((g) => ({ id: g.id, name: g.name })),
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
        <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-100 shrink-0">
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <input
                  autoFocus value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={saveNameEdit}
                  onKeyDown={(e) => { if (e.key === "Enter") saveNameEdit(); if (e.key === "Escape") { setNameInput(recipe.name); setEditingName(false); } }}
                  className="text-lg font-semibold w-full border-b-2 border-green-400 focus:outline-none bg-transparent"
                />
              ) : (
                <button onClick={() => setEditingName(true)} className="text-left group flex items-center gap-1.5 w-full">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">{recipe.name}</h2>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
              {recipe.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">{recipe.notes}</p>}
            </div>
          </div>

          {/* Ingredients */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-2">
            {recipe.ingredients.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No ingredients yet.</p>
            )}
            {recipe.ingredients.map((ingredient, idx) => {
              const status = ingredientStatus(ingredient, shoppingItems);
              const si = ingredient.shoppingItemId
                ? shoppingItems.find((s) => s.id === ingredient.shoppingItemId)
                : null;
              const siGroup = si?.groupId ? groups.find((g) => g.id === si.groupId) : null;
              const listName = si
                ? (si.shoppingListId
                    ? shoppingLists.find((l) => l.id === si.shoppingListId)?.name
                    : siGroup?.name)
                : null;
              const listColor = siGroup?.color ?? null;

              const dotColor =
                status === "purchased" ? "bg-green-400" :
                status === "onList" ? "bg-amber-400" :
                "bg-gray-200";

              return (
                <div key={idx} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-100 shadow-sm group">
                  {/* Status dot */}
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColor}`} />

                  {/* Name + qty */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{ingredient.name}</p>
                    {(ingredient.quantityAmount !== null || ingredient.quantityUnit !== null) && (
                      <p className="text-xs text-gray-400">
                        {ingredient.quantityAmount !== null ? ingredient.quantityAmount : ""}{" "}
                        {ingredient.quantityUnit ?? ""}
                      </p>
                    )}
                  </div>

                  {/* Status badge / add button */}
                  {status === "purchased" ? (
                    <span className="text-[10px] bg-green-50 text-green-600 rounded-full px-2 py-1 font-medium shrink-0 flex items-center gap-1">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      purchased
                    </span>
                  ) : status === "haveIt" ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] bg-green-50 text-green-600 rounded-full px-2 py-1 font-medium flex items-center gap-1">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        have it
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onToggleHaveIt(recipe.id, ingredient); }}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                        title="Unmark"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : status === "onList" ? (
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        style={listColor ? { backgroundColor: groupBadgeBg(listColor), color: listColor } : {}}
                        className={`text-[10px] rounded-full px-2 py-1 font-medium ${!listColor ? "bg-amber-50 text-amber-600" : ""}`}
                      >
                        {listName ? `on ${listName}` : "on list"}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemoveFromList(recipe.id, ingredient); }}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                        title="Remove from list"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <AddToListButton
                      allDests={allDests}
                      onSelect={(destId) => onAddToShoppingList(recipe.id, ingredient, destId)}
                    />
                  )}

                  {/* Remove ingredient */}
                  <button
                    onClick={() => removeIngredient(idx)}
                    className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    title="Remove ingredient"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {/* Legend */}
            {recipe.ingredients.length > 0 && (
              <div className="flex items-center gap-4 px-1 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-gray-200 inline-block" />Need to get</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />On list</span>
                <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />Have it</span>
              </div>
            )}

            {/* Notes */}
            <div className="mt-3 border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Notes</p>
              <textarea
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                onBlur={saveNotes}
                placeholder="Paste the recipe here, cooking tips, anything…"
                rows={4}
                className="w-full text-sm text-gray-700 placeholder-gray-300 bg-gray-50 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none border border-gray-100 focus:border-green-400 transition-colors"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100 flex flex-col gap-3 shrink-0">
            <button
              onClick={() => setShowAddIngredient(true)}
              className="w-full py-3 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Add ingredient
            </button>

            {confirmDelete ? (
              <div className="flex gap-2">
                <button
                  onClick={() => { onDelete(recipe.id); onClose(); }}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Delete recipe
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="text-red-400 text-sm hover:text-red-600 transition-colors text-center">
                Delete recipe
              </button>
            )}
          </div>
        </div>
      </div>

      {showAddIngredient && (
        <AddIngredientSheet
          lists={shoppingLists}
          groups={groups}
          onAdd={handleAddIngredient}
          onClose={() => setShowAddIngredient(false)}
        />
      )}
    </>
  );
}

// ─── Add-to-list button ───────────────────────────────────────────────────────

function AddToListButton({
  allDests,
  onSelect,
}: {
  allDests: { id: string; name: string }[];
  onSelect: (destId: string) => void;
}) {
  const [open, setOpen] = useState(false);

  if (allDests.length === 0) return null;

  if (allDests.length === 1) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(allDests[0].id); }}
        className="text-[10px] text-green-600 bg-green-50 hover:bg-green-100 rounded-full px-2 py-1 font-medium shrink-0 transition-colors"
      >
        + add to list
      </button>
    );
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="text-[10px] text-green-600 bg-green-50 hover:bg-green-100 rounded-full px-2 py-1 font-medium shrink-0 transition-colors"
      >
        + add to list
      </button>
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
        >
          <div
            className="bg-white w-full max-w-sm rounded-t-2xl px-5 pt-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">Add to which list?</p>
            <div className="flex flex-col gap-2">
              {allDests.map((d) => (
                <button
                  key={d.id}
                  onClick={(e) => { e.stopPropagation(); onSelect(d.id); setOpen(false); }}
                  className="text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-100 transition-colors"
                >
                  {d.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── New recipe sheet ─────────────────────────────────────────────────────────

function NewRecipeSheet({
  groups,
  onSave,
  onClose,
}: {
  groups: { id: string; name: string }[];
  onSave: (name: string, groupId: string, notes: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), groupId, notes.trim());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-6 flex flex-col gap-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">New Recipe</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Name</label>
            <input
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Pasta, Stir Fry…" autoFocus
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>

          {groups.length > 1 && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Group</label>
              <select
                value={groupId} onChange={(e) => setGroupId(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes about this recipe…"
              rows={3}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
            />
          </div>

          <button
            type="submit" disabled={!name.trim()}
            className="bg-green-500 text-white rounded-xl py-3 font-medium text-sm disabled:opacity-40 hover:bg-green-600 transition-colors"
          >
            Create recipe
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Recipe card ──────────────────────────────────────────────────────────────

function RecipeCard({
  recipe,
  shoppingItems,
  onClick,
}: {
  recipe: Recipe;
  shoppingItems: ShoppingItem[];
  onClick: () => void;
}) {
  const onListCount = recipe.ingredients.filter(
    (ing) => ing.shoppingItemId && shoppingItems.some((s) => s.id === ing.shoppingItemId)
  ).length;
  const needCount = recipe.ingredients.length - onListCount;

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100 text-left hover:border-green-300 transition-colors active:scale-[0.99]"
    >
      <p className="font-semibold text-gray-900 text-sm">{recipe.name}</p>
      {recipe.notes && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{recipe.notes}</p>}
      <div className="flex items-center gap-3 mt-2">
        <span className="text-xs text-gray-400">{recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? "s" : ""}</span>
        {onListCount > 0 && (
          <span className="text-[10px] bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 font-medium">
            {onListCount} on shopping list
          </span>
        )}
        {needCount > 0 && onListCount === 0 && (
          <span className="text-[10px] bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">
            {needCount} to get
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RecipesPage() {
  const navigate = useNavigate();
  const { recipes, setRecipes, shoppingItems, setShoppingItems, shoppingLists, groups } = useAppData();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showNewRecipe, setShowNewRecipe] = useState(false);

  function toggleIngredientHaveIt(recipeId: string, ingredient: RecipeIngredient) {
    const now = makeTimestamp(new Date()) as never;
    const toggle = (ing: RecipeIngredient) =>
      ing === ingredient ? { ...ing, haveIt: !ing.haveIt } : ing;
    setRecipes((prev) => prev.map((r) =>
      r.id !== recipeId ? r : { ...r, ingredients: r.ingredients.map(toggle), updatedAt: now }
    ));
    setSelectedRecipe((prev) =>
      prev?.id !== recipeId ? prev : { ...prev, ingredients: prev.ingredients.map(toggle) }
    );
  }

  function removeIngredientFromShoppingList(recipeId: string, ingredient: RecipeIngredient) {
    // Remove the shopping item
    if (ingredient.shoppingItemId) {
      setShoppingItems((prev) => prev.filter((s) => s.id !== ingredient.shoppingItemId));
    }
    // Unlink from the ingredient
    const now = makeTimestamp(new Date()) as never;
    setRecipes((prev) => prev.map((r) => {
      if (r.id !== recipeId) return r;
      const ingredients = r.ingredients.map((ing) =>
        ing === ingredient || ing.shoppingItemId === ingredient.shoppingItemId
          ? { ...ing, shoppingItemId: null }
          : ing
      );
      return { ...r, ingredients, updatedAt: now };
    }));
    setSelectedRecipe((prev) => {
      if (!prev || prev.id !== recipeId) return prev;
      const ingredients = prev.ingredients.map((ing) =>
        ing === ingredient || ing.shoppingItemId === ingredient.shoppingItemId
          ? { ...ing, shoppingItemId: null }
          : ing
      );
      return { ...prev, ingredients };
    });
  }

  function createRecipe(name: string, groupId: string, notes: string) {
    const now = makeTimestamp(new Date()) as never;
    const newRecipe: Recipe = {
      id: crypto.randomUUID(),
      groupId,
      name,
      notes: notes || null,
      ingredients: [],
      createdBy: "user-1",
      createdAt: now,
      updatedAt: now,
    };
    setRecipes((prev) => [newRecipe, ...prev]);
    setSelectedRecipe(newRecipe);
  }

  function updateRecipe(updated: Recipe) {
    const now = makeTimestamp(new Date()) as never;
    const withTimestamp = { ...updated, updatedAt: now };
    setRecipes((prev) => prev.map((r) => r.id === updated.id ? withTimestamp : r));
    setSelectedRecipe(withTimestamp);
  }

  function deleteRecipe(id: string) {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }

  function addIngredientToShoppingList(recipeId: string, ingredient: RecipeIngredient, destId: string) {
    const now = makeTimestamp(new Date()) as never;
    const isGroup = groups.some((g) => g.id === destId);
    const newShoppingItem: ShoppingItem = {
      id: crypto.randomUUID(),
      groupId: isGroup ? destId : null,
      shoppingListId: isGroup ? null : destId,
      name: ingredient.name,
      quantity: {
        amount: ingredient.quantityAmount ?? 1,
        unit: ingredient.quantityUnit ?? "piece",
      },
      linkedRecipeId: recipeId,
      linkedItemId: ingredient.linkedItemId,
      linkedItemName: null,
      status: "toBuy",
      autoAdded: false,
      addedToInventory: false,
      addedBy: "user-1",
      boughtBy: null,
      addedAt: now,
      boughtAt: null,
      updatedAt: now,
    };
    setShoppingItems((prev) => [...prev, newShoppingItem]);

    // Link the shopping item back to the ingredient in the recipe
    setRecipes((prev) => prev.map((r) => {
      if (r.id !== recipeId) return r;
      const ingredients = r.ingredients.map((ing) =>
        ing.name === ingredient.name && ing.shoppingItemId === null
          ? { ...ing, shoppingItemId: newShoppingItem.id }
          : ing
      );
      return { ...r, ingredients, updatedAt: now };
    }));

    // Keep selectedRecipe in sync
    setSelectedRecipe((prev) => {
      if (!prev || prev.id !== recipeId) return prev;
      const ingredients = prev.ingredients.map((ing) =>
        ing.name === ingredient.name && ing.shoppingItemId === null
          ? { ...ing, shoppingItemId: newShoppingItem.id }
          : ing
      );
      return { ...prev, ingredients };
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-gray-900">Recipes</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewRecipe(true)}
            className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-2xl leading-none shadow hover:bg-green-600 transition-colors"
          >+</button>
          <button onClick={() => navigate("/settings")}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:border-green-400 hover:text-green-600 transition-colors" title="Settings">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="px-4 py-4 max-w-lg mx-auto flex flex-col gap-3">
        {recipes.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 2.69a.5.5 0 0 1 .765-.424L21 12 3.765 21.734A.5.5 0 0 1 3 21.31V2.69z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No recipes yet.</p>
            <button
              onClick={() => setShowNewRecipe(true)}
              className="text-green-600 text-sm font-medium hover:underline"
            >
              Create your first recipe
            </button>
          </div>
        ) : (
          recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              shoppingItems={shoppingItems}
              onClick={() => setSelectedRecipe(recipe)}
            />
          ))
        )}
      </main>

      {showNewRecipe && (
        <NewRecipeSheet
          groups={groups}
          onSave={createRecipe}
          onClose={() => setShowNewRecipe(false)}
        />
      )}

      {selectedRecipe && (
        <RecipeDetailSheet
          recipe={selectedRecipe}
          shoppingItems={shoppingItems}
          shoppingLists={shoppingLists}
          groups={groups}
          onUpdate={updateRecipe}
          onDelete={deleteRecipe}
          onAddToShoppingList={addIngredientToShoppingList}
          onRemoveFromList={removeIngredientFromShoppingList}
          onToggleHaveIt={toggleIngredientHaveIt}
          onClose={() => setSelectedRecipe(null)}
        />
      )}
    </div>
  );
}
