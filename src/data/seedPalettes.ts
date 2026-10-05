import { Palette } from '../types';
import { buildPaletteColor } from '../utils/colorUtils';

interface RawPaletteSeed {
  id: string;
  name: string;
  hexes: string[];
  tags: string[];
  styles: string[];
  topics: string[];
  creatorName: string;
  creatorAvatar: string;
  likes: number;
  views: number;
}

const rawSeeds: RawPaletteSeed[] = [
  {
    id: 'pal-1',
    name: 'Nordic Moss & Terrene',
    hexes: ['#264653', '#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'],
    tags: ['Nature', 'Warm', 'Design System', 'SaaS'],
    styles: ['Warm', '5 Colors', 'Vintage', 'Bright'],
    topics: ['Nature', 'Sunset', 'Autumn'],
    creatorName: 'Elena Rostova',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    likes: 4280,
    views: 18450,
  },
  {
    id: 'pal-2',
    name: 'Alabaster Minimalist',
    hexes: ['#FFFFFF', '#F8F9FA', '#E9ECEF', '#CED4DA', '#6C757D', '#212529'],
    tags: ['Minimal', 'White', 'SaaS', 'Monochrome'],
    styles: ['Monochromatic', '6 Colors', 'Cold', 'Dark'],
    topics: ['City', 'Relax'],
    creatorName: 'Marcus Vance',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    likes: 8920,
    views: 34100,
  },
  {
    id: 'pal-3',
    name: 'Kyoto Tea & Bamboo',
    hexes: ['#2D3A24', '#4B5842', '#8B9D77', '#C8D6AF', '#F2F5EA'],
    tags: ['Nature', 'Organic', 'Pastel', 'Green'],
    styles: ['Pastel', '5 Colors', 'Cold', 'Warm'],
    topics: ['Nature', 'Relax', 'Spring'],
    creatorName: 'Sora Takahashi',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces',
    likes: 3120,
    views: 12900,
  },
  {
    id: 'pal-4',
    name: 'Cyberpunk Tokyo Noir',
    hexes: ['#0A0908', '#22333B', '#EAE0D5', '#C6AC8F', '#5E503F'],
    tags: ['Dark', 'Luxury', 'Minimal', 'Vintage'],
    styles: ['Dark', '5 Colors', 'Vintage', 'Warm'],
    topics: ['City', 'Space'],
    creatorName: 'Devon Miles',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
    likes: 6740,
    views: 29800,
  },
  {
    id: 'pal-5',
    name: 'Riviera Sunset Glow',
    hexes: ['#F72585', '#7209B7', '#3A0CA3', '#4361EE', '#4CC9F0'],
    tags: ['Vibrant', 'Gradient', 'Neon', 'Sunset'],
    styles: ['Bright', 'Gradient', '5 Colors', 'Rainbow'],
    topics: ['Sunset', 'Party', 'Pride', 'Summer'],
    creatorName: 'Amara Lopez',
    creatorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    likes: 12400,
    views: 51200,
  },
  {
    id: 'pal-6',
    name: 'Heirloom Gold & Velvet',
    hexes: ['#1C1917', '#44403C', '#CA8A04', '#FACC15', '#FEF08A'],
    tags: ['Luxury', 'Gold', 'Branding', 'Warm'],
    styles: ['Warm', 'Bright', '5 Colors', 'Dark'],
    topics: ['Gold', 'Wedding', 'Party'],
    creatorName: 'Julian Sterling',
    creatorAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces',
    likes: 5410,
    views: 22100,
  },
  {
    id: 'pal-7',
    name: 'Santorini Coastline',
    hexes: ['#03045E', '#023E8A', '#0077B6', '#0096C7', '#00B4D8', '#48CAE4', '#90E0EF', '#ADE8F4', '#CAF0F8'],
    tags: ['Ocean', 'Blue', 'Gradient', 'Clean'],
    styles: ['Monochromatic', 'Gradient', 'Cold', '9 Colors'],
    topics: ['Water', 'Summer', 'Relax'],
    creatorName: 'Nikos Katsaros',
    creatorAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=faces',
    likes: 9810,
    views: 41000,
  },
  {
    id: 'pal-8',
    name: 'Strawberry Milk & Macaron',
    hexes: ['#FFB5A7', '#FCD5CE', '#F8EDEB', '#F9DCC4', '#FEC89A'],
    tags: ['Pastel', 'Sweet', 'Pink', 'Soft'],
    styles: ['Pastel', 'Warm', '5 Colors'],
    topics: ['Food', 'Happy', 'Kids', 'Spring'],
    creatorName: 'Chloe Dupont',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=faces',
    likes: 7300,
    views: 28500,
  },
  {
    id: 'pal-9',
    name: 'Midnight Nebula',
    hexes: ['#0B0C10', '#1F2833', '#C5C6C7', '#66FCF1', '#45A29E'],
    tags: ['Tech', 'Dark', 'Turquoise', 'Futuristic'],
    styles: ['Dark', 'Cold', 'Bright', '5 Colors'],
    topics: ['Space', 'City'],
    creatorName: 'Arjun Mehta',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=faces',
    likes: 11200,
    views: 49000,
  },
  {
    id: 'pal-10',
    name: 'Spiced Pumpkin Harvest',
    hexes: ['#3A015C', '#4F0147', '#35012C', '#290025', '#11011E', '#FF5964', '#F4A261', '#E76F51'],
    tags: ['Autumn', 'Halloween', 'Warm', 'Orange'],
    styles: ['Warm', 'Dark', '8 Colors'],
    topics: ['Halloween', 'Autumn', 'Party'],
    creatorName: 'Amber Hollister',
    creatorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces',
    likes: 4980,
    views: 19800,
  }
];

export const SEED_PALETTES: Palette[] = rawSeeds.map((seed, index) => {
  return {
    id: seed.id,
    name: seed.name,
    colors: seed.hexes.map((hex) => buildPaletteColor(hex)),
    tags: seed.tags,
    styles: seed.styles,
    topics: seed.topics,
    creator: {
      id: `user-${index + 1}`,
      name: seed.creatorName,
      avatar: seed.creatorAvatar,
    },
    likes: seed.likes,
    views: seed.views,
    createdAt: new Date(Date.now() - (index * 86400000 * 2.3)).toISOString(),
    isPublic: true,
    isFavorite: false,
  };
});
