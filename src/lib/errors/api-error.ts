import { APIGatewayProxyResultV2, ErrorResponse } from "../types/index.js";

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function buildErrorResponse(
  error: ApiError,
  requestId?: string
): APIGatewayProxyResultV2 {
  const body: ErrorResponse = {
    error: error.code,
    message: error.message,
  };
  if (requestId) {
    body.requestId = requestId;
  }
  return {
    statusCode: error.statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export function buildInternalErrorResponse(
  requestId?: string
): APIGatewayProxyResultV2 {
  const body: ErrorResponse = {
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred. Please try again.",
  };
  if (requestId) {
    body.requestId = requestId;
  }
  return {
    statusCode: 500,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
