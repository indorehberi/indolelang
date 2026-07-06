export function calculateGatewayFee(amount: number, method: string): number {
  switch (method.toLowerCase()) {
    case 'bca':
    case 'bni':
    case 'bri':
    case 'mandiri':
    case 'permata':
      return 4000; // Flat Rp 4.000 for VA
    case 'gopay':
    case 'shopeepay':
      return Math.round(amount * 0.02); // 2%
    case 'qris':
      return Math.round(amount * 0.007); // 0.7%
    case 'dana':
    case 'ovo':
      return Math.round(amount * 0.015); // 1.5%
    case 'credit_card':
      return Math.round((amount * 0.029) + 2000); // 2.9% + Rp 2.000
    default:
      return 4000; // Default fallback to VA flat rate
  }
}
