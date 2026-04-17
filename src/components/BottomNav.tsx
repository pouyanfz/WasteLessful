import { NavLink } from 'react-router-dom'
import recipeImg from '../assets/recipe.png'

export default function BottomNav() {
  return (
    <nav className="bg-white border-t border-gray-100 flex pb-[env(safe-area-inset-bottom,0px)] shrink-0">
      {/* Items */}
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
            isActive ? 'text-green-600' : 'text-gray-400'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isActive ? '#16a34a' : '#9ca3af'}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
            Items
          </>
        )}
      </NavLink>

      {/* Shopping */}
      <NavLink
        to="/shopping"
        end
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
            isActive ? 'text-green-600' : 'text-gray-400'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={isActive ? '#16a34a' : '#9ca3af'}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Shopping
          </>
        )}
      </NavLink>

      {/* Recipes — PNG icon */}
      <NavLink
        to="/recipes"
        end
        className={({ isActive }) =>
          `flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
            isActive ? 'text-green-600' : 'text-gray-400'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <img
              src={recipeImg}
              alt=""
              className={`w-6 h-6 object-contain transition-opacity ${
                isActive ? 'opacity-100' : 'opacity-40'
              }`}
            />
            Recipes
          </>
        )}
      </NavLink>
    </nav>
  )
}
