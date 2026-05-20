import { useContext } from 'react';
import { PaymentContext } from '@/src/App';

export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayment must be used within PaymentContext provider');
  }
  return context;
};
