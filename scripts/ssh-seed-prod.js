const { Client } = require('ssh2');

const sshConfig = {
  host: '31.97.50.148',
  port: 22,
  username: 'root',
  password: 'Bidku-lelang26'
};

const seedScriptJS = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding content (testimonials and blogs)...');

  let admin = await prisma.users.findFirst({ where: { role: 'admin' } });
  if (!admin) {
    admin = await prisma.users.create({
      data: {
        email: 'admin_seed@example.com',
        password_hash: 'dummy',
        full_name: 'Admin Seed',
        role: 'admin',
        status: 'active'
      }
    });
    console.log('Created dummy admin for seeding blogs.');
  }

  let user1 = await prisma.users.findFirst({ where: { role: 'bidder' } });
  if (!user1) {
    user1 = await prisma.users.create({
      data: {
        email: 'bidder_seed1@example.com',
        password_hash: 'dummy',
        full_name: 'Bambang Susilo',
        role: 'bidder',
        status: 'active'
      }
    });
    console.log('Created dummy bidder Bambang Susilo.');
  }

  let user2 = await prisma.users.findFirst({ where: { role: 'bidder', id: { not: user1.id } } });
  if (!user2) {
    user2 = await prisma.users.create({
      data: {
        email: 'bidder_seed2@example.com',
        password_hash: 'dummy',
        full_name: 'Ratna Mutia',
        role: 'bidder',
        status: 'active'
      }
    });
    console.log('Created dummy bidder Ratna Mutia.');
  }

  let user3 = await prisma.users.findFirst({ where: { role: 'provider' } });
  if (!user3) {
    user3 = await prisma.users.create({
      data: {
        email: 'provider_seed3@example.com',
        password_hash: 'dummy',
        full_name: 'Aditya Pratama',
        role: 'provider',
        status: 'active'
      }
    });
    console.log('Created dummy provider Aditya Pratama.');
  }

  const testimoniCount = await prisma.testimonials.count();
  if (testimoniCount === 0) {
    await prisma.testimonials.createMany({
      data: [
        {
          user_id: user1.id,
          rating: 5,
          content: 'Proses bidding di BIDKU sangat transparan dan mudah diikuti. Saya mendapatkan mobil idaman dengan harga yang jauh lebih kompetitif.',
          image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=120&h=120&fit=crop',
          status: 'approved'
        },
        {
          user_id: user2.id,
          rating: 5,
          content: 'Awalnya ragu lelang online, tapi setelah coba di BIDKU ternyata aman banget. Verifikasi datanya ketat, tidak khawatir ada penipuan.',
          image_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=120&h=120&fit=crop',
          status: 'approved'
        },
        {
          user_id: user3.id,
          rating: 5,
          content: 'Sangat terbantu untuk pengadaan unit usaha kami. Deskripsi unit jujur sesuai grade, memudahkan estimasi sebelum bidding.',
          image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=120&h=120&fit=crop',
          status: 'approved'
        }
      ]
    });
    console.log('Seeded 3 testimonials.');
  } else {
    console.log('Found ' + testimoniCount + ' testimonials, skipping seed.');
  }

  const blogCount = await prisma.blog_posts.count();
  if (blogCount === 0) {
    await prisma.blog_posts.createMany({
      data: [
        {
          title: 'Tips Membeli Mobil Bekas Lewat Lelang',
          slug: 'tips-membeli-mobil-bekas-lewat-lelang',
          content: '<p>Pelajari cara memeriksa kondisi dokumen kendaraan agar tidak salah pilih saat mengikuti lelang online.</p><p>Membeli mobil bekas lewat lelang bisa sangat menguntungkan, namun Anda harus memperhatikan kelengkapan dokumen dan kondisi fisik kendaraan secara teliti.</p>',
          image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAfO6fRTBCfJVz6MUYCEQuH3UDV81F-F4DY_MQbOx18fvPHR0qu3z6dqm-XIHHrYpEsl-LUvyzzVw_rp9xw2ghrTUmUTz3239DZ7OUAAVjaIOedVl6K5emlIYjlz81T1VKKI8PugGBlfIwam3VPYHuUMUCCxIEBfN-bJXqFfvP6GPBQ8SRQT-HbBIgrbsbbvxtc6acdLRGMX5q5ScguyKNiTVPgNQdpCLmt1lOjJz8couih2BWAfseY00DK7axG4bWw30rAHVe6njfB',
          author_id: admin.id,
          status: 'published',
          published_at: new Date('2024-06-12T10:00:00Z')
        },
        {
          title: 'Panduan Lengkap Lelang Digital 2024',
          slug: 'panduan-lengkap-lelang-digital-2024',
          content: '<p>Langkah demi langkah mengikuti lelang mulai dari pendaftaran akun hingga pengambilan unit untuk pemula.</p><p>Dunia lelang digital semakin berkembang pesat pada tahun 2024 ini. Artikel ini membahas langkah-langkah yang perlu Anda ketahui untuk memenangkan lelang secara online dengan mudah.</p>',
          image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDx_9SWM1Z1hW6_ynwMqo7kT08ssXXJsGSjibfPe57XznHvi41Mjkt_jbGy2-a-fycvwk4nWH-5hnGlwnp8whWELZ8pnG5Wn3HWlbNIMntoz4ZlhohDti-SiLDsyXHy0w7sLLVEiGae386QxYS6XpMnVccBqdLunYwvCBAofP1PVuJ06D3eZMDxE7kbVO-Bqv_c3hUHPl9BWSeq3qkYHWBvv239rgOVx49WJqOn7TN_vhwg0VV1-q_vqf7m_6HOyuTivEWRM9MrhzrM',
          author_id: admin.id,
          status: 'published',
          published_at: new Date('2024-06-08T10:00:00Z')
        },
        {
          title: 'Keunggulan Grade Kendaraan di BIDKU',
          slug: 'keunggulan-grade-kendaraan-di-bidku',
          content: '<p>Memahami sistem penilaian grade A hingga E pada unit lelang untuk menjamin kepuasan pembeli.</p><p>Setiap unit di platform BIDKU diperiksa dengan teliti oleh tim inspeksi profesional. Sistem grade ini sangat membantu para bidder untuk menilai kondisi riil suatu unit sebelum mereka mulai menawar.</p>',
          image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYN8O2A-8z9old1jiYKN3bl_YAgSjeeNrRfz65SyUOBZcClgtIAicB1Ef3G5ynkpckI4VeZbQ4euupLkJTi_0aOr3T_rmdoTSKwmPZoazXlnAh4I0nTlRtAvoiZJtrsvf3dRTzqXsNGpE2FX3rMHjM1YTvVRXkAVR62eV5Nm7ejEPopOiLePfyyDieJ7ak_hWwkhHnCRN1D3ouQ7Mg0Jnpq282YGoAgtZRiSIT8I4oud5JRGOokCF5DfXUp0Njgamd-sK7LQt10xZl',
          author_id: admin.id,
          status: 'published',
          published_at: new Date('2024-06-03T10:00:00Z')
        }
      ]
    });
    console.log('Seeded 3 blogs.');
  } else {
    console.log('Found ' + blogCount + ' blogs, skipping seed.');
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
`;

// Escape backticks and dollar signs for cat HEREDOC
const safeSeedScript = seedScriptJS.replace(/\\$/g, '\\\\$').replace(/`/g, '\\`');

const commands = [
  `cat << 'EOF' > /root/indolelang/temp_seed_prod.js\n${seedScriptJS}\nEOF`,
  `docker cp /root/indolelang/temp_seed_prod.js indolelang_api_prod:/app/apps/api/temp_seed_prod.js`,
  `docker exec indolelang_api_prod node temp_seed_prod.js`,
  `rm -f /root/indolelang/temp_seed_prod.js`
];

const conn = new Client();

conn.on('ready', () => {
  let i = 0;
  function executeNext() {
    if (i >= commands.length) {
      console.log('\\nData seeding to production database completed successfully!');
      conn.end();
      return;
    }
    const cmd = commands[i];
    console.log(`\\n> ${cmd.split('\\n')[0]}...`);
    conn.exec(cmd, (err, stream) => {
      if (err) throw err;
      stream.on('close', (code) => {
        if (code !== 0) {
           console.error('Failed to run seed on server.');
           process.exit(1);
        }
        i++;
        executeNext();
      }).on('data', (data) => {
        process.stdout.write(data);
      }).stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });
  }
  executeNext();
}).connect(sshConfig);
