import React from 'react';
import { Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function Methodology({ isOpen, onClose }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Méthodologie de Calcul</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <span className="sr-only">Fermer</span>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <p>
              L'évaluation est calculée en utilisant un processus en deux étapes :
            </p>
            
            <ol className="list-decimal list-inside space-y-4">
              <li className="space-y-2">
                <span>Projection de la valeur future en utilisant le taux de croissance estimé :</span>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <code className="text-blue-600 dark:text-blue-400">
                    Valeur Future = Valeur Actuelle × (1 + Taux de Croissance)^Années
                  </code>
                </div>
              </li>
              
              <li className="space-y-2">
                <span>Calcul de la valeur actuelle en utilisant le multiple terminal et le TCAC souhaité :</span>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                  <code className="text-blue-600 dark:text-blue-400">
                    Juste Valeur = (Valeur Future × Multiple Terminal) ÷ (1 + TCAC Souhaité)^Années
                  </code>
                </div>
              </li>
            </ol>
            
            <p className="mt-6 text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              Cette approche utilise votre taux de croissance estimé pour projeter les valeurs futures,
              tandis que le TCAC souhaité détermine le taux d'actualisation pour calculer la valeur actuelle.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}