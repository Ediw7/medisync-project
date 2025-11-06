'use strict';
const db = require('../../config/db');
const bcrypt = require('bcrypt');

const profilController = {
  
  // --- GET PROFIL PRODUSEN (HANYA KOLOM YANG ADA) ---
  getProfile: async (req, res) => {
    try {
      const [rows] = await db.query(
        `SELECT 
          id, 
          username, 
          email, 
          nama_resmi, 
          nomor_izin, 
          alamat 
         FROM users 
         WHERE id = ? AND role = 'produsen'`,
        [req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Profil Produsen tidak ditemukan.' });
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error in getProfile (Produsen):', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // --- UPDATE PROFIL PRODUSEN (HANYA KOLOM YANG ADA) ---
  updateProfile: async (req, res) => {
    const idProdusen = req.user.id;
    const {
      nama_resmi,
      alamat,
      email,
      nomor_izin
    } = req.body;

    // Validasi wajib
    if (!nama_resmi || !alamat || !email || !nomor_izin) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nama Resmi, Alamat, Email, dan Nomor Izin tidak boleh kosong.' 
      });
    }

    try {
      const sql = `
        UPDATE users 
        SET 
          nama_resmi = ?, 
          alamat = ?, 
          email = ?, 
          nomor_izin = ?
        WHERE id = ? AND role = 'produsen'
      `;

      await db.query(sql, [
        nama_resmi,
        alamat,
        email,
        nomor_izin,
        idProdusen
      ]);

      const [updatedRows] = await db.query(
        `SELECT 
          id, 
          username, 
          email, 
          nama_resmi, 
          nomor_izin, 
          alamat 
         FROM users 
         WHERE id = ?`,
        [idProdusen]
      );

      res.json({ 
        success: true, 
        message: 'Profil Produsen berhasil diperbarui.', 
        data: updatedRows[0] 
      });

    } catch (error) {
      console.error('Error in updateProfile (Produsen):', error);
      res.status(500).json({ 
        success: false, 
        message: 'Kesalahan Server Internal', 
        error: error.message 
      });
    }
  },

  // --- GANTI PASSWORD ---
  changePassword: async (req, res) => {
    const idProdusen = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
    }

    try {
      const [users] = await db.query("SELECT password FROM users WHERE id = ?", [idProdusen]);
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      }

      const user = users[0];
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Password saat ini salah.' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, idProdusen]);

      res.json({ success: true, message: 'Password berhasil diubah.' });

    } catch (error) {
      console.error('Error in changePassword (Produsen):', error);
      res.status(500).json({ 
        success: false, 
        message: 'Kesalahan Server Internal', 
        error: error.message 
      });
    }
  }
};

module.exports = profilController;