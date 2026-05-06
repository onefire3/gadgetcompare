/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Smartphone {
  id: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  releaseDate: string;
  image: string;
  affiliateUrl: string;
  specs: {
    display: string;
    processor: string;
    ram: string;
    storage: string;
    battery: string;
    camera: {
      main: string;
      front: string;
    };
    os: string;
    network: string[];
    weight: string;
  };
  rating: number;
  categories: ("flagship" | "mid-range" | "budget" | "gaming" | "camera")[];
  flipkartData?: {
    price: string;
    title: string;
    link: string;
  };
}

export const SMARTPHONES: Smartphone[] = [
  {
    id: "iphone-15-pro",
    name: "iPhone 15 Pro",
    brand: "Apple",
    price: 999,
    currency: "USD",
    releaseDate: "2023-09-22",
    image: "https://picsum.photos/seed/iphone15/400/600",
    affiliateUrl: "https://amazon.com/iphone15pro",
    specs: {
      display: '6.1" Super Retina XDR OLED, 120Hz',
      processor: "A17 Pro",
      ram: "8GB",
      storage: "128GB, 256GB, 512GB, 1TB",
      battery: "3274 mAh",
      camera: {
        main: "48MP + 12MP + 12MP",
        front: "12MP",
      },
      os: "iOS 17",
      network: ["5G", "4G", "LTE"],
      weight: "187g",
    },
    rating: 4.8,
    categories: ["flagship", "camera"],
  },
  {
    id: "samsung-s24-ultra",
    name: "Galaxy S24 Ultra",
    brand: "Samsung",
    price: 1299,
    currency: "USD",
    releaseDate: "2024-01-24",
    image: "https://picsum.photos/seed/s24u/400/600",
    affiliateUrl: "https://amazon.com/s24ultra",
    specs: {
      display: '6.8" Dynamic LTPO AMOLED 2X, 120Hz',
      processor: "Snapdragon 8 Gen 3 for Galaxy",
      ram: "12GB",
      storage: "256GB, 512GB, 1TB",
      battery: "5000 mAh",
      camera: {
        main: "200MP + 50MP + 10MP + 12MP",
        front: "12MP",
      },
      os: "Android 14 (One UI 6.1)",
      network: ["5G", "4G", "LTE"],
      weight: "232g",
    },
    rating: 4.9,
    categories: ["flagship", "camera", "gaming"],
  },
  {
    id: "pixel-8-pro",
    name: "Pixel 8 Pro",
    brand: "Google",
    price: 999,
    currency: "USD",
    releaseDate: "2023-10-12",
    image: "https://picsum.photos/seed/pixel8p/400/600",
    affiliateUrl: "https://amazon.com/pixel8pro",
    specs: {
      display: '6.7" LTPO OLED, 120Hz',
      processor: "Google Tensor G3",
      ram: "12GB",
      storage: "128GB, 256GB, 512GB, 1TB",
      battery: "5050 mAh",
      camera: {
        main: "50MP + 48MP + 48MP",
        front: "10.5MP",
      },
      os: "Android 14",
      network: ["5G", "4G", "LTE"],
      weight: "213g",
    },
    rating: 4.7,
    categories: ["flagship", "camera"],
  },
  {
    id: "nothing-phone-2",
    name: "Nothing Phone (2)",
    brand: "Nothing",
    price: 599,
    currency: "USD",
    releaseDate: "2023-07-17",
    image: "https://picsum.photos/seed/nothing2/400/600",
    affiliateUrl: "https://amazon.com/nothingphone2",
    specs: {
      display: '6.7" LTPO OLED, 120Hz',
      processor: "Snapdragon 8+ Gen 1",
      ram: "8GB, 12GB",
      storage: "128GB, 256GB, 512GB",
      battery: "4700 mAh",
      camera: {
        main: "50MP + 50MP",
        front: "32MP",
      },
      os: "Android 13 (Nothing OS 2.0)",
      network: ["5G", "4G", "LTE"],
      weight: "201g",
    },
    rating: 4.5,
    categories: ["mid-range"],
  },
  {
    id: "redmi-note-13-pro",
    name: "Redmi Note 13 Pro+",
    brand: "Xiaomi",
    price: 399,
    currency: "USD",
    releaseDate: "2023-09-21",
    image: "https://picsum.photos/seed/redminote13/400/600",
    affiliateUrl: "https://amazon.com/redminote13pro",
    specs: {
      display: '6.67" AMOLED, 120Hz',
      processor: "Dimensity 7200 Ultra",
      ram: "8GB, 12GB, 16GB",
      storage: "256GB, 512GB",
      battery: "5000 mAh",
      camera: {
        main: "200MP + 8MP + 2MP",
        front: "16MP",
      },
      os: "Android 13 (MIUI 14)",
      network: ["5G", "4G", "LTE"],
      weight: "204.5g",
    },
    rating: 4.4,
    categories: ["budget", "camera"],
  }
];
