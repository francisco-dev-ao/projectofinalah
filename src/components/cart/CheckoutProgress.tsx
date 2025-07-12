
import { FC } from 'react';

interface CheckoutProgressProps {
  currentStep: number;
  steps: Array<{
    id: number;
    name: string;
  }>;
}

const CheckoutProgress: FC<CheckoutProgressProps> = ({ currentStep, steps }) => {
  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center relative">
            <div 
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 text-sm font-medium
                ${currentStep >= step.id 
                  ? "bg-blue-600 text-white" 
                  : "bg-gray-200 text-gray-500"}`}
            >
              {step.id}
            </div>
            <span 
              className={`text-sm ${
                currentStep >= step.id ? "text-blue-600 font-medium" : "text-gray-500"
              }`}
            >
              {step.name}
            </span>
          </div>
        ))}
      </div>
      
      {/* Progress bar */}
      <div className="relative mt-4 h-1 bg-gray-200">
        <div 
          className="absolute h-1 bg-blue-600 transition-all duration-300"
          style={{ 
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`, 
          }}
        />
      </div>
    </div>
  );
};

export default CheckoutProgress;
