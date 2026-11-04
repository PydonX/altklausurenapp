import { Router } from 'express';
import { getStats } from '../queries/stats.js';

const router = Router();

// Zahlen für die Landing Page (für alle sichtbar)
router.get('/stats', (req, res) => {
  res.json(getStats());
});

export default router;
