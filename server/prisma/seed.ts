/* eslint-disable no-console */
// Seeds an admin account, the site settings and demo catalogue content.
// Safe to run multiple times: existing data is never overwritten.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_SETTINGS } from '../src/lib/settings.ts';

const prisma = new PrismaClient();

const img = (id: string, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

type SeedProduct = {
  name: string;
  category: string; // category slug
  price: number;
  compareAtPrice?: number;
  short: string;
  description: string;
  images: string[];
  materials?: string;
  dimensions?: string;
  colors?: { name: string; hex: string }[];
  options?: { name: string; values: string[] }[];
  specs?: { label: string; value: string }[];
  tags?: string[];
  stock?: number;
  featured?: boolean;
  isNew?: boolean;
  bestSeller?: boolean;
};

const categories = [
  {
    name: 'Living Room',
    slug: 'living-room',
    description: 'Sofas, armchairs, coffee tables and media units for the heart of the home.',
    imageUrl: img('1600210492486-724fe5c67fb0'),
    children: [
      { name: 'Sofas', slug: 'sofas', description: 'Two, three seaters and modular sectionals.' },
      { name: 'Armchairs', slug: 'armchairs', description: 'Lounge, accent and reading chairs.' },
      { name: 'Coffee & Side Tables', slug: 'coffee-tables', description: 'Solid wood, marble and glass tables.' },
      { name: 'TV Units', slug: 'tv-units', description: 'Media consoles and wall units.' },
    ],
  },
  {
    name: 'Bedroom',
    slug: 'bedroom',
    description: 'Beds, wardrobes and nightstands designed for rest.',
    imageUrl: img('1616594039964-ae9021a400a0'),
    children: [
      { name: 'Beds', slug: 'beds', description: 'Upholstered, platform and storage beds.' },
      { name: 'Wardrobes', slug: 'wardrobes', description: 'Sliding and hinged door wardrobes.' },
      { name: 'Nightstands', slug: 'nightstands', description: 'Bedside tables and cabinets.' },
      { name: 'Dressers', slug: 'dressers', description: 'Chests of drawers and dressing tables.' },
    ],
  },
  {
    name: 'Dining',
    slug: 'dining',
    description: 'Tables, chairs and sideboards for everyday meals and big gatherings.',
    imageUrl: img('1551298370-9d3d53740c72'),
    children: [
      { name: 'Dining Tables', slug: 'dining-tables', description: 'Rectangular, round and extendable tables.' },
      { name: 'Dining Chairs', slug: 'dining-chairs', description: 'Wooden, upholstered and bar seating.' },
      { name: 'Sideboards', slug: 'sideboards', description: 'Buffets, sideboards and display cabinets.' },
    ],
  },
  {
    name: 'Office',
    slug: 'office',
    description: 'Desks, ergonomic chairs, storage and meeting furniture for productive workspaces.',
    imageUrl: img('1497366216548-37526070297c'),
    children: [
      { name: 'Desks', slug: 'desks', description: 'Executive, standing and workstation desks.' },
      { name: 'Office Chairs', slug: 'office-chairs', description: 'Ergonomic task and executive chairs.' },
      { name: 'Storage & Bookcases', slug: 'office-storage', description: 'Bookcases, filing cabinets and lockers.' },
      { name: 'Meeting Tables', slug: 'meeting-tables', description: 'Boardroom and conference tables.' },
    ],
  },
  {
    name: 'Outdoor',
    slug: 'outdoor',
    description: 'Weather-resistant lounge and dining sets for terraces and gardens.',
    imageUrl: img('1600573472591-ee6b68d14c68'),
    children: [],
  },
  {
    name: 'Lighting & Decor',
    slug: 'lighting-decor',
    description: 'Lamps, mirrors and rugs to finish every room.',
    imageUrl: img('1540932239986-30128078f3c5'),
    children: [
      { name: 'Lamps', slug: 'lamps', description: 'Floor, table and pendant lighting.' },
      { name: 'Mirrors', slug: 'mirrors', description: 'Wall and floor mirrors.' },
      { name: 'Rugs', slug: 'rugs', description: 'Wool, jute and cotton rugs.' },
    ],
  },
];

const woodColors = [
  { name: 'Natural Oak', hex: '#C9A472' },
  { name: 'Walnut', hex: '#5B3A29' },
  { name: 'Black', hex: '#1E1E1E' },
];
const fabricColors = [
  { name: 'Sand', hex: '#D9CDB8' },
  { name: 'Charcoal', hex: '#3C3C3C' },
  { name: 'Forest', hex: '#2F4A3B' },
  { name: 'Terracotta', hex: '#B5674D' },
];

const products: SeedProduct[] = [
  {
    name: 'Aria 3-Seater Sofa',
    category: 'sofas',
    price: 1299,
    compareAtPrice: 1599,
    short: 'A deep-seated three seater with feather-wrapped cushions and a solid beech frame.',
    description:
      'The Aria is our most loved sofa for a reason. Generous proportions, a low profile and feather-wrapped seat cushions make it the kind of sofa you sink into at the end of the day.\n\n- Kiln-dried solid beech frame with a 10-year warranty\n- High-resilience foam core wrapped in duck feather\n- Removable, dry-clean cushion covers\n- Available in 40+ fabrics and leathers in our showroom',
    images: [img('1555041469-a586c61ea9bc'), img('1540574163026-643ea20ade25'), img('1493663284031-b7e3aefcae8e')],
    materials: 'Solid beech frame, HR foam, duck feather, linen-blend upholstery',
    dimensions: 'W 228 × D 98 × H 82 cm · Seat height 44 cm',
    colors: fabricColors,
    options: [{ name: 'Size', values: ['2 Seater', '3 Seater', '4 Seater'] }],
    specs: [
      { label: 'Seat depth', value: '62 cm' },
      { label: 'Weight', value: '68 kg' },
      { label: 'Assembly', value: 'Legs only (5 minutes)' },
      { label: 'Warranty', value: '10 years on frame, 2 years on fabric' },
    ],
    tags: ['sofa', 'living room', 'fabric'],
    featured: true,
    bestSeller: true,
    stock: 8,
  },
  {
    name: 'Nordic Modular Sectional',
    category: 'sofas',
    price: 2490,
    short: 'Build your own configuration. Corner, chaise and ottoman modules that connect in seconds.',
    description:
      'A sectional that grows with your home. Each module connects with hidden steel brackets, so you can rearrange the layout whenever you move or redecorate.\n\n- Modular: add or remove seats at any time\n- Boucle or performance-velvet upholstery\n- Stain-resistant, family and pet friendly fabrics\n- Delivered and assembled by our own team',
    images: [img('1493663284031-b7e3aefcae8e'), img('1586023492125-27b2c045efd7'), img('1600566753086-00f18fb6b3ea')],
    materials: 'Engineered wood frame, HR foam, boucle upholstery',
    dimensions: 'Each module W 95 × D 95 × H 72 cm',
    colors: [
      { name: 'Ivory boucle', hex: '#EDE7DC' },
      { name: 'Stone', hex: '#A8A399' },
      { name: 'Olive velvet', hex: '#6B7352' },
    ],
    options: [{ name: 'Configuration', values: ['3 modules', '4 modules + chaise', '5 modules U-shape'] }],
    tags: ['sofa', 'modular', 'sectional'],
    featured: true,
    stock: 5,
  },
  {
    name: 'Luna Velvet Loveseat',
    category: 'sofas',
    price: 849,
    short: 'A compact two seater with curved arms and a soft velvet finish for smaller spaces.',
    description:
      'Designed for apartments and reading corners, the Luna brings a soft, rounded silhouette without taking over the room.\n\n- Compact 160 cm width\n- Soft-touch velvet with a subtle sheen\n- Solid oak legs in natural or black',
    images: [img('1588046130717-0eb0c9a3ba15'), img('1484101403633-562f891dc89a')],
    materials: 'Solid oak legs, pine frame, polyester velvet',
    dimensions: 'W 160 × D 88 × H 80 cm',
    colors: [
      { name: 'Blush', hex: '#D8A7A0' },
      { name: 'Teal', hex: '#2E6F73' },
      { name: 'Mustard', hex: '#C9A227' },
    ],
    tags: ['loveseat', 'velvet', 'small space'],
    isNew: true,
    stock: 12,
  },
  {
    name: 'Oslo Lounge Armchair',
    category: 'armchairs',
    price: 599,
    compareAtPrice: 699,
    short: 'Scandinavian lounge chair with a bent-wood frame and a cushioned, slightly reclined seat.',
    description:
      'The Oslo pairs a sculptural bent-wood frame with a generous cushion that invites you to stay a while. Pair it with the matching ottoman for the ultimate reading corner.',
    images: [img('1567538096630-e0c55bd6374c'), img('1592078615290-033ee584e267')],
    materials: 'Bent oak plywood, HR foam, wool-blend fabric',
    dimensions: 'W 76 × D 84 × H 78 cm · Seat height 40 cm',
    colors: fabricColors.slice(0, 3),
    options: [{ name: 'Ottoman', values: ['Without ottoman', 'With ottoman (+$149)'] }],
    tags: ['armchair', 'lounge', 'scandinavian'],
    bestSeller: true,
    featured: true,
    stock: 15,
  },
  {
    name: 'Bergen Leather Accent Chair',
    category: 'armchairs',
    price: 790,
    short: 'Full-grain leather on a powder-coated steel frame. Gets better with every year.',
    description:
      'Thick, full-grain aniline leather that develops a rich patina over time, stretched over a slim black steel frame. A statement piece that works in living rooms and executive offices alike.',
    images: [img('1506439773649-6e0eb8cfb237'), img('1519947486511-46149fa0a254')],
    materials: 'Full-grain leather, powder-coated steel',
    dimensions: 'W 70 × D 80 × H 76 cm',
    colors: [
      { name: 'Cognac', hex: '#9C5A2C' },
      { name: 'Black', hex: '#1E1E1E' },
    ],
    tags: ['armchair', 'leather', 'accent chair'],
    stock: 6,
  },
  {
    name: 'Rattan Reading Chair',
    category: 'armchairs',
    price: 420,
    short: 'Hand-woven natural rattan on a solid teak frame, with a removable linen seat cushion.',
    description:
      'Light, airy and hand-woven by artisans. The Rattan Reading Chair brings a relaxed, natural texture to sunrooms, bedrooms and covered terraces.',
    images: [img('1518455027359-f3f8164ba6bd'), img('1583847268964-b28dc8f51f92')],
    materials: 'Natural rattan, solid teak, linen cushion',
    dimensions: 'W 72 × D 78 × H 85 cm',
    tags: ['rattan', 'natural', 'chair'],
    isNew: true,
    stock: 9,
  },
  {
    name: 'Kaya Oak Coffee Table',
    category: 'coffee-tables',
    price: 540,
    short: 'Solid white oak with a hand-oiled finish and a floating lower shelf.',
    description:
      'Crafted from solid white oak and finished with natural hardwax oil, the Kaya shows the grain in all its honesty. The lower shelf keeps books and remotes within reach.',
    images: [img('1549497538-303791108f95'), img('1556228453-efd6c1ff04f6')],
    materials: 'Solid white oak, hardwax oil finish',
    dimensions: 'W 120 × D 60 × H 40 cm',
    colors: woodColors,
    tags: ['coffee table', 'oak', 'solid wood'],
    featured: true,
    stock: 11,
  },
  {
    name: 'Mesa Marble Side Table',
    category: 'coffee-tables',
    price: 320,
    short: 'A Carrara marble top on a slim brass-finish steel base.',
    description:
      'Each Mesa top is cut from a single slab of Carrara marble, so no two are alike. The slim steel base is powder-coated in a warm brass finish.',
    images: [img('1519710164239-da123dc03ef4'), img('1513694203232-719a280e022f')],
    materials: 'Carrara marble, powder-coated steel',
    dimensions: 'Ø 45 × H 55 cm',
    tags: ['side table', 'marble', 'brass'],
    stock: 20,
  },
  {
    name: 'Linea Walnut TV Unit',
    category: 'tv-units',
    price: 890,
    short: 'A low, 200 cm media console with push-to-open doors and cable management.',
    description:
      'Clean lines and a rich walnut veneer make the Linea a quiet backdrop for your screen. Three push-to-open compartments hide consoles and cables; a rear cut-out keeps wiring tidy.',
    images: [img('1484101403633-562f891dc89a'), img('1615873968403-89e068629265')],
    materials: 'Walnut veneer on MDF, solid oak legs',
    dimensions: 'W 200 × D 42 × H 48 cm',
    colors: woodColors,
    options: [{ name: 'Width', values: ['160 cm', '200 cm', '240 cm'] }],
    tags: ['tv unit', 'media console', 'walnut'],
    stock: 7,
  },
  {
    name: 'Haven Upholstered Bed',
    category: 'beds',
    price: 1150,
    compareAtPrice: 1390,
    short: 'A tall, softly padded headboard with a slatted base. Hotel comfort at home.',
    description:
      'The Haven wraps a solid wood frame in soft linen-blend fabric, with a 120 cm headboard that is made for Sunday mornings. Sprung slats are included; mattress sold separately.',
    images: [img('1505693416388-ac5ce068fe85'), img('1616627547584-bf28cee262db'), img('1522771739844-6a9f6d5f14af')],
    materials: 'Solid pine frame, HR foam, linen-blend fabric',
    dimensions: 'King 180 × 200 cm · Headboard height 120 cm',
    colors: fabricColors,
    options: [{ name: 'Size', values: ['Queen 160 × 200', 'King 180 × 200', 'Super King 200 × 200'] }],
    specs: [
      { label: 'Base', value: 'Sprung beech slats' },
      { label: 'Storage', value: 'Optional gas-lift storage' },
    ],
    tags: ['bed', 'upholstered', 'bedroom'],
    featured: true,
    bestSeller: true,
    stock: 6,
  },
  {
    name: 'Sora Platform Bed',
    category: 'beds',
    price: 980,
    short: 'A floating solid-oak platform bed with integrated nightstands.',
    description:
      'Minimal, low and grounded. The Sora platform bed includes two integrated floating nightstands and a recessed base that makes the whole bed appear to hover.',
    images: [img('1617325247661-675ab4b64ae2'), img('1631679706909-1844bbd07221')],
    materials: 'Solid oak, oak veneer',
    dimensions: 'King 180 × 200 cm · Overall W 280 cm',
    colors: woodColors,
    options: [{ name: 'Size', values: ['Queen 160 × 200', 'King 180 × 200'] }],
    tags: ['bed', 'platform', 'oak'],
    stock: 4,
  },
  {
    name: 'Atlas Sliding Wardrobe',
    category: 'wardrobes',
    price: 1680,
    short: 'A 250 cm sliding-door wardrobe with mirror panel, soft-close rails and LED lighting.',
    description:
      'Two full-height sliding doors, one with a full mirror, glide on soft-close rails. Inside: two hanging rails, six shelves, three drawers and sensor LED lighting. Custom interiors available.',
    images: [img('1522771739844-6a9f6d5f14af'), img('1567016432779-094069958ea5')],
    materials: 'Lacquered MDF, aluminium rails, safety mirror',
    dimensions: 'W 250 × D 65 × H 240 cm',
    colors: [
      { name: 'Matte white', hex: '#F2F2F0' },
      { name: 'Graphite', hex: '#4A4A4A' },
      { name: 'Oak & white', hex: '#D6C3A5' },
    ],
    options: [{ name: 'Width', values: ['200 cm', '250 cm', '300 cm'] }],
    tags: ['wardrobe', 'storage', 'bedroom'],
    stock: 3,
  },
  {
    name: 'Elm Nightstand',
    category: 'nightstands',
    price: 260,
    short: 'A two-drawer nightstand in solid elm with soft-close runners.',
    description: 'Compact, solid and quietly beautiful. Two soft-close drawers and a rear cable notch for chargers and lamps.',
    images: [img('1631679706909-1844bbd07221'), img('1616594039964-ae9021a400a0')],
    materials: 'Solid elm, oak veneer drawers',
    dimensions: 'W 50 × D 40 × H 55 cm',
    colors: woodColors,
    tags: ['nightstand', 'bedside', 'solid wood'],
    isNew: true,
    stock: 18,
  },
  {
    name: 'Vera 6-Drawer Dresser',
    category: 'dressers',
    price: 740,
    short: 'A wide six-drawer dresser with fluted oak fronts and brass handles.',
    description: 'Fluted solid oak drawer fronts catch the light beautifully. Six deep, soft-close drawers offer generous storage for the whole family.',
    images: [img('1567016432779-094069958ea5'), img('1617325247661-675ab4b64ae2')],
    materials: 'Solid oak fronts, oak veneer carcass, brass handles',
    dimensions: 'W 160 × D 45 × H 80 cm',
    colors: woodColors.slice(0, 2),
    tags: ['dresser', 'chest of drawers'],
    stock: 5,
  },
  {
    name: 'Harvest Oak Dining Table',
    category: 'dining-tables',
    price: 1390,
    short: 'A solid oak table for eight, with a 40 mm top and butterfly extension to seat ten.',
    description:
      'Our signature dining table. A thick 40 mm solid oak top with a soft chamfered edge, trestle legs and a hidden butterfly leaf that extends the table from 200 to 260 cm in seconds.',
    images: [img('1533090481720-856c6e3c1fdc'), img('1551298370-9d3d53740c72'), img('1600585154340-be6161a56a0c')],
    materials: 'Solid European oak, hardwax oil finish',
    dimensions: 'W 200 (260 extended) × D 100 × H 75 cm',
    colors: woodColors,
    options: [{ name: 'Length', values: ['180 cm', '200 cm', '240 cm'] }],
    specs: [
      { label: 'Seats', value: '8 (10 extended)' },
      { label: 'Top thickness', value: '40 mm' },
    ],
    tags: ['dining table', 'oak', 'extendable'],
    featured: true,
    bestSeller: true,
    stock: 4,
  },
  {
    name: 'Round Pedestal Dining Table',
    category: 'dining-tables',
    price: 980,
    short: 'A 120 cm round table on a sculpted pedestal base. Seats four to six without a leg in the way.',
    description: 'A single sculpted pedestal means everyone gets legroom. Ideal for square dining rooms and open-plan kitchens.',
    images: [img('1617806118233-18e1de247200'), img('1533090481720-856c6e3c1fdc')],
    materials: 'Oak veneer top, solid oak pedestal',
    dimensions: 'Ø 120 × H 75 cm',
    colors: woodColors,
    options: [{ name: 'Diameter', values: ['110 cm', '120 cm', '140 cm'] }],
    tags: ['dining table', 'round', 'pedestal'],
    stock: 6,
  },
  {
    name: 'Wishbone Dining Chair (Set of 2)',
    category: 'dining-chairs',
    price: 398,
    compareAtPrice: 460,
    short: 'A classic Y-back chair with a hand-woven paper-cord seat. Sold in pairs.',
    description: 'A timeless silhouette with a steam-bent back and a hand-woven paper-cord seat that takes a craftsman over an hour to weave. Light, strong and comfortable for long dinners.',
    images: [img('1503602642458-232111445657'), img('1538688525198-9b88f6f53126')],
    materials: 'Solid beech, natural paper cord',
    dimensions: 'W 55 × D 51 × H 76 cm · Seat height 45 cm',
    colors: woodColors,
    tags: ['dining chair', 'wishbone', 'set'],
    bestSeller: true,
    stock: 24,
  },
  {
    name: 'Vienna Upholstered Dining Chair',
    category: 'dining-chairs',
    price: 189,
    short: 'A curved, fully upholstered dining chair with a solid oak base.',
    description: 'Soft, supportive and easy to clean. The Vienna wraps around you with a curved back and a generously padded seat, perfect for long meals.',
    images: [img('1550254478-ead40cc54513'), img('1558997519-83ea9252edf8')],
    materials: 'Solid oak legs, HR foam, boucle fabric',
    dimensions: 'W 52 × D 56 × H 80 cm',
    colors: fabricColors,
    tags: ['dining chair', 'upholstered'],
    isNew: true,
    stock: 30,
  },
  {
    name: 'Cove Sideboard',
    category: 'sideboards',
    price: 920,
    short: 'A 180 cm sideboard with cane-panel doors and adjustable shelving.',
    description: 'Hand-woven cane panels on four doors bring texture and air to the Cove sideboard. Inside, adjustable shelves and a felt-lined cutlery drawer.',
    images: [img('1595515106969-1ce29566ff1c'), img('1600607687920-4e2a09cf159d')],
    materials: 'Oak veneer, natural cane, solid oak legs',
    dimensions: 'W 180 × D 45 × H 78 cm',
    colors: woodColors.slice(0, 2),
    tags: ['sideboard', 'cane', 'storage'],
    stock: 5,
  },
  {
    name: 'Executive Standing Desk',
    category: 'desks',
    price: 1190,
    compareAtPrice: 1350,
    short: 'A 160 cm electric sit-stand desk with a solid oak top and a dual-motor frame.',
    description:
      'Work sitting or standing at the touch of a button. The dual-motor frame lifts quietly from 65 to 128 cm, remembers four heights and carries up to 120 kg. Topped with solid oak.',
    images: [img('1593642532842-98d0fd5ebc1a'), img('1524758631624-e2822e304c36')],
    materials: 'Solid oak top, powder-coated steel frame, dual motors',
    dimensions: 'W 160 × D 80 × H 65–128 cm',
    colors: woodColors,
    options: [{ name: 'Width', values: ['140 cm', '160 cm', '180 cm'] }],
    specs: [
      { label: 'Lifting capacity', value: '120 kg' },
      { label: 'Noise', value: '< 45 dB' },
      { label: 'Memory presets', value: '4' },
    ],
    tags: ['desk', 'standing desk', 'office'],
    featured: true,
    bestSeller: true,
    stock: 9,
  },
  {
    name: 'Ergo Pro Office Chair',
    category: 'office-chairs',
    price: 690,
    short: 'A fully adjustable ergonomic chair with 4D arms, lumbar support and breathable mesh.',
    description:
      'Certified for 24/7 use. Synchronised tilt, adjustable lumbar, 4D armrests, seat-depth slider and a breathable mesh back keep you supported through the longest days.',
    images: [img('1595428774223-ef52624120d2'), img('1580480055273-228ff5388ef8')],
    materials: 'Nylon mesh, aluminium base, PU armrests',
    dimensions: 'W 68 × D 66 × H 115–125 cm',
    colors: [
      { name: 'Black', hex: '#1E1E1E' },
      { name: 'Grey', hex: '#8A8A8A' },
    ],
    specs: [
      { label: 'Max load', value: '150 kg' },
      { label: 'Warranty', value: '5 years' },
    ],
    tags: ['office chair', 'ergonomic', 'mesh'],
    bestSeller: true,
    stock: 25,
  },
  {
    name: 'Studio Task Chair',
    category: 'office-chairs',
    price: 290,
    short: 'A compact, stylish task chair for home offices and studios.',
    description: 'All the essentials, no bulk: height adjustment, tilt lock and a moulded, fabric-covered shell on a slim five-star base.',
    images: [img('1598300042247-d088f8ab3a91'), img('1595428774223-ef52624120d2')],
    materials: 'Moulded polypropylene, fabric, steel base',
    dimensions: 'W 58 × D 58 × H 82–92 cm',
    colors: fabricColors,
    tags: ['office chair', 'task chair', 'home office'],
    stock: 16,
  },
  {
    name: 'Archive Bookcase',
    category: 'office-storage',
    price: 760,
    short: 'A 220 cm tall open bookcase in oak with a black steel frame.',
    description: 'Five generous oak shelves on a slim black steel frame. Use it as a room divider, a library wall or a display for your favourite objects.',
    images: [img('1594620302200-9a762244a156'), img('1595526114035-0d45ed16cfbf')],
    materials: 'Solid oak shelves, powder-coated steel',
    dimensions: 'W 100 × D 35 × H 220 cm',
    colors: woodColors,
    options: [{ name: 'Width', values: ['80 cm', '100 cm', '120 cm'] }],
    tags: ['bookcase', 'shelving', 'office'],
    stock: 8,
  },
  {
    name: 'Boardroom Meeting Table',
    category: 'meeting-tables',
    price: 2450,
    short: 'A 320 cm conference table for twelve with integrated power and data modules.',
    description:
      'Built for serious meetings. A 320 cm walnut-veneer top on twin steel pedestals, with two flip-up power modules (mains, USB-C, HDMI) and full under-table cable management.',
    images: [img('1497366754035-f200968a6e72'), img('1497366216548-37526070297c')],
    materials: 'Walnut veneer, powder-coated steel',
    dimensions: 'W 320 × D 120 × H 75 cm',
    colors: woodColors.slice(0, 2),
    options: [{ name: 'Seats', values: ['8', '10', '12', '14'] }],
    tags: ['meeting table', 'conference', 'office'],
    stock: 2,
  },
  {
    name: 'Workstation Bench (4 seats)',
    category: 'desks',
    price: 1890,
    short: 'A shared bench desk for four with acoustic screens and cable trays.',
    description: 'Four 140 cm workstations on one shared frame, with fabric acoustic screens and a central cable tray. Expandable in blocks of two.',
    images: [img('1524758631624-e2822e304c36'), img('1497366216548-37526070297c')],
    materials: 'Laminate tops, steel frame, acoustic fabric screens',
    dimensions: 'W 280 × D 160 × H 75 cm',
    options: [{ name: 'Seats', values: ['2', '4', '6', '8'] }],
    tags: ['workstation', 'bench desk', 'office'],
    stock: 4,
  },
  {
    name: 'Terrace Lounge Set',
    category: 'outdoor',
    price: 1590,
    short: 'A four-piece aluminium lounge set with quick-dry cushions for terraces and gardens.',
    description: 'Powder-coated aluminium frames that never rust, hand-woven rope detailing and quick-dry, UV-resistant cushions. Includes a two seater, two armchairs and a coffee table.',
    images: [img('1600573472591-ee6b68d14c68'), img('1600121848594-d8644e57abab')],
    materials: 'Powder-coated aluminium, olefin rope, quick-dry foam',
    dimensions: 'Sofa W 150 cm · Armchair W 75 cm · Table Ø 60 cm',
    colors: [
      { name: 'Charcoal', hex: '#3C3C3C' },
      { name: 'Sand', hex: '#D9CDB8' },
    ],
    tags: ['outdoor', 'garden', 'lounge set'],
    featured: true,
    stock: 3,
  },
  {
    name: 'Garden Dining Set (6 seats)',
    category: 'outdoor',
    price: 1290,
    short: 'A teak dining table with six stackable chairs, built for sun and rain.',
    description: 'Grade-A teak weathers to a silver grey over time, or keep it golden with an annual oil. Six stackable chairs tuck away neatly when not in use.',
    images: [img('1521334884684-d80222895322'), img('1600573472591-ee6b68d14c68')],
    materials: 'Grade-A teak',
    dimensions: 'Table W 200 × D 100 × H 75 cm',
    tags: ['outdoor', 'teak', 'dining set'],
    stock: 4,
  },
  {
    name: 'Arc Floor Lamp',
    category: 'lamps',
    price: 349,
    short: 'A sweeping brass arc lamp with a marble base and a linen drum shade.',
    description: 'A 2 m brushed-brass arc reaches over sofas and reading chairs; the solid marble base keeps it rock steady. Dimmer switch included.',
    images: [img('1540932239986-30128078f3c5'), img('1507473885765-e6ed057f782c')],
    materials: 'Brushed brass, marble, linen',
    dimensions: 'H 200 × reach 180 cm · Shade Ø 45 cm',
    tags: ['lamp', 'floor lamp', 'lighting'],
    isNew: true,
    stock: 14,
  },
  {
    name: 'Ceramic Table Lamp',
    category: 'lamps',
    price: 129,
    short: 'A hand-glazed ceramic base with a natural linen shade.',
    description: 'Each base is thrown and glazed by hand, so small variations are part of the charm. Perfect on nightstands and consoles.',
    images: [img('1513694203232-719a280e022f'), img('1556228453-efd6c1ff04f6')],
    materials: 'Glazed ceramic, linen',
    dimensions: 'H 52 cm · Shade Ø 30 cm',
    colors: [
      { name: 'Cream', hex: '#EEE8DC' },
      { name: 'Sage', hex: '#9CAA8F' },
      { name: 'Ink', hex: '#2B3A4A' },
    ],
    tags: ['lamp', 'table lamp', 'ceramic'],
    stock: 22,
  },
  {
    name: 'Halo Round Mirror',
    category: 'mirrors',
    price: 219,
    short: 'A 90 cm round mirror with a slim brass frame.',
    description: 'A simple, elegant circle that brightens hallways, bathrooms and bedrooms. Comes with a concealed hanging bracket.',
    images: [img('1618220179428-22790b461013'), img('1618221195710-dd6b41faaea6')],
    materials: 'Brass-finish steel, 5 mm safety mirror',
    dimensions: 'Ø 90 × D 3 cm',
    options: [{ name: 'Diameter', values: ['60 cm', '90 cm', '120 cm'] }],
    tags: ['mirror', 'round mirror', 'decor'],
    stock: 17,
  },
  {
    name: 'Nomad Wool Rug',
    category: 'rugs',
    price: 480,
    short: 'A hand-loomed, 100% wool rug in a soft geometric pattern.',
    description: 'Hand-loomed from New Zealand wool for a dense, soft pile that wears beautifully. Naturally stain resistant.',
    images: [img('1600121848594-d8644e57abab'), img('1600210492486-724fe5c67fb0')],
    materials: '100% New Zealand wool, cotton backing',
    dimensions: '200 × 300 cm',
    options: [{ name: 'Size', values: ['160 × 230 cm', '200 × 300 cm', '250 × 350 cm'] }],
    colors: [
      { name: 'Ivory', hex: '#EFEBE3' },
      { name: 'Clay', hex: '#B07B5E' },
    ],
    tags: ['rug', 'wool', 'decor'],
    stock: 10,
  },
];

const posts = [
  {
    title: 'How to choose the right sofa for your living room',
    excerpt: 'Size, depth, fabric and frame - the four decisions that make or break a sofa purchase.',
    coverImage: img('1555041469-a586c61ea9bc'),
    tags: ['buying guide', 'living room'],
    content: `A sofa is the piece of furniture you will use more than any other. Here is how we help customers choose in our showroom.

## 1. Measure twice

Measure the wall where the sofa will sit, then subtract at least 40 cm on each side for walkways and side tables. Also measure your doorways and stairwells - a sofa that cannot get into the room is not a bargain.

## 2. Seat depth matters more than width

Deep seats (over 60 cm) are made for lounging; shallower seats (50-55 cm) keep you upright for conversation. If you are tall, go deep.

## 3. Pick the fabric for your life

- **Linen blends** look relaxed and breathe well but wrinkle.
- **Performance velvet** is soft, stain resistant and pet friendly.
- **Full-grain leather** costs more but lasts decades and ages beautifully.

## 4. Ask about the frame

A kiln-dried hardwood frame with a 10-year warranty is the difference between a sofa that lasts three years and one that lasts twenty. Every CYP sofa is built that way.`,
  },
  {
    title: 'The office furniture checklist for a productive workspace',
    excerpt: 'Planning a new office? Use our checklist to get desks, chairs, storage and meeting spaces right the first time.',
    coverImage: img('1497366216548-37526070297c'),
    tags: ['office', 'guide'],
    content: `Furnishing an office is a project with a lot of moving parts. Here is the checklist our project team uses.

## Workstations

- Allow 140-160 cm of desk width per person.
- Choose sit-stand desks for at least the people who ask for them - they will.
- Plan cable management from day one.

## Seating

An ergonomic chair with adjustable lumbar support, seat depth and armrests is the single best investment you can make in your team's comfort.

## Storage

Personal lockers plus shared filing cut desk clutter dramatically. Open bookcases double as room dividers.

## Meeting spaces

One large boardroom plus two or three small huddle rooms covers most teams. Add power and data modules into every meeting table.

Need help? Our team plans and delivers complete office fit-outs - [get in touch](/contact).`,
  },
  {
    title: 'Solid wood vs. engineered wood: what is the difference?',
    excerpt: 'Both have a place in a well-made home. Here is when to choose each, honestly.',
    coverImage: img('1549497538-303791108f95'),
    tags: ['materials', 'craftsmanship'],
    content: `We use both solid wood and engineered wood in our workshop, and we are often asked which is "better". The honest answer: it depends on the piece.

## Solid wood

Cut straight from the tree, solid wood is strong, repairable and ages beautifully. It is our choice for table tops, chair frames and anything that takes daily wear. It does move with humidity, which is why our tables use floating tops.

## Engineered wood

Veneered MDF or plywood is dimensionally stable, which makes it ideal for wide doors, wardrobe panels and large cabinet sides that would warp in solid timber. A real oak or walnut veneer looks and feels like solid wood.

## Our rule

Solid where it is touched and stressed, engineered where stability matters. Every product page lists exactly what each piece is made from.`,
  },
  {
    title: '5 small-bedroom layout ideas that create space',
    excerpt: 'Floating beds, tall wardrobes and the right nightstand can make a compact bedroom feel twice the size.',
    coverImage: img('1505693416388-ac5ce068fe85'),
    tags: ['bedroom', 'small spaces'],
    content: `Small bedrooms need smart furniture. Five ideas we recommend every week:

1. **Go tall, not wide.** A 240 cm wardrobe uses vertical space that is otherwise wasted.
2. **Float the bed.** Platform beds with integrated nightstands remove two pieces of furniture from the floor.
3. **Choose storage beds.** Gas-lift bases hide a season of bedding.
4. **Use mirrors.** A large round mirror opposite a window doubles the light.
5. **Keep legs visible.** Furniture on slim legs lets the floor run underneath, which reads as more space.`,
  },
  {
    title: 'Behind the scenes: how a CYP dining table is made',
    excerpt: 'From rough-sawn oak to the final coat of oil, follow a Harvest table through our workshop.',
    coverImage: img('1533090481720-856c6e3c1fdc'),
    tags: ['workshop', 'craftsmanship'],
    content: `Every Harvest dining table takes about three weeks to make. Here is what happens in that time.

## Week 1 - Selecting and drying

We select European oak boards, grade them for colour and grain, and let them acclimatise in the workshop for a week.

## Week 2 - Joinery

Boards are planed, matched for grain and glued into a single 40 mm top. The trestle legs are cut, mortised and dry-fitted.

## Week 3 - Finishing

Three coats of hardwax oil, hand-sanded between each, give the surface a natural, repairable finish. Then a final quality check, and the table is wrapped for delivery.

Want to see it in person? Visit our showroom any day of the week.`,
  },
];

const pages = [
  {
    title: 'Shipping & delivery',
    slug: 'shipping-delivery',
    content: `## Delivery areas

We deliver across the country from our own warehouse. International shipping is available on request - [contact us](/contact) for a quote.

## Delivery times

- In-stock items: 3-7 working days
- Made-to-order items: 3-5 weeks

## Delivery fees

Delivery is free on orders over the free-shipping threshold shown at checkout. Below that, a flat delivery fee applies.

## White-glove service

Our delivery team brings your furniture into the room of your choice, assembles it and removes all packaging.`,
  },
  {
    title: 'Returns & warranty',
    slug: 'returns-warranty',
    content: `## 30-day returns

If you are not happy with a stock item, let us know within 30 days of delivery and we will arrange collection. Items must be unused and in their original packaging. Made-to-order and custom pieces cannot be returned unless faulty.

## Warranty

- Solid wood frames: 10 years
- Mechanisms and motors: 5 years
- Fabrics and finishes: 2 years

Warranty claims are handled by our customer care team - simply send photos and your order number.`,
  },
  {
    title: 'Frequently asked questions',
    slug: 'faq',
    content: `## Can I see the furniture before I buy?

Yes - visit our showroom any day of the week. Most of our catalogue is on display.

## Do you make custom furniture?

Absolutely. Send us your dimensions and inspiration and our workshop will prepare a quote.

## How do I pay?

Choose cash on delivery or bank transfer at checkout. Our team confirms every order by phone or WhatsApp before dispatch.

## Do you deliver and assemble?

Yes. Every order is delivered and assembled by our own team.`,
  },
  {
    title: 'Privacy policy',
    slug: 'privacy-policy',
    content: `We collect only the information needed to process your order and respond to your enquiries: your name, contact details and delivery address.

We never sell your data. Order information is shared only with our delivery partners as needed to complete your delivery.

You can request a copy or deletion of your data at any time by contacting us.`,
  },
  {
    title: 'Terms of service',
    slug: 'terms',
    content: `By placing an order you agree to the following terms.

- Prices are shown in the currency selected at checkout and include applicable taxes unless stated otherwise.
- An order is confirmed only after our team contacts you to verify details and payment.
- Delivery times are estimates and may vary for made-to-order pieces.
- Our returns and warranty policy forms part of these terms.`,
  },
];

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || 'admin@cypfurniture.com').toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345';
  const adminName = process.env.ADMIN_NAME || 'CYP Administrator';

  const existingAdmin = await prisma.adminUser.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.adminUser.create({ data: { email: adminEmail, name: adminName, passwordHash: await bcrypt.hash(adminPassword, 10) } });
    console.log(`Created admin account ${adminEmail}`);
  } else {
    console.log(`Admin account ${adminEmail} already exists - skipped`);
  }

  const settings = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    await prisma.siteSettings.create({ data: { id: 1, data: JSON.stringify(DEFAULT_SETTINGS) } });
    console.log('Created default site settings');
  }

  const categoryCount = await prisma.category.count();
  if (categoryCount === 0) {
    const slugToId = new Map<string, number>();
    let order = 0;
    for (const cat of categories) {
      const parent = await prisma.category.create({
        data: { name: cat.name, slug: cat.slug, description: cat.description, imageUrl: cat.imageUrl, sortOrder: order++ },
      });
      slugToId.set(cat.slug, parent.id);
      let childOrder = 0;
      for (const child of cat.children) {
        const created = await prisma.category.create({
          data: { name: child.name, slug: child.slug, description: child.description, parentId: parent.id, sortOrder: childOrder++ },
        });
        slugToId.set(child.slug, created.id);
      }
    }
    console.log(`Created ${slugToId.size} categories`);

    let count = 0;
    for (const p of products) {
      const slug = p.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      await prisma.product.create({
        data: {
          name: p.name,
          slug,
          sku: `CYP-${String(1000 + count).padStart(4, '0')}`,
          shortDescription: p.short,
          description: p.description,
          price: p.price,
          compareAtPrice: p.compareAtPrice ?? null,
          categoryId: slugToId.get(p.category) ?? null,
          materials: p.materials ?? '',
          dimensions: p.dimensions ?? '',
          colors: JSON.stringify(p.colors ?? []),
          options: JSON.stringify(p.options ?? []),
          specs: JSON.stringify(p.specs ?? []),
          tags: (p.tags ?? []).join(', '),
          stock: p.stock ?? 10,
          isFeatured: p.featured ?? false,
          isNew: p.isNew ?? false,
          isBestSeller: p.bestSeller ?? false,
          viewCount: Math.floor(Math.random() * 400),
          images: { create: p.images.map((url, i) => ({ url, alt: p.name, sortOrder: i })) },
        },
      });
      count++;
    }
    console.log(`Created ${count} products`);
  } else {
    console.log('Categories already exist - skipped catalogue seed');
  }

  if ((await prisma.blogPost.count()) === 0) {
    let daysAgo = 2;
    for (const post of posts) {
      const publishedAt = new Date();
      publishedAt.setDate(publishedAt.getDate() - daysAgo);
      daysAgo += 9;
      await prisma.blogPost.create({
        data: {
          title: post.title,
          slug: post.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''),
          excerpt: post.excerpt,
          content: post.content,
          coverImage: post.coverImage,
          author: 'CYP Team',
          tags: post.tags.join(', '),
          readingTime: Math.max(1, Math.round(post.content.split(/\s+/).length / 200)),
          isPublished: true,
          publishedAt,
        },
      });
    }
    console.log(`Created ${posts.length} blog posts`);
  }

  if ((await prisma.page.count()) === 0) {
    for (const page of pages) await prisma.page.create({ data: page });
    console.log(`Created ${pages.length} pages`);
  }

  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
