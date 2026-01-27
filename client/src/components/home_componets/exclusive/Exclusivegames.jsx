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

  // Games per row based on screen size - MOBILE: 3 games per row
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

  // Fetch exclusive games
  const fetchExclusiveGames = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${base_url}/api/exclusive-games`);
      
      if (response.data && response.data.length > 0) {
        setExclusiveGames(response.data);
        
        // Calculate initial games to show (2 rows worth) - MOBILE: 2 rows × 3 games = 6 games
        const initialCount = gamesPerRow * 2;
        const initialGames = response.data.slice(0, initialCount);
        setDisplayedGames(initialGames);
        setHasMoreGames(response.data.length > initialCount);
        setGamesPage(1);
      } else {
        setExclusiveGames([]);
        setDisplayedGames([]);
        setHasMoreGames(false);
      }
    } catch (error) {
      console.error("Error fetching exclusive games:", error);
      
      if (error.response && error.response.status === 404) {
        toast.error("Exclusive category not found");
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
      const initialCount = gamesPerRow * 2; // Always show 2 rows
      const initialGames = exclusiveGames.slice(0, initialCount);
      setDisplayedGames(initialGames);
      setHasMoreGames(exclusiveGames.length > initialCount);
      setGamesPage(1);
    }
  }, [gamesPerRow, exclusiveGames]);

  // Handle game click
  const handleGameClick = (game) => {
    const token = localStorage.getItem("token");
    
    if (!token) {
      setShowLoginPopup(true);
      return;
    }
    
    const gameId = game.gameApiID || game._id;
    navigate(`/game/${gameId}`);
  };

  // Handle opening the game
  const handleOpenGame = async (game) => {
    console.log("Attempting to open game:", game);

    const token = localStorage.getItem("token");
    
    if (!token) {
      toast.error("Please login to play games");
      setShowLoginPopup(true);
      return;
    }

    try {
      setGameLoading(true);
      const gameId = game.gameApiID || game._id;
      navigate(`/game/${gameId}`);
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

  // Handle show more games - Loads 2 more rows each time
  const handleShowMore = () => {
    const nextPage = gamesPage + 1;
    const gamesPerLoad = gamesPerRow * 2; // Load 2 more rows each time
    const nextGames = exclusiveGames.slice(0, gamesPerLoad * nextPage);
    setDisplayedGames(nextGames);
    setGamesPage(nextPage);
    setHasMoreGames(exclusiveGames.length > nextGames.length);
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

  // Calculate how many games to show initially - Always 2 rows
  const calculateInitialGames = () => {
    return gamesPerRow * 2; // 2 rows
  };

  // Skeleton Loading Component - Shows 2 rows
  const ContentSkeleton = () => {
    const skeletonCount = calculateInitialGames(); // 2 rows worth
    
    return (
      <div className="px-2 md:p-4 pt-[40px]">
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
          {Array.from({ length: skeletonCount }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col items-center bg-[#2A3254] rounded-[8px] border-[1px] border-gray-700 p-[10px]"
            >
              <div className="w-full pb-[133.33%] relative bg-gray-700 rounded animate-pulse"></div>
              <div className="pt-2 w-full">
                <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
              </div>
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
          }
          
          .game-image {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
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

          .hidescrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hidescrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>

      {/* Header Title */}
      <div className="px-4 pt-8">
            <h2 className="text-[16px] md:text-lg font-semibold flex items-center">
            <span className="w-1 h-6 bg-theme_color mr-2 rounded-full"></span>
        Exclusive Games
          </h2>
        {/* Show how many games are visible */}
        {!loading && displayedGames.length > 0 && (
          <p className="text-gray-500 text-xs mt-2">
            Showing {displayedGames.length} of {exclusiveGames.length} games
          </p>
        )}
      </div>

      {/* Show skeleton loading while fetching games - Shows 2 rows */}
      {loading ? (
        <ContentSkeleton />
      ) : (
        <>
          {/* Exclusive Games Grid - Shows exactly 2 rows initially */}
          <div className="px-2 md:p-4">
            {displayedGames.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400 text-lg">No exclusive games available at the moment.</p>
              </div>
            ) : (
              <>
                {/* Grid layout - Mobile: 3 columns (2 rows = 6 games) */}
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2">
                  {displayedGames.map((game) => (
                    <div
                      key={game._id}
                      className="flex flex-col items-center rounded-[8px] overflow-hidden transition-all cursor-pointer relative group hover:border-theme_color hover:shadow-lg hover:shadow-theme_color/20"
                      onClick={() => handleGameClick(game)}
                    >
                      <div className="game-image-container">
                        <img
                          src={`${base_url}/${game.portraitImage || game.image || ''}`}
                          alt={game.name}
                          className="game-image transition-transform duration-300 group-hover:scale-110"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100x133/2A3254/ffffff?text=Game';
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Load More Button - Only shows if there are more games */}
                {hasMoreGames && (
                  <div className="flex justify-center mt-6">
                    <button
                      className="px-8 py-3 bg-theme_color hover:bg-theme_color/90 text-white text-sm font-medium rounded-[5px] transition-all transform hover:scale-105 active:scale-95 shadow-lg"
                      onClick={handleShowMore}
                    >
                      Load More
                    </button>
                  </div>
                )}

                {/* Show message when all games are loaded */}
                {!hasMoreGames && displayedGames.length > 0 && (
                  <div className="text-center mt-4">
                    <p className="text-gray-500 text-sm">
                      All {exclusiveGames.length} exclusive games loaded
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}

      {/* Login Popup */}
      {showLoginPopup && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-70 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
          <div className="popup-content bg-gradient-to-b cursor-pointer from-[#1a1a1a] to-[#0f0f0f] border border-[#333] rounded-lg p-6 max-w-md w-full relative">
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
              Please log in to play exclusive games. If you don't have an account, sign
              up for free!
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
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-[1000]">
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