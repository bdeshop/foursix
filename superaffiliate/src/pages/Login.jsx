import React, { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import logo from "../assets/logo.png";

const Login = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- VALIDATION LOGIC ---
  const validateForm = () => {
    const { email, password } = formData;
    
    if (!email.trim()) {
      toast.error("Email is required");
      return false;
    }
    
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!password) {
      toast.error("Password is required");
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

    // Run validation check before showing loading state or calling API
    if (!validateForm()) return;

    setLoading(true);
    try {
      const res = await axios.post(`${base_url}/api/auth/affiliate/login`, formData);
      const { token, affiliate } = res.data;
      if(res.data.success){
        toast.success('Login successful!');
        localStorage.setItem('affiliate', JSON.stringify(affiliate));
        localStorage.setItem('affiliatetoken', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setTimeout(() => navigate("/affiliate/dashboard"), 1000);
      }else{
        toast.error(res.data.message);
      }
   
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000514] text-white font-sans relative flex flex-col overflow-hidden">
      <Toaster position="top-center" reverseOrder={false} />

      {/* --- PROFESSIONAL 3D GRID BACKGROUND --- */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0" style={{ perspective: '1200px' }}>
          <div className="absolute top-0 bottom-0 left-[-5%] w-[40%] opacity-20"
            style={{
              transform: 'rotateY(60deg)',
              backgroundImage: 'linear-gradient(to right, #00ffff 1px, transparent 1px), linear-gradient(to bottom, #00ffff 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              transformOrigin: 'left center',
              maskImage: 'linear-gradient(to right, black, transparent)'
            }}></div>
          <div className="absolute top-0 bottom-0 right-[-5%] w-[40%] opacity-20"
            style={{
              transform: 'rotateY(-60deg)',
              backgroundImage: 'linear-gradient(to right, #00ffff 1px, transparent 1px), linear-gradient(to bottom, #00ffff 1px, transparent 1px)',
              backgroundSize: '60px 60px',
              transformOrigin: 'right center',
              maskImage: 'linear-gradient(to left, black, transparent)'
            }}></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-1/2 opacity-10"
            style={{
              transform: 'rotateX(85deg)',
              backgroundImage: 'linear-gradient(to right, #00ffff 1px, transparent 1px), linear-gradient(to bottom, #00ffff 1px, transparent 1px)',
              backgroundSize: '80px 80px',
              transformOrigin: 'top center'
            }}></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-1/2 opacity-10"
            style={{
              transform: 'rotateX(-85deg)',
              backgroundImage: 'linear-gradient(to right, #00ffff 1px, transparent 1px), linear-gradient(to bottom, #00ffff 1px, transparent 1px)',
              backgroundSize: '80px 80px',
              transformOrigin: 'bottom center'
            }}></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,123,255,0.2)_0%,transparent_70%)]"></div>
        </div>
      </div>

      {/* --- HEADER --- */}
      <header className="flex justify-between items-center px-6 md:px-16 py-6 md:py-8 z-20">
        <NavLink to="/">
          <img src={logo} alt="LOGO" className="h-8 md:h-16 w-auto object-contain" />
        </NavLink>
        
        <div className="flex items-center space-x-3 md:space-x-6">
          <NavLink to="/register">
            <button className="text-[10px] md:text-[12px] font-black border-2 border-cyan-500/50 px-4 md:px-8 py-2 md:py-3 rounded-tl-xl rounded-br-xl hover:bg-cyan-500/10 transition-all uppercase tracking-widest">
              Register
            </button>
          </NavLink>
          <NavLink to="/login" className="text-[10px] md:text-[12px] font-black bg-gradient-to-r from-cyan-400 to-blue-600 px-4 md:px-8 py-2 md:py-3 rounded-tl-xl rounded-br-xl text-black uppercase tracking-widest hover:brightness-110 transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)]">
            Log In
          </NavLink>
        </div>
      </header>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 flex items-center justify-center z-10 px-4">
        <div className="w-full max-w-[550px] bg-[#020b22]/90 p-8 md:p-14 shadow-[0_0_80px_rgba(0,0,0,0.9)] border border-white/10 relative backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
            
            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] md:text-sm font-black text-gray-500 tracking-wider uppercase">Email*</label>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full h-12 md:h-14 px-4 mt-1 bg-white text-black text-xs md:text-sm outline-none rounded-sm font-semibold focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div className="space-y-1 md:space-y-2">
              <label className="text-[10px] md:text-sm font-black text-gray-500 tracking-wider uppercase">Password*</label>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full h-12 md:h-14 px-4 mt-1 bg-white text-black text-xs md:text-sm outline-none rounded-sm font-semibold focus:ring-2 focus:ring-cyan-500 transition-all"
              />
            </div>

            <div className="relative pt-4 md:pt-6">
              <button 
                type="submit"
                disabled={loading}
                className={`w-full h-[45px] md:h-[50px] relative font-black tracking-[0.2em] md:tracking-[0.3em] text-white text-sm md:text-base overflow-hidden transition-all shadow-lg ${loading ? 'opacity-70 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                style={{
                  background: "linear-gradient(90deg, #17f9ff 0%, #3e68ff 50%, #8c1eff 100%)",
                }}
              >
                {loading ? "PROCESSING..." : "LOG IN"}
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* --- FOOTER --- */}
      <footer className="py-6 md:py-8 text-center z-10">
        <div className="text-[8px] md:text-[10px] text-gray-600 tracking-[0.3em] md:tracking-[0.5em] font-black uppercase">
          © {new Date().getFullYear()} Foursix.
        </div>
      </footer>
    </div>
  );
};

export default Login;