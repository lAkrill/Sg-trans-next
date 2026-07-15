import { useQuery } from '@tanstack/react-query';
import { fitmentsApi } from '@/api/directories';
import type { FitmentDTO } from '@/types/directories';

// Hooks
export const useFitments = () => {
  return useQuery({
    queryKey: ['fitments'],
    queryFn: () => fitmentsApi.getAll(),
  });
};