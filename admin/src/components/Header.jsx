import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineMenuAlt2 } from 'react-icons/hi';
import { FiSettings, FiUser, FiLogOut } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';
import logo from "../assets/logo.png";
import axios from 'axios';
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

const Header = ({ toggleSidebar }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const dropdownRef = useRef(null);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();

  // Fetch branding data for dynamic logo
  const fetchBrandingData = async () => {
    try {
      const response = await axios.get(`${base_url}/api/branding`);
      if (response.data.success && response.data.data && response.data.data.logo) {
        const logoUrl = response.data.data.logo.startsWith('http') 
          ? response.data.data.logo 
          : `${base_url}${response.data.data.logo.startsWith('/') ? '' : '/'}${response.data.data.logo}`;
        setDynamicLogo(logoUrl);
      }
    } catch (error) {
      console.error("Error fetching branding data:", error);
      setDynamicLogo(logo);
    }
  };

  // Close dropdown when clicking outside
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

  // -------------------logout-function---------------------
  const handleLogout = () => {
        // Remove localStorage data with correct keys
        localStorage.removeItem('admin');
        localStorage.removeItem('admintoken');

        // Optional: clear ALL localStorage if needed
        // localStorage.clear();

        toast.success("You have been logged out.");

        // Redirect to login page
        setTimeout(() => {
          navigate("/admin-login"); // Adjust this to your actual login route
        }, 1000);
  };

  return (
    <header className='w-full h-[9vh] bg-gray-900 fixed top-0 left-0 z-[1000] px-[20px] font-nunito py-[10px] flex justify-between items-center shadow-sm border-gray-200'>
      <Toaster/>
      
      {/* Left Side Logo + Menu */}
      <div className="logo flex justify-start items-center gap-[20px] w-full">
        <NavLink to="/dashboard" className='md:flex justify-start items-center gap-[5px] hidden md:w-[12%]'>
          <img 
            className='w-[60%]' 
            src={dynamicLogo} 
            alt="logo" 
          />
        </NavLink>
        <div className="menu text-[25px] cursor-pointer text-white" onClick={toggleSidebar}>
          <HiOutlineMenuAlt2 />
        </div>
      </div>

      {/* Right Side - Settings & Admin */}
      <div className="relative flex items-center gap-4" ref={dropdownRef}>
        {/* Admin Dropdown */}
        <div className="relative">
          <button 
            className="flex items-center gap-2 text-white cursor-pointer hover:text-[#0A92FA] transition duration-200"
            onClick={() => setDropdownVisible(!dropdownVisible)}
          >
            <div className="w-8 h-8 rounded-full font-bold bg-theme_color flex items-center justify-center overflow-hidden">
              A
            </div>
            <span className="hidden md:block font-bold text-base">Admin</span>
          </button>

          {dropdownVisible && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1 z-50">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition duration-200"
              >
                <FiLogOut className="mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;