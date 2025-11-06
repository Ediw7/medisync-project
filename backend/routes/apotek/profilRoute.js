// File: backend/routes/apotek/profilRoutes.js

'use strict';
const express = require('express');
const router = express.Router();
const profilController = require('../../controllers/apotek/profilController'); 
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Rute ini akan menjadi /api/apotek/profile
router.get(
  '/profile', 
  authenticateToken, 
  authorizeRole('apotek'), 
  profilController.getProfile
);

// Rute ini akan menjadi /api/apotek/profile
router.put(
  '/profile', 
  authenticateToken, 
  authorizeRole('apotek'), 
  profilController.updateProfile
);

// Rute ini akan menjadi /api/apotek/change-password
router.put(
  '/change-password', 
  authenticateToken, 
  authorizeRole('apotek'), 
  profilController.changePassword
);

module.exports = router;