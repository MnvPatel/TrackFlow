import { v2 as cloudinary } from "cloudinary";

const resourceTypeFromMime = (mimetype: string): "image" | "video" => {
  if (mimetype.startsWith("video/")) return "video";
  return "image";
};

export interface UploadResult {
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
}

/**
 * Upload a file buffer to Cloudinary. Returns secure URL and type (IMAGE | VIDEO).
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  mimetype: string,
  folder = "task_submissions"
): Promise<UploadResult> {
  const resourceType = resourceTypeFromMime(mimetype);
  const dataUri = `data:${mimetype};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: resourceType,
    folder,
  });

  const mediaType = resourceType === "video" ? "VIDEO" : "IMAGE";
  return {
    mediaUrl: result.secure_url,
    mediaType,
  };
}
