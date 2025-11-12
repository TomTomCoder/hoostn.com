# Supabase Storage Setup Guide

## Property Images Bucket Configuration

This document outlines the Supabase Storage configuration for the `property-images` bucket used in the Hoostn property management system.

---

## Bucket Overview

**Bucket Name:** `property-images`

**Purpose:** Store property images for the multi-tenant property management system with organization-based isolation.

**Access Type:** Public bucket with Row Level Security (RLS) policies

---

## Bucket Configuration

### 1. Create the Bucket

Navigate to **Storage** in your Supabase dashboard and create a new bucket with the following settings:

```sql
-- Via SQL
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);
```

**Via Supabase Dashboard:**
- Bucket Name: `property-images`
- Public Bucket: **Yes** (read access will be controlled by RLS)
- File Size Limit: **10 MB** (10485760 bytes)
- Allowed MIME Types: `image/jpeg`, `image/png`, `image/webp`

---

## Path Structure

All files MUST follow this path structure for proper organization and RLS:

```
{org_id}/properties/{property_id}/{filename}
```

### Examples:

```
550e8400-e29b-41d4-a716-446655440000/properties/660e8400-e29b-41d4-a716-446655440001/hero-image.jpg
550e8400-e29b-41d4-a716-446655440000/properties/660e8400-e29b-41d4-a716-446655440001/bedroom-1.jpg
550e8400-e29b-41d4-a716-446655440000/properties/660e8400-e29b-41d4-a716-446655440001/kitchen.webp
```

### Path Components:

1. **`{org_id}`**: Organization UUID (for multi-tenant isolation)
2. **`properties`**: Static segment indicating property images
3. **`{property_id}`**: Property UUID
4. **`{filename}`**: Original or sanitized filename with extension

---

## File Restrictions

### File Size Limit
- **Maximum:** 10 MB (10,485,760 bytes)
- **Recommended:** 2-5 MB per image (optimize before upload)

### Allowed MIME Types
- `image/jpeg` - JPEG images (.jpg, .jpeg)
- `image/png` - PNG images (.png)
- `image/webp` - WebP images (.webp)

**Note:** WebP is recommended for best compression and quality.

### Recommended Image Dimensions
- **Maximum:** 4000 x 3000 pixels
- **Recommended:** 2000 x 1500 pixels
- **Thumbnails:** 400 x 300 pixels (generate on client or via Edge Function)

---

## Row Level Security (RLS) Policies

### Storage Object Policies

#### 1. Public Read Access

**Policy Name:** `property_images_public_read`

**Operation:** SELECT

**Description:** Anyone can view images (for public property listings)

```sql
CREATE POLICY "property_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');
```

**Alternative (Authenticated Only):**

If you want to restrict viewing to authenticated users only:

```sql
CREATE POLICY "property_images_authenticated_read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'property-images');
```

---

#### 2. Authenticated Write (Organization-Scoped)

**Policy Name:** `property_images_org_write`

**Operations:** INSERT

**Description:** Authenticated users can upload images only to their organization's folder

```sql
CREATE POLICY "property_images_org_write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text
    FROM public.users
    WHERE id = auth.uid()
  )
);
```

**Explanation:**
- Users can only upload to paths starting with their `org_id`
- `storage.foldername(name)` extracts folder segments from path
- `[1]` gets the first segment (the org_id)

---

#### 3. Authenticated Update (Organization-Scoped)

**Policy Name:** `property_images_org_update`

**Operations:** UPDATE

**Description:** Users can update (replace) images in their organization's folder

```sql
CREATE POLICY "property_images_org_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text
    FROM public.users
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text
    FROM public.users
    WHERE id = auth.uid()
  )
);
```

---

#### 4. Authenticated Delete (Admin/Owner Only)

**Policy Name:** `property_images_admin_delete`

**Operations:** DELETE

**Description:** Only admins and owners can delete images

```sql
CREATE POLICY "property_images_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text
    FROM public.users
    WHERE id = auth.uid()
  )
  AND (
    SELECT role FROM public.users WHERE id = auth.uid()
  ) IN ('admin', 'owner')
);
```

---

## Setup SQL Script

Run this complete SQL script to set up the bucket and all policies:

```sql
-- ============================================================================
-- Supabase Storage Setup for Property Images
-- ============================================================================

-- Enable RLS on storage.objects (should already be enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "property_images_public_read" ON storage.objects;
DROP POLICY IF EXISTS "property_images_org_write" ON storage.objects;
DROP POLICY IF EXISTS "property_images_org_update" ON storage.objects;
DROP POLICY IF EXISTS "property_images_admin_delete" ON storage.objects;

-- Create bucket (idempotent - will not fail if bucket exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-images',
  'property-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Policy 1: Public read access
CREATE POLICY "property_images_public_read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'property-images');

-- Policy 2: Authenticated write (own org only)
CREATE POLICY "property_images_org_write"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text
    FROM public.users
    WHERE id = auth.uid()
  )
);

-- Policy 3: Authenticated update (own org only)
CREATE POLICY "property_images_org_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text
    FROM public.users
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text
    FROM public.users
    WHERE id = auth.uid()
  )
);

-- Policy 4: Admin/owner delete only
CREATE POLICY "property_images_admin_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'property-images'
  AND (storage.foldername(name))[1] = (
    SELECT org_id::text
    FROM public.users
    WHERE id = auth.uid()
  )
  AND (
    SELECT role FROM public.users WHERE id = auth.uid()
  ) IN ('admin', 'owner')
);
```

---

## Usage Examples

### JavaScript/TypeScript (Supabase Client)

#### Upload an Image

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function uploadPropertyImage(
  orgId: string,
  propertyId: string,
  file: File
): Promise<string> {
  // Validate file
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit')
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP allowed.')
  }

  // Sanitize filename
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${orgId}/properties/${propertyId}/${fileName}`

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('property-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    throw error
  }

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('property-images')
    .getPublicUrl(filePath)

  return publicUrl
}
```

#### Get Image URL

```typescript
function getPropertyImageUrl(storagePath: string): string {
  const { data } = supabase.storage
    .from('property-images')
    .getPublicUrl(storagePath)

  return data.publicUrl
}
```

#### Delete an Image

```typescript
async function deletePropertyImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('property-images')
    .remove([storagePath])

  if (error) {
    throw error
  }
}
```

#### List Images for a Property

```typescript
async function listPropertyImages(
  orgId: string,
  propertyId: string
): Promise<string[]> {
  const folderPath = `${orgId}/properties/${propertyId}`

  const { data, error } = await supabase.storage
    .from('property-images')
    .list(folderPath)

  if (error) {
    throw error
  }

  return data.map(file => `${folderPath}/${file.name}`)
}
```

---

## Database Integration

When uploading an image, also create a record in the `property_images` table:

```typescript
async function uploadAndRecordImage(
  propertyId: string,
  orgId: string,
  file: File,
  displayOrder: number = 0,
  isPrimary: boolean = false,
  altText?: string
) {
  // 1. Upload to storage
  const storagePath = await uploadPropertyImage(orgId, propertyId, file)

  // 2. Get image dimensions (optional)
  const dimensions = await getImageDimensions(file)

  // 3. Insert record into database
  const { data, error } = await supabase
    .from('property_images')
    .insert({
      property_id: propertyId,
      org_id: orgId,
      storage_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      width: dimensions?.width,
      height: dimensions?.height,
      display_order: displayOrder,
      is_primary: isPrimary,
      alt_text: altText
    })
    .select()
    .single()

  if (error) {
    // Rollback: delete uploaded file
    await deletePropertyImage(storagePath)
    throw error
  }

  return data
}

// Helper to get image dimensions
function getImageDimensions(file: File): Promise<{width: number, height: number}> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
```

---

## Image Optimization Recommendations

### Before Upload (Client-Side)

1. **Resize large images:**
   - Use libraries like `browser-image-compression` or `sharp` (Node.js)
   - Target: 2000px max width/height for full images
   - Target: 400px for thumbnails

2. **Convert to WebP:**
   - Best compression with high quality
   - Modern browser support is excellent
   - Fallback to JPEG if needed

3. **Compress images:**
   - JPEG: 80-85% quality is usually sufficient
   - PNG: Use tools like `pngquant` for compression
   - WebP: 80% quality recommended

### Example with `browser-image-compression`:

```typescript
import imageCompression from 'browser-image-compression'

async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 2,
    maxWidthOrHeight: 2000,
    useWebWorker: true,
    fileType: 'image/webp' // Convert to WebP
  }

  return await imageCompression(file, options)
}
```

---

## Security Considerations

### 1. Path Validation
Always validate that the org_id in the path matches the user's organization:

```typescript
function validateUploadPath(orgId: string, userOrgId: string): boolean {
  return orgId === userOrgId
}
```

### 2. File Type Validation
Validate MIME type on both client and server:

```typescript
function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp']
  return validTypes.includes(file.type)
}
```

### 3. File Size Validation
Check file size before upload:

```typescript
function isValidFileSize(file: File): boolean {
  const maxSize = 10 * 1024 * 1024 // 10MB
  return file.size <= maxSize
}
```

### 4. Filename Sanitization
Always sanitize filenames to prevent path traversal:

```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase()
}
```

---

## Monitoring and Maintenance

### Check Storage Usage

```sql
-- View storage usage by organization
SELECT
  (storage.foldername(name))[1] AS org_id,
  COUNT(*) AS file_count,
  SUM(metadata->>'size')::bigint AS total_bytes,
  ROUND(SUM((metadata->>'size')::bigint) / 1024.0 / 1024.0, 2) AS total_mb
FROM storage.objects
WHERE bucket_id = 'property-images'
GROUP BY (storage.foldername(name))[1]
ORDER BY total_bytes DESC;
```

### Find Large Files

```sql
-- Find files larger than 5MB
SELECT
  name,
  (metadata->>'size')::bigint AS size_bytes,
  ROUND((metadata->>'size')::bigint / 1024.0 / 1024.0, 2) AS size_mb,
  created_at
FROM storage.objects
WHERE bucket_id = 'property-images'
  AND (metadata->>'size')::bigint > 5242880
ORDER BY (metadata->>'size')::bigint DESC;
```

### Clean Up Orphaned Files

```sql
-- Find storage objects without database records
SELECT o.name, o.created_at
FROM storage.objects o
WHERE o.bucket_id = 'property-images'
  AND NOT EXISTS (
    SELECT 1
    FROM public.property_images pi
    WHERE pi.storage_path = o.name
  )
ORDER BY o.created_at DESC;
```

---

## Troubleshooting

### Common Issues

**Issue:** "new row violates row-level security policy"
- **Cause:** User trying to upload to wrong org folder or not authenticated
- **Solution:** Ensure path starts with user's org_id and user is authenticated

**Issue:** "File size exceeds limit"
- **Cause:** File larger than 10MB
- **Solution:** Compress image before upload

**Issue:** "Invalid MIME type"
- **Cause:** Unsupported file format
- **Solution:** Convert to JPEG, PNG, or WebP

**Issue:** "Access denied" when viewing image
- **Cause:** Bucket not public or RLS blocking access
- **Solution:** Verify bucket is public and SELECT policy exists

---

## Migration Checklist

- [ ] Create `property-images` bucket in Supabase dashboard
- [ ] Configure bucket settings (public, file size, MIME types)
- [ ] Run storage RLS policies SQL script
- [ ] Test upload with authenticated user
- [ ] Test public read access
- [ ] Test delete with admin user
- [ ] Implement client-side upload functions
- [ ] Add image compression/optimization
- [ ] Set up monitoring queries
- [ ] Document for team

---

## Additional Resources

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [RLS for Storage](https://supabase.com/docs/guides/storage/security/access-control)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)
