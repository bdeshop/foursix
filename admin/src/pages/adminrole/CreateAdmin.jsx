import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaTimes, 
  FaSave,
  FaSpinner,
  FaUserShield,
  FaUsers,
  FaEye,
  FaEyeSlash,
  FaArrowLeft,
  FaUserPlus
} from 'react-icons/fa';
import { FiRefreshCw } from 'react-icons/fi';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import { toast, Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const CreateAdmin = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [roles, setRoles] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    is_active: true
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await fetch(`${base_url}/api/admin/roles`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRoles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email address is required');
      return;
    }
    if (!formData.password) {
      toast.error('Password is required');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (!formData.role) {
      toast.error('Please select a role');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('admintoken') || localStorage.getItem('token');
      const response = await fetch(`${base_url}/api/admin/admins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Admin created successfully!');
        setFormData({
          name: '',
          email: '',
          password: '',
          role: '',
          is_active: true
        });
        setTimeout(() => navigate('/role-list'), 1500);
      } else {
        toast.error(data.error || 'Failed to create admin');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      toast.error('Error creating admin');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500 placeholder-gray-600';
  const selectClass = 'w-full bg-[#0F111A] border border-gray-700 text-gray-200 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-amber-500';

  return (
    <section className="min-h-screen bg-[#0F111A] text-gray-200 font-poppins">
      <Header toggleSidebar={toggleSidebar} />
      <Toaster position="top-right" toastOptions={{ style: { background: '#161B22', color: '#e5e7eb', border: '1px solid #374151' } }} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`transition-all duration-300 flex-1 p-6 overflow-y-auto h-[90vh] ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
          
          {/* Page Header */}
          <div className="rounded-lg mb-8 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-white tracking-tighter uppercase flex items-center gap-2">
                  <FaUserPlus className="text-amber-500" /> Create New Admin
                </h1>
                <p className="text-xs font-bold text-gray-500 mt-1 flex items-center gap-2">
                  Add new administrator with role-based access
                </p>
              </div>
            </div>
            <button
              onClick={() => { setFormData({ name: '', email: '', password: '', role: '', is_active: true }); }}
              className="bg-[#1F2937] hover:bg-amber-600/30 border border-gray-700 hover:border-amber-500/40 px-6 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 text-amber-400 mt-4 md:mt-0"
            >
              <FiRefreshCw /> RESET FORM
            </button>
          </div>

          {/* Create Admin Form */}
          <div className="bg-[#161B22] border border-gray-800 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-6 bg-amber-500 rounded-full"></div>
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-400">
                Admin Information
              </h2>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="mb-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter full name"
                    required
                  />
                </div>

                {/* Email Address */}
                <div className="mb-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Email Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={inputClass}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                {/* Password */}
                <div className="mb-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Password <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={inputClass}
                      placeholder="Enter password (min 6 characters)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">Password must be at least 6 characters</p>
                </div>

                {/* Role Selection */}
                <div className="mb-2">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Assign Role <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className={selectClass}
                    required
                  >
                    <option value="">Select a role</option>
                    {roles.filter(r => r.status === 'active').map(role => (
                      <option key={role._id} value={role.roleName}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                  {roles.filter(r => r.status === 'active').length === 0 && (
                    <p className="text-[10px] text-amber-400 mt-1">
                      No active roles found. Please create a role first.
                    </p>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-800">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <FaSpinner className="animate-spin" /> :""}
                  {loading ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </section>
  );
};

export default CreateAdmin;