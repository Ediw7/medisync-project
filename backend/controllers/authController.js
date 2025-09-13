require('dotenv').config();
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
// const sgTransport = require("nodemailer-sendgrid-transport")
const sgMail = require("@sendgrid/mail");

const JWT_SECRET = process.env.JWT_SECRET || "kunci-rahasia-default";
const FROM_EMAIL = (process.env.EMAIL_USER || "").replace(/(^"|"$)/g, "");
const SENDGRID_API_KEY = (process.env.SENDGRID_API_KEY || "").replace(/(^"|"$)/g, "");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

if (!SENDGRID_API_KEY) {
  console.error("WARNING: SENDGRID_API_KEY tidak ditemukan. Email tidak akan terkirim.");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

const authController = {
  register: async (req, res) => {
    const { username, email, password, role, namaResmi, nomorIzin, alamat } =
      req.body;
    try {
      if (!namaResmi || !nomorIzin || !alamat) {
        return res
          .status(400)
          .json({ message: "Informasi perusahaan/izin wajib diisi." });
      }

      const validRoles = ["produsen", "pbf", "apotek"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Role tidak valid" });
      }

      await User.create(
        username,
        email,
        password,
        role,
        namaResmi,
        nomorIzin,
        alamat
      );
      res.status(201).json({ message: "Registrasi berhasil. Silakan login." });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(400).json({
          message: "Username, email, atau nomor izin sudah digunakan",
        });
      }
      res.status(500).json({ message: "Kesalahan server", error: err.message });
    }
  },

  login: async (req, res) => {
    const { username, password } = req.body;
    try {
      const user = await User.findByUsername(username);
      if (!user) {
        return res
          .status(401)
          .json({ message: "Username atau password salah" });
      }

      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ message: "Username atau password salah" });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role, username: user.username },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.json({
        token,
        role: user.role,
        username: user.username,
        namaResmi: user.nama_resmi,
      });
    } catch (err) {
      res.status(500).json({ message: "Kesalahan server", error: err.message });
    }
  },

  forgotPassword: async (req, res) => {
    const { email } = req.body;
    try {
      const user = await User.findByEmail(email);

      if (!user) {
        return res.json({
          message:
            "Jika email Anda terdaftar, tautan reset password akan dikirim.",
        });
      }

      const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, {
        expiresIn: "15m",
      });

      // Gunakan encodeURIComponent agar token aman di URL
      const resetLink = `http://localhost:5173/reset-password/${encodeURIComponent(
        resetToken
      )}`;

      const msg = {
        to: user.email,
        from: { email: FROM_EMAIL, name: "MediSync" },
        subject: "Reset Password Akun MediSync Anda",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Reset Password Akun MediSync Anda</h2>
                <p>Halo ${user.username},</p>
                <p>Anda menerima email ini karena ada permintaan untuk mereset password akun Anda.</p>
                <p>Silakan klik tombol di bawah ini untuk melanjutkan. Tautan ini hanya berlaku selama 15 menit.</p>
                <a href="${resetLink}" target="_blank" style="background-color: #16A34A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Reset Password Saya</a>
                <p>Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini.</p>
                <hr>
                <p style="font-size: 0.8em; color: #777;">MediSync - Pharmaceutical Supply Chain</p>
            </div>
        `,
      };

      // debug: (opsional) log message-id jika berhasil
      try {
        const sendResp = await sgMail.send(msg);
        const resp = Array.isArray(sendResp) ? sendResp[0] : sendResp;
        console.log("SendGrid statusCode:", resp.statusCode);
        if (resp.headers) {
          console.log("SendGrid x-message-id:", resp.headers["x-message-id"] || resp.headers["X-Message-Id"]);
        }
      } catch (sendErr) {
        console.error("SENDGRID SEND ERROR:", sendErr);
        if (sendErr.response && sendErr.response.body) {
          console.error("SendGrid response body:", JSON.stringify(sendErr.response.body, null, 2));
        }
        // jangan return error info spesifik ke client demi keamanan; biarkan pesan netral
        return res.status(500).json({ message: "Kesalahan server saat mencoba mengirim email." });
      }

      return res.json({
        message:
          "Jika email Anda terdaftar, tautan reset password akan dikirim.",
      });
    } catch (err) {
      console.error("FORGOT PW ERROR:", err);
      return res.status(500).json({ message: "Kesalahan server", error: err.message });
    }
  },

  resetPassword: async (req, res) => {
    // terima token dari body OR query untuk fleksibilitas
    const token = req.body.token || req.query.token || null;
    const newPassword = req.body.newPassword;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ message: "Token dan password baru diperlukan." });
    }

    try {
      const decoded = jwt.verify(decodeURIComponent(token), JWT_SECRET);

      await User.updatePassword(decoded.id, newPassword);

      return res.json({
        message:
          "Password berhasil direset. Silakan login dengan password baru Anda.",
      });
    } catch (err) {
      console.error("RESET PW ERROR:", err);
      if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
        return res
          .status(401)
          .json({ message: "Token tidak valid atau sudah kedaluwarsa." });
      }
      return res.status(500).json({ message: "Kesalahan server", error: err.message });
    }
  },
};

module.exports = authController;
