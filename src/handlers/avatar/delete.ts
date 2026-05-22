import { S3Client } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "../../lib/types/index.js";
import { extractToken, authorizeUser } from "../../lib/auth/token.js";
import { ApiError, buildErrorResponse, buildInternalErrorResponse } from "../../lib/errors/api-error.js";
import { getUserRecord, clearAvatarRecord } from "../../lib/services/user-service.js";
import { deleteFromS3 } from "../../lib/services/storage-service.js";

const s3Client = new S3Client({});
const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export interface HandlerDeps {
  s3Client: S3Client;
  ddbClient: DynamoDBDocumentClient;
  bucketName: string;
  tableName: string;
}

export function createHandler(deps: HandlerDeps) {
  return async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
    const requestId = event.requestContext.requestId;

    try {
      const userId = event.pathParameters?.userId;
      if (!userId) {
        throw new ApiError(400, "BAD_REQUEST", "Missing userId path parameter.");
      }

      const token = extractToken(event.headers["authorization"]);
      authorizeUser(token, userId);

      console.log(JSON.stringify({
        action: "avatar_delete_initiated",
        userId,
        requestId,
        timestamp: new Date().toISOString(),
      }));

      const user = await getUserRecord(deps.ddbClient, deps.tableName, userId);

      if (!user.avatarS3Key) {
        throw new ApiError(404, "NO_AVATAR", "User does not have a custom avatar to delete.");
      }

      try {
        await deleteFromS3(deps.s3Client, deps.bucketName, user.avatarS3Key);
      } catch (e) {
        console.log(JSON.stringify({
          action: "avatar_delete_s3_failed",
          userId,
          requestId,
          error: e instanceof Error ? e.message : "Unknown error",
          timestamp: new Date().toISOString(),
        }));
        throw new ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again.");
      }

      try {
        await clearAvatarRecord(deps.ddbClient, deps.tableName, userId);
      } catch (e) {
        console.log(JSON.stringify({
          action: "avatar_delete_dynamodb_failed",
          userId,
          requestId,
          error: e instanceof Error ? e.message : "Unknown error",
          timestamp: new Date().toISOString(),
        }));
        throw new ApiError(500, "INTERNAL_ERROR", "An unexpected error occurred. Please try again.");
      }

      console.log(JSON.stringify({
        action: "avatar_delete_completed",
        userId,
        requestId,
        timestamp: new Date().toISOString(),
      }));

      return { statusCode: 204 };
    } catch (error) {
      if (error instanceof ApiError) {
        return buildErrorResponse(error, requestId);
      }
      console.log(JSON.stringify({
        action: "avatar_delete_unexpected_error",
        requestId,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }));
      return buildInternalErrorResponse(requestId);
    }
  };
}

export const handler = createHandler({
  s3Client,
  ddbClient,
  bucketName: process.env.AVATARS_BUCKET_NAME!,
  tableName: process.env.USERS_TABLE_NAME!,
});
