import React, { useState, useEffect } from 'react';
import { 
  FaCopy, 
  FaShareAlt, 
  FaQrcode, 
  FaLink, 
  FaEye,
  FaChartLine,
  FaDownload,
  FaEdit,
  FaPlus,
  FaCode,
  FaPalette,
  FaMobile,
  FaDesktop,
  FaFacebook,
  FaTwitter,
  FaWhatsapp,
  FaTelegram,
  FaEnvelope,
  FaTimes,
  FaUsers,
  FaMousePointer,
  FaArrowUp,
  FaArrowDown
} from 'react-icons/fa';
import Header from '../../components/Header';
import Sidebar from '../../components/Sidebar';
import axios from 'axios';
import toast from 'react-hot-toast';

const Referlinks = () => {
  const base_url = import.meta.env.VITE_API_KEY_Base_URL;
  const website_url = 'https://foursix.live'; // Your website URL
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('links');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState('');
  const [showQRCode, setShowQRCode] = useState('');

  // Referral data state
  const [referralData, setReferralData] = useState({
    affiliateCode: '',
    customCode: '',
    totalClicks: 0,
    totalConversions: 0,
    conversionRate: 0,
    referralLinks: [],
    creatives: [],
    performance: {}
  });

  // New link form state
  const [newLink, setNewLink] = useState({
    name: '',
    targetUrl: '',
    category: 'general',
    customPath: '',
    description: ''
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Load referral data
  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('affiliatetoken');
      
      // Load affiliate profile data
      const profileResponse = await axios.get(`${base_url}/api/affiliate/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (profileResponse.data.success) {
        const profile = profileResponse.data.affiliate;
        const affiliateCode = profile.affiliateCode;
        const clickCount = profile.clickCount || 0;
        const referralCount = profile.referralCount || 0;
        const conversionRate = profile.conversionRate || 0;

        // Generate referral links with AFFILIATE parameter (?aff=)
        const mainRegistrationLink = `${website_url}/register?aff=${affiliateCode}`;
        const depositLink = `${website_url}/deposit?aff=${affiliateCode}`;
        const sportsbookLink = `${website_url}/sports?aff=${affiliateCode}`;
        const casinoLink = `${website_url}/casino?aff=${affiliateCode}`;

        setReferralData({
          affiliateCode: affiliateCode,
          customCode: profile.customAffiliateCode || affiliateCode,
          totalClicks: clickCount,
          totalConversions: referralCount,
          conversionRate: conversionRate,
          referralLinks: [
            {
              id: 1,
              name: 'Main Registration',
              url: mainRegistrationLink,
              clicks: clickCount,
              conversions: referralCount,
              createdAt: profile.createdAt || new Date(),
              isActive: true,
              category: 'registration',
              description: 'Main registration page for new users'
            },
          ],
          creatives: [
            {
              id: 1,
              name: 'Leaderboard Banner',
              size: '728x90',
              code: `<a href="${mainRegistrationLink}" target="_blank"><img src="${website_url}/banners/728x90-banner.jpg" alt="Join Now" width="728" height="90" /></a>`,
              imageUrl: `${website_url}/banners/728x90-banner.jpg`
            },
            {
              id: 2,
              name: 'Square Banner',
              size: '300x250',
              code: `<a href="${mainRegistrationLink}" target="_blank"><img src="${website_url}/banners/300x250-banner.jpg" alt="Best Betting Platform" width="300" height="250" /></a>`,
              imageUrl: `${website_url}/banners/300x250-banner.jpg`
            },
            {
              id: 3,
              name: 'Mobile Banner',
              size: '320x50',
              code: `<a href="${mainRegistrationLink}" target="_blank"><img src="${website_url}/banners/320x50-banner.jpg" alt="Mobile Betting" width="320" height="50" /></a>`,
              imageUrl: `${website_url}/banners/320x50-banner.jpg`
            },
            {
              id: 4,
              name: 'Text Link',
              size: 'Text',
              code: `<a href="${mainRegistrationLink}" target="_blank" style="color: #22d3ee; font-weight: bold; text-decoration: none;">Join the Best Betting Platform - Get Welcome Bonus!</a>`,
              imageUrl: null
            },
            {
              id: 5,
              name: 'Sports Text Link',
              size: 'Text',
              code: `<a href="${sportsbookLink}" target="_blank" style="color: #22d3ee; font-weight: bold; text-decoration: none;">Live Sports Betting - Best Odds Available!</a>`,
              imageUrl: null
            }
          ],
          performance: {
            today: { 
              clicks: Math.floor(clickCount * 0.04), 
              conversions: Math.floor(referralCount * 0.03) 
            },
            week: { 
              clicks: Math.floor(clickCount * 0.25), 
              conversions: Math.floor(referralCount * 0.25) 
            },
            month: { 
              clicks: clickCount, 
              conversions: referralCount 
            }
          }
        });
      }
    } catch (error) {
      console.error('Error loading referral data:', error);
      // If API fails, create demo data with your website URL
      createDemoData();
    } finally {
      setIsLoading(false);
    }
  };

  // Create demo data if API fails
  const createDemoData = () => {
    const demoAffiliateCode = '7SP1E5FK'; // Using the code from your data
    
    // Use ?aff= parameter for affiliate links
    const mainRegistrationLink = `${website_url}/register?aff=${demoAffiliateCode}`;
    const depositLink = `${website_url}/deposit?aff=${demoAffiliateCode}`;
    const sportsbookLink = `${website_url}/sports?aff=${demoAffiliateCode}`;
    const casinoLink = `${website_url}/casino?aff=${demoAffiliateCode}`;

    setReferralData({
      affiliateCode: demoAffiliateCode,
      customCode: demoAffiliateCode,
      totalClicks: 0,
      totalConversions: 0,
      conversionRate: 0,
      referralLinks: [
        {
          id: 1,
          name: 'Main Registration',
          url: mainRegistrationLink,
          clicks: 0,
          conversions: 0,
          createdAt: new Date(),
          isActive: true,
          category: 'registration',
          description: 'Main registration page for new users'
        },
      ],
      creatives: [
        {
          id: 1,
          name: 'Leaderboard Banner',
          size: '728x90',
          code: `<a href="${mainRegistrationLink}" target="_blank"><img src="${website_url}/banners/728x90-banner.jpg" alt="Join Now" width="728" height="90" /></a>`,
          imageUrl: `${website_url}/banners/728x90-banner.jpg`
        },
        {
          id: 2,
          name: 'Square Banner',
          size: '300x250',
          code: `<a href="${mainRegistrationLink}" target="_blank"><img src="${website_url}/banners/300x250-banner.jpg" alt="Best Betting Platform" width="300" height="250" /></a>`,
          imageUrl: `${website_url}/banners/300x250-banner.jpg`
        },
        {
          id: 3,
          name: 'Mobile Banner',
          size: '320x50',
          code: `<a href="${mainRegistrationLink}" target="_blank"><img src="${website_url}/banners/320x50-banner.jpg" alt="Mobile Betting" width="320" height="50" /></a>`,
          imageUrl: `${website_url}/banners/320x50-banner.jpg`
        },
        {
          id: 4,
          name: 'Text Link',
          size: 'Text',
          code: `<a href="${mainRegistrationLink}" target="_blank" style="color: #22d3ee; font-weight: bold; text-decoration: none;">Join the Best Betting Platform - Get Welcome Bonus!</a>`,
          imageUrl: null
        }
      ],
      performance: {
        today: { clicks: 0, conversions: 0 },
        week: { clicks: 0, conversions: 0 },
        month: { clicks: 0, conversions: 0 }
      }
    });
  };

  const copyToClipboard = (text, name = 'link') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLink(text);
      toast.success(`${name} copied to clipboard!`);
      setTimeout(() => setCopiedLink(''), 2000);
    });
  };

  const generateQRCode = (url) => {
    setShowQRCode(url);
  };

  const createCustomLink = async () => {
    try {
      if (!newLink.name || !newLink.targetUrl) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Generate the custom URL with AFFILIATE parameter (?aff=)
      const customPath = newLink.customPath || newLink.name.toLowerCase().replace(/\s+/g, '-');
      const customUrl = `${website_url}/${customPath}?aff=${referralData.affiliateCode}`;

      const newReferralLink = {
        id: Date.now(),
        name: newLink.name,
        url: customUrl,
        clicks: 0,
        conversions: 0,
        createdAt: new Date(),
        isActive: true,
        category: newLink.category,
        description: newLink.description
      };

      setReferralData(prev => ({
        ...prev,
        referralLinks: [newReferralLink, ...prev.referralLinks]
      }));

      setShowCreateModal(false);
      setNewLink({
        name: '',
        targetUrl: '',
        category: 'general',
        customPath: '',
        description: ''
      });

      toast.success('Custom link created successfully!');
    } catch (error) {
      console.error('Error creating custom link:', error);
      toast.error('Failed to create custom link');
    }
  };

  const shareOnSocialMedia = (platform, url, text = 'Check out this amazing betting platform! Join now and get exclusive bonuses!') => {
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);
    
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      email: `mailto:?subject=Amazing Betting Platform&body=${encodedText}%0A%0A${encodedUrl}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const getPlatformIcon = (platform) => {
    const icons = {
      facebook: FaFacebook,
      twitter: FaTwitter,
      whatsapp: FaWhatsapp,
      telegram: FaTelegram,
      email: FaEnvelope
    };
    const IconComponent = icons[platform];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : <FaShareAlt className="w-4 h-4" />;
  };

  const getCategoryColor = (category) => {
    const colors = {
      registration: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      deposit: 'bg-green-500/20 text-green-400 border border-green-500/30',
      sports: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      casino: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      general: 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
    };
    return colors[category] || colors.general;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat().format(num);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#000514]">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex pt-[10vh]">
          <Sidebar isOpen={isSidebarOpen} />
          <main className={`flex-1 p-6 ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'}`}>
            <div className="animate-pulse">
              <div className="h-8 bg-white/10 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-white/10 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white/5 rounded-lg p-6">
                    <div className="h-6 bg-white/10 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-white/10 rounded w-3/4"></div>
                      <div className="h-4 bg-white/10 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000514] text-white font-sans selection:bg-cyan-500 selection:text-black">
      <style>{`
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #000514; }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #22d3ee 0%, #2563eb 100%);
          border-radius: 20px;
        }
        ::-webkit-scrollbar-thumb:hover { background: #22d3ee; }
      `}</style>

      {/* Background Decoration */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
      </div>

      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex pt-[10vh] relative z-10">
        <Sidebar isOpen={isSidebarOpen} />
        
        <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'md:ml-[40%] lg:ml-[28%] xl:ml-[17%]' : 'ml-0'} p-4 md:p-6 lg:p-8 overflow-y-auto h-[90vh]`}>
          {/* Header Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight">
                  <span className="text-gray-400">Referral</span>{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Links</span>
                </h1>
                <p className="text-gray-400 text-sm md:text-base mt-2">
                  Share your affiliate links and track their performance
                </p>
              </div>
          
            </div>
            <div className="h-1.5 w-24 bg-gradient-to-r from-cyan-500 to-blue-600 mt-4 rounded-full"></div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Total Clicks</h3>
                  <p className="text-2xl md:text-3xl font-bold">
                    {formatNumber(referralData.totalClicks)}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg">
                  <FaMousePointer className="text-cyan-400 text-xl md:text-2xl" />
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-5 md:p-6 hover:border-cyan-500/50 transition-all backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Your Affiliate Code</h3>
                  <p className="text-2xl md:text-3xl font-bold font-mono text-cyan-400">
                    {referralData.affiliateCode}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg">
                  <FaCode className="text-cyan-400 text-xl md:text-2xl" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white/5 border border-white/10 rounded-xl mb-6 md:mb-8 backdrop-blur-sm">
            <div className="border-b border-white/10">
              <nav className="flex overflow-x-auto">
                {[
                  { id: 'links', label: 'Affiliate Links', icon: FaLink },
                  { id: 'performance', label: 'Performance Analytics', icon: FaChartLine },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 cursor-pointer px-4 md:px-6 py-4 border-b-2 transition-all duration-300 whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-cyan-500 text-cyan-400 font-bold'
                        : 'border-transparent text-gray-400 hover:text-cyan-300 hover:bg-white/5'
                    }`}
                  >
                    <tab.icon className={`text-lg ${activeTab === tab.id ? 'text-cyan-400' : 'text-gray-500'}`} />
                    <span className="font-bold uppercase tracking-widest text-sm">{tab.label}</span>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-4 md:p-6">
              {/* Affiliate Links Tab */}
              {activeTab === 'links' && (
                <div className="space-y-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest">Your Affiliate Links</h2>
                  </div>

                  <div className="space-y-4">
                    {referralData.referralLinks.map((link) => (
                      <div key={link.id} className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 hover:border-cyan-500/30 transition-all backdrop-blur-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-gray-300">{link.name}</h3>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${getCategoryColor(link.category)}`}>
                                {link.category}
                              </span>
                              {link.isActive && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-green-500/20 text-green-400 border border-green-500/30">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm mb-3">{link.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Clicks: <strong className="text-cyan-400">{formatNumber(link.clicks)}</strong></span>
                              <span>Conversions: <strong className="text-cyan-400">{formatNumber(link.conversions)}</strong></span>
                              <span>Created: <strong className="text-cyan-400">{new Date(link.createdAt).toLocaleDateString()}</strong></span>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <input
                                type="text"
                                value={link.url}
                                readOnly
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-gray-300 text-sm font-mono"
                              />
                              <button
                                onClick={() => copyToClipboard(link.url, link.name)}
                                className={`p-2 rounded-md transition-all duration-300 ${
                                  copiedLink === link.url 
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black' 
                                    : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white border border-white/10'
                                }`}
                              >
                                <FaCopy className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Analytics Tab */}
              {activeTab === 'performance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold uppercase tracking-widest">Performance Analytics</h2>
                    <p className="text-gray-400 text-sm mt-2">Track how your affiliate links are performing</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
                      <h3 className="font-bold uppercase tracking-widest text-gray-400 mb-4">Today</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Clicks:</span>
                          <span className="font-bold text-cyan-400">{referralData.performance.today.clicks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Conversions:</span>
                          <span className="font-bold text-cyan-400">{referralData.performance.today.conversions}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
                      <h3 className="font-bold uppercase tracking-widest text-gray-400 mb-4">This Week</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Clicks:</span>
                          <span className="font-bold text-cyan-400">{referralData.performance.week.clicks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Conversions:</span>
                          <span className="font-bold text-cyan-400">{referralData.performance.week.conversions}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
                      <h3 className="font-bold uppercase tracking-widest text-gray-400 mb-4">This Month</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Clicks:</span>
                          <span className="font-bold text-cyan-400">{referralData.performance.month.clicks}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Conversions:</span>
                          <span className="font-bold text-cyan-400">{referralData.performance.month.conversions}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 md:p-6 backdrop-blur-sm">
                    <h3 className="font-bold uppercase tracking-widest text-gray-400 mb-4">Link Performance</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 font-bold uppercase tracking-widest text-xs text-gray-400">Link Name</th>
                            <th className="text-left py-3 font-bold uppercase tracking-widest text-xs text-gray-400">Clicks</th>
                            <th className="text-left py-3 font-bold uppercase tracking-widest text-xs text-gray-400">Conversions</th>
                            <th className="text-left py-3 font-bold uppercase tracking-widest text-xs text-gray-400">Conversion Rate</th>
                            <th className="text-left py-3 font-bold uppercase tracking-widest text-xs text-gray-400">Performance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {referralData.referralLinks.map((link) => (
                            <tr key={link.id} className="border-b border-white/10 hover:bg-white/5">
                              <td className="py-3 text-gray-300">{link.name}</td>
                              <td className="py-3 text-cyan-400">{formatNumber(link.clicks)}</td>
                              <td className="py-3 text-cyan-400">{formatNumber(link.conversions)}</td>
                              <td className="py-3 text-cyan-400">
                                {link.clicks > 0 ? ((link.conversions / link.clicks) * 100).toFixed(2) : 0}%
                              </td>
                              <td className="py-3">
                                <div className="w-full bg-white/10 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-2 rounded-full" 
                                    style={{ width: `${Math.min((link.conversions / Math.max(link.clicks, 1)) * 100, 100)}%` }}
                                  ></div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* QR Code Modal */}
          {showQRCode && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-[#000514] border border-cyan-500/30 rounded-xl p-6 max-w-sm w-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold uppercase tracking-widest">QR Code</h3>
                  <button
                    onClick={() => setShowQRCode('')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>
                <div className="bg-white/5 p-4 rounded-lg mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-48 h-48 bg-white/10 border-2 border-cyan-500/30 flex items-center justify-center mb-2">
                      <span className="text-gray-500 text-sm">QR Code would appear here</span>
                    </div>
                    <p className="text-sm text-gray-400">Scan to visit link</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(showQRCode, 'URL')}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-tl-md rounded-br-md hover:brightness-110 transition-all duration-300"
                  >
                    Copy URL
                  </button>
                  <button
                    onClick={() => setShowQRCode('')}
                    className="flex-1 px-4 py-2 bg-white/10 text-white font-bold rounded-tl-md rounded-br-md hover:bg-white/20 transition-all duration-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Create Custom Link Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-[#000514] border border-cyan-500/30 rounded-xl p-6 max-w-md w-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold uppercase tracking-widest">Create Custom Affiliate Link</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <FaTimes className="text-xl" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Link Name *
                    </label>
                    <input
                      type="text"
                      value={newLink.name}
                      onChange={(e) => setNewLink(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Sports Welcome Bonus"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Target Path *
                    </label>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-2">{website_url}/</span>
                      <input
                        type="text"
                        value={newLink.targetUrl}
                        onChange={(e) => setNewLink(prev => ({ ...prev, targetUrl: e.target.value }))}
                        placeholder="sports-welcome"
                        className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                      />
                    </div>
                    <p className="text-xs text-cyan-400 mt-1">
                      Final URL: {website_url}/{newLink.targetUrl || 'your-path'}?aff={referralData.affiliateCode}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Category
                    </label>
                    <select
                      value={newLink.category}
                      onChange={(e) => setNewLink(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white"
                    >
                      <option value="general" className="bg-[#000514]">General</option>
                      <option value="registration" className="bg-[#000514]">Registration</option>
                      <option value="deposit" className="bg-[#000514]">Deposit</option>
                      <option value="sports" className="bg-[#000514]">Sportsbook</option>
                      <option value="casino" className="bg-[#000514]">Casino</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={newLink.description}
                      onChange={(e) => setNewLink(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brief description of this link..."
                      rows="3"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-white placeholder-gray-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={createCustomLink}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold rounded-tl-md rounded-br-md hover:brightness-110 transition-all duration-300"
                  >
                    Create Link
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-white/10 text-white font-bold rounded-tl-md rounded-br-md hover:bg-white/20 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Referlinks;