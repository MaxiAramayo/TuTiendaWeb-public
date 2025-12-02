/**
 * Componente de registro en múltiples pasos
 * 
 * @module features/auth/components/MultiStepRegister
 */

'use client';

import { useState } from 'react';
import { UserRegistrationStep } from './UserRegistrationStep';
import { StoreSetupStep } from './StoreSetupStep';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle } from 'lucide-react';

export interface UserData {
  email: string;
  password: string;
  displayName: string;
  terms: boolean;
}

export interface StoreData {
  whatsappNumber: string;
  name: string;
  storeType: string;
  slug: string;
}

/**
 * Componente principal de registro en pasos
 */
export const MultiStepRegister = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleUserDataComplete = (data: UserData) => {
    setUserData(data);
    setCurrentStep(2);
  };

  const handleStoreSetupComplete = () => {
    setIsCompleted(true);
  };

  const handleBackToStep1 = () => {
    setCurrentStep(1);
  };

  const progress = currentStep === 1 ? 50 : 100;

  if (isCompleted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">¡Cuenta creada!</h2>
            <p className="text-gray-600">
              Tu cuenta y tienda han sido creadas exitosamente.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Indicador de progreso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span className={currentStep === 1 ? 'font-medium text-blue-600' : ''}>
            Paso 1: Datos personales
          </span>
          <span className={currentStep === 2 ? 'font-medium text-blue-600' : ''}>
            Paso 2: Configurar tienda
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Contenido del paso actual */}
      {currentStep === 1 && (
        <UserRegistrationStep 
          onComplete={handleUserDataComplete}
          initialData={userData}
        />
      )}
      
      {currentStep === 2 && userData && (
        <StoreSetupStep 
          userData={userData}
          onComplete={handleStoreSetupComplete}
          onBack={handleBackToStep1}
        />
      )}
    </div>
  );
};