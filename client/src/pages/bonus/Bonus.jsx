import React, { useState, useEffect, useContext } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { Header } from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { FiChevronDown, FiBell, FiExternalLink, FiClock, FiGift, FiCheckCircle, FiXCircle, FiAlertCircle, FiCalendar, FiStar, FiAward } from "react-icons/fi";
import { FaMoneyBillWave, FaCalendarAlt, FaTag, FaInfoCircle, FaCalendarWeek, FaChartLine, FaCoins, FaExchangeAlt, FaCrown, FaMedal, FaGem, FaRocket, FaGift } from "react-icons/fa";
import { MdCalendarMonth, MdEmojiEvents } from "react-icons/md";
import axios from "axios";
import logo from "../../assets/logo.png";
import { LanguageContext } from "../../context/LanguageContext";
import toast, { Toaster } from 'react-hot-toast';
import { GoTrophy } from "react-icons/go";

const Bonus = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [bonuses, setBonuses] = useState([]);
  const [stats, setStats] = useState({
    totalAvailable: 0,
    totalBonusAmount: 0,
    expiringSoon: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [claimingBonusId, setClaimingBonusId] = useState(null);
  const [claimingBettingBonusId, setClaimingBettingBonusId] = useState(null);
  const [bettingBonuses, setBettingBonuses] = useState([]);
  const [bettingStats, setBettingStats] = useState({
    totalUnclaimed: 0,
    totalBonusAmount: 0,
    totalBetAmount: 0
  });
  const [loadingBetting, setLoadingBetting] = useState(true);
  
  // Coin conversion states
  const [coinBalance, setCoinBalance] = useState(0);
  const [loadingCoin, setLoadingCoin] = useState(true);
  const [convertingCoins, setConvertingCoins] = useState(false);
  const [showCoinBox, setShowCoinBox] = useState(false);
  
  // User level states
  const [userLevel, setUserLevel] = useState(null);
  const [loadingLevel, setLoadingLevel] = useState(true);
  
  // Level coin reward states
  const [claimedLevels, setClaimedLevels] = useState([]);
  const [claimingLevelReward, setClaimingLevelReward] = useState(false);
  
  // Minimum coins required for conversion
  const MIN_COINS_FOR_CONVERSION = 1000;
  
  // Level definitions based on lifetime_bet (in BDT) with coin rewards
  // IMPORTANT: Bronze (id: 0) has coinReward: 0 because it's the starting level - NO REWARD
  const LEVELS = [
    { id: 0, name: "Bronze", nameBn: "ব্রোঞ্জ", minBet: 0, maxBet: 9999, icon: "🥉", color: "from-amber-600 to-amber-700", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30", textColor: "text-amber-400", coinReward: 0, rewardName: "0 Coins" },
    { id: 1, name: "Silver", nameBn: "সিলভার", minBet: 10000, maxBet: 49999, icon: "🥈", color: "from-gray-400 to-gray-500", bgColor: "bg-gray-400/10", borderColor: "border-gray-400/30", textColor: "text-gray-300", coinReward: 2000, rewardName: "2,000 Coins" },
    { id: 2, name: "Gold", nameBn: "গোল্ড", minBet: 50000, maxBet: 199999, icon: "🥇", color: "from-yellow-500 to-yellow-600", bgColor: "bg-yellow-500/10", borderColor: "border-yellow-500/30", textColor: "text-yellow-400", coinReward: 5000, rewardName: "5,000 Coins" },
    { id: 3, name: "Platinum", nameBn: "প্লাটিনাম", minBet: 200000, maxBet: 499999, icon: "💎", color: "from-cyan-400 to-cyan-500", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/30", textColor: "text-cyan-400", coinReward: 10000, rewardName: "10,000 Coins" },
    { id: 4, name: "Diamond", nameBn: "ডায়মন্ড", minBet: 500000, maxBet: 999999, icon: "🔹", color: "from-blue-400 to-blue-500", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/30", textColor: "text-blue-400", coinReward: 20000, rewardName: "20,000 Coins" },
    { id: 5, name: "Royal", nameBn: "রয়্যাল", minBet: 1000000, maxBet: 4999999, icon: "👑", color: "from-purple-500 to-purple-600", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/30", textColor: "text-purple-400", coinReward: 50000, rewardName: "50,000 Coins" },
    { id: 6, name: "Legend", nameBn: "লিজেন্ড", minBet: 5000000, maxBet: Infinity, icon: "🏆", color: "from-red-500 to-red-600", bgColor: "bg-red-500/10", borderColor: "border-red-500/30", textColor: "text-red-400", coinReward: 100000, rewardName: "100,000 Coins" }
  ];
  
  // Level benefits
  const LEVEL_BENEFITS = {
    0: ["Welcome Bonus", "Standard Cashback 1%"],
    1: ["+5% Bonus on Deposits", "Cashback 2%", "Daily Free Spin"],
    2: ["+10% Bonus on Deposits", "Cashback 3%", "Weekly Free Bet", "Priority Support"],
    3: ["+15% Bonus on Deposits", "Cashback 4%", "Monthly Gift", "Personal Manager", "Lower Wagering"],
    4: ["+20% Bonus on Deposits", "Cashback 5%", "VIP Events Access", "Faster Withdrawals", "Higher Limits"],
    5: ["+30% Bonus on Deposits", "Cashback 7%", "Exclusive Tournaments", "Luxury Gifts", "No Wagering Bonus"],
    6: ["+50% Bonus on Deposits", "Cashback 10%", "All Access Pass", "Custom Rewards", "Profit Sharing"]
  };
  
  // Get language context
  const { language, t } = useContext(LanguageContext);
  
  // Get user and token from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('usertoken');
  
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;

  // Fetch available cash bonuses
  const fetchBonuses = async () => {
    try {
      if (!token) {
        setError(t?.pleaseLoginToViewBonuses || "Please login to view bonuses");
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${base_url}/api/user/cash-bonus/available`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Bonuses response:", response.data);
      
      if (response.data.success) {
        setBonuses(response.data.data.bonuses || []);
        setStats(response.data.data.stats || {
          totalAvailable: 0,
          totalBonusAmount: 0,
          expiringSoon: 0
        });
      } else {
        setError(response.data.message || (t?.failedToFetchBonuses || "Failed to fetch bonuses"));
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || (t?.failedToFetchBonuses || "Failed to fetch bonuses");
      setError(errorMessage);
      console.error("Error fetching bonuses:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch available betting bonuses (weekly & monthly)
  const fetchBettingBonuses = async () => {
    try {
      if (!token) {
        setLoadingBetting(false);
        return;
      }
      
      setLoadingBetting(true);
      
      const response = await axios.get(`${base_url}/api/user/betting-bonus/unclaimed`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Betting bonuses response:", response.data);
      
      if (response.data.success) {
        setBettingBonuses(response.data.data.bonuses || []);
        setBettingStats(response.data.data.stats || {
          totalUnclaimed: 0,
          totalBonusAmount: 0,
          totalBetAmount: 0
        });
      }
    } catch (err) {
      console.error("Error fetching betting bonuses:", err);
    } finally {
      setLoadingBetting(false);
    }
  };

  // Fetch user's coin balance and level info
  const fetchCoinBalance = async () => {
    try {
      if (!token) return;
      
      setLoadingCoin(true);
      
      const response = await axios.get(`${base_url}/api/user/my-information`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("User info response for coins:", response.data);
      
      if (response.data.success) {
        const coinBal = response.data.data.coinBalance || 0;
        setCoinBalance(coinBal);
        setShowCoinBox(coinBal >= MIN_COINS_FOR_CONVERSION);
        
        // Get claimed levels from user data
        const claimed = response.data.data.claimedLevels || [];
        console.log("Claimed levels from backend:", claimed);
        setClaimedLevels(claimed);
        
        // Get lifetime bet
        const lifetimeBet = response.data.data.lifetime_bet || 0;
        
        // Calculate user level
        calculateUserLevel(lifetimeBet, claimed);
      }
    } catch (err) {
      console.error("Error fetching coin balance:", err);
    } finally {
      setLoadingCoin(false);
    }
  };
  
  // Calculate user level based on lifetime bet
  const calculateUserLevel = (lifetimeBet, claimedLevelsArray) => {
    let currentLevel = LEVELS[0];
    let nextLevel = LEVELS[1];
    
    for (let i = 0; i < LEVELS.length; i++) {
      if (lifetimeBet >= LEVELS[i].minBet && lifetimeBet <= LEVELS[i].maxBet) {
        currentLevel = LEVELS[i];
        nextLevel = LEVELS[i + 1] || null;
        break;
      }
    }
    
    // Calculate progress to next level
    let progress = 100;
    let amountToNext = 0;
    let currentLevelMin = currentLevel.minBet;
    let nextLevelMin = nextLevel ? nextLevel.minBet : currentLevel.maxBet;
    
    if (nextLevel && nextLevelMin !== Infinity) {
      const range = nextLevelMin - currentLevelMin;
      const achieved = lifetimeBet - currentLevelMin;
      progress = Math.min(100, Math.max(0, (achieved / range) * 100));
      amountToNext = nextLevelMin - lifetimeBet;
    } else {
      progress = 100;
      amountToNext = 0;
    }
    
    // CRITICAL FIX: Filter out levels that have already been claimed AND skip Bronze (id: 0)
    const claimableLevels = LEVELS.filter(level => {
      // Skip Bronze (level 0) - no reward to claim
      if (level.id === 0) return false;
      
      // Skip levels with zero coin reward
      if (level.coinReward === 0) return false;
      
      // Check if user has reached the minimum bet for this level
      const isReached = lifetimeBet >= level.minBet;
      
      // Check if this level has NOT been claimed yet
      const isNotClaimed = !claimedLevelsArray.includes(level.id);
      
      // Only show levels that are reached AND not claimed AND have reward
      return isReached && isNotClaimed;
    });
    
    console.log("Claimable levels calculation:", {
      lifetimeBet,
      claimedLevelsArray,
      claimableLevels: claimableLevels.map(l => ({ id: l.id, name: l.name, reward: l.coinReward })),
      allLevelsCheck: LEVELS.map(l => ({
        id: l.id,
        name: l.name,
        reward: l.coinReward,
        reached: lifetimeBet >= l.minBet,
        claimed: claimedLevelsArray.includes(l.id),
        isClaimable: lifetimeBet >= l.minBet && !claimedLevelsArray.includes(l.id) && l.id !== 0 && l.coinReward > 0
      }))
    });
    
    setUserLevel({
      currentLevel,
      nextLevel,
      progress,
      amountToNext,
      lifetimeBet,
      claimableLevels: claimableLevels // Only unclaimed levels with rewards
    });
    setLoadingLevel(false);
  };

  // Claim level completion coin reward
  const claimLevelReward = async (levelId, levelName, coinReward) => {
    setClaimingLevelReward(true);
    try {
      const response = await axios.post(
        `${base_url}/api/user/claim-level-reward`,
        { levelId },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`🎉 ${coinReward.toLocaleString()} Coins added for reaching ${levelName}!`);
        
        // Update local claimed levels
        const updatedClaimedLevels = [...claimedLevels, levelId];
        setClaimedLevels(updatedClaimedLevels);
        
        // Update coin balance
        setCoinBalance(response.data.data.newCoinBalance || coinBalance + coinReward);
        
        // Recalculate user level with updated claimed levels
        const lifetimeBet = userLevel?.lifetimeBet || 0;
        calculateUserLevel(lifetimeBet, updatedClaimedLevels);
        
        // Refresh other data
        await fetchBonuses();
        await fetchBettingBonuses();
        
        // Update user in localStorage if needed
        if (response.data.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.data.user));
        }
      } else {
        toast.error(response.data.message || "Failed to claim level reward");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to claim level reward";
      toast.error(errorMessage);
      console.error("Error claiming level reward:", err);
    } finally {
      setClaimingLevelReward(false);
    }
  };

  // Convert coins to balance
  const convertCoinsToBalance = async () => {
    if (coinBalance < MIN_COINS_FOR_CONVERSION) {
      toast.error(`Minimum ${MIN_COINS_FOR_CONVERSION} coins required for conversion`);
      return;
    }
    
    setConvertingCoins(true);
    try {
      const response = await axios.post(
        `${base_url}/api/user/convert-coins-to-balance`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        setCoinBalance(response.data.data.newCoinBalance);
        setShowCoinBox(response.data.data.newCoinBalance >= MIN_COINS_FOR_CONVERSION);
        
        // Update user balance in localStorage
        if (response.data.data.newRealBalance) {
          const updatedUser = { ...user, balance: response.data.data.newRealBalance };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        // Refresh bonuses to update balance display
        fetchBonuses();
        fetchBettingBonuses();
      } else {
        toast.error(response.data.message || "Failed to convert coins");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to convert coins";
      toast.error(errorMessage);
      console.error("Error converting coins:", err);
    } finally {
      setConvertingCoins(false);
    }
  };

  // Claim a cash bonus directly
  const claimBonus = async (bonusId, bonusTitle, bonusAmount) => {
    setClaimingBonusId(bonusId);
    try {
      const response = await axios.post(
        `${base_url}/api/user/cash-bonus/claim/${bonusId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || "Bonus claimed successfully!");
        await fetchBonuses();
        await fetchCoinBalance();
        if (response.data.data.balanceAfter) {
          const updatedUser = { ...user, balance: response.data.data.balanceAfter };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        toast.error(response.data.message || "Failed to claim bonus");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to claim bonus";
      toast.error(errorMessage);
      console.error("Error claiming bonus:", err);
    } finally {
      setClaimingBonusId(null);
    }
  };

  // Claim a betting bonus (weekly/monthly)
  const claimBettingBonus = async (bonusId, bonusType, bonusAmount) => {
    setClaimingBettingBonusId(bonusId);
    try {
      const response = await axios.post(
        `${base_url}/api/user/betting-bonus/claim/${bonusId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || `${bonusType.charAt(0).toUpperCase() + bonusType.slice(1)} bonus claimed successfully!`);
        await fetchBettingBonuses();
        await fetchBonuses();
        await fetchCoinBalance();
        if (response.data.data.balanceAfter) {
          const updatedUser = { ...user, balance: response.data.data.balanceAfter };
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      } else {
        toast.error(response.data.message || "Failed to claim bonus");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to claim bonus";
      toast.error(errorMessage);
      console.error("Error claiming betting bonus:", err);
    } finally {
      setClaimingBettingBonusId(null);
    }
  };

  // Toggle dropdown
  const toggleDropdown = (id) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Load bonuses on component mount
  useEffect(() => {
    if (token) {
      fetchBonuses();
      fetchBettingBonuses();
      fetchCoinBalance();
    } else {
      setLoading(false);
      setLoadingBetting(false);
      setLoadingCoin(false);
      setLoadingLevel(false);
      setError(t?.pleaseLoginToViewBonuses || "Please login to view bonuses");
    }
  }, [token]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return t?.noExpiry || "No expiry";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return (t?.todayAt || 'Today at') + ' ' + date.toLocaleTimeString(language?.code === 'bn' ? 'bn-BD' : 'en-US', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } else {
        return date.toLocaleDateString(language?.code === 'bn' ? 'bn-BD' : 'en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
      }
    } catch (error) {
      return t?.invalidDate || "Invalid date";
    }
  };

  // Get days left until expiry
  const getDaysLeft = (expiresAt, noExpiry) => {
    if (noExpiry) return null;
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 0;
    return diffDays;
  };

  // Get days left for betting bonus (3 days validity)
  const getBettingDaysLeft = (distributionDate) => {
    if (!distributionDate) return null;
    
    const now = new Date();
    const expiryDate = new Date(distributionDate);
    expiryDate.setDate(expiryDate.getDate() + 3);
    
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return 0;
    return diffDays;
  };

  // Get urgency class based on days left
  const getUrgencyClass = (daysLeft) => {
    if (daysLeft === null) return "text-gray-400";
    if (daysLeft <= 1) return "text-red-400";
    if (daysLeft <= 3) return "text-yellow-400";
    if (daysLeft <= 7) return "text-orange-400";
    return "text-green-400";
  };

  // Get bonus type display name
  const getBonusTypeName = (type) => {
    const types = {
      special_event: "Special Event",
      welcome_bonus: "Welcome Bonus",
      loyalty_reward: "Loyalty Reward",
      compensation: "Compensation",
      promotional: "Promotional",
      referral: "Referral",
      achievement: "Achievement"
    };
    return types[type] || type?.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || "Bonus";
  };

  // Get bonus type icon
  const getBonusTypeIcon = (type) => {
    const icons = {
      special_event: "🎉",
      welcome_bonus: "👋",
      loyalty_reward: "🏆",
      compensation: "🤝",
      promotional: "📢",
      referral: "🔗",
      achievement: "⭐"
    };
    return icons[type] || "🎁";
  };

  // Get betting bonus icon
  const getBettingBonusIcon = (type) => {
    return type === 'weekly' ? <FaCalendarWeek className="text-blue-400" /> : <MdCalendarMonth className="text-purple-400" />;
  };

  // Get betting bonus display name
  const getBettingBonusName = (type) => {
    return type === 'weekly' ? "Weekly Betting Bonus" : "Monthly Betting Bonus";
  };

  // Check if user can convert coins (minimum 1000)
  const canConvertCoins = coinBalance >= MIN_COINS_FOR_CONVERSION;
  
  // Calculate conversion details
  const getConversionDetails = () => {
    if (!canConvertCoins) {
      return {
        coinsToConvert: 0,
        amountToGet: 0,
        remainingCoins: coinBalance,
        needed: MIN_COINS_FOR_CONVERSION - coinBalance
      };
    }
    const coinsToConvert = Math.floor(coinBalance / 100) * 100;
    const amountToGet = coinsToConvert / 100;
    const remainingCoins = coinBalance - coinsToConvert;
    return { coinsToConvert, amountToGet, remainingCoins, needed: 0 };
  };

  const conversionDetails = getConversionDetails();

  const isLoading = loading || loadingBetting;

  // Check if there are no bonuses at all
  const hasNoBonuses = bonuses.length === 0 && bettingBonuses.length === 0 && !isLoading && token;

  if (isLoading && bonuses.length === 0 && bettingBonuses.length === 0) {
    return (
      <div className="h-screen overflow-hidden font-poppins bg-[#0f0f0f] text-white">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex h-[calc(100vh-48px)] sm:h-[calc(100vh-56px)]">
          <Sidebar sidebarOpen={sidebarOpen} />
          <div className="w-full overflow-y-auto flex items-center justify-center">
            <div className='w-full p-[20px] flex justify-center items-center'>
              <div className="relative w-24 h-24 flex justify-center items-center">
                <div className="absolute w-full h-full rounded-full border-4 border-transparent border-t-green-500 border-r-green-500 animate-spin"></div>
                <div className="w-20 h-20 rounded-full flex justify-center items-center font-bold text-lg">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden w-full font-poppins bg-[#0f0f0f] text-white">
      <Toaster />
      
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex h-[calc(100vh-48px)] sm:h-[calc(100vh-56px)] w-full">
        <Sidebar sidebarOpen={sidebarOpen} />

        <div className="flex-1 overflow-auto w-full transition-all duration-300">
          <div className="mx-auto overflow-y-auto pb-[100px] w-full max-w-screen-xl px-4 md:px-[50px] py-6">
            
            {/* Level Completion Claim Box - ONLY SHOWS when there are UNCLAIMED levels with rewards */}
            {token && userLevel && userLevel.claimableLevels && userLevel.claimableLevels.length > 0 && (
              <div className="mb-6 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                        <FaGift className="text-green-400 text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white flex items-center gap-2">
                          🎉 Level Completion Rewards Available!
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                            {userLevel.claimableLevels.length} Level{userLevel.claimableLevels.length > 1 ? 's' : ''}
                          </span>
                        </h3>
                        <p className="text-xs text-gray-300 mt-1">
                          You've reached new levels! Claim your coin rewards now.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {userLevel.claimableLevels.map((level) => (
                      <div 
                        key={level.id} 
                        className={`flex items-center justify-between p-3 rounded-lg ${level.bgColor} border ${level.borderColor}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{level.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {language?.code === 'bn' ? level.nameBn : level.name}
                            </p>
                            <p className="text-xs flex items-center gap-1">
                              <FaCoins className="text-yellow-500 text-[10px]" />
                              <span className="text-yellow-400">{level.coinReward.toLocaleString()} Coins</span>
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => claimLevelReward(level.id, language?.code === 'bn' ? level.nameBn : level.name, level.coinReward)}
                          disabled={claimingLevelReward}
                          className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 rounded-lg text-xs font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {claimingLevelReward ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            "Claim Reward"
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* User Level Card */}
            {token && userLevel && (
              <div className="mb-6 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#151515] border border-[#2a2a2a] overflow-hidden">
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full ${userLevel.currentLevel.bgColor} flex items-center justify-center text-3xl`}>
                        {userLevel.currentLevel.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-lg sm:text-xl font-bold text-white">
                            {language?.code === 'bn' ? userLevel.currentLevel.nameBn : userLevel.currentLevel.name}
                          </h2>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${userLevel.currentLevel.bgColor} ${userLevel.currentLevel.textColor}`}>
                            Level {userLevel.currentLevel.id + 1}
                          </span>
                        </div>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1">
                          Lifetime Bet: ৳{userLevel.lifetimeBet.toLocaleString()}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <FaCoins className="text-yellow-500 text-xs" />
                          <span className="text-yellow-400 text-xs font-medium">
                            Next: {userLevel.nextLevel ? (language?.code === 'bn' ? userLevel.nextLevel.nameBn : userLevel.nextLevel.name) : "Max Level"} 
                            {userLevel.amountToNext > 0 && ` (Need ৳${userLevel.amountToNext.toLocaleString()} more)`}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 w-full md:max-w-md">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>Progress to {userLevel.nextLevel ? (language?.code === 'bn' ? userLevel.nextLevel.nameBn : userLevel.nextLevel.name) : "Max"}</span>
                        <span className={userLevel.currentLevel.textColor}>{Math.floor(userLevel.progress)}%</span>
                      </div>
                      <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full bg-gradient-to-r ${userLevel.currentLevel.color} transition-all duration-500`}
                          style={{ width: `${userLevel.progress}%` }}
                        ></div>
                      </div>
                      {userLevel.nextLevel && (
                        <p className="text-xs text-gray-500 mt-2">
                          🎁 {userLevel.nextLevel.coinReward.toLocaleString()} Coins reward on reaching {language?.code === 'bn' ? userLevel.nextLevel.nameBn : userLevel.nextLevel.name}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                    <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                      <FiStar className="text-yellow-500" />
                      Level Benefits & Rewards
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {LEVELS.map((level) => {
                        const isCurrentLevel = userLevel.currentLevel.id === level.id;
                        const isLevelClaimed = claimedLevels.includes(level.id);
                        const isLevelReached = userLevel.lifetimeBet >= level.minBet;
                        const isBronze = level.id === 0;
                        
                        return (
                          <div 
                            key={level.id}
                            className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                              isCurrentLevel 
                                ? `${level.bgColor} border ${level.borderColor}` 
                                : 'bg-[#1a1a1a] border border-[#2a2a2a] opacity-70'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{level.icon}</span>
                              <div>
                                <p className="text-xs font-medium text-white">
                                  {language?.code === 'bn' ? level.nameBn : level.name}
                                </p>
                                {level.coinReward > 0 && (
                                  <p className="text-[10px] flex items-center gap-1">
                                    <FaCoins className="text-yellow-500" />
                                    <span className="text-yellow-400">{level.coinReward.toLocaleString()} Coins</span>
                                  </p>
                                )}
                              </div>
                            </div>
                            <div>
                              {isBronze ? (
                                <span className="text-[10px] text-gray-500 px-2 py-0.5 rounded-full bg-gray-500/20">
                                  Starter
                                </span>
                              ) : isLevelClaimed ? (
                                <span className="text-[10px] text-green-400 flex items-center gap-1">
                                  <FiCheckCircle className="text-[10px]" /> Claimed
                                </span>
                              ) : isLevelReached ? (
                                <span className="text-[10px] text-yellow-400 flex items-center gap-1">
                                  <FiAward className="text-[10px]" /> Ready to Claim
                                </span>
                              ) : (
                                <span className="text-[10px] text-gray-500">
                                  Locked
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Header Section */}
            <div className="flex flex-col pt-[25px] lg:pt-[50px] sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
              <div>
                <h1 className="text-[18px] md:text-xl sm:text-[22px] font-[600] text-white flex items-center gap-2">
                  <FiGift className="text-yellow-500" />
                  {t?.availableBonuses || "Available Bonuses"}
                </h1>
                <p className="text-gray-400 text-xs mt-1">
                  {t?.claimCashBonuses || "Claim cash bonuses and betting rewards directly to your account"}
                </p>
              </div>
            </div>

            {/* Coin Conversion Box */}
            {token && (
              <div className={`mb-6 rounded-lg p-4 transition-all duration-300 ${
                canConvertCoins 
                  ? "bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30" 
                  : "bg-[#1a1a1a] border border-[#2a2a2a] opacity-70"
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      canConvertCoins ? "bg-yellow-500/20" : "bg-gray-500/20"
                    }`}>
                      <FaCoins className={canConvertCoins ? "text-yellow-500 text-2xl" : "text-gray-500 text-2xl"} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white flex items-center gap-2">
                        Convert Coins to Balance
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          canConvertCoins 
                            ? "bg-yellow-500/20 text-yellow-400" 
                            : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {coinBalance} Coins
                        </span>
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        100 coins = 1 BDT • Minimum {MIN_COINS_FOR_CONVERSION} coins required
                      </p>
                      {!canConvertCoins && (
                        <p className="text-xs text-red-400 mt-1">
                          Need {conversionDetails.needed} more coins to convert
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={convertCoinsToBalance}
                    disabled={!canConvertCoins || convertingCoins}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      canConvertCoins && !convertingCoins
                        ? "bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 shadow-lg shadow-yellow-500/20 cursor-pointer"
                        : "bg-gray-600 cursor-not-allowed opacity-50"
                    }`}
                  >
                    {convertingCoins ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <FaExchangeAlt className="text-sm" />
                    )}
                    {convertingCoins 
                      ? "Converting..." 
                      : canConvertCoins 
                        ? `Convert ${conversionDetails.coinsToConvert} Coins` 
                        : "Minimum 1000 Coins Required"}
                  </button>
                </div>
                
                {canConvertCoins && (
                  <div className="mt-3 pt-3 border-t border-yellow-500/20">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Current Coins:</span>
                        <span className="text-yellow-400 font-medium">{coinBalance}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Will Convert:</span>
                        <span className="text-yellow-400 font-medium">{conversionDetails.coinsToConvert} coins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">You Get:</span>
                        <span className="text-green-400 font-medium">৳{conversionDetails.amountToGet}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Remaining Coins:</span>
                        <span className="text-gray-400">{conversionDetails.remainingCoins} coins</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {!canConvertCoins && coinBalance > 0 && (
                  <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Current Coins:</span>
                        <span className="text-yellow-400 font-medium">{coinBalance}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Need More:</span>
                        <span className="text-red-400 font-medium">{conversionDetails.needed} coins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Progress:</span>
                        <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                            style={{ width: `${(coinBalance / MIN_COINS_FOR_CONVERSION) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-gray-400">{Math.floor((coinBalance / MIN_COINS_FOR_CONVERSION) * 100)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!token ? (
              <div className="bg-gradient-to-br from-[#1a1a1a] to-[#151515] border border-[#2a2a2a] rounded-lg p-4 sm:p-6 text-center max-w-sm sm:max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#222] mb-3 sm:mb-4">
                  <FiBell className="text-lg sm:text-xl text-gray-500" />
                </div>
                <h3 className="text-base sm:text-lg font-medium mb-2">{t?.authenticationRequired || "Authentication Required"}</h3>
                <p className="text-gray-400 mb-3 sm:mb-4 text-xs sm:text-sm">{t?.pleaseLoginToViewBonuses || "Please log in to view and claim your bonuses"}</p>
                <a 
                  href="/login" 
                  className="inline-block px-4 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg transition-all duration-300 shadow-lg shadow-blue-500/20 text-xs sm:text-sm"
                >
                  {t?.signIn || "Sign In"}
                </a>
              </div>
            ) : (
              <>
                {hasNoBonuses ? (
                  <></>
                ) : (
                  <>
                    {/* Cash Bonuses Section */}
                    <div className="mb-8">
                      {bonuses.length === 0 ? (
                        <></>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {bonuses.map((bonus) => {
                            const daysLeft = getDaysLeft(bonus.expiresAt, bonus.noExpiry);
                            const urgencyClass = getUrgencyClass(daysLeft);
                            const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
                            
                            return (
                              <div 
                                key={bonus.id} 
                                className={`bg-gradient-to-br from-[#1a1a1a] to-[#151515] border ${isExpiringSoon ? 'border-yellow-500/30' : 'border-[#2a2a2a]'} rounded-lg overflow-hidden transition-all hover:border-[#3a3a3a] hover:shadow-md`}
                              >
                                <div 
                                  className="p-3 sm:p-4 cursor-pointer"
                                  onClick={() => toggleDropdown(bonus.id)}
                                >
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 mr-3">
                                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                        <span className="text-xl sm:text-2xl">{getBonusTypeIcon(bonus.bonusType)}</span>
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                          <h2 className="text-sm sm:text-base font-[600] text-white">{bonus.title}</h2>
                                          <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="text-xs text-yellow-400 flex items-center gap-1">
                                              ৳{bonus.amount.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                              <FaTag className="text-[10px]" />
                                              {getBonusTypeName(bonus.bonusType)}
                                            </span>
                                            {!bonus.noExpiry && bonus.expiresAt && (
                                              <span className={`text-xs flex items-center gap-1 ${urgencyClass}`}>
                                                <FiClock className="text-[10px]" />
                                                {daysLeft === 0 ? (t?.expired || "Expired") : daysLeft === 1 ? (t?.expiresToday || "Expires today") : `${daysLeft} ${t?.daysLeft || "days left"}`}
                                              </span>
                                            )}
                                            {bonus.noExpiry && (
                                              <span className="text-xs text-green-400 flex items-center gap-1">
                                                <FiClock className="text-[10px]" />
                                                {t?.neverExpires || "Never expires"}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              claimBonus(bonus.id, bonus.title, bonus.amount);
                                            }}
                                            disabled={claimingBonusId === bonus.id}
                                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {claimingBonusId === bonus.id ? (
                                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                              t?.claimNow || "Claim Now"
                                            )}
                                          </button>
                                          <FiChevronDown
                                            className={`text-gray-500 text-base sm:text-lg transition-transform duration-300 ${
                                              openDropdowns[bonus.id] ? "rotate-180" : ""
                                            }`}
                                          />
                                        </div>
                                      </div>
                                      
                                      <p className="text-gray-400 mt-2 text-xs sm:text-sm">
                                        {bonus.description}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {openDropdowns[bonus.id] && (
                                    <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t?.bonusDetails || "Bonus Details"}</p>
                                          <ul className="space-y-1 text-xs">
                                            <li className="flex justify-between">
                                              <span className="text-gray-400">{t?.amount || "Amount"}:</span>
                                              <span className="text-yellow-400 font-medium">৳{bonus.amount.toLocaleString()}</span>
                                            </li>
                                            <li className="flex justify-between">
                                              <span className="text-gray-400">{t?.type || "Type"}:</span>
                                              <span>{getBonusTypeName(bonus.bonusType)}</span>
                                            </li>
                                            {bonus.occasion && (
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">{t?.occasion || "Occasion"}:</span>
                                                <span>{bonus.occasion}</span>
                                              </li>
                                            )}
                                          </ul>
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{t?.validity || "Validity"}</p>
                                          <ul className="space-y-1 text-xs">
                                            <li className="flex justify-between">
                                              <span className="text-gray-400">{t?.created || "Created"}:</span>
                                              <span>{formatDate(bonus.createdAt)}</span>
                                            </li>
                                            <li className="flex justify-between">
                                              <span className="text-gray-400">{t?.expires || "Expires"}:</span>
                                              <span className={urgencyClass}>
                                                {bonus.noExpiry ? (t?.never || "Never") : formatDate(bonus.expiresAt)}
                                              </span>
                                            </li>
                                          </ul>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Betting Bonuses Section */}
                    <div>
                      {bettingBonuses.length === 0 ? (
                        <></>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {bettingBonuses.map((bonus) => {
                            const daysLeft = getBettingDaysLeft(bonus.distributionDate);
                            const urgencyClass = getUrgencyClass(daysLeft);
                            const isExpiringSoon = daysLeft !== null && daysLeft <= 2 && daysLeft > 0;
                            
                            return (
                              <div 
                                key={bonus.id} 
                                className={`bg-gradient-to-br from-[#1a1a1a] to-[#151515] border ${isExpiringSoon ? 'border-red-500/30' : 'border-[#2a2a2a]'} rounded-lg overflow-hidden transition-all hover:border-[#3a3a3a] hover:shadow-md`}
                              >
                                <div 
                                  className="p-3 sm:p-4 cursor-pointer"
                                  onClick={() => toggleDropdown(`betting-${bonus.id}`)}
                                >
                                  <div className="flex items-start">
                                    <div className="flex-shrink-0 mr-3">
                                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center ${
                                        bonus.bonusType === 'weekly' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                                      }`}>
                                        {bonus.bonusType === 'weekly' ? (
                                          <FaCalendarWeek className="text-blue-400 text-xl sm:text-2xl" />
                                        ) : (
                                          <MdCalendarMonth className="text-purple-400 text-xl sm:text-2xl" />
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1">
                                      <div className="flex flex-wrap items-start justify-between gap-2">
                                        <div>
                                          <h2 className="text-sm sm:text-base font-[600] text-white">
                                            {getBettingBonusName(bonus.bonusType)}
                                          </h2>
                                          <div className="flex flex-wrap items-center gap-2 mt-1">
                                            <span className="text-xs text-yellow-400 flex items-center gap-1">
                                              ৳{bonus.amount.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-gray-500 flex items-center gap-1">
                                              <FaChartLine className="text-[10px]" />
                                              {bonus.bonusRate} of ৳{bonus.betAmount.toLocaleString()}
                                            </span>
                                            <span className={`text-xs flex items-center gap-1 ${urgencyClass}`}>
                                              <FiClock className="text-[10px]" />
                                              {daysLeft === 0 ? "Expired" : daysLeft === 1 ? "Expires today" : `${daysLeft} days left`}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              claimBettingBonus(bonus.id, bonus.bonusType, bonus.amount);
                                            }}
                                            disabled={claimingBettingBonusId === bonus.id}
                                            className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-500 hover:to-yellow-600 rounded-lg text-xs sm:text-sm font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                          >
                                            {claimingBettingBonusId === bonus.id ? (
                                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                              "Claim Now"
                                            )}
                                          </button>
                                          <FiChevronDown
                                            className={`text-gray-500 text-base sm:text-lg transition-transform duration-300 ${
                                              openDropdowns[`betting-${bonus.id}`] ? "rotate-180" : ""
                                            }`}
                                          />
                                        </div>
                                      </div>
                                      
                                      <p className="text-gray-400 mt-2 text-xs sm:text-sm">
                                        {bonus.bonusType === 'weekly' 
                                          ? `You earned this bonus from your weekly betting activity. Based on your bet amount of ৳${bonus.betAmount.toLocaleString()}, you receive 0.8% as bonus.`
                                          : `You earned this bonus from your monthly betting activity. Based on your bet amount of ৳${bonus.betAmount.toLocaleString()}, you receive 0.5% as bonus.`
                                        }
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {openDropdowns[`betting-${bonus.id}`] && (
                                    <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Bonus Details</p>
                                          <ul className="space-y-1 text-xs">
                                            <li className="flex justify-between">
                                              <span className="text-gray-400">Bonus Amount:</span>
                                              <span className="text-yellow-400 font-medium">৳{bonus.amount.toLocaleString()}</span>
                                            </li>
                                            <li className="flex justify-between">
                                              <span className="text-gray-400">Bet Amount:</span>
                                              <span className="text-blue-400">৳{bonus.betAmount.toLocaleString()}</span>
                                            </li>
                                            <li className="flex justify-between">
                                              <span className="text-gray-400">Bonus Rate:</span>
                                              <span>{bonus.bonusRate}</span>
                                            </li>
                                            {bonus.weekNumber && (
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">Period:</span>
                                                <span>Week {bonus.weekNumber}, {bonus.year}</span>
                                              </li>
                                            )}
                                            {bonus.monthName && (
                                              <li className="flex justify-between">
                                                <span className="text-gray-400">Period:</span>
                                                <span>{bonus.monthName} {bonus.year}</span>
                                              </li>
                                            )}
                                          </ul>
                                        </div>
                                        <div>
                                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Validity</p>
                                          <ul className="space-y-1 text-xs">
                                            <li className="flex justify-between">
                                              <span className="text-gray-400">Distributed:</span>
                                              <span>{formatDate(bonus.distributionDate)}</span>
                                            </li>
                                            <li className="flex justify-between">
                                              <span className="text-gray-400">Expires:</span>
                                              <span className={urgencyClass}>
                                                {(() => {
                                                  const expiryDate = new Date(bonus.distributionDate);
                                                  expiryDate.setDate(expiryDate.getDate() + 3);
                                                  return formatDate(expiryDate);
                                                })()}
                                              </span>
                                            </li>
                                            <li className="flex justify-between">
                                              <span className="text-gray-400">Valid Period:</span>
                                              <span>3 days from distribution</span>
                                            </li>
                                          </ul>
                                        </div>
                                      </div>
                                      
                                      {daysLeft <= 1 && daysLeft > 0 && (
                                        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-center">
                                          <p className="text-xs text-red-400 flex items-center justify-center gap-1">
                                            <FiAlertCircle /> This bonus expires soon! Claim it now.
                                          </p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Bonus;