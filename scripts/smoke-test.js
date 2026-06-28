const http = require('http');
const https = require('https');

const CHECKS = [
  { name: 'API Health',       url: `${process.env.API_URL || 'http://localhost:8000'}/health` },
  { name: 'API Sessions',     url: `${process.env.API_URL || 'http://localhost:8000'}/api/v1/sessions` },
  { name: 'Admin Panel',      url: `${process.env.ADMIN_URL || 'http://localhost:3000'}` },
];

async function smokeCheck(check) {
  return new Promise((resolve) => {
    const client = check.url.startsWith('https') ? https : http;
    const start = Date.now();
    client.get(check.url, (res) => {
      const duration = Date.now() - start;
      resolve({ ...check, status: res.statusCode, duration, ok: res.statusCode < 400 });
    }).on('error', (e) => {
      resolve({ ...check, status: 0, ok: false, error: e.message });
    });
  });
}

(async () => {
  console.log('\n🔍 Running Smoke Tests...\n');
  const results = await Promise.all(CHECKS.map(smokeCheck));

  let allPass = true;
  results.forEach((r) => {
    const icon = r.ok ? '✅' : '❌';
    const timing = r.ok ? `(${r.duration}ms)` : `(${r.error || r.status})`;
    console.log(`${icon} ${r.name}: ${r.status} ${timing}`);
    if (!r.ok) allPass = false;
  });

  console.log('');
  if (allPass) {
    console.log('🎉 Semua smoke test LULUS — sistem berjalan normal!');
    process.exit(0);
  } else {
    console.error('🚨 Ada smoke test yang GAGAL — periksa segera!');
    process.exit(1);
  }
})();
