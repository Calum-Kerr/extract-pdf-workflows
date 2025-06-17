import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Get environment variables with proper error handling
const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  }
  return url
}

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  }
  return key
}

const getSupabaseServiceKey = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Service role key should only be accessed on the server side')
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  return key
}

// Client-side Supabase client (singleton)
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const createSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(
      getSupabaseUrl(),
      getSupabaseAnonKey()
    )
  }
  return supabaseInstance
}

// Default export for convenience
export const supabase = createSupabaseClient()

// Server component client
export const createSupabaseServerClient = () => {
  return createClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  )
}

// Admin client for server-side operations (lazy-loaded)
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null

export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('Admin client should only be used on the server side')
  }

  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient<Database>(
      getSupabaseUrl(),
      getSupabaseServiceKey(),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }

  return supabaseAdminInstance
}

// Storage bucket names
export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  THUMBNAILS: 'thumbnails',
  SIGNATURES: 'signatures',
  AVATARS: 'avatars'
} as const

// Helper functions for file operations
export const getPublicUrl = (bucket: string, path: string) => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

export const uploadFile = async (
  bucket: string,
  path: string,
  file: File | Blob,
  options?: { upsert?: boolean; contentType?: string }
) => {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      upsert: options?.upsert || false,
      contentType: options?.contentType || file.type
    })
  
  if (error) throw error
  return data
}

export const deleteFile = async (bucket: string, path: string) => {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
}

// Database helper functions
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

export const updateUserProfile = async (userId: string, updates: Partial<Database['public']['Tables']['profiles']['Update']>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const getUserDocuments = async (userId: string, limit = 50, offset = 0) => {
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      document_shares!inner(permission_level)
    `)
    .or(`user_id.eq.${userId},document_shares.shared_with.eq.${userId}`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  return data
}

export const getDocument = async (documentId: string, userId?: string) => {
  let query = supabase
    .from('documents')
    .select(`
      *,
      profiles(full_name, avatar_url),
      document_shares(shared_with, permission_level),
      annotations(*, profiles(full_name, avatar_url))
    `)
    .eq('id', documentId)
  
  if (userId) {
    query = query.or(`user_id.eq.${userId},is_public.eq.true,document_shares.shared_with.eq.${userId}`)
  } else {
    query = query.eq('is_public', true)
  }
  
  const { data, error } = await query.single()
  
  if (error) throw error
  return data
}

export const createDocument = async (document: Database['public']['Tables']['documents']['Insert']) => {
  const { data, error } = await supabase
    .from('documents')
    .insert(document)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const updateDocument = async (
  documentId: string, 
  updates: Database['public']['Tables']['documents']['Update']
) => {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export const deleteDocument = async (documentId: string) => {
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId)
  
  if (error) throw error
}

// Real-time subscriptions
export const subscribeToDocument = (
  documentId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`document:${documentId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'annotations',
        filter: `document_id=eq.${documentId}`
      },
      callback
    )
    .subscribe()
}

export const subscribeToUserDocuments = (
  userId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`user_documents:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'documents',
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe()
}
