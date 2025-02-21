import { Company, PaginationResponse } from "@/shared/types";

export interface GetAllCompaniesResponse extends PaginationResponse {
  company_details: Company[];
}

export interface GetCatalogueCompaniesResponse extends PaginationResponse {
  data: Company[];
}
