import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['info', 'warn', 'error'] : ['error'],
  });

// --- Production Database Safety Guard Middleware ---
prisma.$use(async (params, next) => {
  const isProduction = env.NODE_ENV === 'production' || 
                       (process.env.DATABASE_URL && 
                        !process.env.DATABASE_URL.includes('localhost') && 
                        !process.env.DATABASE_URL.includes('127.0.0.1') && 
                        !process.env.DATABASE_URL.includes('dev.db'));

  if (isProduction) {
    // 1. Prevent global deleteMany without filters
    if (params.action === 'deleteMany') {
      const hasWhere = params.args?.where && Object.keys(params.args.where).length > 0;
      if (!hasWhere) {
        throw new Error(
          `[DATABASE_SAFETY_GUARD] Unsafe bulk deletion (deleteMany without filters) is strictly blocked on production/live database for model "${params.model}" to prevent accidental data loss.`
        );
      }
    }

    // 2. Prevent dropping database tables or executing truncate via raw SQL
    if (params.action === 'executeRaw' || params.action === 'queryRaw') {
      const sqlQuery = String(params.args?.query || '').toLowerCase();
      if (sqlQuery.includes('drop table') || sqlQuery.includes('truncate') || sqlQuery.includes('delete from')) {
        throw new Error(
          `[DATABASE_SAFETY_GUARD] Destructive raw SQL query execution is strictly blocked on production/live database.`
        );
      }
    }
  }
  
  return next(params);
});

if (env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
