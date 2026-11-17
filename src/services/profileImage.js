import { Directory, File, Paths } from 'expo-file-system';

export function isProfileImagePersistent(uri) {
  return Boolean(uri?.includes('/profile-images/'));
}

export async function copyProfileImageToAppStorage(sourceUri, userId, mimeType) {
  const extension = mimeType?.includes('png') ? 'png' : mimeType?.includes('webp') ? 'webp' : 'jpg';
  const directory = new Directory(Paths.document, 'profile-images');
  if (!directory.exists) directory.create({ idempotent: true, intermediates: true });

  const destination = new File(directory, `${userId}-${Date.now()}.${extension}`);
  await new File(sourceUri).copy(destination);
  return destination.uri;
}
