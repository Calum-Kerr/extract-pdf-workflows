# Supabase Setup Guide for PDF Pro

This guide will walk you through setting up a new Supabase project for the PDF Pro application.

## 1. Create New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `pdf-pro-app` (or your preferred name)
   - **Database Password**: Generate a strong password and save it securely
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Start with Free tier, upgrade as needed

## 2. Configure Project Settings

### Database Configuration

1. Go to **Settings** → **Database**
2. Note down your connection details:
   - **Host**: `db.xxx.supabase.co`
   - **Database name**: `postgres`
   - **Port**: `5432`
   - **User**: `postgres`

### API Configuration

1. Go to **Settings** → **API**
2. Copy the following values for your `.env.local`:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Keys**:
     - **anon/public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role**: `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)
   - **Project Reference ID**: `SUPABASE_PROJECT_ID`

## 3. Set Up Database Schema

### Option A: Using Supabase Dashboard (Recommended)

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy and paste the entire content from `database/supabase-schema.sql`
4. Click "Run" to execute the schema

### Option B: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize Supabase in your project
supabase init

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_ID

# Push the schema
supabase db push
```

## 4. Configure Storage Buckets

1. Go to **Storage** in your Supabase dashboard
2. Create the following buckets:

### Documents Bucket
- **Name**: `documents`
- **Public**: `false` (private bucket)
- **File size limit**: `100MB` (adjust based on your needs)
- **Allowed MIME types**: `application/pdf`

### Thumbnails Bucket
- **Name**: `thumbnails`
- **Public**: `true` (for fast loading)
- **File size limit**: `5MB`
- **Allowed MIME types**: `image/jpeg,image/png,image/webp`

### Signatures Bucket
- **Name**: `signatures`
- **Public**: `false` (private bucket)
- **File size limit**: `2MB`
- **Allowed MIME types**: `image/png,image/svg+xml`

### Avatars Bucket
- **Name**: `avatars`
- **Public**: `true`
- **File size limit**: `2MB`
- **Allowed MIME types**: `image/jpeg,image/png,image/webp`

## 5. Configure Storage Policies

For each bucket, set up the following RLS policies:

### Documents Bucket Policies

```sql
-- Allow users to upload their own documents
CREATE POLICY "Users can upload own documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to view their own documents and shared documents
CREATE POLICY "Users can view own and shared documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'documents' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.document_shares ds
      JOIN public.documents d ON d.id::text = (storage.foldername(name))[2]
      WHERE ds.document_id = d.id AND ds.shared_with = auth.uid()
    )
  )
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
FOR DELETE USING (
  bucket_id = 'documents' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Thumbnails Bucket Policies

```sql
-- Allow authenticated users to upload thumbnails
CREATE POLICY "Authenticated users can upload thumbnails" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'thumbnails' AND 
  auth.role() = 'authenticated'
);

-- Allow public read access to thumbnails
CREATE POLICY "Public read access to thumbnails" ON storage.objects
FOR SELECT USING (bucket_id = 'thumbnails');
```

## 6. Configure Authentication

### Email Authentication

1. Go to **Authentication** → **Settings**
2. Configure **Site URL**: `http://localhost:3000` (development) or your production URL
3. Add **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-production-domain.com/auth/callback`

### Social Authentication (Optional)

#### Google OAuth
1. Go to **Authentication** → **Providers**
2. Enable **Google**
3. Add your Google OAuth credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console

#### GitHub OAuth
1. Enable **GitHub**
2. Add your GitHub OAuth app credentials:
   - **Client ID**: From GitHub Developer Settings
   - **Client Secret**: From GitHub Developer Settings

## 7. Configure Email Templates

1. Go to **Authentication** → **Email Templates**
2. Customize the following templates:
   - **Confirm signup**
   - **Invite user**
   - **Magic link**
   - **Change email address**
   - **Reset password**

## 8. Set Up Realtime

1. Go to **Database** → **Replication**
2. Enable realtime for the following tables:
   - `documents`
   - `annotations`
   - `document_shares`
   - `processing_jobs`

## 9. Configure Edge Functions (Optional)

For advanced PDF processing, you can set up Edge Functions:

```bash
# Create a new Edge Function
supabase functions new pdf-processor

# Deploy the function
supabase functions deploy pdf-processor
```

## 10. Environment Variables

Add these to your `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id
```

## 11. Test the Setup

1. Start your development server:
```bash
npm run dev
```

2. Try the following operations:
   - User registration
   - User login
   - File upload
   - Database queries

## 12. Production Considerations

### Security
- Enable **RLS** on all tables
- Review and test all **RLS policies**
- Use **service role key** only on the server side
- Enable **email confirmations** for production

### Performance
- Set up **database indexes** for frequently queried columns
- Configure **connection pooling** if needed
- Monitor **database performance** in the dashboard

### Backup
- Enable **automatic backups** in Settings → Database
- Set up **point-in-time recovery** for critical data

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure all tables have proper RLS policies
2. **Storage Upload Errors**: Check bucket policies and file size limits
3. **Authentication Issues**: Verify redirect URLs and provider settings
4. **Connection Errors**: Check if your IP is whitelisted (if using IP restrictions)

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)

---

Your Supabase backend is now ready for the PDF Pro application!
