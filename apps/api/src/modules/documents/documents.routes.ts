import { Router } from 'express';
import { DocumentsController } from './documents.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
const controller = new DocumentsController();

// Public route for QR verification
router.get('/documents/:qr_hash/verify', controller.verifyDocument);

// Authenticated download and list routes
router.get('/documents/invoices', authenticate, controller.getInvoices);
router.get('/documents/invoice/:invoiceId/download', authenticate, controller.downloadInvoice.bind(controller));
router.get('/documents/sj/:invoiceId/download', authenticate, controller.downloadSuratJalan.bind(controller));
router.get('/documents/bast/:invoiceId/download', authenticate, controller.downloadBast.bind(controller));
router.get('/documents/bapl/:invoiceId/download', authenticate, controller.downloadBapl.bind(controller));

export default router;
