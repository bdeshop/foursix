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
const SkeletonItem = ({ type }) => {
  if (type === "category") {
    return (
      <div className="flex flex-col relative items-center justify-center p-3 rounded-[5px] bg-[#222424] animate-pulse h-[80px] w-full">
        <div className="w-[45px] h-[45px] absolute top-[-30%] rounded-full bg-[#333] border-2 border-[#1a1a1a]"></div>
        <div className="h-3 w-16 bg-[#333] mt-4 rounded"></div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center rounded-[8px] overflow-hidden animate-pulse w-full">
      <div className="w-full aspect-[3/4] bg-[#222424] rounded-[6px]"></div>
    </div>
  );
};

const CategorySkeleton = ({ isMobile }) => {
  if (isMobile) {
    return (
      <div className="block lg:hidden px-2 py-4 md:p-4 pt-[40px] relative">
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="flex-shrink-0 w-[calc(25.333%-0.5rem)] min-w-0"
            >
              <SkeletonItem type="category" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:grid grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4 p-4 pt-[40px]">
      {Array.from({ length: 9 }).map((_, index) => (
        <SkeletonItem key={index} type="category" />
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
              className="flex flex-col items-center bg-[#2A3254] rounded-[3px] p-[10px]"
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
  const [menuGames, setMenuGames] = useState([]);
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
      // Always fetch menu games for the Sports tab
      await fetchMenuGames();
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
      const gamesPerPage = calculateGamesPerPage();
      const initialGames = menuGames.slice(0, gamesPerPage);
      setDisplayedGames(initialGames);
      setGamesPage(1);
      setHasMoreGames(menuGames.length > gamesPerPage);
    } else {
      setDisplayedGames([]);
      setHasMoreGames(false);
      setGamesPage(1);
    }
  }, [menuGames, isMobile]);

  // Calculate games per page based on screen size
  const calculateGamesPerPage = () => {
    if (isMobile) {
      // Mobile: 4 columns × 3 rows = 12 games initially
      return 12;
    } else {
      // Desktop: Start with 14 games
      return 14;
    }
  };

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
    setContentLoading(true);
    try {
      const response = await axios.get(`${base_url}/api/menu-games`);
      
      let gamesData = [];
      
      if (response.data && response.data.data) {
        gamesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        gamesData = response.data;
      }
      
      // Filter only sports games
      const sportsGames = gamesData.filter(game => {
        if (!game) return false;
        
        const categoryName = (game.categoryname || game.category || game.categoryName || '').toLowerCase();
        const gameName = (game.name || game.gameName || '').toLowerCase();
        
        // Check for sports category or sports in game name
        return categoryName.includes("sports") || gameName.includes("sports");
      });
      
      // Use sports games if available, otherwise use all menu games
      const gamesToDisplay = sportsGames.length > 0 ? sportsGames : gamesData;
      setMenuGames(gamesToDisplay);
      setProviders([]);
    } catch (error) {
      console.error("Error fetching menu games:", error);
      setMenuGames([]);
    } finally {
      setContentLoading(false);
    }
  };

  const handleCategoryClick = async (category) => {
    // Only update if category actually changed
    if (activeCategory?._id === category._id) return;
    
    setActiveCategory(category);
    
    // Check if this is the Sports category (case insensitive)
    if (category.name.toLowerCase() === "sports") {
      await fetchMenuGames();
    } else {
      await fetchProviders(category.name);
    }
  };

  const handleProviderClick = (provider) => {
    if (activeCategory) {
      navigate(
        `/games?category=${activeCategory.name.toLowerCase()}&provider=${provider.providercode}`
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
      navigate(`/game/${game.gameApiID || game.gameId}?provider=${game.provider}&category=${game.categoryname}`);
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
    const nextGames = menuGames.slice(0, gamesPerLoad * nextPage);
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
        <div className="py-4">
          <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {[...Array(calculateGamesPerPage())].map((_, i) => (
              <SkeletonItem key={i} type="game" />
            ))}
          </div>
        </div>
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
        <div className="py-4">
          <div className="grid grid-cols-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-3">
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
                      e.target.src = logo; // Fallback image on error
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
                className="px-8 py-3 bg-theme_color hover:bg-theme_color/90 text-white text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-theme_color/30"
                onClick={handleShowMore}
              >
                More Games
              </button>
            </div>
          )}

          {/* Show message if no games found */}
          {displayedGames.length === 0 && menuGames.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No sports games found.
            </div>
          )}
        </div>
      );
    }

    // Render providers grid for non-sports categories
    return (
      <div className="py-[10px]">
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
                onError={(e) => {
                  e.target.src = logo; // Fallback image on error
                }}
              />
              <span className="text-sm text-gray-400 truncate max-w-[80px]">
                {provider.name}
              </span>
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

          /* Custom scrollbar hide for mobile */
          .hidescrollbar::-webkit-scrollbar {
            display: none;
          }
          .hidescrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
          .animate-pulse {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}
      </style>

      {/* Show skeleton loading while fetching categories */}
      {loading ? (
        <CategorySkeleton isMobile={isMobile} />
      ) : (
        <>
          {/* Mobile slider for categories using Embla Carousel */}
          <div className="block lg:hidden py-4 md:p-4 pt-[30px] md:pt-[40px] relative hidescrollbar">
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
                      onError={(e) => {
                        e.target.src = logo; // Fallback image on error
                      }}
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
          <div className="hidden lg:grid grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-4 pt-[40px]">
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
                  onError={(e) => {
                    e.target.src = logo; // Fallback image on error
                  }}
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