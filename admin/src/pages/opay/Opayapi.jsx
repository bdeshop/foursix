import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaKey, FaCopy, FaCheck, FaSync, FaDownload, 
  FaToggleOn, FaToggleOff, FaCheckCircle, 
  FaTimesCircle, FaCalendarAlt, FaGlobe, 
  FaUsers, FaMobileAlt, FaHistory, FaPlug
} from 'react-icons/fa';
import { FiChevronRight } from 'react-icons/fi';
import { MdTimer, MdDomain } from 'react-icons/md';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Opayapi = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState(null);
  const [validationHistory, setValidationHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [runningUpdating, setRunningUpdating] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const [subscriptionData, setSubscriptionData] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isValid: false,
    plan: "No Plan",
    primaryDomain: "",
    domains: [],
    activeCount: 0,
    deviceCount: 0,
    endDate: "N/A",
    latestEndDate: "N/A",
    expireDate: "No subscription",
    subscriptionId: ""
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const copyToClipboard = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const loadSettings = useCallback(async (useCached = false) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${base_url}/api/opay/settings?cached=${useCached}`);
      if (response.data) {
        const { apiKey, validation, running, updatedAt } = response.data;
        
        if (apiKey) setApiKey(apiKey);
        if (validation) {
          updateSubscriptionData(validation);
        } else {
          resetSubscriptionData();
        }
        if (running !== undefined) setRunning(running);
        if (updatedAt) setLastUpdated(new Date(updatedAt).toLocaleString());
        
        if (validation && updatedAt) {
          setValidationHistory(prev => [
            {
              timestamp: new Date(updatedAt).toLocaleString(),
              valid: validation.valid || false,
              reason: validation.reason || (validation.valid ? 'Valid' : 'Invalid'),
              deviceCount: validation.deviceCount || 0,
              activeNumberCount: validation.activeNumberCount || 0
            },
            ...prev.slice(0, 4)
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  }, [base_url]);

  const resetSubscriptionData = () => {
    setSubscriptionData({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isValid: false,
      plan: "No Plan",
      primaryDomain: "",
      domains: [],
      activeCount: 0,
      deviceCount: 0,
      endDate: "N/A",
      latestEndDate: "N/A",
      expireDate: "No subscription",
      subscriptionId: ""
    });
  };

  const calculateTimeUntilExpiration = useCallback((endDate) => {
    if (!endDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const end = new Date(endDate);
    const now = new Date();
    const diffMs = end - now;
    
    if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  }, []);

  const updateSubscriptionData = useCallback((validation) => {
    if (!validation) {
      resetSubscriptionData();
      return;
    }
    
    const timeUntilExpiry = calculateTimeUntilExpiration(validation.endDate);
    
    setSubscriptionData({
      days: timeUntilExpiry.days,
      hours: timeUntilExpiry.hours,
      minutes: timeUntilExpiry.minutes,
      seconds: timeUntilExpiry.seconds,
      isValid: validation.valid || false,
      plan: validation.plan?.name || 'Standard Plan',
      primaryDomain: validation.primaryDomain || 'No domain',
      domains: validation.domains || [],
      activeCount: validation.activeNumberCount || 0,
      deviceCount: validation.deviceCount || 0,
      endDate: formatDate(validation.endDate),
      latestEndDate: formatDate(validation.latestEndDate),
      expireDate: formatTimeDifference(validation.endDate),
      subscriptionId: validation.subscriptionId || ''
    });
  }, [calculateTimeUntilExpiration]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTimeDifference = (dateString) => {
    if (!dateString) return 'No expiration date';
    try {
      const end = new Date(dateString);
      const now = new Date();
      const diffMs = end - now;
      
      if (diffMs <= 0) return 'Expired';
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      return `${diffDays} days`;
    } catch (error) {
      return 'Invalid date';
    }
  };

  const validateApiKey = useCallback(async (showToast = true) => {
    if (!apiKey) {
      toast.error('API Key is required');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      const response = await axios.post(`${base_url}/api/opay/validate`, { apiKey });
      
      if (response.data && response.data.success) {
        updateSubscriptionData(response.data);
        
        setValidationHistory(prev => [
          {
            timestamp: new Date().toLocaleString(),
            valid: response.data.valid || false,
            reason: response.data.reason || 'Valid',
            deviceCount: response.data.deviceCount || 0,
            activeNumberCount: response.data.activeNumberCount || 0
          },
          ...prev.slice(0, 4)
        ]);

        if (showToast) {
          toast.success('API Key validated successfully');
        }
      } else {
        throw new Error(response.data?.message || 'Validation failed');
      }
    } catch (error) {
      console.error('Validation error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Validation failed';
      setValidationError(errorMessage);
      
      setValidationHistory(prev => [
        {
          timestamp: new Date().toLocaleString(),
          valid: false,
          reason: 'Failed',
          deviceCount: 0,
          activeNumberCount: 0,
          error: errorMessage
        },
        ...prev.slice(0, 4)
      ]);
      
      toast.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  }, [apiKey, base_url, updateSubscriptionData]);

  const toggleRunning = async () => {
    setRunningUpdating(true);
    try {
      const newState = !running;
      const response = await axios.post(`${base_url}/api/opay/toggle-running`, { running: newState });
      
      if (response.data.success) {
        setRunning(newState);
        toast.success(`Integration ${newState ? 'activated' : 'deactivated'}`);
      } else {
        throw new Error(response.data.message || 'Failed to update running state');
      }
    } catch (error) {
      console.error('Failed to toggle running state:', error);
      toast.error('Failed to update running state');
    } finally {
      setRunningUpdating(false);
    }
  };

  const handleValidateClick = () => {
    validateApiKey(true);
  };

  const handleRefreshSettings = async () => {
    try {
      setIsLoading(true);
      await loadSettings(false);
    } catch (error) {
      console.error('Failed to refresh settings:', error);
      toast.error('Failed to refresh settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post(`${base_url}/api/opay/save-key`, { apiKey });
      
      if (response.data.success) {
        toast.success('API Key saved successfully');
        await loadSettings(true);
      } else {
        throw new Error(response.data.message || 'Failed to save API key');
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      toast.error(error.message || 'Failed to save API key');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings(true);
    
    const interval = setInterval(() => {
      if (apiKey && subscriptionData.isValid) {
        loadSettings(false);
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [loadSettings, apiKey, subscriptionData.isValid]);

  useEffect(() => {
    if (!subscriptionData.isValid) return;
    
    const timer = setInterval(() => {
      setSubscriptionData(prev => {
        let { seconds, minutes, hours, days } = prev;
        
        if (seconds > 0) {
          seconds -= 1;
        } else {
          if (minutes > 0) {
            seconds = 59;
            minutes -= 1;
          } else {
            if (hours > 0) {
              minutes = 59;
              seconds = 59;
              hours -= 1;
            } else {
              if (days > 0) {
                hours = 23;
                minutes = 59;
                seconds = 59;
                days -= 1;
              } else {
                clearInterval(timer);
                return { ...prev, days: 0, hours: 0, minutes: 0, seconds: 0 };
              }
            }
          }
        }
        
        return { ...prev, days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [subscriptionData.isValid]);

  const getStatusColor = () => {
    if (isValidating) return 'border-blue-500 bg-blue-50';
    if (subscriptionData.isValid) return 'border-green-500 bg-green-50';
    if (validationError) return 'border-red-500 bg-red-50';
    return 'border-gray-400 bg-gray-50';
  };

  const getStatusText = () => {
    if (isValidating) return 'Validating...';
    if (subscriptionData.isValid) return 'Valid';
    if (validationError) return 'Invalid';
    return 'Not Validated';
  };

  const getStatusIcon = () => {
    if (isValidating) return <FaSync className="animate-spin text-blue-500" />;
    if (subscriptionData.isValid) return <FaCheckCircle className="text-green-500" />;
    return <FaTimesCircle className="text-red-500" />;
  };

  return (
    <section className="font-sans min-h-screen bg-gray-50">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-16">
        <Sidebar isOpen={isSidebarOpen} />
        <main
          className={`transition-all duration-300  flex-1 p-4 md:p-6 overflow-y-auto min-h-[calc(100vh-64px)] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold pt-[30px] text-gray-800">Opay API Management</h1>
                <p className="text-gray-600 mt-1">
                  Manage API keys and monitor subscription status
                  {lastUpdated && (
                    <span className="ml-2 text-gray-500 text-sm">
                      • Last updated: {lastUpdated}
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <button
                  onClick={toggleRunning}
                  disabled={runningUpdating}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                    running
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  } ${runningUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {running ? (
                    <>
                      <FaToggleOn className="mr-2" />
                      Active
                    </>
                  ) : (
                    <>
                      <FaToggleOff className="mr-2" />
                      Inactive
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleRefreshSettings}
                  disabled={isLoading}
                  className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                >
                  <FaSync className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* API Key Section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="p-2 rounded-lg bg-blue-100 mr-3">
                  <FaKey className="text-xl text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">API Key</h2>
                  <p className="text-gray-600 text-sm">Configure your Opay API key</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={saveApiKey}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Save Key
                </button>
                
                <button
                  onClick={handleValidateClick}
                  disabled={isValidating || !apiKey}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isValidating
                      ? 'bg-blue-500 text-white cursor-wait'
                      : subscriptionData.isValid
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  } ${!apiKey ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isValidating ? (
                    <FaSync className="animate-spin" />
                  ) : (
                    'Validate'
                  )}
                </button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Opay API Key"
                    className="flex-1 border border-gray-300 rounded-l-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={() => copyToClipboard(apiKey)}
                    disabled={!apiKey}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-r-lg border border-l-0 border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? <FaCheck /> : <FaCopy />}
                  </button>
                </div>
              </div>
              
              {/* Status Display */}
              <div className={`flex items-center justify-between p-4 rounded-lg border ${getStatusColor()}`}>
                <div className="flex items-center">
                  {getStatusIcon()}
                  <span className="ml-2 font-medium">{getStatusText()}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {validationError || 'Ready for validation'}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg bg-blue-100 mr-3">
                  <FaMobileAlt className="text-xl text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Devices</p>
                  <p className="text-2xl font-semibold text-gray-800 mt-1">{subscriptionData.deviceCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg bg-green-100 mr-3">
                  <FaUsers className="text-xl text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Numbers</p>
                  <p className="text-2xl font-semibold text-gray-800 mt-1">{subscriptionData.activeCount}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <div className="p-2 rounded-lg bg-purple-100 mr-3">
                  <FaGlobe className="text-xl text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Domains</p>
                  <p className="text-2xl font-semibold text-gray-800 mt-1">{subscriptionData.domains.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Subscription Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Subscription Details</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">Plan</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {subscriptionData.plan}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Primary Domain</label>
                    <p className="text-gray-800">{subscriptionData.primaryDomain || 'No domain set'}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">All Domains</label>
                    <div className="space-y-1">
                      {subscriptionData.domains.length > 0 ? (
                        subscriptionData.domains.map((domain, index) => (
                          <div key={index} className="flex items-center text-gray-800">
                            <FiChevronRight className="text-gray-400 mr-1" />
                            {domain}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 italic">No domains registered</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Subscription Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Subscription Timeline</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Subscription ID</label>
                  <div className="flex items-center">
                    <code className="flex-1 bg-gray-50 px-3 py-2 rounded-lg text-gray-800 font-mono text-sm">
                      {subscriptionData.subscriptionId || 'No subscription ID'}
                    </code>
                    <button
                      onClick={() => copyToClipboard(subscriptionData.subscriptionId)}
                      disabled={!subscriptionData.subscriptionId}
                      className="ml-2 p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                    >
                      <FaCopy />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600 mb-1">End Date</label>
                    <p className="text-gray-800 font-medium">{subscriptionData.endDate}</p>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Latest End Date</label>
                    <p className="text-gray-800 font-medium">{subscriptionData.latestEndDate}</p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  subscriptionData.expireDate.includes('Expired') 
                    ? 'bg-red-50 border border-red-200' 
                    : 'bg-green-50 border border-green-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Expires In</p>
                      <p className={`text-lg font-semibold mt-1 ${
                        subscriptionData.expireDate.includes('Expired') ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {subscriptionData.expireDate}
                      </p>
                    </div>
                    <MdTimer className="text-2xl text-gray-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Countdown Timer */}
          {subscriptionData.isValid && subscriptionData.days > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="p-2 rounded-lg bg-orange-100 mr-3">
                  <FaCalendarAlt className="text-xl text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Subscription Countdown</h3>
                  <p className="text-gray-600 text-sm">Time remaining until expiration</p>
                </div>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800 mb-1">{subscriptionData.days}</div>
                  <div className="text-sm text-gray-600">Days</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800 mb-1">{subscriptionData.hours}</div>
                  <div className="text-sm text-gray-600">Hours</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800 mb-1">{subscriptionData.minutes}</div>
                  <div className="text-sm text-gray-600">Minutes</div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-800 mb-1">{subscriptionData.seconds}</div>
                  <div className="text-sm text-gray-600">Seconds</div>
                </div>
              </div>
            </div>
          )}

          {/* History & Webhooks */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Validation History */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="p-2 rounded-lg bg-gray-100 mr-3">
                  <FaHistory className="text-xl text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Validation History</h3>
                  <p className="text-gray-600 text-sm">Recent validation attempts</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {validationHistory.length > 0 ? (
                  validationHistory.map((entry, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border ${
                        entry.valid 
                          ? 'border-green-200 bg-green-50' 
                          : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                          entry.valid 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {entry.valid ? 'Valid' : 'Invalid'}
                        </span>
                        <span className="text-xs text-gray-500">{entry.timestamp}</span>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        Devices: {entry.deviceCount} • Numbers: {entry.activeNumberCount}
                        {entry.error && (
                          <div className="mt-1 text-red-500 truncate">{entry.error}</div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <FaHistory className="text-gray-300 text-3xl mx-auto mb-2" />
                    <p className="text-gray-500">No validation history</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Webhook Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center mb-6">
                <div className="p-2 rounded-lg bg-purple-100 mr-3">
                  <FaPlug className="text-xl text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Webhook Configuration</h3>
                  <p className="text-gray-600 text-sm">Callback URLs and settings</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Deposit Callback URL</label>
                  <code className="block w-full bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-800 font-mono break-all">
                    {base_url}/api/opay/callback-deposit
                  </code>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Status Callback URL</label>
                  <code className="block w-full bg-gray-50 px-3 py-2 rounded-lg text-sm text-gray-800 font-mono break-all">
                    {base_url}/api/opay/status
                  </code>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-700">Integration Status</p>
                    <p className="text-sm text-gray-600">Current running state</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    running 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {running ? 'Running' : 'Stopped'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-center text-gray-500 text-sm">
              Securely validated via Opay API • 
              <a 
                href="https://api.oraclepay.org/docs" 
                target="_blank" 
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 hover:text-blue-800 hover:underline"
              >
                View Documentation
              </a>
            </p>
          </div>
        </main>
      </div>
    </section>
  );
};

export default Opayapi;