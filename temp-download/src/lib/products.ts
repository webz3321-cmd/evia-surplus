export type Product = {
  slug: string;
  name: string;
  price: number;
  compareAt?: number;
  category: "Apparel" | "Accessories" | "Footwear" | "Home";
  tagline: string;
  description: string;
  image: string;
  badge?: string;
};

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const PRODUCTS: Product[] = [
  { slug: "linen-overshirt", name: "Linen Overshirt", price: 128, compareAt: 168, category: "Apparel", tagline: "Featherweight European linen", description: "A relaxed-fit overshirt cut from 100% washed European linen. Mother-of-pearl buttons, double-needle hems, made to soften with every wear.", image: img("1591047139829-d91aecb6caea"), badge: "Best seller" },
  { slug: "everyday-tote", name: "Everyday Tote", price: 96, category: "Accessories", tagline: "Full-grain vegetable tanned leather", description: "Hand-finished tote in vegetable-tanned leather that ages beautifully. Reinforced base, interior zip pocket, fits a 14\" laptop.", image: img("1548036328-c9fa89d128fa") },
  { slug: "merino-crewneck", name: "Merino Crewneck", price: 145, category: "Apparel", tagline: "Extra-fine 17.5µ merino", description: "Knit in Italy from extra-fine merino. Temperature regulating, naturally odor-resistant, ribbed cuffs and hem.", image: img("1620799140408-edc6dcb6d633") },
  { slug: "leather-loafers", name: "Leather Loafers", price: 245, category: "Footwear", tagline: "Goodyear-welted in Porto", description: "Hand-lasted loafers with a Blake-stitched leather sole. Built to resole, designed to last decades.", image: img("1542291026-7eec264c27ff") },
  { slug: "wool-trousers", name: "Pleated Wool Trousers", price: 178, compareAt: 220, category: "Apparel", tagline: "Mid-weight Italian wool", description: "Pleated trousers with a tailored, slightly cropped leg. Side-adjusters, mother-of-pearl buttons, fully lined to the knee.", image: img("1473966968600-fa801b869a1a") },
  { slug: "cashmere-scarf", name: "Cashmere Scarf", price: 110, category: "Accessories", tagline: "Inner Mongolian cashmere", description: "Brushed two-ply cashmere with a hand-rolled edge. Lightweight, generous drape, packs flat.", image: img("1601924994987-69e26d50dc26") },
  { slug: "ceramic-vase", name: "Stoneware Vase", price: 64, category: "Home", tagline: "Wheel-thrown stoneware", description: "Thrown by hand in a small Lisbon studio. Matte sand glaze, watertight, no two are exactly alike.", image: img("1578500494198-246f612d3b3d"), badge: "New" },
  { slug: "denim-jacket", name: "Selvedge Denim Jacket", price: 198, category: "Apparel", tagline: "13.5oz Japanese selvedge", description: "A modern take on a workwear classic, cut from Kuroki Mills selvedge denim. Copper rivets, chainstitched hems.", image: img("1591047139756-eb18e7a08746") },
];

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
export const CATEGORIES = ["All", "Apparel", "Accessories", "Footwear", "Home"] as const;
