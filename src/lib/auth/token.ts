import { JwtPayload } from "../types/index.js";
import { ApiError } from "../errors/api-error.js";

export function extractToken(authorizationHeader: string | undefined): JwtPayload {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHORIZED", "You are not authorized to modify this user's avatar.");
  }

  const token = authorizationHeader.slice(7);
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new ApiError(401, "UNAUTHORIZED", "You are not authorized to modify this user's avatar.");
  }

  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (!payload.sub || typeof payload.sub !== "string") {
      throw new ApiError(401, "UNAUTHORIZED", "You are not authorized to modify this user's avatar.");
    }
    return payload as JwtPayload;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(401, "UNAUTHORIZED", "You are not authorized to modify this user's avatar.");
  }
}

export function authorizeUser(token: JwtPayload, userId: string): void {
  if (token.sub !== userId) {
    throw new ApiError(401, "UNAUTHORIZED", "You are not authorized to modify this user's avatar.");
  }
}
