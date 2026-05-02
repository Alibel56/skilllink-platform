import {
  Wrench, Zap, Sparkles, Fan, Hammer, Paintbrush,
  Car, Scissors, Trees, Truck, Camera, GraduationCap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const CATEGORIES: Category[] = [
  { id: 'plumbing', label: 'Plumbing', icon: Wrench, description: 'Leak repairs, pipe installation' },
  { id: 'electrician', label: 'Electrician', icon: Zap, description: 'Wiring, lighting, panels' },
  { id: 'cleaning', label: 'Cleaning', icon: Sparkles, description: 'Deep & regular home cleaning' },
  { id: 'ac', label: 'AC Repair', icon: Fan, description: 'Climate & cooling systems' },
  { id: 'carpentry', label: 'Carpentry', icon: Hammer, description: 'Custom wood & furniture' },
  { id: 'painting', label: 'Painting', icon: Paintbrush, description: 'Interior & exterior finishes' },
  { id: 'auto', label: 'Auto Repair', icon: Car, description: 'Cars, mechanics, tires' },
  { id: 'beauty', label: 'Beauty', icon: Scissors, description: 'Hair, nails, makeup' },
  { id: 'gardening', label: 'Gardening', icon: Trees, description: 'Lawn & landscape' },
  { id: 'moving', label: 'Moving', icon: Truck, description: 'Local moves, packing' },
  { id: 'photo', label: 'Photography', icon: Camera, description: 'Events & portraits' },
  { id: 'tutoring', label: 'Tutoring', icon: GraduationCap, description: 'Languages, math, prep' },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));

export function categoryLabel(id: string): string {
  return CATEGORY_BY_ID[id]?.label ?? id;
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  open: 'Open',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const REQUEST_STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
};
