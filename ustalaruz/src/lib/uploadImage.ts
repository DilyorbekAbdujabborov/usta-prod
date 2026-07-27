import { API_BASE, authFetch } from './api';

export type UploadFolder = 'avatars' | 'payments' | 'chat';

// Multipart upload straight to Django's /api/profile/upload/ (already used
// for avatars). This used to go through @vercel/blob/client with a
// handleUploadUrl pointing at a Vercel serverless function
// (api/blob-upload.ts) that no longer exists since the app moved to the
// Django backend - every caller (avatar picker, payment proof, chat images)
// was silently failing.
export async function uploadImageFile(
  file: File,
  folder: UploadFolder = 'avatars'
): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);

  const res = await authFetch(`${API_BASE}/api/profile/upload/`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Rasmni yuklashda xatolik yuz berdi.');
  }
  const data = await res.json();
  return data.url;
}
