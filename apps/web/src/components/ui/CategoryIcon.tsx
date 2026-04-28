import {
  BookOpen,
  Briefcase,
  Car,
  Fuel,
  Gift,
  GraduationCap,
  Home,
  Laptop,
  Lightbulb,
  Music,
  PawPrint,
  Pill,
  Plane,
  Shirt,
  ShoppingCart,
  Smartphone,
  Tag,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

const icons: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  briefcase: Briefcase,
  car: Car,
  fuel: Fuel,
  gift: Gift,
  'graduation-cap': GraduationCap,
  home: Home,
  laptop: Laptop,
  lightbulb: Lightbulb,
  music: Music,
  'paw-print': PawPrint,
  pill: Pill,
  plane: Plane,
  shirt: Shirt,
  'shopping-cart': ShoppingCart,
  smartphone: Smartphone,
  tag: Tag,
  utensils: Utensils,
  wallet: Wallet,
}

interface CategoryIconProps {
  icon?: string | null
  size?: number
}

export function CategoryIcon({ icon, size = 17 }: CategoryIconProps) {
  const Icon = icon ? icons[icon] : Tag

  if (Icon) return <Icon size={size} />

  return <span style={{ fontSize: size }}>{icon || '?'}</span>
}
