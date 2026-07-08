import Joi from 'joi';

export const createGallerySchema = Joi.object({
  image_url: Joi.string().uri().required().messages({
    'string.base': 'URL gambar harus berupa teks',
    'string.empty': 'URL gambar tidak boleh kosong',
    'string.uri': 'Format URL gambar tidak valid',
    'any.required': 'URL gambar wajib diisi',
  }),
});
