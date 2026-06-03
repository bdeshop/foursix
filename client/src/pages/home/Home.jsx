import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { Header } from "../../components/header/Header";
import { Slider } from "../../components/home_componets/Slider";
import Footer from "../../components/footer/Footer";
import { AiOutlineSound } from "react-icons/ai";
import Category from "../../components/home_componets/category/Categroy";
import ProviderSlider from "../../components/home_componets/provider/ProviderSlider";
import Event from "../../components/home_componets/event/Event";
import Featured from "../../components/home_componets/featured/Featured";
import logo from "../../assets/logo.png";
import axios from 'axios';
import { Mobileslider } from "../../components/home_componets/Mobileslider";
import Sports from "../../components/home_componets/sports/Sports";
import WelcomeBonusPopup from "./WelcomeBonusPopup";

// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT
// ─────────────────────────────────────────────────────────────────────────────
const AuthContext = createContext();
const useAuth = () => useContext(AuthContext);

let userCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000;

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }

    if (userCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setUser(userCache);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${base_url}/api/user/my-information`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        userCache = data.data;
        cacheTimestamp = Date.now();
        setUser(data.data);
      } else {
        localStorage.removeItem('token');
        userCache = null;
        cacheTimestamp = null;
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      userCache = null;
      cacheTimestamp = null;
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('token', token);
    userCache = userData;
    cacheTimestamp = Date.now();
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, checkAuthStatus, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOME CONTENT
// ─────────────────────────────────────────────────────────────────────────────
const HomeContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const [notice, setNotice] = useState("");
  const [brandingCache, setBrandingCache] = useState(null);

  // ── Welcome bonus popup state ──────────────────────────────────────────────
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // ── Check for new registration flag ───────────────────────────────────────
  useEffect(() => {
    const shouldShow = localStorage.getItem('show_welcome_bonus');
    if (shouldShow === 'true') {
      // Small delay so the home page renders first, then popup appears
      const t = setTimeout(() => {
        setShowWelcomePopup(true);
        localStorage.removeItem('show_welcome_bonus');
      }, 600);
      return () => clearTimeout(t);
    }
  }, []);

  // ── Branding fetch ─────────────────────────────────────────────────────────
  const fetchBrandingData = async () => {
    if (brandingCache) {
      setDynamicLogo(brandingCache);
      return;
    }

    const cachedBranding = localStorage.getItem('branding_logo');
    const cacheTime = localStorage.getItem('branding_cache_time');

    if (cachedBranding && cacheTime && Date.now() - parseInt(cacheTime) < 30 * 60 * 1000) {
      setDynamicLogo(cachedBranding);
      setBrandingCache(cachedBranding);
      return;
    }

    try {
      const response = await axios.get(`${base_url}/api/branding`);
      if (response.data.success && response.data.data && response.data.data.logo) {
        const logoUrl = response.data.data.logo.startsWith('http')
          ? response.data.data.logo
          : `${base_url}${response.data.data.logo.startsWith('/') ? '' : '/'}${response.data.data.logo}`;

        setDynamicLogo(logoUrl);
        setBrandingCache(logoUrl);
        localStorage.setItem('branding_logo', logoUrl);
        localStorage.setItem('branding_cache_time', Date.now().toString());
      }
    } catch (error) {
      console.error("Error fetching branding data:", error);
    }
  };

  // ── Notice fetch ───────────────────────────────────────────────────────────
  const fetchNotice = async () => {
    try {
      const response = await axios.get(`${base_url}/api/notice`);
      if (response.data.success) {
        const title = response.data.data?.title ||
          "Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!";
        setNotice(title);
        localStorage.setItem('notice_data', JSON.stringify({ title, timestamp: Date.now() }));
      }
    } catch (error) {
      console.error("Error fetching notice:", error);
      const cachedNotice = localStorage.getItem('notice_data');
      if (cachedNotice) {
        const parsed = JSON.parse(cachedNotice);
        if (Date.now() - parsed.timestamp < 60 * 60 * 1000) {
          setNotice(parsed.title);
          return;
        }
      }
      setNotice("Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!");
    }
  };

  // ── Initial load effect ────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const isInitialLoad =
      performance.navigation.type === performance.navigation.TYPE_NAVIGATE ||
      performance.navigation.type === performance.navigation.TYPE_RELOAD;

    if (isInitialLoad) setIsLoading(true);

    fetchBrandingData();
    fetchNotice();

    const handleLoad = () => { if (mounted) setIsLoading(false); };

    if (document.readyState === 'complete') {
      if (mounted) setIsLoading(false);
    } else {
      window.addEventListener('load', handleLoad);
      const fallbackTimer = setTimeout(() => { if (mounted) setIsLoading(false); }, 3000);
      return () => {
        mounted = false;
        window.removeEventListener('load', handleLoad);
        clearTimeout(fallbackTimer);
      };
    }

    return () => { mounted = false; };
  }, []);

  return (
    <div className="h-screen overflow-hidden font-poppins bg-[#1a1a1a] text-white">

      {/* ── Welcome Bonus Popup ────────────────────────────────────────────── */}
      {showWelcomePopup && (
        <WelcomeBonusPopup onClose={() => setShowWelcomePopup(false)} />
      )}

      {/* ── Loading Overlay ────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-full bg-[#0a0a0a] flex justify-center items-center z-[10000000]">
          <div className="relative w-36 h-36 md:w-44 md:h-44 flex justify-center items-center">
            <div
              className="absolute w-full h-full rounded-full border-[5px] border-transparent border-t-[#ff0000] border-b-[#ff0000] animate-spin"
              style={{ filter: 'drop-shadow(0 0 10px #ff0000) drop-shadow(0 0 4px #ff0000)', animationDuration: '1s' }}
            />
            <div className="z-10 flex justify-center items-center">
              <img className="w-[130px] md:w-[160px] object-contain" src={dynamicLogo} alt="Logo" />
            </div>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* ── Main Layout ───────────────────────────────────────────────────── */}
      <div className="flex h-[calc(100vh-56px)]">
        <Sidebar sidebarOpen={sidebarOpen} />

        <div className="flex-1 overflow-auto transition-all duration-300">
          <div className="">
            <div className="md:hidden">
              <Mobileslider />
            </div>
            <div className="md:block hidden">
              <Slider />
            </div>

            <main className="mx-auto w-full max-w-screen-xl px-2 md:px-4 md:py-4">
              {/* Notice */}
       {/* Notice */}
<div className="p-2 md:p-4 text-black border-[1px] border-gray-800 rounded-[5px] md:rounded-[10px] flex items-center justify-between">
  <AiOutlineSound className="text-xl text-theme_color mr-2" />
  <marquee
    behavior="scroll"
    scrollamount="5" 
    direction="left"
    className="text-[12px] md:text-[14px] text-white flex-1 font-[400]"
  >
    {notice || "Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!"}
  </marquee>
</div>

              <Category />
              <ProviderSlider />
              <Event />
              <Sports />
              <Featured />
            </main>

            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// HOME (root export)
// ─────────────────────────────────────────────────────────────────────────────
const Home = () => (
  <AuthProvider>
    <HomeContent />
  </AuthProvider>
);

export default Home;