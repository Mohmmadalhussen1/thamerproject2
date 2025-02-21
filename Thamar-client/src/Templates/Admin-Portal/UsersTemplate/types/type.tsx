import { PaginationResponse, User } from "@/shared/types";

export interface GetAllUsers extends PaginationResponse {
  data: User[];
}
