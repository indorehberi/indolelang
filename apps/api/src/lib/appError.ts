import { ErrorCodeType } from '@indo-lelang/utils';

/**
 * Custom application error class for handled operational errors
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCodeType | string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
export default AppError;
