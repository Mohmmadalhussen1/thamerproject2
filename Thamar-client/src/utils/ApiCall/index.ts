import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

interface ApiClientOptions<TRequest = unknown> {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  data?: TRequest; // Data to send with the request
  headers?: Record<string, string>; // Additional headers
}

/**
 * A generic function for making API calls with Axios in TypeScript
 * @param {ApiClientOptions<TRequest>} options - The API call configuration.
 * @returns {Promise<TResponse>} - The API response data.
 */
export async function apiClient<TRequest = unknown, TResponse = unknown>(
  options: ApiClientOptions<TRequest>
): Promise<TResponse> {
  const { url, method = "GET", data, headers } = options;

  const defaultHeaders = {
    "Content-Type": "application/json",
  };
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const config: AxiosRequestConfig<TRequest> = {
    url: `${baseUrl}${url}`,
    method,
    data,
    headers: { ...defaultHeaders, ...headers },
  };
  console.log("🚀 ~ config:", config);

  try {
    const response: AxiosResponse<TResponse> = await axios(config);
    return response.data; // Return the response data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("API Client Error:", error.response?.data || error.message);
      throw error.response?.data || { message: error.message };
    }
    throw { message: "An unexpected error occurred" };
  }
}
