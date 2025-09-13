const db = require('../config/db');
const bcrypt = require('bcryptjs');

const User = {
    // Query sekarang TIDAK menyertakan status_verifikasi
    create: async (username, email, password, role, namaResmi, nomorIzin, alamat) => {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = 'INSERT INTO users (username, email, password, role, nama_resmi, nomor_izin, alamat) VALUES (?, ?, ?, ?, ?, ?, ?)';
        const [result] = await db.execute(sql, [username, email, hashedPassword, role, namaResmi, nomorIzin, alamat]);
        return result;
    },

    findByUsername: async (username) => {
        const sql = 'SELECT * FROM users WHERE username = ?';
        const [results] = await db.execute(sql, [username]);
        return results[0];
    },

    comparePassword: async (password, hashedPassword) => {
        return await bcrypt.compare(password, hashedPassword);
    },
    
    findByEmail: async (email) => {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const [results] = await db.execute(sql, [email]);
        return results[0];
    },
    updatePassword: async (userId, newPassword) => {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const sql = 'UPDATE users SET password = ? WHERE id = ?';
        const [result] = await db.execute(sql, [hashedPassword, userId]);
        return result;
    }
};

module.exports = User;
