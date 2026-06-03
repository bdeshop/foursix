import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock } from 'react-icons/fa';
import logo from "../assets/logo.png";

const Login = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
        toast.error("Please fill in all fields");
        return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${base_url}/api/auth/admin/login`, formData);
      const { token, admin } = res.data;
       console.log(res.data)
      if (token && admin) {
        toast.success('Login successful!');
        localStorage.setItem('admin', JSON.stringify(admin));
        localStorage.setItem('admintoken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Invalid credentials';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111315] font-poppins px-4">
      {/* React Toastify Container */}
      <ToastContainer 
        position="top-right" 
        autoClose={3000} 
        theme="dark" 
        pauseOnHover 
      />
      
      <div className="w-full max-w-[400px] p-8 bg-[#1a1c23] rounded-xl shadow-2xl border border-gray-800">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-4">
          <img src={logo} alt="Logo" className="h-18 w-auto object-contain mb-4" />
          <h2 className="text-gray-400 text-sm uppercase tracking-[0.2em]">Admin Portal</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email/Username Field */}
          <div className="space-y-1">
            <div className={`flex items-stretch overflow-hidden rounded-lg h-[52px] border transition-all ${errors.email ? 'border-red-500' : 'border-gray-700 focus-within:border-[#d4af37]'}`}>
              <div className="bg-[#252831] flex items-center justify-center w-[55px] border-r border-gray-700">
                <FaUser className={`${errors.email ? 'text-red-500' : 'text-gray-500'}`} />
              </div>
              <input
                type="text"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="flex-1 bg-[#1a1c23] text-gray-100 px-4 focus:outline-none placeholder-gray-600 text-[13px]"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <div className={`flex items-stretch overflow-hidden rounded-lg h-[52px] border transition-all ${errors.password ? 'border-red-500' : 'border-gray-700 focus-within:border-[#d4af37]'}`}>
              <div className="bg-[#252831] flex items-center justify-center w-[55px] border-r border-gray-700">
                <FaLock className={`${errors.password ? 'text-red-500' : 'text-gray-500'}`} />
              </div>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="flex-1 bg-[#1a1c23] text-gray-100 px-4 focus:outline-none placeholder-gray-600 text-[13px]"
                disabled={loading}
              />
            </div>
          </div>
          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F37427] hover:bg-[#b8962e] disabled:bg-gray-600 text-white font-bold py-4 rounded-lg transition-all uppercase tracking-widest text-[13px] shadow-lg active:scale-[0.98] flex justify-center items-center"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-[#1a1c23]" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-8">
          &copy; 2026 Admin Dashboard. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default Login;