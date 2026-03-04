// src/lib/storage.ts
// Gestión de imágenes de espacios con Supabase Storage
//
// Bucket requerido: "spaces" (crear en Supabase Dashboard → Storage)
// Política del bucket: lectura pública, escritura solo para hosts autenticados

import { supabase } from "./supabase";

const SPACES_BUCKET    = "spaces";
const MAX_FILES        = 12;
const MAX_FILE_SIZE_MB = 10;
const ALLOWED_TYPES    = ["image/jpeg", "image/png", "image/webp"];

export interface UploadResult {
  url:        string;
  path:       string;
  width:      number;
  height:     number;
  sizeBytes:  number;
}

export interface UploadError {
  file: File;
  error: string;
}

export interface UploadProgress {
  file:     File;
  progress: number;   // 0-100
  status:   "uploading" | "done" | "error";
  url?:     string;
  error?:   string;
}

// ─── VALIDACIÓN ──────────────────────────────────────────────

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return `Formato no soportado: ${file.type}. Usá JPG, PNG o WEBP.`;
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    return `El archivo es demasiado grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máximo ${MAX_FILE_SIZE_MB}MB.`;
  }
  return null;
}

export function validateFileCount(existingCount: number, newCount: number): string | null {
  if (existingCount + newCount > MAX_FILES) {
    return `Máximo ${MAX_FILES} fotos por espacio. Tenés ${existingCount} y estás agregando ${newCount}.`;
  }
  return null;
}

// ─── UPLOAD INDIVIDUAL ───────────────────────────────────────

/**
 * Sube una imagen al bucket de Supabase Storage.
 * La path incluye el spaceId para organización y RLS.
 * Retorna la URL pública con transformaciones disponibles.
 */
export async function uploadSpaceImage(
  spaceId: string,
  file:    File,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const validationError = validateImageFile(file);
  if (validationError) throw new Error(validationError);

  // Generar path único: spaces/{spaceId}/{timestamp}-{random}.{ext}
  const ext      = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path     = `${spaceId}/${filename}`;

  // Supabase Storage no tiene progress events nativos — simular con timeout
  let progressInterval: ReturnType<typeof setInterval> | null = null;
  if (onProgress) {
    let fakeProgress = 0;
    progressInterval = setInterval(() => {
      fakeProgress = Math.min(fakeProgress + 15, 85);
      onProgress(fakeProgress);
    }, 200);
  }

  try {
    const { data, error } = await supabase.storage
      .from(SPACES_BUCKET)
      .upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (progressInterval) clearInterval(progressInterval);
    if (onProgress) onProgress(100);

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage
      .from(SPACES_BUCKET)
      .getPublicUrl(data.path);

    // Obtener dimensiones de la imagen
    const dimensions = await getImageDimensions(file);

    return {
      url:       urlData.publicUrl,
      path:      data.path,
      width:     dimensions.width,
      height:    dimensions.height,
      sizeBytes: file.size,
    };

  } catch (err) {
    if (progressInterval) clearInterval(progressInterval);
    throw err;
  }
}

// ─── UPLOAD MÚLTIPLE ─────────────────────────────────────────

/**
 * Sube múltiples imágenes en paralelo (máx 3 simultáneas para no saturar).
 * Retorna resultados exitosos y errores por separado.
 */
export async function uploadMultipleImages(
  spaceId:    string,
  files:      File[],
  onProgress?: (updates: UploadProgress[]) => void
): Promise<{ successful: UploadResult[]; errors: UploadError[] }> {
  const BATCH_SIZE  = 3;
  const successful: UploadResult[] = [];
  const errors:     UploadError[]  = [];

  // Estado de progreso para cada archivo
  const progressMap = new Map<string, UploadProgress>(
    files.map(f => [f.name, { file: f, progress: 0, status: "uploading" }])
  );

  const updateProgress = () => {
    if (onProgress) onProgress(Array.from(progressMap.values()));
  };

  // Procesar en batches para no saturar la red
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (file) => {
        try {
          const result = await uploadSpaceImage(spaceId, file, (progress) => {
            progressMap.set(file.name, { file, progress, status: "uploading" });
            updateProgress();
          });

          progressMap.set(file.name, { file, progress: 100, status: "done", url: result.url });
          updateProgress();
          successful.push(result);

        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Error desconocido";
          progressMap.set(file.name, { file, progress: 0, status: "error", error: errorMsg });
          updateProgress();
          errors.push({ file, error: errorMsg });
        }
      })
    );
  }

  return { successful, errors };
}

// ─── DELETE ──────────────────────────────────────────────────

export async function deleteSpaceImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(SPACES_BUCKET)
    .remove([path]);

  if (error) throw new Error(error.message);
}

// ─── URL CON TRANSFORMACIONES ────────────────────────────────
// Supabase Storage soporta transformaciones vía query params en el URL
// Docs: https://supabase.com/docs/guides/storage/serving/image-transformations

export type ImageSize = "thumbnail" | "medium" | "full";

const SIZE_CONFIG: Record<ImageSize, { width: number; height: number }> = {
  thumbnail: { width: 400,  height: 300  },
  medium:    { width: 800,  height: 600  },
  full:      { width: 1920, height: 1440 },
};

/**
 * Retorna la URL pública con transformación de tamaño.
 * Supabase aplica resize automático sin que el host haga nada.
 */
export function getTransformedImageUrl(publicUrl: string, size: ImageSize): string {
  const config = SIZE_CONFIG[size];

  // Supabase Storage transformation API
  const url = new URL(publicUrl);
  url.searchParams.set("width",  String(config.width));
  url.searchParams.set("height", String(config.height));
  url.searchParams.set("resize", "cover");
  url.searchParams.set("quality", size === "thumbnail" ? "70" : "85");

  return url.toString();
}

// ─── HELPERS ─────────────────────────────────────────────────

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ width: 0, height: 0 }); // No fallar por esto
    };
    img.src = url;
  });
}

/**
 * Extrae el path de Supabase Storage a partir de una URL pública.
 * Necesario para poder borrar la imagen.
 */
export function extractStoragePath(publicUrl: string): string | null {
  try {
    const url = new URL(publicUrl);
    // URL format: .../storage/v1/object/public/{bucket}/{path}
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}
