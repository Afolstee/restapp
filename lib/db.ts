// Firebase Firestore database functions
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query as firestoreQuery, 
  where, 
  orderBy 
} from 'firebase/firestore'
import { db } from './firebase/config'

// Compatibility layer for existing SQL-style queries
export async function query(text: string, params?: any[]) {
  // This is a simplified compatibility layer
  // You'll need to migrate specific queries to Firestore
  console.warn('SQL query needs to be migrated to Firestore:', text, params)
  return { rows: [] }
}

// Firestore helper functions
export async function getCollection(collectionName: string) {
  const querySnapshot = await getDocs(collection(db, collectionName))
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
}

export async function getDocument(collectionName: string, docId: string) {
  const docRef = doc(db, collectionName, docId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null
}

export async function addDocument(collectionName: string, data: any) {
  const docRef = await addDoc(collection(db, collectionName), data)
  return docRef.id
}

export async function updateDocument(collectionName: string, docId: string, data: any) {
  const docRef = doc(db, collectionName, docId)
  await updateDoc(docRef, data)
}

export async function deleteDocument(collectionName: string, docId: string) {
  const docRef = doc(db, collectionName, docId)
  await deleteDoc(docRef)
}

export { db as firestore }
export default db
