"use client"

import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { Eye, EyeOff, User, Lock, ArrowLeft, ShieldCheck, GitBranch, PackageSearch } from "lucide-react"

const LoginPage = () => {
  const [form, setForm] = useState({ username: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { role } = useParams()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", form)
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("username", res.data.username)
      localStorage.setItem("namaResmi", res.data.namaResmi)

      const userRole = res.data.role
      if (userRole !== role) {
        setError(`Login gagal. Akun ini bukan untuk peran ${role}.`)
        return
      }

      if (userRole === "produsen") navigate("/produsen/dashboard")
      else if (userRole === "pbf") navigate("/pbf/dashboard")
      else if (userRole === "apotek") navigate("/apotek/dashboard")
    } catch (error) {
      setError(error.response?.data?.message || "Terjadi kesalahan saat login")
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayRole = role.charAt(0).toUpperCase() + role.slice(1)

  return (
    <div className="min-h-screen bg-gray-200/90 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-200 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 -translate-y-1 w-96 h-96 bg-green-200/70 rounded-full blur-3xl animate-spin"></div>
      <div className="absolute top-1 left-1/2 -translate-x-1/2 -translate-y-1 w-48 h-64 bg-green-200/80 rounded-full blur-3xl animate-spin"></div>
      <div  
        className="absolute bottom-0 right-0 w-96 h-96 bg-green-200 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-1/4 left-1/2 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "3s" }}
      ></div>

      <div className="relative z-10 w-full max-w-4xl bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl grid md:grid-cols-2 overflow-hidden border border-white/30 backdrop-saturate-150">
        {/* Kolom Kiri - Branding */}
        <div className="hidden md:block p-10 bg-gradient-to-br from-emerald-600/90 to-[#047857] text-white backdrop-blur-xl border-r border-white/20">
          <h2 className="text-3xl font-bold mb-4">Selamat Datang di MediSync</h2>
          <p className="text-[#F9FDFE] mb-8">
            Platform terdesentralisasi untuk rantai pasok farmasi yang aman dan transparan.
          </p>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <ShieldCheck className="h-8 w-8 text-[#F9FDFE] flex-shrink-0" />
              </div>
              <div>
                <h3 className="font-semibold">Keamanan Terjamin</h3>
                <p className="text-sm text-[#F9FDFE]">Setiap transaksi dicatat di ledger yang tidak dapat diubah.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <GitBranch className="h-8 w-8 text-[#F9FDFE] flex-shrink-0" />
              </div>
              <div>
                <h3 className="font-semibold">Transparansi Penuh</h3>
                <p className="text-sm text-[#F9FDFE]">Lacak setiap langkah perjalanan produk dari hulu ke hilir.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <PackageSearch className="h-8 w-8 [#F9FDFE] flex-shrink-0" />
              </div>
              <div>
                <h3 className="font-semibold">Verifikasi Instan</h3>
                <p className="text-sm text-[#F9FDFE]">Pastikan keaslian obat dengan pemindaian QR code yang cepat.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Kolom Kanan - Form Login */}
        <div className="p-8 bg-white/20 backdrop-blur-2xl border-l border-white/30 backdrop-saturate-150">
          <Link
            to="/roles"
            className="inline-flex items-center text-emerald-600 hover:text-[#047857] transition-colors mb-6 text-sm"
          >
            <ArrowLeft size={16} className="mr-1" />
            Kembali ke Pilih Peran
          </Link>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#047857]/90 backdrop-blur-xl rounded-full mb-4 border border-white/30 shadow-lg">
              <Lock size={24} className="text-gray-100/90" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Login {displayRole}</h1>
            <p className="text-gray-600">Masuk ke dashboard Anda</p>
          </div>

          {error && (
            <div className="p-3 bg-red-100/30 backdrop-blur-xl text-red-700 rounded-xl text-sm mb-6 border border-red-200/50 shadow-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="username"
                  type="text"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Masukkan username"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white/40 backdrop-blur-xl border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/40 transition-all duration-200 placeholder-gray-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Masukkan password"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-white/30 backdrop-blur-xl border border-gray-200/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white/40 transition-all duration-200 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="text-right mt-2">
                <Link to="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700 hover:underline">
                  Lupa Password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600/90 backdrop-blur-xl text-white py-3 rounded-xl hover:bg-emerald-700/90 font-semibold transition-all duration-200 mt-6 disabled:bg-gray-400/70 border border-emerald-500/30 shadow-lg hover:shadow-xl"
            >
              {isSubmitting ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Belum punya akun?
              <Link
                to={`/register/${role}`}
                className="text-emerald-600 hover:text-emerald-700 font-medium ml-1 hover:underline"
              >
                Daftar Sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
