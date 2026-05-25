import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PhotoUploadModal from "./PhotoUploadModal";

const mockPresignResponse = {
  uploadUrl: "https://s3.example.com/upload?presigned=true",
  objectKey: "photos/user123/abc-def.jpg",
  cdnUrl: "https://cdn.example.com/photos/user123/abc-def.jpg",
};

describe("PhotoUploadModal", () => {
  let fetchCalls: { url: string; options: RequestInit }[];

  beforeEach(() => {
    fetchCalls = [];
    global.fetch = jest.fn(async (url: string, options?: RequestInit) => {
      fetchCalls.push({ url, options: options || {} });

      if (url === "/api/profile/photo/presign") {
        return new Response(JSON.stringify(mockPresignResponse), {
          status: 200,
        });
      }

      if (url === mockPresignResponse.uploadUrl) {
        return new Response(null, { status: 200 });
      }

      if (url === "/api/profile/photo/confirm") {
        const body = JSON.parse(options?.body as string);
        if (!body.objectKey) {
          return new Response(
            JSON.stringify({ error: "objectKey is required" }),
            { status: 400 }
          );
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      return new Response(null, { status: 404 });
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <PhotoUploadModal
        isOpen={false}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );
    expect(screen.queryByText("Upload Photo")).not.toBeInTheDocument();
  });

  it("renders when isOpen is true", () => {
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );
    expect(screen.getByText("Upload Photo")).toBeInTheDocument();
  });

  it("correctly destructures objectKey from presign response (not key)", async () => {
    const onSuccess = jest.fn();
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={onSuccess}
      />
    );

    const file = new File(["image-data"], "photo.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = await screen.findByText("Upload");
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(mockPresignResponse.cdnUrl);
    });
  });

  it("sends objectKey (not key) to the confirm endpoint", async () => {
    const onSuccess = jest.fn();
    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={onSuccess}
      />
    );

    const file = new File(["image-data"], "photo.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = await screen.findByText("Upload");
    fireEvent.click(uploadButton);

    await waitFor(() => {
      const confirmCall = fetchCalls.find(
        (c) => c.url === "/api/profile/photo/confirm"
      );
      expect(confirmCall).toBeDefined();

      const body = JSON.parse(confirmCall!.options.body as string);
      // TEAM-63: Verify objectKey is used, not key
      expect(body).toHaveProperty("objectKey", mockPresignResponse.objectKey);
      expect(body).not.toHaveProperty("key");
    });
  });

  it("handles presign failure gracefully", async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(async () => {
      return new Response(null, { status: 500 });
    });

    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    const file = new File(["image-data"], "photo.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = await screen.findByText("Upload");
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to get upload URL")
      ).toBeInTheDocument();
    });
  });

  it("handles confirm failure gracefully", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      async (url: string, options?: RequestInit) => {
        if (url === "/api/profile/photo/presign") {
          return new Response(JSON.stringify(mockPresignResponse), {
            status: 200,
          });
        }
        if (url === mockPresignResponse.uploadUrl) {
          return new Response(null, { status: 200 });
        }
        if (url === "/api/profile/photo/confirm") {
          return new Response(
            JSON.stringify({ error: "objectKey is required" }),
            { status: 400 }
          );
        }
        return new Response(null, { status: 404 });
      }
    );

    render(
      <PhotoUploadModal
        isOpen={true}
        onClose={jest.fn()}
        onSuccess={jest.fn()}
      />
    );

    const file = new File(["image-data"], "photo.jpg", { type: "image/jpeg" });
    const input = document.querySelector('input[type="file"]')!;
    fireEvent.change(input, { target: { files: [file] } });

    const uploadButton = await screen.findByText("Upload");
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to confirm upload")
      ).toBeInTheDocument();
    });
  });
});
