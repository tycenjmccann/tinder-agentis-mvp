import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHandler, HandlerDeps } from "../../../src/handlers/avatar/delete.js";
import { APIGatewayProxyEventV2 } from "../../../src/lib/types/index.js";

function makeEvent(overrides: Partial<APIGatewayProxyEventV2> = {}): APIGatewayProxyEventV2 {
  return {
    pathParameters: { userId: "user-123" },
    headers: {
      authorization: `Bearer ${makeToken("user-123")}`,
    },
    requestContext: {
      requestId: "req-abc-123",
      http: { method: "DELETE", path: "/api/users/user-123/avatar" },
    },
    ...overrides,
  };
}

function makeToken(sub: string): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub, iat: 1700000000 })).toString("base64url");
  const signature = Buffer.from("fake-signature").toString("base64url");
  return `${header}.${payload}.${signature}`;
}

function makeDeps(overrides: Partial<HandlerDeps> = {}): HandlerDeps {
  return {
    s3Client: { send: vi.fn().mockResolvedValue({}) } as any,
    ddbClient: {
      send: vi.fn().mockImplementation((command: any) => {
        if (command.constructor.name === "GetCommand") {
          return Promise.resolve({
            Item: {
              userId: "user-123",
              email: "test@example.com",
              displayName: "Test User",
              avatarUrl: "https://cdn.example.com/avatars/user-123/photo.jpg",
              avatarS3Key: "avatars/user-123/photo.jpg",
              createdAt: "2024-01-01T00:00:00.000Z",
              updatedAt: "2024-01-01T00:00:00.000Z",
            },
          });
        }
        return Promise.resolve({});
      }),
    } as any,
    bucketName: "test-avatars-bucket",
    tableName: "test-users-table",
    ...overrides,
  };
}

describe("DELETE /api/users/{userId}/avatar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 when no Authorization header present", async () => {
    const deps = makeDeps();
    const handler = createHandler(deps);
    const event = makeEvent({ headers: {} });

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body!);
    expect(body.error).toBe("UNAUTHORIZED");
    expect(body.message).toBe("You are not authorized to modify this user's avatar.");
  });

  it("returns 401 when token is malformed", async () => {
    const deps = makeDeps();
    const handler = createHandler(deps);
    const event = makeEvent({ headers: { authorization: "Bearer not-a-valid-jwt" } });

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body!);
    expect(body.error).toBe("UNAUTHORIZED");
  });

  it("returns 401 when token.sub doesn't match userId path param (IDOR prevention)", async () => {
    const deps = makeDeps();
    const handler = createHandler(deps);
    const event = makeEvent({
      headers: { authorization: `Bearer ${makeToken("other-user-456")}` },
    });

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
    const body = JSON.parse(result.body!);
    expect(body.error).toBe("UNAUTHORIZED");
    expect(body.message).toBe("You are not authorized to modify this user's avatar.");
  });

  it("returns 404 when user has no avatarS3Key (NO_AVATAR)", async () => {
    const deps = makeDeps({
      ddbClient: {
        send: vi.fn().mockResolvedValue({
          Item: {
            userId: "user-123",
            email: "test@example.com",
            displayName: "Test User",
            avatarUrl: null,
            avatarS3Key: null,
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        }),
      } as any,
    });
    const handler = createHandler(deps);
    const event = makeEvent();

    const result = await handler(event);

    expect(result.statusCode).toBe(404);
    const body = JSON.parse(result.body!);
    expect(body.error).toBe("NO_AVATAR");
    expect(body.message).toBe("User does not have a custom avatar to delete.");
  });

  it("returns 204 on successful deletion", async () => {
    const deps = makeDeps();
    const handler = createHandler(deps);
    const event = makeEvent();

    const result = await handler(event);

    expect(result.statusCode).toBe(204);
    expect(result.body).toBeUndefined();
  });

  it("returns 500 when S3 delete fails", async () => {
    const deps = makeDeps({
      s3Client: {
        send: vi.fn().mockRejectedValue(new Error("S3 access denied")),
      } as any,
    });
    const handler = createHandler(deps);
    const event = makeEvent();

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body!);
    expect(body.error).toBe("INTERNAL_ERROR");
    expect(body.message).toBe("An unexpected error occurred. Please try again.");
  });

  it("returns 500 when DynamoDB update fails", async () => {
    const ddbSend = vi.fn().mockImplementation((command: any) => {
      if (command.constructor.name === "GetCommand") {
        return Promise.resolve({
          Item: {
            userId: "user-123",
            email: "test@example.com",
            displayName: "Test User",
            avatarUrl: "https://cdn.example.com/avatars/user-123/photo.jpg",
            avatarS3Key: "avatars/user-123/photo.jpg",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        });
      }
      return Promise.reject(new Error("DynamoDB write failed"));
    });
    const deps = makeDeps({
      ddbClient: { send: ddbSend } as any,
    });
    const handler = createHandler(deps);
    const event = makeEvent();

    const result = await handler(event);

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body!);
    expect(body.error).toBe("INTERNAL_ERROR");
  });

  it("verifies S3 deleteObject is called with correct bucket and key", async () => {
    const s3Send = vi.fn().mockResolvedValue({});
    const deps = makeDeps({
      s3Client: { send: s3Send } as any,
    });
    const handler = createHandler(deps);
    const event = makeEvent();

    await handler(event);

    expect(s3Send).toHaveBeenCalledTimes(1);
    const command = s3Send.mock.calls[0][0];
    expect(command.input).toEqual({
      Bucket: "test-avatars-bucket",
      Key: "avatars/user-123/photo.jpg",
    });
  });

  it("verifies DynamoDB update sets avatarUrl and avatarS3Key to null", async () => {
    const ddbSend = vi.fn().mockImplementation((command: any) => {
      if (command.constructor.name === "GetCommand") {
        return Promise.resolve({
          Item: {
            userId: "user-123",
            email: "test@example.com",
            displayName: "Test User",
            avatarUrl: "https://cdn.example.com/avatars/user-123/photo.jpg",
            avatarS3Key: "avatars/user-123/photo.jpg",
            createdAt: "2024-01-01T00:00:00.000Z",
            updatedAt: "2024-01-01T00:00:00.000Z",
          },
        });
      }
      return Promise.resolve({});
    });
    const deps = makeDeps({
      ddbClient: { send: ddbSend } as any,
    });
    const handler = createHandler(deps);
    const event = makeEvent();

    await handler(event);

    expect(ddbSend).toHaveBeenCalledTimes(2);
    const updateCommand = ddbSend.mock.calls[1][0];
    expect(updateCommand.input.UpdateExpression).toBe(
      "SET avatarUrl = :null, avatarS3Key = :null, updatedAt = :now"
    );
    expect(updateCommand.input.ExpressionAttributeValues[":null"]).toBeNull();
    expect(updateCommand.input.ExpressionAttributeValues[":now"]).toBeDefined();
  });
});
