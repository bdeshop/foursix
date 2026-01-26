import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const SidebarContext = createContext();

export const useSidebar = () => useContext(SidebarContext);

export const SidebarProvider = ({ children }) => {
  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;
  
  const [categories, setCategories] = useState([]);
  const [providers, setProviders] = useState([]);
  const [exclusiveGames, setExclusiveGames] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState({
    categories: false,
    providers: false,
    exclusiveGames: false,
    promotions: false
  });
  const [cache, setCache] = useState({
    providers: new Map(),
    exclusiveGames: new Map(),
    categories: null,
    promotions: null,
    timestamp: null
  });

  // Check if cache is valid (5 minutes)
  const isCacheValid = (timestamp) => {
    if (!timestamp) return false;
    const FIVE_MINUTES = 5 * 60 * 1000;
    return Date.now() - timestamp < FIVE_MINUTES;
  };

  // Load initial data from localStorage
  useEffect(() => {
    const loadCachedData = () => {
      const cachedData = localStorage.getItem('sidebarCache');
      if (cachedData) {
        try {
          const parsed = JSON.parse(cachedData);
          if (isCacheValid(parsed.timestamp)) {
            setCategories(parsed.categories || []);
            setPromotions(parsed.promotions || []);
            setCache(prev => ({
              ...prev,
              categories: parsed.categories,
              promotions: parsed.promotions,
              timestamp: parsed.timestamp
            }));
          }
        } catch (error) {
          console.error('Error loading cached data:', error);
        }
      }
    };

    loadCachedData();
  }, []);

  // Fetch categories
  const fetchCategories = async (forceRefresh = false) => {
    // Return cached data if available and not forced refresh
    if (cache.categories && !forceRefresh && isCacheValid(cache.timestamp)) {
      return cache.categories;
    }

    setIsLoading(prev => ({ ...prev, categories: true }));
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/categories`);
      if (response.data?.data) {
        const categoriesData = response.data.data;
        setCategories(categoriesData);
        
        // Update cache
        const newCache = {
          ...cache,
          categories: categoriesData,
          timestamp: Date.now()
        };
        setCache(newCache);
        
        // Save to localStorage
        localStorage.setItem('sidebarCache', JSON.stringify({
          categories: categoriesData,
          promotions: cache.promotions || [],
          timestamp: Date.now()
        }));
        
        return categoriesData;
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Return cached data if available even on error
      return cache.categories || [];
    } finally {
      setIsLoading(prev => ({ ...prev, categories: false }));
    }
  };

  // Fetch promotions
  const fetchPromotions = async (forceRefresh = false) => {
    if (cache.promotions && !forceRefresh && isCacheValid(cache.timestamp)) {
      return cache.promotions;
    }

    setIsLoading(prev => ({ ...prev, promotions: true }));
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/promotions`);
      if (response.data?.data) {
        const promotionsData = response.data.data;
        setPromotions(promotionsData);
        
        // Update cache
        const newCache = {
          ...cache,
          promotions: promotionsData,
          timestamp: Date.now()
        };
        setCache(newCache);
        
        // Save to localStorage
        localStorage.setItem('sidebarCache', JSON.stringify({
          categories: cache.categories || [],
          promotions: promotionsData,
          timestamp: Date.now()
        }));
        
        return promotionsData;
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
      return cache.promotions || [];
    } finally {
      setIsLoading(prev => ({ ...prev, promotions: false }));
    }
  };

  // Fetch providers with caching
  const fetchProviders = async (categoryName, forceRefresh = false) => {
    const cacheKey = `providers_${categoryName}`;
    
    // Return cached data if available
    if (cache.providers.has(cacheKey) && !forceRefresh) {
      const cached = cache.providers.get(cacheKey);
      if (isCacheValid(cached.timestamp)) {
        setProviders(cached.data);
        return cached.data;
      }
    }

    setIsLoading(prev => ({ ...prev, providers: true }));
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/providers/${categoryName}`);
      if (response.data?.success) {
        const providersData = response.data.data;
        setProviders(providersData);
        
        // Update cache
        const newCache = new Map(cache.providers);
        newCache.set(cacheKey, {
          data: providersData,
          timestamp: Date.now()
        });
        setCache(prev => ({ ...prev, providers: newCache }));
        
        return providersData;
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      const cached = cache.providers.get(cacheKey);
      return cached?.data || [];
    } finally {
      setIsLoading(prev => ({ ...prev, providers: false }));
    }
  };

  // Fetch exclusive games with caching
  const fetchExclusiveGames = async (categoryName, forceRefresh = false) => {
    const cacheKey = `exclusive_${categoryName}`;
    
    // Return cached data if available
    if (cache.exclusiveGames.has(cacheKey) && !forceRefresh) {
      const cached = cache.exclusiveGames.get(cacheKey);
      if (isCacheValid(cached.timestamp)) {
        setExclusiveGames(cached.data);
        return cached.data;
      }
    }

    setIsLoading(prev => ({ ...prev, exclusiveGames: true }));
    
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/games/category/${categoryName.toLowerCase()}?limit=20`
      );
      if (response.data?.success) {
        const gamesData = response.data.data;
        setExclusiveGames(gamesData);
        
        // Update cache
        const newCache = new Map(cache.exclusiveGames);
        newCache.set(cacheKey, {
          data: gamesData,
          timestamp: Date.now()
        });
        setCache(prev => ({ ...prev, exclusiveGames: newCache }));
        
        return gamesData;
      }
    } catch (error) {
      console.error('Error fetching exclusive games:', error);
      const cached = cache.exclusiveGames.get(cacheKey);
      return cached?.data || [];
    } finally {
      setIsLoading(prev => ({ ...prev, exclusiveGames: false }));
    }
  };

  // Clear cache
  const clearCache = () => {
    setCache({
      providers: new Map(),
      exclusiveGames: new Map(),
      categories: null,
      promotions: null,
      timestamp: null
    });
    localStorage.removeItem('sidebarCache');
  };

  // Force refresh all data
  const refreshAllData = async () => {
    await Promise.all([
      fetchCategories(true),
      fetchPromotions(true)
    ]);
  };

  const value = {
    categories,
    providers,
    exclusiveGames,
    promotions,
    isLoading,
    fetchCategories,
    fetchPromotions,
    fetchProviders,
    fetchExclusiveGames,
    clearCache,
    refreshAllData,
    setProviders,
    setExclusiveGames
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};