import { z } from 'zod';

export const createGallerySchema = z.object({
  image_url: z.string().url('Format URL gambar tidak valid').min(1, 'URL gambar wajib diisi'),
});
