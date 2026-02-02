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

const Responsiblegaming = () => {
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
              <h1 className="text-lg font-normal text-yellow-500">Responsible Gaming</h1>
            </div>

            {/* Content Body */}
            <div className="space-y-6 text-[13px] text-gray-200 leading-snug font-normal">
              
              <section className="space-y-4">
                <p className="font-bold">Gambling With Responsibility</p>
                <p className="text-[11px] text-gray-400">Last updated: 18 September 2023</p>
                <p className="italic">Please read this information carefully for your own benefit.</p>
                <p>https://www.foursix.live is operated by Aurora Holdings N.V., having its office at Abraham de Veerstraat 9, Curacao. Company Registration number 157258.</p>
              </section>

              <section className="space-y-2">
                <h2 className="text-[14px] font-bold">Interpretation</h2>
                <p>The words of which the initial letter is capitalized have meanings defined under the following conditions.</p>
                <p>The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-[14px] font-bold">Definitions</h2>
                <p>For the purposes of these Terms and Conditions:</p>
                <ul className="list-disc ml-8 space-y-1">
                  <li><span className="font-bold">Account</span> means a unique account created for You to access our Service or parts of our Service.</li>
                  <li><span className="font-bold">Company</span> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Aurora Holdings N.V.</li>
                  <li><span className="font-bold">Service</span> refers to the Website.</li>
                  <li><span className="font-bold">Website</span> refers to https://www.foursix.live</li>
                  <li><span className="font-bold">You</span> mean the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
                </ul>
              </section>

              <section className="space-y-2">
                <h2 className="text-[14px] font-bold">Responsible Gambling and Self Exclusion</h2>
                <p>Gambling means for the majority of our Users, entertainment, fun and excitement. But we also know that for some of our Users gambling has negative side effects. In the medical science is pathologic gambling since many years as serious sickness recognised.</p>
                <p>Since our first day we have thought about this problem and try our best to help. Under "Responsible Gambling" We understand multiple steps of measures, with which a gambling provider can help to lower the possibility of negative side effects appearing. -In case they already appear we also try to take active steps against them.</p>
                <p>The most important instrument against negative side effects from gambling is knowledge and education about the risks of gambling to support our Users self-control in order to make sure they do not suffer from negative side effects.</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-[14px] font-bold">Information and contact</h2>
                <p>Our customer support team will help you via email at all time without any additional costs for you:</p>
                <ul className="list-disc ml-8">
                  <li>email: support.bd@baji.live.</li>
                </ul>
                <p>Our customer support team will of course not give out any information about You without Your consent to anyone else</p>
                <p>In addition you also can take a self-test, if You are already gambling addicted at: https://www.begambleaware.org/gambling-problems/do-i-have-a-gambling-problem/</p>
                <p>And you can also find additional information about gambling addictions at: https://www.begambleaware.org/safer-gambling/</p>
              </section>

              <section className="space-y-3">
                <h2 className="text-[14px] font-bold">Helpful hints for responsible gambling at https://www.foursix.live</h2>
                <p>We recommend you think about the following hints, before gambling in order to insure gambling stays fun for You and without any negative side effects:</p>
                <ul className="list-disc ml-8 space-y-3">
                  <li>
                    <span className="font-bold underline">Set yourself a deposit limit</span>
                    <p>Before you start to gambling, think about how much you can afford to gamble according to Your financial situation. Play with amounts which are for fun and for Your entertainment</p>
                  </li>
                  <li>
                    <span className="font-bold underline">Do not try to win back a loss at every cost</span>
                    <p>Try to not take huge risks to win back what You lost before at any cost. Play for Entertainment and not to earn money.</p>
                  </li>
                  <li>
                    <span className="font-bold underline">Set yourself a time limit</span>
                    <p>Set yourself a time limit and do not break it. Keep in mind gambling should stay in balance with your other hobbies and not be Your only hobby.</p>
                  </li>
                  <li>
                    <span className="font-bold underline">Play smart</span>
                    <p>It is smarter to not play when You are extremely stressed, depressed or under too much pressure. Also do not play when you are under the influence of Medications, Drugs or Alcohol.</p>
                  </li>
                  <li>
                    <span className="font-bold underline">Take breaks</span>
                    <p>You should take breaks when You notice, that You get tired or can't concentrate anymore</p>
                  </li>
                  <li>
                    <span className="font-bold underline">Only one account</span>
                    <p>To make it easier to have an overview of how much time and money You spend on gambling it is highly advised to not create more than one Account per Person.</p>
                  </li>
                </ul>
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

export default Responsiblegaming;