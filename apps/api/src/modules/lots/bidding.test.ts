import { biddingService } from './bidding.service';

describe('Bidding Engine Logic Unit Tests', () => {
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
    it('should extend timer to 120s if bid arrives under 30s threshold and extensions < 3', () => {
      const res = biddingService.calculateAntiSnipe(25, 0, 30, 120, 3);
      expect(res.extended).toBe(true);
      expect(res.newTimeRemaining).toBe(120);
      expect(res.extensionCount).toBe(1);
    });

    it('should not extend timer if remaining time is >= 30s', () => {
      const res = biddingService.calculateAntiSnipe(35, 0, 30, 120, 3);
      expect(res.extended).toBe(false);
      expect(res.newTimeRemaining).toBe(35);
      expect(res.extensionCount).toBe(0);
    });

    it('should not extend if maximum extensions limit (3) is reached', () => {
      const res = biddingService.calculateAntiSnipe(15, 3, 30, 120, 3);
      expect(res.extended).toBe(false);
      expect(res.newTimeRemaining).toBe(15);
      expect(res.extensionCount).toBe(3);
    });
  });
});
