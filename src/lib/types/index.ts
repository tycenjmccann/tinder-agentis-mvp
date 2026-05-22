export interface JwtPayload {
  sub: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface User {
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  avatarS3Key: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  requestId?: string;
}

export interface APIGatewayProxyEventV2 {
  pathParameters: { userId: string } | null;
  headers: Record<string, string>;
  requestContext: {
    requestId: string;
    http: { method: string; path: string };
  };
}

export interface APIGatewayProxyResultV2 {
  statusCode: number;
  headers?: Record<string, string>;
  body?: string;
}
