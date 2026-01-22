/**
 * AL File Upload API
 * 
 * POST: Upload files/images to AL for analysis
 * 
 * Supported file types:
 * - Images: jpg, jpeg, png, gif, webp, heic
 * - Documents: pdf
 * 
 * Files are stored in Supabase Storage (al-attachments bucket)
 * and metadata is stored in al_attachments table.
 */

import { NextResponse } from 'next/server';
import { createAuthenticatedClient, createServerSupabaseClient, getBearerToken } from '@/lib/supabaseServer';
import { errors } from '@/lib/apiErrors';

/**
 * Create Supabase client for route handlers (supports both cookie and Bearer token)
 */
async function createSupabaseClient(request) {
  const bearerToken = getBearerToken(request);
  return bearerToken 
    ? { supabase: createAuthenticatedClient(bearerToken), bearerToken }
    : { supabase: await createServerSupabaseClient(), bearerToken: null };
}

// File constraints
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = {
  // Images
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  // Documents
  'application/pdf': 'pdf'
};

/**
 * POST /api/al/upload
 * Upload file for AL analysis
 */
export async function POST(request) {
  try {
    const { supabase, bearerToken } = await createSupabaseClient(request);
    
    if (!supabase) {
      return errors.serviceUnavailable('Authentication service');
    }
    
    // Get current user
    const { data: { user }, error: authError } = bearerToken
      ? await supabase.auth.getUser(bearerToken)
      : await supabase.auth.getUser();
    
    if (authError || !user) {
      return errors.unauthorized();
    }
    
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file');
    const conversationId = formData.get('conversation_id');
    const messageId = formData.get('message_id');
    const context = formData.get('context'); // Optional context about what the file is
    
    if (!file) {
      return errors.missingField('file');
    }
    
    // Validate file type
    const fileType = file.type;
    if (!ALLOWED_TYPES[fileType]) {
      return NextResponse.json(
        { 
          error: 'Invalid file type',
          allowed: Object.keys(ALLOWED_TYPES)
        },
        { status: 400 }
      );
    }
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { 
          error: 'File too large',
          max_size_mb: MAX_FILE_SIZE / (1024 * 1024)
        },
        { status: 400 }
      );
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const ext = ALLOWED_TYPES[fileType];
    const filename = `${user.id}/${timestamp}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}.${ext}`;
    
    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('al-attachments')
      .upload(filename, buffer, {
        contentType: fileType,
        upsert: false
      });
    
    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      
      // Handle specific storage errors
      if (uploadError.message?.includes('bucket') || uploadError.statusCode === 400) {
        return NextResponse.json(
          { 
            error: 'Storage not configured. Please contact support.',
            details: uploadError.message
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('al-attachments')
      .getPublicUrl(filename);
    
    // Determine file category
    const isImage = fileType.startsWith('image/');
    const fileCategory = isImage ? 'image' : 'document';
    
    // Store metadata in database
    const { data: attachment, error: dbError } = await supabase
      .from('al_attachments')
      .insert({
        user_id: user.id,
        conversation_id: conversationId || null,
        message_id: messageId || null,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        storage_path: uploadData.path,
        public_url: publicUrl,
        file_category: fileCategory,
        analysis_context: context || null
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Error storing attachment metadata:', dbError);
      // Don't fail the request - file is uploaded, just metadata failed
    }
    
    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment?.id,
        file_name: file.name,
        file_type: fileType,
        file_size: file.size,
        file_category: fileCategory,
        public_url: publicUrl,
        storage_path: uploadData.path
      }
    });
  } catch (error) {
    console.error('AL upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/al/upload?conversation_id=xxx
 * Get attachments for a conversation
 */
export async function GET(request) {
  try {
    const supabase = await createSupabaseClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversation_id');
    
    // Build query
    let query = supabase
      .from('al_attachments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    }
    
    const { data: attachments, error } = await query.limit(50);
    
    if (error) {
      console.error('Error fetching attachments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attachments' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ attachments });
  } catch (error) {
    console.error('AL upload GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
