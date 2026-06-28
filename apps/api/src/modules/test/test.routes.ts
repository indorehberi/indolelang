import { Router, Request, Response } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { Role } from '@indo-lelang/shared-types';

const router = Router();

/**
 * Public endpoint - no auth required
 */
router.get('/public', (req: Request, res: Response) => {
	res.json({
		success: true,
		message: 'This is a public endpoint - anyone can access',
		timestamp: new Date().toISOString(),
	});
});

/**
 * Protected endpoint - requires authentication
 */
router.get('/protected', authenticate, (req: Request, res: Response) => {
	res.json({
		success: true,
		message: 'You are authenticated!',
		user: req.user,
	});
});

/**
 * Admin only endpoint - requires admin role
 */
router.get(
	'/admin-only',
	authenticate,
	authorize(Role.SUPERADMIN, Role.ADMIN),
	(req: Request, res: Response) => {
		res.json({
			success: true,
			message: 'Welcome Admin! You have access to this endpoint.',
			user: req.user,
		});
	}
);

/**
 * Bidder only endpoint
 */
router.get('/bidder-only', authenticate, authorize(Role.BIDDER), (req: Request, res: Response) => {
	res.json({
		success: true,
		message: 'Welcome Bidder! You have access to this endpoint.',
		user: req.user,
	});
});

/**
 * Provider only endpoint
 */
router.get('/provider-only', authenticate, authorize(Role.PROVIDER), (req: Request, res: Response) => {
	res.json({
		success: true,
		message: 'Welcome Provider! You have access to this endpoint.',
		user: req.user,
	});
});

/**
 * Staff endpoint - multiple roles allowed
 */
router.get(
	'/staff',
	authenticate,
	authorize(Role.SUPERADMIN, Role.ADMIN),
	(req: Request, res: Response) => {
		res.json({
			success: true,
			message: 'Welcome Staff member!',
			user: req.user,
		});
	}
);

export default router;
