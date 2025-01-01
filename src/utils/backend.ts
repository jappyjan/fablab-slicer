import { Console } from "./console";

export interface BackendSuccessResponse<TData> {
  status: "success";
  data: TData;
}

export interface BackendErrorResponse {
  status: "error";
  error: string;
}

export type BackendResponse<TData> =
  | BackendSuccessResponse<TData>
  | BackendErrorResponse;

export type ErrorType = string | Error;
export function sendError(
  error: ErrorType | ErrorType[]
): BackendErrorResponse {
  Console.error(error);
  return {
    status: "error",
    error: Array.isArray(error) ? error.join("\n") : error.toString(),
  };
}

export function sendSuccess<TData>(data: TData): BackendSuccessResponse<TData> {
  Console.debug("Sending success", data);
  return {
    status: "success",
    data: data,
  };
}
