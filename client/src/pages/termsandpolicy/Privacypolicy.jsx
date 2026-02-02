import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  FaUserCircle, 
  FaYoutube, 
  FaFacebookF, 
  FaTwitter, 
  FaInstagram, 
  FaPinterestP,
  FaWhatsapp 
} from "react-icons/fa";
import logo from "../../assets/logo.png";
import { NavLink } from "react-router-dom";

const Privacypolicy = () => {
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;

  const getDefaultSocialLinks = () => [
    { platform: "youtube", url: "https://youtube.com", backgroundColor: "#FF0000" },
    { platform: "facebook", url: "https://facebook.com", backgroundColor: "#1877F2" },
    { platform: "twitter", url: "https://twitter.com", backgroundColor: "#1DA1F2" },
    { platform: "instagram", url: "https://instagram.com", backgroundColor: "#E4405F" },
    { platform: "whatsapp", url: "https://wa.me/yournumber", backgroundColor: "#25D366" },
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
      setSocialLinks(getDefaultSocialLinks());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocialLinks();
  }, []);

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

  return (
    <div className="min-h-screen font-sans bg-[#061e1a] text-white flex flex-col">
      {/* Top Logo Bar */}
      <div className="bg-[#041512] border-b border-white/5 sticky top-0 z-50">
        <NavLink to="/" className="max-w-7xl mx-auto p-4 flex items-center">
          <img className="w-[100px] md:w-[120px] object-contain" src={logo} alt="Foursix Logo" />
        </NavLink>
      </div>

      <div className="flex flex-1">
        <div className="flex-1 h-[calc(100vh-72px)] overflow-y-auto custom-scrollbar flex flex-col">
          <div className="max-w-7xl mx-auto px-6 py-10 flex-grow">
            
            {/* Page Header */}
            <div className="text-center mb-6">
              <h1 className="text-lg font-normal text-yellow-500">Privacy Policy</h1>
            </div>

            {/* Content Body */}
            <div className="space-y-6 text-[13px] text-gray-200 leading-snug font-normal">
              <section className="space-y-4">
                <p>Your privacy is important to us, and we are committed to protecting your personal information. We will be clear and open about why we collect your personal information and how we use it. Where you have choices or rights, we will explain these to you.</p>
                <p>This Privacy Policy explains how Foursix uses your personal information when you are using one of our website.</p>
                <p>If you do not agree with any statements contained within this Privacy Policy, please do not proceed any further on our website. Please be aware that registering an account on our website, placing bets and transferring funds will be deemed confirmation of your full agreement with our Terms and Conditions and our Privacy Policy. You have the right to cease using the website at any time; however, we may still be legally required to retain some of your personal information.</p>
                <p>We may periodically make changes to this Privacy Policy and will notify you of these changes by posting the modified terms on our platforms. We recommend that you revisit this Privacy Policy regularly.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-[14px] font-bold">Who is in control of your information?</h2>
                <p>Throughout this Privacy Policy, Foursix together with our subsidiaries and affiliates (collectively, "we" or "us" or "our") control the ways your Personal Data is collected and the purposes for which your Personal Data is used by Foursix, acting as the "data controller" for the purposes of applicable European data protection legislation.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-[14px] font-bold">Our Data Protection Officer</h2>
                <p>If you have concerns or would like any further information about how Foursix handles your personal information, you can contact our Data Protection Officer at support.bd@baji.live.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-[14px] font-bold">Information we collect about you</h2>
                <h3 className="text-[13px] font-bold">Personally identifiable information</h3>
                <p>You provide this information to us in the process of setting up an account, placing bets and using the services of the website. This information is required to give you access to certain parts of our website and related services. This data is collected when you:</p>
                <ul className="list-disc ml-8 space-y-1">
                  <li>Register an account with Foursix;</li>
                  <li>Voluntarily provide it when using the website;</li>
                  <li>Personally disclose the information in public areas of the website; and</li>
                  <li>Provide it when you contact our customer support team</li>
                </ul>
                <p>The information includes your:</p>
                <ul className="list-disc ml-8 space-y-1">
                  <li>Username;</li>
                  <li>First and surname;</li>
                  <li>Email address;</li>
                  <li>Residential address;</li>
                  <li>Phone number;</li>
                  <li>Billing address;</li>
                  <li>Identification documents;</li>
                  <li>Proof of address documents;</li>
                  <li>Transaction history;</li>
                  <li>Website usage preferences;</li>
                  <li>Any other information you provide us when using our platforms; and</li>
                  <li>Credit/debit card details, or other payment information</li>
                </ul>
                <p>The information is also required for billing purposes and for the protection of minors. You can amend and update this information by contacting Customer Support. This data is for internal use only and is never passed to any third parties except those stated below.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-[14px] font-bold">Telephone Calls</h2>
                <p>Telephone calls to and from our Customer Contact Centre are recorded for training and security purposes along with the resolution of any queries arising from the service you received.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-[14px] font-bold">Social Features of Our Products</h2>
                <p>If you choose to participate in any of the social features that we provide with our products (such as chat rooms), Foursix may store record or otherwise process this data.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-[14px] font-bold">Non-personally identifiable information and traffic analysis</h2>
                <p>Foursix strives to make our website as user friendly as possible and easy to find on the Internet. Foursix collects data on how you use the site, which does not identify you personally. When you interact with the services, our servers keep an activity log unique to you that collects certain administrative and traffic information including: source IP address, time of access, date of access, web page(s) visited, language use, software crash reports and type of browser used. This information is essential for the provision and quality of our services.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-[14px] font-bold">Cookies</h2>
                <p>Foursix uses cookies to ensure our website works efficiently and to enhance your visits to our platforms. Further information can be found in our Cookie Policy.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-[14px] font-bold">How and why we use your personal information</h2>
                <p>We use your personal information in a range of ways that fall into the following categories:</p>
                <ul className="list-disc ml-8 space-y-1">
                  <li>To provide you with the products or services you have requested;</li>
                  <li>To meet our legal or regulatory obligations;</li>
                  <li>To monitor our website performance; and</li>
                  <li>To provide you with marketing information</li>
                </ul>
                <p>Your rights over your personal information differ according to which category and lawful basis this fall into. This section provides more information about each category, the rights it gives you, and how to exercise these rights. These rights are in bold following each category.</p>
              </section>

              <section className="space-y-2 pb-10">
                <h2 className="text-[14px] font-bold">Providing our products and services</h2>
                <p>We use your personal information to enable you to use our websites, to set up your account, participate in the online sports book, casino and to provide you with customer service assistance.</p>
              </section>
            </div>
          </div>

          <footer className="bg-black text-gray-400 py-10 px-6 md:px-16 border-t border-gray-900 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8">
              <div className="flex flex-col items-start min-w-[150px]">
                <img src={logo} alt="Foursix" className="w-20 mb-2" />
                <p className="text-[10px] text-gray-500">©Copyright 2026</p>
              </div>

              <div className="flex flex-col gap-4 items-end ml-auto">
                <div className="bg-[#4a5568] px-3 py-1.5 rounded flex items-center gap-2 cursor-pointer hover:bg-gray-600 transition-colors">
                  <span className="text-lg">🇬🇧</span>
                  <span className="text-sm text-white">English</span>
                  <span className="text-[10px] ml-4 font-sans">▼</span>
                </div>

                <div className="flex gap-2">
                  {socialLinks.map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link.url} 
                      target={link.opensInNewTab ? "_blank" : "_self"} 
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:opacity-80 transition-all text-sm"
                      style={{ backgroundColor: link.backgroundColor || "#4a5568" }}
                    >
                      {getSocialIcon(link.platform)}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Privacypolicy;