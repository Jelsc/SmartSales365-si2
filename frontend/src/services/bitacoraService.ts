import axios from "axios";
import type { BitacoraLog } from "@/types/bitacora";
import { getApiBaseUrl } from "@/lib/api";

const API_URL = `${getApiBaseUrl()}/api/bitacora/`;

export interface PaginatedBitacora {
  count: number;
  next: string | null;
  previous: string | null;
  results: BitacoraLog[];
}

// page = número de página, search = texto a buscar
export const getBitacora = async (
  page = 1,
  search = "",
  rol = ""
): Promise<PaginatedBitacora> => {
  const response = await axios.get(API_URL, {
    params: { page, search, rol }, // ahora mandamos rol al backend
  });
  return response.data;
};