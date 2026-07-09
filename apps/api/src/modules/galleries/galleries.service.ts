import { prisma } from '../../config/database';

export const getGalleries = async (page: number, per_page: number) => {
  const skip = (page - 1) * per_page;

  const [total, data] = await Promise.all([
    prisma.galleries.count(),
    prisma.galleries.findMany({
      skip,
      take: per_page,
      orderBy: { created_at: 'desc' },
    }),
  ]);

  return {
    data,
    meta: {
      page,
      per_page,
      total,
    },
  };
};

export const createGallery = async (image_url: string) => {
  return prisma.galleries.create({
    data: {
      image_url,
    },
  });
};

export const deleteGallery = async (id: string) => {
  try {
    return await prisma.galleries.delete({
      where: { id },
    });
  } catch (error) {
    return null; // Return null if not found
  }
};
