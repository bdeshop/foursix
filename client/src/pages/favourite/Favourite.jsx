import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import axios from 'axios';
import { Header } from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import Footer from '../../components/footer/Footer';
import { NavLink, useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import logo from "../../assets/logo.png";
import { IoSearchSharp, IoChevronDown, IoChevronUp, IoClose, IoHeart, IoHeartOutline, IoTrashOutline } from "react-icons/io5";
import { MdFilterList, MdSort } from 'react-icons/md';
import { RiArrowLeftRightLine } from "react-icons/ri";

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
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('usertoken');
    
    if (!token) {
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
        setUser(data.data);
      } else {
        localStorage.removeItem('usertoken');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('usertoken');
    } finally {
      setLoading(false);
    }
  };

  const login = (token, userData) => {
    localStorage.setItem('usertoken', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('usertoken');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    checkAuthStatus,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Skeleton Game Card Component
const SkeletonGameCard = () => {
  return (
    <div className="relative bg-[#222] rounded-[3px] overflow-hidden shadow-lg animate-pulse">
      <div className="w-full h-[150px] xs:h-[180px] sm:h-[200px] md:h-[220px] bg-[#333]"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent opacity-50 animate-shimmer"></div>
    </div>
  );
};

// Empty Favorites Component
const EmptyFavorites = ({ onBrowseGames }) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-6">
        <IoHeartOutline className="w-12 h-12 text-gray-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">No Favorites Yet</h3>
      <p className="text-gray-500 mb-6 max-w-md">
        Start adding games to your favorites by clicking the heart icon on any game card.
      </p>
      <button
        onClick={onBrowseGames}
        className="px-6 py-3 bg-theme_color text-white font-medium rounded-lg hover:bg-theme_color/90 transition-colors"
      >
        Browse Games
      </button>
    </div>
  );
};

// Main Favorites Component
const FavoritesContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortOption, setSortOption] = useState('createdAt-desc');
  const [visibleGamesCount, setVisibleGamesCount] = useState(16);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [filteredFavorites, setFilteredFavorites] = useState([]);
  const [providers, setProviders] = useState([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [gameLoading, setGameLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showProvidersDropdown, setShowProvidersDropdown] = useState(true);
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const [isRemovingFavorite, setIsRemovingFavorite] = useState(false);
  const [selectedGamesForBulk, setSelectedGamesForBulk] = useState(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const searchRef = useRef(null);
  const popupRef = useRef(null);
  const filterSidebarRef = useRef(null);
  const sortRef = useRef(null);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // Helper function to get the correct image URL
  const getImageUrl = (game) => {
    if (!game) return logo;
    
    const imageField = game.portraitImage || game.image || game.coverImage || game.defaultImage;
    
    if (!imageField) return logo;
    
    if (imageField.startsWith('http://') || imageField.startsWith('https://')) {
      return imageField;
    }
    
    if (imageField.startsWith('/')) {
      return `${base_url}${imageField}`;
    }
    
    return `${base_url}/${imageField}`;
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

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const token = localStorage.getItem('usertoken');
      const response = await axios.get(`${base_url}/api/user/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { limit: 100, sortBy: 'customOrder', sortOrder: 'asc' }
      });
      
      if (response.data.success) {
        setFavorites(response.data.data.favorites);
        setFilteredFavorites(response.data.data.favorites);
        
        // Extract unique providers from favorites
        const uniqueProviders = [...new Set(response.data.data.favorites.map(fav => fav.provider))];
        setProviders([
          { name: "All Providers", value: "all", icon: "fas fa-grid" },
          ...uniqueProviders.map(provider => ({
            name: provider,
            value: provider.toLowerCase(),
            icon: getProviderIcon(provider)
          }))
        ]);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Failed to load favorites");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchBrandingData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    } else {
      setIsLoading(false);
      setShowLoginPopup(true);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowLoginPopup(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (filterSidebarRef.current && !filterSidebarRef.current.contains(event.target)) {
        setShowFilterSidebar(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter and sort favorites
  useEffect(() => {
    let filtered = [...favorites];
    
    if (searchTerm) {
      filtered = filtered.filter(fav => 
        fav.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedProviders.length > 0 && !selectedProviders.includes('all')) {
      filtered = filtered.filter(fav => 
        selectedProviders.includes(fav.provider.toLowerCase())
      );
    }

    // Apply sorting
    switch (sortOption) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'createdAt-desc':
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'createdAt-asc':
        filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'playCount-desc':
        filtered.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
        break;
      case 'lastPlayed-desc':
        filtered.sort((a, b) => {
          if (!a.lastPlayedAt) return 1;
          if (!b.lastPlayedAt) return -1;
          return new Date(b.lastPlayedAt) - new Date(a.lastPlayedAt);
        });
        break;
      default:
        break;
    }
    
    setFilteredFavorites(filtered);
    setVisibleGamesCount(16);
  }, [searchTerm, selectedProviders, sortOption, favorites]);

  const extractUniqueProviders = (gamesList) => {
    const uniqueProviders = [...new Set(gamesList.map(game => game.provider))];
    return [
      { name: "All Providers", value: "all", icon: "fas fa-grid" },
      ...uniqueProviders.map(provider => ({
        name: provider,
        value: provider.toLowerCase(),
        icon: getProviderIcon(provider)
      }))
    ];
  };

  const getProviderIcon = (providerName) => {
    switch (providerName?.toLowerCase()) {
      case 'evolution':
        return 'fas fa-play-circle';
      case 'pragmatic play':
        return 'fas fa-dice';
      case 'playtech':
        return 'fas fa-gamepad';
      case 'amigo':
        return 'fas fa-crown';
      default:
        return 'fas fa-puzzle-piece';
    }
  };

  const toggleProvider = (value) => {
    setSelectedProviders(prev => 
      prev.includes(value) ? prev.filter(p => p !== value) : [...prev, value]
    );
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    setShowSortDropdown(false);
  };

  const visibleGames = filteredFavorites.slice(0, visibleGamesCount);
  const hasMoreGames = visibleGamesCount < filteredFavorites.length;
  const loadingProgress = Math.min(100, (visibleGamesCount / filteredFavorites.length) * 100);

  const loadMoreGames = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleGamesCount(prevCount => prevCount + 16);
      setIsLoadingMore(false);
    }, 500);
  };

  const gameNames = [...new Set(favorites.map(game => game.name))];
  const filteredSuggestions = gameNames.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const clearAllFilters = () => {
    setSelectedProviders([]);
    setSortOption('createdAt-desc');
    setSearchTerm('');
  };

  const applyFilters = () => {
    setShowFilterSidebar(false);
  };

  // Remove a single favorite
  const removeFromFavorites = async (gameId, event) => {
    event.stopPropagation();
    
    if (!user) {
      toast.error("Please login to manage favorites");
      setShowLoginPopup(true);
      return;
    }
    
    setIsRemovingFavorite(true);
    
    try {
      const token = localStorage.getItem('usertoken');
      const response = await axios.delete(`${base_url}/api/user/favorites/${gameId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        // Remove from state
        setFavorites(prev => prev.filter(fav => fav.gameId !== gameId));
        toast.success("Removed from favorites!");
      }
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast.error("Failed to remove from favorites");
    } finally {
      setIsRemovingFavorite(false);
    }
  };

  // Bulk remove favorites
  const bulkRemoveFavorites = async () => {
    const gameIdsToRemove = Array.from(selectedGamesForBulk);
    
    if (gameIdsToRemove.length === 0) {
      toast.error("No games selected");
      return;
    }
    
    setIsRemovingFavorite(true);
    
    try {
      const token = localStorage.getItem('usertoken');
      const response = await axios.delete(`${base_url}/api/user/favorites/bulk/remove`, {
        headers: { 'Authorization': `Bearer ${token}` },
        data: { gameIds: gameIdsToRemove }
      });
      
      if (response.data.success) {
        setFavorites(prev => prev.filter(fav => !gameIdsToRemove.includes(fav.gameId)));
        setSelectedGamesForBulk(new Set());
        toast.success(`${response.data.data.deletedCount} favorites removed!`);
      }
    } catch (error) {
      console.error("Error bulk removing favorites:", error);
      toast.error("Failed to remove favorites");
    } finally {
      setIsRemovingFavorite(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  // Toggle game selection for bulk delete
  const toggleGameSelection = (gameId, event) => {
    event.stopPropagation();
    setSelectedGamesForBulk(prev => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  };

  // Select/Deselect all games
  const toggleSelectAll = () => {
    if (selectedGamesForBulk.size === visibleGames.length) {
      setSelectedGamesForBulk(new Set());
    } else {
      const allGameIds = visibleGames.map(game => game.gameId);
      setSelectedGamesForBulk(new Set(allGameIds));
    }
  };

  // Handle game click - navigate to play
  const handleGameClick = (game) => {
    if (!user) {
      setShowLoginPopup(true);
      return;
    }
    handleOpenGame(game);
  };

  // Handle opening the game
  const handleOpenGame = async (game) => {
    if (!user) {
      toast.error("Please login to play games");
      setShowLoginPopup(true);
      return;
    }

    try {
      setGameLoading(true);

      const gameId = game.gameApiID;

      const response = await fetch(`${base_url}/api/games/${gameId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch game with ID ${gameId}`);
      }

      const gameData = await response.json();
      if (!gameData.success) {
        throw new Error(`Failed to fetch game with ID ${gameId}`);
      }

      let categoryValue = 'casino';
      if (game.category) {
        if (Array.isArray(game.category)) {
          categoryValue = game.category[0] || 'casino';
        } else {
          categoryValue = game.category;
        }
      }

      navigate(`/game/${gameData?.data?.gameApiID}?provider=${encodeURIComponent(game.provider || '')}&category=${encodeURIComponent(categoryValue)}`);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Error connecting to game server");
    } finally {
      setGameLoading(false);
    }
  };

  const handleLoginFromPopup = () => {
    setShowLoginPopup(false);
    navigate('/login');
  };

  const handleRegisterFromPopup = () => {
    setShowLoginPopup(false);
    navigate('/register');
  };

  const handleBrowseGames = () => {
    navigate('/casino');
  };

  // Get sort option display text
  const getSortOptionText = () => {
    switch (sortOption) {
      case 'name-asc': return 'Name (A-Z)';
      case 'name-desc': return 'Name (Z-A)';
      case 'createdAt-desc': return 'Newest First';
      case 'createdAt-asc': return 'Oldest First';
      case 'playCount-desc': return 'Most Played';
      case 'lastPlayed-desc': return 'Recently Played';
      default: return 'Newest First';
    }
  };

  // Redirect to login if not authenticated
  if (!user && !isLoading) {
    return (
      <div className="h-screen overflow-hidden font-poppins bg-[#0f0f0f] text-white">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex h-[calc(100vh-56px)]">
          <Sidebar sidebarOpen={sidebarOpen} />
          <div className="flex-1 overflow-auto">
            <div className="mx-auto pb-[100px] w-full max-w-screen-xl py-4 px-4 sm:px-6 md:px-8 lg:px-12">
              <EmptyFavorites onBrowseGames={handleBrowseGames} />
            </div>
            <Footer />
          </div>
        </div>
        
        {showLoginPopup && (
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-70 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
            <div ref={popupRef} className="bg-gradient-to-b cursor-pointer from-[#1a1a1a] to-[#0f0f0f] border border-[#333] rounded-lg p-6 max-w-md w-full relative">
              <button onClick={() => setShowLoginPopup(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="flex justify-center mb-6">
                <img src={dynamicLogo} alt="Logo" className="h-12" onError={(e) => { e.target.src = logo; }} />
              </div>
              <p className="text-gray-300 text-xs sm:text-[15px] text-center mb-6">
                Please log in to view your favorites.
              </p>
              <div className="flex flex-col gap-3">
                <NavLink to="/register" onClick={handleRegisterFromPopup} className="bg-theme_color text-center hover:bg-theme_color/90 text-[14px] text-white font-medium py-3 px-4 rounded-md transition-colors">
                  Sign up
                </NavLink>
                <NavLink to="/login" onClick={handleLoginFromPopup} className="bg-[#333] text-center hover:bg-[#444] text-[14px] text-white font-medium py-3 px-4 rounded-md transition-colors">
                  Log in
                </NavLink>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden font-poppins bg-[#0f0f0f] text-white">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Toaster />

      <div className="flex h-[calc(100vh-56px)]">
        <Sidebar sidebarOpen={sidebarOpen} />

        <div className={`flex-1 overflow-auto transition-all duration-300 ${isLoading ? 'opacity-50' : ''}`}>
          <div className='mx-auto pb-[100px] w-full max-w-screen-xl py-4 px-4 sm:px-6 md:px-8 lg:px-12'>

            {/* Header Section */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Favorites</h1>
              <p className="text-gray-400 text-sm">
                {favorites.length} {favorites.length === 1 ? 'game' : 'games'} in your favorites list
              </p>
            </div>

            {/* Filter and Search Bar */}
            <div className='flex justify-between items-center gap-2 sm:gap-4 w-full mb-4 sm:mb-6'>
              <div className="flex gap-2">
                <div className="relative">
                  <button 
                    className="flex items-center justify-center cursor-pointer text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors bg-[#1a1a1a] hover:bg-[#222]"
                    onClick={() => setShowFilterSidebar(true)}
                  >
                    <RiArrowLeftRightLine className="text-lg mr-1" />
                    <span className="hidden sm:inline">Filter</span>
                  </button>
                </div>
          
              </div>
              
              <div className="relative w-full max-w-xs" ref={searchRef}>
                <div className="relative">
                  <IoSearchSharp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Search favorites..."
                    className="w-full pl-9 pr-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-theme_color focus:border-transparent placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                  />
                </div>
                {showSuggestions && searchTerm && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-b-lg shadow-xl z-20 mt-1 overflow-hidden">
                    {filteredSuggestions.map((suggestion, index) => (
                      <div key={index} className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-200" onClick={() => { setSearchTerm(suggestion); setShowSuggestions(false); }}>
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedGamesForBulk.size > 0 && (
              <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl p-3 flex items-center gap-4">
                <span className="text-white text-sm">{selectedGamesForBulk.size} selected</span>
                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {selectedGamesForBulk.size === visibleGames.length ? 'Deselect All' : 'Select All'}
                </button>
                <button onClick={() => setShowBulkDeleteConfirm(true)} className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1">
                  <IoTrashOutline className="w-4 h-4" />
                  Remove
                </button>
              </div>
            )}

            {/* Games Grid */}
            {isLoading ? (
              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
                {Array.from({ length: 16 }).map((_, index) => (
                  <SkeletonGameCard key={index} />
                ))}
              </div>
            ) : visibleGames.length > 0 ? (
              <>
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
                  {visibleGames.map(game => {
                    const imageUrl = getImageUrl(game);
                    const isSelected = selectedGamesForBulk.has(game.gameId);
                    
                    return (
                      <div 
                        key={game.id || game.gameId} 
                        className={`group relative bg-gradient-to-br from-[#1a1a1a] to-[#222] rounded-[3px] overflow-hidden transition-all duration-300 hover:-translate-y-2 cursor-pointer shadow-lg ${isSelected ? 'ring-2 ring-theme_color' : ''}`}
                        onClick={() => handleGameClick(game)}
                      >
                        {/* Selection Checkbox for Bulk Delete */}
                        <div className="absolute top-2 left-2 z-30">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleGameSelection(game.gameId, e)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 sm:w-5 sm:h-5 rounded border-gray-600 bg-black/50 text-theme_color focus:ring-theme_color cursor-pointer"
                          />
                        </div>

                        <div className="casino-game-image-container relative overflow-hidden w-full">
                          <div className="relative w-full pb-[133.33%] overflow-hidden bg-[#1a1a1a]">
                            <img 
                              src={imageUrl} 
                              alt={game.name} 
                              className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = logo;
                              }}
                            />
                          </div>

                          {/* Glow Sweep Animation */}
                          <div className="casino-glow-sweep"></div>
                          
                          {/* Remove Favorite Button */}
                          <button
                            onClick={(e) => removeFromFavorites(game.gameId, e)}
                            disabled={isRemovingFavorite}
                            className="absolute top-2 right-2 z-20 p-1.5 sm:p-2 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all duration-200"
                          >
                            <IoHeart className="w-3 h-3 sm:w-4 sm:h-4" />
                          </button>
                          
                          {/* Play Count Badge */}
                          {game.playCount > 0 && (
                            <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 z-10">
                              <span className="text-white text-[10px] sm:text-xs flex items-center gap-1">
                                <i className="fas fa-play text-[8px] sm:text-[10px]"></i>
                                {game.playCount}
                              </span>
                            </div>
                          )}
                          
                          {/* Game Name Overlay on Hover */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-10">
                            <p className="text-white text-xs font-medium truncate">{game.name}</p>
                            <p className="text-gray-300 text-[10px] truncate">{game.provider}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasMoreGames && (
                  <div className="mt-8 flex flex-col items-center">
                    <div className="w-full max-w-sm bg-[#222] rounded-full h-2.5 mb-4 overflow-hidden">
                      <div className="bg-theme_color h-2.5 rounded-full transition-all duration-500" style={{ width: `${loadingProgress}%` }}></div>
                    </div>
                    <button
                      onClick={loadMoreGames}
                      disabled={isLoadingMore}
                      className="px-6 py-3 bg-theme_color text-[12px] sm:text-[14px] cursor-pointer text-white font-medium rounded-lg hover:bg-theme_color/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isLoadingMore ? (
                        <><i className="fas fa-spinner fa-spin mr-2"></i>Loading...</>
                      ) : (
                        <><i className="fas fa-plus-circle mr-2"></i>Load More</>
                      )}
                    </button>
                    <p className="text-gray-400 text-xs sm:text-sm mt-2">
                      Showing {visibleGames.length} of {filteredFavorites.length} favorites
                    </p>
                  </div>
                )}
              </>
            ) : (
              <EmptyFavorites onBrowseGames={handleBrowseGames} />
            )}
          </div>
          <Footer />
        </div>
      </div>

      {/* Filter Sidebar */}
      {showFilterSidebar && (
        <>
          <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] z-40" onClick={() => setShowFilterSidebar(false)} />
          <div ref={filterSidebarRef} className={`fixed pt-6 top-0 right-0 h-full ${isMobile ? 'left-0 w-full' : 'w-80'} bg-[#0f0f0f] z-50 shadow-lg overflow-y-auto flex flex-col`}>
            <div className="flex items-center justify-between pt-[60px] px-4 pb-3 border-b border-[#333]">
              <h2 className="text-lg font-[600] text-white">Filter</h2>
              {isMobile && (
                <button onClick={() => setShowFilterSidebar(false)} className="text-gray-400 hover:text-white transition-colors">
                  <IoClose className="h-6 w-6" />
                </button>
              )}
            </div>
            
            <div className="flex-1 p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-3 flex items-center justify-between cursor-pointer text-gray-300 hover:text-white transition-colors" onClick={() => setShowProvidersDropdown(!showProvidersDropdown)}>
                  <span>Providers</span>
                  <IoChevronDown className={`text-sm transition-transform duration-200 ${showProvidersDropdown ? 'rotate-180' : ''}`} />
                </label>
                {showProvidersDropdown && (
                  <div className="mt-2 pl-4 max-h-48 overflow-y-auto space-y-3">
                    {providers.map(provider => (
                      <label key={provider.value} className="flex items-center cursor-pointer text-sm relative py-2 px-1 rounded transition-colors hover:bg-[#1a1a1a]">
                        <input type="checkbox" checked={selectedProviders.includes(provider.value)} onChange={() => toggleProvider(provider.value)} className="w-5 h-5 text-theme_color bg-[#222] border-2 border-gray-600 rounded focus:ring-theme_color cursor-pointer" />
                        <div className="flex items-center ml-3">
                          <i className={`${provider.icon} mr-2 text-yellow-500 flex-shrink-0`}></i>
                          <span className="select-none text-gray-300">{provider.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-[#0f0f0f] p-4 border-t border-[#333] flex justify-between space-x-3">
              <button onClick={clearAllFilters} className="px-6 py-3 bg-[#222] border-[1px] text-nowrap border-gray-800 text-white rounded-[4px] text-[15px] cursor-pointer transition-all duration-200 flex-1 hover:bg-[#333] hover:border-gray-600">
                Clear all
              </button>
              <button onClick={applyFilters} className="px-6 py-3 bg-theme_color text-nowrap text-white rounded-[4px] transition-all duration-200 text-[15px] cursor-pointer flex-1 hover:bg-theme_color/90 shadow-lg hover:shadow-theme_color/20">
                Apply filters
              </button>
            </div>
          </div>
        </>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-[10000] p-4">
          <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] border border-[#333] rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-white mb-3">Remove Favorites</h3>
            <p className="text-gray-300 text-sm mb-6">
              Are you sure you want to remove {selectedGamesForBulk.size} {selectedGamesForBulk.size === 1 ? 'game' : 'games'} from your favorites?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowBulkDeleteConfirm(false)} className="flex-1 px-4 py-2 bg-[#333] text-white rounded-md hover:bg-[#444] transition-colors">
                Cancel
              </button>
              <button onClick={bulkRemoveFavorites} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                Remove
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
              <img src={dynamicLogo} alt="Loading..." className="w-20 h-20 object-contain animate-pulse" onError={(e) => { e.target.src = logo; }} />
              <div className="absolute -inset-4 border-4 border-theme_color border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .casino-game-image-container {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .casino-glow-sweep {
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
          animation: casinoSweepWide 5s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes casinoSweepWide {
          0%   { left: -250%; opacity: 0; }
          10%  { opacity: 1; }
          60%  { left: 150%; opacity: 1; }
          70%  { opacity: 0; }
          100% { left: 150%; opacity: 0; }
        }

        .group:nth-child(2n) .casino-glow-sweep { animation-delay: 0.7s; }
        .group:nth-child(3n) .casino-glow-sweep { animation-delay: 1.4s; }
        .group:nth-child(4n) .casino-glow-sweep { animation-delay: 2.1s; }
        .group:nth-child(5n) .casino-glow-sweep { animation-delay: 2.8s; }
        .group:nth-child(6n) .casino-glow-sweep { animation-delay: 3.5s; }
        .group:nth-child(7n) .casino-glow-sweep { animation-delay: 4.2s; }

        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        ::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

const Favourite = () => {
  return (
    <AuthProvider>
      <FavoritesContent />
    </AuthProvider>
  );
};

export default Favourite;