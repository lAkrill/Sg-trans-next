import { api } from '@/lib/api';
import type { CreateMessageDTO, MessageDTO, UpdateMessageDTO } from '@/types/messages';

export const messagesApi = {
  getByUser: async (userId: string): Promise<MessageDTO[]> => {
    const response = await api.get(`/api/Messages/byUser/${userId}`);
    return response.data;
  },

  create: async (data: CreateMessageDTO): Promise<MessageDTO> => {
    const response = await api.post('/api/Messages', data);
    return response.data;
  },

  update: async (id: string, data: UpdateMessageDTO): Promise<void> => {
    await api.put(`/api/Messages/${id}`, data);
  },
};
