import React, { useState, useEffect, createContext, useContext } from "react";
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
import Exclusivegames from "../../components/home_componets/exclusive/Exclusivegames";

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use the auth context
const useAuth = () => {
  return useContext(AuthContext);
};

// Cache for user data to prevent unnecessary API calls
let userCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Auth Provider Component
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

    // Check cache first
    if (userCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setUser(userCache);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${base_url}/api/user/my-information`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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

  const value = {
    user,
    login,
    checkAuthStatus,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const HomeContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Changed to false by default
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const [notice, setNotice] = useState(""); // State for notice text

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // Cache for branding data
  const [brandingCache, setBrandingCache] = useState(null);

  // Fetch branding data for dynamic logo - only once
  const fetchBrandingData = async () => {
    // Check if we already have branding data
    if (brandingCache) {
      setDynamicLogo(brandingCache);
      return;
    }

    // Check localStorage for cached branding data
    const cachedBranding = localStorage.getItem('branding_logo');
    const cacheTime = localStorage.getItem('branding_cache_time');
    
    if (cachedBranding && cacheTime && Date.now() - parseInt(cacheTime) < 30 * 60 * 1000) { // 30 minutes cache
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
        
        // Cache in localStorage
        localStorage.setItem('branding_logo', logoUrl);
        localStorage.setItem('branding_cache_time', Date.now().toString());
      }
    } catch (error) {
      console.error("Error fetching branding data:", error);
      // Fallback to default logo without setting loading to false
      // since we don't want to trigger loader for this
    }
  };

  // Fetch notice from API
  const fetchNotice = async () => {
    try {
      const response = await axios.get(`${base_url}/api/notice`);
      
      if (response.data.success) {
        // Check if notice exists and has title
        if (response.data.data && response.data.data.title) {
          setNotice(response.data.data.title);
          
          // Cache notice in localStorage
          localStorage.setItem('notice_data', JSON.stringify({
            title: response.data.data.title,
            timestamp: Date.now()
          }));
        } else {
          // Set default notice if none exists
          setNotice("Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!");
          
          // Cache default notice
          localStorage.setItem('notice_data', JSON.stringify({
            title: "Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!",
            timestamp: Date.now()
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching notice:", error);
      
      // Try to get cached notice from localStorage
      const cachedNotice = localStorage.getItem('notice_data');
      if (cachedNotice) {
        const parsedNotice = JSON.parse(cachedNotice);
        // Check if cache is not too old (1 hour)
        if (Date.now() - parsedNotice.timestamp < 60 * 60 * 1000) {
          setNotice(parsedNotice.title);
        } else {
          setNotice("Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!");
        }
      } else {
        setNotice("Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!");
      }
    }
  };

  // Provider data with image URLs
  const providers = [
    {
      name: "Every",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-awcmsexy.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "JL",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-awcmjili.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "JIU",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-awcmjili.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "EVO",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-evo.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "JD",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-jdb.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "JDB",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-jdb.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "FC",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-awcmfc.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "FG Chat",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-awcmyesbingo.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Yellow Bot",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/vendor-type/for-dark/vendor-awcmyesbingo.png?v=1754999737902&source=drccdnsrc",
    },
  ];

  // Events data
  const events = [
    {
      name: "HUNDRED",
      image: "https://img.b112j.com/upload/announcement/image_247589.jpg",
      time: "23:30",
      date: "19 AUG 2025 (TUE)",
    },
    {
      name: "PATRICTS",
      image: "https://img.b112j.com/upload/announcement/image_247687.jpg",
      time: "05:00",
      date: "20 AUG 2025 (WED)",
    },
    {
      name: "HUNDRED",
      image: "https://img.b112j.com/upload/announcement/image_247589.jpg",
      time: "20:00",
      date: "20 AUG 2025 (WED)",
    },
  ];

  // Featured games data
  const featuredGames = [
    {
      name: "MAGIC ACE",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-super-elements.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "WILD LOCK",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-money-wheel.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "PIGGY BANK",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-divas-ace.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "FRUITY BONANZA",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-golden-genie.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "SUGAR BANG BANG 2",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-the-kings-ace.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "OUTES OF QIYMPUS",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-super-elements.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "SUPER BANK",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-money-wheel.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "SWEET BOX AND SPOT DOWN",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-divas-ace.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "SUPER ACE",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-golden-genie.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "BOX IN KINI",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-the-kings-ace.png?v=1754999737902&source=drccdnsrc",
    },
  ];

  // Exclusive categories data
  const exclusiveCategories = [
    {
      name: "Sports",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-sport.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Casino",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-casino.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Slots",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-slot.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Table",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-table.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Fishing",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-fish.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Crash",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-crash.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Arcade",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-arcade.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Lottery",
      image:
        "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-lottery.png?v=1754999737902&source=drccdnsrc",
    },
  ];

  // Effects games data
  const effectsGames = [
    {
      name: "Super",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-super-elements.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Flaments",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-money-wheel.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "BLOODY",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-fortune-gems.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "WATER",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-divas-ace.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "Parmin Grims",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-golden-genie.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "DIVAS AGB",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-the-kings-ace.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "GOLDEN",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-super-elements.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "GEKLE",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-money-wheel.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "THERINGS",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-fortune-gems.png?v=1754999737902&source=drccdnsrc",
    },
    {
      name: "ACB",
      image:
        "https://img.b112j.com/bj/h5/assets/images/exclusivegames/default/exclusive-divas-ace.png?v=1754999737902&source=drccdnsrc",
    },
  ];

  // Use useEffect to handle the actual loading state - only run once
  useEffect(() => {
    let mounted = true;

    // Only show loading for initial page load, not when navigating back
    const isInitialLoad = performance.navigation.type === performance.navigation.TYPE_NAVIGATE ||
                         performance.navigation.type === performance.navigation.TYPE_RELOAD;

    if (isInitialLoad) {
      setIsLoading(true);
    }

    // Fetch branding data when component mounts
    fetchBrandingData();
    
    // Fetch notice when component mounts
    fetchNotice();

    const handleLoad = () => {
      if (mounted) {
        setIsLoading(false);
      }
    };

    // Check if the page has already loaded
    if (document.readyState === "complete") {
      if (mounted) {
        setIsLoading(false);
      }
    } else {
      window.addEventListener("load", handleLoad);

      // Fallback timer
      const fallbackTimer = setTimeout(() => {
        if (mounted) {
          setIsLoading(false);
        }
      }, 3000); // Reduced to 3 seconds

      return () => {
        mounted = false;
        window.removeEventListener("load", handleLoad);
        clearTimeout(fallbackTimer);
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="h-screen overflow-hidden font-poppins bg-[#1a1a1a] text-white">
      {/* Loading Overlay - Only show for initial load */}
{isLoading && (
 <div className="fixed top-0 left-0 w-full h-full bg-[#0a0a0a] flex justify-center items-center z-[10000000]">
          <div className="relative w-36 h-36 md:w-44 md:h-44 flex justify-center items-center">
            
            {/* The 2-Part Rotating Ring with increased width and neon glow */}
            <div 
              className="absolute w-full h-full rounded-full border-[5px] border-transparent border-t-[#ff0000] border-b-[#ff0000] animate-spin"
              style={{
                filter: 'drop-shadow(0 0 10px #ff0000) drop-shadow(0 0 4px #ff0000)',
                animationDuration: '1s'
              }}
            ></div>

            {/* Inner dynamic logo stays fixed while the arcs rotate */}
            <div className="z-10 flex justify-center items-center">
              <img 
                className="w-[130px] md:w-[160px] object-contain" 
                src={dynamicLogo} 
                alt="Logo" 
              />
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} />

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto transition-all duration-300">
          <div className="">
            <div className="md:hidden">
                <Mobileslider/>
            </div>
            <div className="md:block hidden">
                   <Slider />
            </div>
            <main className="mx-auto w-full max-w-screen-xl px-2 md:px-4  md:py-4">
              {/* Notice Section */}
              <div className="p-2 md:p-4 text-black border-[1px] border-gray-800 rounded-[5px] md:rounded-[10px] flex items-center justify-between">
                <AiOutlineSound className="text-xl text-theme_color mr-2" />
                <marquee
                  behavior="scroll"
                  scrollamount="10"
                  direction="left"
                  className="text-[12px] md:text-[14px] text-white flex-1 font-[400]"
                >
                  {notice || "Welcome to Our Platform - Deposit Now and Get Exciting Bonuses!"}
                </marquee>
              </div>

              {/* Exclusive Categories Section */}
              <Category />

              {/* Providers Section */}
              <ProviderSlider />
              {/* ---------exclusive-games----- */}
                  <Exclusivegames/>
               {/* ---------exclusive-games----- */}
              {/* Events Section */}
              <Event />

              {/* Featured Games Section */}
              <Featured />
            </main>

            <Footer />
          </div>
        </div>
      </div>
    </div>
  );
};

const Home = () => {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
};

export default Home;