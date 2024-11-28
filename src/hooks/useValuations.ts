import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './useAuth';
import type { CompanyValuation, ValuationResult } from '../types';

export function useValuations() {
  const [savedValuations, setSavedValuations] = useState<Record<string, CompanyValuation>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setSavedValuations({});
      setLoading(false);
      return;
    }

    setLoading(true);
    const valuationsRef = collection(db, 'valuations');
    const q = query(
      valuationsRef,
      where('userId', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const valuations: Record<string, CompanyValuation> = {};
        snapshot.forEach((doc) => {
          valuations[doc.id] = {
            id: doc.id,
            ...doc.data()
          } as CompanyValuation;
        });
        setSavedValuations(valuations);
        setLoading(false);
        setError(null);
      },
      error: (err) => {
        console.error('Erreur Firestore:', err);
        setError('Erreur de chargement des données');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const saveCompanyValuation = useCallback(async (
    stockName: string,
    currentPrice: number,
    results: Record<string, ValuationResult | null>
  ) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    try {
      const valuationData = {
        timestamp: serverTimestamp(),
        stockName,
        currentPrice,
        valuations: {
          eps: results.eps ? { ...results.eps, userId: user.uid } : null,
          ocf: results.ocf ? { ...results.ocf, userId: user.uid } : null,
          fcf: results.fcf ? { ...results.fcf, userId: user.uid } : null,
        },
        userId: user.uid,
      };
      
      const docRef = await addDoc(collection(db, 'valuations'), valuationData);
      return docRef.id;
    } catch (err) {
      console.error('Erreur de sauvegarde:', err);
      throw new Error('La sauvegarde a échoué. Veuillez réessayer.');
    }
  }, [user]);

  const deleteValuation = useCallback(async (id: string) => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }
    
    try {
      const valuation = savedValuations[id];
      if (!valuation || valuation.userId !== user.uid) {
        throw new Error('Vous n\'avez pas les droits pour supprimer cette valorisation');
      }
      
      await deleteDoc(doc(db, 'valuations', id));
      
      // Mise à jour locale de l'état
      setSavedValuations(prev => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    } catch (err) {
      console.error('Erreur de suppression:', err);
      throw new Error('La suppression a échoué. Veuillez réessayer.');
    }
  }, [user, savedValuations]);

  return {
    savedValuations,
    saveCompanyValuation,
    deleteValuation,
    loading,
    error
  };
}