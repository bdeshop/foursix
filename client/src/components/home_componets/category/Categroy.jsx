import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  createContext,
  useContext,
} from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import axios from "axios";
import toast from "react-hot-toast";
import logo from "../../../assets/logo.png";

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use the auth context
const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  useEffect(() => {
    // Check if user is logged in on app load
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("usertoken");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Validate token with backend
      const response = await fetch(`${base_url}/api/user/my-information`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem("token", token);
    setUser(userData);
  };

  const value = {
    user,
    login,
    checkAuthStatus,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Cache for categories data
let categoriesCache = null;
let brandingCache = null;

// Skeleton Loading Components
const CategorySkeleton = ({ isMobile }) => {
  if (isMobile) {
    return (
      <div className="block lg:hidden px-2 py-4 md:p-4 pt-[40px] relative">
        <div className="flex gap-3 ">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[calc(25.333%-0.5rem)] min-w-0 flex flex-col relative items-center justify-center p-3 rounded-[5px] bg-box_bg"
            >
              <div className="w-[45px] h-[45px] absolute top-[-30%] rounded-full bg-gray-700 animate-pulse"></div>
              <div className="w-16 h-4 mt-4 bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:grid grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4 p-4 pt-[40px]">
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col relative items-center justify-center p-3 rounded-[5px] bg-box_bg"
        >
          <div className="w-[45px] h-[45px] absolute top-[-30%] rounded-full bg-gray-700 animate-pulse"></div>
          <div className="w-16 h-4 mt-4 bg-gray-700 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );
};

const ContentSkeleton = ({ isExclusiveCategory }) => {
  if (isExclusiveCategory) {
    return (
      <div className="px-2 md:p-4">
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
          {Array.from({ length: 18 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center bg-[#2A3254] rounded-[8px] p-[10px]"
            >
              <div className="game-image-container mb-2">
                <div className="game-image bg-gray-700 rounded animate-pulse"></div>
              </div>
              <div className="pt-2 w-full">
                <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-2 md:p-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
        {Array.from({ length: 14 }).map((_, index) => (
          <div
            key={index}
            className="flex justify-start items-center gap-[10px] px-4 py-2 rounded-[3px] bg-[#222424]"
          >
            <div className="w-[30px] h-[30px] bg-gray-700 rounded-full animate-pulse"></div>
            <div className="w-16 h-4 bg-gray-700 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CategoryContent = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();
  const { user } = useAuth();

  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [exclusiveGames, setExclusiveGames] = useState([]);
  const [displayedGames, setDisplayedGames] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gamesPage, setGamesPage] = useState(1);
  const [hasMoreGames, setHasMoreGames] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameLoading, setGameLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const [contentLoading, setContentLoading] = useState(true);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  });

  // Fetch branding data for dynamic logo with caching
  const fetchBrandingData = async () => {
    if (brandingCache) {
      setDynamicLogo(brandingCache);
      return;
    }

    try {
      const response = await axios.get(`${base_url}/api/branding`);
      if (response.data.success && response.data.data && response.data.data.logo) {
        const logoUrl = response.data.data.logo.startsWith('http') 
          ? response.data.data.logo 
          : `${base_url}${response.data.data.logo.startsWith('/') ? '' : '/'}${response.data.data.logo}`;
        setDynamicLogo(logoUrl);
        brandingCache = logoUrl;
      }
    } catch (error) {
      console.error("Error fetching branding data:", error);
      setDynamicLogo(logo);
    }
  };

  // Check if device is mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sort categories to ensure Exclusive is always first
  const sortCategoriesWithExclusiveFirst = (categories) => {
    if (!categories || categories.length === 0) return [];
    
    const exclusiveCategory = categories.find(cat => 
      cat.name.toLowerCase() === "exclusive"
    );
    
    if (!exclusiveCategory) return categories;
    
    // Filter out exclusive category and then add it at the beginning
    const otherCategories = categories.filter(cat => 
      cat.name.toLowerCase() !== "exclusive"
    );
    
    return [exclusiveCategory, ...otherCategories];
  };

  // Find and set Exclusive category as active
  const setExclusiveCategoryAsActive = async (categories) => {
    // First, try to find "Exclusive" category (case insensitive)
    let exclusiveCategory = categories.find(cat => 
      cat.name.toLowerCase() === "exclusive"
    );

    // If not found, use the first category
    if (!exclusiveCategory && categories.length > 0) {
      exclusiveCategory = categories[0];
    }

    if (exclusiveCategory) {
      setActiveCategory(exclusiveCategory);
      setContentLoading(true);
      // Always fetch exclusive games for the Exclusive tab
      await fetchExclusiveGames();
      setContentLoading(false);
    }
  };

  // Load categories from cache or fetch them
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      
      // If we have cached categories, use them immediately
      if (categoriesCache) {
        const sortedCategories = sortCategoriesWithExclusiveFirst(categoriesCache);
        setCategories(sortedCategories);
        await setExclusiveCategoryAsActive(sortedCategories);
        setLoading(false);
        return;
      }

      // No cache, fetch fresh data
      await fetchCategories();
    };

    initializeData();
    fetchBrandingData();
  }, []);

  // Update displayed games when exclusive games change
  useEffect(() => {
    if (exclusiveGames.length > 0) {
      const gamesPerPage = calculateGamesPerPage();
      const initialGames = exclusiveGames.slice(0, gamesPerPage);
      setDisplayedGames(initialGames);
      setGamesPage(1);
      setHasMoreGames(exclusiveGames.length > gamesPerPage);
    } else {
      setDisplayedGames([]);
      setHasMoreGames(false);
      setGamesPage(1);
    }
  }, [exclusiveGames, isMobile]);

  // Calculate games per page based on screen size
  const calculateGamesPerPage = () => {
    if (isMobile) {
      // Mobile: 2 columns × 4 rows = 8 games initially
      return 9;
    } else {
      // Desktop: Start with 12 games (2-3 rows depending on columns)
      return 14;
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${base_url}/api/categories`);
      if (response.data.success) {
        // Sort categories with Exclusive first, then cache them
        const sortedCategories = sortCategoriesWithExclusiveFirst(response.data.data);
        categoriesCache = sortedCategories;
        setCategories(sortedCategories);
        await setExclusiveCategoryAsActive(sortedCategories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async (categoryName) => {
    try {
      setContentLoading(true);
      const response = await axios.get(
        `${base_url}/api/providers/${categoryName}`
      );
      if (response.data.success) {
        setProviders(response.data.data);
        setExclusiveGames([]); // Clear exclusive games when showing providers
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setContentLoading(false);
    }
  };

  const fetchExclusiveGames = async () => {
    try {
      const response = await axios.get(`${base_url}/api/menu-games`);
      
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
    }
  };

  const handleCategoryClick = async (category) => {
    // Only update if category actually changed
    if (activeCategory?._id === category._id) return;
    
    setActiveCategory(category);
    setContentLoading(true);
    
    // Check if this is the Exclusive category (case insensitive)
    if (category.name.toLowerCase() === "exclusive") {
      await fetchExclusiveGames();
    } else {
      await fetchProviders(category.name);
    }
    setContentLoading(false);
  };

  const handleProviderClick = (provider) => {
    if (activeCategory) {
      navigate(
        `/games?category=${activeCategory.name.toLowerCase()}&provider=${provider.name.toLowerCase()}`
      );
    }
  };

  // Handle game click - Direct navigation to game page
  const handleGameClick = (game) => {
    setSelectedGame(game);
    console.log("Selected game:", game);
    
    // Check if user is logged in
    if (!user) {
      setShowLoginPopup(true);
      return;
    }
    
    // If user is logged in, navigate directly to game
    if (game.gameApiID || game.gameId) {
      navigate(`/game/${game.gameApiID || game.gameId}`);
    } else {
      toast.error("Game ID not found");
    }
  };

  // Handle opening the game
  const handleOpenGame = async (game) => {
    console.log("Attempting to open game:", game);

    // Check if user is logged in
    if (!user) {
      toast.error("Please login to play games");
      setShowLoginPopup(true);
      return;
    }

    try {
      setGameLoading(true);
      
      // Direct navigation to game page
      const gameId = game.gameApiID || game.gameId;
      if (gameId) {
        navigate(`/game/${gameId}`);
      } else {
        toast.error("Game ID not found");
      }
      
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error connecting to game server");
    } finally {
      setGameLoading(false);
    }
  };

  // Handle login from popup
  const handleLoginFromPopup = () => {
    setShowLoginPopup(false);
    navigate("/login");
  };

  // Handle register from popup
  const handleRegisterFromPopup = () => {
    setShowLoginPopup(false);
    navigate("/register");
  };

  const handleShowMore = () => {
    const nextPage = gamesPage + 1;
    const gamesPerLoad = calculateGamesPerPage();
    const nextGames = exclusiveGames.slice(0, gamesPerLoad * nextPage);
    setDisplayedGames(nextGames);
    setGamesPage(nextPage);
    setHasMoreGames(exclusiveGames.length > nextGames.length);
  };

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showLoginPopup && !event.target.closest(".popup-content")) {
        setShowLoginPopup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLoginPopup]);

  // Get game image URL
  const getGameImageUrl = (game) => {
    if (!game) return '';
    
    const imagePath = game.portraitImage || game.image || game.thumbnail || '';
    if (!imagePath) return '';
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Remove leading slash if present to avoid double slash
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    return `${base_url}/${cleanPath}`;
  };

  // Render provider grid based on the number of providers
  const renderProviderGrid = () => {
    // Show skeleton loading for content
    if (contentLoading) {
      return (
        <ContentSkeleton 
          isExclusiveCategory={activeCategory?.name.toLowerCase() === "exclusive"}
        />
      );
    }

    if (providers.length === 0 && exclusiveGames.length === 0) {
      return (
        <div className="p-4 text-center text-[13px] text-white">
          No content found for this category.
        </div>
      );
    }

    // Check if active category is Exclusive (case insensitive)
    const isExclusiveCategory = activeCategory?.name.toLowerCase() === "exclusive";

    if (isExclusiveCategory) {
      // Render exclusive games in a responsive grid with portrait images
      return (
        <div className="px-2 md:p-4">
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
            {displayedGames.map((game) => (
              <div
                key={game._id || game.gameId}
                className="flex flex-col items-center rounded-[8px] overflow-hidden transition-all cursor-pointer hover:border-theme_color hover:shadow-lg group"
                onClick={() => handleGameClick(game)}
              >
                {/* Game Image Container with fixed aspect ratio */}
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
              </div>
            ))}
          </div>

          {/* More Button - Only show if there are more games to load */}
          {hasMoreGames && displayedGames.length > 0 && (
            <div className="flex justify-center mt-8 mb-4">
              <button
                className="px-8 py-3 bg-theme_color hover:bg-theme_color/90 text-white text-sm font-medium rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-theme_color/30"
                onClick={handleShowMore}
              >
                More Games
              </button>
            </div>
          )}

          {/* Show message if no games found */}
          {displayedGames.length === 0 && exclusiveGames.length === 0 && !contentLoading && (
            <div className="text-center py-8 text-gray-400">
              No exclusive games found.
            </div>
          )}
        </div>
      );
    }

    // Render providers grid for non-exclusive categories
    return (
      <div className="px-2 md:p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-3">
          {providers.map((provider) => (
            <div
              key={provider._id}
              className="flex justify-start items-center gap-[10px] px-4 py-2 rounded-[3px] bg-[#222424] hover:bg-[#333333] transition-all cursor-pointer text-white"
              onClick={() => handleProviderClick(provider)}
            >
              <img
                src={`${base_url}/${provider.image}`}
                alt={provider.name}
                className="w-[30px]"
              />
              <span className="text-sm text-gray-400">{provider.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>
        {`
          /* Force consistent image size and aspect ratio - Portrait 3:4 */
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
          .hidescrollbar::-webkit-scrollbar {
            display: none;
          }
          .hidescrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}
      </style>

      {/* Show skeleton loading while fetching categories */}
      {loading ? (
        <CategorySkeleton isMobile={isMobile} />
      ) : (
        <>
          {/* Mobile slider for categories using Embla Carousel */}
          <div className="block lg:hidden px-2 py-4 md:p-4 pt-[30px]  md:pt-[40px] relative hidescrollbar">
            <div className="embla" ref={emblaRef}>
              <div className="embla__container flex gap-3">
                {categories.map((category) => (
                  <div
                    key={category._id}
                    className={`embla__slide flex-shrink-0 w-[calc(25.333%-0.5rem)] min-w-0 flex flex-col relative items-center justify-center p-3 rounded-[5px] transition-all group cursor-pointer ${
                      activeCategory?._id === category._id
                        ? "bg-theme_color text-white"
                        : "bg-box_bg hover:bg-[#333333]"
                    }`}
                    onClick={() => handleCategoryClick(category)}
                  >
                    <img
                      src={`${base_url}/${category.image}`}
                      alt={category.name}
                      className="w-[45px] absolute top-[-30%] rounded-full transition-transform duration-300 ease-in-out group-hover:rotate-[360deg]"
                    />
                    
                    <span
                      className={`text-[13px] md:text-sm mt-4 font-[500] ${
                        activeCategory?._id === category._id
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                    >
                      {category.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Desktop grid for categories */}
          <div className="hidden lg:grid grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4 p-4 pt-[40px]">
            {categories.map((category) => (
              <div
                key={category._id}
                className={`flex flex-col relative items-center justify-center p-3 rounded-[5px] transition-all group cursor-pointer ${
                  activeCategory?._id === category._id
                    ? "bg-theme_color text-white"
                    : "bg-box_bg hover:bg-[#333333]"
                }`}
                onClick={() => handleCategoryClick(category)}
              >
                <img
                  src={`${base_url}/${category.image}`}
                  alt={category.name}
                  className="w-[45px] absolute top-[-30%] rounded-full transition-transform duration-300 ease-in-out group-hover:rotate-[360deg]"
                />
                <span
                  className={`text-sm mt-4 font-[500] ${
                    activeCategory?._id === category._id
                      ? "text-white"
                      : "text-gray-400"
                  }`}
                >
                  {category.name}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Content area (providers or exclusive games) */}
      {renderProviderGrid()}

      {/* Login Popup */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-70 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
          <div className="popup-content bg-gradient-to-b cursor-pointer from-[#1a1a1a] to-[#0f0f0f] border border-[#333] rounded-lg p-6 max-w-md w-full relative">
            {/* Close button */}
            <button
              onClick={() => setShowLoginPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src={dynamicLogo} 
                className="w-[100px]" 
                alt=""
                onError={(e) => {
                  e.target.src = logo;
                }}
              />
            </div>

            {/* Description */}
            <p className="text-gray-300 text-xs md:text-[15px] text-center mb-6">
              Please log in to play the game. If you don't have an account, sign
              up for free!
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleRegisterFromPopup}
                className="bg-theme_color text-center hover:bg-theme_color/90 text-[14px] text-white font-medium py-3 px-4 transition-colors"
              >
                Sign up
              </button>

              <button
                onClick={handleLoginFromPopup}
                className="bg-[#333] text-center hover:bg-[#444] text-[14px] text-white font-medium py-3 px-4 transition-colors"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Loading Overlay */}
      {gameLoading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-[1000]">
          <div className="flex flex-col items-center">
            {/* Animated logo with pulsing effect */}
            <div className="relative mb-8">
              <img
                src={dynamicLogo}
                alt="Loading..."
                className="w-20 h-20 object-contain animate-pulse"
              />
              {/* Spinning ring around logo */}
              <div className="absolute -inset-4 border-4 border-theme_color border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Main export component that wraps CategoryContent with AuthProvider
const Category = () => {
  return (
    <AuthProvider>
      <CategoryContent />
    </AuthProvider>
  );
};

export default Category;