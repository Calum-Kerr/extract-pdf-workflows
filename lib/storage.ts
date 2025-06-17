import { createSupabaseClient, getSupabaseAdmin, STORAGE_BUCKETS } from './supabase'
import { v4 as uuidv4 } from 'uuid'

export interface FileUploadOptions {
  bucket: string
  path?: string
  upsert?: boolean
  contentType?: string
  metadata?: Record<string, any>
}

export interface FileDownloadOptions {
  bucket: string
  path: string
  transform?: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpeg' | 'png'
  }
}

export class StorageManager {
  protected supabase = createSupabaseClient()

  // Upload file to Supabase Storage
  async uploadFile(
    file: File | Blob,
    options: FileUploadOptions
  ): Promise<{ path: string; url: string }> {
    const { bucket, path, upsert = false, contentType, metadata } = options
    
    // Generate unique path if not provided
    const filePath = path || this.generateFilePath(file)
    
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert,
        contentType: contentType || (file as File).type,
        metadata,
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return {
      path: data.path,
      url: urlData.publicUrl,
    }
  }

  // Download file from Supabase Storage
  async downloadFile(options: FileDownloadOptions): Promise<Blob> {
    const { bucket, path, transform } = options

    let downloadPath = path
    
    // Apply transformations for images
    if (transform) {
      const params = new URLSearchParams()
      if (transform.width) params.set('width', transform.width.toString())
      if (transform.height) params.set('height', transform.height.toString())
      if (transform.quality) params.set('quality', transform.quality.toString())
      if (transform.format) params.set('format', transform.format)
      
      downloadPath = `${path}?${params.toString()}`
    }

    const { data, error } = await this.supabase.storage
      .from(bucket)
      .download(downloadPath)

    if (error) {
      throw new Error(`Download failed: ${error.message}`)
    }

    return data
  }

  // Get signed URL for private files
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn = 3600 // 1 hour default
  ): Promise<string> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)

    if (error) {
      throw new Error(`Failed to create signed URL: ${error.message}`)
    }

    return data.signedUrl
  }

  // Delete file from storage
  async deleteFile(bucket: string, path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .remove([path])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  // Move/rename file
  async moveFile(
    bucket: string,
    fromPath: string,
    toPath: string
  ): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .move(fromPath, toPath)

    if (error) {
      throw new Error(`Move failed: ${error.message}`)
    }
  }

  // Copy file
  async copyFile(
    bucket: string,
    fromPath: string,
    toPath: string
  ): Promise<void> {
    const { error } = await this.supabase.storage
      .from(bucket)
      .copy(fromPath, toPath)

    if (error) {
      throw new Error(`Copy failed: ${error.message}`)
    }
  }

  // List files in a directory
  async listFiles(
    bucket: string,
    path = '',
    options: {
      limit?: number
      offset?: number
      sortBy?: { column: string; order: 'asc' | 'desc' }
    } = {}
  ) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list(path, options)

    if (error) {
      throw new Error(`List failed: ${error.message}`)
    }

    return data
  }

  // Generate unique file path
  private generateFilePath(file: File | Blob): string {
    const id = uuidv4()
    const extension = file instanceof File 
      ? file.name.split('.').pop() 
      : 'bin'
    
    return `${id}.${extension}`
  }

  // Get file info
  async getFileInfo(bucket: string, path: string) {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .list('', {
        search: path
      })

    if (error) {
      throw new Error(`Failed to get file info: ${error.message}`)
    }

    return data.find(file => file.name === path.split('/').pop())
  }
}

// Document-specific storage operations
export class DocumentStorage extends StorageManager {
  // Upload PDF document
  async uploadDocument(
    file: File,
    userId: string,
    documentId: string
  ): Promise<{ documentPath: string; thumbnailPath?: string }> {
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const documentPath = `${userId}/${documentId}/${fileName}`

    // Upload main document
    await this.uploadFile(file, {
      bucket: STORAGE_BUCKETS.DOCUMENTS,
      path: documentPath,
      contentType: 'application/pdf',
    })

    return { documentPath }
  }

  // Upload document thumbnail
  async uploadThumbnail(
    thumbnailBlob: Blob,
    userId: string,
    documentId: string
  ): Promise<string> {
    const thumbnailPath = `${userId}/${documentId}/thumbnail.jpg`

    const { url } = await this.uploadFile(thumbnailBlob, {
      bucket: STORAGE_BUCKETS.THUMBNAILS,
      path: thumbnailPath,
      contentType: 'image/jpeg',
      upsert: true,
    })

    return url
  }

  // Upload signature
  async uploadSignature(
    signatureBlob: Blob,
    userId: string,
    signatureId: string
  ): Promise<string> {
    const signaturePath = `${userId}/${signatureId}.png`

    const { url } = await this.uploadFile(signatureBlob, {
      bucket: STORAGE_BUCKETS.SIGNATURES,
      path: signaturePath,
      contentType: 'image/png',
      upsert: true,
    })

    return url
  }

  // Create document version
  async createDocumentVersion(
    file: File,
    userId: string,
    documentId: string,
    versionNumber: number
  ): Promise<string> {
    const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const versionPath = `${userId}/${documentId}/versions/v${versionNumber}_${fileName}`

    await this.uploadFile(file, {
      bucket: STORAGE_BUCKETS.DOCUMENTS,
      path: versionPath,
      contentType: 'application/pdf',
    })

    return versionPath
  }

  // Get document download URL
  async getDocumentDownloadUrl(
    userId: string,
    documentId: string,
    fileName: string,
    expiresIn = 3600
  ): Promise<string> {
    const documentPath = `${userId}/${documentId}/${fileName}`
    return this.getSignedUrl(STORAGE_BUCKETS.DOCUMENTS, documentPath, expiresIn)
  }

  // Delete document and all related files
  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const basePath = `${userId}/${documentId}`
    
    // List all files for this document
    const files = await this.listFiles(STORAGE_BUCKETS.DOCUMENTS, basePath)
    
    // Delete all document files
    const filePaths = files.map(file => `${basePath}/${file.name}`)
    if (filePaths.length > 0) {
      const { error } = await this.supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .remove(filePaths)
      
      if (error) {
        throw new Error(`Failed to delete document files: ${error.message}`)
      }
    }

    // Delete thumbnail
    try {
      await this.deleteFile(STORAGE_BUCKETS.THUMBNAILS, `${basePath}/thumbnail.jpg`)
    } catch (error) {
      // Thumbnail might not exist, ignore error
    }
  }
}

// Admin storage operations (using service role)
export class AdminStorage {
  private getSupabase() {
    return getSupabaseAdmin()
  }

  // Get storage usage statistics
  async getStorageStats(userId?: string) {
    // This would require custom database functions or aggregation
    // For now, return placeholder data
    return {
      totalFiles: 0,
      totalSize: 0,
      bucketStats: {
        documents: { files: 0, size: 0 },
        thumbnails: { files: 0, size: 0 },
        signatures: { files: 0, size: 0 },
        avatars: { files: 0, size: 0 },
      }
    }
  }

  // Cleanup orphaned files
  async cleanupOrphanedFiles(): Promise<void> {
    // Implementation would involve:
    // 1. List all files in storage
    // 2. Check which files have corresponding database records
    // 3. Delete files without database records
    // This is a complex operation that should be run as a background job
  }

  // Migrate files between buckets
  async migrateFiles(
    fromBucket: string,
    toBucket: string,
    pathPattern: string
  ): Promise<void> {
    // Implementation for migrating files between buckets
    // Useful for reorganizing storage structure
  }
}

// Export instances
export const storageManager = new StorageManager()
export const documentStorage = new DocumentStorage()
export const adminStorage = new AdminStorage()
