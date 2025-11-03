"use client"

import React, { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import SidebarProdusen from "../../../components/SidebarProdusen"
import NavbarProdusen from "../../../components/NavbarProdusen"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Upload, Loader2, CheckCircle, XCircle } from "lucide-react"
import { FaCogs } from "react-icons/fa";

const formatDateForAPI = (date) => {
  if (!date) return null;
  try {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); 
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Error formatting date:", date, error);
    return null;
  }
};

const TambahProduksi = () => {
  const navigate = useNavigate()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [formData, setFormData] = useState({
    nama_obat: "",
    nomor_izin_edar: "",
    dosis: "",
    bentuk_sediaan: "",
    jumlah: "",
    tanggal_produksi: null,
    tanggal_kadaluarsa: null,
    prioritas: "Medium",
    status: "Terjadwal",
    komposisi_obat: "",
    penanggung_jawab: "",
    harga_per_unit: "",
  })
  const [dokumenBpomFile, setDokumenBpomFile] = useState(null)
  const [sertifikatFile, setSertifikatFile] = useState(null)
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showPopup, setShowPopup] = useState(false)
  const [popupMessage, setPopupMessage] = useState("")
  const [popupType, setPopupType] = useState("success") 

  const [previewBatchId, setPreviewBatchId] = useState("Membuat ID...")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const produsenId = localStorage.getItem("produsenId"); 


    if (!token || !produsenId) { 
      showCustomAlert("Sesi Anda tidak valid. Silakan login kembali.", "error")
      setTimeout(() => {
        navigate("/login/produsen")
      }, 1500)
      return; 
    }

 
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const dateStamp = `${year}${month}${day}`;

    const randomHash = Math.random().toString(36).substring(2, 8).toUpperCase(); 


    setPreviewBatchId(`P${produsenId}-${dateStamp}-${randomHash}`);

  }, [navigate]) 


  useEffect(() => {
    if (showPopup && popupType === "success") {
      const timer = setTimeout(() => {
        setShowPopup(false)
        navigate("/produsen/manajemen-produksi") 
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showPopup, popupType, navigate])

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // --- FUNGSI POPUP ---
  const showCustomAlert = (message, type) => {
    console.log("[v0] Popup triggered:", { message, type })
    setPopupMessage(message)
    setPopupType(type)
    setShowPopup(true)
  }

  const closePopup = () => {
    console.log("[v0] Popup closed")
    setShowPopup(false)
    if (popupType === "success") {
        navigate("/produsen/manajemen-produksi");
    }
    setPopupMessage("")
    setPopupType("success")
  }
  // --- AKHIR FUNGSI POPUP ---


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("") 
    setIsSubmitting(true)

    // --- Validasi Wajib Isi (Text & Tanggal) ---
    if (
      !formData.nama_obat ||
      !formData.jumlah ||
      !formData.tanggal_produksi ||
      !formData.tanggal_kadaluarsa
    ) {
      showCustomAlert(
        "Nama Obat, Jumlah, Tanggal Produksi, dan Tanggal Kadaluarsa wajib diisi.",
        "error",
      )
      setIsSubmitting(false)
      return
    }

    // --- Validasi Logika ---
    if (Number(formData.jumlah) <= 0) {
      showCustomAlert("Jumlah produksi harus lebih dari 0.", "error")
      setIsSubmitting(false)
      return
    }

    if (
      formData.tanggal_produksi &&
      formData.tanggal_kadaluarsa &&
      new Date(formData.tanggal_kadaluarsa) <= new Date(formData.tanggal_produksi)
    ) {
      showCustomAlert("Tanggal kadaluarsa harus setelah tanggal produksi.", "error")
      setIsSubmitting(false)
      return
    }

    if (!formData.bentuk_sediaan) {
      showCustomAlert("Bentuk sediaan wajib dipilih.", "error")
      setIsSubmitting(false)
      return
    }
    if (!formData.penanggung_jawab) {
      showCustomAlert("Penanggung jawab wajib diisi.", "error")
      setIsSubmitting(false)
      return
    }

    // --- PERBAIKAN VALIDASI HARGA ---
    if (!formData.harga_per_unit || Number(formData.harga_per_unit) <= 0) {
      showCustomAlert("Harga satuan wajib diisi dan harus lebih dari 0.", "error")
      setIsSubmitting(false)
      return
    }
    // --- AKHIR PERBAIKAN HARGA ---

    // --- PERBAIKAN VALIDASI FILE ---
    if (!dokumenBpomFile) {
      showCustomAlert("Dokumen BPOM wajib diunggah.", "error")
      setIsSubmitting(false)
      return
    }
    
    if (!sertifikatFile) {
      showCustomAlert("Sertifikat Analisis wajib diunggah.", "error")
      setIsSubmitting(false)
      return
    }
    // --- AKHIR PERBAIKAN FILE ---

    const token = localStorage.getItem("token")
    if (!token) {
      showCustomAlert("Sesi Anda telah berakhir, silakan login kembali.", "error")
      setIsSubmitting(false)
      return
    }

    const data = new FormData()
    Object.keys(formData).forEach((key) => {
      if (key === "tanggal_produksi" || key === "tanggal_kadaluarsa") {
        if (formData[key]) {
          data.append(key, formatDateForAPI(formData[key]))
        }
      } else {
        data.append(key, formData[key])
      }
    })

    if (dokumenBpomFile) {
      data.append("dokumen_bpom", dokumenBpomFile)
    }
    if (sertifikatFile) {
      data.append("sertifikat_analisis", sertifikatFile)
    }

    try {
      const response = await fetch("http://localhost:5000/api/produksi", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.message || "Gagal menambahkan data produksi.")

      const finalBatchId = result.generated_batch_id || ""; 
      showCustomAlert(`Jadwal produksi berhasil dibuat! (Batch ID: ${finalBatchId})`, "success")

    } catch (err) {
      showCustomAlert(err.message, "error")
    } finally {
      setIsSubmitting(false)
    }
  }


   const renderPopup = () => {
    if (!showPopup) return null
    return (
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={closePopup}
      >
        <div
          className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full mx-auto animate-in fade-in zoom-in-95 duration-200 border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`flex items-center gap-3 mb-4 ${popupType === "success" ? "text-emerald-600" : "text-red-600"}`}
          >
            {popupType === "success" ? (
              <CheckCircle size={28} className="flex-shrink-0" />
            ) : (
              <XCircle size={28} className="flex-shrink-0" />
            )}
            <h3 className="font-bold text-lg">{popupType === "success" ? "Sukses" : "Error"}</h3>
          </div>
          <p className="text-slate-700 mb-6 leading-relaxed">{popupMessage}</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={closePopup}
              className={`px-6 py-2.5 font-medium rounded-lg transition ${
                popupType === "success"
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800"
                  : "bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
              }`}
            >
              Oke
            </button>
          </div>
        </div>
      </div>
    )
  }
  return (
  <div className="flex min-h-screen bg-slate-50">
    {renderPopup()}

    <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

    <div
      className={`flex-1 flex flex-col transition-all duration-300 ${
        isCollapsed ? "ml-16" : "ml-64"
      }`}
    >
      <NavbarProdusen
        onLogout={() => {
          localStorage.clear();
          navigate("/");
        }}
        username={localStorage.getItem('username')}
      />

      <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 relative">
            <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                  <FaCogs className="text-white" size={24} />
                </div>

                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                    Jadwalkan Produksi Baru
                  </h1>
                  <p className="text-slate-600 text-lg mt-1">
                    Isi formulir di bawah untuk membuat jadwal produksi obat baru
                  </p>
                </div>
              </div>
            </div>
          </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900">Identitas Produk</h2>
                  <p className="text-sm text-emerald-700 mt-1">Informasi dasar tentang produk yang akan diproduksi</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Batch ID (Otomatis)</label>
                      <input
                        type="text"
                        value={previewBatchId}  
                        disabled
                        className="w-full px-4 py-2.5 border border-slate-200 bg-slate-100 text-slate-500 rounded-lg cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Nama Obat (Merek/Generik) <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="nama_obat"
                        value={formData.nama_obat}
                        onChange={handleInputChange}
                        placeholder="Masukkan Nama Obat"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Nomor Izin Edar (BPOM)</label>
                      <input
                        name="nomor_izin_edar"
                        value={formData.nomor_izin_edar}
                        onChange={handleInputChange}
                        placeholder="Masukkan Nomor Izin Edar"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Dosis</label>
                      <input
                        name="dosis"
                        value={formData.dosis}
                        onChange={handleInputChange}
                        placeholder="Masukkan Dosis (cth: 500 mg)"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Bentuk Sediaan <span className="text-red-500">*</span></label>
                      <select
                        name="bentuk_sediaan"
                        value={formData.bentuk_sediaan}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      >
                        <option value="" disabled>
                          Pilih Bentuk Sediaan
                        </option>
                        <option value="Tablet">Tablet</option>
                        <option value="Kapsul">Kapsul</option>
                        <option value="Sirup">Sirup</option>
                        <option value="Injeksi">Injeksi</option>
                        <option value="Salep">Salep</option>
                        <option value="Krim">Krim</option>
                        <option value="Tetes">Tetes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Jumlah Produksi <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        name="jumlah"
                        value={formData.jumlah}
                        onChange={handleInputChange}
                        placeholder="Masukkan Jumlah (pcs)"
                        min="1"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Produksi <span className="text-red-500">*</span></label>
                      <DatePicker
                        selected={formData.tanggal_produksi}
                        onChange={(date) => setFormData({ ...formData, tanggal_produksi: date })}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Kadaluarsa <span className="text-red-500">*</span></label>
                      <DatePicker
                        selected={formData.tanggal_kadaluarsa}
                        onChange={(date) => setFormData({ ...formData, tanggal_kadaluarsa: date })}
                        dateFormat="dd/MM/yyyy"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                    <div>
                      {/* --- PERBAIKAN HARGA SATUAN --- */}
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Harga Satuan (Rp) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        name="harga_per_unit"
                        value={formData.harga_per_unit}
                        onChange={handleInputChange}
                        placeholder="Masukkan Harga Satuan"
                        min="1" // Harga harus lebih dari 0
                        step="0.01"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required // Tambahkan required
                      />
                      {/* --- AKHIR PERBAIKAN --- */}
                    </div>
                  </div>
                </div>
              </div>


              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900">Detail Produksi</h2>
                  <p className="text-sm text-emerald-700 mt-1">Informasi detail tentang proses produksi</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Prioritas</label>
                      <select
                        name="prioritas"
                        value={formData.prioritas}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      >
                        <option value="High">Tinggi</option>
                        <option value="Medium">Sedang</option>
                        <option value="Low">Rendah</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      >
                        <option value="Terjadwal">Terjadwal</option>
                        <option value="Dalam Produksi">Dalam Produksi</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Penanggung Jawab <span className="text-red-500">*</span></label>
                      <input
                        name="penanggung_jawab"
                        value={formData.penanggung_jawab}
                        onChange={handleInputChange}
                        placeholder="Masukkan Nama Penanggung Jawab"
                        className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Komposisi Obat</label>
                    <textarea
                      name="komposisi_obat"
                      value={formData.komposisi_obat}
                      onChange={handleInputChange}
                      placeholder="Masukkan komposisi obat (misalnya: Paracetamol 500 mg, Laktosa, Pati)"
                      rows={4}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200">
                  <h2 className="text-lg font-semibold text-emerald-900">Dokumen Pendukung</h2>
                  <p className="text-sm text-emerald-700 mt-1">Upload dokumen yang diperlukan untuk validasi</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Dokumen BPOM <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          name="dokumen_bpom"
                          onChange={(e) => setDokumenBpomFile(e.target.files?.[0] || null)}
                          accept=".pdf,.png,.jpg"
                          className="hidden"
                          id="dokumen_bpom"
                          // 'required' dihapus dari HTML, divalidasi di JS
                        />
                        <label
                          htmlFor="dokumen_bpom"
                          className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 transition flex items-center gap-2 border border-slate-300"
                        >
                          <Upload size={18} />
                          <span className="truncate">{dokumenBpomFile ? dokumenBpomFile.name : "Pilih File"}</span>
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Sertifikat Analisis <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          name="sertifikat_analisis"
                          onChange={(e) => setSertifikatFile(e.target.files?.[0] || null)}
                          accept=".pdf,.png,.jpg"
                          className="hidden"
                          id="sertifikat_analisis"
                          // 'required' dihapus dari HTML, divalidasi di JS
                        />
                        <label
                          htmlFor="sertifikat_analisis"
                          className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg cursor-pointer hover:bg-slate-200 transition flex items-center gap-2 border border-slate-300"
                        >
                          <Upload size={18} />
                          <span className="truncate">{sertifikatFile ? sertifikatFile.name : "Pilih File"}</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/produsen/manajemen-produksi")}
                  className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="animate-spin" size={18} />}
                  {isSubmitting ? "Menyimpan..." : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
       <style jsx>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}

export default TambahProduksi