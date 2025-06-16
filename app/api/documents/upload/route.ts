import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, uploadFile, STORAGE_BUCKETS } from '@/lib/supabase'
import { PDFEngine } from '@/lib/pdf-engine'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user profile to check limits
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, storage_used, storage_limit')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Check file size limits based on subscription
    const maxFileSize = getMaxFileSize(profile.subscription_tier)
    if (file.size > maxFileSize) {
      return NextResponse.json(
        { error: `File size exceeds limit of ${formatBytes(maxFileSize)}` },
        { status: 400 }
      )
    }

    // Check storage limit
    if (profile.storage_used + file.size > profile.storage_limit) {
      return NextResponse.json(
        { error: 'Storage limit exceeded' },
        { status: 400 }
      )
    }

    // Process PDF to extract metadata
    const pdfEngine = new PDFEngine()
    const pdfInfo = await pdfEngine.loadPDF(file)
    
    // Generate thumbnail
    const thumbnailDataUrl = await pdfEngine.renderPageAsImage(1, 0.5, 'jpeg')
    const thumbnailBlob = dataURLtoBlob(thumbnailDataUrl)

    // Generate unique file paths
    const documentId = uuidv4()
    const fileName = `${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const documentPath = `${user.id}/${documentId}/${fileName}`
    const thumbnailPath = `${user.id}/${documentId}/thumbnail.jpg`

    // Upload PDF file
    const documentUpload = await uploadFile(
      STORAGE_BUCKETS.DOCUMENTS,
      documentPath,
      file,
      { contentType: 'application/pdf' }
    )

    // Upload thumbnail
    const thumbnailUpload = await uploadFile(
      STORAGE_BUCKETS.THUMBNAILS,
      thumbnailPath,
      thumbnailBlob,
      { contentType: 'image/jpeg' }
    )

    // Get thumbnail public URL
    const { data: thumbnailUrl } = supabase.storage
      .from(STORAGE_BUCKETS.THUMBNAILS)
      .getPublicUrl(thumbnailPath)

    // Create document record
    const { data: document, error: documentError } = await supabase
      .from('documents')
      .insert({
        id: documentId,
        user_id: user.id,
        title: title || file.name.replace('.pdf', ''),
        description: description || null,
        file_name: fileName,
        file_size: file.size,
        file_path: documentPath,
        page_count: pdfInfo.numPages,
        thumbnail_url: thumbnailUrl.publicUrl,
        processing_status: 'completed',
        metadata: {
          title: pdfInfo.title,
          author: pdfInfo.author,
          subject: pdfInfo.subject,
          creator: pdfInfo.creator,
          producer: pdfInfo.producer,
          creationDate: pdfInfo.creationDate,
          modificationDate: pdfInfo.modificationDate
        }
      })
      .select()
      .single()

    if (documentError) {
      // Clean up uploaded files if database insert fails
      await supabase.storage.from(STORAGE_BUCKETS.DOCUMENTS).remove([documentPath])
      await supabase.storage.from(STORAGE_BUCKETS.THUMBNAILS).remove([thumbnailPath])
      
      throw documentError
    }

    // Clean up PDF engine
    pdfEngine.dispose()

    // Log usage analytics
    await supabase
      .from('usage_analytics')
      .insert({
        user_id: user.id,
        action_type: 'document_upload',
        document_id: documentId,
        metadata: {
          file_size: file.size,
          page_count: pdfInfo.numPages,
          file_type: 'pdf'
        }
      })

    return NextResponse.json({
      success: true,
      document
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}

function getMaxFileSize(subscriptionTier: string): number {
  switch (subscriptionTier) {
    case 'pro':
      return 100 * 1024 * 1024 // 100MB
    case 'enterprise':
      return 1024 * 1024 * 1024 // 1GB
    default:
      return 10 * 1024 * 1024 // 10MB for free tier
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function dataURLtoBlob(dataURL: string): Blob {
  const arr = dataURL.split(',')
  const mime = arr[0].match(/:(.*?);/)![1]
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new Blob([u8arr], { type: mime })
}
