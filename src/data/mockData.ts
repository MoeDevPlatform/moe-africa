// Centralized mock data for products and providers

export interface Product {
  id: number;
  name: string;
  description: string;
  priceRange: { min: number; max: number };
  currency: string;
  estimatedDeliveryDays: number;
  materials: string;
  tags: string[];
  images: string[];
  category: "tailoring" | "shoemaking" | "beauty" | "leatherwork" | "crafts" | "canvas";
  providerId: number;
}

export interface Provider {
  id: number;
  brandName: string;
  firstName: string;
  lastName: string;
  about: string;
  city: string;
  state: string;
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  featured: boolean;
  estimatedDeliveryDays: number;
  heroImage: string;
  customOrdersEnabled: boolean;
  category: string;
  styleTags: string[];
}

export const providers: Provider[] = [
  {
    id: 1,
    brandName: "Ade Tailors",
    firstName: "Ade",
    lastName: "Olu",
    about: "With over 15 years of experience in traditional and modern African tailoring, Ade Tailors specializes in creating custom-made Ankara suits, dresses, and traditional attire. We use only premium fabrics sourced locally and internationally, ensuring each piece is unique and of the highest quality.",
    city: "Ikeja",
    state: "Lagos",
    phone: "+2348000000001",
    email: "ade@tailors.ng",
    rating: 4.8,
    reviewCount: 124,
    verified: true,
    featured: true,
    estimatedDeliveryDays: 7,
    heroImage: "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=1200",
    customOrdersEnabled: true,
    category: "tailoring",
    styleTags: ["Afrocentric", "Modern", "Traditional"],
  },
  {
    id: 2,
    brandName: "Chidi's Fashion House",
    firstName: "Chidi",
    lastName: "Okonkwo",
    about: "Chidi's Fashion House brings contemporary elegance to African fashion. Specializing in executive wear, corporate attire, and wedding outfits with a modern twist on traditional designs.",
    city: "Victoria Island",
    state: "Lagos",
    phone: "+2348000000002",
    email: "chidi@fashionhouse.ng",
    rating: 4.7,
    reviewCount: 89,
    verified: true,
    featured: false,
    estimatedDeliveryDays: 5,
    heroImage: "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=1200",
    customOrdersEnabled: true,
    category: "tailoring",
    styleTags: ["Executive", "Corporate", "Wedding"],
  },
  {
    id: 3,
    brandName: "Ngozi's Stitches",
    firstName: "Ngozi",
    lastName: "Adebayo",
    about: "Specializing in women's fashion with a focus on elegant evening wear, traditional aso-ebi, and contemporary African prints. Every piece tells a story.",
    city: "Surulere",
    state: "Lagos",
    phone: "+2348000000003",
    email: "ngozi@stitches.ng",
    rating: 4.9,
    reviewCount: 156,
    verified: true,
    featured: true,
    estimatedDeliveryDays: 6,
    heroImage: "https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=1200",
    customOrdersEnabled: true,
    category: "tailoring",
    styleTags: ["Elegant", "Evening Wear", "Aso-Ebi"],
  },
  {
    id: 4,
    brandName: "SoleCraft Nigeria",
    firstName: "Emeka",
    lastName: "Nnamdi",
    about: "Master shoemakers crafting premium leather footwear. From formal oxfords to casual loafers, each pair is handmade with precision and attention to detail.",
    city: "Aba",
    state: "Abia",
    phone: "+2348000000004",
    email: "emeka@solecraft.ng",
    rating: 4.8,
    reviewCount: 98,
    verified: true,
    featured: true,
    estimatedDeliveryDays: 10,
    heroImage: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200",
    customOrdersEnabled: true,
    category: "shoemaking",
    styleTags: ["Premium", "Handmade", "Leather"],
  },
  {
    id: 5,
    brandName: "Footwear Elegance",
    firstName: "Amaka",
    lastName: "Chioma",
    about: "Creating beautiful women's footwear with Nigerian flair. Heels, flats, sandals - all custom-made to fit perfectly and look stunning.",
    city: "Enugu",
    state: "Enugu",
    phone: "+2348000000005",
    email: "amaka@footwearelegance.ng",
    rating: 4.6,
    reviewCount: 72,
    verified: false,
    featured: false,
    estimatedDeliveryDays: 8,
    heroImage: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=1200",
    customOrdersEnabled: true,
    category: "shoemaking",
    styleTags: ["Women's Fashion", "Elegant", "Custom Fit"],
  },
  {
    id: 6,
    brandName: "Beauty by Bisi",
    firstName: "Bisi",
    lastName: "Adeleke",
    about: "Professional makeup artist and beauty consultant with 10+ years experience. Specializing in bridal makeup, special events, and beauty training.",
    city: "Lekki",
    state: "Lagos",
    phone: "+2348000000006",
    email: "bisi@beautybybisi.ng",
    rating: 4.9,
    reviewCount: 201,
    verified: true,
    featured: false,
    estimatedDeliveryDays: 1,
    heroImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=1200",
    customOrdersEnabled: true,
    category: "beauty",
    styleTags: ["Bridal", "Events", "Professional"],
  },
  {
    id: 7,
    brandName: "Leather Works Lagos",
    firstName: "Tunde",
    lastName: "Bakare",
    about: "Artisan leather goods maker. Bags, belts, wallets, and accessories all handcrafted from premium leather with traditional and modern designs.",
    city: "Yaba",
    state: "Lagos",
    phone: "+2348000000007",
    email: "tunde@leatherworks.ng",
    rating: 4.7,
    reviewCount: 84,
    verified: true,
    featured: false,
    estimatedDeliveryDays: 7,
    heroImage: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=1200",
    customOrdersEnabled: true,
    category: "leatherwork",
    styleTags: ["Artisan", "Premium", "Handcrafted"],
  },
];

export const products: Product[] = [
  // Ade Tailors (Provider 1) - Tailoring
  {
    id: 101,
    name: "Custom Ankara Jacket",
    description: "This handmade fitted jacket is crafted from premium Ankara fabric sourced directly from local markets. Each piece is unique and made to order based on your exact specifications. Perfect for both casual and formal occasions, combining traditional African patterns with modern tailoring techniques.",
    priceRange: { min: 25000, max: 35000 },
    currency: "NGN",
    estimatedDeliveryDays: 7,
    materials: "100% Cotton Ankara Fabric",
    tags: ["Afrocentric", "Modern", "Custom Fit"],
    images: [
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
      "https://images.unsplash.com/photo-1558769132-cb1aea3c8501?w=800",
      "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=800",
    ],
    category: "tailoring",
    providerId: 1,
  },
  {
    id: 102,
    name: "Traditional Agbada Set",
    description: "Elegant three-piece traditional Agbada with intricate embroidery. Perfect for weddings and special occasions. Includes matching cap and trousers.",
    priceRange: { min: 45000, max: 65000 },
    currency: "NGN",
    estimatedDeliveryDays: 10,
    materials: "Premium Brocade Fabric with Gold Embroidery",
    tags: ["Traditional", "Wedding", "Luxury"],
    images: [
      "https://images.unsplash.com/photo-1622288432450-277d0fef5ed6?w=800",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
    ],
    category: "tailoring",
    providerId: 1,
  },
  {
    id: 103,
    name: "Women's Ankara Dress",
    description: "Elegant floor-length dress with custom fitting and beautiful African print patterns. Perfect for any occasion.",
    priceRange: { min: 30000, max: 42000 },
    currency: "NGN",
    estimatedDeliveryDays: 7,
    materials: "Premium Ankara Cotton",
    tags: ["Elegant", "Women's Fashion", "Custom"],
    images: [
      "https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=800",
      "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
    ],
    category: "tailoring",
    providerId: 1,
  },
  
  // Chidi's Fashion House (Provider 2) - Tailoring
  {
    id: 201,
    name: "Executive Business Suit",
    description: "Sharp, modern business suit perfect for the corporate professional. Tailored to perfection with premium imported fabric.",
    priceRange: { min: 55000, max: 75000 },
    currency: "NGN",
    estimatedDeliveryDays: 5,
    materials: "Italian Wool Blend",
    tags: ["Executive", "Corporate", "Professional"],
    images: [
      "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
    ],
    category: "tailoring",
    providerId: 2,
  },
  {
    id: 202,
    name: "Wedding Tuxedo",
    description: "Classic tuxedo with modern styling. Perfect for grooms and groomsmen. Includes shirt, bow tie, and cummerbund.",
    priceRange: { min: 70000, max: 95000 },
    currency: "NGN",
    estimatedDeliveryDays: 7,
    materials: "Premium Black Wool",
    tags: ["Wedding", "Formal", "Luxury"],
    images: [
      "https://images.unsplash.com/photo-1621976360623-004223992275?w=800",
    ],
    category: "tailoring",
    providerId: 2,
  },

  // Ngozi's Stitches (Provider 3) - Tailoring
  {
    id: 301,
    name: "Evening Gown Collection",
    description: "Stunning evening gowns with intricate beadwork and elegant designs. Perfect for galas and special events.",
    priceRange: { min: 48000, max: 68000 },
    currency: "NGN",
    estimatedDeliveryDays: 8,
    materials: "Silk Chiffon with Crystal Embellishments",
    tags: ["Evening Wear", "Elegant", "Luxury"],
    images: [
      "https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800",
    ],
    category: "tailoring",
    providerId: 3,
  },
  {
    id: 302,
    name: "Aso-Ebi Special",
    description: "Beautiful aso-ebi styles perfect for weddings and parties. Custom designs to match your group's theme.",
    priceRange: { min: 35000, max: 50000 },
    currency: "NGN",
    estimatedDeliveryDays: 6,
    materials: "Premium Lace or Ankara",
    tags: ["Aso-Ebi", "Wedding", "Party"],
    images: [
      "https://images.unsplash.com/photo-1612423284934-2850a4ea6b0f?w=800",
    ],
    category: "tailoring",
    providerId: 3,
  },

  // SoleCraft Nigeria (Provider 4) - Shoemaking
  {
    id: 401,
    name: "Classic Oxford Shoes",
    description: "Handcrafted leather oxford shoes. Perfect for formal occasions and business wear. Each pair is made to measure.",
    priceRange: { min: 35000, max: 48000 },
    currency: "NGN",
    estimatedDeliveryDays: 10,
    materials: "Full Grain Leather",
    tags: ["Formal", "Handmade", "Premium"],
    images: [
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800",
    ],
    category: "shoemaking",
    providerId: 4,
  },
  {
    id: 402,
    name: "Casual Loafers",
    description: "Comfortable leather loafers perfect for everyday wear. Combines style with comfort.",
    priceRange: { min: 25000, max: 35000 },
    currency: "NGN",
    estimatedDeliveryDays: 8,
    materials: "Soft Leather with Rubber Sole",
    tags: ["Casual", "Comfortable", "Everyday"],
    images: [
      "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800",
    ],
    category: "shoemaking",
    providerId: 4,
  },
  {
    id: 403,
    name: "Leather Boots",
    description: "Rugged leather boots built to last. Perfect for any weather and occasion.",
    priceRange: { min: 42000, max: 58000 },
    currency: "NGN",
    estimatedDeliveryDays: 12,
    materials: "Premium Leather with Thick Sole",
    tags: ["Boots", "Durable", "All-Weather"],
    images: [
      "https://images.unsplash.com/photo-1542840843-3349799cded6?w=800",
    ],
    category: "shoemaking",
    providerId: 4,
  },

  // Footwear Elegance (Provider 5) - Shoemaking
  {
    id: 501,
    name: "Designer Heels",
    description: "Elegant high heels with Nigerian-inspired designs. Custom made for perfect fit and comfort.",
    priceRange: { min: 28000, max: 40000 },
    currency: "NGN",
    estimatedDeliveryDays: 8,
    materials: "Leather with Cushioned Insole",
    tags: ["Heels", "Elegant", "Women's Fashion"],
    images: [
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800",
    ],
    category: "shoemaking",
    providerId: 5,
  },
  {
    id: 502,
    name: "Comfort Flats",
    description: "Stylish flats that don't compromise on comfort. Perfect for all-day wear.",
    priceRange: { min: 18000, max: 25000 },
    currency: "NGN",
    estimatedDeliveryDays: 7,
    materials: "Soft Leather",
    tags: ["Flats", "Comfortable", "Casual"],
    images: [
      "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800",
    ],
    category: "shoemaking",
    providerId: 5,
  },
];

export const getProductById = (id: number): Product | undefined => {
  return products.find((p) => p.id === id);
};

export const getProviderById = (id: number): Provider | undefined => {
  return providers.find((p) => p.id === id);
};

export const getProductsByProviderId = (providerId: number): Product[] => {
  return products.filter((p) => p.providerId === providerId);
};

export const getProvidersByCategory = (category: string): Provider[] => {
  return providers.filter((p) => p.category === category);
};
