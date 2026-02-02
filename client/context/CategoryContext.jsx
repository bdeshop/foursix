import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import toast from "react-hot-toast";

export const CategoryContext = createContext();

export const useCategory = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error("useCategory must be used within CategoryProvider");
  }
  return context;
};

export const CategoryProvider = ({ children }) => {
  // States
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [exclusiveGames, setExclusiveGames] = useState([]);
  const [displayedGames, setDisplayedGames] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isLoading, setIsLoading] = useState({
    categories: true,
    content: false,
    game: false
  });
  const [gamesPage, setGamesPage] = useState(1);
  const [hasMoreGames, setHasMoreGames] = useState(true);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [dynamicLogo, setDynamicLogo] = useState("");

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Set dynamic logo (you can replace this with your actual logo URL)
  useEffect(() => {
    // Set your logo URL here
    setDynamicLogo("https://via.placeholder.com/100x40?text=Logo");
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(prev => ({ ...prev, categories: true }));
      
      const apiUrl = `${base_url}/api/categories`;
      console.log("Fetching categories from:", apiUrl); // Debug log
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Categories response:", data); // Debug log
      
      if (data.success && data.data && data.data.length > 0) {
        setCategories(data.data);
        if (!activeCategory) {
          setActiveCategory(data.data[0]);
          handleCategoryClick(data.data[0]);
        }
      } else if (data.success && (!data.data || data.data.length === 0)) {
        console.warn("No categories found in response");
        toast.error("No categories available");
      } else {
        throw new Error(data.message || "Failed to fetch categories");
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error(`Failed to load categories: ${error.message}`);
      
      // Set default categories if API fails
      const defaultCategories = [
        { _id: "1", name: "Slots", image: "categories/slots.png" },
        { _id: "2", name: "Live Casino", image: "categories/live.png" },
        { _id: "3", name: "Table Games", image: "categories/table.png" },
        { _id: "4", name: "Exclusive Games", image: "categories/exclusive.png" },
        { _id: "5", name: "Popular", image: "categories/popular.png" }
      ];
      setCategories(defaultCategories);
      if (!activeCategory) {
        setActiveCategory(defaultCategories[0]);
      }
    } finally {
      setIsLoading(prev => ({ ...prev, categories: false }));
    }
  }, [activeCategory]);

  // Check if category is exclusive
  const isExclusiveCategory = useCallback((category = null) => {
    const cat = category || activeCategory;
    return cat && cat.name && cat.name.toLowerCase().includes("exclusive");
  }, [activeCategory]);

  // Fetch exclusive games
  const fetchExclusiveGames = useCallback(async (categoryId, page = 1) => {
    try {
      const apiUrl = `${base_url}/api/games/exclusive?category=${categoryId}&page=${page}&limit=14`;
      console.log("Fetching exclusive games from:", apiUrl); // Debug log
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (page === 1) {
          setDisplayedGames(data.data || []);
        } else {
          setDisplayedGames(prev => [...prev, ...(data.data || [])]);
        }
        setHasMoreGames((data.data || []).length === 14);
        setGamesPage(page);
      } else {
        throw new Error(data.message || "Failed to fetch exclusive games");
      }
    } catch (error) {
      console.error("Error fetching exclusive games:", error);
      toast.error("Failed to load games");
      
      // Set dummy games for testing if API fails
      if (page === 1) {
        const dummyGames = Array.from({ length: 8 }).map((_, i) => ({
          _id: `dummy-${i}`,
          name: `Game ${i + 1}`,
          gameName: `Game ${i + 1}`,
          image: `https://via.placeholder.com/100x133?text=Game+${i + 1}`
        }));
        setDisplayedGames(dummyGames);
      }
    }
  }, []);

  // Handle category click
  const handleCategoryClick = useCallback(async (category) => {
    setActiveCategory(category);
    setIsLoading(prev => ({ ...prev, content: true }));
    setGamesPage(1);
    setHasMoreGames(true);
    
    try {
      // Fetch providers for this category
      const apiUrl = `${base_url}/api/providers?category=${category._id}`;
      console.log("Fetching providers from:", apiUrl); // Debug log
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.data || []);
        setDisplayedGames([]);
        
        // If it's an exclusive category, fetch games
        if (isExclusiveCategory(category)) {
          await fetchExclusiveGames(category._id, 1);
        }
      } else {
        throw new Error(data.message || "Failed to fetch providers");
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error("Failed to load content");
      
      // Set dummy providers for testing if API fails
      const dummyProviders = Array.from({ length: 10 }).map((_, i) => ({
        _id: `provider-${i}`,
        name: `Provider ${i + 1}`,
        image: `providers/provider${i + 1}.png`
      }));
      setProviders(dummyProviders);
      
      // If exclusive category, show dummy games
      if (isExclusiveCategory(category)) {
        const dummyGames = Array.from({ length: 8 }).map((_, i) => ({
          _id: `game-${i}`,
          name: `Game ${i + 1}`,
          gameName: `Game ${i + 1}`,
          image: `https://via.placeholder.com/100x133?text=Game+${i + 1}`
        }));
        setDisplayedGames(dummyGames);
      }
    } finally {
      setIsLoading(prev => ({ ...prev, content: false }));
    }
  }, [isExclusiveCategory, fetchExclusiveGames]);

  // Handle provider click
  const handleProviderClick = useCallback(async (provider) => {
    setIsLoading(prev => ({ ...prev, content: true }));
    try {
      const apiUrl = `${base_url}/api/games?provider=${provider._id}`;
      console.log("Fetching provider games from:", apiUrl); // Debug log
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setDisplayedGames(data.data || []);
        setExclusiveGames(data.data || []);
      } else {
        throw new Error(data.message || "Failed to fetch provider games");
      }
    } catch (error) {
      console.error("Error fetching provider games:", error);
      toast.error("Failed to load games");
      
      // Set dummy games for testing if API fails
      const dummyGames = Array.from({ length: 12 }).map((_, i) => ({
        _id: `provider-game-${i}`,
        name: `${provider.name} Game ${i + 1}`,
        gameName: `${provider.name} Game ${i + 1}`,
        image: `https://via.placeholder.com/100x133?text=${provider.name}+${i + 1}`
      }));
      setDisplayedGames(dummyGames);
      setExclusiveGames(dummyGames);
    } finally {
      setIsLoading(prev => ({ ...prev, content: false }));
    }
  }, []);

  // Handle game click
  const handleGameClick = useCallback((game, isLoggedIn) => {
    if (!isLoggedIn) {
      setSelectedGame(game);
      setShowLoginPopup(true);
      return false;
    }
    return true;
  }, []);

  // Open game
  const openGame = useCallback(async (game, isLoggedIn) => {
    if (!isLoggedIn) {
      setSelectedGame(game);
      setShowLoginPopup(true);
      return;
    }
    
    setIsLoading(prev => ({ ...prev, game: true }));
    try {
      // Your game opening logic here
      console.log("Opening game:", game);
      // Add your game launch logic
    } catch (error) {
      console.error("Error opening game:", error);
      toast.error("Failed to open game");
    } finally {
      setIsLoading(prev => ({ ...prev, game: false }));
    }
  }, []);

  // Load more games
  const loadMoreGames = useCallback(() => {
    if (activeCategory && hasMoreGames) {
      const nextPage = gamesPage + 1;
      fetchExclusiveGames(activeCategory._id, nextPage);
    }
  }, [activeCategory, gamesPage, hasMoreGames, fetchExclusiveGames]);

  // Get game image URL
  const getGameImageUrl = useCallback((game) => {
    if (!game) return "https://via.placeholder.com/100x133?text=Game";
    
    if (game.image) {
      if (game.image.startsWith('http')) {
        return game.image;
      }
      return `${base_url}/${game.image}`;
    }
    return "https://via.placeholder.com/100x133?text=Game";
  }, []);

  // Clear cache
  const clearCache = useCallback(() => {
    setCategories([]);
    setProviders([]);
    setExclusiveGames([]);
    setDisplayedGames([]);
    setActiveCategory(null);
    setGamesPage(1);
    setHasMoreGames(true);
  }, []);

  // Refresh all data
  const refreshAllData = useCallback(() => {
    clearCache();
    fetchCategories();
  }, [clearCache, fetchCategories]);

  return (
    <CategoryContext.Provider
      value={{
        // States
        categories,
        providers,
        exclusiveGames,
        displayedGames,
        activeCategory,
        isLoading,
        gamesPage,
        hasMoreGames,
        showLoginPopup,
        selectedGame,
        isMobile,
        dynamicLogo,
        
        // Actions
        setShowLoginPopup,
        setSelectedGame,
        fetchCategories,
        handleCategoryClick,
        handleProviderClick,
        handleGameClick,
        openGame,
        loadMoreGames,
        getGameImageUrl,
        isExclusiveCategory,
        clearCache,
        refreshAllData
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};