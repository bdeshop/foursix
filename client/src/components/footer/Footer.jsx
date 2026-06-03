import React, { useState, useEffect, useContext } from "react";
import {
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaYoutube,
  FaPinterest,
  FaWhatsapp,
  FaChevronDown,
  FaChevronUp,
  FaLinkedin,
  FaDiscord,
  FaReddit,
  FaMedium,
  FaGithub,
  FaSnapchat,
  FaWeixin,
  FaSkype,
  FaDownload,
} from "react-icons/fa";
import { SiTiktok, SiTelegram } from "react-icons/si";
import { IoOpenOutline } from "react-icons/io5";
import axios from "axios";
import logo from "../../assets/logo.png";
import OBP from "../../assets/OBP.png";
import { NavLink } from "react-router-dom";
import { LanguageContext } from "../../context/LanguageContext";

const Footer = () => {
  const { t } = useContext(LanguageContext);

  const [openSection, setOpenSection] = useState(null);
  const [showMoreText, setShowMoreText] = useState(false);
  const [dynamicLogo, setDynamicLogo] = useState(logo);
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = import.meta.env.VITE_API_KEY_Base_URL;

  // App download URL
  const APP_DOWNLOAD_URL = "https://apps.foursix.live/";

  useEffect(() => {
    fetchBrandingData();
    fetchSocialLinks();
  }, []);

  const fetchBrandingData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/branding`);
      if (response.data.success && response.data.data && response.data.data.logo) {
        const logoUrl = response.data.data.logo.startsWith("http")
          ? response.data.data.logo
          : `${API_BASE_URL}${response.data.data.logo.startsWith("/") ? "" : "/"}${response.data.data.logo}`;
        setDynamicLogo(logoUrl);
      }
    } catch (error) {
      console.error("Error fetching branding data:", error);
      setDynamicLogo(logo);
    }
  };

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

  const getDefaultSocialLinks = () => [
    { platform: "facebook",  url: "#", displayName: "Facebook",  backgroundColor: "#1877F2", opensInNewTab: true, isGradient: false },
    { platform: "instagram", url: "#", displayName: "Instagram", backgroundColor: "linear-gradient(45deg, #405DE6, #5851DB, #833AB4, #C13584, #E1306C, #FD1D1D)", opensInNewTab: true, isGradient: true },
    { platform: "twitter",   url: "#", displayName: "Twitter",   backgroundColor: "#1DA1F2", opensInNewTab: true, isGradient: false },
    { platform: "youtube",   url: "#", displayName: "YouTube",   backgroundColor: "#FF0000", opensInNewTab: true, isGradient: false },
    { platform: "pinterest", url: "#", displayName: "Pinterest", backgroundColor: "#E60023", opensInNewTab: true, isGradient: false },
    { platform: "tiktok",    url: "#", displayName: "TikTok",    backgroundColor: "#000000", opensInNewTab: true, isGradient: false },
    { platform: "telegram",  url: "#", displayName: "Telegram",  backgroundColor: "#0088CC", opensInNewTab: true, isGradient: false },
    { platform: "whatsapp",  url: "#", displayName: "WhatsApp",  backgroundColor: "#25D366", opensInNewTab: true, isGradient: false },
  ];

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const toggleShowMore = () => {
    setShowMoreText(!showMoreText);
  };

  const getSocialIcon = (platform) => {
    const iconProps = { size: 12, className: "text-white" };
    const icons = {
      facebook:  <FaFacebook  {...iconProps} />,
      instagram: <FaInstagram {...iconProps} />,
      twitter:   <FaTwitter   {...iconProps} />,
      youtube:   <FaYoutube   {...iconProps} />,
      pinterest: <FaPinterest {...iconProps} />,
      tiktok:    <SiTiktok    {...iconProps} />,
      telegram:  <SiTelegram  {...iconProps} />,
      whatsapp:  <FaWhatsapp  {...iconProps} />,
      linkedin:  <FaLinkedin  {...iconProps} />,
      discord:   <FaDiscord   {...iconProps} />,
      reddit:    <FaReddit    {...iconProps} />,
      medium:    <FaMedium    {...iconProps} />,
      github:    <FaGithub    {...iconProps} />,
      snapchat:  <FaSnapchat  {...iconProps} />,
      wechat:    <FaWeixin    {...iconProps} />,
      skype:     <FaSkype     {...iconProps} />,
    };
    return icons[platform] || <FaFacebook {...iconProps} />;
  };

  return (
    <footer className="bg-[#141515] font-poppins text-gray-400 text-[10px] md:text-sm pb-[80px] md:pb-0 md:px-[50px]">
      <div className="mx-auto w-full max-w-screen-xl px-3 py-4 md:px-2 lg:px-4 md:py-8">

        {/* ── Mobile Dropdown Sections ── */}
        <div className="md:hidden mb-3">

          {/* Gaming Dropdown */}
          <div className="border-b border-gray-900 py-2">
            <button
              className="flex justify-between cursor-pointer items-center w-full text-left font-medium text-gray-200 text-[11px]"
              onClick={() => toggleSection("gaming")}
            >
              <span>{t.footerGaming}</span>
              {openSection === "gaming" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
            {openSection === "gaming" && (
              <ul className="mt-2 space-y-1 pl-2">
                {[
                  { label: t.footerCasino,  href: "#" },
                  { label: t.footerSlots,   href: "#" },
                  { label: t.footerTable,   href: "#" },
                  { label: t.footerFishing, href: "#" },
                  { label: t.footerCrash,   href: "#" },
                  { label: t.footerArcade,  href: "#" },
                  { label: t.footerLottery, href: "#" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a href={href} className="hover:text-white transition-colors duration-200 text-[10px]">
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* About Dropdown */}
          <div className="border-b border-gray-900 py-2">
            <button
              className="flex justify-between items-center cursor-pointer w-full text-left font-medium text-gray-200 text-[11px]"
              onClick={() => toggleSection("about")}
            >
              <span>{t.footerAbout}</span>
              {openSection === "about" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
            {openSection === "about" && (
              <ul className="mt-2 space-y-1 pl-2">
                {[
                  t.footerAboutUs,
                  t.footerPrivacyPolicy,
                  t.footerTerms,
                  t.footerResponsibleGaming,
                  t.footerKyc,
                ].map((label) => (
                  <li key={label}>
                    <a href="#" className="hover:text-white transition-colors duration-200 text-[10px] flex items-center gap-1">
                      {label} <IoOpenOutline />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Features Dropdown */}
          <div className="border-b border-gray-900 py-2">
            <button
              className="flex cursor-pointer justify-between items-center w-full text-left font-medium text-gray-200 text-[11px]"
              onClick={() => toggleSection("features")}
            >
              <span>{t.footerFeatures}</span>
              {openSection === "features" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
            {openSection === "features" && (
              <ul className="mt-2 space-y-1 pl-2">
                <li><a href="/promotions" className="hover:text-white transition-colors duration-200 text-[10px]">{t.footerPromotions}</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 text-[10px]">{t.footerVipClub}</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 text-[10px]">{t.footerReferral}</a></li>
                <li><a href="#" className="hover:text-white transition-colors duration-200 text-[10px]">{t.footerBrandAmbassadors}</a></li>
                <li>
                  <a
                    href={APP_DOWNLOAD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white transition-colors duration-200 text-[10px] flex items-center gap-1"
                  >
                    {t.footerAppDownload} <FaDownload size={10} />
                  </a>
                </li>
              </ul>
            )}
          </div>

          {/* Help Dropdown */}
          <div className="border-b border-gray-900 py-2">
            <button
              className="flex cursor-pointer justify-between items-center w-full text-left font-medium text-white text-[11px]"
              onClick={() => toggleSection("help")}
            >
              <span>{t.footerHelp}</span>
              {openSection === "help" ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
            </button>
            {openSection === "help" && (
              <ul className="mt-2 space-y-1 pl-2">
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200 text-[10px]">
                    {t.footerBjForum} <span className="inline-block text-gray-500 text-[9px]">↗</span>
                  </a>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* ── Desktop Grid Layout ── */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Column 1: Gaming */}
          <div>
            <h3 className="font-medium mb-4 text-gray-200">{t.footerGaming}</h3>
            <ul className="space-y-2">
              <li><NavLink to="/casino" className="hover:text-white transition-colors duration-200">{t.footerCasino}</NavLink></li>
              <li><NavLink to="/slots"  className="hover:text-white transition-colors duration-200">{t.footerSlots}</NavLink></li>
              <li><NavLink to="/slots"  className="hover:text-white transition-colors duration-200">{t.footerTable}</NavLink></li>
              <li><NavLink to="/slots"  className="hover:text-white transition-colors duration-200">{t.footerFishing}</NavLink></li>
              <li><NavLink to="/slots"  className="hover:text-white transition-colors duration-200">{t.footerCrash}</NavLink></li>
              <li><NavLink to="/slots"  className="hover:text-white transition-colors duration-200">{t.footerArcade}</NavLink></li>
              <li><NavLink to="/slots"  className="hover:text-white transition-colors duration-200">{t.footerLottery}</NavLink></li>
            </ul>
          </div>

          {/* Column 2: About */}
          <div>
            <h3 className="font-medium mb-4 text-gray-200">{t.footerAbout}</h3>
            <ul className="space-y-2">
              <li>
                <NavLink to="/about-us" className="hover:text-white transition-colors duration-200 flex justify-start items-center gap-[2px]">
                  {t.footerAboutUs} <span className="inline-block text-gray-500 text-[20px]"><IoOpenOutline /></span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/privacy-policy" className="hover:text-white transition-colors duration-200 flex justify-start items-center gap-[2px]">
                  {t.footerPrivacyPolicy} <span className="inline-block text-gray-500 text-[20px]"><IoOpenOutline /></span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/terms-and-conditions" className="hover:text-white transition-colors duration-200 flex justify-start items-center gap-[2px]">
                  {t.footerTerms} <span className="inline-block text-gray-500 text-[20px]"><IoOpenOutline /></span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/responsible-gaming" className="hover:text-white transition-colors duration-200 flex justify-start items-center gap-[2px]">
                  {t.footerResponsibleGaming} <span className="inline-block text-gray-500 text-[20px]"><IoOpenOutline /></span>
                </NavLink>
              </li>
              <li>
                <NavLink to="/kyc" className="hover:text-white transition-colors duration-200 flex justify-start items-center gap-[2px]">
                  {t.footerKyc} <span className="inline-block text-gray-500 text-[20px]"><IoOpenOutline /></span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Column 3: Features */}
          <div>
            <h3 className="font-medium mb-4 text-gray-200">{t.footerFeatures}</h3>
            <ul className="space-y-2">
              <li><a href="/promotions" className="hover:text-white transition-colors duration-200">{t.footerPromotions}</a></li>
              <li><NavLink to="/vip-club" className="hover:text-white transition-colors duration-200">{t.footerVipClub}</NavLink></li>
              <li><NavLink to="/referral-program" className="hover:text-white transition-colors duration-200">{t.footerReferral}</NavLink></li>
              <li><NavLink to="/coming-soon?title=Brand Ambassadors" className="hover:text-white transition-colors duration-200">{t.footerBrandAmbassadors}</NavLink></li>
              <li>
                <a href={APP_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors duration-200 flex items-center gap-2">
                  {t.footerAppDownload} <FaDownload size={14} />
                </a>
              </li>
            </ul>
          </div>

          {/* Column 4: Help */}
          <div>
            <h3 className="font-medium mb-4 text-white">{t.footerHelp}</h3>
            <ul className="space-y-2">
              <li>
                <NavLink to="/coming-soon?title=BJ Forum" className="hover:text-white transition-colors duration-200 flex justify-start items-center gap-[2px]">
                  {t.footerBjForum} <span className="inline-block text-gray-500 text-xs ml-[2px] text-[20px]"><IoOpenOutline /></span>
                </NavLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="h-[1px] bg-gray-700 my-4 md:my-8"></div>

        {/* ── Sponsorships ── */}
        <div className="mb-4 md:mb-8">
          <h3 className="font-medium mb-2 md:mb-4 text-gray-400 text-[11px] md:text-[16px]">
            {t.footerSponsorships}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 md:gap-4 items-center">
            <div className="flex flex-col items-center text-center">
              <img src="https://img.b112j.com/bj/h5/assets/v3/images/sponsor/afc-bournemouth.png?v=1754999737902&source=drccdnsrc" alt="AFC Bournemouth" className="h-6 md:h-12 object-contain mb-1" />
              <p className="text-[9px] md:text-xs">AFC Bournemouth</p>
              <p className="text-[8px] md:text-xs text-gray-500">{t.footerOfficialPartner}</p>
              <p className="text-[8px] md:text-xs text-gray-500">2023 - 2024</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <img src="https://img.b112j.com/bj/h5/assets/v3/images/sponsor/bologna-fc-1909.png?v=1754999737902&source=drccdnsrc" alt="Bologna FC" className="h-6 md:h-12 object-contain mb-1" />
              <p className="text-[9px] md:text-xs">Bologna FC 1909</p>
              <p className="text-[8px] md:text-xs text-gray-500">{t.footerOfficialClubSponsor}</p>
              <p className="text-[8px] md:text-xs text-gray-500">2023 - 2024</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <img src="https://img.b112j.com/bj/h5/assets/v3/images/sponsor/quetta-gladiators.png?v=1754999737902&source=drccdnsrc" alt="Quetta Gladiators" className="h-6 md:h-12 object-contain mb-1" />
              <p className="text-[9px] md:text-xs">Quetta Gladiators</p>
              <p className="text-[8px] md:text-xs text-gray-500">{t.footerMainSponsor}</p>
              <p className="text-[8px] md:text-xs text-gray-500">2023 - 2024</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <img src="https://img.b112j.com/bj/h5/assets/v3/images/sponsor/sunrisers-eastern-cape.png?v=1754999737902&source=drccdnsrc" alt="Sunrisers Eastern Cape" className="h-6 md:h-12 object-contain mb-1" />
              <p className="text-[9px] md:text-xs">Sunrisers Eastern Cape</p>
              <p className="text-[8px] md:text-xs text-gray-500">{t.footerMainSponsor}</p>
              <p className="text-[8px] md:text-xs text-gray-500">2023 - 2024</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <img src="https://img.b112j.com/bj/h5/assets/v3/images/sponsor/deccan-gladiators.png?v=1754999737902&source=drccdnsrc" alt="Deccan Gladiators" className="h-6 md:h-12 object-contain mb-1" />
              <p className="text-[9px] md:text-xs">Deccan Gladiators</p>
              <p className="text-[8px] md:text-xs text-gray-500">{t.footerOfficialPartner}</p>
              <p className="text-[8px] md:text-xs text-gray-500">2023 - 2024</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <img src="https://img.b112j.com/bj/h5/assets/v3/images/sponsor/st-kitts-and-nevis-patriots.png?v=1754999737902&source=drccdnsrc" alt="St Kitts & Nevis Patriots" className="h-6 md:h-12 object-contain mb-1" />
              <p className="text-[9px] md:text-xs">St Kitts & Nevis Patriots</p>
              <p className="text-[8px] md:text-xs text-gray-500">{t.footerPrincipleSponsor}</p>
              <p className="text-[8px] md:text-xs text-gray-500">2024 - 2025</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <img src="https://img.b112j.com/bj/h5/assets/v3/images/sponsor/biratnagar-kings.png?v=1754999737902&source=drccdnsrc" alt="Biratnagar Kings" className="h-6 md:h-12 object-contain mb-1" />
              <p className="text-[9px] md:text-xs">Biratnagar Kings</p>
              <p className="text-[8px] md:text-xs text-gray-500">{t.footerBackJersey}</p>
              <p className="text-[8px] md:text-xs text-gray-500">2024 - 2025</p>
            </div>
          </div>
        </div>

        <div className="h-[1px] bg-gray-700 my-4 md:my-8"></div>

        {/* ── Brand Ambassadors ── */}
        <div className="mb-4 md:mb-8">
          <h3 className="flex items-center justify-start font-[400] mb-2 md:mb-4 text-gray-400 text-[11px] md:text-[16px]">
            {t.footerBrandAmbassadors}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-4 items-center">
            {[
              { src: "https://img.b112j.com/bj/h5/assets/v3/images/ambassador/mia-k.png?v=1754999737902&source=drccdnsrc", name: "Mia Khalifa", period: "2024 - 2028" },
              { src: "https://img.b112j.com/bj/h5/assets/v3/images/ambassador/kevin-pietersen.png?v=1754999737902&source=drccdnsrc", name: "Kevin Pietersen", period: "2024 - 2028" },
              { src: "https://img.b112j.com/bj/h5/assets/v3/images/ambassador/amy-jacson.png?v=1754999737902&source=drccdnsrc", name: "Amy Jackson", period: "2023 - 2024" },
              { src: "https://img.b112j.com/bj/h5/assets/v3/images/ambassador/hansika.png?v=1754999737902&source=drccdnsrc", name: "Hansika Motwani", period: "2023 - 2024" },
              { src: "https://img.b112j.com/bj/h5/assets/v3/images/ambassador/chan-samart.png?v=1754999737902&source=drccdnsrc", name: "Chan Samart", period: "2024 - 2025" },
              { src: "https://img.b112j.com/bj/h5/assets/v3/images/ambassador/keya-akter-payel.png?v=1754999737902&source=drccdnsrc", name: "Keya Akter Payel", period: "2025" },
            ].map(({ src, name, period }) => (
              <div key={name} className="flex flex-col items-center text-center">
                <img src={src} alt={name} className="h-6 md:h-12 object-contain mb-1" />
                <p className="text-[9px] md:text-xs">{name}</p>
                <p className="text-[8px] md:text-xs text-gray-500">{period}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-[1px] bg-gray-700 my-4 md:my-8"></div>

        {/* ── Licenses & Responsible Gaming ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-8 sm:justify-center sm:items-center">
          <div className="flex flex-col mb-3 md:mb-0 sm:w-full sm:order-first sm:flex-row-reverse">
            <div className="flex flex-col items-center mb-3 md:mb-0 sm:w-full sm:order-first">
              <h3 className="font-medium mb-2 md:mb-4 text-gray-400 text-[11px] md:text-[15px] sm:text-center">
                {t.footerGamingLicense}
              </h3>
              <div className="flex space-x-2 md:space-x-4 sm:justify-center sm:items-center">
                <img src="https://img.b112j.com/bj/h5/assets/images/footer/gaming_license.png?v=1754999737902&source=drccdnsrc" alt="Gaming License" className="h-5 md:h-7 object-contain sm:w-1/2 sm:mb-2" />
                <img src="https://img.b112j.com/bj/h5/assets/images/footer/anjouan_license.png?v=1754999737902&source=drccdnsrc" alt="Anjouan License" className="h-5 md:h-7 object-contain sm:w-1/2 sm:mb-2" />
              </div>
            </div>
            <div className="flex flex-col items-center mt-3 md:mt-0 sm:w-full sm:order-last">
              <h3 className="font-medium mb-2 md:mb-4 text-gray-400 text-[11px] md:text-[15px] sm:text-center">
                {t.footerOfficialBrandPartner}
              </h3>
              <div className="flex items-center sm:w-full sm:justify-center">
                <img src={OBP} className="h-6 md:h-8 object-contain sm:w-full sm:mb-2" alt="Official Brand Partner" />
              </div>
            </div>
            <div className="flex items-center flex-col mt-3 md:mt-0">
              <h3 className="font-medium mb-2 md:mb-4 text-nowrap text-gray-400 text-[11px] md:text-[15px]">
                {t.footerResponsibleGamingLabel}
              </h3>
              <div className="flex space-x-2 md:space-x-4 items-center">
                <img alt="Regulations" className="h-4 md:h-8" src="https://img.b112j.com/bj/h5/assets/v3/images/icon-set/trivial-type/regulations.svg?v=1754999737902&source=drccdnsrc" />
                <img alt="Gamcare"     className="h-4 md:h-8" src="https://img.b112j.com/bj/h5/assets/v3/images/icon-set/trivial-type/gamcare.svg?v=1754999737902&source=drccdnsrc" />
                <img alt="Age Limit"   className="h-4 md:h-8" src="https://img.b112j.com/bj/h5/assets/v3/images/icon-set/trivial-type/age-limit.svg?v=1754999737902&source=drccdnsrc" />
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Text Section ── */}
        <div className="mb-4 md:mb-8">
          <h3 className="font-medium mb-2 text-gray-400 text-[11px] md:text-[15px]">
            {t.footerHeadingTitle}
          </h3>
          <p className="text-justify leading-relaxed text-gray-600 text-[10px] md:text-[13px]">
            {t.footerHeadingText}
          </p>
          {showMoreText && (
            <p className="text-justify leading-relaxed text-gray-400 mt-2 text-[10px] md:text-base">
              {t.footerHeadingTextMore}
            </p>
          )}
          <button
            className="text-white text-[9px] px-2 py-1 mt-1 border border-gray-500 rounded-full hover:bg-gray-700 transition-colors duration-200"
            onClick={toggleShowMore}
          >
            {showMoreText ? t.footerShowLess : t.footerShowMore}
          </button>
        </div>

        {/* ── Mobile App Download Banner (mobile only) ── */}
        <a
          href={APP_DOWNLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="md:hidden flex items-center justify-between mb-4 rounded-2xl px-4 py-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1a2a1a 0%, #0d1f0d 100%)",
            border: "1.5px solid #2ecc40",
          }}
        >
          {/* Decorative blobs */}
          <span
            className="absolute pointer-events-none"
            style={{
              top: "-30px", right: "-30px",
              width: "90px", height: "90px",
              borderRadius: "50%",
              background: "rgba(46,204,64,0.08)",
            }}
          />
          <span
            className="absolute pointer-events-none"
            style={{
              bottom: "-20px", left: "35%",
              width: "65px", height: "65px",
              borderRadius: "50%",
              background: "rgba(46,204,64,0.05)",
            }}
          />

          {/* Left: icon + text */}
          <div className="flex items-center gap-3 flex-1 relative z-10">
            <div
              className="rounded-xl flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(46,204,64,0.15)",
                padding: "10px",
              }}
            >
              <FaDownload size={22} style={{ color: "#2ecc40" }} />
            </div>
            <div>
              <p
                className="text-[10px] font-medium tracking-widest uppercase mb-0.5"
                style={{ color: "#2ecc40" }}
              >
                foursix App
              </p>
              <p className="text-white font-semibold text-[15px] leading-tight">
                Download Now
              </p>
              <div className="flex gap-1.5 mt-1">
                <span
                  className="text-[9px] text-gray-400 rounded px-1.5 py-0.5"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                >
                  Android
                </span>
              </div>
            </div>
          </div>

          {/* Right: GET IT pill */}
          <div
            className="flex flex-col items-center justify-center rounded-xl flex-shrink-0 ml-3 relative z-10"
            style={{
              background: "#2ecc40",
              padding: "10px 14px",
            }}
          >
            <FaDownload size={16} style={{ color: "#0a1a0a" }} />
            <span className="text-[9px] font-bold mt-1" style={{ color: "#0a1a0a" }}>
              GET IT
            </span>
          </div>
        </a>

        {/* ── Copyright Section ── */}
        <div className="pt-3 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <div className="flex items-center space-x-2 mb-2 md:mb-0">
              <img src={dynamicLogo} alt="logo" className="h-5 md:h-10 object-contain" />
              <div>
                <p className="text-[9px] text-gray-500 leading-none">{t.footerTagline}</p>
              </div>
            </div>

            {/* Dynamic Social Media Section */}
            <div className="mb-4 md:mb-0">
              <h3 className="font-medium mb-2 text-white text-[13px] md:text-sm text-center md:text-left">
                {t.footerFollowUs}
              </h3>
              {loading ? (
                <div className="flex flex-wrap gap-1 md:gap-2 justify-center md:justify-start">
                  {[...Array(8)].map((_, index) => (
                    <div key={index} className="w-8 h-8 bg-gray-600 rounded-full animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1 md:gap-2 justify-center md:justify-start">
                  {socialLinks.map((link) => (
                    <a
                      key={link.platform}
                      href={link.url}
                      className="p-2 rounded-full hover:opacity-90 transition-opacity duration-200 flex items-center justify-center"
                      style={{
                        background: link.backgroundColor,
                        backgroundImage: link.isGradient ? link.backgroundColor : "none",
                      }}
                      aria-label={link.displayName}
                      target={link.opensInNewTab ? "_blank" : "_self"}
                      rel={link.opensInNewTab ? "noopener noreferrer" : ""}
                    >
                      {getSocialIcon(link.platform)}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <p className="text-[13px] text-gray-500 mt-2 text-justify">
            {t.footerLegalText}
          </p>
        </div>

        <p className="text-[13px] text-white mt-2 text-center md:text-500">
          {t.footerCopyright}
        </p>
      </div>
    </footer>
  );
};

export default Footer;