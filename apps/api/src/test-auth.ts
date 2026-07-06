import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import http from 'http';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.users.findFirst({ where: { role: 'superadmin' } });
  if (!admin) throw new Error('No admin found');

  const secret = process.env.JWT_SECRET || 'rahasia_negara_123';
  const token = jwt.sign({ id: admin.id, role: admin.role }, secret, { expiresIn: '1h' });

  console.log('Got token:', token);

  const req = http.request('http://localhost:8000/api/v1/admin/dashboard/chart?category=&metric=income&range=week', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Response:', res.statusCode, data));
  });
  req.end();
}

main().catch(console.error).finally(() => prisma.$disconnect());
