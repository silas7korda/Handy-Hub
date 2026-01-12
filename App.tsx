
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Artisan, TradeType, ViewType, Booking } from './types';
import { ARTISANS, CATEGORIES, Icons } from './constants';
import { ArtisanCard } from './components/ArtisanCard';
import { BookingModal } from './components/BookingModal';

declare var L: any;

const ACCRA_BOUNDS = [
  [5.45, -0.65], 
  [6.15, 0.55]   
];
const ACCRA_CENTER: [number, number] = [5.6037, -0.1870];

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
  const [selectedTrade, setSelectedTrade] = useState<TradeType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [showBoundaryWarning, setShowBoundaryWarning] = useState(false);
  const [showTrackingNotice, setShowTrackingNotice] = useState(true);
  const [isOutOfRange, setIsOutOfRange] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [isExplorePanelOpen, setIsExplorePanelOpen] = useState(false);
  const [previewArtisan, setPreviewArtisan] = useState<Artisan | null>(null);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Welcome to HandyHub', message: 'Discover the best artisans in Accra today!', time: 'Just now', read: false, type: 'system' }
  ]);
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const userMarkerRef = useRef<any>(null);
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  const longPressTimer = useRef<any>(null);

  const [bookingDate, setBookingDate] = useState('2024-05-25');
  const [bookingTime, setBookingTime] = useState('10:00');
  const [isConfirming, setIsConfirming] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    
    if (deltaY > 100 && isExplorePanelOpen) setIsExplorePanelOpen(false);
    if (deltaY > 100 && showNotificationsDrawer) setShowNotificationsDrawer(false);
    
    if (Math.abs(deltaX) > 150 && Math.abs(deltaY) < 50) {
      if (deltaX > 0 && activeTab === 'Booking') setActiveTab('Home');
      if (deltaX < 0 && activeTab === 'Home') setActiveTab('Search');
    }
  };

  // Fix for line 283: Defined handleBookArtisan to manage the selection and opening of the booking flow
  const handleBookArtisan = (artisan: Artisan) => {
    if (isOutOfRange) {
      setShowBoundaryWarning(true);
      setTimeout(() => setShowBoundaryWarning(false), 3000);
      return;
    }
    setSelectedArtisan(artisan);
    setIsBookingModalOpen(true);
  };

  const handleArtisanTouchStart = (artisan: Artisan) => {
    longPressTimer.current = setTimeout(() => {
      setPreviewArtisan(artisan);
      if (window.navigator.vibrate) window.navigator.vibrate(50);
    }, 600);
  };

  const handleArtisanTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    setPreviewArtisan(null);
  };

  const lastTap = useRef<number>(0);
  const handleMapTouch = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      mapRef.current.setZoom(mapRef.current.getZoom() + 1);
    }
    lastTap.current = now;
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowTrackingNotice(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  useEffect(() => {
    if (activeTab === 'Home' && mapContainerRef.current && !mapRef.current) {
      mapRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        maxBounds: ACCRA_BOUNDS,
        maxBoundsViscosity: 1.0,
        minZoom: 10
      }).setView(ACCRA_CENTER, 15);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapRef.current);
      mapRef.current.on('touchstart', handleMapTouch);

      const userIcon = L.divIcon({
        html: `<div class="bg-blue-600 w-5 h-5 rounded-full border-2 border-white shadow-[0_0_20px_rgba(59,130,246,1)] animate-pulse"></div>`,
        className: 'custom-div-icon',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (pos) => {
            const inAccra = pos.coords.latitude >= ACCRA_BOUNDS[0][0] && 
                            pos.coords.latitude <= ACCRA_BOUNDS[1][0] &&
                            pos.coords.longitude >= ACCRA_BOUNDS[0][1] &&
                            pos.coords.longitude <= ACCRA_BOUNDS[1][1];
            setIsOutOfRange(!inAccra);
            const targetPos = inAccra ? [pos.coords.latitude, pos.coords.longitude] : ACCRA_CENTER;
            if (!userMarkerRef.current) {
              userMarkerRef.current = L.marker(targetPos, { icon: userIcon }).addTo(mapRef.current);
            } else {
              userMarkerRef.current.setLatLng(targetPos);
            }
            mapRef.current.setView(targetPos, 16, { animate: true });
          },
          () => setIsOutOfRange(true),
          { enableHighAccuracy: true }
        );
      }

      ARTISANS.forEach((artisan) => {
        const offsetLat = (Math.random() - 0.5) * 0.04;
        const offsetLng = (Math.random() - 0.5) * 0.04;
        const artisanIcon = L.divIcon({
          html: `<div class="w-10 h-10 rounded-2xl overflow-hidden border-2 border-violet-500 shadow-lg bg-slate-900 ring-4 ring-violet-500/20 active:scale-90 transition-transform">
                    <img src="${artisan.image}" class="w-full h-full object-cover">
                  </div>`,
          className: 'artisan-marker-icon',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });
        const marker = L.marker([ACCRA_CENTER[0] + offsetLat, ACCRA_CENTER[1] + offsetLng], { icon: artisanIcon }).addTo(mapRef.current);
        marker.on('click', () => {
          setSelectedArtisan(artisan);
          setIsExplorePanelOpen(true);
        });
      });
    }
  }, [activeTab]);

  const confirmBooking = (date: string, time: string) => {
    if (!selectedArtisan || isOutOfRange) return;
    setIsConfirming(true);
    setTimeout(() => {
      const newBooking: Booking = {
        id: Math.random().toString(36).substr(2, 9),
        artisanId: selectedArtisan.id,
        artisanName: selectedArtisan.name,
        status: 'Accepted',
        date: date,
        time: time
      };
      setBookings(prev => [newBooking, ...prev]);
      setNotifications(prev => [{
        id: Math.random().toString(),
        title: 'Booking Confirmed!',
        message: `Your appointment with ${selectedArtisan.name} is set.`,
        time: 'Just now',
        read: false,
        type: 'booking'
      }, ...prev]);
      setIsConfirming(false);
      setIsBookingModalOpen(false);
      setShowNotification(true);
      setActiveTab('Track');
      setTimeout(() => setShowNotification(false), 4000);
    }, 1500);
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className="min-h-screen relative font-['Poppins'] select-none overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      
      {/* Artisan Preview Overlay */}
      {previewArtisan && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in zoom-in duration-200" onClick={() => setPreviewArtisan(null)}>
           <div className="glass p-8 rounded-[3rem] text-center space-y-4 max-w-xs border border-white/20">
              <img src={previewArtisan.image} className="w-32 h-32 rounded-full mx-auto border-4 border-violet-500 shadow-2xl" />
              <h3 className="text-2xl font-bold text-white">{previewArtisan.name}</h3>
              <p className="text-violet-400 font-medium">{previewArtisan.trade}</p>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Release to Close</p>
           </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal 
        artisan={selectedArtisan} 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        onConfirm={confirmBooking} 
      />

      {/* Notifications Drawer */}
      <div className={`fixed inset-0 z-[250] transition-opacity duration-300 ${showNotificationsDrawer ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setShowNotificationsDrawer(false)}></div>
        <div className={`absolute top-0 right-0 h-full w-[85%] max-w-sm glass-dark shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/10 transition-transform duration-500 ease-out transform ${showNotificationsDrawer ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-white">Inbox</h2>
              <button onClick={markAllAsRead} className="text-violet-400 text-xs font-bold uppercase tracking-widest">Clear All</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 hide-scrollbar">
              {notifications.map(n => (
                <div key={n.id} className={`p-5 rounded-3xl border transition-all ${n.read ? 'bg-white/5 border-white/5 opacity-60' : 'glass border-violet-500/20'}`}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[10px] font-black uppercase tracking-tighter text-violet-400">{n.type}</span>
                    <span className="text-[10px] text-slate-500">{n.time}</span>
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">{n.title}</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">{n.message}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowNotificationsDrawer(false)} className="mt-4 w-full py-4 glass text-white text-xs font-bold uppercase tracking-widest rounded-2xl">Close Drawer</button>
          </div>
        </div>
      </div>

      <header className="fixed top-0 left-0 right-0 z-[100] px-4 pt-6">
        <div className="max-w-xl mx-auto flex items-center justify-between glass rounded-[2.5rem] px-3 py-2 border border-white/10 shadow-2xl relative h-16">
          <div className="relative flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('Account')}>
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-white/20 active:scale-90 transition-transform">
              <img src="https://picsum.photos/id/64/100/100" alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-full px-6 py-1.5 shadow-inner">
            <span className="text-[12px] font-bold text-violet-400 uppercase tracking-widest">{greeting}</span>
          </div>
          <div className="relative p-2 active:scale-125 transition-transform cursor-pointer" onClick={() => setShowNotificationsDrawer(true)}>
             <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
             {unreadCount > 0 && <div className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1e293b] animate-bounce"></div>}
          </div>
        </div>
      </header>

      <main className="h-screen w-screen transition-all duration-500">
        {activeTab === 'Home' && (
          <div className="fixed inset-0 overflow-hidden bg-[#0a0f1e]">
            <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
            <div className="absolute top-28 left-1/2 -translate-x-1/2 w-[90%] max-w-lg z-40">
              <div className="glass rounded-[2rem] p-1.5 flex items-center border border-white/10 shadow-2xl">
                <input type="text" placeholder="Search Accra artisans..." className="flex-1 bg-transparent border-none focus:ring-0 text-white p-3 placeholder:text-slate-500 text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                <button onClick={() => setIsExplorePanelOpen(true)} className="bg-violet-600 p-3 rounded-full text-white active:scale-95 transition-transform"><Icons.Search className="w-5 h-5" /></button>
              </div>
            </div>
            {showBoundaryWarning && (
              <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[110] w-[90%] max-w-xs px-6 py-4 glass-dark border border-amber-500/50 rounded-[2rem] shadow-2xl animate-in zoom-in duration-300">
                <div className="flex flex-col items-center text-center space-y-2 text-white">
                  <span className="text-sm font-bold">Access Restricted</span>
                  <p className="text-[11px] text-slate-400">Services are localized to Greater Accra.</p>
                </div>
              </div>
            )}
            <div className={`fixed inset-x-0 bottom-0 z-50 transition-transform duration-500 ease-in-out transform ${isExplorePanelOpen ? 'translate-y-0' : 'translate-y-[85%]'}`} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
              <div className="glass-dark rounded-t-[3.5rem] h-[80vh] border-t border-white/10 shadow-2xl flex flex-col p-6 overflow-hidden">
                <div className="w-20 h-1.5 bg-white/20 rounded-full mx-auto mb-8 cursor-pointer" onClick={() => setIsExplorePanelOpen(!isExplorePanelOpen)}></div>
                <h2 className="text-2xl font-bold text-white mb-6">Accra Hub</h2>
                <div className="flex-1 overflow-y-auto hide-scrollbar pb-20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ARTISANS.map(artisan => (
                      <div key={artisan.id} className="relative active:scale-[0.98] transition-transform" onTouchStart={() => handleArtisanTouchStart(artisan)} onTouchEnd={handleArtisanTouchEnd}>
                        <ArtisanCard artisan={artisan} onClick={handleBookArtisan} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Booking' && (
          <div className="pb-32 pt-28 px-4 max-w-4xl mx-auto z-10 relative">
            <div className="glass rounded-[2.5rem] p-8 border border-white/10 animate-in slide-in-from-bottom duration-500">
              {selectedArtisan ? (
                <>
                  <div className="flex items-center space-x-6 mb-8">
                    <img src={selectedArtisan.image} className="w-24 h-24 rounded-3xl object-cover border-2 border-violet-500/20" />
                    <div><h2 className="text-2xl font-bold text-white">{selectedArtisan.name}</h2><p className="text-violet-400 font-medium">{selectedArtisan.trade}</p></div>
                  </div>
                  <button onClick={() => setIsBookingModalOpen(true)} className="w-full py-5 bg-violet-600 rounded-2xl font-bold uppercase tracking-widest text-white active:scale-95 transition-all shadow-xl shadow-violet-600/20">
                    {isConfirming ? 'Processing...' : 'Proceed to Schedule'}
                  </button>
                </>
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-400 mb-6">No artisan selected for booking.</p>
                  <button onClick={() => setActiveTab('Home')} className="bg-violet-600 px-8 py-3 rounded-full text-white font-bold">Find an Artisan</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'Track' && (
          <div className="pt-28 px-4 max-w-xl mx-auto space-y-4">
            <h2 className="text-2xl font-bold text-white px-2">Live Status</h2>
            {bookings.length === 0 ? <p className="text-slate-500 text-center glass p-10 rounded-3xl">No active bookings.</p> : 
              bookings.map(b => (
                <div key={b.id} className="glass p-6 rounded-[2rem] flex items-center justify-between animate-in slide-in-from-right duration-300">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-violet-600/20 rounded-2xl flex items-center justify-center text-violet-400"><Icons.Track className="w-6 h-6" /></div>
                    <div><p className="text-white font-bold">{b.artisanName}</p><p className="text-violet-400 text-[10px] uppercase font-bold tracking-widest">{b.status}</p></div>
                  </div>
                  <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-black animate-pulse">LIVE</div>
                </div>
              ))
            }
          </div>
        )}
      </main>

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md">
        <div className="glass rounded-full px-6 py-4 flex items-center justify-between border border-white/10 shadow-2xl">
          <button onClick={() => setActiveTab('Home')} className={`p-2 transition-all ${activeTab === 'Home' ? 'text-violet-400 scale-125' : 'text-slate-500'}`}><Icons.Home className="w-6 h-6" /></button>
          <button onClick={() => isOutOfRange ? setShowBoundaryWarning(true) : setActiveTab('Booking')} className={`p-2 transition-all ${activeTab === 'Booking' ? 'text-violet-400 scale-125' : 'text-slate-500'}`}><Icons.Booking className="w-6 h-6" /></button>
          <button onClick={() => setActiveTab('Search')} className={`p-2 transition-all ${activeTab === 'Search' ? 'text-violet-400 scale-125' : 'text-slate-500'}`}><Icons.Search className="w-6 h-6" /></button>
          <button onClick={() => setActiveTab('Track')} className={`p-2 transition-all ${activeTab === 'Track' ? 'text-violet-400 scale-125' : 'text-slate-500'}`}><Icons.Track className="w-6 h-6" /></button>
          <button onClick={() => setActiveTab('Account')} className={`p-2 transition-all ${activeTab === 'Account' ? 'text-violet-400 scale-125' : 'text-slate-500'}`}><Icons.Account className="w-6 h-6" /></button>
        </div>
      </nav>

      {showNotification && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-xs animate-in slide-in-from-top duration-300" onClick={() => setShowNotification(false)}>
          <div className="glass bg-green-500/10 border-green-500/50 p-4 rounded-3xl flex items-center space-x-4 shadow-2xl">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg></div>
            <div><p className="text-white font-bold text-sm">Booking Success</p><p className="text-green-400 text-xs">View details in Status</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
