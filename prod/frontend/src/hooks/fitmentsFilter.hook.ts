import { useMutation } from '@tanstack/react-query';
import { fitmentsFilterApi } from '@/api/directories';
import type { FitmentFilterSortWithoutPaginationDTO } from '@/types/directories';

export const useFilterAllFitments = () => {
  return useMutation({
    mutationFn: (request: FitmentFilterSortWithoutPaginationDTO) => fitmentsFilterApi.filterAll(request),
  });
};
