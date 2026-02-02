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

const Termsandcondition = () => {
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;

  const getDefaultSocialLinks = () => [
    { platform: "youtube", url: "https://youtube.com", backgroundColor: "#FF0000" },
    { platform: "facebook", url: "https://facebook.com", backgroundColor: "#1877F2" },
    { platform: "twitter", url: "https://twitter.com", backgroundColor: "#1DA1F2" },
    { platform: "instagram", url: "https://instagram.com", backgroundColor: "#E4405F" },
    { platform: "whatsapp", url: "https://wa.me/+447311133789", backgroundColor: "#25D366" },
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
            
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-lg font-normal text-yellow-500">Terms & Conditions</h1>
            </div>

            {/* Content Body */}
            <div className="space-y-6 text-[13px] text-gray-200 leading-snug font-normal">
              
              <section className="space-y-4">
                <p className="text-[11px] text-gray-400">Last updated: 18 September 2023</p>
                <h2 className="text-[14px] font-bold">1. Introduction</h2>
                <p>These terms and conditions and the documents referred to below (the "Terms") apply to the use of the current website (the "Website") and its related or connected services (collectively, the "Service").</p>
                <p>You should carefully review these Terms as they contain important information concerning your rights and obligations concerning the use of the Website and form a binding legal agreement between you – our customer (the "Customer"), and us. By using this Website and/or accessing the Service, you, whether you are a guest or a registered user with an account ("Account"), agree to be bound by these Terms, together with any amendments, which may be published from time to time. If you do not accept these Terms, you should refrain from accessing the Service and using the Website.</p>
                <p>The Service is owned by Aurora Holdings N.V., a limited liability company registered in Curacao with company registration number 10692, with registered address at Abraham de Veerstraat 9, Willemstad, Curacao ("Company"), licensed in Curacao under Gaming Services Provider N.V. license # 365/JAZ for the provision of online games of chance.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-[14px] font-bold">2. General Terms</h2>
                <p>We reserve the right to revise and amend the Terms (including any documents referred to and linked to below) at any time. You should visit this page periodically to review the Terms and Conditions. Amendments will be binding and effective immediately upon publication on this Website. If you object to any such changes, you must immediately stop using the Service. Your continued use of the Website following such publication will indicate your agreement to be bound by the Terms as amended. Any bets not changed Terms taking effect will be subject to the pre-existing Terms.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-[14px] font-bold">3. Your Obligations</h2>
                <p>You acknowledge that at all times when accessing the Website and using the Service:</p>
                <ul className="space-y-2">
                  <li><span className="font-bold">3.1.</span> You are over 18, or the legal age at which gambling, or gaming activities are allowed under the law or jurisdiction that applies to you. We reserve the right to request proof of age documents from you at any time.</li>
                  <li><span className="font-bold">3.2.</span> You are of legal capacity and can enter into a binding legal agreement with us. You must not access the Website or utilize the Service if you are not of legal capacity.</li>
                  <li><span className="font-bold">3.3.</span> You are a resident in a jurisdiction that allows gambling. You are not a resident of any country in which access to online gambling to its residents or to any person within such country is prohibited. It is your sole responsibility to ensure that your use of the service is legal.</li>
                  <li><span className="font-bold">3.4.</span> You may not use a VPN, proxy or similar services or devices that mask or manipulate the identification of your real location.</li>
                  <li><span className="font-bold">3.5.</span> You are the authorized user of the payment method you use.</li>
                  <li><span className="font-bold">3.6.</span> You must make all payments to us in good faith and not attempt to reverse a payment made or take any action which will cause such payment to be reversed by a third party.</li>
                  <li><span className="font-bold">3.7.</span> When placing bets you may lose some or all of your money deposited to the Service in accordance with these Terms and you will be fully responsible for that loss.</li>
                  <li><span className="font-bold">3.8.</span> When placing bets you must not use any information obtained in breach of any legislation in force in the country in which you were when the bet was placed.</li>
                  <li><span className="font-bold">3.9.</span> You are not acting on behalf of another party or for any commercial purposes, but solely on your own behalf as a private individual in a personal capacity.</li>
                  <li><span className="font-bold">3.10.</span> You must not either attempt to manipulate any market or element within the Service in bad faith nor in a manner that adversely affects the integrity of the Service or us.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-[14px] font-bold">4. Restricted Use</h2>
                <p>4.1. You must not use the Service:</p>
                <p>4.1.1. If you are under the age of 18 years (or below the age of majority as stipulated in the laws of the jurisdiction applicable to you)...</p>
                <p>4.1.3. If you are a resident of one of the following countries, or accessing the Website from one of the following countries:</p>
                <ul className="list-disc ml-8 grid grid-cols-2 md:grid-cols-3 gap-1">
                  <li>Austria</li>
                  <li>Australia</li>
                  <li>Aruba</li>
                  <li>Bonaire</li>
                  <li>Curacao</li>
                  <li>France</li>
                  <li>Netherlands</li>
                  <li>Saba</li>
                  <li>Statia</li>
                  <li>St. Maarten</li>
                  <li>Singapore</li>
                  <li>Spain</li>
                  <li>The United Kingdom</li>
                  <li>United States</li>
                </ul>
                <p className="mt-2">And any other jurisdiction that the Central Government of Curacao deems online gambling illegal.</p>
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
                <div className="bg-[#4a5568] px-3 py-1.5 rounded flex items-center gap-2 cursor-pointer transition-colors">
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
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
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

export default Termsandcondition;