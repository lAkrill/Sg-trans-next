import { RailwayCisternListDTO } from "./cisterns";

export interface VesselDTO {
    id: string;
    serialNumber: string;
    buildDate: string;
    manufacturer:string;
    wagonModelId:string;
    pressure: number;
    capacity: number;
    railwayCisternListDto: RailwayCisternListDTO;
}

export interface VesselListDTO{
    id: string;
    serialNumber: string;
    buildDate: string;
    manufacturer:string;
    wagonModelId:string;
    pressure: number;
    capacity: number;
}

export interface VesselListWithCisternNumberDTO{
    id: string;
    serialNumber: string;
    buildDate: string;
    manufacturer:string;
    wagonModelId:string;
    pressure: number;
    capacity: number;
    railwayCisternIdAndNumberDto: { id: string; number: string };
}

export interface PaginatedVesselsResponse {
  vessels: VesselListWithCisternNumberDTO[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateVesselDTO{
    serialNumber: string;
    buildDate: string;
    manufacturer:string;
    wagonModelId:string;
    pressure: number;
    capacity: number;
    railwayCisternId: string;
}

export interface UpdateVesselDto{
    serialNumber: string;
    buildDate: string;
    manufacturer:string;
    wagonModelId:string;
    pressure: number;
    capacity: number;
    railwayCisternId: string;
}