import React, { useState, useEffect } from "react";
import { FaUpload, FaTimes, FaSpinner, FaFilter, FaGamepad, FaSearch, FaImage, FaEdit, FaCheck, FaPlusCircle, FaList, FaCheckCircle, FaRegCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { MdCategory, MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { toast } from "react-toastify";
import axios from "axios";

const Newgames = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const premium_api_key = import.meta.env.VITE_PREMIUM_API_KEY;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [localProviders, setLocalProviders] = useState([]); // Store local providers separately
  const [providers, setProviders] = useState([]); // Merged providers for display
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [gamesPerPage] = useState(30);
  const [paginatedGames, setPaginatedGames] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [useDefaultImage, setUseDefaultImage] = useState({});
  const [localGames, setLocalGames] = useState([]);
  const [editingGame, setEditingGame] = useState(null);

  // Selection states
  const [selectedGames, setSelectedGames] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [bulkActionMode, setBulkActionMode] = useState(false);

  // Bulk add states
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkGames, setBulkGames] = useState([]);
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkFeatured, setBulkFeatured] = useState(false);
  const [bulkStatus, setBulkStatus] = useState(true);
  const [bulkFullScreen, setBulkFullScreen] = useState(false);
  const [bulkUseDefaultImage, setBulkUseDefaultImage] = useState(true);
  const [bulkImage, setBulkImage] = useState(null);
  const [bulkImagePreview, setBulkImagePreview] = useState(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [currentAddingGame, setCurrentAddingGame] = useState("");

  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [savingGameId, setSavingGameId] = useState(null);
  const [updatingGameId, setUpdatingGameId] = useState(null);
  const [showProvidersDropdown, setShowProvidersDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);

  // Create axios instances
  const api = axios.create({
    baseURL: base_url,
    timeout: 30000,
    headers: { 'Content-Type': 'multipart/form-data', "Authorization": localStorage.getItem("adminToken") }
  });

  const oracleApi = axios.create({
    baseURL: "https://api.oraclegames.live/api",
    timeout: 30000,
    headers: {
      "x-api-key": "20afffdf-98c4-4de3-a16f-7d3f29cbd90e",
      "Content-Type": "application/json"
    }
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Custom Select Component
  const CustomSelect = ({ 
    options, 
    value, 
    onChange, 
    placeholder, 
    loading, 
    icon: Icon, 
    dropdownOpen, 
    setDropdownOpen,
    label,
    disabled = false
  }) => {
    const selectedOption = options.find(opt => opt._id === value || opt.value === value);
    
    const getDisplayName = (option) => {
      return option.providerName || option.name || option.label || option.providerCode || 'Unknown';
    };
    
    return (
      <div className="relative w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setDropdownOpen(!dropdownOpen)}
            disabled={loading || disabled}
            className={`w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex items-center justify-between transition-all duration-200 hover:border-orange-400 ${
              disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              {Icon && <Icon className="text-gray-400 text-lg" />}
              <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
                {loading ? `Loading ${placeholder}...` : 
                 selectedOption ? getDisplayName(selectedOption) : 
                 disabled ? 'Select a category first' : 
                 `Select ${placeholder}`}
              </span>
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {dropdownOpen && !disabled && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  {loading ? 'Loading...' : 'No providers available for this category'}
                </div>
              ) : (
                options.map((option) => (
                  <div
                    key={option._id || option.value}
                    onClick={() => {
                      onChange(option._id || option.value);
                      setDropdownOpen(false);
                    }}
                    className={`px-4 py-3 cursor-pointer flex items-center space-x-3 transition-colors duration-150 ${
                      value === (option._id || option.value)
                        ? 'bg-orange-50 text-orange-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {value === (option._id || option.value) ? (
                      <MdCheckBox className="text-orange-500 text-lg" />
                    ) : (
                      <MdCheckBoxOutlineBlank className="text-gray-400 text-lg" />
                    )}
                    <span>{getDisplayName(option)}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Custom Checkbox Component
  const CustomCheckbox = ({ id, checked, onChange, label, description }) => (
    <div className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors duration-150">
      <div className="relative flex items-center h-5 mt-0.5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="hidden"
        />
        <label htmlFor={id} className="cursor-pointer">
          <div className={`w-5 h-5 border-2 rounded-md flex items-center justify-center transition-all duration-200 ${
            checked 
              ? 'bg-orange-500 border-orange-500' 
              : 'bg-white border-gray-300 hover:border-orange-400'
          }`}>
            {checked && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </label>
      </div>
      <div className="flex-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer select-none">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  );

  // Search Component
  const SearchBar = () => (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <FaSearch className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          setCurrentPage(1);
        }}
        placeholder="Search games by name..."
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
      />
      {searchTerm && (
        <button
          onClick={() => {
            setSearchTerm("");
            setCurrentPage(1);
          }}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <FaTimes className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );

  // Pagination Component
  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];
      let l;

      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
          range.push(i);
        }
      }

      range.forEach((i) => {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      });

      return rangeWithDots;
    };

    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg border transition-all duration-200 ${
            currentPage === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : 'bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 border-gray-300'
          }`}
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`min-w-[40px] h-10 px-3 rounded-lg font-medium transition-all duration-200 ${
                page === currentPage
                  ? 'bg-orange-500 text-white shadow-md'
                  : page === '...'
                  ? 'cursor-default text-gray-600'
                  : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg border transition-all duration-200 ${
            currentPage === totalPages
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : 'bg-white text-gray-700 hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 border-gray-300'
          }`}
        >
          <FaChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  // Function to filter games based on search term
  const filterGamesBySearch = (gamesList, term) => {
    if (!term.trim()) return gamesList;
    
    const searchTermLower = term.toLowerCase();
    return gamesList.filter(game => 
      game.gameName?.toLowerCase().includes(searchTermLower) ||
      game.name?.toLowerCase().includes(searchTermLower) ||
      (game.provider?.providerName?.toLowerCase().includes(searchTermLower) || false)
    );
  };

  // Update paginated games when filtered games or current page changes
  useEffect(() => {
    const indexOfLastGame = currentPage * gamesPerPage;
    const indexOfFirstGame = indexOfLastGame - gamesPerPage;
    const currentGames = filteredGames.slice(indexOfFirstGame, indexOfLastGame);
    setPaginatedGames(currentGames);
    setTotalPages(Math.ceil(filteredGames.length / gamesPerPage));
  }, [filteredGames, currentPage, gamesPerPage]);

  // Reset select all when page changes
  useEffect(() => {
    const currentPageUnsavedGames = paginatedGames.filter(game => !game.isSaved);
    const currentPageSelectedCount = currentPageUnsavedGames.filter(game => selectedGames.has(game._id)).length;
    
    if (currentPageUnsavedGames.length > 0) {
      setSelectAll(currentPageSelectedCount === currentPageUnsavedGames.length);
    } else {
      setSelectAll(false);
    }
  }, [paginatedGames, selectedGames]);

  // Fetch categories from local API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await api.get('/api/admin/game-categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        if (error.response) {
          toast.error(`Failed to fetch categories: ${error.response.data.message || error.response.statusText}`);
        } else if (error.request) {
          toast.error('Failed to fetch categories: No response from server');
        } else {
          toast.error('Failed to fetch categories: ' + error.message);
        }
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch local providers
  useEffect(() => {
    const fetchLocalProviders = async () => {
      setLoadingProviders(true);
      try {
        const response = await api.get('/api/admin/game-providers');
        console.log("Local providers:", response.data);
        setLocalProviders(response.data);
      } catch (error) {
        console.error("Error fetching local providers:", error);
        toast.error("Failed to fetch local providers");
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchLocalProviders();
  }, []);

  // Filter local providers based on selected category
  useEffect(() => {
    if (selectedCategory && localProviders.length > 0 && categories.length > 0) {
      // Find the selected category object to get its name
      const selectedCategoryObj = categories.find(c => c._id === selectedCategory);
      
      if (selectedCategoryObj) {
        const categoryName = selectedCategoryObj.name?.toLowerCase();
        console.log("Selected category name:", categoryName);
        
        // Filter providers whose category matches the selected category name (case insensitive)
        const filtered = localProviders.filter(provider => {
          const providerCategory = provider.category?.toLowerCase();
          return providerCategory === categoryName;
        });
        
        console.log("Filtered local providers:", filtered);
        setFilteredProviders(filtered);
        
        // Clear selected provider if it's not in the filtered list
        if (selectedProvider) {
          const selectedProviderObj = filtered.find(p => p._id === selectedProvider);
          if (!selectedProviderObj) {
            setSelectedProvider("");
          }
        }
      }
    } else {
      setFilteredProviders([]);
      setSelectedProvider("");
    }
  }, [selectedCategory, localProviders, categories]);

  // Fetch and merge providers from Oracle API based on filtered local providers
  useEffect(() => {
    const fetchAndMergeProviders = async () => {
      if (filteredProviders.length === 0) {
        setProviders([]);
        return;
      }
      
      setLoadingProviders(true);
      try {
        const externalRes = await oracleApi.get('/providers');
        const externalProviders = externalRes.data.data || [];
        
        console.log("External providers:", externalProviders);
        
        // Create a map of filtered local providers by their codes/names for quick lookup
        const localProviderMap = new Map();
        filteredProviders.forEach(p => {
          // Store by multiple identifiers
          if (p.providercode) localProviderMap.set(p.providercode.toLowerCase(), p);
          if (p.name) localProviderMap.set(p.name.toLowerCase(), p);
          if (p.providerOracleID) localProviderMap.set(p.providerOracleID, p);
        });

        // Filter external providers that match our filtered local providers
        const mergedProviders = externalProviders.filter((p) => {
          const providerCode = p.providerCode?.toLowerCase();
          const providerName = p.providerName?.toLowerCase();
          const code = p.code?.toLowerCase();
          const id = p._id;
          
          return localProviderMap.has(providerCode) || 
                 localProviderMap.has(providerName) ||
                 localProviderMap.has(code) ||
                 localProviderMap.has(id);
        });

        console.log("Merged Providers:", mergedProviders);
        setProviders(mergedProviders);
      } catch (error) {
        console.error("Error fetching and merging providers:", error);
        if (error.response) {
          toast.error(`Failed to fetch providers: ${error.response.data.message || error.response.statusText}`);
        } else if (error.request) {
          toast.error('Failed to fetch providers: No response from server');
        } else {
          toast.error('Failed to fetch providers: ' + error.message);
        }
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchAndMergeProviders();
  }, [filteredProviders]);

  // Function to fetch all games from local database
  const fetchAllLocalGames = async () => {
    try {
      const response = await api.get('/api/admin/games/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching local games:', error);
      if (error.response) {
        toast.error(`Failed to fetch local games: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        toast.error('Failed to fetch local games: No response from server');
      } else {
        toast.error('Failed to fetch local games: ' + error.message);
      }
      return [];
    }
  };

  // Fetch local games on component mount
  useEffect(() => {
    const fetchLocalGames = async () => {
      const games = await fetchAllLocalGames();
      setLocalGames(games);
    };
    fetchLocalGames();
  }, []);

  // Fetch games based on selected provider
  useEffect(() => {
    if (!selectedProvider) {
      setGames([]);
      setFilteredGames([]);
      setSearchTerm("");
      setCurrentPage(1);
      return;
    }

    const fetchAndFilterGames = async () => {
      setLoadingGames(true);
      setSearchTerm("");
      setUseDefaultImage({});
      setEditingGame(null);
      setSelectedGames(new Set());
      setSelectAll(false);
      setCurrentPage(1);
      
      try {
        const selectedProviderObj = providers.find(p => p._id === selectedProvider || p.value === selectedProvider);
        const providerCode = selectedProviderObj?.providerCode || selectedProviderObj?.code;
        
        if (!providerCode) {
          toast.error("Invalid provider selection");
          return;
        }

        const oracleGamesRes = await oracleApi.get('/games?page=1&limit=5000');
        const oracleGamesData = oracleGamesRes.data;
        
        // Fetch latest local games
        const localGamesList = await fetchAllLocalGames();
        setLocalGames(localGamesList);
        
        // Create a map of existing games by game code
        const existingGamesMap = new Map();
        localGamesList.forEach(game => {
          const gameCode = game.game_code || game.gameCode || game.gameApiID;
          if (gameCode) {
            existingGamesMap.set(gameCode, game);
          }
        });

        // Get all games from the selected provider (both new and existing)
        const providerGames = oracleGamesData.data.filter(
          (game) => {
            const gameProviderCode = game.provider?.provider_code || game.provider?.code;
            return gameProviderCode === providerCode;
          }
        );

        // Transform the games for our UI
        const transformedGames = providerGames.map((externalGame) => {
          const gameCode = externalGame.game_code || externalGame.code;
          
          const existingGame = localGamesList.find(g => 
            g.game_code === gameCode || g.gameApiID === gameCode
          );
          
          const uniqueId = gameCode;
          return {
            ...externalGame,
            _id: uniqueId,
            game_uuid: externalGame._id,
            name: externalGame.gameName || externalGame.name,
            gameCode: gameCode,
            provider: externalGame.provider,
            coverImage: externalGame.image,
            isSaved: !!existingGame,
            existingGameData: existingGame,
            localFeatured: existingGame?.featured || false,
            localStatus: existingGame?.status ?? true,
            localFullScreen: existingGame?.fullScreen || false,
            localCategory: existingGame?.category || selectedCategory || "",
            localPortraitImage: null,
            localPortraitPreview: null,
            localLandscapeImage: null,
            localLandscapePreview: null,
            useDefaultImage: true,
          };
        });

        setGames(transformedGames);
        setFilteredGames(transformedGames);
        
        const defaultImageState = {};
        transformedGames.forEach(game => {
          defaultImageState[game._id] = true;
        });
        setUseDefaultImage(defaultImageState);
        
      } catch (error) {
        console.error("Error fetching and filtering games:", error);
        if (error.response) {
          toast.error(`Failed to fetch games: ${error.response.data.message || error.response.statusText}`);
        } else if (error.request) {
          toast.error('Failed to fetch games: No response from server');
        } else {
          toast.error('Failed to fetch games: ' + error.message);
        }
      } finally {
        setLoadingGames(false);
      }
    };

    if (selectedProvider) {
      fetchAndFilterGames();
    }
  }, [selectedProvider, providers, selectedCategory]);

  // Apply search filter whenever games or search term changes
  useEffect(() => {
    const searchFiltered = filterGamesBySearch(games, searchTerm);
    setFilteredGames(searchFiltered);
    setSelectedGames(new Set());
    setSelectAll(false);
    setCurrentPage(1);
  }, [games, searchTerm]);

  // Update category for all games when selected category changes
  useEffect(() => {
    if (selectedCategory) {
      setGames(prevGames => 
        prevGames.map(game => ({
          ...game,
          localCategory: selectedCategory
        }))
      );
    }
  }, [selectedCategory]);

  // Selection handlers
  const toggleGameSelection = (gameId) => {
    const newSelected = new Set(selectedGames);
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId);
    } else {
      newSelected.add(gameId);
    }
    setSelectedGames(newSelected);
    
    const currentPageUnsavedGames = paginatedGames.filter(game => !game.isSaved);
    const currentPageSelectedCount = currentPageUnsavedGames.filter(game => newSelected.has(game._id)).length;
    setSelectAll(currentPageSelectedCount === currentPageUnsavedGames.length && currentPageUnsavedGames.length > 0);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      const newSelected = new Set(selectedGames);
      paginatedGames.forEach(game => {
        if (!game.isSaved) {
          newSelected.delete(game._id);
        }
      });
      setSelectedGames(newSelected);
      setSelectAll(false);
    } else {
      const newSelected = new Set(selectedGames);
      paginatedGames.forEach(game => {
        if (!game.isSaved) {
          newSelected.add(game._id);
        }
      });
      setSelectedGames(newSelected);
      setSelectAll(true);
    }
  };

  const clearSelections = () => {
    setSelectedGames(new Set());
    setSelectAll(false);
  };

  const handleBulkAction = () => {
    if (selectedGames.size === 0) {
      toast.error("Please select at least one game to add");
      return;
    }

    const selectedGamesList = filteredGames.filter(game => selectedGames.has(game._id) && !game.isSaved);
    
    if (selectedGamesList.length === 0) {
      toast.error("Selected games are already saved");
      clearSelections();
      return;
    }

    setBulkGames(selectedGamesList);
    setBulkCategory(selectedCategory);
    setShowBulkModal(true);
    setBulkImage(null);
    setBulkImagePreview(null);
    setBulkUseDefaultImage(true);
    setBulkActionMode(true);
  };

  const handleGameDataChange = (gameId, field, value) => {
    setGames((prevGames) =>
      prevGames.map((game) =>
        game._id === gameId ? { ...game, [field]: value } : game
      )
    );
  };

  const handleImageUpload = (gameId, file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setGames((prevGames) =>
        prevGames.map((game) => {
          if (game._id === gameId) {
            return {
              ...game,
              localPortraitImage: file,
              localPortraitPreview: reader.result,
              localLandscapeImage: file,
              localLandscapePreview: reader.result,
            };
          }
          return game;
        })
      );
      
      setUseDefaultImage(prev => ({
        ...prev,
        [gameId]: false
      }));
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (gameId) => {
    setGames((prevGames) =>
      prevGames.map((game) => {
        if (game._id === gameId) {
          return {
            ...game,
            localPortraitImage: null,
            localPortraitPreview: null,
            localLandscapeImage: null,
            localLandscapePreview: null,
          };
        }
        return game;
      })
    );
    
    setUseDefaultImage(prev => ({
      ...prev,
      [gameId]: true
    }));
  };

  const toggleUseDefaultImage = (gameId) => {
    setUseDefaultImage(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }));
    
    if (!useDefaultImage[gameId]) {
      setGames((prevGames) =>
        prevGames.map((game) => {
          if (game._id === gameId) {
            return {
              ...game,
              localPortraitImage: null,
              localPortraitPreview: null,
              localLandscapeImage: null,
              localLandscapePreview: null,
            };
          }
          return game;
        })
      );
    }
  };

  const handleEditGame = (game) => {
    setEditingGame(game._id);
    setTimeout(() => {
      document.getElementById(`game-${game._id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleCancelEdit = () => {
    setEditingGame(null);
  };

  const handleSaveOrUpdateGame = async (gameId) => {
    const gameToSave = games.find((g) => g._id === gameId);
    
    if (!gameToSave.localCategory) {
      toast.error("Please select a category for the game.");
      return;
    }
console.log("gameToSave",gameToSave)
    const isUsingDefaultImage = useDefaultImage[gameId];
    
    if (!isUsingDefaultImage && !gameToSave.localPortraitImage) {
      toast.error("Please upload an image or use the default image.");
      return;
    }

    const isUpdate = gameToSave.isSaved;
    
    if (isUpdate) {
      setUpdatingGameId(gameId);
    } else {
      setSavingGameId(gameId);
    }

    try {
      const formData = new FormData();
      formData.append("gameApiID", gameToSave.game_code);
      formData.append("name", gameToSave.gameName || gameToSave.name);
      formData.append("provider", gameToSave.provider?.provider_code);
      
      const selectedCat = categories.find(cat => 
        cat._id === gameToSave.localCategory || cat.name === gameToSave.localCategory
      );
      
      if (selectedCat) {
        formData.append("category", selectedCat.name);
      } else {
        formData.append("category", gameToSave.localCategory || "");
      }
      
      formData.append("featured", gameToSave.localFeatured);
      formData.append("status", gameToSave.localStatus);
      formData.append("fullScreen", gameToSave.localFullScreen);
      
      if (isUsingDefaultImage) {
        const defaultImageUrl = gameToSave.image || gameToSave.coverImage;
        if (defaultImageUrl) {
          formData.append("defaultImage", defaultImageUrl);
          formData.append("portraitImage", defaultImageUrl);
          formData.append("landscapeImage", defaultImageUrl);
        } else {
          toast.error("No default image available for this game.");
          if (isUpdate) {
            setUpdatingGameId(null);
          } else {
            setSavingGameId(null);
          }
          return;
        }
      } else {
        if (gameToSave.localPortraitImage) {
          formData.append("portraitImage", gameToSave.localPortraitImage);
          formData.append("landscapeImage", gameToSave.localPortraitImage);
        }
      }

      const url = isUpdate 
        ? `/api/admin/games/${gameToSave.existingGameData?._id || gameId}`
        : '/api/admin/games';
      
      let response;
      if (isUpdate) {
        response = await api.put(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await api.post(url, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      console.log("response", response);
      
      if (response.status === 200 || response.status === 201) {
        toast.success(`Game "${gameToSave.gameName || gameToSave.name}" ${isUpdate ? 'updated' : 'added'} successfully!`);
        
        setGames(prevGames => 
          prevGames.map(game => {
            if (game._id === gameId) {
              return {
                ...game,
                isSaved: true,
                existingGameData: response.data.game || game.existingGameData,
                localPortraitImage: null,
                localPortraitPreview: null,
              };
            }
            return game;
          })
        );
        
        const updatedLocalGames = await fetchAllLocalGames();
        setLocalGames(updatedLocalGames);
        
        setEditingGame(null);
      } else {
        toast.error(`❌ Failed to ${isUpdate ? 'update' : 'add'} game.`);
      }
    } catch (error) {
      console.error(`Error ${isUpdate ? 'updating' : 'saving'} game:`, error);
      if (error.response) {
        toast.error(`❌ ${error.response.data.error || error.response.data.message || `Failed to ${isUpdate ? 'update' : 'add'} game.`}`);
      } else if (error.request) {
        toast.error(`❌ No response from server while ${isUpdate ? 'updating' : 'saving'} game.`);
      } else {
        toast.error(`❌ ${error.message}`);
      }
    } finally {
      setSavingGameId(null);
      setUpdatingGameId(null);
    }
  };

  // Bulk Add Functions
  const openBulkModal = () => {
    if (!selectedProvider) {
      toast.error("Please select a provider first");
      return;
    }
    
    if (!selectedCategory) {
      toast.error("Please select a default category first");
      return;
    }

    const unsavedGames = filteredGames.filter(game => !game.isSaved);
    
    if (unsavedGames.length === 0) {
      toast.info("No unsaved games available for bulk add");
      return;
    }

    setBulkGames(unsavedGames);
    setBulkCategory(selectedCategory);
    setShowBulkModal(true);
    setBulkImage(null);
    setBulkImagePreview(null);
    setBulkUseDefaultImage(true);
    setBulkActionMode(false);
  };

  const handleBulkImageUpload = (file) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size should be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setBulkImage(file);
      setBulkImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeBulkImage = () => {
    setBulkImage(null);
    setBulkImagePreview(null);
  };

  const handleBulkAdd = async () => {
    if (!bulkCategory) {
      toast.error("Please select a category for bulk add");
      return;
    }

    if (!bulkUseDefaultImage && !bulkImage) {
      toast.error("Please upload an image or use default images");
      return;
    }

    setBulkSaving(true);
    setBulkProgress({ current: 0, total: bulkGames.length });
    setCurrentAddingGame("");

    const results = {
      successful: [],
      failed: []
    };

    try {
      // Filter valid games if using default images
      let validGames = bulkGames;
      if (bulkUseDefaultImage) {
        validGames = bulkGames.filter(game => game.image || game.coverImage);
        if (validGames.length === 0) {
          toast.error("No valid games to add. Selected games are missing default images.");
          setBulkSaving(false);
          return;
        }
        // Update total to reflect only valid games
        setBulkProgress({ current: 0, total: validGames.length });
      }

      // Process games one by one
      for (let i = 0; i < validGames.length; i++) {
        const game = validGames[i];
        setCurrentAddingGame(game.gameName || game.name || `Game ${i + 1}`);
        
        try {
          const formData = new FormData();
          
          // Add game data
          formData.append("gameApiID", game.game_code);
          formData.append("name", game.gameName || game.name);
          formData.append("provider", game.provider?.provider_code);
          
          const selectedCat = categories.find(cat => cat._id === bulkCategory);
          if (selectedCat) {
            formData.append("category", selectedCat.name);
          } else {
            formData.append("category", bulkCategory);
          }
          
          formData.append("featured", bulkFeatured);
          formData.append("status", bulkStatus);
          formData.append("fullScreen", bulkFullScreen);
          
          // Add image
          if (bulkUseDefaultImage) {
            const defaultImageUrl = game.image || game.coverImage;
            if (defaultImageUrl) {
              formData.append("defaultImage", defaultImageUrl);
              formData.append("portraitImage", defaultImageUrl);
              formData.append("landscapeImage", defaultImageUrl);
            }
          } else {
            if (bulkImage) {
              formData.append("portraitImage", bulkImage);
              formData.append("landscapeImage", bulkImage);
            }
          }

          // Make individual API call for each game
          const response = await api.post('/api/admin/games', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          if (response.status === 200 || response.status === 201) {
            results.successful.push(game);
          } else {
            results.failed.push({ game, error: "Failed to add game" });
          }
        } catch (error) {
          console.error(`Error adding game ${game.gameName || game.name}:`, error);
          results.failed.push({ 
            game, 
            error: error.response?.data?.message || error.message || "Unknown error" 
          });
        }

        // Update progress after each game
        setBulkProgress({ current: i + 1, total: validGames.length });
        
        // Small delay to show progress
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Final results
      if (results.failed.length > 0) {
        toast.warning(`Added ${results.successful.length} games, ${results.failed.length} failed.`);
        console.log('Failed games:', results.failed);
      } else {
        toast.success(`Successfully added all ${results.successful.length} games!`);
      }

      // Refresh local games data
      const updatedLocalGames = await fetchAllLocalGames();
      setLocalGames(updatedLocalGames);

      // Update game status in UI
      const successfulGameIds = results.successful.map(g => g.game_code);
      setGames(prevGames => 
        prevGames.map(game => ({
          ...game,
          isSaved: successfulGameIds.includes(game.game_code) ? true : game.isSaved
        }))
      );

      setFilteredGames(prevGames => 
        prevGames.map(game => ({
          ...game,
          isSaved: successfulGameIds.includes(game.game_code) ? true : game.isSaved
        }))
      );

      clearSelections();

      // Close modal after a delay
      setTimeout(() => {
        setShowBulkModal(false);
        resetBulkState();
      }, 300);

    } catch (error) {
      console.error("Error in bulk add:", error);
      toast.error(`❌ ${error.message || "Failed to add games in bulk"}`);
    } finally {
      setBulkSaving(false);
      setCurrentAddingGame("");
    }
  };

  const resetBulkState = () => {
    setBulkGames([]);
    setBulkCategory("");
    setBulkFeatured(false);
    setBulkStatus(true);
    setBulkFullScreen(false);
    setBulkUseDefaultImage(true);
    setBulkImage(null);
    setBulkImagePreview(null);
    setBulkProgress({ current: 0, total: 0 });
    setCurrentAddingGame("");
  };

  const selectedProviderObj = providers.find(p => p._id === selectedProvider || p.value === selectedProvider);
  const selectedProviderName = selectedProviderObj?.providerName || selectedProviderObj?.name || "";

  const unsavedGamesCount = filteredGames.filter(g => !g.isSaved).length;
  const selectedUnsavedCount = Array.from(selectedGames).filter(id => {
    const game = filteredGames.find(g => g._id === id);
    return game && !game.isSaved;
  }).length;

  const currentPageUnsavedGames = paginatedGames.filter(game => !game.isSaved);
  const currentPageSelectedCount = currentPageUnsavedGames.filter(game => selectedGames.has(game._id)).length;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    setTimeout(() => {
      document.getElementById('games-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <section className="font-nunito min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header toggleSidebar={toggleSidebar} />
      <div className="flex pt-[10vh]">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`transition-all duration-300 flex-1 p-4 md:p-6 overflow-y-auto min-h-[90vh] ${
            isSidebarOpen ? "md:ml-[40%] lg:ml-[28%] xl:ml-[17%]" : "ml-0"
          }`}
        >
          <div className="w-full mx-auto">
            {/* Header Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                Manage Games
              </h1>
              <p className="text-gray-600">
                Add new games or update existing games from providers
              </p>
            </div>

            {/* Filter Card */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Filter Games</h2>
                {selectedProvider && (
                  <div className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    Provider: {selectedProviderName}
                  </div>
                )}
              </div>
              
              <div>
                <SearchBar />
              </div>
              
              <div className="flex mt-[20px] justify-center w-full gap-[20px]">
                <CustomSelect
                  options={categories.filter(cat => cat.status)}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="category"
                  loading={loadingCategories}
                  icon={MdCategory}
                  dropdownOpen={showCategoriesDropdown}
                  setDropdownOpen={setShowCategoriesDropdown}
                  label="Select Game Category"
                />
                <CustomSelect
                  options={providers}
                  value={selectedProvider}
                  onChange={setSelectedProvider}
                  placeholder="provider"
                  loading={loadingProviders}
                  icon={FaGamepad}
                  dropdownOpen={showProvidersDropdown}
                  setDropdownOpen={setShowProvidersDropdown}
                  label="Select Game Provider"
                  disabled={!selectedCategory}
                />
              </div>

              {selectedCategory && providers.length === 0 && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    No providers found for the selected category. Please select a different category or add providers to this category.
                  </p>
                </div>
              )}

              {selectedCategory && (
                <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                  <p className="text-sm text-orange-800 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    New games will be automatically assigned to <span className="font-semibold ml-1">
                      {categories.find(c => c._id === selectedCategory)?.name}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Selection and Action Bar */}
            {!loadingGames && filteredGames.length > 0 && (
              <div className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-orange-50 to-white border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={toggleSelectAll}
                        className="flex items-center space-x-2 text-gray-700 hover:text-orange-600 transition-colors"
                        disabled={currentPageUnsavedGames.length === 0}
                      >
                        {selectAll ? (
                          <FaCheckCircle className="text-orange-500 text-xl" />
                        ) : (
                          <FaRegCircle className="text-gray-400 text-xl" />
                        )}
                        <span className="font-medium">
                          {selectAll ? 'Deselect All on Page' : 'Select All on Page'}
                        </span>
                      </button>
                      {selectedGames.size > 0 && (
                        <>
                          <span className="text-sm text-gray-600">
                            {currentPageSelectedCount} of {currentPageUnsavedGames.length} on this page • {selectedUnsavedCount} total selected
                          </span>
                          <button
                            onClick={clearSelections}
                            className="text-sm text-red-600 hover:text-red-800 transition-colors"
                          >
                            Clear All
                          </button>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {selectedUnsavedCount > 0 && (
                        <button
                          onClick={handleBulkAction}
                          className="px-4 py-2 bg-green-500 text-white font-medium rounded-lg hover:bg-green-600 transition-colors duration-200 flex items-center shadow-md"
                        >
                          <FaPlusCircle className="mr-2" />
                          Add Selected ({selectedUnsavedCount})
                        </button>
                      )}
                      
                      <button
                        onClick={openBulkModal}
                        className="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center shadow-md"
                        disabled={unsavedGamesCount === 0}
                      >
                        <FaList className="mr-2" />
                        Add All Unsaved ({unsavedGamesCount})
                      </button>
                    </div>
                  </div>
                </div>
                
                {selectedGames.size > 0 && (
                  <div className="px-4 py-2 bg-blue-50 text-sm text-blue-700 flex items-center">
                    <FaCheckCircle className="mr-2 text-blue-500" />
                    {selectedUnsavedCount} unsaved games selected total
                    {currentPageSelectedCount > 0 && (
                      <span className="ml-1 text-blue-500">
                        ({currentPageSelectedCount} on current page)
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Loading State */}
            {loadingGames && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <FaSpinner className="animate-spin text-orange-500 text-5xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent blur-xl"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading games from provider...</p>
                <p className="text-sm text-gray-500">Fetching all available games</p>
              </div>
            )}

            {/* Games Grid */}
            {!loadingGames && filteredGames.length > 0 && (
              <div id="games-grid">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {searchTerm ? 'Search Results' : 'Available Games'}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {searchTerm ? (
                        <>
                          Found <span className="font-semibold text-orange-600">{filteredGames.length}</span> game{filteredGames.length === 1 ? '' : 's'} matching "{searchTerm}"
                        </>
                      ) : (
                        <>
                          Showing <span className="font-semibold text-orange-600">{paginatedGames.length}</span> of <span className="font-semibold">{filteredGames.length}</span> games from {selectedProviderName}
                          <span className="ml-2 text-sm">
                            (<span className="text-green-600">{filteredGames.filter(g => g.isSaved).length} saved</span> • 
                            <span className="text-orange-600"> {unsavedGamesCount} new</span>)
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
                      >
                        Clear Search
                      </button>
                    )}
                    
                    {!searchTerm && (
                      <div className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {paginatedGames.map((game) => (
                    <div
                      id={`game-${game._id}`}
                      key={game._id}
                      className={`bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl relative ${
                        game.isSaved 
                          ? 'border-green-300 hover:border-green-400' 
                          : 'border-orange-300 hover:border-orange-400'
                      } ${editingGame === game._id ? 'ring-4 ring-orange-300' : ''} ${
                        selectedGames.has(game._id) && !game.isSaved ? 'ring-2 ring-blue-400' : ''
                      }`}
                    >
                      {/* Selection Checkbox for Unsaved Games */}
                      {!game.isSaved && (
                        <div className="absolute top-2 left-2 z-10">
                          <button
                            onClick={() => toggleGameSelection(game._id)}
                            className={`w-8 h-8 rounded-[5px] flex items-center justify-center transition-all duration-200 ${
                              selectedGames.has(game._id)
                                ? 'bg-blue-500 text-white shadow-lg'
                                : 'bg-white text-gray-400 border-2 border-gray-300 hover:border-blue-400'
                            }`}
                          >
                            {selectedGames.has(game._id) ? (
                              <FaCheck className="w-4 h-4" />
                            ) : (
                              <FaCheck className="w-4 h-4 opacity-0" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Game Header */}
                      <div className={`p-4 bg-gradient-to-r ${
                        game.isSaved 
                          ? 'from-green-50 to-white' 
                          : 'from-orange-50 to-white'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate pr-2">
                            {game.gameName || game.name}
                          </h3>
                          {game.isSaved ? (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center">
                              <FaCheck className="mr-1 text-xs" /> Added
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                              New Game
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center">
                            <span className="font-medium mr-2">Provider:</span>
                            {game.provider?.providerName || game.provider?.name}
                          </p>
                          <p className="flex items-center">
                            <span className="font-medium mr-2">Game Code:</span>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {game.game_code || game.code}
                            </span>
                          </p>
                          {game.isSaved && game.existingGameData && (
                            <p className="flex items-center text-xs text-green-600 mt-1">
                              <span className="font-medium mr-2">Status:</span>
                              {game.existingGameData.status ? 'Active' : 'Inactive'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Game Preview */}
                      <div className="p-4">
                        <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden group">
                          <img
                            src={useDefaultImage[game._id] 
                              ? (game.image || game.coverImage || game.existingGameData?.portraitImage)
                              : (game.localPortraitPreview || game.image || game.coverImage || game.existingGameData?.portraitImage)}
                            alt={game.gameName || game.name}
                            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          
                          {useDefaultImage[game._id] && (
                            <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
                              <FaImage className="mr-1" /> Default
                            </div>
                          )}
                        </div>

                        {game.isSaved && editingGame !== game._id && (
                          <div className="mt-3">
                            <button
                              onClick={() => handleEditGame(game)}
                              className="w-full px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
                            >
                              <FaEdit className="mr-2" /> Edit Game
                            </button>
                          </div>
                        )}

                        {editingGame === game._id && (
                          <>
                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-sm text-gray-600">Use Default Image:</span>
                              <button
                                onClick={() => toggleUseDefaultImage(game._id)}
                                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                                  useDefaultImage[game._id] ? 'bg-orange-500' : 'bg-gray-300'
                                }`}
                              >
                                <span
                                  className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                                    useDefaultImage[game._id] ? 'translate-x-6' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Assign Category
                              </label>
                              <div className="relative">
                                <div className="flex flex-wrap gap-2">
                                  {categories
                                    .filter(cat => cat.status)
                                    .map((category) => (
                                      <button
                                        key={category._id}
                                        onClick={() => handleGameDataChange(game._id, 'localCategory', category._id)}
                                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all duration-200 ${
                                          game.localCategory === category._id
                                            ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                                        }`}
                                      >
                                        {category.name}
                                      </button>
                                    ))}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4">
                              <CustomCheckbox
                                id={`featured-${game._id}`}
                                checked={game.localFeatured}
                                onChange={(e) => handleGameDataChange(game._id, 'localFeatured', e.target.checked)}
                                label="Featured Game"
                                description="Show this game in featured section"
                              />
                              <CustomCheckbox
                                id={`status-${game._id}`}
                                checked={game.localStatus}
                                onChange={(e) => handleGameDataChange(game._id, 'localStatus', e.target.checked)}
                                label="Active Status"
                                description="Game will be visible to users"
                              />
                              <CustomCheckbox
                                id={`fullscreen-${game._id}`}
                                checked={game.localFullScreen}
                                onChange={(e) => handleGameDataChange(game._id, 'localFullScreen', e.target.checked)}
                                label="Full Screen Mode"
                                description="Launch game in full screen"
                              />
                            </div>

                            {!useDefaultImage[game._id] && (
                              <div className="mt-6">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Custom Image
                                    <span className="text-xs text-gray-500 ml-2">(Will be used for both portrait and landscape)</span>
                                  </label>
                                  {game.localPortraitPreview ? (
                                    <div className="relative group">
                                      <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
                                        <img
                                          src={game.localPortraitPreview}
                                          alt="Game Image"
                                          className="w-full h-full object-contain p-2"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeImage(game._id)}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                      >
                                        <FaTimes className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <label className="block cursor-pointer">
                                      <div className="h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 group">
                                        <FaUpload className="text-gray-400 text-xl mb-2 group-hover:text-orange-500 transition-colors" />
                                        <span className="text-sm font-medium text-gray-500 group-hover:text-orange-600 transition-colors">
                                          Upload Game Image
                                        </span>
                                        <span className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</span>
                                      </div>
                                      <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(game._id, e.target.files[0])}
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>
                            )}

                            {useDefaultImage[game._id] && (
                              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-xs text-blue-700 flex items-center">
                                  <FaImage className="mr-2" />
                                  Using default image from provider. Toggle switch above to upload custom image.
                                </p>
                              </div>
                            )}

                            <div className="mt-6 pt-4 border-t border-gray-200 flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleCancelEdit()}
                                className="flex-1 px-4 py-3 bg-gray-500 text-white font-semibold rounded-xl hover:bg-gray-600 transition-colors duration-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveOrUpdateGame(game._id)}
                                disabled={
                                  updatingGameId === game._id || 
                                  !game.localCategory || 
                                  (!useDefaultImage[game._id] && !game.localPortraitImage)
                                }
                                className={`flex-1 px-4 py-3 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center ${
                                  updatingGameId === game._id 
                                    ? 'bg-gray-400 cursor-wait' 
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                                } ${
                                  (!game.localCategory || (!useDefaultImage[game._id] && !game.localPortraitImage)) 
                                    ? 'opacity-50 cursor-not-allowed' 
                                    : 'cursor-pointer'
                                }`}
                              >
                                {updatingGameId === game._id ? (
                                  <>
                                    <FaSpinner className="animate-spin mr-2" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    Update Game
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}

                        {!game.isSaved && editingGame !== game._id && (
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                setSelectedGames(new Set([game._id]));
                                handleBulkAction();
                              }}
                              className="w-full px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors duration-200 flex items-center justify-center"
                            >
                              <FaPlusCircle className="mr-2" /> Add Game
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}

            {/* Search Results Empty State */}
            {!loadingGames && selectedProvider && searchTerm && filteredGames.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <FaSearch className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Search Results</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  No games found matching "<span className="font-semibold">{searchTerm}</span>" in {selectedProviderName}.
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors duration-200"
                >
                  Clear Search
                </button>
              </div>
            )}

            {/* Empty State - No games found */}
            {!loadingGames && selectedProvider && !searchTerm && filteredGames.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                  <FaGamepad className="text-gray-400 text-3xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No Games Found</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  No games available from <span className="font-semibold">{selectedProviderName}</span> at this time.
                </p>
                <button
                  onClick={() => setSelectedProvider("")}
                  className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors duration-200"
                >
                  Select Different Provider
                </button>
              </div>
            )}

            {/* Initial State - No category or provider selected */}
            {!loadingGames && !selectedCategory && (
              <div className="text-center py-20">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
                  <FaFilter className="text-orange-400 text-4xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Select a Category</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  First select a category to see available providers for that category.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full font-medium">
                  ⚡ Category must be selected before choosing a provider
                </div>
              </div>
            )}

            {/* Category selected but no providers */}
            {!loadingGames && selectedCategory && providers.length === 0 && (
              <div className="text-center py-20">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-yellow-100 to-yellow-50 rounded-full flex items-center justify-center">
                  <FaGamepad className="text-yellow-400 text-4xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">No Providers Found</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  No providers available for the selected category. Please select a different category or add providers to this category.
                </p>
                <button
                  onClick={() => setSelectedCategory("")}
                  className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors duration-200"
                >
                  Select Different Category
                </button>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Bulk Add Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[10000] overflow-y-auto bg-[rgba(0,0,0,0.4)]">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaList className="text-white text-2xl mr-3" />
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {bulkActionMode ? 'Add Selected Games' : 'Bulk Add Games'}
                      </h3>
                      <p className="text-orange-100 text-sm mt-1">
                        Adding {bulkGames.length} game{bulkGames.length !== 1 ? 's' : ''} from {selectedProviderName}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowBulkModal(false);
                      resetBulkState();
                    }}
                    className="text-white hover:text-orange-200 transition-colors"
                  >
                    <FaTimes className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="px-6 py-6 max-h-[70vh] overflow-y-auto">
                {/* Bulk Settings */}
                <div className="space-y-6">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category for All Games <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {categories
                        .filter(cat => cat.status)
                        .map((category) => (
                          <button
                            key={category._id}
                            onClick={() => setBulkCategory(category._id)}
                            className={`px-4 py-2 text-sm rounded-lg border transition-all duration-200 ${
                              bulkCategory === category._id
                                ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
                            }`}
                          >
                            {category.name}
                          </button>
                        ))}
                    </div>
                  </div>

                  {/* Image Source Toggle */}
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">Image Source</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {bulkUseDefaultImage 
                            ? "Using default images from provider for all games" 
                            : "Using a single custom image for all games"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setBulkUseDefaultImage(!bulkUseDefaultImage);
                          if (!bulkUseDefaultImage) {
                            setBulkImage(null);
                            setBulkImagePreview(null);
                          }
                        }}
                        className={`relative inline-flex items-center h-8 rounded-full w-14 transition-colors focus:outline-none ${
                          bulkUseDefaultImage ? 'bg-orange-500' : 'bg-gray-400'
                        }`}
                      >
                        <span
                          className={`inline-block w-6 h-6 transform transition-transform bg-white rounded-full shadow-md ${
                            bulkUseDefaultImage ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Bulk Image Upload - Only show if not using default images */}
                  {!bulkUseDefaultImage && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Custom Image (Will be used for all games) <span className="text-red-500">*</span>
                      </label>
                      {bulkImagePreview ? (
                        <div className="relative group">
                          <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border-2 border-dashed border-gray-300">
                            <img
                              src={bulkImagePreview}
                              alt="Bulk Game Image"
                              className="w-full h-full object-contain p-4"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={removeBulkImage}
                            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                          >
                            <FaTimes className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="block cursor-pointer">
                          <div className="h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center transition-all duration-200 hover:border-orange-400 hover:bg-orange-50 group">
                            <FaUpload className="text-gray-400 text-3xl mb-3 group-hover:text-orange-500 transition-colors" />
                            <span className="text-sm font-medium text-gray-600 group-hover:text-orange-600 transition-colors">
                              Click to upload image
                            </span>
                            <span className="text-xs text-gray-400 mt-2">PNG, JPG up to 10MB</span>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleBulkImageUpload(e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  )}

                  {/* Bulk Settings */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Game Settings</h4>
                    <CustomCheckbox
                      id="bulk-featured"
                      checked={bulkFeatured}
                      onChange={(e) => setBulkFeatured(e.target.checked)}
                      label="Mark as Featured"
                      description="Show these games in featured section"
                    />
                    <CustomCheckbox
                      id="bulk-status"
                      checked={bulkStatus}
                      onChange={(e) => setBulkStatus(e.target.checked)}
                      label="Active Status"
                      description="Games will be visible to users"
                    />
                    <CustomCheckbox
                      id="bulk-fullscreen"
                      checked={bulkFullScreen}
                      onChange={(e) => setBulkFullScreen(e.target.checked)}
                      label="Full Screen Mode"
                      description="Launch games in full screen"
                    />
                  </div>

                  {/* Progress Bar with Game Name */}
                  {bulkSaving && (
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span className="font-medium">Adding games...</span>
                        <span className="text-orange-600 font-semibold">{bulkProgress.current} / {bulkProgress.total}</span>
                      </div>
                      
                      {currentAddingGame && (
                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                          <p className="text-sm text-orange-700 flex items-center">
                            <FaSpinner className="animate-spin mr-2 text-orange-500" />
                            Currently adding: <span className="font-semibold ml-1 truncate">{currentAddingGame}</span>
                          </p>
                        </div>
                      )}
                      
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all duration-300 relative"
                          style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-500 text-center">
                        {Math.round((bulkProgress.current / bulkProgress.total) * 100)}% complete
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkModal(false);
                    resetBulkState();
                  }}
                  disabled={bulkSaving}
                  className="px-4 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkAdd}
                  disabled={
                    bulkSaving ||
                    !bulkCategory ||
                    (!bulkUseDefaultImage && !bulkImage) ||
                    (bulkUseDefaultImage && bulkGames.filter(g => g.image || g.coverImage).length === 0)
                  }
                  className={`px-6 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg shadow-lg transition-all duration-300 flex items-center ${
                    bulkSaving || !bulkCategory || (!bulkUseDefaultImage && !bulkImage) || (bulkUseDefaultImage && bulkGames.filter(g => g.image || g.coverImage).length === 0)
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:from-orange-600 hover:to-orange-700'
                  }`}
                >
                  {bulkSaving ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Adding {bulkProgress.current}/{bulkProgress.total}...
                    </>
                  ) : (
                    <>
                      <FaPlusCircle className="mr-2" />
                      Add {bulkGames.length} Game{bulkGames.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Newgames;