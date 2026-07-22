"use client";

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '@/api/messages';
import type { CreateMessageDTO, UpdateMessageDTO } from '@/types/messages';

export const messagesKeys = {
  all: ['messages'] as const,
  byUser: (userId: string) => [...messagesKeys.all, 'byUser', userId] as const,
};

export const useMessagesByUser = (userId?: string) => {
  return useQuery({
    queryKey: messagesKeys.byUser(userId || ''),
    queryFn: () => messagesApi.getByUser(userId!),
    enabled: !!userId,
  });
};

export const useCreateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMessageDTO) => messagesApi.create(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: messagesKeys.all });
      queryClient.invalidateQueries({ queryKey: messagesKeys.byUser(variables.fromUserId) });
      queryClient.invalidateQueries({ queryKey: messagesKeys.byUser(variables.toUserId) });
    },
  });
};

export const useUpdateMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMessageDTO }) =>
      messagesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: messagesKeys.all });
    },
  });
};
