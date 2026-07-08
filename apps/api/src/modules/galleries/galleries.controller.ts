import { Request, Response } from 'express';
import * as galleriesService from './galleries.service';

export const getPublicGalleries = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const per_page = parseInt(req.query.per_page as string) || 15;

    const result = await galleriesService.getGalleries(page, per_page);

    return res.status(200).json({
      success: true,
      data: result.data,
      message: 'Berhasil mengambil daftar gallery',
      meta: result.meta,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Terjadi kesalahan pada server',
        details: {},
      },
    });
  }
};

export const getAdminGalleries = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const per_page = parseInt(req.query.per_page as string) || 15;

    const result = await galleriesService.getGalleries(page, per_page);

    return res.status(200).json({
      success: true,
      data: result.data,
      message: 'Berhasil mengambil daftar gallery',
      meta: result.meta,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Terjadi kesalahan pada server',
        details: {},
      },
    });
  }
};

export const createGallery = async (req: Request, res: Response) => {
  try {
    const { image_url } = req.body;

    const gallery = await galleriesService.createGallery(image_url);

    return res.status(201).json({
      success: true,
      data: gallery,
      message: 'Gallery berhasil ditambahkan',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Terjadi kesalahan saat menambahkan gallery',
        details: {},
      },
    });
  }
};

export const deleteGallery = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedGallery = await galleriesService.deleteGallery(id);

    if (!deletedGallery) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'GALLERY_NOT_FOUND',
          message: 'Gallery tidak ditemukan',
          details: {},
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: deletedGallery,
      message: 'Gallery berhasil dihapus',
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Terjadi kesalahan saat menghapus gallery',
        details: {},
      },
    });
  }
};
