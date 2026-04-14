import { BrowserRouter, Routes, Route } from "react-router-dom";
import ItemsPage from "./pages/ItemsPage";
import ShoppingListPage from "./pages/ShoppingListPage";
import BottomNav from "./components/BottomNav";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ItemsPage />} />
        <Route path="/shopping" element={<ShoppingListPage />} />
      </Routes>
      <BottomNav />
    </BrowserRouter>
  );
}
