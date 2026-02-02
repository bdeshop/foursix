import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaSearch, 
  FaUserCircle, 
  FaWallet, 
  FaLightbulb, 
  FaPercentage, 
  FaRunning, 
  FaDice,
  FaYoutube,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaPinterestP,
  FaWhatsapp // Added this
} from "react-icons/fa";
import logo from "../../assets/logo.png";

const Aboutus = () => {
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;

  const getDefaultSocialLinks = () => [
    { platform: "youtube", url: "https://youtube.com" },
    { platform: "facebook", url: "https://facebook.com" },
    { platform: "twitter", url: "https://twitter.com" },
    { platform: "instagram", url: "https://instagram.com" },
    { platform: "pinterest", url: "https://pinterest.com" },
    { platform: "whatsapp", url: "https://wa.me/yournumber" },
  ];

  const fetchSocialLinks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/social-links`);
      if (response.data.success) {
        setSocialLinks(response.data.data);
      } else {
        setSocialLinks(getDefaultSocialLinks());
      }
    } catch (error) {
      console.error("Error fetching social links:", error);
      setSocialLinks(getDefaultSocialLinks());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  // Updated to handle 'platform' from your MongoDB data
  const getSocialIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case "whatsapp": return <FaWhatsapp />;
      case "youtube": return <FaYoutube />;
      case "facebook": return <FaFacebookF />;
      case "twitter": return <FaTwitter />;
      case "instagram": return <FaInstagram />;
      case "pinterest": return <FaPinterestP />;
      default: return <FaUserCircle />;
    }
  };

  const topics = [
    { title: "Account", icon: <FaUserCircle /> },
    { title: "Payment", icon: <FaWallet /> },
    { title: "Baji Tips", icon: <FaLightbulb /> },
    { title: "Promotions", icon: <FaPercentage /> },
    { title: "Sports", icon: <FaRunning /> },
    { title: "Casino", icon: <FaDice /> },
  ];

  return (
    <div className="min-h-screen font-poppins bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Navigation */}
      <div className="bg-[#004d40] p-[20px]">
        <img className="w-[100px]" src={logo} alt="Logo" />
      </div>

      <div className="flex-grow">
        <div className="pt-16 pb-12 px-4 text-center bg-gradient-to-b from-[#004d40] to-[#0a0a0a]">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">
            Welcome to the <span className="text-white">Foursix Casino Help Center</span>
          </h1>
          <p className="max-w-3xl mx-auto text-xs md:text-sm text-gray-300 leading-relaxed opacity-80">
            Need assistance? You've come to the right place.
          </p>

          <div className="mt-12 mb-6">
            <h2 className="text-xl md:text-2xl font-semibold mb-6">
              Hi. How can we <span className="text-yellow-400">help</span> you?
            </h2>
            <div className="relative max-w-4xl mx-auto">
              <input 
                type="text" 
                placeholder="Search our help articles ..." 
                className="w-full bg-white text-gray-800 py-3 px-6 rounded-full focus:outline-none shadow-lg text-sm"
              />
              <button className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 transition-colors">
                <FaSearch size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Topics Grid */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6 border-b border-gray-800 pb-2">
            <h3 className="text-lg font-bold">Topics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map((topic, index) => (
              <div key={index} className="bg-[#2d6a4f]/40 hover:bg-[#2d6a4f]/60 rounded-lg p-6 flex items-center gap-4 cursor-pointer transition-all group">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-[#2d6a4f] text-2xl shrink-0 group-hover:scale-110 transition-transform">
                  {topic.icon}
                </div>
                <span className="text-lg font-semibold tracking-wide">{topic.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* --- UPDATED FOOTER --- */}
      <footer className="bg-black text-gray-400 py-10 px-6 md:px-16 border-t border-gray-900 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
          
          <div className="flex flex-col items-start min-w-[150px]">
            <img src={logo} alt="Baji" className="w-20 mb-2" />
            <p className="text-[10px] text-gray-500">©Copyright 2021-24</p>
          </div>

          <div className="flex flex-col gap-4 items-end ml-auto">
            <div className="bg-[#4a5568] px-3 py-1.5 rounded flex items-center gap-2 cursor-pointer hover:bg-gray-600">
              <span className="text-lg">🇬🇧</span>
              <span className="text-sm text-white">English</span>
              <span className="text-[10px] ml-4">▼</span>
            </div>

            <div className="flex gap-2">
              {socialLinks.map((link, idx) => (
                <a 
                  key={idx} 
                  href={link.url} 
                  target={link.opensInNewTab ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-80 transition-all text-sm"
                  style={{ backgroundColor: link.backgroundColor || "#4a5568" }} // Uses MongoDB background color
                >
                  {getSocialIcon(link.platform)}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Aboutus;