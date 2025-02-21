interface Company {
  id: number;
  name: string;
  status: string;
  rejection_reason: string | null;
  last_updated: string;
}

export interface ValidateCompanyResponse {
  message: string;
  company: Company;
}
