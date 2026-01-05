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
