import React, {
  useRef,
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import logo from "../../../assets/logo.png";
import axios from "axios";

// Create Auth Context
const AuthContext = createContext();

const useAuth = () => {
  return useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem("usertoken");
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${base_url}/api/user/my-information`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        localStorage.removeItem("usertoken");
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem("usertoken", token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("usertoken");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, checkAuthStatus, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const FeaturedContent = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [featuredGames, setFeaturedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [dynamicLogo, setDynamicLogo] = useState(logo);

  const { user } = useAuth();
  const navigate = useNavigate();
  const sliderRef = useRef(null);
  const popupRef = useRef(null);

  // --- MOUSE DRAG SLIDER LOGIC ---
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeftState(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed multiplier
    sliderRef.current.scrollLeft = scrollLeftState - walk;
  };

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
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchFeaturedGames = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${base_url}/api/games/featured/all`);
        const data = await response.json();
        if (data.success) {
          setFeaturedGames(data.data);
        } else {
          throw new Error(data.message || "Failed to fetch");
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching featured games:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeaturedGames();
    fetchBrandingData();
  }, [base_url]);

  const scrollManual = (direction) => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
    }
  };

  // Helper function to get the correct image URL
  const getImageUrl = (game) => {
    if (!game) return logo;
    
    // Check for different possible image fields
    const imageField = game.portraitImage || game.image || game.coverImage || game.defaultImage;
    
    if (!imageField) return logo;
    
    // If it's already a full URL (from CDN)
    if (imageField.startsWith('http://') || imageField.startsWith('https://')) {
      return imageField;
    }
    
    // If it's a local path
    if (imageField.startsWith('/')) {
      return `${base_url}${imageField}`;
    }
    
    // Otherwise, assume it's a relative path
    return `${base_url}/${imageField}`;
  };

  const handleGameClick = (game) => {
    if (isDragging) return; // Prevent click during drag
    if (!user) {
      setShowLoginPopup(true);
      return;
    }
    handleOpenGame(game);
  };

  const handleOpenGame = async (game) => {
    try {
      setGameLoading(true);
      const gameId = game.gameId || game.gameApiID;
      const response = await fetch(`${base_url}/api/games/${gameId}`);
      const gameData = await response.json();
      
      if (gameData.success) {
        // Get category - handle both array and string
        let categoryValue = 'slots';
        if (game.category) {
          if (Array.isArray(game.category)) {
            categoryValue = game.category[0] || 'slots';
          } else {
            categoryValue = game.category;
          }
        }
        
        navigate(`/game/${gameData.data.gameApiID}?provider=${encodeURIComponent(game.provider || '')}&category=${encodeURIComponent(categoryValue)}`);
      } else {
        throw new Error("Failed to load game");
      }
    } catch (err) {
      console.error("Error opening game:", err);
      toast.error("Error connecting to game server");
    } finally {
      setGameLoading(false);
    }
  };

  // Handle click outside popup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowLoginPopup(false);
      }
    };

    if (showLoginPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLoginPopup]);

  if (loading) return (
    <div className="bg-[#1a1a1a] p-4">
      <div className="flex overflow-x-auto gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[130px] md:w-[175px]">
            <div className="w-full pb-[125%] bg-gray-700 animate-pulse rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="bg-[#1a1a1a] p-4 text-center text-gray-400">
        <p>Unable to load featured games</p>
      </div>
    );
  }

  if (featuredGames.length === 0) {
    return null;
  }

  return (
    <>
      <style>
        {`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
          
          .featured-image-container {
            position: relative;
            width: 100%;
            padding-bottom: 125%;
            overflow: hidden;
            border-radius: 8px;
            background: #1a1a1a;
          }
          
          .featured-image {
            position: absolute;
            top: 0; left: 0;
            width: 100%; height: 100%;
            object-fit: cover;
          }

          /* --- WIDE GLOW ANIMATION --- */
          .glow-sweep {
            position: absolute;
            top: 0;
            left: -200%;
            width: 250%;
            height: 100%;
            background: linear-gradient(
              to right,
              transparent 0%,
              rgba(255, 255, 255, 0.02) 20%,
              rgba(255, 255, 255, 0.35) 50%,
              rgba(255, 255, 255, 0.02) 80%,
              transparent 100%
            );
            transform: skewX(-25deg);
            animation: sweepWide 5s ease-in-out infinite;
            pointer-events: none;
            z-index: 1;
          }

          @keyframes sweepWide {
            0% { left: -250%; opacity: 0; }
            10% { opacity: 1; }
            60% { left: 150%; opacity: 1; }
            70% { opacity: 0; }
            100% { left: 150%; opacity: 0; }
          }

          /* Stagger delays for glow animation */
          .featured-card:nth-child(2n) .glow-sweep { animation-delay: 0.7s; }
          .featured-card:nth-child(3n) .glow-sweep { animation-delay: 1.4s; }
          .featured-card:nth-child(4n) .glow-sweep { animation-delay: 2.1s; }
          .featured-card:nth-child(5n) .glow-sweep { animation-delay: 2.8s; }
          .featured-card:nth-child(6n) .glow-sweep { animation-delay: 3.5s; }
          .featured-card:nth-child(7n) .glow-sweep { animation-delay: 4.2s; }
        `}
      </style>
      
      <div className="bg-[#1a1a1a] pt-6 md:py-4 font-inter text-gray-200">
        <div className="flex justify-between items-center mb-2 md:mb-4 px-4">
          <h2 className="text-[16px] md:text-lg font-semibold flex items-center">
            <span className="w-1 h-6 bg-theme_color mr-2 rounded-full"></span>
            Featured Games
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => scrollManual('left')} 
              className="p-2 bg-box_bg rounded-[3px] hover:bg-gray-700 transition-colors"
              aria-label="Scroll left"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button 
              onClick={() => scrollManual('right')} 
              className="p-2 bg-box_bg rounded-[3px] hover:bg-gray-700 transition-colors"
              aria-label="Scroll right"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
        
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className="flex overflow-x-auto py-2 scrollbar-hide gap-2 md:gap-3 px-4"
          style={{ userSelect: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          {featuredGames.map((game, index) => (
            <div
              key={game._id || index}
              className="featured-card flex-shrink-0 w-[130px] md:w-[175px] p-1 transform transition-all duration-300 hover:scale-105 relative group"
              onClick={() => handleGameClick(game)}
            >
              <div className="featured-image-container">
                <img 
                  src={getImageUrl(game)} 
                  alt={game.name || "Featured game"} 
                  className="featured-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = logo;
                  }}
                />
                <div className="glow-sweep"></div>
                <div className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${
                  isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}>
                  <div className="bg-theme_color p-3 rounded-full transform scale-90 group-hover:scale-100 transition-all">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showLoginPopup && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[10000] p-4" 
          onClick={() => setShowLoginPopup(false)}
        >
          <div 
            ref={popupRef} 
            className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-[#333] rounded-lg p-6 max-w-md w-full relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setShowLoginPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex justify-center mb-6">
              <img 
                className="h-12 w-auto object-contain" 
                src={dynamicLogo} 
                alt="Logo" 
                onError={(e) => { e.target.src = logo; }} 
              />
            </div>
            <p className="text-gray-300 text-center mb-6">
              Please log in to play the game. If you don't have an account, sign up for free!
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => navigate("/register")} 
                className="bg-theme_color hover:bg-theme_color/90 text-white font-medium py-3 px-4 rounded-md transition-colors"
              >
                Sign up
              </button>
              <button 
                onClick={() => navigate("/login")} 
                className="bg-[#333] hover:bg-[#444] text-white font-medium py-3 px-4 rounded-md transition-colors"
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      )}

      {gameLoading && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]">
          <div className="relative">
            <img 
              src={dynamicLogo} 
              alt="Loading..." 
              className="w-20 h-20 object-contain animate-pulse"
              onError={(e) => { e.target.src = logo; }}
            />
            <div className="absolute -inset-4 border-4 border-theme_color border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
    </>
  );
};

const Featured = () => (
  <AuthProvider>
    <FeaturedContent />
  </AuthProvider>
);

export default Featured;