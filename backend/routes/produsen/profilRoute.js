// File: backend/routes/produsen/profilRoutes.js

'use strict';
const express = require('express');
const router = express.Router();

// Pastikan path ke controller benar
const profilController = require('../../controllers/produsen/profilController'); 
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Rute ini akan menjadi /api/produsen/profile
router.get(
  '/profile', 
  authenticateToken, 
  authorizeRole('produsen'), 
  profilController.getProfile
);

// Rute ini akan menjadi /api/produsen/profile
router.put(
  '/profile', 
  authenticateToken, 
  authorizeRole('produsen'), 
  profilController.updateProfile
);

// Rute ini akan menjadi /api/produsen/change-password
router.put(
  '/change-password', 
  authenticateToken, 
  authorizeRole('produsen'), 
  profilController.changePassword
);

module.exports = router;