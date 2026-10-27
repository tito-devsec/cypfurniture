/* eslint-disable no-console */
// Seeds an admin account, the site settings and demo catalogue content.
// Safe to run multiple times: existing data is never overwritten.
//
// The products, posts and pages below are placeholders that show the design.
// Replace them with real CYP products, photos and texts in the admin before launch.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { DEFAULT_SETTINGS } from '../src/lib/settings.ts';

const prisma = new PrismaClient();

const img = (id: string, w = 1400) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

type SeedProduct = {
  name: string;
  category: string; // category slug
  price: number; // 0 = "Request a quote"
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
    description: 'Sofas, living room furniture, coffee tables, side tables and TV showcases.',
    imageUrl: img('1600210492486-724fe5c67fb0'),
    children: [
      { name: 'Sofas & Living Room Furniture', slug: 'sofas-living-room-furniture', description: 'Sofas, armchairs and complete living room sets.' },
      { name: 'Coffee Tables & Side Tables', slug: 'coffee-tables-side-tables', description: 'Centre tables, side tables and nesting tables.' },
      { name: 'TV Showcases & Consoles', slug: 'tv-showcases-consoles', description: 'TV units, wall showcases and console tables.' },
    ],
  },
  {
    name: 'Bedroom',
    slug: 'bedroom',
    description: 'Beds, bedroom furniture, wardrobes and storage designed for rest.',
    imageUrl: img('1616594039964-ae9021a400a0'),
    children: [
      { name: 'Beds & Bedroom Furniture', slug: 'beds-bedroom-furniture', description: 'Beds, headboards, nightstands and dressers.' },
      { name: 'Wardrobes & Storage', slug: 'wardrobes-storage', description: 'Wardrobes, closets, chests and storage units.' },
    ],
  },
  {
    name: 'Dining',
    slug: 'dining',
    description: 'Dining tables and chairs for family meals and entertaining.',
    imageUrl: img('1551298370-9d3d53740c72'),
    children: [
      { name: 'Dining Tables', slug: 'dining-tables', description: 'Rectangular, round and extendable dining tables.' },
      { name: 'Dining Chairs', slug: 'dining-chairs', description: 'Wooden and upholstered dining chairs.' },
    ],
  },
  {
    name: 'Office Furniture',
    slug: 'office-furniture',
    description: 'Desks, office chairs, storage and meeting furniture for executives, teams and home offices.',
    imageUrl: img('1497366216548-37526070297c'),
    children: [
      { name: 'Desks & Workstations', slug: 'desks-workstations', description: 'Executive desks, workstations and reception desks.' },
      { name: 'Office Chairs', slug: 'office-chairs', description: 'Ergonomic task and executive seating.' },
      { name: 'Office Storage & Meeting', slug: 'office-storage-meeting', description: 'Bookcases, cabinets and meeting tables.' },
    ],
  },
  {
    name: 'Custom-Made Furniture',
    slug: 'custom-made-furniture',
    description: 'Bespoke pieces designed and built to your dimensions, materials, finishes and colours.',
    imageUrl: img('1586023492125-27b2c045efd7'),
    children: [],
  },
];

const woodColors = [
  { name: 'Natural Oak', hex: '#C9A472' },
  { name: 'Walnut', hex: '#5B3A29' },
  { name: 'Mahogany', hex: '#6E2B1F' },
  { name: 'Black', hex: '#1E1E1E' },
];
const fabricColors = [
  { name: 'Sand', hex: '#D9CDB8' },
  { name: 'Charcoal', hex: '#3C3C3C' },
  { name: 'Forest', hex: '#2F4A3B' },
  { name: 'Terracotta', hex: '#B5674D' },
];

const products: SeedProduct[] = [
  // ---------------------------------------------------------------- living room
  {
    name: 'Aria 3-Seater Sofa',
    category: 'sofas-living-room-furniture',
    price: 3400000,
    compareAtPrice: 4200000,
    short: 'A deep-seated three seater with feather-wrapped cushions on a solid hardwood frame.',
    description:
      'Generous proportions, a low profile and feather-wrapped seat cushions make the Aria the kind of sofa you sink into at the end of the day.\n\n- Solid hardwood frame\n- High-resilience foam core wrapped in feather\n- Removable cushion covers\n- Available in a wide choice of fabrics and leathers',
    images: [img('1555041469-a586c61ea9bc'), img('1540574163026-643ea20ade25'), img('1493663284031-b7e3aefcae8e')],
    materials: 'Solid hardwood frame, HR foam, feather wrap, linen-blend upholstery',
    dimensions: 'W 228 × D 98 × H 82 cm · Seat height 44 cm',
    colors: fabricColors,
    options: [{ name: 'Size', values: ['2 Seater', '3 Seater', '4 Seater'] }],
    tags: ['sofa', 'living room', 'fabric'],
    featured: true,
    bestSeller: true,
    stock: 8,
  },
  {
    name: 'Modular Sectional Sofa',
    category: 'sofas-living-room-furniture',
    price: 6500000,
    short: 'Build your own configuration. Corner, chaise and ottoman modules that connect in seconds.',
    description:
      'A sectional that grows with your home. Each module connects with hidden brackets, so you can rearrange the layout whenever you move or redecorate.\n\n- Modular: add or remove seats at any time\n- Boucle or velvet upholstery\n- Delivered and assembled by our own team',
    images: [img('1493663284031-b7e3aefcae8e'), img('1586023492125-27b2c045efd7'), img('1600566753086-00f18fb6b3ea')],
    materials: 'Hardwood frame, HR foam, boucle upholstery',
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
    category: 'sofas-living-room-furniture',
    price: 2200000,
    short: 'A compact two seater with curved arms and a soft velvet finish for smaller spaces.',
    description: 'Designed for apartments and reading corners, the Luna brings a soft, rounded silhouette without taking over the room.\n\n- Compact 160 cm width\n- Soft-touch velvet\n- Solid wood legs in natural or black',
    images: [img('1588046130717-0eb0c9a3ba15'), img('1484101403633-562f891dc89a')],
    materials: 'Solid wood legs, hardwood frame, velvet',
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
    category: 'sofas-living-room-furniture',
    price: 1550000,
    compareAtPrice: 1800000,
    short: 'A lounge chair with a bent-wood frame and a cushioned, slightly reclined seat.',
    description: 'The Oslo pairs a sculptural bent-wood frame with a generous cushion that invites you to stay a while. Pair it with the matching ottoman for the ultimate reading corner.',
    images: [img('1567538096630-e0c55bd6374c'), img('1592078615290-033ee584e267')],
    materials: 'Bent plywood, HR foam, wool-blend fabric',
    dimensions: 'W 76 × D 84 × H 78 cm · Seat height 40 cm',
    colors: fabricColors.slice(0, 3),
    options: [{ name: 'Ottoman', values: ['Without ottoman', 'With ottoman'] }],
    tags: ['armchair', 'lounge'],
    bestSeller: true,
    featured: true,
    stock: 15,
  },
  {
    name: 'Bergen Leather Accent Chair',
    category: 'sofas-living-room-furniture',
    price: 2050000,
    short: 'Full-grain leather on a slim powder-coated steel frame.',
    description: 'Thick leather that develops a rich patina over time, stretched over a slim black steel frame. A statement piece that works in living rooms and executive offices alike.',
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
    name: 'Kaya Coffee Table',
    category: 'coffee-tables-side-tables',
    price: 1400000,
    short: 'Solid wood with a hand-oiled finish and a floating lower shelf.',
    description: 'Crafted from solid wood and finished with natural oil, the Kaya shows the grain in all its honesty. The lower shelf keeps books and remotes within reach.',
    images: [img('1549497538-303791108f95'), img('1556228453-efd6c1ff04f6')],
    materials: 'Solid wood, natural oil finish',
    dimensions: 'W 120 × D 60 × H 40 cm',
    colors: woodColors,
    tags: ['coffee table', 'solid wood'],
    featured: true,
    stock: 11,
  },
  {
    name: 'Mesa Marble Side Table',
    category: 'coffee-tables-side-tables',
    price: 830000,
    short: 'A marble top on a slim brass-finish steel base.',
    description: 'Each Mesa top is cut from a single slab of marble, so no two are alike. The slim steel base is powder-coated in a warm brass finish.',
    images: [img('1519710164239-da123dc03ef4'), img('1513694203232-719a280e022f')],
    materials: 'Marble, powder-coated steel',
    dimensions: 'Ø 45 × H 55 cm',
    tags: ['side table', 'marble', 'brass'],
    stock: 20,
  },
  {
    name: 'Nesting Side Tables (Set of 2)',
    category: 'coffee-tables-side-tables',
    price: 1000000,
    short: 'Two round tables that tuck into each other, in solid wood with a black steel frame.',
    description: 'Pull them apart when guests arrive and nest them away afterwards. A flexible pair for sofas, armchairs and bedsides.',
    images: [img('1556228453-efd6c1ff04f6'), img('1549497538-303791108f95')],
    materials: 'Solid wood tops, powder-coated steel',
    dimensions: 'Ø 50 × H 50 cm and Ø 40 × H 45 cm',
    colors: woodColors.slice(0, 3),
    tags: ['side table', 'nesting tables'],
    isNew: true,
    stock: 14,
  },
  {
    name: 'Linea TV Showcase',
    category: 'tv-showcases-consoles',
    price: 2300000,
    short: 'A low, 200 cm media unit with push-to-open doors and cable management.',
    description: 'Clean lines and a rich walnut veneer make the Linea a quiet backdrop for your screen. Three push-to-open compartments hide consoles and cables; a rear cut-out keeps wiring tidy.',
    images: [img('1484101403633-562f891dc89a'), img('1615873968403-89e068629265')],
    materials: 'Walnut veneer, solid wood legs',
    dimensions: 'W 200 × D 42 × H 48 cm',
    colors: woodColors,
    options: [{ name: 'Width', values: ['160 cm', '200 cm', '240 cm'] }],
    tags: ['tv showcase', 'tv unit', 'media console'],
    featured: true,
    stock: 7,
  },
  {
    name: 'Wall TV Showcase with Display Shelves',
    category: 'tv-showcases-consoles',
    price: 3800000,
    short: 'A full-wall showcase with a TV niche, display shelves, closed storage and integrated lighting.',
    description: 'A complete living room wall in one piece: a TV niche, open display shelves for decor, closed cupboards for clutter and warm LED lighting. Built to the exact width of your wall.',
    images: [img('1615873968403-89e068629265'), img('1600607687920-4e2a09cf159d')],
    materials: 'Lacquered MDF, wood veneer, LED lighting',
    dimensions: 'Made to the width of your wall · H 240 cm',
    colors: [
      { name: 'Matte white & oak', hex: '#E9E2D4' },
      { name: 'Walnut & black', hex: '#4A3326' },
    ],
    tags: ['tv showcase', 'wall unit', 'custom'],
    stock: 3,
  },
  {
    name: 'Console Table',
    category: 'tv-showcases-consoles',
    price: 1200000,
    short: 'A slim entrance or hallway console in solid wood with a single drawer.',
    description: 'Slim enough for narrow hallways and entrances, with one drawer for keys and post and a lower shelf for baskets.',
    images: [img('1600607687920-4e2a09cf159d'), img('1595515106969-1ce29566ff1c')],
    materials: 'Solid wood, natural oil finish',
    dimensions: 'W 120 × D 35 × H 80 cm',
    colors: woodColors,
    tags: ['console table', 'hallway'],
    stock: 9,
  },
  // ---------------------------------------------------------------- bedroom
  {
    name: 'Haven Upholstered Bed',
    category: 'beds-bedroom-furniture',
    price: 3000000,
    compareAtPrice: 3600000,
    short: 'A tall, softly padded headboard with a slatted base. Hotel comfort at home.',
    description: 'The Haven wraps a solid wood frame in soft fabric, with a 120 cm headboard that is made for slow mornings. Slats are included; the mattress is sold separately.',
    images: [img('1505693416388-ac5ce068fe85'), img('1616627547584-bf28cee262db'), img('1522771739844-6a9f6d5f14af')],
    materials: 'Solid wood frame, HR foam, linen-blend fabric',
    dimensions: 'King 180 × 200 cm · Headboard height 120 cm',
    colors: fabricColors,
    options: [{ name: 'Size', values: ['Queen 160 × 200', 'King 180 × 200', 'Super King 200 × 200'] }],
    tags: ['bed', 'upholstered', 'bedroom'],
    featured: true,
    bestSeller: true,
    stock: 6,
  },
  {
    name: 'Sora Platform Bed',
    category: 'beds-bedroom-furniture',
    price: 2550000,
    short: 'A floating solid-wood platform bed with integrated nightstands.',
    description: 'Minimal, low and grounded. The Sora platform bed includes two integrated floating nightstands and a recessed base that makes the whole bed appear to hover.',
    images: [img('1617325247661-675ab4b64ae2'), img('1631679706909-1844bbd07221')],
    materials: 'Solid wood, wood veneer',
    dimensions: 'King 180 × 200 cm · Overall W 280 cm',
    colors: woodColors,
    options: [{ name: 'Size', values: ['Queen 160 × 200', 'King 180 × 200'] }],
    tags: ['bed', 'platform'],
    stock: 4,
  },
  {
    name: 'Elm Nightstand',
    category: 'beds-bedroom-furniture',
    price: 680000,
    short: 'A two-drawer nightstand in solid wood with soft-close runners.',
    description: 'Compact, solid and quietly beautiful. Two soft-close drawers and a rear cable notch for chargers and lamps.',
    images: [img('1631679706909-1844bbd07221'), img('1616594039964-ae9021a400a0')],
    materials: 'Solid wood, veneer drawers',
    dimensions: 'W 50 × D 40 × H 55 cm',
    colors: woodColors,
    tags: ['nightstand', 'bedside'],
    isNew: true,
    stock: 18,
  },
  {
    name: 'Vera 6-Drawer Dresser',
    category: 'beds-bedroom-furniture',
    price: 1900000,
    short: 'A wide six-drawer dresser with fluted wooden fronts and brass handles.',
    description: 'Fluted solid wood drawer fronts catch the light beautifully. Six deep, soft-close drawers offer generous storage for the whole family.',
    images: [img('1567016432779-094069958ea5'), img('1617325247661-675ab4b64ae2')],
    materials: 'Solid wood fronts, veneer carcass, brass handles',
    dimensions: 'W 160 × D 45 × H 80 cm',
    colors: woodColors.slice(0, 3),
    tags: ['dresser', 'chest of drawers'],
    stock: 5,
  },
  {
    name: 'Atlas Sliding Wardrobe',
    category: 'wardrobes-storage',
    price: 4400000,
    short: 'A 250 cm sliding-door wardrobe with a mirror panel, soft-close rails and LED lighting.',
    description: 'Two full-height sliding doors, one with a full mirror, glide on soft-close rails. Inside: hanging rails, shelves, drawers and sensor LED lighting. Custom interiors available.',
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
    featured: true,
    stock: 3,
  },
  {
    name: 'Hinged-Door Wardrobe',
    category: 'wardrobes-storage',
    price: 3350000,
    short: 'A classic four-door wardrobe with shaker-style fronts and a mix of hanging and shelf space.',
    description: 'Four hinged doors with soft-close hinges, two hanging sections, adjustable shelves and three drawers. Available in painted or wood finishes.',
    images: [img('1616627547584-bf28cee262db'), img('1505693416388-ac5ce068fe85')],
    materials: 'Painted MDF or wood veneer, solid wood frames',
    dimensions: 'W 200 × D 60 × H 220 cm',
    colors: [
      { name: 'Warm white', hex: '#F1ECE3' },
      { name: 'Sage', hex: '#9CAA8F' },
      { name: 'Walnut', hex: '#5B3A29' },
    ],
    tags: ['wardrobe', 'storage'],
    stock: 4,
  },
  {
    name: 'Shoe & Storage Cabinet',
    category: 'wardrobes-storage',
    price: 1100000,
    short: 'A slim entrance cabinet with tilting shoe compartments and a top drawer.',
    description: 'Keeps the entrance tidy: three tilting compartments for shoes, a drawer for small items and a solid top for keys and decor.',
    images: [img('1595515106969-1ce29566ff1c'), img('1600607687920-4e2a09cf159d')],
    materials: 'Lacquered MDF, solid wood legs',
    dimensions: 'W 100 × D 25 × H 120 cm',
    colors: woodColors.slice(0, 2),
    tags: ['storage', 'shoe cabinet', 'hallway'],
    isNew: true,
    stock: 10,
  },
  // ---------------------------------------------------------------- dining
  {
    name: 'Harvest Dining Table',
    category: 'dining-tables',
    price: 3600000,
    short: 'A solid wood table for eight, with a thick top and an extension to seat ten.',
    description: 'Our signature dining table. A thick solid wood top with a soft chamfered edge, trestle legs and a hidden butterfly leaf that extends the table in seconds.',
    images: [img('1533090481720-856c6e3c1fdc'), img('1551298370-9d3d53740c72'), img('1600585154340-be6161a56a0c')],
    materials: 'Solid hardwood, natural oil finish',
    dimensions: 'W 200 (260 extended) × D 100 × H 75 cm',
    colors: woodColors,
    options: [{ name: 'Length', values: ['180 cm', '200 cm', '240 cm'] }],
    specs: [{ label: 'Seats', value: '8 (10 extended)' }],
    tags: ['dining table', 'extendable'],
    featured: true,
    bestSeller: true,
    stock: 4,
  },
  {
    name: 'Round Pedestal Dining Table',
    category: 'dining-tables',
    price: 2550000,
    short: 'A 120 cm round table on a sculpted pedestal base. Seats four to six without a leg in the way.',
    description: 'A single sculpted pedestal means everyone gets legroom. Ideal for square dining rooms and open-plan kitchens.',
    images: [img('1617806118233-18e1de247200'), img('1533090481720-856c6e3c1fdc')],
    materials: 'Wood veneer top, solid wood pedestal',
    dimensions: 'Ø 120 × H 75 cm',
    colors: woodColors,
    options: [{ name: 'Diameter', values: ['110 cm', '120 cm', '140 cm'] }],
    tags: ['dining table', 'round'],
    stock: 6,
  },
  {
    name: 'Wishbone Dining Chair (Set of 2)',
    category: 'dining-chairs',
    price: 1050000,
    compareAtPrice: 1200000,
    short: 'A classic Y-back chair with a hand-woven cord seat. Sold in pairs.',
    description: 'A timeless silhouette with a steam-bent back and a hand-woven seat. Light, strong and comfortable for long dinners.',
    images: [img('1503602642458-232111445657'), img('1538688525198-9b88f6f53126')],
    materials: 'Solid wood, natural cord',
    dimensions: 'W 55 × D 51 × H 76 cm · Seat height 45 cm',
    colors: woodColors,
    tags: ['dining chair', 'set'],
    bestSeller: true,
    stock: 24,
  },
  {
    name: 'Vienna Upholstered Dining Chair',
    category: 'dining-chairs',
    price: 490000,
    short: 'A curved, fully upholstered dining chair with a solid wood base.',
    description: 'Soft, supportive and easy to clean. The Vienna wraps around you with a curved back and a generously padded seat, perfect for long meals.',
    images: [img('1550254478-ead40cc54513'), img('1558997519-83ea9252edf8')],
    materials: 'Solid wood legs, HR foam, boucle fabric',
    dimensions: 'W 52 × D 56 × H 80 cm',
    colors: fabricColors,
    tags: ['dining chair', 'upholstered'],
    isNew: true,
    stock: 30,
  },
  // ---------------------------------------------------------------- office
  {
    name: 'Executive Desk',
    category: 'desks-workstations',
    price: 3100000,
    compareAtPrice: 3500000,
    short: 'A 180 cm executive desk with a solid wood top, a drawer pedestal and hidden cable management.',
    description: 'A desk that sets the tone of an office: a thick solid wood top, a three-drawer pedestal with soft-close runners and a cable tray hidden under the top.',
    images: [img('1593642532842-98d0fd5ebc1a'), img('1524758631624-e2822e304c36')],
    materials: 'Solid wood top, veneer pedestal, powder-coated steel',
    dimensions: 'W 180 × D 80 × H 75 cm',
    colors: woodColors,
    options: [{ name: 'Width', values: ['160 cm', '180 cm', '200 cm'] }],
    tags: ['desk', 'executive', 'office'],
    featured: true,
    bestSeller: true,
    stock: 9,
  },
  {
    name: 'Workstation Bench (4 seats)',
    category: 'desks-workstations',
    price: 4900000,
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
    name: 'Ergo Office Chair',
    category: 'office-chairs',
    price: 1800000,
    short: 'A fully adjustable ergonomic chair with lumbar support and a breathable mesh back.',
    description: 'Synchronised tilt, adjustable lumbar support, adjustable armrests, a seat-depth slider and a breathable mesh back keep you supported through long days.',
    images: [img('1595428774223-ef52624120d2'), img('1580480055273-228ff5388ef8')],
    materials: 'Nylon mesh, aluminium base, PU armrests',
    dimensions: 'W 68 × D 66 × H 115–125 cm',
    colors: [
      { name: 'Black', hex: '#1E1E1E' },
      { name: 'Grey', hex: '#8A8A8A' },
    ],
    tags: ['office chair', 'ergonomic', 'mesh'],
    bestSeller: true,
    stock: 25,
  },
  {
    name: 'Studio Task Chair',
    category: 'office-chairs',
    price: 750000,
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
    category: 'office-storage-meeting',
    price: 2000000,
    short: 'A 220 cm tall open bookcase in solid wood with a black steel frame.',
    description: 'Five generous wooden shelves on a slim black steel frame. Use it as a room divider, a library wall or a display for your favourite objects.',
    images: [img('1594620302200-9a762244a156'), img('1595526114035-0d45ed16cfbf')],
    materials: 'Solid wood shelves, powder-coated steel',
    dimensions: 'W 100 × D 35 × H 220 cm',
    colors: woodColors,
    options: [{ name: 'Width', values: ['80 cm', '100 cm', '120 cm'] }],
    tags: ['bookcase', 'shelving', 'office'],
    stock: 8,
  },
  {
    name: 'Boardroom Meeting Table',
    category: 'office-storage-meeting',
    price: 6400000,
    short: 'A 320 cm conference table for twelve with integrated power and data modules.',
    description: 'A 320 cm veneer top on twin steel pedestals, with two flip-up power modules and full under-table cable management.',
    images: [img('1497366754035-f200968a6e72'), img('1497366216548-37526070297c')],
    materials: 'Wood veneer, powder-coated steel',
    dimensions: 'W 320 × D 120 × H 75 cm',
    colors: woodColors.slice(0, 3),
    options: [{ name: 'Seats', values: ['8', '10', '12', '14'] }],
    tags: ['meeting table', 'conference', 'office'],
    stock: 2,
  },
  // ---------------------------------------------------------------- custom-made (price on request)
  {
    name: 'Bespoke Dining Table',
    category: 'custom-made-furniture',
    price: 0,
    short: 'A dining table built to your length, width, wood and finish. Seats as many as you need.',
    description:
      'Tell us how many people you host, the shape you prefer and the wood you love. We design the table around your dining room and build it in our workshop.\n\n- Any length, width and height\n- Rectangular, round or oval tops\n- Choice of hardwoods and finishes\n- Matching chairs and benches available',
    images: [img('1533090481720-856c6e3c1fdc'), img('1617806118233-18e1de247200')],
    materials: 'Your choice of hardwood and finish',
    dimensions: 'Made to your measurements',
    options: [{ name: 'Shape', values: ['Rectangular', 'Round', 'Oval'] }],
    tags: ['custom', 'bespoke', 'dining table'],
    featured: true,
    isNew: true,
    stock: 0,
  },
  {
    name: 'Custom Wardrobe System',
    category: 'custom-made-furniture',
    price: 0,
    short: 'Floor-to-ceiling wardrobes designed around your room, your clothes and your routine.',
    description:
      'Walk-in closets, sliding or hinged doors, islands and dressing areas. We measure your room, plan the interior with you and build every section to fit.\n\n- Fitted wall to wall and floor to ceiling\n- Interiors planned for your wardrobe\n- Mirror, glass, painted or wood finishes\n- Integrated lighting',
    images: [img('1522771739844-6a9f6d5f14af'), img('1616627547584-bf28cee262db')],
    materials: 'Your choice of finishes, hardware and lighting',
    dimensions: 'Made to your room',
    tags: ['custom', 'bespoke', 'wardrobe', 'closet'],
    featured: true,
    stock: 0,
  },
  {
    name: 'Made-to-Measure TV Wall Unit',
    category: 'custom-made-furniture',
    price: 0,
    short: 'A complete feature wall with a TV niche, display shelves, storage and lighting, built to your wall.',
    description: 'Designed around your screen size, sound system and the width of your wall. Open shelves, closed cupboards, panelling and lighting are all planned with you.',
    images: [img('1615873968403-89e068629265'), img('1484101403633-562f891dc89a')],
    materials: 'Your choice of veneers, lacquers and lighting',
    dimensions: 'Made to your wall',
    tags: ['custom', 'bespoke', 'tv wall', 'showcase'],
    isNew: true,
    stock: 0,
  },
  {
    name: 'Custom Reception Desk',
    category: 'custom-made-furniture',
    price: 0,
    short: 'A reception or front desk shaped for your lobby, with your logo, lighting and storage built in.',
    description: 'First impressions start at the front desk. We design reception counters for offices, clinics, hotels and showrooms, with integrated lighting, cable management and branding.',
    images: [img('1497366754035-f200968a6e72'), img('1497366216548-37526070297c')],
    materials: 'Your choice of finishes, stone or solid surface tops',
    dimensions: 'Made to your space',
    tags: ['custom', 'bespoke', 'reception', 'office'],
    stock: 0,
  },
];

const posts = [
  {
    title: 'How to choose the right sofa for your living room',
    excerpt: 'Size, depth, fabric and frame: the four decisions that make or break a sofa purchase.',
    coverImage: img('1555041469-a586c61ea9bc'),
    tags: ['buying guide', 'living room'],
    content: `A sofa is the piece of furniture you will use more than any other. Here is how we help clients choose.

## 1. Measure twice

Measure the wall where the sofa will sit, then leave room on each side for walkways and side tables. Also measure your doorways and stairwells: a sofa that cannot get into the room is not a bargain.

## 2. Seat depth matters more than width

Deep seats are made for lounging; shallower seats keep you upright for conversation. If you are tall, go deep.

## 3. Pick the fabric for your life

- **Linen blends** look relaxed and breathe well in warm weather.
- **Velvet** is soft and rich, and performance velvets resist stains.
- **Leather** costs more but lasts for years and ages beautifully.

## 4. Ask about the frame

A solid hardwood frame is the difference between a sofa that lasts a few years and one that lasts decades. Ask us about the frame of any piece you are considering, or [request a custom design](/contact) built to your room.`,
  },
  {
    title: 'The office furniture checklist for a productive workspace',
    excerpt: 'Planning a new office? Use our checklist to get desks, chairs, storage and meeting spaces right the first time.',
    coverImage: img('1497366216548-37526070297c'),
    tags: ['office', 'guide'],
    content: `Furnishing an office is a project with a lot of moving parts. Here is the checklist we use with clients.

## Workstations

- Allow enough desk width per person for a screen, a notebook and some breathing room.
- Decide early who needs an executive desk, a workstation or a shared bench.
- Plan cable management from day one.

## Seating

An ergonomic chair with adjustable lumbar support, seat depth and armrests is the single best investment you can make in your team's comfort.

## Storage

Personal lockers plus shared filing cut desk clutter dramatically. Open bookcases double as room dividers.

## Meeting spaces

One large boardroom plus a few small huddle rooms covers most teams. Add power and data into every meeting table.

Need help? We design and build office furniture to your floor plan: [get in touch](/contact).`,
  },
  {
    title: 'Solid wood vs. engineered wood: what is the difference?',
    excerpt: 'Both have a place in a well-made home. Here is when to choose each, honestly.',
    coverImage: img('1549497538-303791108f95'),
    tags: ['materials', 'craftsmanship'],
    content: `We use both solid wood and engineered wood in our workshop, and we are often asked which is "better". The honest answer: it depends on the piece.

## Solid wood

Cut straight from the tree, solid wood is strong, repairable and ages beautifully. It is our choice for table tops, chair frames and anything that takes daily wear. It does move with humidity, which is why good tables use floating tops.

## Engineered wood

Veneered MDF or plywood is dimensionally stable, which makes it ideal for wide doors, wardrobe panels and large cabinet sides that would warp in solid timber. A real wood veneer looks and feels like solid wood.

## Our rule

Solid where it is touched and stressed, engineered where stability matters. Ask us what any piece is made from and we will tell you exactly.`,
  },
  {
    title: '5 small-bedroom layout ideas that create space',
    excerpt: 'Floating beds, tall wardrobes and the right nightstand can make a compact bedroom feel twice the size.',
    coverImage: img('1505693416388-ac5ce068fe85'),
    tags: ['bedroom', 'small spaces'],
    content: `Small bedrooms need smart furniture. Five ideas we recommend every week:

1. **Go tall, not wide.** A floor-to-ceiling wardrobe uses vertical space that is otherwise wasted.
2. **Float the bed.** Platform beds with integrated nightstands remove two pieces of furniture from the floor.
3. **Choose storage beds.** A lift-up base hides a season of bedding.
4. **Use mirrors.** A large mirror opposite a window doubles the light.
5. **Keep legs visible.** Furniture on slim legs lets the floor run underneath, which reads as more space.

Every one of these can be made to the exact size of your room: [request a custom design](/contact).`,
  },
  {
    title: 'Behind every original CYP: how a bespoke piece comes to life',
    excerpt: 'From the first conversation to installation, this is how a custom piece is made in our workshop.',
    coverImage: img('1533090481720-856c6e3c1fdc'),
    tags: ['workshop', 'bespoke'],
    content: `Every custom piece starts with a conversation and ends with an installation. Here is what happens in between.

## 1. Consultation

We talk about the room, how you use it and what you love. Photos, measurements and inspiration pictures all help. This can happen in person in Dar es Salaam or on WhatsApp.

## 2. Design

Our team prepares a design with dimensions, materials, finishes and colours. We refine it together until it is exactly right, and confirm the quotation before anything is built.

## 3. Crafting

The piece is handcrafted in our workshop in Tanzania. Solid wood is selected and joined, panels are cut and edged, and upholstery is sewn and fitted by hand.

## 4. Finishing

Sanding, staining, oiling or lacquering, then a final check of every surface, hinge and drawer.

## 5. Delivery and installation

We deliver and install the finished piece in your home or office, and make sure you are happy before we leave.

Ready to start? [Request a custom design](/contact).`,
  },
];

const pages = [
  {
    title: 'Delivery & installation',
    slug: 'shipping-delivery',
    content: `## Delivery areas

We deliver across Dar es Salaam from our workshop in Kijitonyama and arrange transport to other regions of Tanzania. International delivery is available on request: [contact us](/contact) for a quotation.

## Delivery times

Delivery times depend on the piece. Items in stock are delivered as soon as a convenient time is agreed; custom-made pieces are scheduled when your design is confirmed. Your timeline is stated on your order confirmation.

## Installation

Our team delivers your furniture to the room of your choice, assembles and installs it, and removes all packaging.`,
  },
  {
    title: 'Returns & warranty',
    slug: 'returns-warranty',
    content: `## Returns

If a stock item is not what you expected, contact us as soon as possible after delivery and we will find a solution. Items must be unused and in their original condition. Custom-made and made-to-measure pieces are built for you and cannot be returned unless faulty.

## Warranty

Every CYP piece is handcrafted and checked before it leaves our workshop. The warranty terms for your furniture are stated on your quotation or order confirmation.

## Claims

To make a claim, send photos and your order number to our team on WhatsApp or by email and we will take it from there.`,
  },
  {
    title: 'Frequently asked questions',
    slug: 'faq',
    content: `## Can I see the furniture before I buy?

Yes. Contact us to arrange a visit to our workshop and showroom in Kijitonyama, Dar es Salaam.

## Do you make custom furniture?

Absolutely. Bespoke design is at the heart of what we do. Send us your dimensions, inspiration pictures and preferred materials and we will prepare a design and quotation.

## How do I pay?

Choose cash on delivery or bank transfer at checkout, or confirm your order with our team on WhatsApp. Custom orders are confirmed with a quotation.

## Do you deliver and install?

Yes. Every order is delivered and installed by our own team.

## Do you offer interior design?

Yes. We provide complete interior solutions, from concept to installation, for homes, offices and commercial spaces.`,
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

- Prices are shown in the currency selected at checkout. Products marked "Request a quote" are priced individually.
- An order is confirmed only after our team contacts you to verify the details and payment.
- Delivery times are estimates and are confirmed on your order confirmation.
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
          author: 'CYP Furniture & Decor',
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
