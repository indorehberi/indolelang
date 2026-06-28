import { Role } from '@indo-lelang/shared-types';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        status: string;
      };
    }
  }
}
