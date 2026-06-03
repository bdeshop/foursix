import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Sports = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch("https://api.oraclegames.live/api/cricket/matches")
      .then((res) => res.json())
      .then((json) => {
        console.log("Fetched matches:", json);
        if (json.success) setMatches(json.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching matches:", err);
        setLoading(false);
      });
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 400; 
      scrollRef.current.scrollBy({ 
        left: direction === 'left' ? -scrollAmount : scrollAmount, 
        behavior: 'smooth' 
      });
    }
  };

  if (loading) return (
    <div className="min-h-[300px] flex items-center justify-center bg-[#0a0a0a]">
       <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="text-white py-8 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <span className="w-[3px] h-5 bg-emerald-500 rounded-full"></span>
            <h2 className="text-xl font-bold tracking-tight">Live Score</h2>
          </div>

          <div className="flex gap-1">
            <button 
              onClick={() => scroll('left')}
 className="p-2 bg-box_bg hover:bg-box_bg/90 cursor-pointer rounded-[3px] transition-colors duration-200"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scroll('right')}
    className="p-2 bg-box_bg hover:bg-box_bg/90 cursor-pointer rounded-[3px] transition-colors duration-200"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Area */}
        <div 
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x pb-4 "
        >
          {matches.map((match, index) => (
            <div 
              key={index} 
              className={`
                snap-start shrink-0
                w-[320px] md:w-[380px]
                bg-[#222424] border border-[#222] rounded-lg p-5
                flex flex-col relative transition-colors hover:border-[#333]
                ${match.state === 'live' ? 'border-t-2' : ''}
              `}
            >
              {/* Match Meta */}
              <div className="flex justify-between items-start mb-4">
                <div className="overflow-hidden">
                  <span className="text-[10px] font-bold bg-red-600 px-[10px] py-[5px] rounded-[3px] text-white  uppercase tracking-widest">
                    {match.matchType}
                  </span>
                  <p className="text-[13px] text-gray-500 font-semibold uppercase truncate mt-3">
                    {match.title}
                  </p>
                </div>
                
                <div className="flex flex-col items-end">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    match.state === 'live' ? 'text-red-500' : 'text-gray-600'
                  }`}>
                    {match.state === 'live' ? '● LIVE' : 'ENDED'}
                  </span>
                </div>
              </div>

              {/* Scoreboard Style */}
              <div className="space-y-4 mb-6">
                {[match.team1, match.team2].map((team, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <img 
                        src={team.flag} 
                        alt="" 
                        className="w-6 h-4 object-cover rounded-sm grayscale-[20%]" 
                      />
                      <span className="font-bold text-[15px] text-gray-100">
                        {team.name}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                       <span className="text-lg font-bold tracking-tight">
                        {team.score || <span className="text-gray-800 text-xs">--</span>}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status Bar */}
              <div className="mt-auto">
                <div className="bg-[#1a1a1a] px-3 py-2 rounded flex items-center gap-2 mb-3">
                  {/* Logic for Dots: Red Pulse for Live, Yellow Static for Upcoming */}
                  {match.status ? (
                    match.state === 'live' && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  )}

                  <p className={`text-[11px] font-bold truncate uppercase ${
                    match.status ? 'text-gray-400' : 'text-yellow-500'
                  }`}>
                    {match.status ? match.status : "UPCOMING"}
                  </p>
                </div>
                
                {/* Dynamic Links from API */}
                <div className="flex gap-4 justify-start px-1">
                  {match.links && match.links.length > 0 ? (
                    match.links.map((link, i) => (
                      <a 
                        key={i} 
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[9px] font-bold text-gray-600 hover:text-blue-400 tracking-widest transition-colors uppercase"
                      >
                        {link.label}
                      </a>
                    ))
                  ) : (
                    ['FORECAST', 'TABLE', 'SCHEDULE'].map((label) => (
                      <button key={label} className="text-[9px] font-bold text-gray-600 hover:text-gray-300 tracking-widest transition-colors">
                        {label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Sports;