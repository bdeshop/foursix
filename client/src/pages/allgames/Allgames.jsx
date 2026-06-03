import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import axios from 'axios';
import { Header } from '../../components/header/Header';
import Sidebar from '../../components/sidebar/Sidebar';
import Footer from '../../components/footer/Footer';
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import logo from "../../assets/logo.png";
import { IoSearchSharp, IoChevronDown, IoChevronUp, IoClose, IoHeart, IoHeartOutline } from "react-icons/io5";
import { MdFilterList, MdSort } from 'react-icons/md';
import { RiArrowLeftRightLine } from "react-icons/ri";
import favourite_img from "../../assets/favorite.png";

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
      <div className="w-full h-[175px] sm:h-[200px] md:h-[220px] bg-[#333]"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2a2a2a] to-transparent opacity-50 animate-shimmer"></div>
    </div>
  );
};

// Favorites Dropdown Component
const FavoritesDropdown = ({ user, favoritesList, onGameClick, onRemoveFavorite, isLoading }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center cursor-pointer text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors hover:bg-[#2a2a2a]"
          title="Login to view favorites"
        >
          <img src={favourite_img} alt="Favorites" className="w-5 h-5" />
        </button>
        {isOpen && (
          <div className="absolute top-full right-0 bg-[#222] border border-[#333] rounded-lg shadow-lg z-30 mt-1 overflow-hidden w-64">
            <div className="px-4 py-6 text-center">
              <img src={favourite_img} alt="Favorites" className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-gray-400 text-sm">Login to view your favorites</p>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="flex-1 px-3 py-2 bg-theme_color text-white text-sm rounded-md hover:bg-theme_color/90 transition-colors"
                >
                  Login
                </button>
                <button
                  onClick={() => window.location.href = '/register'}
                  className="flex-1 px-3 py-2 bg-[#333] text-white text-sm rounded-md hover:bg-[#444] transition-colors"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const favoriteGames = favoritesList.slice(0, 10);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center cursor-pointer text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors hover:bg-[#2a2a2a] relative"
        title="My Favorites"
      >
        <img src={favourite_img} alt="Favorites" className="w-5 h-5" />
        {favoritesList.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
            {favoritesList.length > 9 ? '9+' : favoritesList.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-30 mt-1 overflow-hidden w-80 sm:w-96">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] bg-[#222]">
            <h3 className="text-white font-semibold text-sm flex items-center gap-2">
              <img src={favourite_img} alt="Favorites" className="w-4 h-4" />
              My Favorites ({favoritesList.length})
            </h3>
            <button
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/favourites';
              }}
              className="text-xs text-theme_color hover:underline"
            >
              View All
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-12 h-12 bg-[#333] rounded"></div>
                    <div className="flex-1">
                      <div className="h-3 bg-[#333] rounded w-24 mb-2"></div>
                      <div className="h-2 bg-[#333] rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : favoritesList.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <img src={favourite_img} alt="No favorites" className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-gray-400 text-sm">No favorite games yet</p>
                <p className="text-gray-500 text-xs mt-1">Click the heart icon on any game to add it here</p>
              </div>
            ) : (
              favoriteGames.map((game) => (
                <div
                  key={game.id}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#2a2a2a] cursor-pointer transition-colors border-b border-[#333] last:border-b-0"
                  onClick={() => {
                    setIsOpen(false);
                    onGameClick(game);
                  }}
                >
                  <div className="w-12 h-12 rounded overflow-hidden bg-[#222] flex-shrink-0">
                    <img
                      src={game.portraitImage || game.image || logo}
                      alt={game.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = logo; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{game.name}</p>
                    <p className="text-gray-400 text-xs">{game.provider}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveFavorite(game.gameId, e);
                    }}
                    className="p-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                    title="Remove from favorites"
                  >
                    <IoHeart className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {favoritesList.length > 10 && (
            <div className="px-4 py-2 border-t border-[#333] bg-[#222]">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/favourites';
                }}
                className="w-full text-center text-theme_color text-sm py-2 hover:underline"
              >
                and {favoritesList.length - 10} more...
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main All Games Component
const AllGamesContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProviders, setSelectedProviders] = useState([]);
  const [selectedGameTypes, setSelectedGameTypes] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState(['all']);
  const [selectedSpecialFeatures, setSelectedSpecialFeatures] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [sortOption, setSortOption] = useState('default');
  const [visibleGamesCount, setVisibleGamesCount] = useState(16);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [allGames, setAllGames] = useState([]);
  const [games, setGames] = useState([]);
  const [providers, setProviders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [gameLoading, setGameLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showProvidersDropdown, setShowProvidersDropdown] = useState(true);
  const [showGameTypeDropdown, setShowGameTypeDropdown] = useState(true);
  const [showThemeDropdown, setShowThemeDropdown] = useState(true);
  const [showSpecialFeatureDropdown, setShowSpecialFeatureDropdown] = useState(true);
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const [providerGames, setProviderGames] = useState([]);
  const [isLoadingProviderGames, setIsLoadingProviderGames] = useState(false);
  
  // Favorite System States
  const [favorites, setFavorites] = useState(new Set());
  const [favoritesList, setFavoritesList] = useState([]);
  const [favoriteCounts, setFavoriteCounts] = useState({});
  const [isAddingFavorite, setIsAddingFavorite] = useState(false);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const searchRef = useRef(null);
  const categoryRef = useRef(null);
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

  // ==================== FAVORITE SYSTEM FUNCTIONS ====================
  
  // Fetch user's favorites with full game details
  const fetchUserFavorites = async () => {
    if (!user) return;
    
    setIsLoadingFavorites(true);
    
    try {
      const token = localStorage.getItem('usertoken');
      const response = await axios.get(`${base_url}/api/user/favorites`, {
        headers: { 'Authorization': `Bearer ${token}` },
        params: { limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }
      });
      
      if (response.data.success) {
        const favoriteIds = new Set(response.data.data.favorites.map(fav => fav.gameId));
        setFavorites(favoriteIds);
        setFavoritesList(response.data.data.favorites);
        
        // Fetch favorite counts for visible games
        const counts = {};
        for (const game of visibleGames) {
          try {
            const checkResponse = await axios.get(`${base_url}/api/user/favorites/check/${game._id}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (checkResponse.data.success) {
              counts[game._id] = checkResponse.data.data.favoriteCount;
            }
          } catch (err) {
            console.error("Error fetching favorite count:", err);
          }
        }
        setFavoriteCounts(prev => ({ ...prev, ...counts }));
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
    } finally {
      setIsLoadingFavorites(false);
    }
  };
  
  // Add game to favorites
  const addToFavorites = async (gameId, event) => {
    event.stopPropagation();
    
    if (!user) {
      setShowLoginPopup(true);
      return;
    }
    
    setIsAddingFavorite(true);
    
    try {
      const token = localStorage.getItem('usertoken');
      const response = await axios.post(`${base_url}/api/user/favorites/${gameId}`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFavorites(prev => new Set([...prev, gameId]));
        
        // Add to favorites list
        const game = games.find(g => g._id === gameId);
        if (game) {
          setFavoritesList(prev => [{
            id: response.data.data.id,
            gameId: gameId,
            name: game.name,
            provider: game.provider,
            portraitImage: game.portraitImage,
            image: game.image,
            category: game.category
          }, ...prev]);
        }
        
        toast.success("Added to favorites!");
        
        setFavoriteCounts(prev => ({
          ...prev,
          [gameId]: (prev[gameId] || 0) + 1
        }));
      }
    } catch (error) {
      console.error("Error adding to favorites:", error);
      if (error.response?.data?.message === "Game already in favorites") {
        toast.error("Game already in favorites");
      } else {
        toast.error("Failed to add to favorites");
      }
    } finally {
      setIsAddingFavorite(false);
    }
  };
  
  // Remove game from favorites
  const removeFromFavorites = async (gameId, event) => {
    if (event) event.stopPropagation();
    
    if (!user) {
      toast.error("Please login to manage favorites");
      setShowLoginPopup(true);
      return;
    }
    
    setIsAddingFavorite(true);
    
    try {
      const token = localStorage.getItem('usertoken');
      const response = await axios.delete(`${base_url}/api/user/favorites/${gameId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setFavorites(prev => {
          const newSet = new Set(prev);
          newSet.delete(gameId);
          return newSet;
        });
        
        // Remove from favorites list
        setFavoritesList(prev => prev.filter(fav => fav.gameId !== gameId));
        
        toast.success("Removed from favorites!");
        
        setFavoriteCounts(prev => ({
          ...prev,
          [gameId]: Math.max(0, (prev[gameId] || 1) - 1)
        }));
      }
    } catch (error) {
      console.error("Error removing from favorites:", error);
      toast.error("Failed to remove from favorites");
    } finally {
      setIsAddingFavorite(false);
    }
  };
  
  // Toggle favorite
  const toggleFavorite = (gameId, event, isFavorited) => {
    if (isFavorited) {
      removeFromFavorites(gameId, event);
    } else {
      addToFavorites(gameId, event);
    }
  };
  
  // Record that user played a favorite game
  const recordFavoritePlay = async (gameId) => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('usertoken');
      await axios.post(`${base_url}/api/user/favorites/${gameId}/play`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error("Error recording favorite play:", error);
    }
  };
  
  // Handle game click from favorites dropdown
  const handleFavoriteGameClick = (game) => {
    if (!user) {
      setShowLoginPopup(true);
      return;
    }
    
    // Find the full game object
    const fullGame = games.find(g => g._id === game.gameId);
    if (fullGame) {
      handleOpenGame(fullGame);
    } else {
      // If game not found in current list, navigate using gameId
      navigate(`/game/${game.gameApiID || game.gameId}?provider=${encodeURIComponent(game.provider || '')}&category=slots`);
    }
  };

  // Fetch games by provider
  const fetchGamesByProvider = async (providerName) => {
    try {
      setIsLoadingProviderGames(true);
      setIsLoading(true);
      
      const decodedProvider = decodeURIComponent(providerName);
      console.log("Fetching games for provider:", decodedProvider);
      
      const response = await axios.get(`${base_url}/api/games/by-provider/${encodeURIComponent(decodedProvider)}`);
      
      if (response.data.success) {
        setProviderGames(response.data.data);
        setAllGames(response.data.data);
        setGames(response.data.data);
        setFilteredGames(response.data.data);
        setProviders(extractUniqueProviders(response.data.data));
        setSelectedProviders([decodedProvider.toLowerCase()]);
      } else {
        await fetchAllGamesWithProviderFilter(decodedProvider);
      }
    } catch (error) {
      console.error('Error fetching games by provider:', error);
      toast.error('Error loading provider games');
      await fetchAllGamesWithProviderFilter(decodeURIComponent(providerName));
    } finally {
      setIsLoading(false);
      setIsLoadingProviderGames(false);
    }
  };

  // Fallback method: fetch all games and filter by provider
  const fetchAllGamesWithProviderFilter = async (providerName) => {
    try {
      const response = await axios.get(`${base_url}/api/all-games`);
      if (response.data.success) {
        const allGamesData = response.data.data;
        const filteredByProvider = allGamesData.filter(game => 
          game.provider?.toLowerCase() === providerName.toLowerCase()
        );
        
        setProviderGames(filteredByProvider);
        setAllGames(filteredByProvider);
        setGames(filteredByProvider);
        setFilteredGames(filteredByProvider);
        setProviders(extractUniqueProviders(filteredByProvider));
        setSelectedProviders([providerName.toLowerCase()]);
      }
    } catch (error) {
      console.error('Error in fallback provider fetch:', error);
    }
  };

  // Check for provider query parameter
  useEffect(() => {
    const providerFromQuery = searchParams.get('provider');
    if (providerFromQuery) {
      fetchGamesByProvider(providerFromQuery);
    } else {
      fetchCategories();
      fetchAllGames();
    }
  }, [searchParams]);

  // Fetch favorites when user changes and games are loaded
  useEffect(() => {
    if (user && filteredGames.length > 0) {
      fetchUserFavorites();
    }
  }, [user, filteredGames.length]);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!searchParams.get('provider')) {
      fetchBrandingData();
    }
  }, []);

  useEffect(() => {
    if (allGames.length > 0 && categories.length > 0 && !searchParams.get('provider')) {
      handleCategoryFilter();
    }
  }, [selectedCategory, allGames, categories]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowLoginPopup(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
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

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${base_url}/api/categories`);
      if (response.data.success) {
        const categoriesData = response.data.data.map(cat => ({
          name: cat.name,
          value: cat.name.toLowerCase(),
          icon: getCategoryIcon(cat.name),
          image: cat.image
        }));
        setCategories([
          { name: "All Categories", value: "all", icon: "fas fa-list", image: null },
          ...categoriesData
        ]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchAllGames = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${base_url}/api/all-games`);
      console.log(response);
      if (response.data.success) {
        setAllGames(response.data.data);
        setGames(response.data.data);
        setFilteredGames(response.data.data);
        setProviders(extractUniqueProviders(response.data.data));
      }
    } catch (error) {
      console.error('Error fetching all games:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryFilter = () => {
    let filtered = allGames;
    if (selectedCategory !== 'all') {
      filtered = allGames.filter(game => {
        if (Array.isArray(game.category)) {
          return game.category.some(cat => cat.toLowerCase() === selectedCategory);
        }
        return game.category?.toLowerCase() === selectedCategory;
      });
    }
    setGames(filtered);
    setFilteredGames(filtered);
    setProviders(extractUniqueProviders(filtered));
    setVisibleGamesCount(21);
  };

  const extractUniqueProviders = (gamesList) => {
    const uniqueProviders = [...new Set(gamesList.map(game => game.provider).filter(Boolean))];
    return [
      { name: "All Providers", value: "all", icon: "fas fa-grid" },
      ...uniqueProviders.map(provider => ({
        name: provider,
        value: provider.toLowerCase(),
        icon: getProviderIcon(provider)
      }))
    ];
  };

  const getCategoryIcon = (categoryName) => {
    switch (categoryName.toLowerCase()) {
      case 'live':
      case 'live casino':
        return 'fas fa-video';
      case 'table':
      case 'table games':
        return 'fas fa-chess-board';
      case 'slots':
        return 'fas fa-sliders-h';
      case 'crash':
        return 'fas fa-chart-line';
      default:
        return 'fas fa-list';
    }
  };

  const getProviderIcon = (providerName) => {
    switch (providerName?.toLowerCase()) {
      case 'evolution':
        return 'fas fa-play-circle';
      case 'pragmatic play':
        return 'fas fa-dice';
      case 'playtech':
        return 'fas fa-gamepad';
      case 'netent':
        return 'fas fa-star';
      case 'microgaming':
        return 'fas fa-crown';
      case 'amigo':
        return 'fas fa-crown';
      default:
        return 'fas fa-puzzle-piece';
    }
  };

  const toggleProvider = (value) => {
    setSelectedProviders(prev => {
      if (value === 'all') {
        return ['all'];
      }
      const newSelection = prev.includes(value) 
        ? prev.filter(p => p !== value) 
        : [...prev.filter(p => p !== 'all'), value];
      
      return newSelection.length === 0 ? ['all'] : newSelection;
    });
  };

  const toggleGameType = (type, checked) => {
    if (checked) {
      setSelectedGameTypes(prev => [...prev, type]);
    } else {
      setSelectedGameTypes(prev => prev.filter(t => t !== type));
    }
  };

  const toggleTheme = (theme, checked) => {
    if (checked) {
      setSelectedThemes(prev => [...prev, theme]);
    } else {
      setSelectedThemes(prev => prev.filter(t => t !== theme));
    }
  };

  const toggleSpecialFeature = (feature, checked) => {
    if (checked) {
      setSelectedSpecialFeatures(prev => [...prev, feature]);
    } else {
      setSelectedSpecialFeatures(prev => prev.filter(f => f !== feature));
    }
  };

  const handleSortChange = (option) => {
    setSortOption(option);
    setShowSortDropdown(false);
  };

  useEffect(() => {
    let filtered = [...allGames];
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(game => {
        if (Array.isArray(game.category)) {
          return game.category.some(cat => cat.toLowerCase() === selectedCategory);
        }
        return game.category?.toLowerCase() === selectedCategory;
      });
    }
    
    if (searchTerm) {
      filtered = filtered.filter(game => 
        game.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedProviders.length > 0 && !selectedProviders.includes('all')) {
      filtered = filtered.filter(game => 
        selectedProviders.includes(game.provider?.toLowerCase())
      );
    }
    
    if (selectedGameTypes.length > 0) {
      filtered = filtered.filter(game => 
        selectedGameTypes.includes(game.type?.toLowerCase() || '')
      );
    }

    if (selectedThemes.length > 0 && !selectedThemes.includes('all')) {
      filtered = filtered.filter(game => 
        selectedThemes.includes(game.theme?.toLowerCase() || '')
      );
    }

    if (selectedSpecialFeatures.length > 0) {
      filtered = filtered.filter(game => 
        selectedSpecialFeatures.includes(game.specialFeature?.toLowerCase() || '')
      );
    }

    switch (sortOption) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      default:
        break;
    }
    
    setFilteredGames(filtered);
    setVisibleGamesCount(21);
  }, [
    searchTerm, 
    selectedProviders, 
    selectedGameTypes, 
    selectedThemes, 
    selectedSpecialFeatures, 
    sortOption, 
    allGames,
    selectedCategory
  ]);

  const visibleGames = filteredGames.slice(0, visibleGamesCount);
  const hasMoreGames = visibleGamesCount < filteredGames.length;
  const loadingProgress = Math.min(100, (visibleGamesCount / filteredGames.length) * 100);

  const loadMoreGames = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleGamesCount(prevCount => prevCount + 21);
      setIsLoadingMore(false);
    }, 800);
  };

  const gameNames = [...new Set(allGames.map(game => game.name))];
  const filteredSuggestions = gameNames.filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const getSelectedCategoryName = () => {
    if (selectedCategory === 'all') return "All Games";
    const category = categories.find(c => c.value === selectedCategory);
    return category ? category.name : "All Games";
  };

  const handleCategoryChange = (categoryValue) => {
    setSelectedCategory(categoryValue);
    setShowCategoryDropdown(false);
  };

  const clearAllFilters = () => {
    setSelectedProviders(['all']);
    setSelectedGameTypes([]);
    setSelectedThemes(['all']);
    setSelectedSpecialFeatures([]);
    setSortOption('default');
    setSelectedCategory('all');
    setSearchTerm('');
  };

  const applyFilters = () => {
    setShowFilterSidebar(false);
  };

  const handleGameClick = (game) => {
    setSelectedGame(game);
    console.log("Game clicked:", game);
    
    if (!user) {
      setShowLoginPopup(true);
      return;
    }
    handleOpenGame(game);
  };

  const handleOpenGame = async (game) => {
    console.log("Attempting to open game:", game);

    if (!user) {
      toast.error("Please login to play games");
      setShowLoginPopup(true);
      return;
    }

    try {
      setGameLoading(true);

      const gameId = game.gameId || game.gameApiID;

      console.log("Game ID:", gameId);

      const response = await fetch(`${base_url}/api/games/${gameId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch game with ID ${gameId}`);
      }

      const gameData = await response.json();
      if (!gameData.success) {
        throw new Error(`Failed to fetch game with ID ${gameId}`);
      }

      // Record play in favorites if the game is favorited
      if (favorites.has(game._id)) {
        await recordFavoritePlay(game._id);
      }

      let categoryValue = 'slots';
      if (game.category) {
        if (Array.isArray(game.category)) {
          categoryValue = game.category[0] || 'slots';
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

  const getProviderDisplayName = () => {
    const provider = searchParams.get('provider');
    return provider ? decodeURIComponent(provider) : null;
  };

  const providerDisplayName = getProviderDisplayName();

  return (
    <div className="h-screen overflow-hidden font-poppins bg-[#141515] text-white">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <Toaster />

      <div className="flex h-[calc(100vh-56px)]">
        <Sidebar sidebarOpen={sidebarOpen} />

        <div className={`flex-1 overflow-auto transition-all duration-300 ${isLoading ? 'opacity-50' : ''}`}>
          <div className='mx-auto pb-[100px] w-full max-w-screen-xl py-4 px-4 sm:px-6 md:px-8 lg:px-12'>

            <div className='flex justify-center md:justify-between items-center gap-2 sm:gap-3 w-full mb-4 sm:mb-6'>
              {!providerDisplayName && (
                <div className="w-full sm:w-auto relative" ref={categoryRef}>
                  <button 
                    className="flex w-full sm:w-auto items-center justify-start cursor-pointer text-white pr-4 py-2 sm:py-3 rounded-lg min-w-[180px] text-xs sm:text-sm transition-colors"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  >
                    <div className="flex items-center">
                      {categories.find(c => c.value === selectedCategory)?.image && (
                        <img 
                          src={getImageUrl({ portraitImage: categories.find(c => c.value === selectedCategory).image })}
                          alt="" 
                          className="w-6 h-6 object-cover rounded mr-2" 
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <i className={`${categories.find(c => c.value === selectedCategory)?.icon || "fas fa-list"} mr-2 text-yellow-500`}></i>
                      <span>{getSelectedCategoryName()}</span>
                    </div>
                    {showCategoryDropdown ? <IoChevronUp className="text-sm ml-2" /> : <IoChevronDown className="text-sm ml-2" />}
                  </button>
                  
                  {showCategoryDropdown && (
                    <div className="absolute top-full left-0 text-xs sm:text-sm right-0 bg-[#222] border border-[#333] rounded-lg shadow-lg z-[1000] mt-1 overflow-hidden">
                      {categories.map(category => (
                        <div 
                          key={category.value}
                          className={`px-4 py-3 cursor-pointer flex items-center transition-colors ${selectedCategory === category.value ? 'bg-opacity-10 text-theme_color' : 'hover:bg-[#2a2a2a]'}`}
                          onClick={() => handleCategoryChange(category.value)}
                        >
                          {category.image && (
                            <img 
                              src={getImageUrl({ portraitImage: category.image })} 
                              alt="" 
                              className="mr-2 w-4 h-4 object-cover rounded" 
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <i className={`${category.icon} mr-2 ${selectedCategory === category.value ? 'text-theme_color' : 'text-gray-400'}`}></i>
                          {category.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {providerDisplayName && (
                <div className="w-full sm:w-auto">
                  <div className="flex items-center text-white">
                    <i className="fas fa-gamepad mr-2 text-yellow-500"></i>
                    <span className="text-sm sm:text-base font-medium">
                      {providerDisplayName} Games
                    </span>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                {/* Favorites Dropdown */}
                <FavoritesDropdown 
                  user={user}
                  favoritesList={favoritesList}
                  onGameClick={handleFavoriteGameClick}
                  onRemoveFavorite={removeFromFavorites}
                  isLoading={isLoadingFavorites}
                />
                
                <div className="relative">
                  <button 
                    className="flex items-center justify-center cursor-pointer text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors"
                    onClick={() => setShowFilterSidebar(true)}
                  >
                    <RiArrowLeftRightLine className="text-lg" />
                  </button>
                </div>
                <div className="relative" ref={sortRef}>
                  <button 
                    className="flex items-center justify-center cursor-pointer text-white px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors"
                    onClick={() => setShowSortDropdown(!showSortDropdown)}
                  >
                    <MdSort className="text-lg" />
                  </button>
                  {showSortDropdown && (
                    <div className="absolute top-full right-0 bg-[#222] border border-[#333] rounded-lg shadow-lg z-20 mt-1 overflow-hidden w-48">
                      <div 
                        className={`px-4 py-3 cursor-pointer text-sm transition-colors ${sortOption === 'default' ? 'bg-opacity-10 text-theme_color' : 'hover:bg-[#2a2a2a]'}`}
                        onClick={() => handleSortChange('default')}
                      >
                        Default
                      </div>
                      <div 
                        className={`px-4 py-3 cursor-pointer text-sm transition-colors ${sortOption === 'name-asc' ? 'bg-opacity-10 text-theme_color' : 'hover:bg-[#2a2a2a]'}`}
                        onClick={() => handleSortChange('name-asc')}
                      >
                        Name (A-Z)
                      </div>
                      <div 
                        className={`px-4 py-3 cursor-pointer text-sm transition-colors ${sortOption === 'name-desc' ? 'bg-opacity-10 text-theme_color' : 'hover:bg-[#2a2a2a]'}`}
                        onClick={() => handleSortChange('name-desc')}
                      >
                        Name (Z-A)
                      </div>
                      <div 
                        className={`px-4 py-3 cursor-pointer text-sm transition-colors ${sortOption === 'newest' ? 'bg-opacity-10 text-theme_color' : 'hover:bg-[#2a2a2a]'}`}
                        onClick={() => handleSortChange('newest')}
                      >
                        Newest
                      </div>
                      <div 
                        className={`px-4 py-3 cursor-pointer text-sm transition-colors ${sortOption === 'popularity' ? 'bg-opacity-10 text-theme_color' : 'hover:bg-[#2a2a2a]'}`}
                        onClick={() => handleSortChange('popularity')}
                      >
                        Most Popular
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex md:flex-row flex-col gap-4 mb-8 w-full">
              <div className="relative w-full" ref={searchRef}>
                <div className="relative">
                  <IoSearchSharp className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                  <input
                    type="text"
                    placeholder={providerDisplayName ? `Search ${providerDisplayName} games...` : "Search all games..."}
                    className="w-full pl-12 pr-4 py-3 bg-[#222] border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-theme_color focus:border-transparent transition-all duration-300 ease-in-out placeholder-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                  />
                </div>
                {showSuggestions && searchTerm && filteredSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-700 rounded-b-lg shadow-xl z-20 mt-2 overflow-hidden transform transition-all duration-200 ease-in-out">
                    {filteredSuggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0 transition-colors duration-150 flex items-center text-sm text-gray-200"
                        onClick={() => {
                          setSearchTerm(suggestion);
                          setShowSuggestions(false);
                        }}
                      >
                        <i className="fas fa-search text-gray-400 mr-3 text-xs"></i>
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {isLoading || isLoadingProviderGames ? (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
                {Array.from({ length: 21 }).map((_, index) => (
                  <SkeletonGameCard key={index} />
                ))}
              </div>
            ) : (
              visibleGames.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4">
                    {visibleGames.map(game => {
                      const imageUrl = getImageUrl(game);
                      const isFavorited = favorites.has(game._id);
                      const favoriteCount = favoriteCounts[game._id] || 0;
                      
                      return (
                        <div 
                          key={game._id} 
                          className="group relative bg-gradient-to-br from-[#1a1a1a] to-[#222] rounded-[3px] overflow-hidden transition-all duration-300 hover:-translate-y-2 cursor-pointer shadow-lg"
                          onClick={() => handleGameClick(game)}
                        >
                          <div className="allgames-game-image-container relative overflow-hidden w-full">
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
                            <div className="allgames-glow-sweep"></div>
                            
                            {game.featured && (
                              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-md z-10">
                                NEW
                              </div>
                            )}
                            
                            {/* Favorite Button */}
                            <button
                              onClick={(e) => toggleFavorite(game._id, e, isFavorited)}
                              disabled={isAddingFavorite}
                              className={`absolute top-2 left-2 z-20 p-2 rounded-full transition-all duration-200 ${
                                isFavorited 
                                  ? 'bg-red-500 text-white hover:bg-red-600' 
                                  : 'bg-black/50 text-gray-300 hover:text-red-500 hover:bg-black/70'
                              } ${isAddingFavorite ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {isFavorited ? (
                                <IoHeart className="w-3 h-3 sm:w-4 sm:h-4" />
                              ) : (
                                <IoHeartOutline className="w-3 h-3 sm:w-4 sm:h-4" />
                              )}
                            </button>
                            
                            {/* Favorite Count Badge */}
                            {favoriteCount > 0 && (
                              <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5 z-10">
                                <span className="text-white text-[10px] sm:text-xs flex items-center gap-1">
                                  <IoHeart className="w-2.5 h-2.5 text-red-400" />
                                  {favoriteCount}
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
                        <div 
                          className="bg-theme_color h-2.5 rounded-full transition-all duration-500" 
                          style={{ width: `${loadingProgress}%` }}
                        ></div>
                      </div>
                      <button
                        onClick={loadMoreGames}
                        disabled={isLoadingMore}
                        className="px-6 py-3 bg-theme_color text-[12px] sm:text-[14px] cursor-pointer text-white font-medium rounded-lg hover:bg-theme_color/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isLoadingMore ? (
                          <>
                            <i className="fas fa-spinner fa-spin mr-2"></i>
                            Loading...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-plus-circle mr-2"></i>
                            Load More Games
                          </>
                        )}
                      </button>
                      <p className="text-gray-400 text-xs sm:text-sm mt-2">
                        Showing {visibleGames.length} of {filteredGames.length} games
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <i className="fas fa-search text-4xl text-gray-500 mb-4"></i>
                  <h3 className="text-sm sm:text-lg font-semibold text-gray-300 mb-2">
                    {providerDisplayName ? `No games found for ${providerDisplayName}` : "No games found"}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">Try adjusting your search or filter criteria</p>
                </div>
              )
            )}
          </div>
          <Footer />
        </div>
      </div>

      {showFilterSidebar && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] z-40" onClick={() => setShowFilterSidebar(false)} />
      )}
      {showFilterSidebar && (
        <div ref={filterSidebarRef} className={`fixed pt-6 top-0 right-0 h-full ${isMobile ? 'left-0 w-full' : 'w-80'} bg-[#0f0f0f] z-50 shadow-lg overflow-y-auto flex flex-col`}>
          <div className="flex items-center justify-between pt-[60px] px-4 pb-3 border-b border-[#333]">
            <h2 className="text-lg font-[600] text-white">Filter</h2>
            {isMobile && (
              <button 
                onClick={() => setShowFilterSidebar(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <IoClose className="h-6 w-6" />
              </button>
            )}
          </div>
          
          <div className="flex-1 p-4">
            <div className="mb-4">
              <label 
                className="block text-sm font-medium mb-3 flex items-center justify-between cursor-pointer text-gray-300 hover:text-white transition-colors"
                onClick={() => setShowProvidersDropdown(!showProvidersDropdown)}
              >
                <span>Providers</span>
                <IoChevronDown className={`text-sm transition-transform duration-200 ${showProvidersDropdown ? 'rotate-180' : ''}`} />
              </label>
              {showProvidersDropdown && (
                <div className="mt-2 pl-4 max-h-48 overflow-y-auto space-y-3">
                  {providers.map(provider => (
                    <label key={provider.value} className="flex items-center cursor-pointer text-sm relative py-2 px-1 rounded transition-colors hover:bg-[#1a1a1a]">
                      <input 
                        type="checkbox" 
                        checked={selectedProviders.includes(provider.value)} 
                        onChange={() => toggleProvider(provider.value)} 
                        className="w-6 h-6 text-theme_color bg-[#222] border-2 border-gray-600 rounded focus:ring-theme_color cursor-pointer"
                      />
                      <div className="flex items-center ml-3">
                        <i className={`${provider.icon} mr-2 text-yellow-500 flex-shrink-0`}></i>
                        <span className="select-none text-gray-300">{provider.name}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-4">
              <label 
                className="block text-sm font-medium mb-3 flex items-center justify-between cursor-pointer text-gray-300 hover:text-white transition-colors"
                onClick={() => setShowGameTypeDropdown(!showGameTypeDropdown)}
              >
                <span>Game Type</span>
                <IoChevronDown className={`text-sm transition-transform duration-200 ${showGameTypeDropdown ? 'rotate-180' : ''}`} />
              </label>
              {showGameTypeDropdown && (
                <div className="mt-2 pl-4 space-y-3">
                  <label className="flex items-center cursor-pointer text-sm relative py-2 px-1 rounded transition-colors hover:bg-[#1a1a1a]">
                    <input 
                      type="checkbox" 
                      checked={selectedGameTypes.includes('hot games')} 
                      onChange={(e) => toggleGameType('hot games', e.target.checked)} 
                      className="w-6 h-6 text-theme_color bg-[#222] border-2 border-gray-600 rounded focus:ring-theme_color cursor-pointer"
                    />
                    <div className="flex items-center ml-3">
                      <span className="select-none text-gray-300">Hot Games</span>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer text-sm relative py-2 px-1 rounded transition-colors hover:bg-[#1a1a1a]">
                    <input 
                      type="checkbox" 
                      checked={selectedGameTypes.includes('new games')} 
                      onChange={(e) => toggleGameType('new games', e.target.checked)} 
                      className="w-6 h-6 text-theme_color bg-[#222] border-2 border-gray-600 rounded focus:ring-theme_color cursor-pointer"
                    />
                    <div className="flex items-center ml-3">
                      <span className="select-none text-gray-300">New Games</span>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label 
                className="block text-sm font-medium mb-3 flex items-center justify-between cursor-pointer text-gray-300 hover:text-white transition-colors"
                onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              >
                <span>Theme</span>
                <IoChevronDown className={`text-sm transition-transform duration-200 ${showThemeDropdown ? 'rotate-180' : ''}`} />
              </label>
              {showThemeDropdown && (
                <div className="mt-2 pl-4 space-y-3">
                  <label className="flex items-center cursor-pointer text-sm relative py-2 px-1 rounded transition-colors hover:bg-[#1a1a1a]">
                    <input 
                      type="checkbox" 
                      checked={selectedThemes.includes('all')} 
                      onChange={(e) => toggleTheme('all', e.target.checked)} 
                      className="w-6 h-6 text-theme_color bg-[#222] border-2 border-gray-600 rounded focus:ring-theme_color cursor-pointer"
                    />
                    <div className="flex items-center ml-3">
                      <span className="select-none text-gray-300">All</span>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer text-sm relative py-2 px-1 rounded transition-colors hover:bg-[#1a1a1a]">
                    <input 
                      type="checkbox" 
                      checked={selectedThemes.includes('lucky7')} 
                      onChange={(e) => toggleTheme('lucky7', e.target.checked)} 
                      className="w-6 h-6 text-theme_color bg-[#222] border-2 border-gray-600 rounded focus:ring-theme_color cursor-pointer"
                    />
                    <div className="flex items-center ml-3">
                      <span className="select-none text-gray-300">Lucky7</span>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer text-sm relative py-2 px-1 rounded transition-colors hover:bg-[#1a1a1a]">
                    <input 
                      type="checkbox" 
                      checked={selectedThemes.includes('monetary')} 
                      onChange={(e) => toggleTheme('monetary', e.target.checked)} 
                      className="w-6 h-6 text-theme_color bg-[#222] border-2 border-gray-600 rounded focus:ring-theme_color cursor-pointer"
                    />
                    <div className="flex items-center ml-3">
                      <span className="select-none text-gray-300">Monetary</span>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer text-sm relative py-2 px-1 rounded transition-colors hover:bg-[#1a1a1a]">
                    <input 
                      type="checkbox" 
                      checked={selectedThemes.includes('western')} 
                      onChange={(e) => toggleTheme('western', e.target.checked)} 
                      className="w-6 h-6 text-theme_color bg-[#222] border-2 border-gray-600 rounded focus:ring-theme_color cursor-pointer"
                    />
                    <div className="flex items-center ml-3">
                      <span className="select-none text-gray-300">Western</span>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer text-sm relative py-2 px-1 rounded transition-colors hover:bg-[#1a1a1a]">
                    <input 
                      type="checkbox" 
                      checked={selectedThemes.includes('egyptian')} 
                      onChange={(e) => toggleTheme('egyptian', e.target.checked)} 
                      className="w-6 h-6 text-theme_color bg-[#222] border-2 border-gray-600 rounded focus:ring-theme_color cursor-pointer"
                    />
                    <div className="flex items-center ml-3">
                      <span className="select-none text-gray-300">Egyptian</span>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer text-sm relative py-2 px-1 rounded transition-colors hover:bg-[#1a1a1a]">
                    <input 
                      type="checkbox" 
                      checked={selectedThemes.includes('mythology')} 
                      onChange={(e) => toggleTheme('mythology', e.target.checked)} 
                      className="w-6 h-6 text-theme_color bg-[#222] border-2 border-gray-600 rounded focus:ring-theme_color cursor-pointer"
                    />
                    <div className="flex items-center ml-3">
                      <span className="select-none text-gray-300">Mythology</span>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label 
                className="block text-sm font-medium mb-3 flex items-center justify-between cursor-pointer text-gray-300 hover:text-white transition-colors"
                onClick={() => setShowSpecialFeatureDropdown(!showSpecialFeatureDropdown)}
              >
                <span>Special Feature</span>
                <IoChevronDown className={`text-sm transition-transform duration-200 ${showSpecialFeatureDropdown ? 'rotate-180' : ''}`} />
              </label>
              {showSpecialFeatureDropdown && (
                <div className="mt-2 pl-4 space-y-3">
                  <label className="flex items-center cursor-pointer text-sm relative py-2 px-1 rounded transition-colors hover:bg-[#1a1a1a]">
                    <input 
                      type="checkbox" 
                      checked={selectedSpecialFeatures.includes('bonus games')} 
                      onChange={(e) => toggleSpecialFeature('bonus games', e.target.checked)} 
                      className="w-6 h-6 text-theme_color bg-[#222] border-2 border-gray-600 rounded focus:ring-theme_color cursor-pointer"
                    />
                    <div className="flex items-center ml-3">
                      <span className="select-none text-gray-300">Bonus Games</span>
                    </div>
                  </label>
                  <label className="flex items-center cursor-pointer text-sm relative py-2 px-1 rounded transition-colors hover:bg-[#1a1a1a]">
                    <input 
                      type="checkbox" 
                      checked={selectedSpecialFeatures.includes('buy feature')} 
                      onChange={(e) => toggleSpecialFeature('buy feature', e.target.checked)} 
                      className="w-6 h-6 text-theme_color bg-[#222] border-2 border-gray-600 rounded focus:ring-theme_color cursor-pointer"
                    />
                    <div className="flex items-center ml-3">
                      <span className="select-none text-gray-300">Buy Feature <span className="ml-1 text-xs text-gray-500">(bj)</span></span>
                    </div>
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-[#0f0f0f] p-4 border-t border-[#333] flex justify-between space-x-3">
            <button 
              onClick={clearAllFilters} 
              className="px-6 py-3 bg-[#222] border-[1px] text-nowrap border-gray-800 text-white rounded-[4px] text-[15px] cursor-pointer transition-all duration-200 flex-1 hover:bg-[#333] hover:border-gray-600"
            >
              Clear all
            </button>
            <button 
              onClick={applyFilters} 
              className="px-6 py-3 bg-theme_color text-nowrap text-white rounded-[4px] transition-all duration-200 text-[15px] cursor-pointer flex-1 hover:bg-theme_color/90 shadow-lg hover:shadow-theme_color/20"
            >
              Apply filters
            </button>
          </div>
        </div>
      )}

      {showLoginPopup && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.4)] bg-opacity-70 backdrop-blur-md flex items-center justify-center z-[10000] p-4">
          <div 
            ref={popupRef}
            className="bg-gradient-to-b cursor-pointer from-[#1a1a1a] to-[#0f0f0f] border border-[#333] rounded-lg p-6 max-w-md w-full relative"
          >
            <button 
              onClick={() => setShowLoginPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex justify-center mb-6">
              <img 
                src={dynamicLogo}
                alt="BJ Member Logo" 
                className="h-12"
                onError={(e) => {
                  e.target.src = logo;
                }}
              />
            </div>
            <p className="text-gray-300 text-xs sm:text-[15px] text-center mb-6">
              Please log in to play the game. If you don't have an account, sign up for free!
            </p>
            <div className="flex flex-col gap-3">
              <NavLink
                to="/register"
                onClick={handleRegisterFromPopup}
                className="bg-theme_color text-center hover:bg-theme_color/90 text-[14px] text-white font-medium py-3 px-4 rounded-md transition-colors"
              >
                Sign up
              </NavLink>
              <NavLink
                to="/login"
                onClick={handleLoginFromPopup}
                className="bg-[#333] text-center hover:bg-[#444] text-[14px] text-white font-medium py-3 px-4 rounded-md transition-colors"
              >
                Log in
              </NavLink>
            </div>
          </div>
        </div>
      )}

      {gameLoading && (
        <div className="fixed inset-0 bg-[rgba(0,0,0,0.7)] flex items-center justify-center z-[1000]">
          <div className="flex flex-col items-center">
            <div className="relative mb-8">
              <img 
                src={dynamicLogo} 
                alt="Loading..." 
                className="w-20 h-20 object-contain animate-pulse"
                onError={(e) => {
                  e.target.src = logo;
                }}
              />
              <div className="absolute -inset-4 border-4 border-theme_color border-t-transparent rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .allgames-game-image-container {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .allgames-glow-sweep {
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
          animation: allgamesSweepWide 5s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }

        @keyframes allgamesSweepWide {
          0%   { left: -250%; opacity: 0; }
          10%  { opacity: 1; }
          60%  { left: 150%; opacity: 1; }
          70%  { opacity: 0; }
          100% { left: 150%; opacity: 0; }
        }

        .group:nth-child(2n) .allgames-glow-sweep { animation-delay: 0.7s; }
        .group:nth-child(3n) .allgames-glow-sweep { animation-delay: 1.4s; }
        .group:nth-child(4n) .allgames-glow-sweep { animation-delay: 2.1s; }
        .group:nth-child(5n) .allgames-glow-sweep { animation-delay: 2.8s; }
        .group:nth-child(6n) .allgames-glow-sweep { animation-delay: 3.5s; }
        .group:nth-child(7n) .allgames-glow-sweep { animation-delay: 4.2s; }

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

const Allgames = () => {
  return (
    <AuthProvider>
      <AllGamesContent />
    </AuthProvider>
  );
};

export default Allgames;