
import React, { useState } from 'react';
import { Artisan } from '../types';

interface BookingModalProps {
  artisan: Artisan | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (date: string, time: string) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ artisan, isOpen, onClose, onConfirm }) => {
  const [date, setDate] = useState('2024-05-20');
  const [time, setTime] = useState('10:00');

  if (!isOpen || !artisan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="glass rounded-3xl w-full max-w-md p-6 relative animate-in slide-in-from-bottom duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-center space-x-4 mb-6">
          <img src={artisan.image} alt={artisan.name} className="w-16 h-16 rounded-full object-cover border-2 border-violet-500/30" />
          <div>
            <h2 className="text-xl font-bold text-white">{artisan.name}</h2>
            <p className="text-violet-400">{artisan.trade}</p>
          </div>
        </div>

        <p className="text-slate-300 text-sm mb-6 leading-relaxed">
          {artisan.bio}
        </p>

        <div className="space-y-4 mb-8">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Date</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Time</label>
            <select 
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              <option value="09:00">09:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="14:00">02:00 PM</option>
              <option value="15:00">03:00 PM</option>
            </select>
          </div>
        </div>

        <button 
          onClick={() => onConfirm(date, time)}
          className="w-full py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95"
        >
          Confirm Booking
        </button>
      </div>
    </div>
  );
};
