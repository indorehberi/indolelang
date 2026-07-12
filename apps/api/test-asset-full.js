const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const user = await prisma.users.findFirst();
    if (!user) { console.log('No user'); return; }
    
    const data = {
      provider_id: user.id,
      category: 'mobil',
      title: 'A',
      base_price: '100',
      description: '',
      inspection_date: '2026-07-12T00:00:00Z',
      inspection_pic_name: 'A',
      grade_interior: 'A',
      grade_exterior: 'A',
      grade_engine: 'A',
      inspection_doc_url: '',
      brand: 'A',
      model: 'A',
      color: '',
      fuel_type: 'Bensin',
      transmission: 'Otomatis',
      body_type: '',
      year: '2026',
      odometer: '',
      cylinder: '',
      police_number: 'A',
      bpkb_number: '',
      frame_number: '',
      engine_number: '',
      doc_stnk: false,
      doc_bpkb: false,
      doc_faktur: false,
      doc_kwitansi: false,
      doc_form_a: false,
      doc_copy_ktp: false,
      doc_keur: false,
      doc_sph: false,
      photo_front: '',
      photo_back: '',
      photo_right: '',
      photo_left: '',
      photo_engine: '',
      photo_interior: '',
      photo_stnk: ''
    };
    
    // Simulate what assets.service.ts does
    const asset = await prisma.assets.create({
      data: {
        provider_id: data.provider_id,
        category: data.category,
        title: data.title,
        description: data.description || null,
        base_price: new (require('@prisma/client').Prisma.Decimal)(data.base_price),
        images: data.images ? (typeof data.images === 'string' ? data.images : JSON.stringify(data.images)) : '{}',
        status: 'pending',

        brand: data.brand || null,
        model: data.model || null,
        color: data.color || null,
        fuel_type: data.fuel_type || null,
        transmission: data.transmission || null,
        body_type: data.body_type || null,
        year: data.year ? parseInt(data.year) : null,
        police_number: data.police_number || null,
        bpkb_number: data.bpkb_number || null,
        frame_number: data.frame_number || null,
        cylinder: data.cylinder ? parseInt(data.cylinder) : null,
        odometer: data.odometer ? parseInt(data.odometer) : null,
        
        is_recommended: data.is_recommended === true || data.is_recommended === 'true' ? true : false,
        engine_number: data.engine_number || null,
        created_by_admin: data.created_by_admin || false,
        
        stnk_date: data.stnk_date ? new Date(data.stnk_date) : null,
        stnk_tax_date: data.stnk_tax_date ? new Date(data.stnk_tax_date) : null,
        keur_date: data.keur_date ? new Date(data.keur_date) : null,
        
        doc_stnk: data.doc_stnk === true || data.doc_stnk === 'true' ? true : false,
        doc_bpkb: data.doc_bpkb === true || data.doc_bpkb === 'true' ? true : false,
        doc_faktur: data.doc_faktur === true || data.doc_faktur === 'true' ? true : false,
        doc_kwitansi: data.doc_kwitansi === true || data.doc_kwitansi === 'true' ? true : false,
        doc_form_a: data.doc_form_a === true || data.doc_form_a === 'true' ? true : false,
        doc_copy_ktp: data.doc_copy_ktp === true || data.doc_copy_ktp === 'true' ? true : false,
        doc_keur: data.doc_keur === true || data.doc_keur === 'true' ? true : false,
        doc_sph: data.doc_sph === true || data.doc_sph === 'true' ? true : false,

        branch_id: data.branch_id || null,
        pool_status: data.pool_status || 'in_pool',
        notes: data.notes || null,
        photo_front: data.photo_front || null,
        photo_back: data.photo_back || null,
        photo_right: data.photo_right || null,
        photo_left: data.photo_left || null,
        photo_engine: data.photo_engine || null,
        photo_interior: data.photo_interior || null,
        photo_stnk: data.photo_stnk || null,
      }
    });
    console.log('Success:', asset.id);
  } catch(e) {
    console.error('ERROR CODE:', e.code);
    console.error(e);
  } finally {
    prisma.$disconnect();
  }
}
run();
