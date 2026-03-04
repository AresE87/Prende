// src/components/ImageUpload.tsx
// Componente de upload drag & drop para fotos del espacio
// Máximo 12 fotos, 10MB cada una, JPG/PNG/WEBP

import { useState, useRef, useCallback, useId } from "react";
import {
  uploadMultipleImages,
  deleteSpaceImage,
  getTransformedImageUrl,
  extractStoragePath,
  validateFileCount,
  type UploadProgress,
} from "../lib/storage";

interface ImageUploadProps {
  spaceId:    string;
  photos:     string[];             // URLs actuales del espacio
  onChange:   (photos: string[]) => void;
  maxPhotos?: number;
}

export default function ImageUpload({
  spaceId,
  photos,
  onChange,
  maxPhotos = 12,
}: ImageUploadProps) {
  const inputId             = useId();
  const fileInputRef        = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging]   = useState(false);
  const [uploading, setUploading]     = useState<UploadProgress[]>([]);
  const [error, setError]             = useState<string | null>(null);

  // ── Handler central de archivos seleccionados ─────────────
  const processFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const fileArray = Array.from(files);

    const countError = validateFileCount(photos.length, fileArray.length);
    if (countError) {
      setError(countError);
      return;
    }

    setUploading(fileArray.map(f => ({ file: f, progress: 0, status: "uploading" as const })));

    const { successful, errors } = await uploadMultipleImages(
      spaceId,
      fileArray,
      (updates) => setUploading(updates)
    );

    if (errors.length > 0) {
      setError(`${errors.length} archivo(s) no se pudieron subir: ${errors.map(e => e.error).join(", ")}`);
    }

    if (successful.length > 0) {
      onChange([...photos, ...successful.map(r => r.url)]);
    }

    // Limpiar estado de carga después de un momento
    setTimeout(() => setUploading([]), 2000);
  }, [photos, spaceId, onChange]);

  // ── Drag & Drop ────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) processFiles(files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) processFiles(files);
    // Reset input para poder subir el mismo archivo de nuevo si se borra y se vuelve a agregar
    e.target.value = "";
  }, [processFiles]);

  // ── Borrar foto ────────────────────────────────────────────
  const handleDelete = useCallback(async (photoUrl: string, index: number) => {
    const storagePath = extractStoragePath(photoUrl);

    // Actualizar UI inmediatamente (optimistic)
    const newPhotos = photos.filter((_, i) => i !== index);
    onChange(newPhotos);

    // Borrar del storage en background
    if (storagePath) {
      try {
        await deleteSpaceImage(storagePath);
      } catch (err) {
        console.error("Error borrando imagen del storage:", err);
        // No revertir — la imagen ya no se muestra aunque siga en storage
      }
    }
  }, [photos, onChange]);

  // ── Reordenar (drag entre fotos) ──────────────────────────
  const handlePhotoReorder = useCallback((fromIndex: number, toIndex: number) => {
    const newPhotos = [...photos];
    const [moved]   = newPhotos.splice(fromIndex, 1);
    newPhotos.splice(toIndex, 0, moved);
    onChange(newPhotos);
  }, [photos, onChange]);

  const canAddMore = photos.length + uploading.filter(u => u.status === "uploading").length < maxPhotos;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ── Drop Zone ─────────────────────────────────────── */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border:       `2px dashed ${isDragging ? "#FF7820" : "rgba(255,255,255,0.15)"}`,
            borderRadius: 12,
            padding:      "32px 20px",
            textAlign:    "center",
            cursor:       "pointer",
            background:   isDragging ? "rgba(255,120,30,0.06)" : "rgba(255,255,255,0.02)",
            transition:   "all 0.2s ease",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
          <p style={{ margin: 0, fontSize: 14, color: "#888" }}>
            Arrastrá fotos acá o{" "}
            <span style={{ color: "#FF7820", textDecoration: "underline" }}>hacé click para seleccionar</span>
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 12, color: "#555" }}>
            JPG, PNG o WEBP · Máximo {maxPhotos} fotos · 10MB por foto
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 11, color: "#444" }}>
            {photos.length}/{maxPhotos} fotos cargadas
          </p>
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* ── Error ─────────────────────────────────────────── */}
      {error && (
        <div style={{
          background:   "rgba(255,92,92,0.1)",
          border:       "1px solid rgba(255,92,92,0.3)",
          borderRadius: 8,
          padding:      "10px 14px",
          fontSize:     13,
          color:        "#FF5C5C",
          display:      "flex",
          justifyContent: "space-between",
          alignItems:   "center",
        }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#FF5C5C", cursor: "pointer", fontSize: 16 }}>×</button>
        </div>
      )}

      {/* ── Progress de upload ─────────────────────────────── */}
      {uploading.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {uploading.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width:        40, height: 40, borderRadius: 6,
                background:   "rgba(255,255,255,0.05)",
                overflow:     "hidden", flexShrink: 0,
              }}>
                {item.url ? (
                  <img src={getTransformedImageUrl(item.url, "thumbnail")} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {item.status === "error" ? "❌" : "⏳"}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.file.name}
                </div>
                <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2 }}>
                  <div style={{
                    width:        `${item.progress}%`,
                    height:       "100%",
                    borderRadius: 2,
                    background:   item.status === "error"
                      ? "#FF5C5C"
                      : item.status === "done"
                      ? "#4CAF7D"
                      : "linear-gradient(90deg, #FF7820, #FFB347)",
                    transition:   "width 0.3s ease",
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Grid de fotos subidas ──────────────────────────── */}
      {photos.length > 0 && (
        <div style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap:                 10,
        }}>
          {photos.map((url, index) => (
            <PhotoTile
              key={url}
              url={url}
              index={index}
              isFirst={index === 0}
              onDelete={() => handleDelete(url, index)}
              onReorder={handlePhotoReorder}
              totalPhotos={photos.length}
            />
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <p style={{ margin: 0, fontSize: 11, color: "#555" }}>
          💡 La primera foto es la foto de portada. Podés arrastrar para reordenar.
        </p>
      )}
    </div>
  );
}

// ─── PHOTO TILE ──────────────────────────────────────────────

interface PhotoTileProps {
  url:         string;
  index:       number;
  isFirst:     boolean;
  onDelete:    () => void;
  onReorder:   (from: number, to: number) => void;
  totalPhotos: number;
}

function PhotoTile({ url, index, isFirst, onDelete, onReorder, totalPhotos }: PhotoTileProps) {
  const [isHovered, setIsHovered] = useState(false);
  const thumbnailUrl = getTransformedImageUrl(url, "thumbnail");

  return (
    <div
      draggable
      onDragStart={e => e.dataTransfer.setData("text/plain", String(index))}
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        const fromIndex = parseInt(e.dataTransfer.getData("text/plain"));
        if (fromIndex !== index) onReorder(fromIndex, index);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position:     "relative",
        aspectRatio:  "4/3",
        borderRadius: 8,
        overflow:     "hidden",
        cursor:       "grab",
        border:       `2px solid ${isFirst ? "#FF7820" : "transparent"}`,
      }}
    >
      <img
        src={thumbnailUrl}
        alt={`Foto ${index + 1}`}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        loading="lazy"
      />

      {/* Overlay en hover */}
      {isHovered && (
        <div style={{
          position:   "absolute", inset: 0,
          background: "rgba(0,0,0,0.5)",
          display:    "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            style={{
              background:   "rgba(255,92,92,0.9)",
              border:       "none",
              borderRadius: 6,
              padding:      "6px 10px",
              color:        "white",
              fontSize:     12,
              cursor:       "pointer",
            }}
          >
            Borrar
          </button>
        </div>
      )}

      {/* Badge de portada */}
      {isFirst && (
        <div style={{
          position:     "absolute", top: 6, left: 6,
          background:   "#FF7820",
          borderRadius: 4,
          padding:      "2px 6px",
          fontSize:     10,
          fontWeight:   700,
          color:        "#0D0A07",
        }}>
          PORTADA
        </div>
      )}

      {/* Número */}
      <div style={{
        position:     "absolute", bottom: 6, right: 6,
        background:   "rgba(0,0,0,0.6)",
        borderRadius: 4,
        padding:      "2px 5px",
        fontSize:     10,
        color:        "#888",
      }}>
        {index + 1}/{totalPhotos}
      </div>
    </div>
  );
}
