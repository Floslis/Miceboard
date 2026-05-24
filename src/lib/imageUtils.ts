// ─────────────────────────────────────────────────────────────
// MicBoard – Image Utilities
// Client-side image compression and format conversion
// ─────────────────────────────────────────────────────────────

/** Convert a File to a WebP base64 string, with optional resize */
export async function fileToWebP(
  file: File,
  maxDimension = 800,
  quality = 0.82,
): Promise<{ base64: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = fitDimensions(img.naturalWidth, img.naturalHeight, maxDimension)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)

      const dataUrl = canvas.toDataURL('image/webp', quality)
      const base64 = dataUrl.split(',')[1]
      resolve({ base64, width, height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

/** Convert a File to a base64 string (no format conversion) */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/** Scale dimensions so the longest edge <= maxDimension */
function fitDimensions(
  w: number,
  h: number,
  max: number,
): { width: number; height: number } {
  if (w <= max && h <= max) return { width: w, height: h }
  if (w >= h) {
    return { width: max, height: Math.round((h / w) * max) }
  }
  return { width: Math.round((w / h) * max), height: max }
}

/** Build a CSS background-position string from x/y percentages (0–100) */
export function positionToCss(x = 50, y = 30): string {
  return `${x}% ${y}%`
}

/** Build a CSS background-size string from a scale factor */
export function scaleToCss(scale = 1.1): string {
  return `${Math.round(scale * 100)}%`
}

/** Generate a unique file name for an uploaded image */
export function generateImageFilename(userId: string, ext = 'webp'): string {
  return `images/${userId}.${ext}`
}

/** Check if a file is a supported image type */
export function isValidImageFile(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)
}
