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

const KycPolicy = () => {
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
    <div className="min-h-screen font-poppins bg-[#061e1a] text-white flex flex-col">
      {/* Brand Header Bar */}
      <div className="bg-[#041512] border-b border-white/5 sticky top-0 z-50">
        <NavLink to="/" className="max-w-7xl mx-auto p-4 flex items-center">
          <img className="w-[100px] md:w-[120px] object-contain" src={logo} alt="Foursix Logo" />
        </NavLink>
      </div>

      <div className="flex flex-1">
        <div className="flex-1 h-[calc(100vh-72px)] overflow-y-auto custom-scrollbar flex flex-col">
          <div className="max-w-5xl mx-auto px-6 py-10 flex-grow">
            
            {/* Main Header */}
            <div className="mb-6">
              <h1 className="text-xl font-bold mb-1">KYC Policy of Foursix</h1>
              <p className="text-[10px] text-gray-400">Last updated: 18 September 2023</p>
            </div>

            {/* Content Body */}
            <div className="space-y-6 text-sm text-gray-200">
              <section className="space-y-4">
                <p>
                  When a user makes an aggregate lifetime total of deposits exceeding EUR 2000 or requests a withdrawal of any amount on the https://www.foursix.live Platform, then it is compulsory for them to perform a full KYC process.
                </p>
                <p>During this process, the user will have to input some basic details about themselves and then upload</p>
                <ol className="list-decimal ml-8 space-y-1">
                  <li>A copy of Government Issued Photo ID (in some cases front and back depending on the doc)</li>
                  <li>A selfie of themselves holding the ID doc</li>
                  <li>A bank statement/Utility Bill</li>
                </ol>
                <p>Once uploaded, the user will get a "Temporarily Approved" Status and the documents will now be on our side, and the "KYC Team" will have 24hrs to go over them and email the user about the outcome:</p>
                <ul className="list-disc ml-8">
                  <li>Approval</li>
                  <li>Rejection</li>
                  <li>More information needed – No change in Status</li>
                </ul>
                <p>When the user is on "Temporarily Approved" Status then</p>
                <ul className="list-disc ml-8">
                  <li>They can use the platform normally</li>
                  <li>They cannot deposit more than EUR 500 in aggregate total</li>
                  <li>They cannot complete any withdrawal.</li>
                </ul>
              </section>

              <section className="space-y-4">
                <h2 className="font-bold">Guideline for the "KYC Process"</h2>
                
                <div>
                  <p className="font-bold">1) Proof of ID</p>
                  <ul className="ml-4">
                    <li>a. Signature is there</li>
                    <li>b. Country is not a Restricted Country: United States of America and its territories, France and its territories, Netherlands and its territories and countries that form the Kingdom of Netherlands including Bonaire, Sint Eustatius, Saba, Aruba, Curacao and Sint Maarten, Australia and its territories, United Kingdom of Great Britain, Northern Ireland, Spain, and Cyprus.</li>
                    <li>c. Full Name matches client's name</li>
                    <li>d. Document does not expire in the next 3 months</li>
                    <li>e. Owner is over 18 years of age</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold">2) Proof of Residence</p>
                  <ul className="ml-4">
                    <li>a. Bank Statement or Utility Bill</li>
                    <li>b. Country is not a Restricted Country: United States of America and its territories, France and its territories, Netherlands and its territories and countries that form the Kingdom of Netherlands including Bonaire, Sint Eustatius, Saba, Aruba, Curacao and Sint Maarten, Australia and its territories, United Kingdom of Great Britain, Northern Ireland, Spain, and Cyprus.</li>
                    <li>c. Full Name matches client's name and is same as in proof of ID.</li>
                    <li>d. Date of issue: In the last 3 months</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold">3) Selfie with ID</p>
                  <ul className="ml-4">
                    <li>a. Holder is the same as in the ID document above</li>
                    <li>b. The ID document is the same as in "1". Make sure photo/ID number is the same</li>
                  </ul>
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="font-bold">Notes on the "KYC Process"</h2>
                <p>1) When the KYC process is unsuccessful then the reason is documented and a support ticket is created in the system. The ticket number along with an explanation is communicated back to the user.</p>
                <p>2) Once all proper documents are in our possession then the account gets approved.</p>
              </section>

              <section className="space-y-4">
                <h2 className="font-bold">"Other AML measures"</h2>
                <p>1) If a user has not passed full KYC then they cannot make additional deposits or withdrawals of any amount.</p>
                <p>2) If a user has passed the KYC process successfully then</p>
                <ul className="ml-4">
                  <li>a. There is a deposit limit per transaction (max EUR 2,000)</li>
                  <li>b. Prior to any withdrawal there is a detailed algorithmic and manual check on the activity and balance of the user to see if the amount withdrawn is a result of proper activity in the platform.</li>
                </ul>
                <p>3) Under no circumstances may a user transfer funds directly to another user.</p>
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
                <div className="bg-[#4a5568] px-3 py-1.5 rounded flex items-center gap-2 cursor-pointer">
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

export default KycPolicy;