import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  FaEdit, 
  FaPlug, 
  FaKey, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaWifi, 
  FaSync, 
  FaExclamationTriangle,
  FaDesktop,
  FaMobileAlt,
  FaTabletAlt,
  FaChartLine,
  FaFilter,
  FaDownload,
  FaBell,
  FaCog,
  FaUserCircle,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye,
  FaTrash,
  FaRegClock,
  FaSignal
} from 'react-icons/fa';
import { FiWifiOff, FiRefreshCw, FiWifi } from 'react-icons/fi';
import { IoStatsChart, IoBatteryFull, IoBatteryHalf, IoBatteryDead } from 'react-icons/io5';
import { MdDevices, MdHistory, MdLocationOn, MdMemory } from 'react-icons/md';
import { TbDeviceMobile, TbDeviceDesktop, TbDeviceTablet } from 'react-icons/tb';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';
import { io } from 'socket.io-client';

const DeviceMonitoring = () => {
  const base_url = import.meta.env.VITE_BASE_API_URL || 'http://localhost:4500';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deviceTypeFilter, setDeviceTypeFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'lastSeen', direction: 'desc' });
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [showDeviceDetails, setShowDeviceDetails] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [validationStatus, setValidationStatus] = useState({
    valid: false,
    loading: false
  });
  const [integrationRunning, setIntegrationRunning] = useState(false);
  
  const [connectionStats, setConnectionStats] = useState({
    uptime: 0,
    messageCount: 0,
    lastUpdate: null,
    connectedAt: null
  });
  
  const [deviceStats, setDeviceStats] = useState({
    online: 0,
    offline: 0,
    total: 0,
    byType: {
      desktop: 0,
      mobile: 0,
      tablet: 0,
      other: 0
    }
  });
  
  const [devices, setDevices] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  
  const socketRef = useRef(null);
  const connectionAttemptRef = useRef(0);
  const uptimeIntervalRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load Opay settings and API key
  const loadOpaySettings = useCallback(async () => {
    try {
      setIsInitializing(true);
      const response = await axios.get(`${base_url}/api/opay/settings?cached=true`);
      
      if (response.data) {
        const { apiKey, validation, running } = response.data;
        setApiKey(apiKey || '');
        setValidationStatus({
          valid: validation?.valid || false,
          loading: false
        });
        setIntegrationRunning(running || false);
        
        if (apiKey && validation?.valid && running) {
          // Auto-connect if conditions are met
          initializeSocket();
        }
      }
    } catch (error) {
    } finally {
      setIsInitializing(false);
    }
  }, [base_url]);

  // Calculate device statistics
  const updateDeviceStats = useCallback((deviceList) => {
    const onlineCount = deviceList.filter(d => d.active === true).length;
    const offlineCount = deviceList.filter(d => d.active === false).length;
    const totalCount = deviceList.length;
    
    // Categorize devices by type
    const byType = {
      desktop: deviceList.filter(d => d.deviceType === 'desktop' || d.deviceType?.toLowerCase().includes('desktop')).length,
      mobile: deviceList.filter(d => d.deviceType === 'mobile' || d.deviceType?.toLowerCase().includes('mobile')).length,
      tablet: deviceList.filter(d => d.deviceType === 'tablet' || d.deviceType?.toLowerCase().includes('tablet')).length,
      other: deviceList.filter(d => {
        const type = d.deviceType?.toLowerCase();
        return !type || (!type.includes('desktop') && !type.includes('mobile') && !type.includes('tablet'));
      }).length
    };
    
    setDeviceStats({
      online: onlineCount,
      offline: offlineCount,
      total: totalCount,
      byType
    });
  }, []);

  // Format last seen time
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    
    try {
      const lastSeen = new Date(timestamp);
      const now = new Date();
      const diffMs = now - lastSeen;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMs < 60000) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return lastSeen.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get device type icon
  const getDeviceTypeIcon = (type) => {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower.includes('desktop')) return <FaDesktop className="text-blue-500" />;
    if (typeLower.includes('mobile')) return <FaMobileAlt className="text-purple-500" />;
    if (typeLower.includes('tablet')) return <FaTabletAlt className="text-green-500" />;
    return <MdDevices className="text-gray-500" />;
  };

  // Get battery icon based on percentage
  const getBatteryIcon = (percentage) => {
    if (!percentage) return null;
    if (percentage >= 80) return <IoBatteryFull className="text-green-500" />;
    if (percentage >= 30) return <IoBatteryHalf className="text-yellow-500" />;
    return <IoBatteryDead className="text-red-500" />;
  };

  // Get signal strength icon
  const getSignalIcon = (strength) => {
    if (!strength) return null;
    if (strength >= 70) return <FaSignal className="text-green-500" />;
    if (strength >= 40) return <FaSignal className="text-yellow-500" />;
    return <FaSignal className="text-red-500" />;
  };

  // Add activity log entry
  const addActivityLog = (type, message, details = {}) => {
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      type,
      message,
      details,
      icon: getLogIcon(type)
    };
    
    setActivityLog(prev => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 entries
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'connected': return '🔌';
      case 'disconnected': return '🔴';
      case 'new_device': return '🆕';
      case 'status_change': return '🔄';
      case 'error': return '❌';
      case 'reconnected': return '✅';
      case 'refresh': return '🔄';
      default: return '📝';
    }
  };

  // Initialize Socket.IO connection
  const initializeSocket = useCallback(() => {
    if (!apiKey || !validationStatus.valid || !integrationRunning) {
      return;
    }

    if (socketRef.current?.connected) {
      console.log('Socket already connected');
      return;
    }

    // Close existing connection if any
    if (socketRef.current) {
      socketRef.current.disconnect();
      clearInterval(uptimeIntervalRef.current);
    }

    // Create new Socket.IO connection
    const socket = io("https://api.oraclepay.org", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 30000,
      autoConnect: true,
      forceNew: true,
      query: {
        apiKey: apiKey,
        clientType: 'device-monitor',
        version: '2.0',
        timestamp: Date.now()
      }
    });

    socketRef.current = socket;

    // Start uptime counter
    let uptime = 0;
    uptimeIntervalRef.current = setInterval(() => {
      uptime++;
      setConnectionStats(prev => ({
        ...prev,
        uptime,
        lastUpdate: new Date()
      }));
    }, 1000);

    // Socket event handlers
    socket.on("connect", () => {
      console.log('Socket.IO connected successfully');
      setSocketConnected(true);
      setSocketError(null);
      connectionAttemptRef.current = 0;
      
      // Register API key with server
      socket.emit("viewer:registerApiKey", { apiKey });
      
      // Update connection stats
      setConnectionStats(prev => ({
        ...prev,
        connectedAt: new Date()
      }));
      
      // Log connection
      addActivityLog('connected', 'Connected to real-time monitoring server');
      toast.success('Real-time monitoring connected', {
        icon: '🔌',
        style: {
          background: '#10B981',
          color: '#fff',
        },
        duration: 3000
      });
    });

    socket.on("connect_error", (error) => {
      console.error('Socket connection error:', error);
      setSocketError(error.message || 'Connection failed');
      setSocketConnected(false);
      
      connectionAttemptRef.current++;
      
      if (connectionAttemptRef.current <= 3) {
        toast.error(`Connection attempt ${connectionAttemptRef.current}/3 failed`, {
          icon: '⚠️',
          duration: 2000
        });
      } else {
        toast.error('Failed to establish connection. Check API key and network.', {
          icon: '🔴',
          duration: 4000
        });
      }
      
      addActivityLog('error', `Connection error: ${error.message}`);
    });

    socket.on("disconnect", (reason) => {
      console.log('Socket disconnected:', reason);
      setSocketConnected(false);
      clearInterval(uptimeIntervalRef.current);
      
      if (reason === 'io server disconnect') {
        toast.error('Server disconnected the connection', { icon: '🔴' });
      } else if (reason === 'transport close' || reason === 'transport error') {
        toast.warning('Connection lost. Reconnecting...', { icon: '🔄' });
      }
      
      addActivityLog('disconnected', `Disconnected: ${reason}`);
    });

    // Handle initial devices snapshot
    socket.on("viewer:devices", (deviceList) => {
      console.log('Received device snapshot:', deviceList?.length || 0, 'devices');
      
      if (!Array.isArray(deviceList)) {
        console.error('Invalid device list received:', deviceList);
        addActivityLog('error', 'Invalid device data received from server');
        return;
      }
      
      // Transform device data for display
      const transformedDevices = deviceList.map(device => ({
        id: device.deviceId || `device-${Math.random().toString(36).substr(2, 9)}`,
        deviceId: device.deviceId,
        name: device.deviceName || device.deviceUserName || `Device ${device.deviceId?.substr(0, 8) || 'Unknown'}`,
        userName: device.deviceUserName,
        deviceType: device.deviceType || 'desktop',
        status: device.active ? 'online' : 'offline',
        active: device.active,
        lastSeen: device.lastSeen ? formatLastSeen(device.lastSeen) : 'Never',
        rawLastSeen: device.lastSeen,
        connectionTime: device.connectionTime || null,
        location: device.location || 'Unknown',
        ipAddress: device.ipAddress || 'N/A',
        os: device.os || 'Unknown',
        model: device.deviceModel || 'Unknown',
        version: device.version || '1.0.0',
        battery: device.battery || null,
        signal: device.signalStrength || null,
        memory: device.memory || null,
        storage: device.storage || null
      }));
      
      setDevices(transformedDevices);
      updateDeviceStats(transformedDevices);
      setIsLoading(false);
      
      setConnectionStats(prev => ({
        ...prev,
        messageCount: prev.messageCount + 1
      }));
      
      if (deviceList.length > 0) {
        toast.success(`Loaded ${deviceList.length} device${deviceList.length > 1 ? 's' : ''}`, {
          icon: '📱',
          duration: 2000
        });
      }
      
      addActivityLog('snapshot', `Received ${deviceList.length} devices`);
    });

    // Handle individual device updates
    socket.on("viewer:device", (deviceUpdate) => {
      console.log('Device update received:', deviceUpdate);
      
      if (!deviceUpdate?.deviceId) {
        console.error('Invalid device update received:', deviceUpdate);
        return;
      }
      
      setDevices(prevDevices => {
        const deviceIndex = prevDevices.findIndex(d => d.deviceId === deviceUpdate.deviceId);
        
        if (deviceIndex >= 0) {
          // Update existing device
          const updatedDevices = [...prevDevices];
          const oldDevice = updatedDevices[deviceIndex];
          const oldStatus = oldDevice.active;
          
          const updatedDevice = {
            ...oldDevice,
            status: deviceUpdate.active ? 'online' : 'offline',
            active: deviceUpdate.active,
            lastSeen: deviceUpdate.lastSeen ? formatLastSeen(deviceUpdate.lastSeen) : oldDevice.lastSeen,
            rawLastSeen: deviceUpdate.lastSeen || oldDevice.rawLastSeen,
            name: deviceUpdate.deviceName || deviceUpdate.deviceUserName || oldDevice.name,
            userName: deviceUpdate.deviceUserName || oldDevice.userName,
            deviceType: deviceUpdate.deviceType || oldDevice.deviceType,
            location: deviceUpdate.location || oldDevice.location,
            battery: deviceUpdate.battery || oldDevice.battery,
            signal: deviceUpdate.signalStrength || oldDevice.signal,
            os: deviceUpdate.os || oldDevice.os,
            model: deviceUpdate.deviceModel || oldDevice.model
          };
          
          updatedDevices[deviceIndex] = updatedDevice;
          
          // Update toast notification for status change
          if (oldStatus !== deviceUpdate.active) {
            const deviceName = updatedDevice.name || updatedDevice.deviceId;
            const statusText = deviceUpdate.active ? 'online' : 'offline';
            const icon = deviceUpdate.active ? '🟢' : '🔴';
            
            toast(`${icon} ${deviceName} is now ${statusText}`, {
              duration: 3000,
              position: 'bottom-right'
            });
            
            addActivityLog('status_change', `${deviceName} went ${statusText}`, { 
              deviceId: deviceUpdate.deviceId,
              oldStatus,
              newStatus: deviceUpdate.active
            });
          }
          
          // Update stats
          updateDeviceStats(updatedDevices.map(d => ({ 
            active: d.active,
            deviceType: d.deviceType 
          })));
          
          return updatedDevices;
        } else {
          // Add new device
          const newDevice = {
            id: deviceUpdate.deviceId,
            deviceId: deviceUpdate.deviceId,
            name: deviceUpdate.deviceName || deviceUpdate.deviceUserName || `Device ${deviceUpdate.deviceId?.substr(0, 8) || 'New'}`,
            userName: deviceUpdate.deviceUserName,
            deviceType: deviceUpdate.deviceType || 'desktop',
            status: deviceUpdate.active ? 'online' : 'offline',
            active: deviceUpdate.active,
            lastSeen: deviceUpdate.lastSeen ? formatLastSeen(deviceUpdate.lastSeen) : 'Never',
            rawLastSeen: deviceUpdate.lastSeen,
            location: deviceUpdate.location || 'Unknown',
            ipAddress: deviceUpdate.ipAddress || 'N/A',
            os: deviceUpdate.os || 'Unknown',
            model: deviceUpdate.deviceModel || 'Unknown',
            battery: deviceUpdate.battery || null,
            signal: deviceUpdate.signalStrength || null
          };
          
          const updatedDevices = [...prevDevices, newDevice];
          updateDeviceStats(updatedDevices.map(d => ({ 
            active: d.active,
            deviceType: d.deviceType 
          })));
          
          toast.info(`New device detected: ${newDevice.name}`, {
            icon: '🆕',
            duration: 3000
          });
          
          addActivityLog('new_device', `New device: ${newDevice.name}`, { deviceId: deviceUpdate.deviceId });
          
          return updatedDevices;
        }
      });
      
      setConnectionStats(prev => ({
        ...prev,
        messageCount: prev.messageCount + 1
      }));
    });

    // Handle errors from server
    socket.on("viewer:error", (error) => {
      console.error('Server error:', error);
      setSocketError(error.message || 'Unknown server error');
      
      let errorMessage = 'Server error';
      if (error.message?.toLowerCase().includes('invalid') || error.message?.toLowerCase().includes('expired')) {
        errorMessage = 'API key is invalid or expired';
        setValidationStatus(prev => ({ ...prev, valid: false }));
      } else if (error.message?.toLowerCase().includes('inactive')) {
        errorMessage = 'Subscription is inactive';
      }
      
      toast.error(errorMessage, { 
        icon: '❌',
        duration: 4000 
      });
      addActivityLog('error', `Server error: ${errorMessage}`);
    });

    // Handle reconnection events
    socket.io.on("reconnect", (attempt) => {
      console.log(`Reconnected after ${attempt} attempts`);
      toast.success('Reconnected to monitoring service', {
        icon: '✅',
        duration: 2000
      });
      addActivityLog('reconnected', `Reconnected after ${attempt} attempts`);
    });

    socket.io.on("reconnect_error", (error) => {
      console.error('Reconnection error:', error);
      addActivityLog('reconnect_error', `Reconnection failed: ${error.message}`);
    });

    socket.io.on("reconnect_failed", () => {
      toast.error('Failed to reconnect. Please refresh the page.', { 
        icon: '🔄',
        duration: 4000 
      });
      addActivityLog('reconnect_failed', 'Reconnection attempts exhausted');
    });

    // Connect the socket
    socket.connect();

    return () => {
      clearInterval(uptimeIntervalRef.current);
    };
  }, [apiKey, validationStatus.valid, integrationRunning, updateDeviceStats]);

  // Load settings on mount
  useEffect(() => {
    loadOpaySettings();
    
    // Set up auto-refresh for settings every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      loadOpaySettings();
    }, 30000);
    
    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      clearInterval(uptimeIntervalRef.current);
      clearInterval(refreshIntervalRef.current);
    };
  }, [loadOpaySettings]);

  // Auto-reconnect when conditions are met
  useEffect(() => {
    if (apiKey && validationStatus.valid && integrationRunning && !socketConnected && !socketRef.current) {
      const timer = setTimeout(() => {
        initializeSocket();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [apiKey, validationStatus.valid, integrationRunning, socketConnected, initializeSocket]);

  // Filter and sort devices
  const filteredAndSortedDevices = useMemo(() => {
    let filtered = devices;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(query) ||
        device.deviceId.toLowerCase().includes(query) ||
        (device.userName && device.userName.toLowerCase().includes(query)) ||
        (device.os && device.os.toLowerCase().includes(query)) ||
        (device.model && device.model.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(device => device.status === statusFilter);
    }
    
    // Apply device type filter
    if (deviceTypeFilter !== 'all') {
      filtered = filtered.filter(device => 
        device.deviceType?.toLowerCase().includes(deviceTypeFilter.toLowerCase())
      );
    }
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Handle dates for lastSeen sorting
        if (sortConfig.key === 'rawLastSeen' || sortConfig.key === 'lastSeen') {
          const aDate = a.rawLastSeen ? new Date(a.rawLastSeen).getTime() : 0;
          const bDate = b.rawLastSeen ? new Date(b.rawLastSeen).getTime() : 0;
          
          if (aDate < bDate) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aDate > bDate) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        }
        
        // Handle other sorts
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [devices, searchQuery, statusFilter, deviceTypeFilter, sortConfig]);

  // Handle sort request
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <FaSort className="text-gray-400" />;
    if (sortConfig.direction === 'asc') return <FaSortUp className="text-blue-500" />;
    return <FaSortDown className="text-blue-500" />;
  };

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    
    if (socketRef.current?.connected) {
      // Request fresh snapshot by re-registering API key
      socketRef.current.emit("viewer:registerApiKey", { apiKey });
      toast.info('Refreshing device list...', { 
        icon: '🔄',
        duration: 1500 
      });
      
      // Simulate loading for better UX
      setTimeout(() => setIsLoading(false), 1000);
    } else {
      toast.error('Not connected to monitoring service', { 
        icon: '🔴',
        duration: 3000 
      });
      setIsLoading(false);
      
      // Attempt to reconnect
      initializeSocket();
    }
    
    addActivityLog('refresh', 'Manual refresh triggered');
  }, [apiKey, initializeSocket]);

  // Toggle integration running state
  const toggleIntegration = async () => {
    try {
      const response = await axios.patch(`${base_url}/api/opay/running`, {
        running: !integrationRunning
      });
      
      if (response.data.success) {
        setIntegrationRunning(response.data.running);
        toast.success(`Integration ${response.data.running ? 'activated' : 'deactivated'}`, {
          icon: response.data.running ? '✅' : '⏸️'
        });
        
        if (response.data.running) {
          // Auto-connect if activated
          setTimeout(() => initializeSocket(), 1000);
        } else {
          // Disconnect if deactivated
          if (socketRef.current) {
            socketRef.current.disconnect();
            setSocketConnected(false);
          }
        }
      }
    } catch (error) {
      console.error('Failed to toggle integration:', error);
    }
  };

  const handleActivateIntegration = () => {
    if (!apiKey) {
      toast.error('API key is not configured', { icon: '🔑' });
      return;
    }
    
    if (!validationStatus.valid) {
      toast.error('API key validation failed', { icon: '❌' });
      return;
    }
    
    toggleIntegration();
  };

  const handleViewDeviceDetails = (device) => {
    setSelectedDevice(device);
    setShowDeviceDetails(true);
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(devices, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `devices_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast.success('Data exported successfully', { 
      icon: '💾',
      duration: 2000 
    });
    
    addActivityLog('export', 'Device data exported');
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setDeviceTypeFilter('all');
    setSortConfig({ key: 'lastSeen', direction: 'desc' });
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'online': return 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200';
      case 'offline': return 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <section className="font-nunito min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100">
      <Header toggleSidebar={toggleSidebar} />

      <div className="flex pt-16">
        <Sidebar isOpen={isSidebarOpen} />

        <main
          className={`transition-all duration-300 flex-1 p-4 md:p-6 overflow-y-auto min-h-[calc(100vh-64px)] ${
            isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'
          }`}
        >
          <div className="w-full mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Device Monitoring Dashboard</h1>
                  <p className="text-gray-600 mt-2 flex items-center flex-wrap gap-2">
                    <span>Real-time monitoring and management of connected devices</span>
                    <span className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                    {socketConnected && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Live
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                    socketConnected 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800' 
                      : 'bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="font-medium">{socketConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                  <button 
                    onClick={handleRefresh}
                    disabled={isLoading}
                    className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    title="Refresh"
                  >
                    <FiRefreshCw className={`text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
              
              {/* Connection Status Banner */}
              {socketError && (
                <div className="bg-gradient-to-r from-red-50 to-pink-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center">
                      <FaExclamationTriangle className="text-red-500 mr-3 text-xl flex-shrink-0" />
                      <div>
                        <p className="text-red-800 font-medium">Connection Error</p>
                        <p className="text-red-600 text-sm break-words">{socketError}</p>
                      </div>
                    </div>
                    <button 
                      onClick={handleActivateIntegration}
                      className="sm:ml-auto bg-red-100 hover:bg-red-200 text-red-800 font-medium py-2 px-4 rounded-lg transition-colors text-sm flex-shrink-0"
                    >
                      Reconnect
                    </button>
                  </div>
                </div>
              )}

              {/* Integration Requirements Warning */}
              {(!apiKey || !validationStatus.valid || !integrationRunning) && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 rounded-r-lg p-4 mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center">
                      <FaExclamationTriangle className="text-yellow-500 mr-3 text-xl flex-shrink-0" />
                      <div>
                        <p className="text-yellow-800 font-medium">Integration Requirements</p>
                        <p className="text-yellow-600 text-sm">
                          {!apiKey ? 'API key is missing' : 
                           !validationStatus.valid ? 'API key validation failed' : 
                           'Integration is not running'}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={handleActivateIntegration}
                      className="sm:ml-auto bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-2 px-4 rounded-lg transition-colors text-sm flex-shrink-0"
                    >
                      Activate Integration
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Connection Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 md:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium mb-1">Uptime</p>
                    <p className="text-xl md:text-2xl font-bold text-blue-800">{formatUptime(connectionStats.uptime)}</p>
                  </div>
                  <div className="bg-blue-100 p-2 md:p-3 rounded-full">
                    <FaRegClock className="text-blue-600 text-lg md:text-xl" />
                  </div>
                </div>
                <p className="text-xs text-blue-500 mt-2">Time connected to server</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200 rounded-xl p-4 md:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium mb-1">Messages</p>
                    <p className="text-xl md:text-2xl font-bold text-green-800">{connectionStats.messageCount}</p>
                  </div>
                  <div className="bg-green-100 p-2 md:p-3 rounded-full">
                    <IoStatsChart className="text-green-600 text-lg md:text-xl" />
                  </div>
                </div>
                <p className="text-xs text-green-500 mt-2">Updates received</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 md:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium mb-1">Online Devices</p>
                    <p className="text-xl md:text-2xl font-bold text-purple-800">{deviceStats.online}</p>
                  </div>
                  <div className="bg-purple-100 p-2 md:p-3 rounded-full">
                    <FaWifi className="text-purple-600 text-lg md:text-xl" />
                  </div>
                </div>
                <p className="text-xs text-purple-500 mt-2">Currently active</p>
              </div>

              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-4 md:p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 font-medium mb-1">Total Devices</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-800">{deviceStats.total}</p>
                  </div>
                  <div className="bg-gray-100 p-2 md:p-3 rounded-full">
                    <MdDevices className="text-gray-600 text-lg md:text-xl" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">All registered devices</p>
              </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Left Column - Device List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="p-4 md:p-6 border-b border-gray-200">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800">Connected Devices</h2>
                        <p className="text-gray-600 text-sm mt-1">
                          {filteredAndSortedDevices.length} of {deviceStats.total} devices
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search devices..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="flex gap-2">
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="all">All Status</option>
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                          </select>
                          <select
                            value={deviceTypeFilter}
                            onChange={(e) => setDeviceTypeFilter(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          >
                            <option value="all">All Types</option>
                            <option value="desktop">Desktop</option>
                            <option value="mobile">Mobile</option>
                            <option value="tablet">Tablet</option>
                          </select>
                          {(searchQuery || statusFilter !== 'all' || deviceTypeFilter !== 'all') && (
                            <button
                              onClick={clearFilters}
                              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Device
                          </th>
                          <th 
                            className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('status')}
                          >
                            <div className="flex items-center">
                              Status
                              {getSortIcon('status')}
                            </div>
                          </th>
                          <th 
                            className="px-4 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                            onClick={() => requestSort('rawLastSeen')}
                          >
                            <div className="flex items-center">
                              Last Seen
                              {getSortIcon('rawLastSeen')}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                       {isLoading ? (
  <tr>
    <td colSpan="4" className="px-4 md:px-6 py-8 md:py-12 text-center">
      <div className="flex flex-col items-center justify-center space-y-6">
        {/* Main Spinner */}
        <div className="relative">
          {/* Outer ring */}
          <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-blue-100 rounded-full"></div>
          
          {/* Animated gradient ring */}
          <div className="absolute top-0 left-0 w-16 h-16 md:w-20 md:h-20 border-4 border-transparent rounded-full 
            border-t-blue-500 border-r-blue-400 border-b-cyan-500 border-l-cyan-400 animate-spin"></div>
          
          {/* Inner dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
            w-4 h-4 md:w-6 md:h-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full 
            animate-pulse shadow-lg shadow-blue-200"></div>
        </div>

        {/* Loading text with animation */}
        <div className="space-y-2">
          <p className="text-gray-700 font-medium text-lg">Loading Devices</p>
          <div className="flex items-center justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          
          {/* Status messages */}
          <div className="mt-4 space-y-1">
            {isInitializing ? (
              <div className="flex items-center justify-center text-sm text-blue-600">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                Loading integration settings
              </div>
            ): (
              <div className="text-sm text-gray-500">
                
              </div>
            )}
          </div>
        </div>
      </div>
    </td>
  </tr>
): filteredAndSortedDevices.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 md:px-6 py-8 md:py-12 text-center">
                              <div className="flex flex-col items-center">
                                <div className="text-gray-400 text-4xl md:text-5xl mb-3">
                                  {searchQuery ? '🔍' : (socketConnected ? '📱' : '🔌')}
                                </div>
                                <p className="text-gray-600 font-medium">
                                  {searchQuery ? 'No devices match your search' : 
                                   !socketConnected ? 'Not connected to monitoring service' : 
                                   'No devices found'}
                                </p>
                                <p className="text-gray-500 text-sm mt-1 max-w-md">
                                  {searchQuery ? 'Try adjusting your search criteria' : 
                                   !socketConnected ? 'Activate integration to start monitoring' : 
                                   'Devices will appear here when they connect'}
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredAndSortedDevices.map((device) => (
                            <tr key={device.id} className="hover:bg-gray-50 transition-colors group">
                              <td className="px-4 md:px-6 py-4">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 mr-3">
                                    <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors">
                                      {getDeviceTypeIcon(device.deviceType)}
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-medium text-gray-900 truncate">{device.name}</div>
                                    {device.userName && (
                                      <div className="text-sm text-gray-500 truncate flex items-center">
                                        <FaUserCircle className="mr-1 flex-shrink-0" />
                                        <span className="truncate">{device.userName}</span>
                                      </div>
                                    )}
                                    <div className="text-xs text-gray-400 font-mono truncate mt-1">
                                      {device.os} • {device.deviceId?.substring(0, 8)}...
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 md:px-6 py-4">
                                <div className="flex flex-col">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${getStatusBadgeClass(device.status)}`}>
                                    {device.status === 'online' ? 
                                      <FaWifi className="mr-1 text-xs" /> : 
                                      <FiWifiOff className="mr-1 text-xs" />
                                    }
                                    {device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                                  </span>
                                  <div className="flex items-center gap-2 mt-1">
                                    {device.battery && (
                                      <span className="text-xs text-gray-500 flex items-center">
                                        {getBatteryIcon(device.battery)}
                                        <span className="ml-1">{device.battery}%</span>
                                      </span>
                                    )}
                                    {device.signal && (
                                      <span className="text-xs text-gray-500 flex items-center">
                                        {getSignalIcon(device.signal)}
                                        <span className="ml-1">{device.signal}%</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 md:px-6 py-4">
                                <div className="text-gray-600 text-sm">
                                  {device.lastSeen}
                                </div>
                                {device.location && device.location !== 'Unknown' && (
                                  <div className="text-xs text-gray-400 truncate flex items-center mt-1">
                                    <MdLocationOn className="mr-1 flex-shrink-0" />
                                    <span className="truncate">{device.location}</span>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="px-4 md:px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                      <div className="text-sm text-gray-600">
                        Showing <span className="font-medium">{filteredAndSortedDevices.length}</span> of {deviceStats.total} devices
                      </div>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setShowActivityLog(true)}
                          className="flex items-center space-x-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors text-sm"
                        >
                          <MdHistory />
                          <span>Activity Log</span>
                        </button>
                        <button
                          onClick={handleExportData}
                          disabled={devices.length === 0}
                          className="flex items-center space-x-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FaDownload />
                          <span>Export</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Status & Activity */}
              <div className="space-y-6">
                {/* Integration Status Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Integration Status</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${
                          integrationRunning ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <FaPlug className={integrationRunning ? 'text-green-600' : 'text-red-600'} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Integration</p>
                          <p className="text-sm text-gray-500">Monitoring service</p>
                        </div>
                      </div>
                      <button
                        onClick={toggleIntegration}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          integrationRunning ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            integrationRunning ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${
                          apiKey ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <FaKey className={apiKey ? 'text-green-600' : 'text-red-600'} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">API Key</p>
                          <p className="text-sm text-gray-500">Authentication</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        apiKey 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {apiKey ? 'Configured' : 'Missing'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${
                          validationStatus.valid ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {validationStatus.valid ? 
                            <FaCheckCircle className="text-green-600" /> : 
                            <FaTimesCircle className="text-red-600" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Validation</p>
                          <p className="text-sm text-gray-500">System check</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        validationStatus.valid 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {validationStatus.valid ? 'Passed' : 'Failed'}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${
                          socketConnected ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {socketConnected ? 
                            <FaWifi className="text-green-600" /> : 
                            <FiWifiOff className="text-red-600" />
                          }
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Connection</p>
                          <p className="text-sm text-gray-500">Real-time socket</p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        socketConnected 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {socketConnected ? 'Connected' : 'Disconnected'}
                      </div>
                    </div>
                  </div>

                  {!integrationRunning && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <button
                        onClick={handleActivateIntegration}
                        disabled={!apiKey || validationStatus.loading}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-all hover:shadow-lg"
                      >
                        {validationStatus.loading ? 'Validating...' : 'Activate Integration'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Device Details Modal */}
      {showDeviceDetails && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Device Details</h3>
                <button
                  onClick={() => setShowDeviceDetails(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl bg-gray-100">
                    {getDeviceTypeIcon(selectedDevice.deviceType)}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800 truncate">{selectedDevice.name}</h4>
                    {selectedDevice.userName && (
                      <p className="text-gray-600 truncate">{selectedDevice.userName}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Status</p>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusBadgeClass(selectedDevice.status)}`}>
                      {selectedDevice.status === 'online' ? 
                        <FaWifi className="mr-1 text-xs" /> : 
                        <FiWifiOff className="mr-1 text-xs" />
                      }
                      {selectedDevice.status.toUpperCase()}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Device Type</p>
                    <p className="font-medium text-gray-800 capitalize">{selectedDevice.deviceType}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">OS</p>
                    <p className="font-medium text-gray-800">{selectedDevice.os}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-500">Last Seen</p>
                    <p className="font-medium text-gray-800">{selectedDevice.lastSeen}</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-gray-700 mb-3">Additional Information</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Device ID</span>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded truncate max-w-[200px]">{selectedDevice.deviceId}</code>
                    </div>
                    {selectedDevice.location && selectedDevice.location !== 'Unknown' && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Location</span>
                        <span className="font-medium flex items-center">
                          <MdLocationOn className="mr-1" />
                          {selectedDevice.location}
                        </span>
                      </div>
                    )}
                    {selectedDevice.battery && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Battery</span>
                        <span className="font-medium flex items-center">
                          {getBatteryIcon(selectedDevice.battery)}
                          <span className="ml-1">{selectedDevice.battery}%</span>
                        </span>
                      </div>
                    )}
                    {selectedDevice.signal && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Signal</span>
                        <span className="font-medium flex items-center">
                          {getSignalIcon(selectedDevice.signal)}
                          <span className="ml-1">{selectedDevice.signal}%</span>
                        </span>
                      </div>
                    )}
                    {selectedDevice.model && selectedDevice.model !== 'Unknown' && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Model</span>
                        <span className="font-medium">{selectedDevice.model}</span>
                      </div>
                    )}
                    {selectedDevice.version && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Version</span>
                        <span className="font-medium">{selectedDevice.version}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowDeviceDetails(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                    <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-colors">
                      Manage Device
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {showActivityLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Activity Log</h3>
                <button
                  onClick={() => setShowActivityLog(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                {activityLog.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MdHistory className="text-4xl mx-auto mb-3 text-gray-300" />
                    <p>No activity yet</p>
                    <p className="text-sm mt-1">Activity will appear here as events occur</p>
                  </div>
                ) : (
                  activityLog.map((log) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100">
                      <div className="text-xl mt-1">{log.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">{log.message}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <FaRegClock className="mr-1" />
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' • '}
                          {new Date(log.timestamp).toLocaleDateString()}
                        </p>
                        {log.details && Object.keys(log.details).length > 0 && (
                          <div className="mt-2 text-xs text-gray-400">
                            {Object.entries(log.details).map(([key, value]) => (
                              <span key={key} className="mr-2">
                                {key}: <span className="font-medium">{String(value)}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {activityLog.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">
                      {activityLog.length} log entries
                    </span>
                    <button
                      onClick={() => setActivityLog([])}
                      className="text-sm text-red-600 hover:text-red-800 hover:bg-red-50 px-3 py-1 rounded-lg transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DeviceMonitoring;