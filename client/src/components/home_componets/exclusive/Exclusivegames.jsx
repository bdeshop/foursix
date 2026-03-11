import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import logo from "../../../assets/logo.png";

const Exclusivegames = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const navigate = useNavigate();

  const [exclusiveGames, setExclusiveGames] = useState([]);
  const [displayedGames, setDisplayedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gamesPage, setGamesPage] = useState(1);
  const [hasMoreGames, setHasMoreGames] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [dynamicLogo, setDynamicLogo] = useState(logo);

  // Games per row based on screen size
  const getGamesPerRow = () => {
    if (window.innerWidth >= 1280) return 7; // xl: 7 columns
    if (window.innerWidth >= 1024) return 6; // lg: 6 columns
    if (window.innerWidth >= 768) return 4;  // md: 4 columns
    return 3; // mobile: 3 columns
  };

  const [gamesPerRow, setGamesPerRow] = useState(getGamesPerRow());

  // Check if device is mobile and update games per row
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setGamesPerRow(getGamesPerRow());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // Get game image URL with proper path handling
  const getGameImageUrl = (game) => {
    if (!game) return '';
    
    // Try different possible image fields
    const imagePath = game.portraitImage || game.image || game.thumbnail || game.gameImage || '';
    
    if (!imagePath) {
      // Return a placeholder if no image
      return 'https://via.placeholder.com/300x400/2A3254/ffffff?text=Game';
    }
    
    // If it's already a full URL, return as is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // Remove leading slash if present to avoid double slash
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    
    // Construct the full URL
    return `${base_url}/${cleanPath}`;
  };

  // Fetch exclusive games
  const fetchExclusiveGames = async () => {
    try {
      setLoading(true);
      
      // Try multiple possible endpoints
      let response;
      try {
        // First try the exclusive-games endpoint
        response = await axios.get(`${base_url}/api/exclusive-games`);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // If exclusive-games endpoint doesn't exist, try menu-games with filter
          response = await axios.get(`${base_url}/api/menu-games`);
        } else {
          throw error;
        }
      }
      
      let gamesData = [];
      
      // Handle different response structures
      if (response.data && response.data.success && response.data.data) {
        gamesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        gamesData = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        gamesData = response.data.data;
      }
      
      // Filter for exclusive games if we got from menu-games
      if (gamesData.length > 0) {
        const exclusiveFiltered = gamesData.filter(game => {
          if (!game) return false;
          
          const categoryName = (game.categoryname || game.category || game.categoryName || '').toLowerCase();
          const gameName = (game.name || game.gameName || '').toLowerCase();
          
          return categoryName.includes("exclusive") || 
                 categoryName.includes("exlusive") ||
                 gameName.includes("exclusive") ||
                 gameName.includes("exlusive");
        });
        
        // If we found exclusive games, use them, otherwise use all games
        gamesData = exclusiveFiltered.length > 0 ? exclusiveFiltered : gamesData;
      }
      
      if (gamesData.length > 0) {
        setExclusiveGames(gamesData);
        
        // Calculate initial games to show (2 rows worth)
        const initialCount = gamesPerRow * 2;
        const initialGames = gamesData.slice(0, initialCount);
        setDisplayedGames(initialGames);
        setHasMoreGames(gamesData.length > initialCount);
        setGamesPage(1);
      } else {
        setExclusiveGames([]);
        setDisplayedGames([]);
        setHasMoreGames(false);
      }
    } catch (error) {
      console.error("Error fetching exclusive games:", error);
      
      if (error.response && error.response.status === 404) {
        toast.error("Exclusive games endpoint not found");
      } else {
        toast.error("Failed to load exclusive games");
      }
      
      setExclusiveGames([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExclusiveGames();
    fetchBrandingData();
  }, []);

  // Update displayed games when games per row changes
  useEffect(() => {
    if (exclusiveGames.length > 0) {
      const initialCount = gamesPerRow * 2;
      const initialGames = exclusiveGames.slice(0, initialCount);
      setDisplayedGames(initialGames);
      setHasMoreGames(exclusiveGames.length > initialCount);
      setGamesPage(1);
    }
  }, [gamesPerRow, exclusiveGames]);

  // Handle game click with proper navigation
  const handleGameClick = (game) => {
    console.log("Game clicked:", game); // For debugging
    
    const token = localStorage.getItem("token");
    
    if (!token) {
      setShowLoginPopup(true);
      return;
    }
    
    // Get the game ID from various possible fields
    const gameId = game.gameApiID || game.gameId || game._id;
    
    if (!gameId) {
      toast.error("Game ID not found");
      return;
    }
    
    // Navigate to game page with provider and category if available
    const provider = game.provider || game.providercode || '';
    const category = game.categoryname || game.category || '';
    
    let navigateUrl = `/game/${gameId}`;
    
    // Add query parameters if available
    const params = new URLSearchParams();
    if (provider) params.append('provider', provider);
    if (category) params.append('category', category);
    
    if (params.toString()) {
      navigateUrl += `?${params.toString()}`;
    }
    
    navigate(navigateUrl);
  };

  // Handle show more games
  const handleShowMore = () => {
    const nextPage = gamesPage + 1;
    const gamesPerLoad = gamesPerRow * 2;
    const nextGames = exclusiveGames.slice(0, gamesPerLoad * nextPage);
    setDisplayedGames(nextGames);
    setGamesPage(nextPage);
    setHasMoreGames(exclusiveGames.length > nextGames.length);
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

  // Calculate skeleton count
  const calculateInitialGames = () => {
    return gamesPerRow * 2;
  };

  // Skeleton Loading Component
  const ContentSkeleton = () => {
    const skeletonCount = calculateInitialGames();
    
    return (
      <div className="px-2 md:p-4">
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center rounded-[8px] overflow-hidden"
            >
              <div className="w-full pb-[133.33%] relative bg-[#2A3254] rounded-[8px] animate-pulse">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-theme_color border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              <div className="mt-2 w-full h-4 bg-[#2A3254] rounded animate-pulse"></div>
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
          .game-image-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-bottom: 133.33%;
            overflow: hidden;
            border-radius: 8px;
          }
          
          .game-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }

          .game-image:hover {
            transform: scale(1.1);
          }

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

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }

          .animate-spin {
            animation: spin 1s linear infinite;
          }

          .hidescrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hidescrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      {/* Header Section */}
      <div className=" pt-8">
        <h2 className="text-[16px] md:text-lg font-semibold flex items-center">
          <span className="w-1 h-6 bg-theme_color mr-2 rounded-full"></span>
          Exclusive Games
        </h2>
      </div>

      {/* Show skeleton loading while fetching games */}
      {loading ? (
        <ContentSkeleton />
      ) : (
        <>
          {/* Exclusive Games Grid */}
          <div className="py-[20px]">
            {displayedGames.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-lg">No exclusive games available at the moment.</p>
              </div>
            ) : (
              <>
                {/* Grid layout */}
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2 md:gap-3">
                  {displayedGames.map((game) => (
                    <div
                      key={game._id || game.gameId || game.gameApiID}
                      className="flex flex-col items-center rounded-[8px] overflow-hidden transition-all cursor-pointer group"
                      onClick={() => handleGameClick(game)}
                    >
                      {/* Game Image Container */}
                      <div className="game-image-container w-full border-2 border-transparent group-hover:border-theme_color group-hover:shadow-lg group-hover:shadow-theme_color/20 transition-all duration-300">
                        <img
                          src={getGameImageUrl(game)}
                          alt={game.name || game.gameName || 'Game'}
                          className="game-image"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMoreGames && (
                  <div className="flex justify-center mt-8 mb-4">
                    <button
                      className="px-8 py-3 bg-theme_color hover:bg-theme_color/90 text-white text-sm font-medium transition-all duration-300 hover:shadow-lg hover:shadow-theme_color/30 rounded-[5px]"
                      onClick={handleShowMore}
                    >
                      Load More Games
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Login Popup */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
          <div className="popup-content bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-[#333] rounded-lg p-6 max-w-md w-full relative">
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

            <p className="text-gray-300 text-xs md:text-[15px] text-center mb-6">
              Please log in to play exclusive games. If you don't have an account, sign up for free!
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleRegisterFromPopup}
                className="bg-theme_color text-center hover:bg-theme_color/90 text-[14px] text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Sign up for Free
              </button>

              <button
                onClick={handleLoginFromPopup}
                className="bg-[#333] text-center hover:bg-[#444] text-[14px] text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Log in to Play
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Loading Overlay */}
      {gameLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[1000]">
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
              <img
                src={dynamicLogo}
                alt="Loading..."
                className="w-20 h-20 object-contain animate-pulse"
              />
              <div className="absolute -inset-4 border-4 border-theme_color border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-white text-lg mt-4">Loading game...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Exclusivegames;