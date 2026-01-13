
import React from 'react';
import { Artisan, TradeType } from './types';

export const ARTISANS: Artisan[] = [
  {
    id: '1',
    name: 'Julian Vance',
    trade: TradeType.ELECTRICIAN,
    rating: 4.9,
    reviews: 124,
    image: 'https://picsum.photos/seed/juli/200',
    distance: '1.2 km',
    priceRange: '$$',
    bio: 'Certified master electrician with 10+ years experience in smart home integration.'
  },
  {
    id: '2',
    name: 'Sarah Chen',
    trade: TradeType.PLUMBER,
    rating: 4.8,
    reviews: 89,
    image: 'https://picsum.photos/seed/sarah/200',
    distance: '0.8 km',
    priceRange: '$$$',
    bio: 'Leak detection expert. Available for emergency services 24/7.'
  },
  {
    id: '3',
    name: 'Marcus Thorne',
    trade: TradeType.CARPENTER,
    rating: 4.7,
    reviews: 210,
    image: 'https://picsum.photos/seed/marc/200',
    distance: '3.5 km',
    priceRange: '$$',
    bio: 'Custom furniture and artisanal woodcrafting. Passionate about detail.'
  },
  {
    id: '4',
    name: 'Elena Rodriguez',
    trade: TradeType.PAINTER,
    rating: 5.0,
    reviews: 56,
    image: 'https://picsum.photos/seed/elena/200',
    distance: '2.1 km',
    priceRange: '$',
    bio: 'Interior specialist. Transforming spaces with premium finishes.'
  },
  {
    id: '5',
    name: 'David Kim',
    trade: TradeType.GARDENER,
    rating: 4.6,
    reviews: 142,
    image: 'https://picsum.photos/seed/david/200',
    distance: '4.0 km',
    priceRange: '$$',
    bio: 'Landscape designer focusing on drought-tolerant sustainable gardens.'
  }
];

export const CATEGORIES = Object.values(TradeType);

export const Icons = {
  Home: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  Booking: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Search: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  Bell: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Track: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Account: (props: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
};
