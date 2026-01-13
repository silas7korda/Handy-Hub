
import React from 'react';
import { Artisan } from '../types';

interface ArtisanCardProps {
  artisan: Artisan;
  onClick: (artisan: Artisan) => void;
}

export const ArtisanCard: React.FC<ArtisanCardProps> = ({ artisan, onClick }) => {
  return (
    <div 
      onClick={() => onClick(artisan)}
      className="glass rounded-[1.8rem] p-3 group cursor-pointer transition-all duration-500 hover:bg-white/10 flex items-center space-x-4 border border-white/10"
    >
      <div className="relative shrink-0">
        <div className="absolute inset-0 bg-violet-500 blur-xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full"></div>
        <img 
          src={artisan.image} 
          alt={artisan.name} 
          className="w-14 h-14 rounded-2xl object-cover border-2 border-white/10 group-hover:scale-105 transition-transform"
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white truncate group-hover:text-violet-300 transition-colors">
          {artisan.name}
        </h3>
        <p className="text-violet-400 text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 opacity-80">
          {artisan.trade}
        </p>
        
        <div className="flex items-center space-x-1.5 opacity-60">
          <span className="text-[9px] font-bold text-yellow-400">★ {artisan.rating}</span>
          <span className="text-white/30 text-[8px] font-medium tracking-tight">({artisan.reviews} reviews)</span>
        </div>
      </div>

      <div className="flex flex-col items-end space-y-1.5 pr-1">
        <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">{artisan.distance}</span>
        <button className="bg-violet-600/80 hover:bg-violet-600 text-white text-[9px] px-3 py-1.5 rounded-xl transition-all font-black uppercase tracking-widest active:scale-90 shadow-md">
          Book
        </button>
      </div>
    </div>
  );
};
