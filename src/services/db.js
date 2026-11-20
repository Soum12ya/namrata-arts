import {
  collection, doc, addDoc, updateDoc, deleteDoc, setDoc, getDoc,
  onSnapshot, query, orderBy, serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import { INITIAL_CATEGORIES, INITIAL_PRODUCTS, INITIAL_SETTINGS } from '../data/seedData';

export const isFirebaseConfigured = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID);

export const subscribeProducts = (cb) => {
  if (!isFirebaseConfigured) return () => {};
  return onSnapshot(
    query(collection(db, 'products'), orderBy('createdAt', 'desc')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => {}
  );
};

export const subscribeCategories = (cb) => {
  if (!isFirebaseConfigured) return () => {};
  return onSnapshot(
    query(collection(db, 'categories'), orderBy('name', 'asc')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => {}
  );
};

export const subscribeOrders = (cb) => {
  if (!isFirebaseConfigured) return () => {};
  return onSnapshot(
    query(collection(db, 'orders'), orderBy('createdAt', 'desc')),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    () => {}
  );
};

export const createProduct = (data) =>
  addDoc(collection(db, 'products'), { ...data, createdAt: serverTimestamp() });

export const updateProduct = (id, patch) =>
  updateDoc(doc(db, 'products', id), patch);

export const removeProduct = (id) =>
  deleteDoc(doc(db, 'products', id));

export const createCategory = (name, department) =>
  addDoc(collection(db, 'categories'), { name, department, createdAt: serverTimestamp() });

export const removeCategory = (id) =>
  deleteDoc(doc(db, 'categories', id));

export const submitOrderOrCommission = async (payload) => {
  const orderCode = `KS-${Math.floor(1000 + Math.random() * 9000)}`;
  if (!isFirebaseConfigured) return { id: `local-${Date.now()}`, orderCode };
  const docRef = await addDoc(collection(db, 'orders'), {
    ...payload,
    orderCode,
    status: 'Pending',
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, orderCode };
};

export const updateOrderStatus = (id, status) =>
  updateDoc(doc(db, 'orders', id), { status });

export const removeOrder = (id) =>
  deleteDoc(doc(db, 'orders', id));

export const getStudioSettings = async () => {
  if (!isFirebaseConfigured) return INITIAL_SETTINGS;
  const snap = await getDoc(doc(db, 'settings', 'studio'));
  return snap.exists() ? { ...INITIAL_SETTINGS, ...snap.data() } : INITIAL_SETTINGS;
};

export const saveStudioSettings = (patch) =>
  isFirebaseConfigured
    ? setDoc(doc(db, 'settings', 'studio'), patch, { merge: true })
    : Promise.resolve();

export const seedFirestoreCatalog = async () => {
  const batch = writeBatch(db);
  INITIAL_CATEGORIES.forEach((cat) => {
    const { id, ...rest } = cat;
    batch.set(doc(db, 'categories', id), { ...rest, createdAt: serverTimestamp() });
  });
  INITIAL_PRODUCTS.forEach((prod) => {
    const { id, ...rest } = prod;
    batch.set(doc(db, 'products', id), { ...rest, createdAt: serverTimestamp() });
  });
  batch.set(doc(db, 'settings', 'studio'), INITIAL_SETTINGS, { merge: true });
  await batch.commit();
};