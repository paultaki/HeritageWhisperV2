# Make Demo Files Public

## Steps to Make Supabase Storage Public

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/tjycibrhoammxohemyhq/storage/buckets

2. **Click on `heritage-whisper-files` bucket**

3. **Make specific folders public:**
   - Create a new policy for public read access
   - Or make the entire bucket public (less secure)

4. **Update the export script** to use public URLs instead of signed URLs

## SQL to Create Public Policy

```sql
-- Allow public read access to demo user's files
CREATE POLICY "Public read access for demo files"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'heritage-whisper-files' AND
  (storage.foldername(name))[1] = '38ad3036-e423-4e41-a3f3-020664a1ee0e'
);
```

This makes ONLY the demo user's files public, not all files.
