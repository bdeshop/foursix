import React, { useState } from "react";
import Sidebar from "../../components/sidebar/Sidebar";
import { Header } from "../../components/header/Header";
import Footer from "../../components/footer/Footer";

const Vipclub = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const vipFeatures = [
    {
      title: "24/7 Personal VIP Manager",
      desc: "Our Personal VIP Manager's number one goal is to make your experience second-to-none by offering prompt and personal service that is unrivalled. You'll be able to reach your 24/7 Personal VIP Manager via VIP LiveChat, Telegram, or Email.",
      img: "https://www.vipdetailspage.com/wp-content/themes/vip/bjvip_v2/img/bl1.png",
    },
    {
      title: "VIP Exclusive Rewards",
      desc: "Who doesn't like to have something extra? Be on your way to increased casino fun with exclusive rewards! One of the biggest perks of joining our Baji VIP Club is benefiting from the exclusive giveaway. We're giving out generous amounts of bonuses, cash prizes, level up rewards, and mystery gifts all year long.",
      img: "https://www.vipdetailspage.com/wp-content/themes/vip/bjvip_v2/img/bl2.png",
    },
    {
      title: "'VIP Points To Cash' Redemption",
      desc: "You can exchange your VIP Points for cash with no limitation. When you play or bet with Baji, you earn VIP Points, a redeemable currency that can be used to earn additional cash across all of Baji's products!",
      img: "https://www.vipdetailspage.com/wp-content/themes/vip/bjvip_v2/img/bl3.png",
    },
    {
      title: "VIP Payment Channel",
      desc: "When you win, you want the money out fast. As a VIP, you'll enjoy prioritised withdrawals and deposits. This means you can withdraw & deposit as much as you like in the priority lane!",
      img: "https://www.vipdetailspage.com/wp-content/themes/vip/bjvip_v2/img/bl4.png",
    },
  ];

  return (
    <div className="min-h-screen font-poppins bg-[#0f0f0f] text-white">
      <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex">
        <Sidebar sidebarOpen={sidebarOpen} />

        <div className="flex-1 h-[calc(100vh-56px)] overflow-y-auto custom-scrollbar">
          <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
            
            {/* HERO BANNER SECTION */}
            <div 
              className="relative w-full rounded-xl overflow-hidden min-h-[250px] md:min-h-[350px] flex items-center bg-cover bg-center shadow-2xl"
              style={{ backgroundImage: `url('https://www.vipdetailspage.com/wp-content/themes/vip/bjvip_v2/img/header.jpg')` }}
            >
              <div className="absolute inset-0 bg-black/20 md:bg-transparent"></div>
              <div className="relative z-10 px-8 md:px-16 space-y-4 max-w-xl">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase italic">
                  Foursix VIP Club
                </h1>
                <p className="text-sm md:text-lg font-medium text-gray-200">
                  The Most Exclusive VIP Program Ever
                </p>
                <button className="bg-gradient-to-b from-[#ffcf67] to-[#d1911a] hover:from-[#ffe094] text-black font-bold py-2 px-8 rounded-md transition-all transform hover:scale-105 uppercase text-sm md:text-base shadow-lg">
                  Join Now!
                </button>
              </div>
            </div>

            {/* FEATURES GRID SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vipFeatures.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-[#242424] rounded-xl p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 border border-gray-800 hover:border-gray-600 transition-colors"
                >
                  {/* Icon/Image */}
                  <div className="flex-shrink-0 w-24 md:w-32">
                    <img 
                      src={feature.img} 
                      alt={feature.title} 
                      className="w-full h-auto object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]"
                    />
                  </div>

                  {/* Text Content */}
                  <div className="flex-1 text-center sm:text-left space-y-3">
                    <h3 className="text-lg md:text-xl font-bold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-400 leading-relaxed font-light">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Vipclub;