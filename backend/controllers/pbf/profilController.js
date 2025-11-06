'use strict';
const db = require('../../config/db');
const bcrypt = require('bcrypt');

const profilController = {
  
  // --- FUNGSI UNTUK MENGAMBIL PROFIL ---
  getProfile: async (req, res) => {
    try {
      const [rows] = await db.query(
        // Ambil semua kolom yang relevan dari database Anda
        `SELECT 
          id, username, email, nama_resmi, nomor_izin, alamat, 
          kontak_telepon, nomor_sia_sika, nama_apoteker, nomor_sipa 
         FROM users 
         WHERE id = ? AND role = 'pbf'`,
        [req.user.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Profil PBF tidak ditemukan.' });
      }
      res.json({ success: true, data: rows[0] });
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal' });
    }
  },

  // --- FUNGSI UNTUK MEMPERBARUI PROFIL ---
  updateProfile: async (req, res) => {
    const idPbf = req.user.id;
    // Ambil semua data yang BOLEH diubah dari body
    const {
      nama_resmi,
      alamat,
      email,
      kontak_telepon,
      nomor_izin,
      nomor_sia_sika,
      nama_apoteker,
      nomor_sipa
    } = req.body;

    // Validasi sederhana
    if (!nama_resmi || !alamat || !email || !nomor_izin) {
        return res.status(400).json({ success: false, message: 'Nama, Alamat, Email, dan Nomor Izin tidak boleh kosong.' });
    }

    try {
      const sql = `
        UPDATE users 
        SET 
          nama_resmi = ?, 
          alamat = ?, 
          email = ?, 
          kontak_telepon = ?, 
          nomor_izin = ?, 
          nomor_sia_sika = ?, 
          nama_apoteker = ?, 
          nomor_sipa = ?
        WHERE id = ? AND role = 'pbf'
      `;

      await db.query(sql, [
        nama_resmi,
        alamat,
        email,
        kontak_telepon || null,
        nomor_izin,
        nomor_sia_sika || null,
        nama_apoteker || null,
        nomor_sipa || null,
        idPbf
      ]);

      // Ambil data yang baru diupdate untuk dikirim kembali
      const [updatedRows] = await db.query(
        "SELECT id, username, email, nama_resmi, nomor_izin, alamat, kontak_telepon, nomor_sia_sika, nama_apoteker, nomor_sipa FROM users WHERE id = ?",
        [idPbf]
      );

      res.json({ success: true, message: 'Profil berhasil diperbarui.', data: updatedRows[0] });

    } catch (error) {
      console.error('Error in updateProfile (PBF):', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal', error: error.message });
    }
  },

  // --- FUNGSI UNTUK MENGGANTI PASSWORD ---
  changePassword: async (req, res) => {
    const idPbf = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Semua field wajib diisi.' });
    }

    try {
      const [users] = await db.query("SELECT password FROM users WHERE id = ?", [idPbf]);
      if (users.length === 0) {
        return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
      }

      const user = users[0];

      // 1. Cek password lama
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Password saat ini salah.' });
      }

      // 2. Hash password baru
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      // 3. Update password di database
      await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedNewPassword, idPbf]);

      res.json({ success: true, message: 'Password berhasil diubah.' });

    } catch (error) {
      console.error('Error in changePassword (PBF):', error);
      res.status(500).json({ success: false, message: 'Kesalahan Server Internal', error: error.message });
    }
  }
};

module.exports = profilController;