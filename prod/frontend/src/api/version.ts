import { api } from "@/lib/api";

export interface VersionResponse {
  frontend: string;
  backend: string;
}

export const versionApi = {
  getVersion: async (): Promise<VersionResponse> => {
    const packageJson = await import("../../package.json");
    const frontendVersion = packageJson.version;
    
    const response = await api.get<{ backend: string }>("api/version");
    
    return {
      frontend: frontendVersion,
      backend: response.data.backend,
    };
  },
};
