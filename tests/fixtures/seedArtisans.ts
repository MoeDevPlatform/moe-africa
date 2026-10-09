import path from 'path';
import { SEED_RUN_ID, SEED_TAG } from '../helpers/env';

/** Local image folder supplied for seed / load testing. */
export const MOE_IMAGES_DIR = path.join(process.cwd(), 'src', 'Moe Images');

export type ProductCategory =
  | 'tailoring'
  | 'arts_and_crafts'
  | 'shoemaking'
  | 'beauty'
  | 'leatherwork'
  | 'jewellery'
  | 'home_and_decor'
  | 'paintings_and_canvas';

export interface SeedProduct {
  name: string;
  description: string;
  category: ProductCategory;
  priceMin: number;
  priceMax: number;
  materials: string;
  estimatedDelivery: string;
  tags: string;
  /** Filename inside MOE_IMAGES_DIR */
  imageFile: string;
}

export interface SeedArtisan {
  /** Stable index 01–20 used in email / idempotency. */
  index: number;
  firstName: string;
  lastName: string;
  businessName: string;
  description: string;
  serviceCategories: string[];
  category: ProductCategory;
  country: string;
  state: string;
  city: string;
  address: string;
  styleTags: string;
  /** Filename for store / profile image */
  profileImageFile: string;
  /** Filename for cover / banner image */
  coverImageFile: string;
  products: SeedProduct[];
}

const IMG = {
  alex: 'alex-quezada-aQgpwEqDfsI-unsplash(1).jpg',
  ankhesenamun: 'ankhesenamun-KitGM-GDgOI-unsplash.jpg',
  asif: 'asif-sharif-HxgJCi27IRA-unsplash(1).jpg',
  christian: 'christian-agbede-HsMpQlNTxms-unsplash.jpg',
  collab: 'collab-media-dYgEvR2gdgk-unsplash.jpg',
  graphicShirt: 'graphic-shirt-trendy-design-mockup.jpg',
  jazmin: 'jazmin-quaynor-FoeIOgztCXo-unsplash(1).jpg',
  kateryna: 'kateryna-hliznitsova-ceSCZzjTReg-unsplash(1).jpg',
  larisa: 'larisa-birta-YP4NILq7qFo-unsplash(1).jpg',
  mohamad: 'mohamad-khosravi--eb0moHDPBI-unsplash.jpg',
  noah: 'noah-smith-LkuH3Txi_gs-unsplash(1).jpg',
  pmv: 'pmv-chamara-sCFL6R7loQk-unsplash.jpg',
  rosa: 'rosa-rafael-pxax5WuM7eY-unsplash.jpg',
  rupixen: 'rupixen-OSG5rYIWod0-unsplash.jpg',
  ryanPlomp: 'ryan-plomp-jvoZ-Aux9aw-unsplash.jpg',
  ryanWaring: 'ryan-waring-164_6wVEHfI-unsplash(1).jpg',
  sabrianna: 'sabrianna-u1Hv_erOQH0-unsplash.jpg',
  samantha: 'samantha-gades-BlIhVfXbi9s-unsplash.jpg',
  shirt: 'shirt(1).jpg',
  spacejoy: 'spacejoy-YI2YkyaREHk-unsplash(1).jpg',
  stillShirts: 'still-life-with-classic-shirts-hanger(1).jpg',
  suhyeon: 'suhyeon-choi-0ec8O8ZJD7M-unsplash.jpg',
  tunde: 'tunde-buremo-mCt8hjAlNck-unsplash.jpg',
  valeriia: 'valeriia-miller-_42NKYROG7g-unsplash.jpg',
  vladimir: 'vladimir-mokry-G-4wX5tZNuE-unsplash.jpg',
  wiser: 'wiser-by-the-mile-SwWCo1k92M4-unsplash.jpg',
} as const;

/** Shared password satisfying backend + frontend complexity rules. */
export const SEED_PASSWORD = 'SeedTest123!';

/** Email domain reserved for Playwright seed accounts (never reuse real users). */
export const SEED_EMAIL_DOMAIN = 'moe-pw-seed.test';

/**
 * Per-run unique email — never overwrites an existing production account.
 * Format: artisan01.<runId>@moe-pw-seed.test
 */
export function seedArtisanEmail(index: number): string {
  return `artisan${String(index).padStart(2, '0')}.${SEED_RUN_ID}@${SEED_EMAIL_DOMAIN}`;
}

/** Tagged display name so seeded records are identifiable in admin / marketplace. */
export function taggedName(name: string): string {
  return `${SEED_TAG} ${name}`;
}

export function imagePath(filename: string): string {
  return path.join(MOE_IMAGES_DIR, filename);
}

/**
 * 20 distinct artisans × 5 products = 100 products.
 * Categories and imagery are diversified for algorithm / discovery testing.
 */
export const SEED_ARTISANS: SeedArtisan[] = [
  {
    index: 1,
    firstName: 'Adaobi',
    lastName: 'Nwosu',
    businessName: 'Adaobi Atelier Lagos',
    description:
      'Bespoke Ankara and lace couture for weddings, aso-ebi, and corporate events across Lagos.',
    serviceCategories: ['Tailoring'],
    category: 'tailoring',
    country: 'Nigeria',
    state: 'Lagos',
    city: 'Lekki',
    address: '12 Admiralty Way',
    styleTags: 'Afrocentric,Modern,Luxury',
    profileImageFile: IMG.samantha,
    coverImageFile: IMG.stillShirts,
    products: [
      { name: 'Ankara Evening Wrap Dress', description: 'Fitted wrap dress in premium Ankara with side slit.', category: 'tailoring', priceMin: 28000, priceMax: 42000, materials: 'Ankara cotton blend', estimatedDelivery: '5-7 days', tags: 'Ankara,Modern,Evening', imageFile: IMG.graphicShirt },
      { name: 'Senator Kaftan Set', description: 'Two-piece senator kaftan with subtle embroidery.', category: 'tailoring', priceMin: 45000, priceMax: 65000, materials: 'Cashmere blend', estimatedDelivery: '7-10 days', tags: 'Corporate,Formal,Premium', imageFile: IMG.shirt },
      { name: 'Bridal Lace Blouse', description: 'French lace bridal blouse with hand-beaded neckline.', category: 'tailoring', priceMin: 85000, priceMax: 120000, materials: 'French lace, beads', estimatedDelivery: '14-21 days', tags: 'Wedding,Luxury,Lace', imageFile: IMG.stillShirts },
      { name: 'Agbada Ceremonial Set', description: 'Three-piece agbada with brocade embroidery.', category: 'tailoring', priceMin: 95000, priceMax: 150000, materials: 'Guinea brocade', estimatedDelivery: '21 days', tags: 'Traditional,Luxury,Wedding', imageFile: IMG.collab },
      { name: 'Office Pencil Skirt Suit', description: 'Tailored jacket and pencil skirt in charcoal wool.', category: 'tailoring', priceMin: 38000, priceMax: 52000, materials: 'Wool blend', estimatedDelivery: '7 days', tags: 'Corporate,Modern,Formal', imageFile: IMG.pmv },
    ],
  },
  {
    index: 2,
    firstName: 'Chidi',
    lastName: 'Okeke',
    businessName: 'Okeke Menswear Studio',
    description: 'Modern African menswear — shirts, suits, and custom fittings for everyday elegance.',
    serviceCategories: ['Tailoring'],
    category: 'tailoring',
    country: 'Nigeria',
    state: 'Lagos',
    city: 'Ikeja',
    address: '45 Allen Avenue',
    styleTags: 'Modern,Corporate,Casual',
    profileImageFile: IMG.christian,
    coverImageFile: IMG.shirt,
    products: [
      { name: 'Oxford Collar Shirt', description: 'Crisp oxford shirt with mother-of-pearl buttons.', category: 'tailoring', priceMin: 18000, priceMax: 25000, materials: 'Egyptian cotton', estimatedDelivery: '4-6 days', tags: 'Casual,Corporate,Handmade', imageFile: IMG.shirt },
      { name: 'Ankara Pocket Square Set', description: 'Set of three Ankara pocket squares.', category: 'tailoring', priceMin: 6000, priceMax: 9000, materials: 'Ankara fabric', estimatedDelivery: '3 days', tags: 'Afrocentric,Casual,Accessories', imageFile: IMG.graphicShirt },
      { name: 'Slim Fit Trouser', description: 'Tailored slim trousers with reinforced seams.', category: 'tailoring', priceMin: 22000, priceMax: 32000, materials: 'Stretch cotton', estimatedDelivery: '5-7 days', tags: 'Modern,Corporate', imageFile: IMG.stillShirts },
      { name: 'Wedding Guest Dashiki', description: 'Contemporary dashiki for wedding guests.', category: 'tailoring', priceMin: 35000, priceMax: 48000, materials: 'Ankara, lining', estimatedDelivery: '10 days', tags: 'Wedding,Afrocentric,Traditional', imageFile: IMG.collab },
      { name: 'Linen Summer Shirt', description: 'Breathable linen shirt for humid climates.', category: 'tailoring', priceMin: 20000, priceMax: 28000, materials: '100% linen', estimatedDelivery: '5 days', tags: 'Casual,Modern,Premium', imageFile: IMG.pmv },
    ],
  },
  {
    index: 3,
    firstName: 'Ngozi',
    lastName: 'Eze',
    businessName: 'Ngozi Threadworks',
    description: 'Women’s ready-to-wear with Afrocentric prints and modern silhouettes.',
    serviceCategories: ['Tailoring'],
    category: 'tailoring',
    country: 'Nigeria',
    state: 'Enugu',
    city: 'Enugu',
    address: '8 Ogui Road',
    styleTags: 'Afrocentric,Elegant,Modern',
    profileImageFile: IMG.jazmin,
    coverImageFile: IMG.graphicShirt,
    products: [
      { name: 'Midi Ankara Skirt', description: 'A-line midi skirt with side pockets.', category: 'tailoring', priceMin: 15000, priceMax: 22000, materials: 'Ankara cotton', estimatedDelivery: '4 days', tags: 'Casual,Afrocentric', imageFile: IMG.graphicShirt },
      { name: 'Peplum Blouse', description: 'Structured peplum blouse for office wear.', category: 'tailoring', priceMin: 16000, priceMax: 24000, materials: 'Crepe', estimatedDelivery: '5 days', tags: 'Corporate,Elegant', imageFile: IMG.shirt },
      { name: 'Two-Piece Palazzo Set', description: 'Matching crop top and palazzo pants.', category: 'tailoring', priceMin: 30000, priceMax: 42000, materials: 'Ankara blend', estimatedDelivery: '7 days', tags: 'Modern,Afrocentric', imageFile: IMG.stillShirts },
      { name: 'Cocktail Sheath Dress', description: 'Knee-length sheath with subtle gold trim.', category: 'tailoring', priceMin: 40000, priceMax: 58000, materials: 'Stretch crepe', estimatedDelivery: '10 days', tags: 'Evening,Luxury,Elegant', imageFile: IMG.collab },
      { name: 'Kids Ankara Pinafore', description: 'Children’s pinafore dress in soft Ankara.', category: 'tailoring', priceMin: 10000, priceMax: 15000, materials: 'Soft Ankara', estimatedDelivery: '5 days', tags: 'Kids,Casual,Afrocentric', imageFile: IMG.pmv },
    ],
  },
  {
    index: 4,
    firstName: 'Fatima',
    lastName: 'Bello',
    businessName: 'Bello Craft Collective',
    description: 'Handmade crafts, woven pieces, and gift sets celebrating Northern Nigerian artistry.',
    serviceCategories: ['Arts & Crafts'],
    category: 'arts_and_crafts',
    country: 'Nigeria',
    state: 'Kano',
    city: 'Kano',
    address: '3 Zoo Road',
    styleTags: 'Traditional,Handmade,Afrocentric',
    profileImageFile: IMG.larisa,
    coverImageFile: IMG.ankhesenamun,
    products: [
      { name: 'Handwoven Market Basket', description: 'Palm-leaf basket for market or décor.', category: 'arts_and_crafts', priceMin: 8000, priceMax: 12000, materials: 'Palm leaf, dye', estimatedDelivery: '5 days', tags: 'Handmade,Traditional,Home', imageFile: IMG.ankhesenamun },
      { name: 'Beaded Table Runner', description: 'Beaded runner with geometric motifs.', category: 'arts_and_crafts', priceMin: 18000, priceMax: 26000, materials: 'Glass beads, cotton', estimatedDelivery: '7 days', tags: 'Handmade,Afrocentric,Elegant', imageFile: IMG.kateryna },
      { name: 'Carved Wooden Mask Mini', description: 'Decorative mini mask for wall display.', category: 'arts_and_crafts', priceMin: 22000, priceMax: 35000, materials: 'Iroko wood', estimatedDelivery: '10 days', tags: 'Traditional,Handmade,Afrocentric', imageFile: IMG.vladimir },
      { name: 'Indigo Dye Scarf', description: 'Hand-dyed indigo scarf with resist patterns.', category: 'arts_and_crafts', priceMin: 12000, priceMax: 18000, materials: 'Cotton, indigo dye', estimatedDelivery: '6 days', tags: 'Traditional,Handmade', imageFile: IMG.collab },
      { name: 'Greeting Card Set (12)', description: 'Hand-illustrated Afrocentric greeting cards.', category: 'arts_and_crafts', priceMin: 5000, priceMax: 8000, materials: 'Cardstock, ink', estimatedDelivery: '3 days', tags: 'Handmade,Gift,Modern', imageFile: IMG.pmv },
    ],
  },
  {
    index: 5,
    firstName: 'Ifeanyi',
    lastName: 'Okafor',
    businessName: 'Okafor Studio Crafts',
    description: 'Sculptural ceramics and mixed-media crafts for homes and galleries.',
    serviceCategories: ['Arts & Crafts'],
    category: 'arts_and_crafts',
    country: 'Nigeria',
    state: 'Anambra',
    city: 'Awka',
    address: '19 Zik Avenue',
    styleTags: 'Modern,Handmade,Elegant',
    profileImageFile: IMG.tunde,
    coverImageFile: IMG.vladimir,
    products: [
      { name: 'Ceramic Water Jug', description: 'Wheel-thrown jug with matte glaze.', category: 'arts_and_crafts', priceMin: 15000, priceMax: 22000, materials: 'Stoneware clay', estimatedDelivery: '8 days', tags: 'Handmade,Modern,Home', imageFile: IMG.spacejoy },
      { name: 'Terracotta Planter Set', description: 'Set of three nested terracotta planters.', category: 'arts_and_crafts', priceMin: 12000, priceMax: 18000, materials: 'Terracotta', estimatedDelivery: '6 days', tags: 'Handmade,Home,Casual', imageFile: IMG.ankhesenamun },
      { name: 'Wire Sculpture Bird', description: 'Abstract bird sculpture in brass wire.', category: 'arts_and_crafts', priceMin: 25000, priceMax: 38000, materials: 'Brass wire', estimatedDelivery: '10 days', tags: 'Modern,Handmade,Elegant', imageFile: IMG.vladimir },
      { name: 'Batik Wall Hanging', description: 'Large batik panel ready to hang.', category: 'arts_and_crafts', priceMin: 30000, priceMax: 45000, materials: 'Cotton batik', estimatedDelivery: '9 days', tags: 'Afrocentric,Handmade,Home', imageFile: IMG.kateryna },
      { name: 'Clay Incense Holder', description: 'Hand-pressed clay incense holder.', category: 'arts_and_crafts', priceMin: 4000, priceMax: 7000, materials: 'Clay, glaze', estimatedDelivery: '4 days', tags: 'Handmade,Casual', imageFile: IMG.pmv },
    ],
  },
  {
    index: 6,
    firstName: 'Amina',
    lastName: 'Yusuf',
    businessName: 'Amina Paper & Print',
    description: 'Artisanal stationery, prints, and paper crafts with West African motifs.',
    serviceCategories: ['Arts & Crafts'],
    category: 'arts_and_crafts',
    country: 'Nigeria',
    state: 'Abuja',
    city: 'Wuse',
    address: '22 Aminu Kano Crescent',
    styleTags: 'Modern,Afrocentric,Gift',
    profileImageFile: IMG.suhyeon,
    coverImageFile: IMG.kateryna,
    products: [
      { name: 'Adire Notebook Trio', description: 'Three A5 notebooks with Adire covers.', category: 'arts_and_crafts', priceMin: 7000, priceMax: 10000, materials: 'Paper, Adire fabric', estimatedDelivery: '3 days', tags: 'Gift,Afrocentric,Handmade', imageFile: IMG.ankhesenamun },
      { name: 'Lagos Map Art Print', description: 'Limited print of stylised Lagos map.', category: 'arts_and_crafts', priceMin: 9000, priceMax: 14000, materials: 'Archival paper', estimatedDelivery: '4 days', tags: 'Modern,Gift', imageFile: IMG.vladimir },
      { name: 'Calligraphy Quote Card', description: 'Hand-lettered affirmation card set.', category: 'arts_and_crafts', priceMin: 3500, priceMax: 5500, materials: 'Cardstock', estimatedDelivery: '3 days', tags: 'Handmade,Gift,Elegant', imageFile: IMG.kateryna },
      { name: 'Origami Decor Pack', description: 'Pre-folded origami décor in Ankara papers.', category: 'arts_and_crafts', priceMin: 6000, priceMax: 9000, materials: 'Patterned paper', estimatedDelivery: '5 days', tags: 'Handmade,Modern,Home', imageFile: IMG.pmv },
      { name: 'Wedding Invitation Suite', description: 'Customisable invitation suite sample pack.', category: 'arts_and_crafts', priceMin: 20000, priceMax: 35000, materials: 'Premium cardstock', estimatedDelivery: '10 days', tags: 'Wedding,Luxury,Elegant', imageFile: IMG.collab },
    ],
  },
  {
    index: 7,
    firstName: 'Emeka',
    lastName: 'Nnamdi',
    businessName: 'SoleCraft Aba',
    description: 'Hand-stitched leather footwear from Aba — oxfords, boots, and sandals.',
    serviceCategories: ['Shoemaking'],
    category: 'shoemaking',
    country: 'Nigeria',
    state: 'Abia',
    city: 'Aba',
    address: '14 Azikiwe Road',
    styleTags: 'Handmade,Premium,Formal',
    profileImageFile: IMG.mohamad,
    coverImageFile: IMG.ryanPlomp,
    products: [
      { name: 'Classic Oxford Brown', description: 'Goodyear-welted brown oxford.', category: 'shoemaking', priceMin: 48000, priceMax: 72000, materials: 'Full-grain leather', estimatedDelivery: '14 days', tags: 'Formal,Handmade,Premium', imageFile: IMG.ryanPlomp },
      { name: 'Chelsea Boot Black', description: 'Black Chelsea boots with elastic gussets.', category: 'shoemaking', priceMin: 55000, priceMax: 80000, materials: 'Leather, rubber sole', estimatedDelivery: '14 days', tags: 'Casual,Premium,Handmade', imageFile: IMG.wiser },
      { name: 'Leather Slide Sandal', description: 'Open slide sandal for warm weather.', category: 'shoemaking', priceMin: 18000, priceMax: 26000, materials: 'Vegetable-tanned leather', estimatedDelivery: '7 days', tags: 'Casual,Handmade', imageFile: IMG.asif },
      { name: 'Monk Strap Loafer', description: 'Single-buckle monk strap loafer.', category: 'shoemaking', priceMin: 52000, priceMax: 75000, materials: 'Calf leather', estimatedDelivery: '12 days', tags: 'Formal,Premium', imageFile: IMG.ryanWaring },
      { name: 'Kids School Shoe', description: 'Durable school shoe with cushioned insole.', category: 'shoemaking', priceMin: 15000, priceMax: 22000, materials: 'Leather, rubber', estimatedDelivery: '8 days', tags: 'Kids,Casual,Handmade', imageFile: IMG.noah },
    ],
  },
  {
    index: 8,
    firstName: 'Amaka',
    lastName: 'Chioma',
    businessName: 'Chioma Heel House',
    description: 'Women’s heels, flats, and bridal footwear custom-fitted in Lagos.',
    serviceCategories: ['Shoemaking'],
    category: 'shoemaking',
    country: 'Nigeria',
    state: 'Lagos',
    city: 'Surulere',
    address: '67 Adeniran Ogunsanya',
    styleTags: 'Elegant,Luxury,Wedding',
    profileImageFile: IMG.valeriia,
    coverImageFile: IMG.wiser,
    products: [
      { name: 'Block Heel Pump', description: 'Comfortable block heel in nude leather.', category: 'shoemaking', priceMin: 32000, priceMax: 45000, materials: 'Leather', estimatedDelivery: '10 days', tags: 'Elegant,Corporate', imageFile: IMG.wiser },
      { name: 'Bridal Satin Heel', description: 'Ivory satin heel with pearl clasp.', category: 'shoemaking', priceMin: 60000, priceMax: 90000, materials: 'Satin, pearl', estimatedDelivery: '18 days', tags: 'Wedding,Luxury', imageFile: IMG.sabrianna },
      { name: 'Ankara Flat Mule', description: 'Backless mule wrapped in Ankara.', category: 'shoemaking', priceMin: 20000, priceMax: 28000, materials: 'Ankara, leather sole', estimatedDelivery: '7 days', tags: 'Afrocentric,Casual', imageFile: IMG.ryanPlomp },
      { name: 'Strappy Evening Sandal', description: 'Gold-tone strappy sandal for events.', category: 'shoemaking', priceMin: 35000, priceMax: 50000, materials: 'Leather, metal hardware', estimatedDelivery: '10 days', tags: 'Evening,Elegant,Luxury', imageFile: IMG.asif },
      { name: 'Wedge Espadrille', description: 'Jute wedge espadrille for weekends.', category: 'shoemaking', priceMin: 22000, priceMax: 32000, materials: 'Canvas, jute', estimatedDelivery: '8 days', tags: 'Casual,Modern', imageFile: IMG.noah },
    ],
  },
  {
    index: 9,
    firstName: 'Tunde',
    lastName: 'Bakare',
    businessName: 'Bakare Boots Co.',
    description: 'Rugged handmade boots and work shoes built for durability.',
    serviceCategories: ['Shoemaking'],
    category: 'shoemaking',
    country: 'Nigeria',
    state: 'Oyo',
    city: 'Ibadan',
    address: '11 Ring Road',
    styleTags: 'Handmade,Premium,Casual',
    profileImageFile: IMG.noah,
    coverImageFile: IMG.asif,
    products: [
      { name: 'Desert Boot Tan', description: 'Classic desert boot in tan suede.', category: 'shoemaking', priceMin: 40000, priceMax: 58000, materials: 'Suede, crepe sole', estimatedDelivery: '12 days', tags: 'Casual,Handmade', imageFile: IMG.asif },
      { name: 'Work Boot Steel Cap', description: 'Safety work boot with steel toe.', category: 'shoemaking', priceMin: 45000, priceMax: 65000, materials: 'Leather, steel', estimatedDelivery: '14 days', tags: 'Handmade,Premium', imageFile: IMG.wiser },
      { name: 'Chukka Boot Navy', description: 'Navy chukka with rubber sole.', category: 'shoemaking', priceMin: 38000, priceMax: 52000, materials: 'Leather', estimatedDelivery: '11 days', tags: 'Casual,Modern', imageFile: IMG.ryanPlomp },
      { name: 'Moccasin Soft Sole', description: 'Driving moccasin with soft sole.', category: 'shoemaking', priceMin: 28000, priceMax: 40000, materials: 'Nappa leather', estimatedDelivery: '9 days', tags: 'Casual,Elegant', imageFile: IMG.ryanWaring },
      { name: 'Rain Boot Gloss', description: 'Waterproof gloss rain boot.', category: 'shoemaking', priceMin: 18000, priceMax: 26000, materials: 'PVC, textile lining', estimatedDelivery: '6 days', tags: 'Casual,Modern', imageFile: IMG.noah },
    ],
  },
  {
    index: 10,
    firstName: 'Bisi',
    lastName: 'Adeleke',
    businessName: 'Beauty by Bisi',
    description: 'Natural haircare, bridal makeup kits, and beauty workshops.',
    serviceCategories: ['Beauty'],
    category: 'beauty',
    country: 'Nigeria',
    state: 'Lagos',
    city: 'Yaba',
    address: '9 Herbert Macaulay',
    styleTags: 'Natural,Luxury,Bridal',
    profileImageFile: IMG.rosa,
    coverImageFile: IMG.sabrianna,
    products: [
      { name: 'Shea Hair Butter 250ml', description: 'Whipped shea butter for natural hair.', category: 'beauty', priceMin: 5500, priceMax: 8000, materials: 'Shea butter, oils', estimatedDelivery: '3 days', tags: 'Natural,Haircare', imageFile: IMG.rosa },
      { name: 'Bridal Glow Kit', description: 'Primer, highlighter, and setting spray set.', category: 'beauty', priceMin: 25000, priceMax: 38000, materials: 'Cosmetic blend', estimatedDelivery: '5 days', tags: 'Bridal,Luxury', imageFile: IMG.sabrianna },
      { name: 'Black Soap Face Bar', description: 'Traditional African black soap bar.', category: 'beauty', priceMin: 2500, priceMax: 4000, materials: 'Plant ash, oils', estimatedDelivery: '3 days', tags: 'Natural,Skincare', imageFile: IMG.kateryna },
      { name: 'Argan Scalp Oil', description: 'Lightweight argan oil for scalp health.', category: 'beauty', priceMin: 7000, priceMax: 11000, materials: 'Argan oil', estimatedDelivery: '4 days', tags: 'Natural,Haircare', imageFile: IMG.valeriia },
      { name: 'Makeup Brush Set (8)', description: 'Vegan bristle brush set with pouch.', category: 'beauty', priceMin: 12000, priceMax: 18000, materials: 'Synthetic bristle', estimatedDelivery: '5 days', tags: 'Makeup,Premium', imageFile: IMG.larisa },
    ],
  },
  {
    index: 11,
    firstName: 'Zainab',
    lastName: 'Ibrahim',
    businessName: 'Zainab Naturals',
    description: 'Plant-based skincare and body care formulated in Abuja.',
    serviceCategories: ['Beauty'],
    category: 'beauty',
    country: 'Nigeria',
    state: 'Abuja',
    city: 'Garki',
    address: '5 Moshood Abiola Way',
    styleTags: 'Natural,Modern,Premium',
    profileImageFile: IMG.kateryna,
    coverImageFile: IMG.rosa,
    products: [
      { name: 'Hibiscus Face Mist', description: 'Refreshing hibiscus toner mist.', category: 'beauty', priceMin: 6000, priceMax: 9000, materials: 'Hibiscus extract', estimatedDelivery: '3 days', tags: 'Natural,Skincare', imageFile: IMG.rosa },
      { name: 'Cocoa Body Butter', description: 'Rich cocoa butter for dry skin.', category: 'beauty', priceMin: 8000, priceMax: 12000, materials: 'Cocoa butter', estimatedDelivery: '4 days', tags: 'Natural,Bodycare', imageFile: IMG.sabrianna },
      { name: 'Clay Detox Mask', description: 'Kaolin clay mask with tea tree.', category: 'beauty', priceMin: 7500, priceMax: 11000, materials: 'Kaolin, tea tree', estimatedDelivery: '4 days', tags: 'Natural,Skincare', imageFile: IMG.valeriia },
      { name: 'Lip Balm Trio', description: 'Shea lip balms in three tints.', category: 'beauty', priceMin: 4500, priceMax: 6500, materials: 'Shea, beeswax', estimatedDelivery: '3 days', tags: 'Natural,Gift', imageFile: IMG.larisa },
      { name: 'Aromatherapy Roller', description: 'Lavender-citrus essential oil roller.', category: 'beauty', priceMin: 5000, priceMax: 7500, materials: 'Essential oils', estimatedDelivery: '3 days', tags: 'Natural,Wellness', imageFile: IMG.kateryna },
    ],
  },
  {
    index: 12,
    firstName: 'Kunle',
    lastName: 'Adeyemi',
    businessName: 'Adeyemi Leather Lab',
    description: 'Bags, belts, and wallets handcrafted from Nigerian leather.',
    serviceCategories: ['Leatherwork'],
    category: 'leatherwork',
    country: 'Nigeria',
    state: 'Lagos',
    city: 'Mushin',
    address: '28 Agege Motor Road',
    styleTags: 'Handmade,Premium,Corporate',
    profileImageFile: IMG.asif,
    coverImageFile: IMG.ryanWaring,
    products: [
      { name: 'Messenger Laptop Bag', description: 'Padded 15" laptop messenger bag.', category: 'leatherwork', priceMin: 38000, priceMax: 55000, materials: 'Full-grain leather', estimatedDelivery: '10 days', tags: 'Corporate,Handmade', imageFile: IMG.ryanWaring },
      { name: 'Bifold Wallet', description: 'Slim bifold with RFID lining.', category: 'leatherwork', priceMin: 12000, priceMax: 18000, materials: 'Vegetable-tanned leather', estimatedDelivery: '5 days', tags: 'Handmade,Casual', imageFile: IMG.rupixen },
      { name: 'Tooled Belt 36mm', description: 'Hand-tooled belt with brass buckle.', category: 'leatherwork', priceMin: 14000, priceMax: 20000, materials: 'Leather, brass', estimatedDelivery: '6 days', tags: 'Handmade,Casual', imageFile: IMG.wiser },
      { name: 'Weekender Duffel', description: 'Spacious leather weekender bag.', category: 'leatherwork', priceMin: 65000, priceMax: 95000, materials: 'Full-grain leather', estimatedDelivery: '14 days', tags: 'Premium,Travel,Handmade', imageFile: IMG.asif },
      { name: 'Card Holder Mini', description: 'Four-slot card holder.', category: 'leatherwork', priceMin: 7000, priceMax: 10000, materials: 'Leather', estimatedDelivery: '4 days', tags: 'Handmade,Gift', imageFile: IMG.noah },
    ],
  },
  {
    index: 13,
    firstName: 'Sade',
    lastName: 'Ogunleye',
    businessName: 'Sade Leather Atelier',
    description: 'Contemporary leather goods with clean lines and custom monograms.',
    serviceCategories: ['Leatherwork'],
    category: 'leatherwork',
    country: 'Nigeria',
    state: 'Ogun',
    city: 'Abeokuta',
    address: '4 Ibara Housing Estate',
    styleTags: 'Modern,Luxury,Handmade',
    profileImageFile: IMG.alex,
    coverImageFile: IMG.rupixen,
    products: [
      { name: 'Crossbody Mini Bag', description: 'Compact crossbody with adjustable strap.', category: 'leatherwork', priceMin: 28000, priceMax: 40000, materials: 'Soft leather', estimatedDelivery: '8 days', tags: 'Modern,Handmade', imageFile: IMG.rupixen },
      { name: 'Passport Cover', description: 'Embossed leather passport cover.', category: 'leatherwork', priceMin: 9000, priceMax: 14000, materials: 'Leather', estimatedDelivery: '5 days', tags: 'Travel,Gift,Handmade', imageFile: IMG.ryanWaring },
      { name: 'Laptop Sleeve 13"', description: 'Slim padded laptop sleeve.', category: 'leatherwork', priceMin: 20000, priceMax: 30000, materials: 'Leather, felt', estimatedDelivery: '7 days', tags: 'Corporate,Modern', imageFile: IMG.asif },
      { name: 'Key Organiser', description: 'Leather key organiser with hook ring.', category: 'leatherwork', priceMin: 6000, priceMax: 9000, materials: 'Leather', estimatedDelivery: '4 days', tags: 'Handmade,Gift', imageFile: IMG.noah },
      { name: 'Tassel Clutch', description: 'Evening clutch with detachable tassel.', category: 'leatherwork', priceMin: 24000, priceMax: 36000, materials: 'Suede leather', estimatedDelivery: '9 days', tags: 'Evening,Luxury,Elegant', imageFile: IMG.wiser },
    ],
  },
  {
    index: 14,
    firstName: 'Obinna',
    lastName: 'Uche',
    businessName: 'Uche Strapworks',
    description: 'Camera straps, watch straps, and specialty leather accessories.',
    serviceCategories: ['Leatherwork'],
    category: 'leatherwork',
    country: 'Nigeria',
    state: 'Rivers',
    city: 'Port Harcourt',
    address: '16 Aba Road',
    styleTags: 'Handmade,Premium,Modern',
    profileImageFile: IMG.vladimir,
    coverImageFile: IMG.noah,
    products: [
      { name: 'Camera Strap Vintage', description: 'Padded camera strap with brass hardware.', category: 'leatherwork', priceMin: 16000, priceMax: 24000, materials: 'Leather, brass', estimatedDelivery: '7 days', tags: 'Handmade,Premium', imageFile: IMG.ryanWaring },
      { name: 'Watch Strap 20mm', description: 'Quick-release leather watch strap.', category: 'leatherwork', priceMin: 8000, priceMax: 12000, materials: 'Leather', estimatedDelivery: '5 days', tags: 'Handmade,Modern', imageFile: IMG.rupixen },
      { name: 'Guitar Strap Soft', description: 'Wide leather guitar strap.', category: 'leatherwork', priceMin: 18000, priceMax: 26000, materials: 'Leather', estimatedDelivery: '8 days', tags: 'Handmade,Casual', imageFile: IMG.asif },
      { name: 'Dog Collar & Lead', description: 'Matched collar and lead set.', category: 'leatherwork', priceMin: 14000, priceMax: 22000, materials: 'Leather', estimatedDelivery: '6 days', tags: 'Handmade,Gift', imageFile: IMG.noah },
      { name: 'Journal Cover A5', description: 'Refillable leather journal cover.', category: 'leatherwork', priceMin: 15000, priceMax: 22000, materials: 'Leather', estimatedDelivery: '6 days', tags: 'Handmade,Corporate', imageFile: IMG.wiser },
    ],
  },
  {
    index: 15,
    firstName: 'Chidinma',
    lastName: 'Okoro',
    businessName: 'Okoro Beads & Gold',
    description: 'Coral, gold-plated, and bridal jewellery collections.',
    serviceCategories: ['Jewellery'],
    category: 'jewellery',
    country: 'Nigeria',
    state: 'Imo',
    city: 'Owerri',
    address: '7 Wetheral Road',
    styleTags: 'Luxury,Wedding,Traditional',
    profileImageFile: IMG.sabrianna,
    coverImageFile: IMG.rupixen,
    products: [
      { name: 'Coral Bead Necklace', description: 'Traditional coral necklace with gold clasp.', category: 'jewellery', priceMin: 45000, priceMax: 75000, materials: 'Coral, gold plate', estimatedDelivery: '10 days', tags: 'Traditional,Wedding,Luxury', imageFile: IMG.rupixen },
      { name: 'Ankara Hoop Earrings', description: 'Lightweight Ankara-wrapped hoops.', category: 'jewellery', priceMin: 5000, priceMax: 8000, materials: 'Ankara, metal', estimatedDelivery: '4 days', tags: 'Afrocentric,Casual,Modern', imageFile: IMG.sabrianna },
      { name: 'Bridal Jewellery Set', description: 'Necklace, earrings, bracelet, and tiara set.', category: 'jewellery', priceMin: 90000, priceMax: 140000, materials: 'Crystals, pearls', estimatedDelivery: '14 days', tags: 'Wedding,Luxury,Elegant', imageFile: IMG.rosa },
      { name: 'Waist Beads Custom', description: 'Custom colour waist beads on elastic.', category: 'jewellery', priceMin: 3500, priceMax: 7000, materials: 'Glass beads', estimatedDelivery: '5 days', tags: 'Traditional,Afrocentric', imageFile: IMG.valeriia },
      { name: 'Gold Plate Cuff', description: 'Wide cuff bracelet with brushed finish.', category: 'jewellery', priceMin: 18000, priceMax: 28000, materials: 'Gold plate', estimatedDelivery: '7 days', tags: 'Modern,Luxury', imageFile: IMG.kateryna },
    ],
  },
  {
    index: 16,
    firstName: 'Yetunde',
    lastName: 'Adebayo',
    businessName: 'Yetunde Fine Jewels',
    description: 'Minimalist everyday jewellery in sterling silver and gold vermeil.',
    serviceCategories: ['Jewellery'],
    category: 'jewellery',
    country: 'Nigeria',
    state: 'Lagos',
    city: 'Victoria Island',
    address: '33 Adeola Odeku',
    styleTags: 'Modern,Elegant,Luxury',
    profileImageFile: IMG.larisa,
    coverImageFile: IMG.valeriia,
    products: [
      { name: 'Layered Chain Necklace', description: 'Three-layer fine chain necklace.', category: 'jewellery', priceMin: 22000, priceMax: 34000, materials: 'Gold vermeil', estimatedDelivery: '6 days', tags: 'Modern,Elegant', imageFile: IMG.sabrianna },
      { name: 'Pearl Stud Earrings', description: 'Freshwater pearl studs.', category: 'jewellery', priceMin: 15000, priceMax: 22000, materials: 'Pearl, silver', estimatedDelivery: '5 days', tags: 'Elegant,Gift', imageFile: IMG.rosa },
      { name: 'Stackable Ring Set', description: 'Set of five thin stackable rings.', category: 'jewellery', priceMin: 18000, priceMax: 26000, materials: 'Sterling silver', estimatedDelivery: '5 days', tags: 'Modern,Casual', imageFile: IMG.rupixen },
      { name: 'Anklet Charm', description: 'Delicate anklet with disc charm.', category: 'jewellery', priceMin: 10000, priceMax: 15000, materials: 'Gold vermeil', estimatedDelivery: '4 days', tags: 'Casual,Modern', imageFile: IMG.valeriia },
      { name: 'Statement Cocktail Ring', description: 'Oversized cocktail ring with stone.', category: 'jewellery', priceMin: 28000, priceMax: 42000, materials: 'Alloy, CZ', estimatedDelivery: '7 days', tags: 'Evening,Luxury', imageFile: IMG.kateryna },
    ],
  },
  {
    index: 17,
    firstName: 'Seun',
    lastName: 'Afolabi',
    businessName: 'Afolabi Home Studio',
    description: 'Wooden furniture accents and home décor crafted in Ibadan.',
    serviceCategories: ['Home & Decor'],
    category: 'home_and_decor',
    country: 'Nigeria',
    state: 'Oyo',
    city: 'Ibadan',
    address: '2 Bodija Estate',
    styleTags: 'Handmade,Modern,Afrocentric',
    profileImageFile: IMG.pmv,
    coverImageFile: IMG.spacejoy,
    products: [
      { name: 'Iroko Side Table', description: 'Solid iroko side table with hairpin legs.', category: 'home_and_decor', priceMin: 55000, priceMax: 80000, materials: 'Iroko wood, steel', estimatedDelivery: '18 days', tags: 'Handmade,Modern,Premium', imageFile: IMG.spacejoy },
      { name: 'Ankara Throw Pillow', description: 'Cushion cover in Ankara print.', category: 'home_and_decor', priceMin: 8000, priceMax: 12000, materials: 'Ankara, cotton fill', estimatedDelivery: '5 days', tags: 'Afrocentric,Home,Casual', imageFile: IMG.graphicShirt },
      { name: 'Floating Shelf Pair', description: 'Pair of walnut-finish floating shelves.', category: 'home_and_decor', priceMin: 20000, priceMax: 30000, materials: 'Pine, brackets', estimatedDelivery: '8 days', tags: 'Modern,Home', imageFile: IMG.vladimir },
      { name: 'Carved Stool Accent', description: 'Hand-carved decorative stool.', category: 'home_and_decor', priceMin: 35000, priceMax: 52000, materials: 'Mahogany', estimatedDelivery: '14 days', tags: 'Traditional,Handmade,Afrocentric', imageFile: IMG.ankhesenamun },
      { name: 'Soy Candle Trio', description: 'Three scented soy candles in ceramic jars.', category: 'home_and_decor', priceMin: 12000, priceMax: 18000, materials: 'Soy wax, ceramic', estimatedDelivery: '5 days', tags: 'Gift,Home,Elegant', imageFile: IMG.pmv },
    ],
  },
  {
    index: 18,
    firstName: 'Halima',
    lastName: 'Sule',
    businessName: 'Sule Living',
    description: 'Soft furnishings, rugs, and table décor with Northern motifs.',
    serviceCategories: ['Home & Decor'],
    category: 'home_and_decor',
    country: 'Nigeria',
    state: 'Kaduna',
    city: 'Kaduna',
    address: '18 Independence Way',
    styleTags: 'Traditional,Elegant,Home',
    profileImageFile: IMG.suhyeon,
    coverImageFile: IMG.collab,
    products: [
      { name: 'Woven Floor Rug 4x6', description: 'Handwoven rug with geometric pattern.', category: 'home_and_decor', priceMin: 45000, priceMax: 70000, materials: 'Wool blend', estimatedDelivery: '16 days', tags: 'Handmade,Traditional,Home', imageFile: IMG.spacejoy },
      { name: 'Table Runner Embroidered', description: 'Embroidered linen table runner.', category: 'home_and_decor', priceMin: 10000, priceMax: 16000, materials: 'Linen', estimatedDelivery: '6 days', tags: 'Elegant,Home', imageFile: IMG.ankhesenamun },
      { name: 'Ceramic Vase Pair', description: 'Matched tall and short ceramic vases.', category: 'home_and_decor', priceMin: 18000, priceMax: 28000, materials: 'Ceramic', estimatedDelivery: '8 days', tags: 'Modern,Home', imageFile: IMG.vladimir },
      { name: 'Macramé Wall Hang', description: 'Large macramé wall hanging.', category: 'home_and_decor', priceMin: 15000, priceMax: 24000, materials: 'Cotton cord', estimatedDelivery: '9 days', tags: 'Handmade,Modern,Home', imageFile: IMG.kateryna },
      { name: 'Tea Light Holder Set', description: 'Set of four brass tea light holders.', category: 'home_and_decor', priceMin: 9000, priceMax: 14000, materials: 'Brass', estimatedDelivery: '5 days', tags: 'Gift,Elegant,Home', imageFile: IMG.pmv },
    ],
  },
  {
    index: 19,
    firstName: 'Chisom',
    lastName: 'Obi',
    businessName: 'Canvas & Co. Studio',
    description: 'Original canvas paintings and custom portraits from Lagos.',
    // Signup meta API has no Paintings chip yet — use Arts & Crafts for UI; products stay paintings_and_canvas
    serviceCategories: ['Arts & Crafts'],
    category: 'paintings_and_canvas',
    country: 'Nigeria',
    state: 'Lagos',
    city: 'Ikoyi',
    address: '15 Awolowo Road',
    styleTags: 'Modern,Afrocentric,Luxury',
    profileImageFile: IMG.christian,
    coverImageFile: IMG.vladimir,
    products: [
      { name: 'Lagos Skyline at Dusk', description: 'Acrylic skyline painting on gallery canvas.', category: 'paintings_and_canvas', priceMin: 75000, priceMax: 120000, materials: 'Acrylic on canvas', estimatedDelivery: '10 days', tags: 'Modern,Afrocentric', imageFile: IMG.vladimir },
      { name: 'Market Day Portrait', description: 'Oil painting of a Nigerian market scene.', category: 'paintings_and_canvas', priceMin: 60000, priceMax: 95000, materials: 'Oil on canvas', estimatedDelivery: '14 days', tags: 'Traditional,Afrocentric', imageFile: IMG.ankhesenamun },
      { name: 'Abstract Unity Panel', description: 'Geometric abstract celebrating unity.', category: 'paintings_and_canvas', priceMin: 40000, priceMax: 65000, materials: 'Mixed media', estimatedDelivery: '8 days', tags: 'Modern,Elegant', imageFile: IMG.collab },
      { name: 'Custom Family Portrait', description: 'Commissioned portrait from your photo.', category: 'paintings_and_canvas', priceMin: 100000, priceMax: 200000, materials: 'Acrylic/oil on canvas', estimatedDelivery: '21 days', tags: 'Custom,Luxury', imageFile: IMG.samantha },
      { name: 'Mini Canvas Set (3)', description: 'Set of three 8x8 mini canvases.', category: 'paintings_and_canvas', priceMin: 18000, priceMax: 28000, materials: 'Acrylic on canvas', estimatedDelivery: '7 days', tags: 'Modern,Gift,Home', imageFile: IMG.pmv },
    ],
  },
  {
    index: 20,
    firstName: 'Kemi',
    lastName: 'Balogun',
    businessName: 'Balogun Print House',
    description: 'High-quality printed canvas and pop-art style photo transfers.',
    // Signup meta API has no Paintings chip yet — use Arts & Crafts for UI; products stay paintings_and_canvas
    serviceCategories: ['Arts & Crafts'],
    category: 'paintings_and_canvas',
    country: 'Nigeria',
    state: 'Lagos',
    city: 'Maryland',
    address: '41 Mobolaji Bank Anthony',
    styleTags: 'Modern,Casual,Gift',
    profileImageFile: IMG.jazmin,
    coverImageFile: IMG.alex,
    products: [
      { name: 'Photo Canvas 16x20', description: 'Your photo printed on museum canvas.', category: 'paintings_and_canvas', priceMin: 25000, priceMax: 40000, materials: 'Canvas print', estimatedDelivery: '5 days', tags: 'Gift,Modern,Custom', imageFile: IMG.alex },
      { name: 'Pop Art Portrait Print', description: 'Warhol-inspired pop art from your photo.', category: 'paintings_and_canvas', priceMin: 30000, priceMax: 48000, materials: 'Canvas print', estimatedDelivery: '7 days', tags: 'Modern,Gift,Luxury', imageFile: IMG.samantha },
      { name: 'Panoramic Skyline Print', description: 'Wide panoramic Lagos skyline print.', category: 'paintings_and_canvas', priceMin: 35000, priceMax: 55000, materials: 'Canvas print', estimatedDelivery: '6 days', tags: 'Modern,Home', imageFile: IMG.vladimir },
      { name: 'Nursery Animal Trio', description: 'Three soft animal illustrations for nurseries.', category: 'paintings_and_canvas', priceMin: 20000, priceMax: 32000, materials: 'Canvas print', estimatedDelivery: '5 days', tags: 'Kids,Gift,Home', imageFile: IMG.collab },
      { name: 'Quote Typography Canvas', description: 'Custom typography quote on canvas.', category: 'paintings_and_canvas', priceMin: 15000, priceMax: 25000, materials: 'Canvas print', estimatedDelivery: '5 days', tags: 'Modern,Gift,Home', imageFile: IMG.pmv },
    ],
  },
];

/** All filenames referenced by the seed (for preflight checks). */
export function allReferencedImageFiles(): string[] {
  const set = new Set<string>();
  for (const a of SEED_ARTISANS) {
    set.add(a.profileImageFile);
    set.add(a.coverImageFile);
    for (const p of a.products) set.add(p.imageFile);
  }
  return [...set];
}
