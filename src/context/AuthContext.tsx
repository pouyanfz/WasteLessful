import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { updateProfile } from 'firebase/auth'
import {
  auth,
  onAuthStateChanged,
  signInAnonymously,
  signInWithGoogle,
  signInWithApple,
  signInWithEmail,
  createAccountWithEmail,
  linkAnonWithGoogle,
  linkAnonWithApple,
  linkAnonWithEmail,
  signOut as _signOut,
  deleteCurrentUser,
  sendPasswordReset,
  type FirebaseUser,
} from '../firebase/auth'
import {
  createUserDoc,
  getUserDoc,
  updateUserDoc,
  deleteUserDoc,
} from '../firebase/users'
import { createGroup } from '../firebase/groups'
import { seedUserData } from '../firebase/seed'
import { nextGroupColor } from '../data/groupColors'

interface AuthContextValue {
  firebaseUser: FirebaseUser | null
  loading: boolean
  signInGoogle: () => Promise<void>
  signInApple: () => Promise<void>
  signInEmail: (email: string, password: string) => Promise<void>
  createAccount: (
    email: string,
    password: string,
    name: string,
  ) => Promise<void>
  upgradeWithGoogle: () => Promise<void>
  upgradeWithApple: () => Promise<void>
  upgradeWithEmail: (
    email: string,
    password: string,
    name: string,
  ) => Promise<void>
  updateDisplayName: (name: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!mounted) return

      if (!fbUser) {
        // No user — sign in anonymously; onAuthStateChanged fires again
        signInAnonymously()
        return
      }

      try {
        const existing = await getUserDoc(fbUser.uid)
        if (!existing) {
          // First-time user — create their Firestore document + default group
          await createUserDoc(fbUser.uid, {
            displayName: fbUser.displayName,
            email: fbUser.email,
            photoURL: fbUser.photoURL,
            isAnonymous: fbUser.isAnonymous,
          })
          const groupId = await createGroup(
            fbUser.uid,
            'My Home',
            nextGroupColor([]),
          )
          await updateUserDoc(fbUser.uid, {
            groupIds: [groupId],
            activeGroupId: groupId,
          })
          await seedUserData(groupId, fbUser.uid)
          localStorage.setItem('wl_sample_data', '1')
        } else if (!fbUser.isAnonymous && existing.isAnonymous) {
          // Anonymous → real account upgrade: sync display fields
          await updateUserDoc(fbUser.uid, {
            displayName: fbUser.displayName ?? existing.displayName,
            email: fbUser.email,
            photoURL: fbUser.photoURL,
            isAnonymous: false,
          })
        }
      } catch (err) {
        console.error('User init error:', err)
      }

      if (mounted) {
        setFirebaseUser(fbUser)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      unsub()
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        loading,
        signInGoogle: async () => {
          await signInWithGoogle()
        },
        signInApple: async () => {
          await signInWithApple()
        },
        signInEmail: async (email, password) => {
          await signInWithEmail(email, password)
        },
        createAccount: async (email, password, name) => {
          await createAccountWithEmail(email, password, name)
        },
        upgradeWithGoogle: async () => {
          await linkAnonWithGoogle()
        },
        upgradeWithApple: async () => {
          await linkAnonWithApple()
        },
        upgradeWithEmail: async (email, password, name) => {
          await linkAnonWithEmail(email, password, name)
          // updateProfile resolves after onAuthStateChanged fires, so
          // force-write the correct displayName to Firestore now
          if (auth.currentUser) {
            await updateUserDoc(auth.currentUser.uid, {
              displayName: name,
              email,
              isAnonymous: false,
            })
          }
        },
        updateDisplayName: async (name: string) => {
          if (!auth.currentUser) return
          await updateProfile(auth.currentUser, { displayName: name })
          await updateUserDoc(auth.currentUser.uid, { displayName: name })
        },
        resetPassword: async (email: string) => {
          await sendPasswordReset(email)
        },
        signOut: async () => {
          await _signOut()
        },
        deleteAccount: async () => {
          if (!auth.currentUser) return
          const uid = auth.currentUser.uid
          await deleteUserDoc(uid)
          await deleteCurrentUser()
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
