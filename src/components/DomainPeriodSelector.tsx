
import { useState, FC } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { formatPrice } from '@/lib/utils';

interface DomainPeriodSelectorProps {
  basePrice: number;
  onPeriodChange: (years: number, price: number) => void;
  initialPeriod?: number;
  className?: string;
}

const DomainPeriodSelector: FC<DomainPeriodSelectorProps> = ({ 
  basePrice, 
  onPeriodChange,
  initialPeriod = 1,
  className = "" 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<number>(initialPeriod);

  // Calculate the price based on the period
  const calculatePrice = (years: number) => {
    let price = basePrice;
    // Apply discount for multi-year
    if (years === 2) price = basePrice * 2 * 0.95; // 5% off
    if (years === 3) price = basePrice * 3 * 0.9;  // 10% off
    if (years >= 5) price = basePrice * years * 0.8; // 20% off
    return Math.round(price); // Rounded to integer
  };

  const handlePeriodChange = (value: string) => {
    const years = parseInt(value, 10);
    setSelectedPeriod(years);
    const price = calculatePrice(years);
    onPeriodChange(years, price);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label htmlFor="domain-period" className="text-sm text-gray-700 block mb-1">
        Período de registro:
      </label>
      <Select 
        value={selectedPeriod.toString()} 
        onValueChange={handlePeriodChange}
      >
        <SelectTrigger id="domain-period" className="w-full">
          <SelectValue placeholder="Selecione o período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">1 ano ({formatPrice(calculatePrice(1))})</SelectItem>
          <SelectItem value="2">2 anos ({formatPrice(calculatePrice(2))})</SelectItem>
          <SelectItem value="3">3 anos ({formatPrice(calculatePrice(3))})</SelectItem>
          <SelectItem value="5">5 anos ({formatPrice(calculatePrice(5))})</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default DomainPeriodSelector;
