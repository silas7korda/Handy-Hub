
import React, { useState, useEffect, useRef } from 'react';
import { Artisan, TradeType, ViewType, Booking } from './types.ts';
import { ARTISANS, Icons } from './constants.tsx';
import { GoogleGenAI } from "@google/genai";

declare var L: any;

// Restricted Bounds for Greater Accra Region
const ACCRA_CENTER: [number, number] = [5.6037, -0.1870];
const ACCRA_BOUNDS = [
  [5.40, -0.60], // Southwest
  [6.00, 0.20]   // Northeast
];

const EXPLORE_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=800', title: 'Smart Home Tech', tag: 'MODERN' },
  { url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=800', title: 'Elite Repairs', tag: 'PREMIUM' },
  { url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=800', title: 'Master Carpentry', tag: 'ARTISAN' },
  { url: 'https://images.unsplash.com/photo-1595841055312-53457ad2383b?auto=format&fit=crop&q=80&w=800', title: 'Landscape Art', tag: 'NATURE' }
];

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'booking' | 'system' | 'alert';
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ViewType>('Home');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [bookingRequestDescription, setBookingRequestDescription] = useState('');
  
  const [greeting, setGreeting] = useState('');
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(true);
  const [notifications] = useState<Notification[]>([
    { id: '1', title: 'Welcome to HandyHub', message: 'Ready to find the best experts in Accra?', time: 'Just now', read: false, type: 'system' }
  ]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [activeCategory, setActiveCategory] = useState<TradeType | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Real-time location label state strictly using coordinates/area name, no parentheses
  const [locationLabel, setLocationLabel] = useState('GH');
  
  // Region availability state
  const [isOutsideRegion, setIsOutsideRegion] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  const homeMapRef = useRef<any>(null);
  const homeMapContainerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<any>(null);
  const userCircleRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  
  const unreadCount = notifications.filter(n => !n.read).length;

  // Reverse Geocoding helper using Nominatim (OpenStreetMap)
  const getFullLocationData = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14&addressdetails=1`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Reverse geocoding failed", error);
      return null;
    }
  };

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide(s => (s + 1) % EXPLORE_IMAGES.length);
    }, 5000);
    return () => clearInterval(slideInterval);
  }, []);

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 18) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  // Map Initialization and Tracking
  useEffect(() => {
    let timer: any;
    if (activeTab === 'Home' && !selectedArtisan) {
      timer = setTimeout(() => {
        if (!homeMapContainerRef.current || typeof L === 'undefined') return;
        
        if (homeMapRef.current) {
          homeMapRef.current.remove();
          homeMapRef.current = null;
        }

        try {
          homeMapRef.current = L.map(homeMapContainerRef.current, { 
            zoomControl: false, 
            attributionControl: false, 
            maxBounds: ACCRA_BOUNDS, 
            maxBoundsViscosity: 1.0, 
            minZoom: 10,
            dragging: true, 
            touchZoom: true,
            scrollWheelZoom: true
          }).setView(ACCRA_CENTER, 14);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(homeMapRef.current);
          
          // Start Geolocation Tracking
          if ("geolocation" in navigator) {
            watchIdRef.current = navigator.geolocation.watchPosition(
              async (position) => {
                const { latitude, longitude, accuracy } = position.coords;
                const pos = [latitude, longitude];

                // Update location label and region check in real-time
                const data = await getFullLocationData(latitude, longitude);
                if (data) {
                  const addr = data.address;
                  const area = addr.suburb || addr.neighbourhood || addr.town || addr.village || addr.residential;
                  const state = addr.state || "";
                  
                  setLocationLabel(area ? `${area}, GH` : 'GH');

                  // Region Check: Specifically look for Greater Accra
                  // Nominatim often returns "Greater Accra Region" or "Greater Accra"
                  const isAvailable = state.toLowerCase().includes('accra');
                  setIsOutsideRegion(!isAvailable);
                } else {
                  setLocationLabel('GH');
                }

                if (homeMapRef.current) {
                  homeMapRef.current.setView(pos, homeMapRef.current.getZoom());
                  
                  if (!userMarkerRef.current) {
                    const userIcon = L.divIcon({
                      className: 'user-location-marker',
                      html: '<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>',
                      iconSize: [16, 16],
                    });
                    userMarkerRef.current = L.marker(pos, { icon: userIcon }).addTo(homeMapRef.current);
                    userCircleRef.current = L.circle(pos, { radius: accuracy, color: '#3b82f6', weight: 1, fillOpacity: 0.15 }).addTo(homeMapRef.current);
                  } else {
                    userMarkerRef.current.setLatLng(pos);
                    userCircleRef.current.setLatLng(pos);
                    userCircleRef.current.setRadius(accuracy);
                  }
                }
              },
              (error) => {
                console.error("Geolocation error:", error);
                setLocationLabel('GH');
              },
              { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
          }

          homeMapRef.current.invalidateSize();
        } catch (e) {
          console.error("Map init error:", e);
        }
      }, 150);
    }

    return () => {
      clearTimeout(timer);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (homeMapRef.current) {
        homeMapRef.current.remove();
        homeMapRef.current = null;
      }
      userMarkerRef.current = null;
      userCircleRef.current = null;
    };
  }, [activeTab, selectedArtisan]);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsAiThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Categorize this service request into one of these: ${Object.values(TradeType).join(', ')}. Request: "${searchQuery}". Return ONLY the category name.`,
      });
      
      const category = response.text.trim() as TradeType;
      if (Object.values(TradeType).includes(category)) {
        setActiveCategory(category);
        setActiveTab('Booking');
      } else {
        setActiveTab('Booking');
      }
    } catch (err) {
      console.error("AI Search Error:", err);
      setActiveTab('Booking');
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    setShowNotificationsDrawer(false);
    if (notification.type === 'booking') {
      setActiveTab('Track');
    }
  };

  const handleBroadcasting = async () => {
    setIsBroadcasting(true);
    setTimeout(() => {
      setIsBroadcasting(false);
      setActiveTab('Track');
    }, 4000);
  };

  const navigateTo = (tab: ViewType) => {
    setSelectedArtisan(null);
    setIsProfileExpanded(false);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen relative font-['Poppins'] select-none overflow-hidden text-white bg-[#0a0f1e]">
      <style>{`
        @keyframes slowBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-slow-bounce {
          animation: slowBounce 3s ease-in-out infinite;
        }
        .explore-sheet-transition {
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }
        .premium-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%);
        }
        .docked-handle {
          box-shadow: 0 10px 40px rgba(0,0,0,0.8);
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
        }
        .floating-sheet {
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 -10px 50px rgba(0,0,0,0.6);
        }
        #home-map-container {
          position: absolute;
          inset: 0;
          z-index: 0;
          width: 100%;
          height: 100%;
          cursor: grab;
        }
        #home-map-container:active {
          cursor: grabbing;
        }
        .artisan-profile-sheet {
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          color: white;
          border-radius: 4rem 4rem 0 0;
          border-top: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 -20px 60px rgba(0,0,0,0.7);
          transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1), margin-top 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .artisan-profile-image-container {
          transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease;
        }
        .region-lock-blur {
          backdrop-filter: blur(40px) brightness(0.3);
          -webkit-backdrop-filter: blur(40px) brightness(0.3);
          pointer-events: auto !important;
        }
      `}</style>

      {/* Region Restriction Overlay */}
      {isOutsideRegion && (
        <div className="fixed inset-0 z-[1000] region-lock-blur flex flex-col items-center justify-center p-8 animate-in fade-in duration-700">
          <div className="max-w-md w-full glass rounded-[3rem] p-10 flex flex-col items-center text-center space-y-8 border-violet-500/20 shadow-[0_0_100px_rgba(139,92,246,0.1)]">
            <div className="w-24 h-24 rounded-full bg-violet-600/10 border border-violet-500/30 flex items-center justify-center animate-slow-bounce">
              <Icons.Track className="w-12 h-12 text-violet-400" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black uppercase tracking-widest text-white">Unavailable</h2>
              <p className="text-white/40 text-xs font-medium leading-relaxed">We detect that you are outside our current operating zone.</p>
            </div>
            <button 
              onClick={() => setShowUnavailableModal(true)}
              className="px-8 py-5 bg-violet-600 rounded-[2rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all w-full"
            >
              Why is this unavailable?
            </button>
          </div>
        </div>
      )}

      {/* Unavailable Info Modal */}
      {showUnavailableModal && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUnavailableModal(false)}></div>
          <div className="glass-dark rounded-[3rem] p-10 max-w-sm w-full relative border border-white/10 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Region Lock</h3>
            <p className="text-white/70 text-sm font-medium leading-relaxed">
              This service is currently not available in your region.
            </p>
            <button 
              onClick={() => setShowUnavailableModal(false)}
              className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      <div className={`fixed inset-0 z-[500] transition-opacity duration-300 ${showNotificationsDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowNotificationsDrawer(false)}></div>
        <div className={`absolute right-4 top-24 bottom-24 w-[85%] max-sm:w-[90%] max-w-sm glass rounded-[3rem] border border-white/10 p-6 flex flex-col transition-all duration-500 transform ${showNotificationsDrawer ? 'translate-x-0' : 'translate-x-[110%]'}`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black">Activity</h2>
          </div>
          <div className="flex-1 overflow-y-auto hide-scrollbar space-y-3">
            {notifications.map(n => (
              <div key={n.id} onClick={() => handleNotificationClick(n)} className={`p-4 rounded-[2rem] border transition-all active:scale-[0.98] cursor-pointer ${n.read ? 'bg-white/[0.02] border-white/5' : 'bg-violet-500/10 border-violet-500/20'}`}>
                <h3 className="font-bold text-xs">{n.title}</h3>
                <p className="text-[10px] text-white/40">{n.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Full Screen Map Background */}
      {activeTab === 'Home' && !selectedArtisan && (
        <div className="absolute inset-0 z-0">
          <div id="home-map-container" ref={homeMapContainerRef} className="w-full h-full"></div>
          <div className="absolute bottom-[200px] left-1/2 -translate-x-1/2 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center space-x-2 z-10 shadow-lg pointer-events-none">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Live Location Tracking</span>
          </div>
        </div>
      )}

      {/* Floating Header */}
      {activeTab === 'Home' && !selectedArtisan && (
        <header className="fixed top-0 left-0 right-0 z-[100] px-4 pt-6 pointer-events-none">
          <div className="max-w-xl mx-auto flex items-center justify-between glass rounded-full px-2 py-2 border border-white/10 shadow-2xl h-14 pointer-events-auto">
            <button onClick={() => setActiveTab('Search')} className="w-10 h-10 rounded-full flex items-center justify-center bg-violet-600/10 border border-violet-500/20 text-violet-400 ml-1">
              <Icons.Search className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center text-center">
              <span className="text-[10px] font-black text-violet-400/80 uppercase tracking-[0.3em]">{greeting}</span>
              <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">{locationLabel}</span>
            </div>
            <button className="relative p-2" onClick={() => setShowNotificationsDrawer(true)}>
              <Icons.Bell className="w-5 h-5 text-slate-300" />
              {unreadCount > 0 && <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
            </button>
          </div>
        </header>
      )}

      <main className="h-screen w-screen relative overflow-hidden pointer-events-none">
        {activeTab === 'Home' && !selectedArtisan && (
          <>
            <div className={`explore-sheet-transition floating-sheet absolute bottom-0 left-0 right-0 z-30 flex flex-col pointer-events-auto ${isExploreOpen ? 'h-[55%] translate-y-0 opacity-100 rounded-t-[4rem]' : 'h-0 translate-y-full opacity-0 pointer-events-none'}`}>
              <div className="p-4 flex justify-center items-center shrink-0 cursor-pointer" onClick={() => setIsExploreOpen(false)}>
                <button className="w-16 h-1.5 bg-white/10 rounded-full hover:bg-violet-500/40 transition-colors" />
              </div>

              <div className="px-6 pb-28 pt-2 flex flex-col space-y-8 overflow-y-auto hide-scrollbar flex-1">
                <div className="relative shrink-0 h-48 group">
                  <div className="relative h-full rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl premium-card">
                    {EXPLORE_IMAGES.map((img, i) => (
                      <div key={i} className={`absolute inset-0 transition-all duration-1000 transform ${currentSlide === i ? 'opacity-100 scale-100' : 'opacity-0 scale-110 pointer-events-none'}`}>
                        <img src={img.url} className="w-full h-full object-cover brightness-[0.6]" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                        <div className="absolute bottom-6 left-8">
                          <span className="inline-block px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-[8px] font-black tracking-[0.3em] text-violet-300 mb-2 uppercase">{img.tag}</span>
                          <h3 className="text-xl font-black tracking-tight">{img.title}</h3>
                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">Certified Pros Nearby</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-end justify-between px-1">
                    <h2 className="text-lg font-black tracking-tight">Top Rated</h2>
                    <button className="text-[10px] font-black uppercase text-white/40">See All</button>
                  </div>
                  <div className="flex space-x-4 overflow-x-auto hide-scrollbar pb-4 -mx-6 px-6">
                    {ARTISANS.map((artisan) => (
                      <div key={artisan.id} onClick={() => setSelectedArtisan(artisan)} className="shrink-0 w-40 premium-card border border-white/5 rounded-[2.5rem] p-4 group cursor-pointer transition-all hover:bg-white/[0.08]">
                        <img src={artisan.image} className="w-full h-28 object-cover rounded-[2rem] shadow-xl" />
                        <div className="mt-3 px-1">
                          <h4 className="font-black text-xs truncate mb-1">{artisan.name}</h4>
                          <p className="text-[8px] font-black text-violet-400 uppercase tracking-widest">{artisan.trade}</p>
                          <div className="flex items-center justify-between mt-3">
                             <span className="text-[8px] font-black text-white/30">{artisan.rating} ★</span>
                             <div className="w-5 h-5 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 12h14m-7-7l7 7-7 7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
                             </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {!isExploreOpen && (
              <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm animate-in slide-in-from-bottom-8 duration-500 pointer-events-auto">
                <button 
                  onClick={() => setIsExploreOpen(true)}
                  className="w-full h-16 rounded-full border border-violet-500/30 flex items-center justify-center space-x-3 active:scale-95 transition-all group docked-handle"
                >
                  <div className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse"></div>
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-violet-400">Discover More</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Search View */}
        {activeTab === 'Search' && (
          <div className="absolute inset-0 z-[400] bg-[#0a0f1e]/90 backdrop-blur-3xl flex flex-col p-8 pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl font-black uppercase tracking-widest">Search</h2>
              <button onClick={() => setActiveTab('Home')} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <form onSubmit={handleSearch} className="relative mb-12">
              <input 
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What do you need help with?"
                className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 px-8 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all pr-20"
              />
              <button 
                type="submit"
                className="absolute right-3 top-3 bottom-3 w-14 rounded-[1.8rem] bg-violet-600 flex items-center justify-center active:scale-90 transition-all"
              >
                {isAiThinking ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Icons.Search className="w-6 h-6" />}
              </button>
            </form>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Suggested</p>
              <div className="flex flex-wrap gap-3">
                {Object.values(TradeType).map(t => (
                  <button 
                    key={t}
                    onClick={() => { setSearchQuery(`I need a ${t}`); handleSearch(); }}
                    className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-xs font-bold hover:bg-violet-500/20 transition-all"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Interactive Artisan Description Page */}
        {selectedArtisan && (
          <div className="fixed inset-0 z-[600] bg-[#0a0f1e] flex flex-col animate-in slide-in-from-right duration-500 pointer-events-auto">
            <button 
              onClick={() => { setSelectedArtisan(null); setIsProfileExpanded(false); }}
              className={`absolute top-8 left-6 z-[610] w-12 h-12 flex items-center justify-center rounded-full bg-white/10 border border-white/10 text-white active:scale-90 shadow-xl transition-opacity duration-300 ${isProfileExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className={`artisan-profile-image-container relative w-full ${isProfileExpanded ? 'h-0 opacity-0' : 'h-[45%]'}`}>
              <img 
                src={selectedArtisan.image} 
                className="w-full h-full object-cover"
                alt={selectedArtisan.name}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1e] via-transparent to-transparent"></div>
            </div>

            <div 
              className={`artisan-profile-sheet flex-1 p-8 relative z-10 flex flex-col items-center ${isProfileExpanded ? 'h-full mt-0' : 'h-[65%] -mt-20'}`}
            >
              <div 
                className="w-full p-4 flex justify-center items-center shrink-0 cursor-pointer" 
                onClick={() => setIsProfileExpanded(!isProfileExpanded)}
              >
                <div className={`w-16 h-1.5 bg-white/20 rounded-full transition-all duration-300 ${isProfileExpanded ? 'bg-violet-500/40 w-24' : 'hover:bg-violet-500/40'}`} />
              </div>
              
              <div className="w-full text-left space-y-6 flex-1 overflow-y-auto hide-scrollbar pb-6">
                <div>
                  <div className="flex justify-between items-start">
                    <h1 className="text-4xl font-black tracking-tight mb-2">{selectedArtisan.name}</h1>
                    {isProfileExpanded && (
                       <button onClick={() => setIsProfileExpanded(false)} className="text-white/20 hover:text-white transition-colors">
                          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                       </button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex text-yellow-400">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-5 h-5 ${i < Math.floor(selectedArtisan.rating) ? 'fill-current' : 'fill-white/10'}`} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-white/40 text-sm font-black">{selectedArtisan.rating} • {selectedArtisan.reviews} reviews</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="px-6 py-3 rounded-2xl bg-violet-600/10 border border-violet-500/30 text-violet-400 font-black text-xs uppercase tracking-widest">
                    {selectedArtisan.trade}
                  </div>
                  <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-black text-xs uppercase tracking-widest">
                    Elite Pro
                  </div>
                </div>

                <div className="p-6 glass-dark rounded-[2.5rem] border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-white/30 font-black text-[10px] uppercase tracking-[0.2em]">Current Rate</span>
                    <span className="text-white font-black text-xl">$25/hr</span>
                  </div>
                  <div className="space-y-3">
                    <p className="text-white/70 text-sm leading-relaxed font-medium">
                      Professional service within a {selectedArtisan.distance} radius. Julian specializes in high-efficiency electrical repairs and modern smart home installations.
                    </p>
                    {isProfileExpanded && (
                      <p className="text-white/50 text-xs leading-relaxed animate-in fade-in duration-700">
                        {selectedArtisan.bio} With years of field experience across Greater Accra, this specialist guarantees satisfaction and high safety standards for all residential projects.
                      </p>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => { setSelectedArtisan(null); setIsProfileExpanded(false); setActiveTab('Booking'); }}
                  className="w-full py-6 bg-violet-600 text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] active:scale-95 shadow-2xl shadow-violet-500/40 transition-all"
                >
                  Book Service
                </button>
              </div>

              <div className="mt-auto w-[85%] max-sm:w-[90%] max-w-sm mb-4">
                <div className="glass rounded-full px-6 py-4 flex items-center justify-between border border-white/10 shadow-2xl">
                  <button onClick={() => navigateTo('Home')} className="text-violet-400 scale-125 transition-all"><Icons.Home className="w-5 h-5" /></button>
                  <button onClick={() => navigateTo('Booking')} className="text-slate-500"><Icons.Booking className="w-5 h-5" /></button>
                  <button onClick={() => navigateTo('Track')} className="text-slate-500"><Icons.Track className="w-5 h-5" /></button>
                  <button onClick={() => navigateTo('Account')} className="text-slate-500"><Icons.Account className="w-5 h-5" /></button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab !== 'Home' && activeTab !== 'Search' && (
          <div className="absolute inset-0 z-40 bg-[#0a0f1e] pt-24 px-6 overflow-y-auto pb-32 pointer-events-auto">
            {activeTab === 'Booking' && (
              <div className="max-w-xl mx-auto space-y-6 animate-in fade-in">
                <div className="glass rounded-[3.5rem] p-8 border border-white/10 shadow-2xl space-y-8">
                  <label className="text-[9px] font-black uppercase text-violet-400 tracking-widest block">Request Specialist</label>
                  <div className="p-5 glass-dark border border-white/5 rounded-[2.2rem] flex items-center justify-between">
                     <span className="font-bold">{activeCategory || "General Maintenance"}</span>
                     <button onClick={() => setActiveTab('Search')} className="text-[8px] font-black text-violet-400 uppercase">Change</button>
                  </div>
                  <textarea 
                    value={bookingRequestDescription}
                    onChange={(e) => setBookingRequestDescription(e.target.value)}
                    placeholder="Briefly describe your requirements..."
                    className="w-full h-32 glass bg-white/5 border border-white/10 rounded-[2.2rem] p-5 text-xs focus:outline-none placeholder:text-white/10 resize-none"
                  />
                  <button onClick={handleBroadcasting} className="w-full py-5 bg-violet-600 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                    Broadcast Request
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {!selectedArtisan && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[350] w-[85%] max-sm:w-[90%] max-w-sm pointer-events-auto">
          <div className="glass rounded-full px-6 py-4 flex items-center justify-between border border-white/10 shadow-2xl">
            <button onClick={() => setActiveTab('Home')} className={activeTab === 'Home' ? 'text-violet-400 scale-125 transition-all' : 'text-slate-500'}><Icons.Home className="w-5 h-5" /></button>
            <button onClick={() => setActiveTab('Booking')} className={activeTab === 'Booking' ? 'text-violet-400 scale-125 transition-all' : 'text-slate-500'}><Icons.Booking className="w-5 h-5" /></button>
            <button onClick={() => setActiveTab('Track')} className={activeTab === 'Track' ? 'text-violet-400 scale-125 transition-all' : 'text-slate-500'}><Icons.Track className="w-5 h-5" /></button>
            <button onClick={() => setActiveTab('Account')} className={activeTab === 'Account' ? 'text-violet-400 scale-125 transition-all' : 'text-slate-500'}><Icons.Account className="w-5 h-5" /></button>
          </div>
        </nav>
      )}

      {isBroadcasting && (
        <div className="fixed inset-0 z-[700] glass-dark flex flex-col items-center justify-center space-y-12 p-8 animate-in fade-in pointer-events-auto">
          <div className="w-32 h-32 rounded-full border-2 border-violet-500/30 flex items-center justify-center relative bg-slate-950 shadow-2xl">
            <Icons.Search className="w-12 h-12 text-violet-400 animate-pulse" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-wider">Locating Local Pros...</h2>
        </div>
      )}
    </div>
  );
};

export default App;
