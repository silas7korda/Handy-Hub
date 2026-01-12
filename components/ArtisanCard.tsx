
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
      className="glass rounded-3xl p-5 group cursor-pointer transition-all duration-300 hover:scale-[1.03] glow-hover flex flex-col items-center text-center space-y-4"
    >
      <div className="relative">
        <div className="absolute inset-0 bg-violet-500 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity rounded-full"></div>
        <img 
          src={artisan.image} 
          alt={artisan.name} 
          className="w-24 h-24 rounded-full object-cover border-2 border-white/20 shadow-xl"
        />
      </div>
      
      <div>
        <h3 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">{artisan.name}</h3>
        <p className="text-violet-400 text-sm font-medium">{artisan.trade}</p>
      </div>

      <div className="flex items-center space-x-1 text-yellow-400">
        <span className="text-sm font-bold">{artisan.rating}</span>
        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-slate-400 text-xs ml-1">({artisan.reviews})</span>
      </div>

      <div className="flex w-full justify-between items-center pt-2">
        <span className="text-xs text-slate-400">{artisan.distance}</span>
        <button className="bg-violet-600/80 hover:bg-violet-600 text-white text-xs px-4 py-2 rounded-full transition-colors font-semibold shadow-lg backdrop-blur-md">
          Book Now
        </button>
      </div>
    </div>
  );
};
