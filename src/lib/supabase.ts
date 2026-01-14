import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || "";
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "blog-images";

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Storage will not work.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload a base64 image to Supabase Storage
 * @param base64Data Data URL or raw base64 string
 * @param fileName Desired file name
 * @returns Public URL of the uploaded image
 */
export async function uploadBlogImage(base64Data: string, fileName: string): Promise<string | null> {
  try {
    // 1. Clean up base64 data
    const base64Content = base64Data.includes("base64,")
      ? base64Data.split("base64,")[1]
      : base64Data;

    // 2. Convert to Buffer
    const buffer = Buffer.from(base64Content, "base64");

    // 3. Generate a unique path to avoid collisions
    const timestamp = Date.now();
    const cleanFileName = fileName.replace(/[^a-z0-9.]/gi, "-").toLowerCase();
    const filePath = `articles/${timestamp}-${cleanFileName}`;

    // 4. Upload to Supabase
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: "image/png",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Supabase upload error:", error);
      return null;
    }

    // 5. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error in uploadBlogImage:", error);
    return null;
  }
}

/**
 * Download an image from a URL and upload to Supabase Storage
 * Used for permanently storing Google Places photos
 * @param imageUrl URL of the image to download
 * @param businessId ID of the business (used for folder organization)
 * @param index Index of the image (for naming)
 * @returns Public URL of the permanently stored image
 */
export async function uploadBusinessImage(
  imageUrl: string,
  businessId: string,
  index: number = 0
): Promise<string | null> {
  if (!supabaseUrl || !supabaseKey) {
    console.warn("[Supabase] Credentials missing, cannot upload business image");
    return null;
  }

  try {
    // 1. Download image from Google
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WaterDamageDirectory/1.0)",
      },
    });

    if (!response.ok) {
      console.error(`[Supabase] Failed to download image: ${response.status}`);
      return null;
    }

    // 2. Get the image as buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. Determine content type
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const extension = contentType.includes("png") ? "png" : "jpg";

    // 4. Create unique file path
    const timestamp = Date.now();
    const filePath = `business-images/${businessId}/${timestamp}-${index}.${extension}`;

    // 5. Upload to Supabase
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType,
        cacheControl: "31536000", // 1 year cache
        upsert: true, // Overwrite if exists
      });

    if (error) {
      console.error("[Supabase] Upload error:", error);
      return null;
    }

    // 6. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    console.log(`[Supabase] Uploaded business image: ${filePath}`);
    return publicUrl;
  } catch (error) {
    console.error("[Supabase] Error uploading business image:", error);
    return null;
  }
}

/**
 * Upload multiple Google photos to Supabase and return permanent URLs
 * @param photoReferences Google photo references
 * @param businessId Business ID for folder organization
 * @param maxPhotos Maximum number of photos to upload
 * @returns Array of permanent Supabase URLs
 */
export async function uploadBusinessPhotosToSupabase(
  photoReferences: string[],
  businessId: string,
  maxPhotos: number = 5
): Promise<string[]> {
  if (!supabaseUrl || !supabaseKey || photoReferences.length === 0) {
    return [];
  }

  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn("[Supabase] No Google API key, cannot fetch photos");
    return [];
  }

  const permanentUrls: string[] = [];
  const photosToProcess = photoReferences.slice(0, maxPhotos);

  for (let i = 0; i < photosToProcess.length; i++) {
    const photoRef = photosToProcess[i];

    // Build Google Photos URL
    const googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;

    try {
      // Download and upload to Supabase
      const supabaseUrl = await uploadBusinessImage(googlePhotoUrl, businessId, i);

      if (supabaseUrl) {
        permanentUrls.push(supabaseUrl);
      }

      // Small delay between uploads
      if (i < photosToProcess.length - 1) {
        await new Promise(r => setTimeout(r, 100));
      }
    } catch (error) {
      console.error(`[Supabase] Failed to upload photo ${i}:`, error);
    }
  }

  console.log(`[Supabase] Uploaded ${permanentUrls.length}/${photosToProcess.length} photos for business ${businessId}`);
  return permanentUrls;
}
