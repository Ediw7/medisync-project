import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarProdusen from '../../../components/SidebarProdusen';
import NavbarProdusen from '../../../components/NavbarProdusen';
import {
  Loader2,
  AlertTriangle,
  User,
  Shield,
  Building,
  Mail,
  Phone,
  MapPin,
  FileText,
  Lock,
  Save,
  Edit,
  X,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// --- Komponen Tampilan (Mode View) ---
const InfoItem = ({ label, value, icon: Icon, isFull = false }) => (
  <div className={`col-span-1 ${isFull ? 'md:col-span-2' : ''}`}>
    <label className="block text-sm font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
      <Icon size={14} /> {label}
    </label>
    <p className="text-base text-slate-800 p-2.5 bg-slate-50 rounded-lg min-h-[44px]">
      {value || '-'}
    </p>
  </div>
);

// --- Komponen Input (Mode Edit) ---
const EditItem = ({
  label,
  name,
  value,
  onChange,
  disabled = false,
  type = 'text',
  icon: Icon,
  required = false,
}) => (
  <div className={`col-span-1 ${type === 'textarea' ? 'md:col-span-2' : ''}`}>
    <label
      htmlFor={name}
      className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5"
    >
      <Icon size={14} /> {label}
    </label>
    <div className="relative">
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          required={required}
          rows={4}
          className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value || ''}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className="w-full pl-4 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:bg-slate-100 disabled:cursor-not-allowed"
        />
      )}
    </div>
  </div>
);

// --- Komponen Ganti Password (SAMA DENGAN PBF) ---
const SecuritySettings = () => {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [passError, setPassError] = useState('');

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError('');
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPassError('Password baru dan konfirmasi password tidak cocok.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPassError('Password baru minimal harus 6 karakter.');
      return;
    }

    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:5000/api/produsen/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success('Password berhasil diubah!');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        throw new Error(response.data.message || 'Gagal mengubah password.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handlePasswordSubmit}>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-red-50 to-rose-100 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-red-900 flex items-center gap-2">
            <Shield size={20} /> Keamanan Akun
          </h2>
        </div>

        <div className="p-6 space-y-4 max-w-lg">
          {passError && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
              {passError}
            </div>
          )}
          <InputField
            label="Password Saat Ini"
            name="currentPassword"
            type="password"
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            icon={Lock}
            required
          />
          <InputField
            label="Password Baru"
            name="newPassword"
            type="password"
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            icon={Lock}
            required
          />
          <InputField
            label="Konfirmasi Password Baru"
            name="confirmPassword"
            type="password"
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            icon={Lock}
            required
          />
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:bg-slate-400 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? 'Menyimpan...' : 'Ubah Password'}
          </button>
        </div>
      </div>
    </form>
  );
};

// --- Komponen Input Helper ---
const InputField = ({
  label,
  name,
  value,
  onChange,
  disabled = false,
  type = 'text',
  icon: Icon,
  required = false,
}) => (
  <div>
    <label htmlFor={name} className="block text-sm font-semibold text-slate-700 mb-2">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
      )}
      <input
        id={name}
        name={name}
        type={type}
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full ${Icon ? 'pl-11' : 'pl-4'} pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition disabled:bg-slate-100 disabled:cursor-not-allowed`}
      />
    </div>
  </div>
);

// --- Komponen Form Profil (SESUAI DENGAN PBF + FIELD PRODUSEN) ---
const ProfileDetails = ({ profile, onProfileUpdate }) => {
  const [formData, setFormData] = useState({ ...profile });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFormData({ ...profile });
  }, [profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({ ...profile });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:5000/api/produsen/profile', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        onProfileUpdate(response.data.data);
        toast.success('Profil berhasil diperbarui!');
        setIsEditing(false);
        localStorage.setItem('namaResmi', response.data.data.nama_resmi);
        localStorage.setItem('email', response.data.data.email);
      } else {
        throw new Error(response.data.message || 'Gagal memperbarui profil.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-emerald-900 flex items-center gap-2">
            <Building size={20} /> Informasi Produsen
          </h2>
          <button
            type="button"
            onClick={isEditing ? handleCancelEdit : () => setIsEditing(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
              isEditing
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {isEditing ? <X size={16} /> : <Edit size={16} />}
            {isEditing ? 'Batal' : 'Edit Profil'}
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {isEditing ? (
            <>
              <EditItem
                label="Username"
                name="username"
                value={formData.username}
                icon={User}
                disabled
              />
              <EditItem
                label="Email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                icon={Mail}
                required
              />
              <EditItem
                label="Nama Resmi Produsen"
                name="nama_resmi"
                value={formData.nama_resmi}
                onChange={handleInputChange}
                icon={Building}
                required
              />
              <EditItem
                label="Kontak Telepon"
                name="kontak_telepon"
                value={formData.kontak_telepon}
                onChange={handleInputChange}
                icon={Phone}
              />
              <EditItem
                label="Nomor Izin (NIE/SIUP)"
                name="nomor_izin"
                value={formData.nomor_izin}
                onChange={handleInputChange}
                icon={FileText}
                required
              />
              <EditItem
                label="Nomor Sertifikat CPO"
                name="nomor_sia_sika"
                value={formData.nomor_sia_sika}
                onChange={handleInputChange}
                icon={FileText}
              />
              <EditItem
                label="Nama Penanggung Jawab"
                name="nama_apoteker"
                value={formData.nama_apoteker}
                onChange={handleInputChange}
                icon={User}
              />
              <EditItem
                label="Nomor Sertifikat Tambahan"
                name="nomor_sipa"
                value={formData.nomor_sipa}
                onChange={handleInputChange}
                icon={FileText}
              />
              <EditItem
                label="Alamat"
                name="alamat"
                value={formData.alamat}
                onChange={handleInputChange}
                icon={MapPin}
                type="textarea"
                required
              />
            </>
          ) : (
            <>
              <InfoItem label="Username" value={formData.username} icon={User} />
              <InfoItem label="Email" value={formData.email} icon={Mail} />
              <InfoItem label="Nama Resmi Produsen" value={formData.nama_resmi} icon={Building} />
              <InfoItem label="Kontak Telepon" value={formData.kontak_telepon} icon={Phone} />
              <InfoItem label="Nomor Izin (NIE/SIUP)" value={formData.nomor_izin} icon={FileText} />
              <InfoItem
                label="Nomor Sertifikat CPO"
                value={formData.nomor_sia_sika}
                icon={FileText}
              />
              <InfoItem label="Nama Penanggung Jawab" value={formData.nama_apoteker} icon={User} />
              <InfoItem
                label="Nomor Sertifikat Tambahan"
                value={formData.nomor_sipa}
                icon={FileText}
              />
              <InfoItem label="Alamat" value={formData.alamat} icon={MapPin} isFull />
            </>
          )}
        </div>

        {isEditing && (
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-emerald-600 text-white font-medium rounded-lg hover:bg-emerald-700 transition disabled:bg-slate-400 flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        )}
      </div>
    </form>
  );
};

// --- Komponen Utama Halaman Profil ---
const ProfilProdusen = () => {
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('profil');
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const username = localStorage.getItem('username');

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('Sesi tidak valid.');
          navigate('/login/produsen');
          return;
        }
        const response = await axios.get('http://localhost:5000/api/produsen/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setProfileData(response.data.data);
          localStorage.setItem('email', response.data.data.email);
        } else {
          throw new Error(response.data.message || 'Gagal memuat profil.');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        toast.error(err.response?.data?.message || err.message);
        if (err.response?.status === 401) navigate('/login/produsen');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleUpdateProfile = (newProfileData) => {
    setProfileData(newProfileData);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
        </div>
      );
    }
    if (error && !profileData) {
      return (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-sm font-medium flex items-center gap-2">
          <AlertTriangle size={18} /> {error}
        </div>
      );
    }
    if (activeTab === 'profil' && profileData) {
      return <ProfileDetails profile={profileData} onProfileUpdate={handleUpdateProfile} />;
    }
    if (activeTab === 'keamanan') {
      return <SecuritySettings />;
    }
    return null;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SidebarProdusen isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'ml-16' : 'ml-64'}`}
      >
        <NavbarProdusen
          onLogout={handleLogout}
          username={username}
          onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
        />

        <main className="flex-1 overflow-auto pt-[72px] px-12 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-10 relative">
              <div className="absolute -top-20 -left-20 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
                    <User className="text-white" size={24} />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
                      Profil
                    </h1>
                  </div>
                </div>
                <p className="text-slate-600 text-lg flex items-center gap-2">
                  <span>Kelola informasi akun dan keamanan Anda.</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-b border-slate-200 mb-6">
              <TabButton
                label="Profil Saya"
                icon={User}
                isActive={activeTab === 'profil'}
                onClick={() => setActiveTab('profil')}
              />
              <TabButton
                label="Keamanan"
                icon={Shield}
                isActive={activeTab === 'keamanan'}
                onClick={() => setActiveTab('keamanan')}
              />
            </div>

            <div>{renderContent()}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- Komponen Tab Helper ---
const TabButton = ({ label, icon: Icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition-colors ${
      isActive
        ? 'border-emerald-500 text-emerald-600'
        : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
    }`}
  >
    <Icon size={18} />
    <span className="text-sm">{label}</span>
  </button>
);

export default ProfilProdusen;
