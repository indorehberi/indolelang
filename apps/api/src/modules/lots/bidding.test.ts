import { biddingService, calculateWorkingDaysDueDate } from './bidding.service';

describe('Bidding Engine Logic Unit Tests', () => {
  describe('calculateWorkingDaysDueDate', () => {
    it('should correctly skip weekends', () => {
      // Friday 2026-07-17. 3 working days: Mon 20, Tue 21, Wed 22.
      const start = new Date('2026-07-17T12:00:00');
      const due = calculateWorkingDaysDueDate(start, 3, []);
      expect(due.toISOString().slice(0, 10)).toBe('2026-07-22');
    });

    it('should skip weekends and national holidays', () => {
      // Friday 2026-07-17. Monday 2026-07-20 is holiday. 3 working days: Tue 21, Wed 22, Thu 23.
      const start = new Date('2026-07-17T12:00:00');
      const due = calculateWorkingDaysDueDate(start, 3, ['2026-07-20']);
      expect(due.toISOString().slice(0, 10)).toBe('2026-07-23');
    });
  });

  describe('getMinIncrement', () => {
    it('should return 500,000 for current price < 10,000,000', () => {
      expect(biddingService.getMinIncrement(5_000_000)).toBe(500_000);
      expect(biddingService.getMinIncrement(9_999_999)).toBe(500_000);
    });

    it('should return 1,000,000 for current price between 10,000,000 and 50,000,000', () => {
      expect(biddingService.getMinIncrement(10_000_000)).toBe(1_000_000);
      expect(biddingService.getMinIncrement(49_999_999)).toBe(1_000_000);
    });

    it('should return 2,500,000 for current price between 50,000,000 and 200,000,000', () => {
      expect(biddingService.getMinIncrement(50_000_000)).toBe(2_500_000);
      expect(biddingService.getMinIncrement(199_999_999)).toBe(2_500_000);
    });

    it('should return 5,000,000 for current price >= 200,000,000', () => {
      expect(biddingService.getMinIncrement(200_000_000)).toBe(5_000_000);
      expect(biddingService.getMinIncrement(1_000_000_000)).toBe(5_000_000);
    });
  });

  describe('calculateAntiSnipe', () => {
    it('should reset timer to 120s if bid arrives in the first minute (> 60s)', () => {
      const res = biddingService.calculateAntiSnipe(80, 0);
      expect(res.extended).toBe(true);
      expect(res.newTimeRemaining).toBe(120);
      expect(res.extensionCount).toBe(1);
    });

    it('should reset timer to 60s if bid arrives in the second minute (<= 60s)', () => {
      const res = biddingService.calculateAntiSnipe(25, 0);
      expect(res.extended).toBe(true);
      expect(res.newTimeRemaining).toBe(60);
      expect(res.extensionCount).toBe(1);
    });

    it('should not extend if time remaining is 0', () => {
      const res = biddingService.calculateAntiSnipe(0, 0);
      expect(res.extended).toBe(false);
      expect(res.newTimeRemaining).toBe(0);
      expect(res.extensionCount).toBe(0);
    });
  });
});
