/**
 * ASCII-safe filename for multipart uploads (avoids broken multipart / multer issues from odd OS paths).
 */
export function safeImageFileName(file) {
    if (!(file instanceof File)) return `upload-${Date.now()}.bin`
    const fromName = file.name?.match(/\.([a-zA-Z0-9]+)$/)?.[1]
    const fromType = String(file.type || '').toLowerCase()
    let ext = fromName?.toLowerCase()
    if (!ext || !/^(png|jpe?g|webp|gif)$/.test(ext)) {
        if (fromType === 'image/png') ext = 'png'
        else if (fromType === 'image/jpeg' || fromType === 'image/jpg') ext = 'jpg'
        else if (fromType === 'image/webp') ext = 'webp'
        else if (fromType === 'image/gif') ext = 'gif'
        else ext = 'png'
    }
    if (ext === 'jpeg') ext = 'jpg'
    return `item-${Date.now()}.${ext}`
}
