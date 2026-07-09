import { z } from 'zod';

export const createGallerySchema = z.object({
  image_url: z.string().min(1, 'URL gambar wajib diisi'),
});
