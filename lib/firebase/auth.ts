import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User as FirebaseUser
} from 'firebase/auth'
import { 
  doc, 
  setDoc, 
  getDoc,
  collection,
  query,
  where,
  getDocs 
} from 'firebase/firestore'
import { auth, db } from './config'
import bcrypt from 'bcryptjs'

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  userPassword: string // Generated ID that serves as password
  role: 'admin' | 'waiter'
  isActive?: boolean
  createdAt?: Date
}

// Create user with generated ID (only for admin use)
export async function createUserWithGeneratedId(
  firstName: string, 
  lastName: string, 
  role: 'admin' | 'waiter' = 'waiter'
): Promise<{ user: User, generatedId: string } | null> {
  try {
    const { generateUserId } = await import('../utils/id-generator')
    const generatedId = generateUserId(firstName, lastName)
    const fullName = `${firstName} ${lastName}`
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@restaurant.com`

    // Create auth user with generated ID as password
    const userCredential = await createUserWithEmailAndPassword(auth, email, generatedId)
    const firebaseUser = userCredential.user

    // Create user profile in Firestore
    const userRef = doc(db, 'users', firebaseUser.uid)
    await setDoc(userRef, {
      email,
      firstName,
      lastName,
      fullName,
      userPassword: generatedId,
      role,
      isActive: true,
      createdAt: new Date()
    })

    const newUser: User = {
      id: firebaseUser.uid,
      email,
      firstName,
      lastName,
      fullName,
      userPassword: generatedId,
      role,
      isActive: true,
      createdAt: new Date()
    }

    return { user: newUser, generatedId }
  } catch (error) {
    console.error('Error creating user:', error)
    return null
  }
}

// Create user document in Firestore (for admin)
export async function createUserProfile(user: FirebaseUser, additionalData: Partial<User> = {}) {
  if (!user) return

  const userRef = doc(db, 'users', user.uid)
  const userSnapshot = await getDoc(userRef)

  if (!userSnapshot.exists()) {
    const { email } = user
    const createdAt = new Date()

    try {
      await setDoc(userRef, {
        email,
        firstName: additionalData.firstName || 'Restwebbapp',
        lastName: additionalData.lastName || 'Admin',
        fullName: additionalData.fullName || 'Restaurant Admin',
        userPassword: additionalData.userPassword || '0919RW',
        role: additionalData.role || 'admin',
        isActive: true,
        createdAt,
        ...additionalData
      })
    } catch (error) {
      console.error('Error creating user profile:', error)
    }
  }

  return userRef
}

// Sign in with first name and generated ID
export async function signIn(firstName: string, userPassword: string): Promise<User | null> {
  try {
    // Handle special admin case first
    if (firstName === 'Restwebbapp' && userPassword === '0919RW') {
      // Sign in with Firebase Auth using admin email
      const userCredential = await signInWithEmailAndPassword(auth, 'admin@restaurant.com', '0919RW')
      const firebaseUser = userCredential.user

      // Get admin profile from Firestore
      const userRef = doc(db, 'users', firebaseUser.uid)
      const userDoc = await getDoc(userRef)
      
      if (userDoc.exists()) {
        const userData = userDoc.data()
        return {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          firstName: 'Restwebbapp',
          lastName: 'Admin',
          fullName: 'Restaurant Admin',
          userPassword: '0919RW',
          role: userData.role,
          isActive: userData.isActive
        }
      }
    }

    // For regular users, search by firstName and userPassword
    const usersRef = collection(db, 'users')
    const q = query(usersRef, 
      where('firstName', '==', firstName), 
      where('userPassword', '==', userPassword),
      where('isActive', '==', true)
    )
    const querySnapshot = await getDocs(q)
    
    if (querySnapshot.empty) {
      throw new Error('Invalid username or password')
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()
    
    // Sign in with Firebase Auth using their email
    const userCredential = await signInWithEmailAndPassword(auth, userData.email, userPassword)
    const firebaseUser = userCredential.user

    return {
      id: firebaseUser.uid,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      fullName: userData.fullName,
      userPassword: userData.userPassword,
      role: userData.role,
      isActive: userData.isActive
    }
  } catch (error) {
    console.error('Sign in error:', error)
    return null
  }
}

// Create admin user with demo credentials
export async function createAdminUser() {
  try {
    // Create auth user with demo credentials
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'admin@restaurant.com', 
      '0919RW'
    )
    
    // Create admin profile with firstName as 'Restwebbapp'
    await createUserProfile(userCredential.user, {
      firstName: 'Restwebbapp',
      lastName: 'Admin',
      fullName: 'Restaurant Admin',
      userPassword: '0919RW',
      role: 'admin',
      isActive: true
    })

    return userCredential.user
  } catch (error) {
    console.error('Error creating admin user:', error)
    throw error
  }
}

// Get current user profile
export async function getCurrentUserProfile(): Promise<User | null> {
  const currentUser = auth.currentUser
  if (!currentUser) return null

  const userRef = doc(db, 'users', currentUser.uid)
  const userDoc = await getDoc(userRef)
  
  if (!userDoc.exists()) return null

  const userData = userDoc.data()
  return {
    id: currentUser.uid,
    email: currentUser.email!,
    firstName: userData.firstName,
    lastName: userData.lastName,
    fullName: userData.fullName,
    userPassword: userData.userPassword,
    role: userData.role,
    isActive: userData.isActive
  }
}

// Sign out
export async function signOut() {
  return firebaseSignOut(auth)
}