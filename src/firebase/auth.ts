import {
  getAuth,
  signInAnonymously as _signInAnonymously,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  linkWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut as _signOut,
  deleteUser,
  updateProfile,
  onAuthStateChanged as _onAuthStateChanged,
} from 'firebase/auth'
import type { User as FirebaseUser } from 'firebase/auth'
import { app } from './config'

export const auth = getAuth(app)
export type { FirebaseUser }
export const onAuthStateChanged = _onAuthStateChanged

export const signInAnonymously = () => _signInAnonymously(auth)

export const signInWithGoogle = () => {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return signInWithPopup(auth, provider)
}

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password)

export async function createAccountWithEmail(
  email: string,
  password: string,
  displayName: string,
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(cred.user, { displayName })
  return cred
}

export async function linkAnonWithGoogle() {
  if (!auth.currentUser) throw new Error('No current user')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  return linkWithPopup(auth.currentUser, provider)
}

export async function linkAnonWithEmail(
  email: string,
  password: string,
  displayName: string,
) {
  if (!auth.currentUser) throw new Error('No current user')
  const credential = EmailAuthProvider.credential(email, password)
  const result = await linkWithCredential(auth.currentUser, credential)
  await updateProfile(result.user, { displayName })
  return result
}

export const sendPasswordReset = (email: string) =>
  sendPasswordResetEmail(auth, email)

export const signOut = () => _signOut(auth)

export async function deleteCurrentUser() {
  if (!auth.currentUser) throw new Error('No current user')
  return deleteUser(auth.currentUser)
}
