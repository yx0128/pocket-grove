import {
  Armchair,
  Droplets,
  Flame,
  Flower2,
  Home,
  Route,
  Sprout,
  TreePine,
  Waves,
  Wind,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  sprout: Sprout,
  route: Route,
  waves: Waves,
  'tree-pine': TreePine,
  'flower-2': Flower2,
  armchair: Armchair,
  home: Home,
  wind: Wind,
  flame: Flame,
  droplets: Droplets,
};

export function ItemIcon({
  icon,
  className,
}: {
  icon: string;
  className?: string;
}) {
  const Icon = ICONS[icon] ?? Sprout;
  return <Icon className={className} aria-hidden="true" />;
}
