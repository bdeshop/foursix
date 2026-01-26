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
    const token = localStorage.getItem("token");

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
        <div className="flex gap-3 overflow-hidden">
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

const ContentSkeleton = ({ isSportsCategory }) => {
  if (isSportsCategory) {
    return (
      <div className="px-2 md:p-4">
        <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {Array.from({ length: 14 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center bg-[#2A3254] rounded-[3px] p-[10px] "
            >
              <div className="w-[100px] h-[133px] bg-gray-700 rounded animate-pulse"></div>
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
  const [menuGames, setMenuGames] = useState([]); // Changed from exclusiveGames to menuGames
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

  // Sort categories to ensure Sports is always first
  const sortCategoriesWithSportsFirst = (categories) => {
    if (!categories || categories.length === 0) return [];
    
    const sportsCategory = categories.find(cat => 
      cat.name.toLowerCase() === "sports"
    );
    
    if (!sportsCategory) return categories;
    
    // Filter out sports category and then add it at the beginning
    const otherCategories = categories.filter(cat => 
      cat.name.toLowerCase() !== "sports"
    );
    
    return [sportsCategory, ...otherCategories];
  };

  // Find and set Sports category as active
  const setSportsCategoryAsActive = async (categories) => {
    // First, try to find "Sports" category (case insensitive)
    let sportsCategory = categories.find(cat => 
      cat.name.toLowerCase() === "sports"
    );

    // If not found, use the first category
    if (!sportsCategory && categories.length > 0) {
      sportsCategory = categories[0];
    }

    if (sportsCategory) {
      setActiveCategory(sportsCategory);
      setContentLoading(true);
      // Always fetch menu games for the Sports tab
      await fetchMenuGames();
      setContentLoading(false);
    }
  };

  // Load categories from cache or fetch them
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      
      // If we have cached categories, use them immediately
      if (categoriesCache) {
        const sortedCategories = sortCategoriesWithSportsFirst(categoriesCache);
        setCategories(sortedCategories);
        await setSportsCategoryAsActive(sortedCategories);
        setLoading(false);
        return;
      }

      // No cache, fetch fresh data
      await fetchCategories();
    };

    initializeData();
    fetchBrandingData();
  }, []);

  // Update displayed games when menu games change
  useEffect(() => {
    if (menuGames.length > 0) {
      const initialGames = menuGames.slice(0, 20);
      setDisplayedGames(initialGames);
      setHasMoreGames(menuGames.length > 20);
    } else {
      setDisplayedGames([]);
      setHasMoreGames(false);
    }
  }, [menuGames]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${base_url}/api/categories`);
      if (response.data.success) {
        // Sort categories with Sports first, then cache them
        const sortedCategories = sortCategoriesWithSportsFirst(response.data.data);
        categoriesCache = sortedCategories;
        setCategories(sortedCategories);
        await setSportsCategoryAsActive(sortedCategories);
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
        setMenuGames([]); // Clear menu games when showing providers
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
    } finally {
      setContentLoading(false);
    }
  };

  const fetchMenuGames = async () => {
    try {
      const response = await axios.get(`${base_url}/api/menu-games`);
      if (response.data && response.data.length > 0) {
        // Filter only sports games if needed, or show all menu games
        const sportsGames = response.data.filter(game => 
          game.category && game.category.name.toLowerCase() === "sports"
        );
        
        // Use sports games if available, otherwise use all menu games
        const gamesToDisplay = sportsGames.length > 0 ? sportsGames : response.data;
        setMenuGames(gamesToDisplay);
        setProviders([]); // Clear providers when showing menu games
        setGamesPage(1);
      } else {
        setMenuGames([]);
      }
    } catch (error) {
      console.error("Error fetching menu games:", error);
      setMenuGames([]);
    }
  };

  const handleCategoryClick = async (category) => {
    // Only update if category actually changed
    if (activeCategory?._id === category._id) return;
    
    setActiveCategory(category);
    setContentLoading(true);
    
    // Check if this is the Sports category (case insensitive)
    if (category.name.toLowerCase() === "sports") {
      await fetchMenuGames();
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
 console.log(game)
    // Check if user is logged in
    if (!user) {
      setShowLoginPopup(true);
      return;
    }
    // If user is logged in, navigate directly to game
    navigate(`/game/${game.gameId}`);
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
      navigate(`/game/${game.gameApiID}`);
      
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
    const nextGames = menuGames.slice(0, 20 * nextPage);
    setDisplayedGames(nextGames);
    setGamesPage(nextPage);
    setHasMoreGames(menuGames.length > nextGames.length);
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

  // Render provider grid based on the number of providers
  const renderProviderGrid = () => {
    // Show skeleton loading for content
    if (contentLoading) {
      return (
        <ContentSkeleton 
          isSportsCategory={activeCategory?.name.toLowerCase() === "sports"}
        />
      );
    }

    if (providers.length === 0 && menuGames.length === 0) {
      return (
        <div className="p-4 text-center text-[13px] text-white">
          No content found for this category.
        </div>
      );
    }

    // Check if active category is Sports (case insensitive)
    const isSportsCategory = activeCategory?.name.toLowerCase() === "sports";

    if (isSportsCategory) {
      // Render menu games in a responsive grid
      return (
        <div className="px-2 md:p-4">
          <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
            {displayedGames.map((game) => (
              <div
                key={game._id}
                className="flex flex-col items-center md:flex-row bg-[#2A3254] rounded-[8px] border-[1px] border-gray-700 px-[10px] py-3 overflow-hidden transition-all cursor-pointer relative group"
                onClick={() => handleGameClick(game)}
              >
                  <img
                    src={`${base_url}/${game.portraitImage || game.image || ''}`}
                    alt={game.name}
                    className="w-[50px] h-[50px] transition-transform duration-300 group-hover:scale-105"
                  />
                <div className="pt-2 w-full">
                  <p className="text-white text-[12px] uppercase text-center truncate">{game.name}</p>
                </div>
              </div>
            ))}
          </div>

          {hasMoreGames && (
            <div className="flex justify-center mt-4">
              <button
                className="px-6 py-2 bg-theme_color cursor-pointer text-white text-sm rounded"
                onClick={handleShowMore}
              >
                More
              </button>
            </div>
          )}
        </div>
      );
    }

    // Render providers grid for non-sports categories
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
          /* Force consistent image size and aspect ratio */
          .game-image-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 133.33%; /* 3:4 aspect ratio */
            overflow: hidden;
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
        `}
      </style>

      {/* Show skeleton loading while fetching categories */}
      {loading ? (
        <CategorySkeleton isMobile={isMobile} />
      ) : (
        <>
          {/* Mobile slider for categories using Embla Carousel */}
          <div className="block lg:hidden px-2 py-4 md:p-4 pt-[40px] relative hidescrollbar">
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

      {/* Content area (providers or menu games) */}
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