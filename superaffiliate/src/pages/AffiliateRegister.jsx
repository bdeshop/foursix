import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate, NavLink } from 'react-router-dom';
import logo from "../assets/logo.png";

const AffiliateRegister = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '', 
    password: '', 
    confirmPassword: '',
    firstName: '', 
    lastName: '', 
    phone: '',
    company: '', 
    website: ''
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { firstName, lastName, email, phone, password, confirmPassword } = formData;
    
    if (!firstName || !lastName || !email || !phone || !password) {
      toast.error("Please fill in all required fields");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format");
      return false;
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Sending only the necessary profile data
      const res = await axios.post(`${base_url}/api/auth/affiliate/register`, formData);
      if (res.data.success) {
        toast.success('Registration successful! Awaiting approval.');
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000514] text-white font-sans relative flex flex-col overflow-x-hidden">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Futuristic Background Decoration */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0" style={{ perspective: '1200px' }}>
          <div className="absolute top-0 bottom-0 left-[-5%] w-[40%] opacity-20" style={{ transform: 'rotateY(60deg)', backgroundImage: 'linear-gradient(to right, #00ffff 1px, transparent 1px), linear-gradient(to bottom, #00ffff 1px, transparent 1px)', backgroundSize: '60px 60px', transformOrigin: 'left center', maskImage: 'linear-gradient(to right, black, transparent)' }}></div>
          <div className="absolute top-0 bottom-0 right-[-5%] w-[40%] opacity-20" style={{ transform: 'rotateY(-60deg)', backgroundImage: 'linear-gradient(to right, #00ffff 1px, transparent 1px), linear-gradient(to bottom, #00ffff 1px, transparent 1px)', backgroundSize: '60px 60px', transformOrigin: 'right center', maskImage: 'linear-gradient(to left, black, transparent)' }}></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,123,255,0.15)_0%,transparent_70%)]"></div>
        </div>
      </div>

      <header className="flex justify-between items-center px-6 md:px-16 py-6 z-20">
        <NavLink to="/">
          <img src={logo} alt="LOGO" className="h-8 md:h-14 object-contain" />
        </NavLink>
        <div className="flex items-center space-x-4">
          <NavLink to="/login" className="text-[10px] md:text-[11px] font-black border-2 border-cyan-500/50 px-4 md:px-6 py-2 rounded-tl-lg rounded-br-lg hover:bg-cyan-500/10 transition-all uppercase tracking-widest">
            Log In
          </NavLink>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center z-10 px-4 py-6 md:py-10">
        <div className="w-full max-w-[700px] bg-[#020b22]/90 p-6 md:p-12 shadow-[0_0_80px_rgba(0,0,0,0.8)] border border-white/10 backdrop-blur-md relative">
          
          <div className="mb-6 md:mb-8">
            <h2 className="text-xl md:text-2xl font-black tracking-tighter bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent uppercase">
              Affiliate Registration
            </h2>
            <div className="h-1 w-16 md:w-20 bg-cyan-500 mt-2"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            <div className="animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} />
                <InputField label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <InputField label="Email" name="email" type="email" value={formData.email} onChange={handleChange} />
                <InputField label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <InputField label="Password" name="password" type="password" value={formData.password} onChange={handleChange} />
                <InputField label="Confirm Password" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} />
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                style={{ background: "linear-gradient(90deg, #17f9ff 0%, #3e68ff 50%, #8c1eff 100%)" }}
                className={`w-full mt-8 h-12 md:h-14 text-xs md:text-sm font-black tracking-widest cursor-pointer text-white shadow-lg transition-all uppercase ${loading ? 'opacity-70' : 'active:scale-95'}`}
              >
                {loading ? "Registering..." : "Create Account"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <footer className="py-6 text-center z-10 border-t border-white/5">
        <div className="text-[8px] md:text-[10px] text-gray-600 tracking-[0.4em] font-black uppercase">
          © {new Date().getFullYear()} Foursix AFFILIATE NETWORK
        </div>
      </footer>
    </div>
  );
};

const InputField = ({ label, name, type = "text", value, onChange }) => (
  <div className="space-y-1">
    <label className="text-[10px] md:text-sm font-semibold text-gray-500 tracking-widest uppercase">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={label}
      className="w-full h-10 md:h-12 px-4 bg-white mt-1 text-black text-xs md:text-sm outline-none rounded-sm font-bold focus:ring-2 focus:ring-cyan-500 transition-all"
    />
  </div>
);

export default AffiliateRegister;