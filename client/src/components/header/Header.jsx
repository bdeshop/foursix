import React, { useState, useEffect, useRef } from "react";
import {
  FaBars,
  FaChevronDown,
  FaChevronRight,
  FaGift,
  FaCrown,
  FaUserFriends,
  FaHandshake,
  FaPhone,
  FaBook,
  FaComments,
  FaMobileAlt,
  FaFacebook,
  FaEnvelope,
  FaWhatsapp,
  FaTelegram,
  FaInstagram,
  FaTwitter
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import { MdSupportAgent } from "react-icons/md";
import { IoClose } from "react-icons/io5";
import {
  FiBell,
  FiUser,
  FiLock,
  FiCheckCircle,
  FiFileText,
  FiTrendingUp,
  FiUsers,
  FiLogOut,
  FiRefreshCw,
} from "react-icons/fi";
import { MdSportsSoccer } from "react-icons/md";
import axios from "axios";
import logo from "../../assets/logo.png";
import slot_img from "../../assets/slots.png";
import casino_img from "../../assets/casino.png";
import banner from "../../assets/banner.jpg";
import play_img from "../../assets/play.png";
import profile_img from "../../assets/profile.png";
import menu_img from "../../assets/icon-menu.png";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../App";

const APK_FILE = "https://http://localhost:4500.live/onexwin.apk";

export const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const [activeMenu, setActiveMenu] = useState(null);
  const [activeSubMenu, setActiveSubMenu] = useState(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [categories, setCategories] = useState(
    JSON.parse(localStorage.getItem("categories")) || []
  );
  const [providers, setProviders] = useState([]);
  const [exclusiveGames, setExclusiveGames] = useState([]);
  const [promotions, setPromotions] = useState(
    JSON.parse(localStorage.getItem("promotions")) || []
  );
  const [sidebarLoading, setSidebarLoading] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [showSignupPopup, setShowSignupPopup] = useState(false);
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const [showMobileAppBanner, setShowMobileAppBanner] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  
  // Social links states
  const [socialLinks, setSocialLinks] = useState([]);
  const [loadingSocialLinks, setLoadingSocialLinks] = useState(false);
  
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const popupRef = useRef(null);

  // Default categories with provided images - Exclusive always first
  const defaultCategories = [
    {
      name: "Exclusive",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-exclusive.png?v=1767857219215&source=drccdnsrc",
      id: "exclusive"
    },
    {
      name: "Sports",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-sport.png?v=1767857219215&source=drccdnsrc",
      id: "sports"
    },
    {
      name: "Casino",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-casino.png?v=1767857219215&source=drccdnsrc",
      id: "casino"
    },
    {
      name: "Slots",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-slot.png?v=1767857219215&source=drccdnsrc",
      id: "slots"
    },
    {
      name: "Crash",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-crash.png?v=1767857219215&source=drccdnsrc",
      id: "crash"
    },
    {
      name: "Table",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-table.png?v=1767857219215&source=drccdnsrc",
      id: "table"
    },
    {
      name: "Fishing",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-fish.png?v=1767857219215&source=drccdnsrc",
      id: "fishing"
    },
    {
      name: "Arcade",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-arcade.png?v=1767857219215&source=drccdnsrc",
      id: "arcade"
    },
    {
      name: "Lottery",
      image: "https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-lottery.png?v=1767857219215&source=drccdnsrc",
      id: "lottery"
    }
  ];

  // Function to sort categories with Exclusive always first
  const sortCategoriesWithExclusiveFirst = (categories) => {
    if (!categories || categories.length === 0) return defaultCategories;
    
    // Find Exclusive category
    const exclusiveCategory = categories.find(cat => 
      cat.name.toLowerCase() === "exclusive"
    );
    
    // If no Exclusive category found, use default
    if (!exclusiveCategory) return categories;
    
    // Filter out exclusive category and then add it at the beginning
    const otherCategories = categories.filter(cat => 
      cat.name.toLowerCase() !== "exclusive"
    );
    
    return [exclusiveCategory, ...otherCategories];
  };

  // Default social links fallback
  const getDefaultSocialLinks = () => [
    {
      platform: "whatsapp",
      url: "https://wa.me/+4407386588951",
      title: "WhatsApp",
      icon: <FaWhatsapp className="w-4 h-4 mr-2" />
    },
    {
      platform: "email",
      url: "mailto:support@yourdomain.com",
      title: "Email",
      icon: <FaEnvelope className="w-4 h-4 mr-2" />
    },
    {
      platform: "facebook",
      url: "https://facebook.com/yourpage",
      title: "Facebook",
      icon: <FaFacebook className="w-4 h-4 mr-2" />
    }
  ];

  // Check if device is mobile
  const isMobileDevice = () => {
    return window.innerWidth < 768;
  };

  // Check banner visibility based on localStorage
  const checkBannerVisibility = () => {
    if (!isMobileDevice()) return false;

    const bannerHiddenUntil = localStorage.getItem("mobileAppBannerHiddenUntil");
    const downloadHiddenUntil = localStorage.getItem("mobileAppDownloadHiddenUntil");
    
    if (downloadHiddenUntil) {
      const downloadHideTime = parseInt(downloadHiddenUntil);
      if (Date.now() < downloadHideTime) {
        return false;
      }
    }
    
    if (bannerHiddenUntil) {
      const bannerHideTime = parseInt(bannerHiddenUntil);
      if (Date.now() < bannerHideTime) {
        return false;
      }
    }
    
    return true;
  };

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setSidebarOpen(false);
    }
    
    // Always show default categories initially
    if (!categories.length) {
      // Set default categories immediately
      setCategories(defaultCategories);
      // Then fetch from API
      fetchCategories();
    }
    
    if (!promotions.length) fetchPromotions();
    checkAuthStatus();
    fetchBrandingData();
    fetchSocialLinks(); // Fetch social links
    
    const hasShownSignupPopup = localStorage.getItem("hasShownSignupPopup");
    if (isLoggedIn && !hasShownSignupPopup) {
      setShowSignupPopup(true);
      localStorage.setItem("hasShownSignupPopup", "true");
    }

    const timer = setTimeout(() => {
      if (checkBannerVisibility()) {
        setShowMobileAppBanner(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isLoggedIn]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowSignupPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchBrandingData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/branding`);
      if (response.data.success && response.data.data && response.data.data.logo) {
        const logoUrl = response.data.data.logo.startsWith('http') 
          ? response.data.data.logo 
          : `${API_BASE_URL}${response.data.data.logo.startsWith('/') ? '' : '/'}${response.data.data.logo}`;
        setDynamicLogo(logoUrl);
      }
    } catch (error) {
      console.error("Error fetching branding data:", error);
      setDynamicLogo(logo);
    }
  };

  const fetchSocialLinks = async () => {
    try {
      setLoadingSocialLinks(true);
      const response = await axios.get(`${API_BASE_URL}/api/social-links`);
      if (response.data.success && response.data.data) {
        // Map API response to standardized format
        const mappedLinks = response.data.data.map(link => {
          let icon;
          let title;
          
          switch(link.platform.toLowerCase()) {
            case 'whatsapp':
              icon = <FaWhatsapp className="w-4 h-4 mr-2" />;
              title = "WhatsApp";
              break;
            case 'email':
              icon = <FaEnvelope className="w-4 h-4 mr-2" />;
              title = "Email";
              break;
            case 'facebook':
              icon = <FaFacebook className="w-4 h-4 mr-2" />;
              title = "Facebook";
              break;
            default:
              icon = <FaWhatsapp className="w-4 h-4 mr-2" />;
              title = link.platform;
          }
          
          return {
            ...link,
            icon,
            title
          };
        });
        
        setSocialLinks(mappedLinks);
      } else {
        console.error("Failed to fetch social links");
        // Fallback to default social links if API fails
        setSocialLinks(getDefaultSocialLinks());
      }
    } catch (error) {
      console.error("Error fetching social links:", error);
      // Fallback to default social links if API fails
      setSocialLinks(getDefaultSocialLinks());
    } finally {
      setLoadingSocialLinks(false);
    }
  };

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const response = await axios.get(`${API_BASE_URL}/api/categories`);
      if (response.data && response.data.data) {
        // Sort categories with Exclusive first
        const sortedCategories = sortCategoriesWithExclusiveFirst(response.data.data);
        setCategories(sortedCategories);
        localStorage.setItem("categories", JSON.stringify(sortedCategories));
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      // Keep default categories if API fails
      setCategories(defaultCategories);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/promotions`);
      if (response.data) {
        setPromotions(response.data.data);
        localStorage.setItem("promotions", JSON.stringify(response.data.data));
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      console.error("Failed to fetch promotions:", err);
      toast.error("Failed to fetch promotions.");
    }
  };

  const fetchProviders = async (categoryName) => {
    try {
      setSidebarLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/api/providers/${categoryName}`
      );
      if (response.data.success) {
        setProviders(response.data.data);
        setExclusiveGames([]); // Clear exclusive games when showing providers
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setSidebarLoading(false);
    }
  };

  const fetchExclusiveGames = async () => {
    try {
      setSidebarLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/menu-games`);
      
      let gamesData = [];
      
      if (response.data && response.data.data) {
        gamesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        gamesData = response.data;
      }
      
      // Try different possible category name variations
      const exclusiveGamesData = gamesData.filter(game => {
        if (!game) return false;
        
        const categoryName = (game.categoryname || game.category || game.categoryName || '').toLowerCase();
        const gameName = (game.name || game.gameName || '').toLowerCase();
        
        // Check for exclusive category or exclusive in game name
        return categoryName.includes("exclusive") || 
               categoryName.includes("exlusive") ||
               gameName.includes("exclusive") ||
               gameName.includes("exlusive");
      });
      
      setExclusiveGames(exclusiveGamesData);
      setProviders([]);
    } catch (error) {
      console.error("Error fetching exclusive games:", error);
      setExclusiveGames([]);
    } finally {
      setSidebarLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    if (activeMenu === category.name) {
      setActiveMenu(null);
      setProviders([]);
      setExclusiveGames([]);
    } else {
      setActiveMenu(category.name);
      // Check if it's the Exclusive category (case insensitive)
      if (category.name.toLowerCase() === "exclusive") {
        fetchExclusiveGames();
      } else {
        fetchProviders(category.name);
      }
    }
  };

  const handleProviderClick = (provider) => {
    if (activeMenu) {
      navigate(
        `/games?category=${activeMenu.toLowerCase()}&provider=${provider.name.toLowerCase()}`
      );
      setSidebarOpen(false);
    }
  };
  const { user } = useAuth();
   const handleGameClick = (game) => {
    // Check if user is logged in
    if (!user) {
      navigate("/login")
      return;
    }
    // If user is logged in, navigate directly to game
    navigate(`/game/${game.gameId}`);
  };

  const checkAuthStatus = () => {
    const token = localStorage.getItem("usertoken");
    const user = localStorage.getItem("user");

    if (token && user) {
      setIsLoggedIn(true);
      setUserData(JSON.parse(user));
      verifyToken(token);
    } else {
      setIsLoggedIn(false);
      setUserData(null);
    }
  };

  const verifyToken = async (token) => {
    try {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const response = await axios.get(
        `${API_BASE_URL}/api/user/my-information`
      );
      if (response.data.success) {
        setUserData(response.data.data);
        localStorage.setItem("user", JSON.stringify(response.data.data));
        setIsLoggedIn(true);
      } 
    } catch (error) {
      console.error("Token verification failed:", error);
    }
  };

  // Function to refresh user balance
  const refreshBalance = async () => {
    if (!isLoggedIn) return;
    
    try {
      setIsRefreshingBalance(true);
      const token = localStorage.getItem("usertoken");
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      
      const response = await axios.get(
        `${API_BASE_URL}/api/user/my-information`
      );
      
      if (response.data.success) {
        setUserData(response.data.data);
        localStorage.setItem("user", JSON.stringify(response.data.data));
      }
    } catch (error) {
      console.error("Error refreshing balance:", error);
      toast.error("Failed to refresh balance");
    } finally {
      setIsRefreshingBalance(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("usertoken");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setUserData(null);
    delete axios.defaults.headers.common["Authorization"];
    setProfileDropdownOpen(false);
    navigate("/");
  };

  const handleDownloadClick = () => {
    const hideUntil = Date.now() + (30 * 24 * 60 * 60 * 1000);
    localStorage.setItem("mobileAppDownloadHiddenUntil", hideUntil.toString());
    setShowMobileAppBanner(false);
    window.open("https://your-app-download-link.com", "_blank");
    toast.success("Redirecting to app download...");
  };

  const handleCloseBanner = () => {
    const hideUntil = Date.now() + (10 * 60 * 1000);
    localStorage.setItem("mobileAppBannerHiddenUntil", hideUntil.toString());
    setShowMobileAppBanner(false);
  };

  const menuItems = [
    {
      id: "notifications",
      label: "Notifications",
      icon: <FiBell />,
      path: "/member/inbox/notification",
    },
    {
      id: "personal-info",
      label: "Personal info",
      icon: <FiUser />,
      path: "/member/profile/info",
    },
    {
      id: "login-security",
      label: "Login & Security",
      icon: <FiLock />,
      path: "/member/profile/account",
    },
    {
      id: "verification",
      label: "Verification",
      icon: <FiCheckCircle />,
      path: "/member/profile/verify",
    },
    {
      id: "transactions",
      label: "Transaction records",
      icon: <FiFileText />,
      path: "/member/transaction-records",
    },
    {
      id: "betting-records",
      label: "Betting records",
      icon: <MdSportsSoccer />,
      path: "/member/betting-records/settled",
    },
    {
      id: "turnover",
      label: "Turnover",
      icon: <FiTrendingUp />,
      path: "/member/turnover/uncomplete",
    },
    {
      id: "referral",
      label: "My referral",
      icon: <FiUsers />,
      path: "/referral-program/details",
    },
  ];

  const secondaryMenuItems = [
    {
      title: "Promotions",
      icon: <FaGift className="w-5 h-5 min-w-[20px]" />,
      subItems: ["Welcome Bonus", "Reload Bonus", "Cashback"],
    },
    {
      title: "VIP Club",
      icon: <FaCrown className="w-5 h-5 min-w-[20px]" />,
      subItems: ["VIP Levels", "Exclusive Rewards", "Personal Manager"],
    },
    {
      title: "Referral program",
      icon: <FaUserFriends className="w-5 h-5 min-w-[20px]" />,
      subItems: ["Invite Friends", "Earn Commission", "Bonus Terms"],
    },
    {
      title: "Affiliate",
      icon: <FaHandshake className="w-5 h-5 min-w-[20px]" />,
      subItems: ["Join Program", "Marketing Tools", "Commission Rates"],
    },
  ];

  const bottomMenuItems = [
    {
      title: "VIP Club",
      icon: <FaCrown className="w-5 h-5 min-w-[20px]" />,
      subItems: [],
      path: "/vip-club"
    },
    {
      title: "Referral program",
      icon: <FaUserFriends className="w-5 h-5 min-w-[20px]" />,
      subItems: [],
      path: "/referral-program"
    },
    {
      title: "Affiliate",
      icon: <FaHandshake className="w-5 h-5 min-w-[20px]" />,
      subItems: [],
            onClick: () =>{window.location.href="https://m-affiliate.foursix.live"},
    },
    {
      title: "Brand Ambassadors",
      icon: <MdSupportAgent className="w-5 h-5 min-w-[20px]" />,
      subItems: [],
      path: "/coming-soon?title=Brand Ambassadors"
    },
    {
      title: "APP Download",
      icon: <FaMobileAlt className="w-5 h-5 min-w-[20px]" />,
      subItems: [],
      onClick: () => downloadFileAtURL(APK_FILE),
    },
    {
      title: "Contact Us",
      icon: <FaPhone className="w-5 h-5 min-w-[20px]" />,
      subItems: [], // We'll handle contact items separately
      isContact: true // Flag to identify contact us item
    },
    {
      title: "New Member Guide",
      icon: <FaBook className="w-5 h-5 min-w-[20px]" />,
      subItems: [],
      path: "/coming-soon?title=New Member Guide"
    },
    {
      title: "BJ Forum",
      icon: <FaComments className="w-5 h-5 min-w-[20px]" />,
      subItems: [],
      path: "/coming-soon?title=BJ Forum"
    },
  ];

  const toggleMenu = (title) => {
    if (activeMenu === title) {
      setActiveMenu(null);
      setActiveSubMenu(null);
      setProviders([]);
      setExclusiveGames([]);
    } else {
      setActiveMenu(title);
      setActiveSubMenu(null);
    }
  };

  const toggleSubMenu = (subItem) => {
    setActiveSubMenu(activeSubMenu === subItem ? null : subItem);
  };

  const downloadFileAtURL = (url) => {
    const fileName = url.split("/").pop();
    const aTag = document.createElement("a");
    aTag.href = url;
    aTag.setAttribute("download", fileName);
    document.body.appendChild(aTag);
    aTag.click();
    aTag.remove();
    toast.success("APK Download Started!");
  };

  const handleContactClick = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Get game image URL for exclusive games
  const getGameImageUrl = (game) => {
    if (!game) return '';
    
    const imagePath = game.portraitImage || game.image || game.thumbnail || '';
    if (!imagePath) return '';
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Remove leading slash if present to avoid double slash
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `${API_BASE_URL}/${cleanPath}`;
  };

  return (
    <>
      <Toaster />
      <header className="flex justify-between items-center px-1 py-2 bg-[#1a1a1a] text-white border-b border-[#333] relative z-[10000]">
        <div className="flex items-center space-x-4 md:space-x-7">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-icon_color md:flex hidden p-3 cursor-pointer bg-[#303232] rounded-[2px] hover:bg-[#333]"
          >
            <FaBars size={18} />
          </button>
          <NavLink to="/">
            <img 
              src={dynamicLogo} 
              alt="Logo" 
              className="w-[80px]" 
            />
          </NavLink>
          <NavLink
            to="/slots"
            className="md:flex hidden items-center space-x-2 text-[13px] font-[400] text-gray-400 hover:text-yellow-400"
          >
            <img src={slot_img} alt="Slots" className="h-5 w-5" />
            <span>Slots</span>
          </NavLink>
          <NavLink
            to="/casino"
            className="md:flex hidden items-center space-x-2 text-gray-400 text-[13px] font-[400] hover:text-yellow-400"
          >
            <img src={casino_img} alt="Casino" className="h-5 w-5" />
            <span>Casino</span>
          </NavLink>
          {isLoggedIn && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="md:flex hidden cursor-pointer items-center space-x-2 text-gray-400 text-[13px] font-[400] hover:text-yellow-400"
              >
                <img src={profile_img} alt="Profile" className="h-5 w-5" />
                <span>Profile</span>
              </button>
              {profileDropdownOpen && (
                <div className="absolute top-[170%] left-0 mt-2 w-80 bg-[#111] rounded-b-[3px] shadow-xl z-50 text-white">
                  <div className="flex items-center gap-3 p-4 border-b border-[#333]">
                    <div className="rounded-full bg-gray-600 flex items-center justify-center text-xl font-bold">
                      <img
                        src="https://img.b112j.com/bj/h5/assets/v3/images/member-menu/member-avatar.png?v=1755600713311&source=drccdnsrc"
                        className="w-[40px]"
                        alt=""
                      />
                    </div>
                    <div>
                      <div className="font-[500] text-sm">
                        Username: {userData?.username || "N/A"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Player ID: {userData?.player_id || "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col py-3">
                    {menuItems.map((item) => (
                      <NavLink
                        key={item.id}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 text-sm transition ${
                          activeTab === item.id
                            ? "bg-[#222] text-white"
                            : "text-gray-300 hover:bg-[#1a1a1a] hover:text-white"
                        }`}
                        onClick={() => {
                          setActiveTab(item.id);
                          setProfileDropdownOpen(false);
                        }}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </div>
                  <div className="border-t border-[#333] p-3">
                    <button
                      className="flex items-center justify-center gap-2 w-full py-2 text-sm rounded-md border border-[#333] text-gray-300 hover:bg-[#222] hover:text-white transition"
                      onClick={logout}
                    >
                      <FiLogOut /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {isLoggedIn ? (
            <>
              {/* Desktop View */}
              <div className="hidden md:flex items-center rounded overflow-hidden gap-2">
                <div className="bg-box_bg rounded-[5px] h-10 border-[1px] border-gray-800 flex items-center">
                  <div className="flex items-center space-x-2 px-3 py-2 text-sm bg-[#1f1f1f] text-white">
                    <img
                      src="https://img.b112j.com/bj/h5/assets/v3/images/icon-set/currency-type/bdt.png?v=1755600713311&source=drccdnsrc"
                      className="w-4 h-4"
                      alt="BDT"
                    />
                    <span className="min-w-[60px]">
                      {parseFloat(userData?.balance || 0).toFixed(2)}
                    </span>
                  </div>
                  <button
                    className="px-3 py-2 hover:bg-[#444] cursor-pointer text-white transition-colors duration-200 border-l border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={refreshBalance}
                    disabled={isRefreshingBalance}
                    aria-label="Refresh balance"
                  >
                    <FiRefreshCw 
                      className={`w-4 h-4 ${isRefreshingBalance ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
                <div className="flex justify-center items-center gap-2">
                  <NavLink
                    to="/member/withdraw"
                    className="text-white text-[12px] md:text-sm px-5 py-2 border-[1px] cursor-pointer border-gray-700 rounded hover:bg-[#333] transition-all duration-200"
                  >
                    Withdrawal
                  </NavLink>
                  <NavLink
                    to="/member/deposit"
                    className="bg-theme_color text-[12px] md:text-sm px-5 py-2 rounded-[3px] hover:bg-theme_color/80 transition-all duration-200 cursor-pointer font-medium text-white"
                  >
                    Deposit
                  </NavLink>
                </div>
              </div>

              {/* Mobile View */}
              <div className="md:hidden flex px-[10px] items-center gap-2">
                <div className="bg-box_bg rounded-[5px] border-[1px] border-gray-800 flex items-center">
                  <div className="flex items-center space-x-2 px-3 py-2 text-sm">
                    <img
                      src="https://img.b112j.com/bj/h5/assets/v3/images/icon-set/currency-type/bdt.png?v=1755600713311&source=drccdnsrc"
                      className="w-4 h-4"
                      alt="BDT"
                    />
                    <span className="text-white min-w-[40px]">
                     {parseFloat(userData?.balance || 0).toFixed(2)}
                    </span>
                  </div>
                  <button
                    className="px-3 py-2 hover:bg-[#444] cursor-pointer text-white transition-colors duration-200 border-l border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={refreshBalance}
                    disabled={isRefreshingBalance}
                    aria-label="Refresh balance"
                  >
                    <FiRefreshCw 
                      className={`w-4 h-4 ${isRefreshingBalance ? 'animate-spin' : ''}`}
                    />
                  </button>
                </div>
                <NavLink
                  to="/member/deposit"
                  className="bg-theme_color text-[12px] px-3 py-2 rounded-[3px] hover:bg-theme_color/80 transition-all duration-200 cursor-pointer font-medium text-white"
                >
                  Deposit
                </NavLink>
              </div>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="text-white text-[12px] md:text-sm px-5 py-2 border-[1px] cursor-pointer border-gray-700 rounded hover:bg-[#333] transition-all duration-200"
              >
                Log in
              </NavLink>
              <NavLink
                to="/register"
                className="bg-theme_color text-[12px] md:text-sm px-5 py-2 rounded-[3px] hover:bg-theme_color/80 transition-all duration-200 cursor-pointer font-medium text-white"
              >
                Sign up
              </NavLink>
            </>
          )}
        </div>
      </header>

      <div
        className={`fixed top-0 left-0 h-full w-full md:w-80 no-scrollbar overflow-y-auto pb-[100px] bg-[#1a1a1a] text-white z-40 transition-all duration-300 ease-in-out ${
          sidebarOpen ? "shadow-2xl" : "w-0 -translate-x-full"
        }`}
        style={{ marginTop: "56px" }}
      >
        <button
          onClick={() => setSidebarOpen(false)}
          className="md:hidden absolute top-3 right-3 cursor-pointer p-2 rounded-[3px] bg-[#303232] hover:bg-[#333] z-50"
        >
          <IoClose size={18} />
        </button>
        <div
          className={`w-full md:w-80 transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="w-full flex justify-start items-center px-4 pt-4 pb-3 md:sticky top-0 left-0 bg-[#1A1A1A]">
            <a
              href="https://wa.me/+4407386588951"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full"
            >
              <span className="bg-[#222424] text-[16px] px-2 py-2.5 mt-3 rounded-[3px] text-center flex justify-center items-center gap-3 cursor-pointer hover:bg-[#2a2a2a] transition">
                <MdSupportAgent className="text-white text-[20px]" />
                <span className="text-[13px]">24/7 Live Chat</span>
              </span>
            </a>
          </div>
          <div className="p-[10px]">
            <img className="w-full" src={banner} alt="" />
          </div>

          {/* Download App in Sidebar */}
          <div className="px-2 mt-4">
            <button
              className="flex items-center p-3 rounded w-full bg-gradient-to-r from-theme_color/20 to-theme_color/10 text-theme_color cursor-pointer hover:bg-theme_color/30 transition-all duration-200 border border-theme_color/30"
              onClick={()=>{downloadFileAtURL(APK_FILE)}}
            >
              <FaMobileAlt className="w-6 h-6 min-w-[24px]" />
              <div className="flex items-center ml-3 w-full">
                <span className="text-sm font-semibold flex-grow">Download App Now</span>
                <FaChevronRight className="text-xs" />
              </div>
            </button>
          </div>

          <div className="space-y-1 px-2 mt-[15px]">
            {isLoadingCategories && (
              <div className="text-center py-4 text-gray-400 text-sm">
                Loading categories...
              </div>
            )}
            
            {/* Categories List - Exclusive always at top */}
            {categories.map((category, index) => (
              <div key={index}>
                <div
                  className={`flex items-center p-3 rounded cursor-pointer hover:text-gray-500 text-gray-400 transition-colors duration-200 ${
                    activeMenu === category.name ? "" : ""
                  }`}
                  onClick={() => handleCategoryClick(category)}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-5 h-5 min-w-[20px]"
                    onError={(e) => {
                      // Fallback for broken images
                      e.target.onerror = null;
                      e.target.src = `https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/inactive/icon-exclusive.png?v=1767857219215&source=drccdnsrc`;
                    }}
                  />
                  <div className="flex items-center ml-3 w-full">
                    <span className="text-sm flex-grow whitespace-nowrap">
                      {category.name}
                    </span>
                    {activeMenu === category.name ? (
                      <FaChevronDown className="text-xs transition-transform duration-200" />
                    ) : (
                      <FaChevronRight className="text-xs transition-transform duration-200" />
                    )}
                  </div>
                </div>
                <div
                  className={`overflow-y-auto transition-all duration-300 ease-in-out ${
                    activeMenu === category.name ? "max-h-screen" : "max-h-0"
                  }`}
                >
                  {activeMenu === category.name && (
                    <div className="ml-2 mt-1 mb-2">
                      {sidebarLoading ? (
                        <div className="p-4 text-center text-[12px] text-gray-400">
                          Loading...
                        </div>
                      ) : category.name.toLowerCase() === "exclusive" ? (
                        // Exclusive Games Grid - Similar to Category Page
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 p-2">
                          {exclusiveGames.map((game, gameIndex) => (
                            <div
                              key={gameIndex}
                              className="flex flex-col items-center rounded-[3px] transition-all cursor-pointer group"
                              onClick={() => handleGameClick(game)}
                            >
                              {/* Game Image Container with fixed aspect ratio (Portrait) */}
                              <div className="game-image-container w-full mb-2">
                                <img
                                  src={getGameImageUrl(game)}
                                  alt={game.name || game.gameName}
                                  className="game-image rounded-[6px] transition-transform duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/100x133?text=Game";
                                  }}
                                />
                              </div>
                              {/* Game Name */}
                              <div className="w-full pt-1">
                                <span className="text-xs text-gray-400 truncate block text-center">
                                  {game.name || game.gameName || "Game"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Providers List for Non-Exclusive Categories
                        <div className="space-y-1">
                          {providers.map((provider, providerIndex) => (
                            <div
                              key={providerIndex}
                              className="flex items-center p-2 rounded cursor-pointer hover:bg-[#333] transition-colors duration-200"
                              onClick={() => handleProviderClick(provider)}
                            >
                              <img
                                src={`${API_BASE_URL}/${provider.image}`}
                                alt={provider.name}
                                className="w-6 h-6 mr-2"
                              />
                              <span className="text-xs text-gray-400">
                                {provider.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-[#222424] my-4 mx-2"></div>
          <div className="px-2 mb-2">
            <div className="flex justify-between items-center p-2">
              <span className="text-sm font-medium">Promotions</span>
              <NavLink
                to="/promotions"
                className="text-xs text-theme_color2 underline cursor-pointer"
              >
                View all
              </NavLink>
            </div>
            
          </div>

          <div className="border-t border-[#222424] my-4 mx-2"></div>
          <div className="space-y-1 px-2">
            {bottomMenuItems.map((item, index) => (
              <div key={index}>
                <div
                  className={`flex items-center p-3 rounded text-gray-500 cursor-pointer hover:text-gray-600 transition-colors duration-200 ${
                    activeMenu === item.title ? "bg-[#222]" : ""
                  }`}
                  onClick={() => {
                    if (item.isContact) {
                      toggleMenu(item.title);
                    } else if (item.onClick) {
                      item.onClick();
                    } else if (item.path) {
                      navigate(item.path);
                      setSidebarOpen(false);
                    } else {
                      toggleMenu(item.title);
                    }
                  }}
                >
                  {item.icon}
                  <div className="flex items-center ml-3 w-full">
                    <span className="text-sm flex-grow whitespace-nowrap">
                      {item.title}
                    </span>
                    
                    <div className="flex items-center">
                      {/* Always show chevron for all menu items */}
                      {item.isContact && activeMenu === item.title ? (
                        <FaChevronDown className="text-xs text-gray-400 transition-transform duration-200" />
                      ) : (
                        <FaChevronRight className="text-xs text-gray-400 transition-transform duration-200" />
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Contact Us Submenu */}
                {item.isContact && activeMenu === item.title && (
                  <div className="pl-3 mb-2 space-y-2 animate-fadeIn">
                    {loadingSocialLinks ? (
                      <div className="p-2 text-center">
                        <div className="text-xs text-gray-400">Loading contact options...</div>
                      </div>
                    ) : socialLinks.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3 p-2">
                        {socialLinks.map((contact, contactIndex) => {
                          let bgColor = "";
                          let iconColor = "";
                          let textColor = "";
                          
                          // Set different colors based on platform
                          switch(contact.platform.toLowerCase()) {
                            case 'whatsapp':
                              bgColor = "bg-gradient-to-r from-green-900/20 to-green-700/10";
                              iconColor = "text-green-400";
                              textColor = "text-green-300";
                              break;
                            case 'email':
                              bgColor = "bg-gradient-to-r from-blue-900/20 to-blue-700/10";
                              iconColor = "text-blue-400";
                              textColor = "text-blue-300";
                              break;
                            case 'facebook':
                              bgColor = "bg-gradient-to-r from-indigo-900/20 to-indigo-700/10";
                              iconColor = "text-indigo-400";
                              textColor = "text-indigo-300";
                              break;
                            case 'instagram':
                              bgColor = "bg-gradient-to-r from-pink-900/20 to-purple-700/10";
                              iconColor = "text-pink-400";
                              textColor = "text-pink-300";
                              break;
                            case 'telegram':
                              bgColor = "bg-gradient-to-r from-sky-900/20 to-sky-700/10";
                              iconColor = "text-sky-400";
                              textColor = "text-sky-300";
                              break;
                            case 'twitter':
                            case 'x':
                              bgColor = "bg-gradient-to-r from-gray-900/20 to-gray-700/10";
                              iconColor = "text-gray-400";
                              textColor = "text-gray-300";
                              break;
                            default:
                              bgColor = "bg-gradient-to-r from-gray-900/20 to-gray-700/10";
                              iconColor = "text-gray-400";
                              textColor = "text-gray-300";
                          }
                          
                          return (
                            <div
                              key={contactIndex}
                              className={`flex p-3 rounded-lg cursor-pointer ${bgColor} border border-opacity-30 hover:scale-105 transition-all duration-200 hover:shadow-lg`}
                              onClick={() => handleContactClick(contact.url)}
                            >
                              <div className="mb-2">
                                <span className={`text-2xl ${iconColor}`}>
                                  {contact.icon}
                                </span>
                              </div>
                              <span className={`text-xs font-medium ${textColor}`}>
                                {contact.title}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      // Fallback if no social links - Colorful design
                      <div className="grid grid-cols-2 gap-3 p-2">
                        {/* WhatsApp */}
                        <div
                          className="flex flex-col items-center p-3 rounded-lg cursor-pointer bg-gradient-to-r from-green-900/20 to-green-700/10 border border-green-700/30 hover:scale-105 transition-all duration-200 hover:shadow-lg"
                          onClick={() => window.open("https://wa.me/+4407386588951", "_blank")}
                        >
                          <div className="mb-2">
                            <FaWhatsapp className="text-2xl text-green-400" />
                          </div>
                          <span className="text-xs font-medium text-green-300">WhatsApp</span>
                        </div>
                        
                        {/* Email */}
                        <div
                          className="flex flex-col items-center p-3 rounded-lg cursor-pointer bg-gradient-to-r from-blue-900/20 to-blue-700/10 border border-blue-700/30 hover:scale-105 transition-all duration-200 hover:shadow-lg"
                          onClick={() => window.open("mailto:support@yourdomain.com", "_blank")}
                        >
                          <div className="mb-2">
                            <FaEnvelope className="text-2xl text-blue-400" />
                          </div>
                          <span className="text-xs font-medium text-blue-300">Email</span>
                        </div>
                        
                        {/* Facebook */}
                        <div
                          className="flex flex-col items-center p-3 rounded-lg cursor-pointer bg-gradient-to-r from-indigo-900/20 to-indigo-700/10 border border-indigo-700/30 hover:scale-105 transition-all duration-200 hover:shadow-lg"
                          onClick={() => window.open("https://facebook.com", "_blank")}
                        >
                          <div className="mb-2">
                            <FaFacebook className="text-2xl text-indigo-400" />
                          </div>
                          <span className="text-xs font-medium text-indigo-300">Facebook</span>
                        </div>
                        
                        {/* Instagram */}
                        <div
                          className="flex flex-col items-center p-3 rounded-lg cursor-pointer bg-gradient-to-r from-pink-900/20 to-purple-700/10 border border-pink-700/30 hover:scale-105 transition-all duration-200 hover:shadow-lg"
                          onClick={() => window.open("https://instagram.com", "_blank")}
                        >
                          <div className="mb-2">
                            <FaInstagram className="text-2xl text-pink-400" />
                          </div>
                          <span className="text-xs font-medium text-pink-300">Instagram</span>
                        </div>
                        
                        {/* Telegram */}
                        <div
                          className="flex flex-col items-center p-3 rounded-lg cursor-pointer bg-gradient-to-r from-sky-900/20 to-sky-700/10 border border-sky-700/30 hover:scale-105 transition-all duration-200 hover:shadow-lg"
                          onClick={() => window.open("https://t.me/foursix", "_blank")}
                        >
                          <div className="mb-2">
                            <FaTelegram className="text-2xl text-sky-400" />
                          </div>
                          <span className="text-xs font-medium text-sky-300">Telegram</span>
                        </div>
                        
                        {/* Twitter/X */}
                        <div
                          className="flex flex-col items-center p-3 rounded-lg cursor-pointer bg-gradient-to-r from-gray-900/20 to-gray-700/10 border border-gray-700/30 hover:scale-105 transition-all duration-200 hover:shadow-lg"
                          onClick={() => window.open("https://twitter.com", "_blank")}
                        >
                          <div className="mb-2">
                            <FaTwitter className="text-2xl text-gray-400" />
                          </div>
                          <span className="text-xs font-medium text-gray-300">Twitter</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="h-10"></div>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-50 z-30 md:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Mobile App Download Banner */}
      {showMobileAppBanner && isMobileDevice() && (
        <div className="fixed bottom-0 left-0 h-full right-0 flex justify-center items-end bg-[rgba(0,0,0,0.4)] border-t border-[#333] z-[10001] shadow-lg">
          <div className="w-full flex items-center justify-between bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] p-3">
            <div className="flex items-center space-x-3">
              <div className="border-[1px] border-theme_color rounded-[4px] px-2 py-3 ">
                <img src={logo} className="w-[60px]" alt="" />
              </div>
              <div>
                <h3 className="text-white text-sm font-[500]">Download Our App</h3>
                <p className="text-gray-400 text-xs">Better experience & exclusive bonuses</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={()=>{downloadFileAtURL(APK_FILE)}}
                className="bg-theme_color cursor-pointer hover:bg-theme_color/90 text-white text-xs font-medium py-2 px-3 rounded transition-colors"
              >
                Download
              </button> 
              <button
                onClick={handleCloseBanner}
                className="text-gray-400 cursor-pointer hover:text-white p-1 transition-colors"
                aria-label="Close banner"
              >
                <IoClose size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] z-50" 
           style={showMobileAppBanner ? { bottom: '80px' } : {}}>
        <div className="flex justify-around items-center py-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex flex-col items-center cursor-pointer justify-center p-2 text-xs text-gray-400 hover:text-yellow-400 transition-colors"
          >
            <img src={menu_img} alt="Menu" className="h-6 w-6 mb-1" />
            <span>Menu</span>
          </button>
          <NavLink
            to="/casino"
            className="flex flex-col items-center justify-center p-2 text-xs text-gray-400 hover:text-yellow-400 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <img src={casino_img} alt="Casino" className="h-6 w-6 mb-1" />
            <span>Casino</span>
          </NavLink>
          <NavLink
            to="/slots"
            className="flex flex-col items-center justify-center p-2 text-xs text-gray-400 hover:text-yellow-400 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <img src={slot_img} alt="Slots" className="h-6 w-6 mb-1" />
            <span>Slots</span>
          </NavLink>

          {/* Download App Button in Mobile Bottom Bar */}
          <button
            onClick={() => downloadFileAtURL(APK_FILE)}
            className="flex flex-col items-center justify-center p-2 text-xs text-theme_color hover:text-yellow-400 transition-colors"
          >
            <FaMobileAlt className="h-6 w-6 mb-1" />
            <span>App</span>
          </button>

          {isLoggedIn ? (
            <NavLink
              to="/my-profile"
              className="flex flex-col items-center justify-center p-2 text-xs text-gray-400 hover:text-yellow-400 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <img src={profile_img} alt="Profile" className="h-6 w-6 mb-1" />
              <span>Profile</span>
            </NavLink>
          ) : (
            <NavLink
              to="/promotions"
              className="flex flex-col items-center justify-center p-2 text-xs text-gray-400 hover:text-yellow-400 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <img
                src="https://img.b112j.com/bj/h5/assets/v3/images/icon-set/menu-type/favorite.png?v=1757670016214&source=drccdnsrc"
                alt="Promotions"
                className="h-6 w-6 mb-1"
              />
              <span>Promotions</span>
            </NavLink>
          )}
        </div>
      </div>

      {/* WhatsApp & Telegram Floating Buttons - Vertical Stack */}
      <div className="fixed bottom-25 md:bottom-20 right-4 z-[1000] flex flex-col gap-4">
        {/* Telegram Button - Top */}
        <a
          href="https://t.me/foursix"
          target="_blank"
          rel="noopener noreferrer"
          className="border-[1px] border-gray-200 bg-blue-500 p-4 rounded-full shadow-lg hover:bg-blue-600 transition-all duration-300 animate-bounce hover:animate-pulse"
          aria-label="Join Telegram Channel"
          style={{ animationDelay: '0.1s' }}
        >
          <FaTelegram className="text-white text-2xl" />
        </a>
        
        {/* WhatsApp Button - Bottom */}
        <a
          href="https://wa.me/+4407386588951"
          target="_blank"
          rel="noopener noreferrer"
          className="border-[1px] border-gray-200 bg-green-500 p-4 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 animate-bounce hover:animate-pulse"
          aria-label="Contact Support on WhatsApp"
          style={{ animationDelay: '0.2s' }}
        >
          <FaWhatsapp className="text-white text-2xl" />
        </a>
      </div>

      {/* Signup Success Popup */}
      {showSignupPopup && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-70 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
          <div ref={popupRef} className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-[#333] rounded-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowSignupPopup(false)}
              className="absolute -top-3 -right-3 bg-[#333] hover:bg-[#444] text-white cursor-pointer hover:text-white w-8 h-8 rounded-full flex items-center justify-center transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex justify-center mb-6">
              <div className="relative">
                <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="30" cy="30" r="28" fill="#1a1a1a" stroke="#00cc00" strokeWidth="4" />
                  <path d="M25 30L27 32L35 24" stroke="#00cc00" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <h2 className="text-white text-center text-lg font-semibold mb-2">Sign up successfully</h2>
            <p className="text-gray-300 text-xs md:text-[15px] text-center mb-6">
              Your registration is complete and get ready for the thrill of the game! The world of sports betting is now at your fingertips. Best of luck on your bets!
            </p>
            <NavLink
              to="/member/deposit"
              className="bg-theme_color text-center hover:bg-theme_color/90 text-[14px] text-white font-medium py-3 px-4 rounded-md transition-colors w-full block"
            >
              Deposit now
            </NavLink>
          </div>
        </div>
      )}

      {/* Game Loading Spinner */}
      {gameLoading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-[1000]">
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
              <img src={logo} alt="Loading..." className="w-20 h-20 object-contain animate-pulse" />
              <div className="absolute -inset-4 border-4 border-theme_color border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for game images in sidebar */}
      <style>
        {`
          /* Force consistent image size and aspect ratio - Portrait 3:4 for exclusive games */
          .game-image-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 133.33%; /* 3:4 aspect ratio (portrait) */
            overflow: hidden;
            border-radius: 6px;
          }
          
          .game-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          /* Smooth skeleton animation */
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }

          .animate-pulse {
            animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }

          /* Custom scrollbar hide for mobile */
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>
    </>
  );
};