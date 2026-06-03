import React, { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaKey, FaEye, FaEyeSlash,
  FaShieldAlt, FaCheck, FaExclamationTriangle,
  FaLock, FaHistory, FaBell
} from 'react-icons/fa';
import { FiChevronRight, FiEdit3 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';
import profile_img from "../../assets/profile.png";

const Profile = () => {
  const navigate = useNavigate();
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [passwordStrength, setPasswordStrength] = useState({
    length: false, uppercase: false, lowercase: false, number: false, special: false
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchAdminProfile = async () => {
    try {
      const response = await axios.get(`${base_url}/api/admin/profile`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admintoken')}` }
      });
      if (response.data.success) setAdminData(response.data.data);
    } catch (error) {
      toast.error('Failed to load profile');
    }
  };

  const checkPasswordStrength = (password) => {
    setPasswordStrength({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    if (name === 'newPassword') checkPasswordStrength(value);
  };

  const handleLogout = () => {
    localStorage.removeItem('admintoken');
    localStorage.removeItem('admin');
    toast.success('Password updated. Please login again.');
    setTimeout(() => navigate('/admin-login'), 2000);
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.put(`${base_url}/api/admin/update-password`, passwordForm, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admintoken')}` }
      });
      if (response.data.success) handleLogout();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAdminProfile(); }, []);

  const getPasswordStrengthPercentage = () => {
    const checks = Object.values(passwordStrength);
    return (checks.filter(Boolean).length / checks.length) * 100;
  };

  const strengthInfo = (() => {
    const p = getPasswordStrengthPercentage();
    if (p === 0) return { color: 'bg-gray-700', text: 'Not set', textColor: 'text-gray-500' };
    if (p <= 40) return { color: 'bg-red-500', text: 'Weak', textColor: 'text-red-500' };
    if (p <= 80) return { color: 'bg-yellow-500', text: 'Good', textColor: 'text-yellow-500' };
    return { color: 'bg-green-500', text: 'Strong', textColor: 'text-green-500' };
  })();

  const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

  return (
    <section className="font-nunito min-h-screen bg-[#0f1113] text-white">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[9vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 lg:p-10 overflow-y-auto h-[91vh] no-scrollbar ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          
          <div className="mb-8">
            <h1 className="text-2xl font-bold flex items-center gap-3">
              Security & Profile Settings
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage your account information and password security</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN - Profile Card (Same as Dropdown Style) */}
            <div className="lg:col-span-4">
              <div className="bg-[#1a1c23] rounded-2xl border border-gray-800 overflow-hidden shadow-sm">
                {/* Image Gradient Header */}
                <div className="bg-gradient-to-br from-[#26a69a] to-[#2bbbad] p-8 flex flex-col items-center relative">
                  <div className="relative group">
                    <img src={profile_img} alt="Admin" className="w-28 h-28 rounded-full border-4 border-white/20 shadow-xl" />
                    <div className="absolute bottom-1 right-1 bg-[#d4af37] p-2 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg">
                      <FiEdit3 className="text-[#1a1c23] text-sm" />
                    </div>
                  </div>
                  <h3 className="text-white text-xl font-bold mt-4">{adminData?.username || 'Super Admin'}</h3>
                  <p className="text-white/70 text-[11px] uppercase tracking-widest font-bold">Admin Account</p>
                </div>

                {/* Details List */}
                <div className="p-6 space-y-5">
                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-lg bg-[#252831] flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-[#1a1c23] transition-all">
                      <FaEnvelope />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Email Address</p>
                      <p className="text-sm font-medium text-gray-200">{adminData?.email || 'admin@example.com'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-lg bg-[#252831] flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-[#1a1c23] transition-all">
                      <FaLock />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Account Role</p>
                      <p className="text-sm font-medium text-gray-200">{adminData?.role || 'Administrator'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 group">
                    <div className="w-10 h-10 rounded-lg bg-[#252831] flex items-center justify-center text-[#d4af37] group-hover:bg-[#d4af37] group-hover:text-[#1a1c23] transition-all">
                      <FaHistory />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Member Since</p>
                      <p className="text-sm font-medium text-gray-200">{formatDate(adminData?.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Change Password (Portal Style) */}
            <div className="lg:col-span-8">
              <div className="bg-[#1a1c23] rounded-2xl border border-gray-800 shadow-sm p-6 lg:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <h2 className="text-xl font-bold">Update Password</h2>
                </div>

                <form onSubmit={changePassword} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Current Password */}
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Current Password</label>
                      <div className="relative">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          name="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-[#111315] border border-gray-800 rounded-xl px-4 py-3.5 focus:border-[#d4af37] focus:outline-none transition-all text-gray-200"
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-4 top-4 text-gray-600 hover:text-[#d4af37]">
                          {showCurrentPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          name="newPassword"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-[#111315] border border-gray-800 rounded-xl px-4 py-3.5 focus:border-[#d4af37] focus:outline-none transition-all text-gray-200"
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-4 text-gray-600 hover:text-[#d4af37]">
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2 block">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                          className="w-full bg-[#111315] border border-gray-800 rounded-xl px-4 py-3.5 focus:border-[#d4af37] focus:outline-none transition-all text-gray-200"
                          placeholder="••••••••"
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-4 text-gray-600 hover:text-[#d4af37]">
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Strength Meter */}
                  {passwordForm.newPassword && (
                    <div className="bg-[#111315] border border-gray-800 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-xs font-bold text-gray-500 uppercase">Security Strength: <span className={strengthInfo.textColor}>{strengthInfo.text}</span></span>
                        <span className="text-xs text-gray-600">{Math.round(getPasswordStrengthPercentage())}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${strengthInfo.color} transition-all duration-500`} style={{ width: `${getPasswordStrengthPercentage()}%` }}></div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4">
                        {[
                          { key: 'length', label: '8+ Characters' },
                          { key: 'uppercase', label: 'Uppercase' },
                          { key: 'lowercase', label: 'Lowercase' },
                          { key: 'number', label: 'Number' },
                          { key: 'special', label: 'Symbol' }
                        ].map((req) => (
                          <div key={req.key} className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${passwordStrength[req.key] ? 'bg-green-500 text-[#1a1c23]' : 'bg-gray-800 text-gray-600'}`}>
                              <FaCheck size={8} />
                            </div>
                            <span className={`text-[11px] ${passwordStrength[req.key] ? 'text-gray-300' : 'text-gray-600'}`}>{req.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#d4af37] cursor-pointer to-[#b8962d] text-[#1a1c23] font-bold py-4 rounded-xl shadow-xl hover:shadow-[#d4af37]/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isLoading ? <div className="w-5 h-5 border-2 border-[#1a1c23] border-t-transparent animate-spin rounded-full"></div> :""}
                    Update Security Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Profile;