import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess } from '../../lib/apiResponse';

export class DashboardController {
  async getAdminStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const now = new Date();
      
      // Hari ini (Today): start of day to end of day
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Pekan ini (This week): start of week (Monday)
      const startOfWeek = new Date(startOfToday);
      const dayOfWeek = startOfWeek.getDay();
      const diffToMonday = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startOfWeek.setDate(diffToMonday);
      
      // Bulan ini (This month): start of month (1st)
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // 1. LOT TERJUAL (Lots Sold) - Based on invoice creation date (which happens on lot settle)
      const countLots = async (gte?: Date) => {
        return prisma.invoices.count({
          where: gte ? { created_at: { gte } } : undefined
        });
      };

      const lotsSoldToday = await countLots(startOfToday);
      const lotsSoldWeek = await countLots(startOfWeek);
      const lotsSoldMonth = await countLots(startOfMonth);
      const lotsSoldTotal = await countLots();

      // 2. PENDAPATAN BERSIH (Net Income)
      // Income from Bidder (Admin Fee) when invoice is PAID
      // Income from Provider (Commission Deducted) when settlement is created (which is also when invoice is paid)
      // So we aggregate based on `paid_at` for invoices and `created_at` for settlements.
      
      const getIncome = async (gte?: Date) => {
        const invAgg = await prisma.invoices.aggregate({
          _sum: { admin_fee: true },
          where: {
            status: 'paid',
            ...(gte ? { paid_at: { gte } } : {})
          }
        });
        
        const setAgg = await prisma.settlements.aggregate({
          _sum: { commission_deducted: true },
          where: gte ? { created_at: { gte } } : undefined
        });

        const adminFee = Number(invAgg._sum.admin_fee || 0);
        const providerFee = Number(setAgg._sum.commission_deducted || 0);
        return adminFee + providerFee;
      };

      const netIncomeToday = await getIncome(startOfToday);
      const netIncomeWeek = await getIncome(startOfWeek);
      const netIncomeMonth = await getIncome(startOfMonth);
      const netIncomeTotal = await getIncome();

      sendSuccess(res, {
        lotsSold: {
          today: lotsSoldToday,
          week: lotsSoldWeek,
          month: lotsSoldMonth,
          total: lotsSoldTotal
        },
        netIncome: {
          today: netIncomeToday,
          week: netIncomeWeek,
          month: netIncomeMonth,
          total: netIncomeTotal
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getChartData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = (req.query.category as string) || '';
      const metric = (req.query.metric as string) || 'lots'; // 'lots' | 'income'
      const range = (req.query.range as string) || 'week'; // 'week' | 'month' | 'year' | 'all'

      // Base query filters
      const lotCategoryFilter = category ? { equals: category, mode: 'insensitive' as const } : undefined;
      
      const invoiceWhere: any = {
        ...(lotCategoryFilter ? { lot: { asset: { category: lotCategoryFilter } } } : {}),
        ...(metric === 'income' ? { status: 'paid' } : {}) 
      };
      
      const settlementWhere: any = {
        ...(lotCategoryFilter ? { lot: { asset: { category: lotCategoryFilter } } } : {})
      };

      // Determine date bounds
      const now = new Date();
      let gte: Date | undefined;
      const lte: Date | undefined = now;

      if (range === 'week') {
        const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const dayOfWeek = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        gte = startOfWeek;
      } else if (range === 'month') {
        gte = new Date(now.getFullYear(), now.getMonth(), 1);
      } else if (range === 'year') {
        gte = new Date(now.getFullYear(), 0, 1);
      }

      if (gte) invoiceWhere.created_at = { gte, lte };
      if (gte) settlementWhere.created_at = { gte, lte };

      const chartData: Record<string, { label: string, value: number, sortOrder: number }> = {};
      
      // Initialize buckets based on range
      if (range === 'week') {
        const days = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
        days.forEach((day, idx) => { chartData[idx] = { label: day, value: 0, sortOrder: idx }; });
      } else if (range === 'month') {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        for (let i = 1; i <= daysInMonth; i++) {
          chartData[i] = { label: i.toString(), value: 0, sortOrder: i };
        }
      } else if (range === 'year') {
        const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
        months.forEach((m, idx) => { chartData[idx] = { label: m, value: 0, sortOrder: idx }; });
      }

      const mapDateToBucket = (d: Date): string | number => {
        if (range === 'week') {
          return d.getDay() === 0 ? 6 : d.getDay() - 1; // Mon=0 .. Sun=6
        } else if (range === 'month') {
          return d.getDate(); // 1 to 31
        } else if (range === 'year') {
          return d.getMonth();
        } else {
          return d.getFullYear().toString();
        }
      };

      if (metric === 'lots') {
        const invoices = await prisma.invoices.findMany({
          where: invoiceWhere,
          select: { created_at: true }
        });
        
        invoices.forEach(inv => {
          const b = mapDateToBucket(inv.created_at);
          if (!chartData[b]) chartData[b] = { label: String(b), value: 0, sortOrder: Number(b) };
          chartData[b].value += 1;
        });
      } else if (metric === 'income') {
        if (gte) {
          // Adjust where clause for income (based on paid_at)
          delete invoiceWhere.created_at;
          invoiceWhere.paid_at = { gte, lte };
        }
        
        const invoices = await prisma.invoices.findMany({
          where: invoiceWhere,
          select: { paid_at: true, admin_fee: true }
        });
        
        invoices.forEach(inv => {
          if (inv.paid_at) {
            const b = mapDateToBucket(inv.paid_at);
            if (!chartData[b]) chartData[b] = { label: String(b), value: 0, sortOrder: Number(b) };
            chartData[b].value += Number(inv.admin_fee || 0);
          }
        });

        const settlements = await prisma.settlements.findMany({
          where: settlementWhere,
          select: { created_at: true, commission_deducted: true }
        });

        settlements.forEach(set => {
          const b = mapDateToBucket(set.created_at);
          if (!chartData[b]) chartData[b] = { label: String(b), value: 0, sortOrder: Number(b) };
          chartData[b].value += Number(set.commission_deducted || 0);
        });
      }

      const formattedData = Object.values(chartData)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(({ label, value }) => ({ label, value }));

      sendSuccess(res, formattedData);
    } catch (error) {
      next(error);
    }
  }
}
