import { api } from "@/lib/api";

const IMPORT_FILES_ENDPOINT = "/api/ImportFiles/process-import-file";

export type ImportFileType = "pdf" | "txt" | "pdf2json";

export interface ImportFileProcessDetail {
  Id?: string;
  RailwayCisternsId?: string;
  DepotsId?: string;
  RepairTypesId?: string;
  DocumetnsId?: string | null;
  DocumetnDate?: string;
  Operation?: number | string;
  EquipmentTypeId?: string;
  DefectsId?: string;
  AdminOwnerId?: string;
  Part_stamp?: string;
  Part_number?: string;
  Part_year?: string;
  JobDepotsId?: string;
  JobDate?: string;
  JobTypeId?: string;
  ThicknessLeft?: string;
  ThicknessRight?: string;
  TruckType?: string | null;
  Notes?: string;
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
    fileType: ImportFileType = "pdf"
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
