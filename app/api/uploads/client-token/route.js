/**
 * Client Upload Token API
 * 
 * Generates a secure upload token for direct client-to-blob uploads.
 * This bypasses the 4.5MB serverless function limit.
 * 
 * POST /api/uploads/client-token
 * 
 * @route /api/uploads/client-token
 */

import { NextResponse } from 'next/server';

import { handleUpload } from '@vercel/blob/client';

import { errors } from '@/lib/apiErrors';
import { withErrorLogging } from '@/lib/serverErrorLogger';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';

/**
 * Get authenticated user from request (supports both cookie and Bearer token)
 */
async function getAuthenticatedUser(request) {
  const bearerToken = getBearerToken(request);
  const supabase = bearerToken 
    ? createAuthenticatedClient(bearerToken) 
    : await createServerSupabaseClient();

  if (!supabase) return null;

  const { data: { user } } = bearerToken
    ? await supabase.auth.getUser(bearerToken)
    : await supabase.auth.getUser();
  return user;
}

async function handlePost(request) {
  const body = await request.json();

  // Verify user is authenticated
  const user = await getAuthenticatedUser(request);
    if (!user) {
      return errors.unauthorized();
    }

    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate the upload request before generating token
        // pathname is the intended path in the blob store
        
        // Client sends: user-uploads/__USER__/filename.jpg or user-videos/__USER__/filename.jpg
        // We transform __USER__ to actual userId
        console.log(`[ClientUpload] Requested pathname: ${pathname}`);
        
        // Extract folder and filename
        const parts = pathname.split('/');
        if (parts.length !== 3) {
          console.error(`[ClientUpload] Invalid path format: ${pathname}`);
          throw new Error('Invalid upload path format');
        }
        
        const [folder, placeholder, filename] = parts;
        
        // Validate folder
        if (folder !== 'user-uploads' && folder !== 'user-videos') {
          console.error(`[ClientUpload] Invalid folder: ${folder}`);
          throw new Error('Invalid upload folder');
        }
        
        // Validate placeholder
        if (placeholder !== '__USER__') {
          console.error(`[ClientUpload] Invalid placeholder: ${placeholder}`);
          throw new Error('Invalid upload path');
        }
        
        // Replace placeholder with actual user ID
        const validatedPathname = `${folder}/${user.id}/${filename}`;
        console.log(`[ClientUpload] Validated pathname: ${validatedPathname}`);

        return {
          allowedContentTypes: [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/gif',
            'video/mp4',
            'video/webm',
            'video/quicktime',
          ],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB - generous for videos
          tokenPayload: JSON.stringify({
            userId: user.id,
          }),
          // Override the pathname with the validated one
          pathname: validatedPathname,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload: _tokenPayload }) => {
        // Called after successful upload
        // Log for debugging - actual DB save happens in the client callback
        console.log(`[ClientUpload] Completed: pathname=${blob.pathname}, url=${blob.url}`);
        
        // Note: We don't save to DB here because we can't return data to client
        // The client will call /api/uploads/save-metadata to save metadata
      },
    });

    return NextResponse.json(jsonResponse);
}

// Export wrapped handler with error logging
export const POST = withErrorLogging(handlePost, { route: 'uploads/client-token', feature: 'uploads' });
