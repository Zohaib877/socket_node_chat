import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createRequire } from "module";

// Use createRequire to import CommonJS modules in ES modules
const require = createRequire(import.meta.url);
const AWS = require("aws-sdk");

dotenv.config();
const disk = process.env.DISK || "uploads";

// Configure AWS S3 with MinIO compatibility
const s3Config = {
  endpoint: process.env.AWS_S3_ENDPOINT || "https://s3.amazonaws.com",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || "us-east-1",
  s3ForcePathStyle: true, // Required for MinIO
  signatureVersion: "v4", // Required for MinIO
};

// Only set sslEnabled to false if using http endpoint
if (s3Config.endpoint.startsWith("http://")) {
  s3Config.sslEnabled = false;
}

const s3 = new AWS.S3(s3Config);

const uploadMedia = async (req, folder, columnName) => {
  const __dirname = path.resolve();
  const parentDirectory = path.dirname(__dirname);
  const directory = `${parentDirectory}/${disk}/${folder}`;
  const file = req.files?.[columnName];
  if (file) {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }
    const mediaURL = `${Date.now()}-${file.name
      .replace(/ /g, "-")
      .toLowerCase()}`;
    const fileName = `${directory}/${mediaURL}`;
    let url = await file.mv(fileName);
    return `${folder}/${mediaURL}`;
  }
  return null;
};

/**
 * Upload file to S3
 * @param {Object} file - File object from express-fileupload
 * @param {string} folder - S3 folder/prefix
 * @param {string} bucketName - S3 bucket name (optional, uses env var if not provided)
 * @returns {Promise<string>} - Public URL of uploaded file
 */
const uploadToS3 = async (file, folder, bucketName = null) => {
  if (!file) {
    throw new Error("No file provided");
  }

  const bucket = bucketName || process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error("S3 bucket name not configured");
  }

  // Generate unique filename
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-").toLowerCase();
  const key = `${folder}/${timestamp}-${sanitizedName}`;

  const uploadParams = {
    Bucket: bucket,
    Key: key,
    Body: file.data,
    ContentType: file.mimetype,
    // ACL: "public-read", // Make file publicly accessible
  };

  try {
    await s3.upload(uploadParams).promise();
    console.log(process.env.S3_PUBLIC_URL);
    console.log("S3 upload successful:", key);

    // Return public URL using S3_PUBLIC_URL instead of S3 endpoint
    // const publicUrl = process.env.S3_PUBLIC_URL || process.env.AWS_S3_ENDPOINT;
    // return `${publicUrl}/${bucket}/${key}`;
    return `${key}`;
  } catch (error) {
    throw new Error(`S3 Upload failed: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} fileUrl - Full S3 URL or just the key
 * @param {string} bucketName - S3 bucket name (optional)
 * @returns {Promise<boolean>} - Success status
 */
const deleteFromS3 = async (fileUrl, bucketName = null) => {
  if (!fileUrl) return false;

  const bucket = bucketName || process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error("S3 bucket name not configured");
  }

  // Extract key from URL if full URL is provided
  let key = fileUrl;

  // Handle different URL formats
  if (fileUrl.includes("amazonaws.com")) {
    // AWS S3 format: https://bucket.s3.amazonaws.com/key or https://s3.amazonaws.com/bucket/key
    const urlParts = fileUrl.split("/");
    key = urlParts.slice(3).join("/");
  } else if (fileUrl.includes("://")) {
    // MinIO or custom endpoint format: http://service-minio:9000/bucket/key
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname
        .split("/")
        .filter((part) => part.length > 0);

      // Remove bucket name from path to get the key
      if (pathParts.length > 0 && pathParts[0] === bucket) {
        key = pathParts.slice(1).join("/");
      } else {
        // If bucket name is not in the path, use the entire path as key
        key = pathParts.join("/");
      }
    } catch (error) {
      console.error(`Failed to parse URL: ${fileUrl}`, error.message);
      return false;
    }
  }

  const deleteParams = {
    Bucket: bucket,
    Key: key,
  };

  try {
    await s3.deleteObject(deleteParams).promise();
    return true;
  } catch (error) {
    console.error(`S3 Delete failed: ${error.message}`);
    return false;
  }
};

/**
 * Upload media with fallback (S3 first, then local if S3 fails)
 * @param {Object} req - Express request object
 * @param {string} folder - Folder name
 * @param {string} columnName - Form field name
 * @param {boolean} useS3 - Whether to use S3 (default: true)
 * @returns {Promise<string>} - File URL
 */
const uploadMediaWithFallback = async (
  req,
  folder,
  columnName,
  useS3 = true
) => {
  const file = req.files?.[columnName];
  if (!file) return null;

  // Try S3 upload first if enabled
  if (useS3) {
    try {
      return await uploadToS3(file, folder);
    } catch (error) {
      console.warn(
        "S3 upload failed, falling back to local storage:",
        error.message
      );
    }
  } else {
    // Fallback to local storage
    return await uploadMedia(req, folder, columnName);
  }
};

export default {
  uploadMedia,
  uploadToS3,
  deleteFromS3,
  uploadMediaWithFallback,
};
