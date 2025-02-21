import axios from "axios";
import { APIError } from "../type/type";

export function isAPIError(error: unknown): error is APIError {
  return (
    typeof error === "object" &&
    error !== null &&
    "detail" in error &&
    typeof (error as APIError).detail === "string"
  );
}

// Function to fetch the access token
export const getAccessToken = async (
  userRole: string
): Promise<string | null> => {
  try {
    const tokenResponse = await axios.get(
      `/api/get-cookie?tokenName=${userRole}`
    );
    return tokenResponse?.data?.cookies?.accessToken || null;
  } catch (error) {
    console.error("Failed to get access token:", error);
    return null;
  }
};
