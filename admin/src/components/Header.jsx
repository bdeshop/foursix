import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineMenuAlt2 } from 'react-icons/hi';
import { FiLogOut, FiUser, FiChevronRight } from 'react-icons/fi';
import { NavLink, useNavigate } from 'react-router-dom';
import logo from "../assets/logo.png";
import profile_img from "../assets/profile.png";
import axios from 'axios';
import toast, { Toaster } from "react-hot-toast";

const Header = ({ toggleSidebar }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const dropdownRef = useRef(null);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();

  const fetchBrandingData = async () => {
    try {
      const response = await axios.get(`${base_url}/api/branding`);
      if (response.data.success && response.data.data?.logo) {
        const logoUrl = response.data.data.logo.startsWith('http') 
          ? response.data.data.logo 
          : `${base_url}${response.data.data.logo.startsWith('/') ? '' : '/'}${response.data.data.logo}`;
        setDynamicLogo(logoUrl);
      }
    } catch (error) {
      setDynamicLogo(logo);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetchBrandingData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin');
    localStorage.removeItem('admintoken');
    toast.success("You have been logged out.");
    setTimeout(() => {
      navigate("/admin-login"); 
    }, 1000);
  };

  return (
    <header className='w-full h-[9vh] bg-[#1a1c23] border-b border-gray-800 fixed top-0 left-0 z-[1000] px-[20px] font-nunito flex justify-between items-center shadow-md'>
      <Toaster />
      
      {/* Left Side Logo + Menu */}
      <div className="flex justify-start items-center gap-[20px]">
        <NavLink to="/dashboard" className='hidden md:flex items-center w-[120px]'>
          <img className='w-full h-auto object-contain' src={dynamicLogo} alt="logo" />
        </NavLink>
        <div className="text-[25px] cursor-pointer text-gray-400 hover:text-[#d4af37] transition-colors" onClick={toggleSidebar}>
          <HiOutlineMenuAlt2 />
        </div>
      </div>

      {/* Right Side - Profile Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button 
          className="flex items-center gap-2 group p-1 rounded-full hover:bg-gray-800 transition-all"
          onClick={() => setDropdownVisible(!dropdownVisible)}
        >
          <div className="relative">
            <img src={profile_img} alt="Profile" className="w-10 h-10 rounded-full border-2 border-[#d4af37]" />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#1a1c23] rounded-full"></div>
          </div>
          <div className="hidden md:flex flex-col items-start leading-tight pr-2">
            <span className="text-sm font-bold text-white">Admin</span>
            <span className="text-[10px] uppercase tracking-wider text-gray-500">Super Admin</span>
          </div>
          <FiChevronRight className={`text-gray-500 transition-transform duration-300 ${dropdownVisible ? 'rotate-90' : ''}`} />
        </button>

        {/* Professional Dropdown Box */}
        {dropdownVisible && (
          <div className="absolute right-0 mt-3 w-72 bg-white rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
            
            {/* Top Section (Cyan/Teal Gradient) */}
            <div className="bg-gradient-to-br from-[#26a69a] to-[#2bbbad] p-6 flex flex-col items-center text-center">
              <div className="relative mb-3">
                <img src={profile_img} alt="Admin" className="w-20 h-20 rounded-full border-4 border-white/30 shadow-lg" />
              </div>
              <h4 className="text-white font-bold text-lg leading-tight">Super Admin</h4>
              <p className="text-white/80 text-[11px] uppercase tracking-widest font-medium">Admin Account</p>
            </div>

            {/* Bottom Section (Links) */}
            <div className="bg-[#1a1c23] p-2">
              <NavLink 
                to="/admin-profile" 
                onClick={() => setDropdownVisible(false)}
                className="flex items-center justify-between w-full px-4 py-3 text-sm text-gray-300 hover:bg-[#252831] hover:text-[#d4af37] rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <FiUser className="text-lg" />
                  <span className="font-medium">View Profile</span>
                </div>
                <FiChevronRight className="text-gray-600 group-hover:translate-x-1 transition-transform" />
              </NavLink>

              <div className="h-[1px] bg-gray-800 my-1 mx-2"></div>

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <FiLogOut className="mr-3 text-lg" />
                <span className="font-bold">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;