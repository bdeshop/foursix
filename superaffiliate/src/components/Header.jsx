import React, { useState, useRef, useEffect } from 'react';
import { HiOutlineMenuAlt2 } from 'react-icons/hi';
import { FiUser, FiLogOut } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa'; // Added WhatsApp icon
import { NavLink } from 'react-router-dom';
import logo from "../assets/logo.png";
import axios from 'axios';
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import toast,{Toaster} from "react-hot-toast"
import boy_img from "../assets/boy.png"

const Header = ({ toggleSidebar }) => {
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const dropdownRef = useRef(null);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const whatsappNumber = "+447386588951"; // WhatsApp number

  // Function to open WhatsApp
  const openWhatsApp = () => {
    const url = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`;
    window.open(url, '_blank');
  };

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

  const handleLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "You will be logged out!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#22d3ee",
      cancelButtonColor: "#2563eb",
      confirmButtonText: "Yes, logout",
      background: "#000514",
      color: "#ffffff",
    }).then((result) => {
      if (result.isConfirmed) {
        // Remove localStorage data
        localStorage.removeItem('affiliate');
        localStorage.removeItem('affiliatetoken');

        // Optional: show a success message
        toast.success("You have been logged out.");

        // Redirect to /admin-login after a short delay
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      }
    });
  };

  return (
    <>
      <header className='w-full h-[9vh] bg-[#000514] fixed top-0 left-0 z-[1000] px-[20px] py-[10px] flex justify-between items-center shadow-sm border-b border-white/10 backdrop-blur-md'>
        <Toaster
          toastOptions={{
            style: {
              background: '#01081a',
              color: '#fff',
              border: '1px solid rgba(34, 211, 238, 0.2)',
            },
          }}
        />
        
        {/* Left Side Logo + Menu */}
        <div className="logo flex justify-start items-center gap-[20px] w-full">
          <NavLink to="/affiliate/dashboard" className='md:flex justify-start items-center gap-[5px] hidden md:w-[18%]'>
            <img 
              className='w-[50%] max-h-10 object-contain' 
              src={dynamicLogo} 
              alt="logo" 
              onError={(e) => {
                e.target.src = logo;
              }}
            />
          </NavLink>
          <div 
            className="menu text-[25px] cursor-pointer text-gray-400 hover:text-cyan-400 transition-colors" 
            onClick={toggleSidebar}
          >
            <HiOutlineMenuAlt2 />
          </div>
        </div>

        {/* Right Side - Settings & Admin */}
        <div className="relative flex items-center gap-4" ref={dropdownRef}>
          {/* Admin Dropdown */}
          <div className="relative">
            <button 
              className="flex items-center gap-2 text-white cursor-pointer transition-all duration-200 group"
              onClick={() => setDropdownVisible(!dropdownVisible)}
            >
              <span className="hidden md:block text-sm md:text-base font-bold text-gray-300 hover:text-white">Affiliate</span>

              <div className=" rounded-full border-[2px] border-cyan-500 bg-gradient-to-r from-cyan-500 to-blue-600 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-200">
                <img src={boy_img} className='w-[45px]' alt="" />
              </div>
            </button>

            {dropdownVisible && (
              <div className="absolute right-0 mt-2 w-48 bg-[#000514] rounded-md shadow-lg py-1 z-50 border border-white/10">
                <NavLink
                  to="/affiliate/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-cyan-400 transition-all duration-200"
                  onClick={() => setDropdownVisible(false)}
                >
                  <FiUser className="mr-2" />
                  Profile
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-400 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-600/10 hover:text-cyan-400 transition-all duration-200"
                >
                  <FiLogOut className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* WhatsApp Floating Button - Bottom Right Corner */}
      <button
        onClick={openWhatsApp}
        className="fixed bottom-6 right-6 z-[999] bg-[#25D366] hover:bg-[#1da851] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group"
        aria-label="Chat on WhatsApp"
        title="Chat with us on WhatsApp"
      >
        <FaWhatsapp className="text-2xl" />
      </button>
    </>
  );
};

export default Header;