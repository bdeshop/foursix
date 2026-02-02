import React, { useState, useEffect } from "react";
import { FaUpload, FaTimes, FaSpinner, FaFilter, FaGamepad, FaSearch } from "react-icons/fa";
import { MdCategory, MdCheckBox, MdCheckBoxOutlineBlank } from "react-icons/md";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";
import { toast } from "react-toastify";

const Newgames = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const premium_api_key = import.meta.env.VITE_PREMIUM_API_KEY;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingGames, setLoadingGames] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [savingGameId, setSavingGameId] = useState(null);
  const [showProvidersDropdown, setShowProvidersDropdown] = useState(false);
  const [showCategoriesDropdown, setShowCategoriesDropdown] = useState(false);

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
    label 
  }) => {
    const selectedOption = options.find(opt => opt._id === value || opt.value === value);
    
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
            onClick={() => setDropdownOpen(!dropdownOpen)}
            disabled={loading}
            className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 flex items-center justify-between transition-all duration-200 hover:border-orange-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              {Icon && <Icon className="text-gray-400 text-lg" />}
              <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
                {loading ? `Loading ${placeholder}...` : 
                 selectedOption ? selectedOption.name || selectedOption.label : 
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
          
          {dropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 text-sm">
                  {loading ? 'Loading...' : 'No options available'}
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
                    <span>{option.name || option.label}</span>
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
        <label
          htmlFor={id}
          className="cursor-pointer"
        >
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
        <label
          htmlFor={id}
          className="text-sm font-medium text-gray-700 cursor-pointer select-none"
        >
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
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search games by name..."
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <FaTimes className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );

  // Function to filter games based on search term
  const filterGamesBySearch = (gamesList, term) => {
    if (!term.trim()) return gamesList;
    
    const searchTermLower = term.toLowerCase();
    return gamesList.filter(game => 
      game.name.toLowerCase().includes(searchTermLower) ||
      (game.provider?.name?.toLowerCase().includes(searchTermLower) || false) ||
      (game.category?.name?.toLowerCase().includes(searchTermLower) || false)
    );
  };

  // Fetch categories from local API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await fetch(`${base_url}/api/admin/game-categories`);
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const categoriesData = await response.json();
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to fetch categories');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchAndMergeProviders = async () => {
      setLoadingProviders(true);
      try {
        const [localRes, externalRes] = await Promise.all([
          fetch(`${base_url}/api/admin/game-providers`),
          fetch(`https://apigames.oracleapi.net/api/providers`, {
            headers: { "x-api-key": premium_api_key },
          }),
        ]);

        if (!localRes.ok || !externalRes.ok) {
          toast.error("Failed to fetch providers from all sources.");
          return;
        }

        const localProviders = await localRes.json();
        const externalProviders = await externalRes.json();

        const localProviderIds = new Set(
          localProviders.map((p) => p.providerOracleID)
        );

        const mergedProviders = externalProviders.data.filter((p) =>
          localProviderIds.has(p._id)
        );

        setProviders(mergedProviders);
      } catch (error) {
        console.error("Error fetching and merging providers:", error);
        toast.error("An error occurred while fetching providers.");
      } finally {
        setLoadingProviders(false);
      }
    };

    fetchAndMergeProviders();
  }, []);

  // Function to fetch all games from local database
  const fetchAllLocalGames = async () => {
    try {
      const response = await fetch(`${base_url}/api/admin/games/all`);
      if (!response.ok) {
        throw new Error('Failed to fetch local games');
      }
      const localGames = await response.json();
      return localGames;
    } catch (error) {
      console.error('Error fetching local games:', error);
      toast.error('Failed to fetch local games');
      return [];
    }
  };

  useEffect(() => {
    if (!selectedProvider) {
      setGames([]);
      setFilteredGames([]);
      setSearchTerm(""); // Clear search when provider is cleared
      return;
    }

    const fetchAndFilterGames = async () => {
      setLoadingGames(true);
      setSearchTerm(""); // Clear search when loading new provider
      try {
        // Fetch all games in parallel
        const [externalGamesRes, localGames] = await Promise.all([
          fetch(
            `https://apigames.oracleapi.net/api/games/pagination?limit=2000&provider=${selectedProvider}`,
            { headers: { "x-api-key": premium_api_key } }
          ),
          fetchAllLocalGames()
        ]);

        if (!externalGamesRes.ok) {
          toast.error("Failed to fetch games from provider.");
          return;
        }

        const externalGamesData = await externalGamesRes.json();

        // Create a Set of gameApiIDs that already exist in local database
        const existingGameApiIDs = new Set(
          localGames.map((game) => game.gameApiID)
        );
        // Filter out games that already exist in the database
        const newGamesOnly = externalGamesData.data.filter(
          (externalGame) => !existingGameApiIDs.has(externalGame.game_uuid)
        );
        // Transform the games for our UI
        const transformedGames = newGamesOnly.map((externalGame) => {
          return {
            ...externalGame,
            isSaved: false, // All these games are new (not in database)
            localFeatured: false,
            localStatus: true,
            localFullScreen: false,
            localCategory: selectedCategory || "",
            localPortraitImage: null,
            localPortraitPreview: null,
            localLandscapeImage: null,
            localLandscapePreview: null,
          };
        });

        setGames(transformedGames);
        setFilteredGames(transformedGames); // Initially show all new games
      } catch (error) {
        console.error("Error fetching and filtering games:", error);
        toast.error("An error occurred while fetching games.");
      } finally {
        setLoadingGames(false);
      }
    };

    fetchAndFilterGames();
  }, [selectedProvider]);

  // Apply search filter whenever games or search term changes
  useEffect(() => {
    const searchFiltered = filterGamesBySearch(games, searchTerm);
    setFilteredGames(searchFiltered);
  }, [games, searchTerm]);

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

  const handleGameDataChange = (gameApiID, field, value) => {
    setGames((prevGames) =>
      prevGames.map((game) =>
        game._id === gameApiID ? { ...game, [field]: value } : game
      )
    );
  };

  const handleImageUpload = (gameApiID, file) => {
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
          if (game._id === gameApiID) {
            return {
              ...game,
              localPortraitImage: file,
              localPortraitPreview: reader.result,
              // Automatically set landscape image to the same portrait image
              localLandscapeImage: file,
              localLandscapePreview: reader.result,
            };
          }
          return game;
        })
      );
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (gameApiID) => {
    setGames((prevGames) =>
      prevGames.map((game) => {
        if (game._id === gameApiID) {
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
  };

  const handleSaveOrUpdateGame = async (gameApiID) => {
    const gameToSave = games.find((g) => g._id === gameApiID);
    
    // Validation for new games
    if (
      !gameToSave.isSaved &&
      !gameToSave.localPortraitImage
    ) {
      toast.error(
        "Please upload game image."
      );
      return;
    }

    // Validate category for new games
    if (!gameToSave.isSaved && !gameToSave.localCategory) {
      toast.error("Please select a category for the game.");
      return;
    }

    setSavingGameId(gameApiID);

    try {
      const formData = new FormData();
      formData.append("gameApiID", gameToSave.game_uuid);
      formData.append("name", gameToSave.name);
      formData.append("provider", gameToSave.provider.name);
      
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
      
      if (gameToSave.localPortraitImage) {
        formData.append("portraitImage", gameToSave.localPortraitImage);
        // Also append the same image as landscape image
        formData.append("landscapeImage", gameToSave.localPortraitImage);
      }

      const url = `${base_url}/api/admin/games`;
      const method = "POST";
      
      const response = await fetch(url, {
        method: method,
        body: formData,
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success(
          `Game "${gameToSave.name}" added successfully!`
        );
        
        // Remove the saved game from the list
        setGames(prevGames => prevGames.filter(g => g._id !== gameApiID));
        
      } else {
        const errorMsg = result.error || "";
        
        if (response.status === 400) {
          if (errorMsg.includes("Game API ID already exists") || 
              errorMsg.includes("duplicate key error") ||
              errorMsg.includes("E11000") ||
              errorMsg.includes("already in use")) {
            toast.error(`⚠️ Game API ID "${gameToSave._id}" is already in use!`);
            
            // Remove this game from the list since it already exists
            setGames(prevGames => prevGames.filter(g => g._id !== gameApiID));
            
          } else if (errorMsg.includes("All fields are required") || 
                    errorMsg.includes("Missing required fields")) {
            toast.error(`❌ ${errorMsg}`);
          } else if (errorMsg.includes("images are required")) {
            toast.error("❌ Game image is required.");
          } else {
            toast.error(`❌ ${errorMsg || `Failed to add game.`}`);
          }
        } else {
          toast.error(
            result.error ||
              `❌ Failed to add game "${gameToSave.name}".`
          );
        }
      }
    } catch (error) {
      console.error("Error saving game:", error);
      toast.error("❌ An error occurred while saving the game.");
    } finally {
      setSavingGameId(null);
    }
  };

  // Get selected provider name for display
  const selectedProviderName = providers.find(p => p._id === selectedProvider)?.name || "";

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
                Add New Games
              </h1>
              <p className="text-gray-600">
                Import games from providers that are not already in your database
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
                  options={providers}
                  value={selectedProvider}
                  onChange={setSelectedProvider}
                  placeholder="provider"
                  loading={loadingProviders}
                  icon={FaGamepad}
                  dropdownOpen={showProvidersDropdown}
                  setDropdownOpen={setShowProvidersDropdown}
                  label="Select Game Provider"
                />
                <CustomSelect
                  options={categories.filter(cat => cat.status)}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  placeholder="category"
                  loading={loadingCategories}
                  icon={MdCategory}
                  dropdownOpen={showCategoriesDropdown}
                  setDropdownOpen={setShowCategoriesDropdown}
                  label="Default Category for New Games"
                />
                
                {searchTerm && (
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center">
                      <FaSearch className="text-blue-500 mr-3" />
                      <span className="text-blue-700 font-medium">
                        Searching for: "{searchTerm}"
                      </span>
                    </div>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Clear search
                    </button>
                  </div>
                )}
             </div>

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

            {/* Loading State */}
            {loadingGames && (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative">
                  <FaSpinner className="animate-spin text-orange-500 text-5xl" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-transparent blur-xl"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Loading new games from provider...</p>
                <p className="text-sm text-gray-500">Filtering out games already in your database</p>
              </div>
            )}

            {/* Games Grid */}
            {!loadingGames && filteredGames.length > 0 && (
              <div>
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
                          Showing <span className="font-semibold text-orange-600">{filteredGames.length}</span> new {filteredGames.length === 1 ? 'game' : 'games'} from {selectedProviderName}
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
                    <div className="px-3 py-1.5 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                      ✨ New Games Only
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredGames.map((game) => (
                    <div
                      key={game._id}
                      className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-orange-300 hover:border-orange-400 transition-all duration-300 hover:shadow-xl"
                    >
                      {/* Game Header */}
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-white">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-bold text-gray-900 truncate pr-2">
                            {game.name}
                          </h3>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
                            New Game
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p className="flex items-center">
                            <span className="font-medium mr-2">Provider:</span>
                            {game.provider.name}
                          </p>
                          <p className="flex items-center">
                            <span className="font-medium mr-2">Category:</span>
                            {game.category.name}
                          </p>
                        </div>
                      </div>

                      {/* Game Preview */}
                      <div className="p-4">
                        <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden group">
                          <img
                            src={game.coverImage || game.localPortraitPreview}
                            alt={game.name}
                            className="w-full h-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        {/* Custom Category Selector */}
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
                          {!game.localCategory && (
                            <p className="text-xs text-red-500 mt-2 flex items-center">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              Category is required
                            </p>
                          )}
                        </div>

                        {/* Game Settings */}
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

                        {/* Image Upload Section */}
                        <div className="mt-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Game Image
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

                        {/* Save Button */}
                        <div className="mt-6 pt-4 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={() => handleSaveOrUpdateGame(game._id)}
                            disabled={savingGameId === game._id || !game.localCategory || !game.localPortraitImage}
                            className={`w-full px-4 py-3 text-white font-semibold rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center ${
                              savingGameId === game._id 
                                ? 'bg-gray-400 cursor-wait' 
                                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                            } ${!game.localCategory || !game.localPortraitImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {savingGameId === game._id ? (
                              <>
                                <FaSpinner className="animate-spin mr-2" />
                                Saving...
                              </>
                            ) : (
                              <>
                                Save Game
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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

            {/* Empty State - No new games found */}
            {!loadingGames && selectedProvider && !searchTerm && filteredGames.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">All Games Already Imported!</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-6">
                  All games from <span className="font-semibold">{selectedProviderName}</span> are already in your database. Try selecting a different provider or check back later for new games.
                </p>
                <button
                  onClick={() => setSelectedProvider("")}
                  className="px-6 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors duration-200"
                >
                  Select Different Provider
                </button>
              </div>
            )}

            {/* Initial State - No provider selected */}
            {!loadingGames && !selectedProvider && (
              <div className="text-center py-20">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-orange-100 to-orange-50 rounded-full flex items-center justify-center">
                  <FaFilter className="text-orange-400 text-4xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">Select a Provider</h3>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  Choose a game provider from the filter above to see games that are not already in your database.
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-orange-100 text-orange-800 rounded-full font-medium">
                  ⚡ Only shows new games not in your database
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </section>
  );
};

export default Newgames;