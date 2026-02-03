
import React, { useEffect, useState, useRef } from 'react';

interface PriceUpdateLabelProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  isPercent?: boolean;
}

const PriceUpdateLabel: React.FC<PriceUpdateLabelProps> = ({ value, prefix = '', suffix = '', className = '', isPercent = false }) => {
  const prevValue = useRef(value);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (value > prevValue.current) {
      setFlash('up');
      const timer = setTimeout(() => setFlash(null), 1000);
      return () => clearTimeout(timer);
    } else if (value < prevValue.current) {
      setFlash('down');
      const timer = setTimeout(() => setFlash(null), 1000);
      return () => clearTimeout(timer);
    }
    prevValue.current = value;
  }, [value]);

  const flashClasses = flash === 'up' 
    ? 'bg-green-500/20 text-green-400' 
    : flash === 'down' 
      ? 'bg-red-500/20 text-red-400' 
      : '';

  const formatValue = (val: number) => {
    if (isPercent) return val.toFixed(2) + '%';
    return val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <span className={`px-1.5 py-0.5 rounded transition-all duration-300 font-mono ${flashClasses} ${className}`}>
      {prefix}{formatValue(value)}{suffix}
    </span>
  );
};

export default PriceUpdateLabel;
