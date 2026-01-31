
export enum Language {
  ENGLISH = 'en',
  ARABIC = 'ar',
  FRENCH = 'fr'
}

export enum Currency {
  USD = 'USD',
  CAD = 'CAD'
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface ProductAttribute {
  key: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  weight: number;
  description: string;
  images: string[];
  attributes: ProductAttribute[];
  reviews: Review[];
  category: string;
}

export interface User {
  email: string;
  isAdmin: boolean;
}

export interface AppSettings {
  language: Language;
  currency: Currency;
  isDarkMode: boolean;
}

export type Dictionary = Record<Language, Record<string, string>>;
