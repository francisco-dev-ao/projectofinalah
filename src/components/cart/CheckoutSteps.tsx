
import React from "react";
import { Check } from "lucide-react";

interface CheckoutStepsProps {
  currentStep: number;
  totalSteps?: number;
  stepNames?: string[];
}

const CheckoutSteps = ({ currentStep, totalSteps = 2, stepNames }: CheckoutStepsProps) => {
  const defaultStepNames = ["Autenticação", "Pagamento"];
  const steps = stepNames || defaultStepNames;

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center space-x-8">
        {steps.map((stepName, index) => (
          <div key={index} className="flex items-center">
            <div className="flex items-center">
              <div
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${index < currentStep 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : index === currentStep 
                    ? 'bg-primary border-primary text-white' 
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                  }
                `}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </div>
              <div className="ml-3">
                <div
                  className={`
                    text-sm font-medium 
                    ${index <= currentStep ? 'text-gray-900' : 'text-gray-500'}
                  `}
                >
                  {stepName}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                  ml-8 w-20 h-0.5 
                  ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}
                `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CheckoutSteps;
