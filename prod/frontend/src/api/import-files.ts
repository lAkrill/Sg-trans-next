import { api } from "@/lib/api";

const IMPORT_FILES_ENDPOINT = "/api/ImportFiles/process-import-file";

export interface ImportFileProcessDetail {
  EquipmentTypeId?: string;
  Part_stamp?: string;
  Part_number?: string;
  Part_year?: string;
  status?: string;
}

export interface ImportFileProcessResponse {
  filename: string;
  content_type: string;
  size: number;
  fileType: string;
  dataType: string;
  status: string;
  message: string;
  statistics?: {
    total_processed: number;
    errors: number;
    success: number;
  };
  details?: ImportFileProcessDetail[];
}

export const importFilesApi = {
  processImportFile: async (
    file: File,
    fileType: "pdf" | "txt" = "pdf"
  ): Promise<ImportFileProcessResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);
    formData.append("dataType", "part");

    const response = await api.post<ImportFileProcessResponse>(IMPORT_FILES_ENDPOINT, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};
