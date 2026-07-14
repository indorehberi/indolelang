import { createAssetSchema, updateAssetSchema, getAssetsQuerySchema } from './assets.schema';

describe('asset category normalization', () => {
  it('normalizes uppercase category values for create requests', () => {
    const result = createAssetSchema.safeParse({
      body: {
        category: 'MOBIL',
        title: 'Mobil test',
        base_price: '1000000',
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.category).toBe('mobil');
    }
  });

  it('normalizes mixed-case category values for update requests', () => {
    const result = updateAssetSchema.safeParse({
      body: {
        category: 'ALAT BERAT',
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.body.category).toBe('alat_berat');
    }
  });

  it('normalizes category values from query params', () => {
    const result = getAssetsQuerySchema.safeParse({
      query: {
        category: 'MOTOR',
      },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query.category).toBe('motor');
    }
  });
});
