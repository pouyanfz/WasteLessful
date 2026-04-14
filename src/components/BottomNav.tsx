import { NavLink } from "react-router-dom";

const links = [
  {
    to: "/",
    label: "Items",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18M3 12h18M3 18h18" />
      </svg>
    ),
  },
  {
    to: "/shopping",
    label: "Shopping",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    to: "/recipes",
    label: "Recipes",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C8.5 2 6 4.5 6 7c0 1.5.7 2.8 1.8 3.7L7 21h10l-.8-10.3C17.3 9.8 18 8.5 18 7c0-2.5-2.5-5-6-5z" />
        <path d="M9 21v-4a3 3 0 0 1 6 0v4" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 flex">
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
              isActive ? "text-green-600" : "text-gray-400"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <span className={isActive ? "text-green-500" : "text-gray-400"}>{icon}</span>
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
