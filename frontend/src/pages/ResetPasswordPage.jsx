// src/pages/ResetPasswordPage.jsx

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';

function ResetPasswordPage() {
    const [form, setForm] = useState({ password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { token } = useParams(); // Mengambil token dari URL
    const navigate = useNavigate();

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (form.password !== form.confirmPassword) {
            setError('Password dan konfirmasi password tidak cocok.');
            return;
        }

        if (form.password.length < 6) {
            setError('Password minimal harus 6 karakter.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/auth/reset-password', {
                token: token,
                newPassword: form.password
            });
            setMessage(res.data.message);
            // Kosongkan form setelah berhasil
            setForm({ password: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mereset password. Token mungkin sudah tidak valid.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
                <div className="flex justify-center mb-6">
                    <div className="bg-green-100 rounded-full p-4">
                        <Lock className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Reset Password</h1>
                    <p className="text-gray-500 mt-2">Masukkan password baru Anda di bawah ini.</p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                
                {message ? (
                    <div className="text-center">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                        <p className="p-3 bg-green-100 text-green-800 rounded-md">{message}</p>
                        <Link to="/login/produsen" className="mt-6 inline-block w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-semibold transition duration-300">
                            Kembali ke Halaman Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="********"
                                    required
                                    className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password Baru</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="********"
                                    required
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-green-600 text-white py-3 rounded-md hover:bg-green-700 font-semibold transition duration-300 disabled:bg-green-400"
                        >
                            {isLoading ? 'Menyimpan...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ResetPasswordPage;