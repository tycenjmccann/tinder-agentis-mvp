import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { User } from "../types/index.js";
import { ApiError } from "../errors/api-error.js";

export async function getUserRecord(
  client: DynamoDBDocumentClient,
  tableName: string,
  userId: string
): Promise<User> {
  const result = await client.send(
    new GetCommand({
      TableName: tableName,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
    })
  );

  if (!result.Item) {
    throw new ApiError(404, "NOT_FOUND", "User not found.");
  }

  return result.Item as User;
}

export async function clearAvatarRecord(
  client: DynamoDBDocumentClient,
  tableName: string,
  userId: string
): Promise<void> {
  await client.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { PK: `USER#${userId}`, SK: "PROFILE" },
      UpdateExpression: "SET avatarUrl = :null, avatarS3Key = :null, updatedAt = :now",
      ExpressionAttributeValues: {
        ":null": null,
        ":now": new Date().toISOString(),
      },
    })
  );
}
