
export interface Artisan {
  id: string;
  name: string;
  trade: TradeType;
  rating: number;
  reviews: number;
  image: string;
  distance: string;
  priceRange: string;
  bio: string;
}

export enum TradeType {
  PLUMBER = 'Plumber',
  ELECTRICIAN = 'Electrician',
  CARPENTER = 'Carpenter',
  PAINTER = 'Painter',
  GARDENER = 'Gardener',
  CLEANER = 'Cleaner'
}

export interface Booking {
  id: string;
  artisanId: string;
  status: 'Pending' | 'Accepted' | 'En Route' | 'On-site' | 'Completed';
  date: string;
  time: string;
  artisanName: string;
}

export type ViewType = 'Home' | 'Booking' | 'Search' | 'Track' | 'Account';
