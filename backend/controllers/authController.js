const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
// const nodemailer = require("nodemailer");
// const sgTransport = require("nodemailer-sendgrid-transport")
const sgMail = require("@sendgrid/mail");

const JWT_SECRET = process.env.JWT_SECRET || "kunci-rahasia-default";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
        return res
          .status(400)
          .json({
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
      const resetLink = `http://localhost:5173/reset-password/${resetToken}`;

      // --- 3. Buat objek pesan sesuai format @sendgrid/mail ---
      const msg = {
        to: user.email,
        from: {
            name: 'MediSync',
            email: process.env.EMAIL_USER, // Email ini harus yang sudah Anda verifikasi di SendGrid
        },
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

      // --- 4. Kirim email menggunakan sgMail.send() ---
      await sgMail.send(msg);

      res.json({
        message:
          "Jika email Anda terdaftar, tautan reset password akan dikirim.",
      });
    } catch (err) {
      console.error("SENDGRID ERROR:", err);
      if (err.response) {
        // Log error yang lebih detail dari API SendGrid
        console.error(err.response.body);
      }
      res
        .status(500)
        .json({ message: "Kesalahan server saat mencoba mengirim email." });
    }
  },
};

module.exports = authController;