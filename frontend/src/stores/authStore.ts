import { create } from "zustand"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

interface User {
  uid: string
  email: string | null
  name: string | null
  picture: string | null
}

interface AuthStore {
  user: User | null
  isLoading: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

function mapUser(fbUser: FirebaseUser): User {
  return {
    uid: fbUser.uid,
    email: fbUser.email,
    name: fbUser.displayName,
    picture: fbUser.photoURL,
  }
}

export const useAuthStore = create<AuthStore>((set) => {
  onAuthStateChanged(auth, (fbUser) => {
    set({ user: fbUser ? mapUser(fbUser) : null, isLoading: false })
  })

  getRedirectResult(auth).catch(() => {})

  return {
    user: null,
    isLoading: true,

    signInWithEmail: async (email, password) => {
      await signInWithEmailAndPassword(auth, email, password)
    },

    signInWithGoogle: async () => {
      const provider = new GoogleAuthProvider()
      await signInWithRedirect(auth, provider)
    },

    resetPassword: async (email) => {
      await sendPasswordResetEmail(auth, email)
    },

    logout: async () => {
      await signOut(auth)
    },
  }
})
