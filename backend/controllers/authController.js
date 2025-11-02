require("dotenv").config();
const User = require("../models/userModel");
const jwt = require("jsonwebtoken");

const sgMail = require("@sendgrid/mail");

const JWT_SECRET = process.env.JWT_SECRET || "kunci-rahasia-default";
const FROM_EMAIL = (process.env.EMAIL_USER || "").replace(/(^"|"$)/g, "");
const SENDGRID_API_KEY = (process.env.SENDGRID_API_KEY || "").replace(
  /(^"|"$)/g,
  ""
);

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

if (!SENDGRID_API_KEY) {
  console.error(
    "WARNING: SENDGRID_API_KEY tidak ditemukan. Email tidak akan terkirim."
  );
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
        { 
          id: user.id, 
          role: user.role, 
          username: user.username,
          nama_resmi: user.nama_resmi, // <-- TAMBAHKAN INI
          nomor_izin: user.nomor_izin   // <-- TAMBAHKAN INI JUGA
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      res.json({
        token,
        role: user.role,
        username: user.username,
        namaResmi: user.nama_resmi,
        id: user.id,
        nomor_izin: user.nomor_izin
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
        from: {
          name: "MediSync",
          email: process.env.EMAIL_USER,
        },
        subject: "Reset Password Akun MediSync Anda",
        html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #f7f7f7; padding: 20px; text-align: center; border-bottom: 1px solid #ddd;">
        <h1 style="font-size: 28px; font-weight: bold; color: #16A34A; margin: 0; text-align: center;">MediSync</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="font-size: 24px; color: #16A34A; margin-top: 0;">Verifikasi Reset Password Anda</h2>
        <p>Halo <strong style="text-transform: uppercase;">${user.username}</strong>,</p>
        <p>Anda menerima email ini karena ada permintaan untuk mereset password akun Anda.</p>
        
        <p>Silakan klik tombol di bawah ini untuk melanjutkan. Tautan ini hanya berlaku selama 15 menit.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" target="_blank" style="background-color: #16A34A; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-size: 16px; font-weight: bold;">
            RESET PASSWORD
          </a>
        </div>
        
        <p style="font-size: 0.9em; color: #777;">Jika Anda tidak merasa melakukan permintaan ini, mohon abaikan email ini atau hubungi dukungan kami.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8em; color: #aaa; text-align: center;">MediSync - Pharmaceutical Supply Chain</p>
      </div>
    </div>
  `,
      };
      // debug: (opsional) log message-id jika berhasil
      try {
        const sendResp = await sgMail.send(msg);
        const resp = Array.isArray(sendResp) ? sendResp[0] : sendResp;
        console.log("SendGrid statusCode:", resp.statusCode);
        if (resp.headers) {
          console.log(
            "SendGrid x-message-id:",
            resp.headers["x-message-id"] || resp.headers["X-Message-Id"]
          );
        }
      } catch (sendErr) {
        console.error("SENDGRID SEND ERROR:", sendErr);
        if (sendErr.response && sendErr.response.body) {
          console.error(
            "SendGrid response body:",
            JSON.stringify(sendErr.response.body, null, 2)
          );
        }
        // jangan return error info spesifik ke client demi keamanan; biarkan pesan netral
        return res
          .status(500)
          .json({ message: "Kesalahan server saat mencoba mengirim email." });
      }

      return res.json({
        message:
          "Jika email Anda terdaftar, tautan reset password akan dikirim.",
      });
    } catch (err) {
      console.error("FORGOT PW ERROR:", err);
      return res
        .status(500)
        .json({ message: "Kesalahan server", error: err.message });
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
      if (
        err.name === "TokenExpiredError" ||
        err.name === "JsonWebTokenError"
      ) {
        return res
          .status(401)
          .json({ message: "Token tidak valid atau sudah kedaluwarsa." });
      }
      return res
        .status(500)
        .json({ message: "Kesalahan server", error: err.message });
    }
  },
};

module.exports = authController;
