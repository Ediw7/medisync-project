// File: backend/routes/pbf/profilRoutes.js

'use strict';
const express = require('express');
const router = express.Router();
// Pastikan path ke controller Anda benar
const profilController = require('../../controllers/pbf/profilController'); 
const { authenticateToken, authorizeRole } = require('../../middleware/auth');

// Rute ini akan menjadi /api/pbf/profile
router.get(
  '/profile', 
  authenticateToken, 
  authorizeRole('pbf'), 
  profilController.getProfile
);

// Rute ini akan menjadi /api/pbf/profile
router.put(
  '/profile', 
  authenticateToken, 
  authorizeRole('pbf'), 
  profilController.updateProfile
);

// Rute ini akan menjadi /api/pbf/change-password
router.put(
  '/change-password', 
  authenticateToken, 
  authorizeRole('pbf'), 
  profilController.changePassword
);

module.exports = router;