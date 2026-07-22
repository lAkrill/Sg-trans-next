import { api } from '@/lib/api';

export interface UploadFileResponse {
  directory: string;
  fileName: string;
}

export const filesApi = {
  upload: async (
    file: File,
    options?: { directory?: string; fileName?: string }
  ): Promise<UploadFileResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.directory) {
      formData.append('directory', options.directory);
    }
    if (options?.fileName) {
      formData.append('fileName', options.fileName);
    }

    const response = await api.post<UploadFileResponse>('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  download: async (fileName: string, directory?: string | null): Promise<Blob> => {
    const response = await api.get('/api/files/download', {
      params: {
        fileName,
        ...(directory ? { directory } : {}),
      },
      responseType: 'blob',
    });

    return response.data;
  },
};
