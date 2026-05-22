import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

export async function deleteFromS3(
  client: S3Client,
  bucket: string,
  key: string
): Promise<void> {
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
