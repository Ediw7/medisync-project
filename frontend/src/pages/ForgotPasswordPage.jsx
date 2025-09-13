import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Send, ArrowLeft } from 'lucide-react';

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        try {
            // Ganti URL ini dengan endpoint API Anda untuk lupa password
            await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
            setIsSuccess(true);
            setMessage('Tautan untuk mereset password telah dikirim ke email Anda. Silakan periksa kotak masuk Anda.');
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengirim email reset password. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8 relative">
                <Link to="/" className="absolute top-4 left-4 text-gray-400 hover:text-gray-600">
                    <ArrowLeft size={24} />
                </Link>

                <div className="flex justify-center mb-6">
                    <div className="bg-green-100 rounded-full p-4">
                        <Send className="h-8 w-8 text-green-600" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-800">Lupa Password</h1>
                    <p className="text-gray-500 mt-2">
                        {isSuccess 
                            ? 'Permintaan Terkirim!' 
                            : 'Masukkan email Anda untuk menerima tautan reset password.'
                        }
                    </p>
                </div>

                {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}
                {message && <div className="mb-4 p-3 bg-blue-100 text-blue-700 rounded-md text-sm">{message}</div>}
                
                {!isSuccess && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="contoh@email.com"
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
                            {isLoading ? 'Mengirim...' : 'Kirim Tautan Reset'}
                        </button>
                    </form>
                )}

                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Ingat password Anda? <Link to="/login/produsen" className="text-green-600 hover:underline font-medium">Login di sini</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default ForgotPasswordPage;