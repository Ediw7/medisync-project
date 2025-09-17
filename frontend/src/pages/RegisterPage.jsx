import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, User, Mail, Lock, Building, FileBadge, MapPin, ArrowLeft, ShieldCheck, GitBranch, PackageSearch, Loader2 } from 'lucide-react';

// Komponen InputField yang bisa digunakan kembali
const InputField = ({ name, type = "text", placeholder, icon, value, onChange, required = true }) => (
    <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">{icon}</div>
        <input
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            required={required}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700"
        />
    </div>
);

function RegisterPage() {
    const [form, setForm] = useState({
        username: '', email: '', password: '', confirmPassword: '',
        namaResmi: '', nomorIzin: '', alamat: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { role } = useParams();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        if (form.password !== form.confirmPassword) {
            setError('Password dan konfirmasi password tidak cocok');
            setIsSubmitting(false);
            return;
        }
        try {
            await axios.post('http://localhost:5000/api/auth/register', {
                username: form.username,
                email: form.email,
                password: form.password,
                role: role,
                namaResmi: form.namaResmi,
                nomorIzin: form.nomorIzin,
                alamat: form.alamat,
            });
            alert('Registrasi berhasil. Akun Anda akan segera diverifikasi oleh admin sebelum bisa digunakan untuk login.');
            navigate(`/login/${role}`);
        } catch (error) {
            setError(error.response?.data?.message || 'Terjadi kesalahan saat registrasi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayRole = role === 'pbf' ? role.toUpperCase() : role.charAt(0).toUpperCase() + role.slice(1);
    
    const izinLabel = {
        produsen: "Nomor Izin Industri Farmasi (IIF)",
        pbf: "Nomor Izin PBF",
        apotek: "Nomor Surat Izin Apotek (SIA)"
    };

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
            
            <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl grid md:grid-cols-2 overflow-hidden border border-gray-200">
                {/* Kolom Kiri - Branding */}
                <div className="hidden md:block p-10 bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
                    <h2 className="text-3xl font-bold mb-4">Bergabung dengan Jaringan MediSync</h2>
                    <p className="text-emerald-100 mb-8">Daftarkan entitas Anda untuk menjadi bagian dari ekosistem rantai pasok farmasi yang transparan dan aman.</p>
                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <ShieldCheck className="h-8 w-8 text-emerald-300 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold">Data Terverifikasi</h3>
                                <p className="text-sm text-emerald-200">Setiap peserta di jaringan akan diverifikasi untuk menjamin kepercayaan.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <GitBranch className="h-8 w-8 text-emerald-300 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold">Alur Kerja Terintegrasi</h3>
                                <p className="text-sm text-emerald-200">Lakukan pemesanan dan pengiriman dalam satu platform yang terhubung.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <PackageSearch className="h-8 w-8 text-emerald-300 mt-1 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold">Kepatuhan Regulasi</h3>
                                <p className="text-sm text-emerald-200">Sistem dirancang untuk membantu memenuhi standar regulasi farmasi.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan - Form Registrasi */}
                <div className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">Buat Akun {displayRole}</h1>
                        <p className="text-gray-600">Lengkapi data untuk bergabung dengan jaringan.</p>
                    </div>

                    {error && <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-6 border border-red-200">{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-gray-700 border-b pb-2">Informasi Perusahaan / Apotek</h3>
                            <InputField name="namaResmi" placeholder="Nama Resmi Sesuai Izin" icon={<Building size={18} />} value={form.namaResmi} onChange={handleChange} />
                            <InputField name="nomorIzin" placeholder={izinLabel[role]} icon={<FileBadge size={18} />} value={form.nomorIzin} onChange={handleChange} />
                            <InputField name="alamat" placeholder="Alamat Lengkap Sesuai Izin" icon={<MapPin size={18} />} value={form.alamat} onChange={handleChange} />
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-base font-semibold text-gray-700 border-b pb-2 pt-2">Informasi Akun Login</h3>
                            <InputField name="email" type="email" placeholder="Alamat Email" icon={<Mail size={18} />} value={form.email} onChange={handleChange} />
                            <InputField name="username" placeholder="Username" icon={<User size={18} />} value={form.username} onChange={handleChange} />
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={handleChange} placeholder="Password" required className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <div className="relative">
                                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input name="confirmPassword" type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={handleChange} placeholder="Konfirmasi Password" required className="w-full pl-12 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"/>
                                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-semibold transition-all duration-300 text-lg shadow-lg hover:shadow-emerald-200 disabled:bg-gray-400 flex items-center justify-center">
                                {isSubmitting && <Loader2 className="animate-spin mr-2"/>}
                                {isSubmitting ? 'Memproses...' : 'Ajukan Pendaftaran'}
                            </button>
                        </div>
                    </form>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600">
                            Sudah punya akun? 
                            <Link to={`/login/${role}`} className="text-emerald-600 hover:underline font-medium ml-1">Login Sekarang</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;