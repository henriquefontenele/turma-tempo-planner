import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, onSnapshot, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

// Hook para documento único (ex: configurações)
export function useFirestoreDoc<T>(collectionName: string, initialValue: T) {
  const { user } = useAuth();
  const [data, setData] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setData(initialValue);
      setLoading(false);
      return;
    }

    const docRef = doc(db, 'users', user.uid, collectionName, 'data');
    
    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setData(docSnap.data() as T);
        } else {
          setData(initialValue);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Erro ao carregar ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, collectionName]);

  const updateData = async (newData: T) => {
    if (!user) return;

    try {
      const docRef = doc(db, 'users', user.uid, collectionName, 'data');
      await setDoc(docRef, newData);
      setData(newData);
    } catch (err: any) {
      console.error(`Erro ao salvar ${collectionName}:`, err);
      setError(err.message);
    }
  };

  return { data, updateData, loading, error };
}

// Hook para coleções globais (ex: escolas, turmas, etc.)
export function useFirestoreCollection<T extends { id: string }>(
  collectionName: string, 
  filterBySchools?: boolean
) {
  const { user, userProfile } = useAuth();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    // Usar coleção global
    const collectionRef = collection(db, collectionName);
    
    const unsubscribe = onSnapshot(collectionRef,
      (querySnapshot) => {
        let docs: T[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          docs.push({ ...(data as any), id: docSnap.id } as T);
        });

        // Filtrar por escolas se necessário
        if (filterBySchools && userProfile?.escolaIds && userProfile.escolaIds.length > 0) {
          // Não filtrar se for administrador
          if (userProfile.role !== 'administrador') {
            docs = docs.filter((item: any) => {
              // Se o item tem escolaId, verificar se está nas escolas do usuário
              if (item.escolaId) {
                return userProfile.escolaIds?.includes(item.escolaId);
              }
              // Se é uma escola, verificar se está na lista
              if (collectionName === 'escolas') {
                return userProfile.escolaIds?.includes(item.id);
              }
              return true;
            });
          }
        }

        setItems(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Erro ao carregar ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, userProfile, collectionName, filterBySchools]);

  const addItem = async (item: Omit<T, 'id'>) => {
    if (!user) return;

    try {
      const collectionRef = collection(db, collectionName);
      await addDoc(collectionRef, item);
    } catch (err: any) {
      console.error(`Erro ao adicionar item em ${collectionName}:`, err);
      setError(err.message);
    }
  };

  const updateItem = async (id: string, updates: Partial<T>) => {
    if (!user) return;

    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, updates as any);
    } catch (err: any) {
      console.error(`Erro ao atualizar item em ${collectionName}:`, err);
      setError(err.message);
    }
  };

  const deleteItem = async (id: string) => {
    if (!user) return;

    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);
    } catch (err: any) {
      console.error(`Erro ao deletar item em ${collectionName}:`, err);
      setError(err.message);
    }
  };

  const updateItems = (newItems: T[]) => {
    // Para compatibilidade com o código existente
    setItems(newItems);
  };

  return { 
    data: items, 
    addItem, 
    updateItem, 
    deleteItem, 
    setData: updateItems, 
    loading, 
    error 
  };
}

// Hook para coleções globais sem autenticação (para páginas públicas)
export function usePublicFirestoreCollection<T extends { id: string }>(collectionName: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const collectionRef = collection(db, collectionName);
    
    const unsubscribe = onSnapshot(collectionRef,
      (querySnapshot) => {
        const docs: T[] = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          docs.push({ ...(data as any), id: docSnap.id } as T);
        });
        setItems(docs);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error(`Erro ao carregar ${collectionName}:`, err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName]);

  return { 
    data: items,
    loading, 
    error 
  };
}