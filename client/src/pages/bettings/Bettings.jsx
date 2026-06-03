import React, { useState, useEffect, useContext } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { Header } from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import { FiSliders } from "react-icons/fi";
import { FaFolderOpen, FaSpinner } from "react-icons/fa";
import axios from "axios";
import { LanguageContext } from "../../context/LanguageContext";

const Bettings = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("settled");
  const [bettingRecords, setBettingRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get language context
  const { language, t } = useContext(LanguageContext);

  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const fetchBettingRecords = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${base_url}/api/user/betting-records/${user.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log(response);
      if (response.data.success) {
        setBettingRecords(response.data.data);
      }
    } catch (err) {
      setError(t?.failedToFetchBettingRecords || "Failed to fetch betting records");
      console.error("Error fetching betting records:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch betting records
  useEffect(() => {
    fetchBettingRecords();
  }, []);

  // Filter records based on active tab
  const filteredRecords = bettingRecords.filter(record => {
    if (activeTab === "settled") {
      return record.status === "won" || record.status === "lost";
    } else {
      return record.status === "pending";
    }
  });

  // Format date
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    if (language.code === 'bn') {
      return new Date(dateString).toLocaleDateString('bn-BD', options);
    }
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Format currency
  const formatCurrency = (amount, currency = "BDT") => {
    return new Intl.NumberFormat(language.code === 'bn' ? 'bn-BD' : 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Get status badge style and text
  const getStatusBadge = (status) => {
    const statusStyles = {
      won: "bg-green-500/20 text-green-400 border border-green-500/30",
      lost: "bg-red-500/20 text-red-400 border border-red-500/30",
      pending: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
    };
    
    const statusText = {
      won: t?.won || "WON",
      lost: t?.lost || "LOST",
      pending: t?.pending || "PENDING"
    };
    
    return {
      className: `px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status] || 'bg-gray-500/20 text-gray-400'}`,
      text: statusText[status] || status.toUpperCase()
    };
  };

  const getTranslatedStatus = (status) => {
    const statusMap = {
      won: t?.won || "Won",
      lost: t?.lost || "Lost",
      pending: t?.pending || "Pending"
    };
    return statusMap[status] || status;
  };

  const getTranslatedGameType = (type) => {
    const typeMap = {
      cricket: t?.cricket || "Cricket",
      football: t?.football || "Football",
      tennis: t?.tennis || "Tennis",
      basketball: t?.basketball || "Basketball",
      casino: t?.casino || "Casino",
      slots: t?.slots || "Slots",
      crash: t?.crash || "Crash",
      table: t?.table || "Table",
      fishing: t?.fishing || "Fishing",
      arcade: t?.arcade || "Arcade",
      lottery: t?.lottery || "Lottery"
    };
    return typeMap[type] || type;
  };

  return (
    <div className="h-screen overflow-hidden font-poppins bg-[#1a1a1a] text-white">
      {/* Header */}
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex h-[calc(100vh-56px)]">
        {/* Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} />

        {/* Main Area */}
        <div className="w-full overflow-y-auto">
          <div className="mx-auto w-full min-h-screen max-w-screen-xl md:px-4 py-4 px-2">
            {/* Top Section */}
            <div className="flex flex-col space-y-4 mb-6">
              {/* Title */}
              <h2 className="text-xl font-[500]">{t?.bettingRecords || "Betting Records"}</h2>

              {/* Tabs and Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center border-b border-gray-800 w-full sm:w-auto">
                  <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === "settled"
                        ? "border-b-2 border-green-500 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setActiveTab("settled")}
                  >
                    {t?.settled || "Settled"}
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeTab === "unsettled"
                        ? "border-b-2 border-green-500 text-white"
                        : "text-gray-400 hover:text-white"
                    }`}
                    onClick={() => setActiveTab("unsettled")}
                  >
                    {t?.unsettled || "Unsettled"}
                  </button>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button className="px-3 py-1.5 bg-[#2c2c2c] text-sm rounded-md hover:bg-[#3a3a3a] transition whitespace-nowrap">
                    {t?.last7Days || "Last 7 days"}
                  </button>
                  <FiSliders className="text-lg cursor-pointer hover:text-gray-300 transition" />
                </div>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              // Loading State
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FaSpinner className="text-3xl text-theme_color mb-4 animate-spin" />
                <p className="text-gray-400">{t?.loadingBettingRecords || "Loading betting records..."}</p>
              </div>
            ) : error ? (
              // Error State
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="text-red-400 text-lg mb-2">⚠️</div>
                <p className="text-gray-400">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-theme_color text-white rounded-md hover:bg-opacity-80 transition"
                >
                  {t?.retry || "Retry"}
                </button>
              </div>
            ) : filteredRecords.length === 0 ? (
              // No Data State
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <FaFolderOpen className="text-5xl text-theme_color mb-4" />
                <p className="text-gray-400">
                  {activeTab === "settled" 
                    ? (t?.noSettledRecords || "No settled betting records found")
                    : (t?.noUnsettledRecords || "No unsettled betting records found")}
                </p>
              </div>
            ) : (
              // Data Table
              <div className="bg-[#2c2c2c] rounded-lg overflow-hidden border border-gray-700">
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700 bg-[#363636]">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">{t?.transaction || "Transaction"}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">{t?.game || "Game"}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">{t?.betAmount || "Bet Amount"}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">{t?.winAmount || "Win Amount"}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">{t?.netAmount || "Net Amount"}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">{t?.status || "Status"}</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">{t?.dateTime || "Date & Time"}</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredRecords.map((record) => {
                        const statusBadge = getStatusBadge(record.status);
                        return (
                          <tr key={record._id} className="hover:bg-[#363636] transition-colors">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium">{record.serial_number}</div>
                              <div className="text-xs text-gray-400">{record.platform}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm">{record.game_uid}</div>
                              <div className="text-xs text-gray-400 capitalize">
                                {getTranslatedGameType(record.game_type)}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {formatCurrency(record.bet_amount, record.currency_code)}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={record.win_amount > 0 ? "text-green-400" : "text-gray-400"}>
                                {formatCurrency(record.win_amount, record.currency_code)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={record.net_amount >= 0 ? "text-green-400" : "text-red-400"}>
                                {formatCurrency(record.net_amount, record.currency_code)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={statusBadge.className}>
                                {statusBadge.text}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300">
                              {formatDate(record.transaction_time)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden">
                  {filteredRecords.map((record) => {
                    const statusBadge = getStatusBadge(record.status);
                    return (
                      <div key={record._id} className="border-b border-gray-700 p-4 last:border-b-0">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-sm font-medium">{record.serial_number}</div>
                            <div className="text-xs text-gray-400">{record.game_uid}</div>
                          </div>
                          <span className={statusBadge.className}>
                            {statusBadge.text}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                          <div>
                            <div className="text-gray-400 text-xs">{t?.betAmount || "Bet Amount"}</div>
                            <div>{formatCurrency(record.bet_amount, record.currency_code)}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">{t?.winAmount || "Win Amount"}</div>
                            <div className={record.win_amount > 0 ? "text-green-400" : ""}>
                              {formatCurrency(record.win_amount, record.currency_code)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">{t?.netAmount || "Net Amount"}</div>
                            <div className={record.net_amount >= 0 ? "text-green-400" : "text-red-400"}>
                              {formatCurrency(record.net_amount, record.currency_code)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">{t?.platform || "Platform"}</div>
                            <div className="capitalize">{record.platform}</div>
                          </div>
                          <div>
                            <div className="text-gray-400 text-xs">{t?.gameType || "Game Type"}</div>
                            <div className="capitalize">{getTranslatedGameType(record.game_type)}</div>
                          </div>
                        </div>
                        
                        <div className="text-xs text-gray-400">
                          {formatDate(record.transaction_time)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer */}
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Bettings;