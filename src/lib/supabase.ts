import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, key, {
  auth: { persistSession: false }
});

export type Status = 'dreaming' | 'scheduled' | 'boarding' | 'departed';
export type Category =
  | 'neighborhood'
  | 'museum'
  | 'sport'
  | 'fair'
  | 'road'
  | 'seasonal'
  | 'food'
  | 'show'
  | 'just';
export type TimeWindow =
  | 'any'
  | 'spring'
  | 'summer'
  | 'fall'
  | 'winter'
  | 'jan' | 'feb' | 'mar' | 'apr' | 'may' | 'jun'
  | 'jul' | 'aug' | 'sep' | 'oct' | 'nov' | 'dec';

export interface Item {
  id: string;
  title: string;
  category: Category;
  time_window: TimeWindow;
  status: Status;
  notes: string | null;
  added_by: string | null;
  completed_by: string | null;
  completed_at: string | null;
  memory_photo: string | null;
  memory_note: string | null;
  created_at: string;
}

export const CATEGORIES: { code: Category; label: string; short: string }[] = [
  { code: 'neighborhood', label: 'neighborhoods', short: 'NBHD' },
  { code: 'museum',       label: 'museums',       short: 'MUSE' },
  { code: 'sport',        label: 'sports',        short: 'SPRT' },
  { code: 'fair',         label: 'state fairs',   short: 'FAIR' },
  { code: 'road',         label: 'road trips',    short: 'ROAD' },
  { code: 'seasonal',     label: 'seasonal',      short: 'SEAS' },
  { code: 'food',         label: 'food & drink',  short: 'FOOD' },
  { code: 'show',         label: 'shows',         short: 'SHOW' },
  { code: 'just',         label: 'just because',  short: 'JUST' }
];

export const STATUS_LABELS: Record<Status, string> = {
  dreaming:  'dreaming',
  scheduled: 'scheduled',
  boarding:  'boarding',
  departed:  'departed ✓'
};

export const STATUS_ORDER: Status[] = ['boarding', 'scheduled', 'dreaming', 'departed'];

export const TIME_WINDOW_LABELS: Record<TimeWindow, string> = {
  any: 'any time',
  spring: 'spring', summer: 'summer', fall: 'fall', winter: 'winter',
  jan: 'jan only', feb: 'feb only', mar: 'mar only', apr: 'apr only',
  may: 'may only', jun: 'jun only', jul: 'jul only', aug: 'aug only',
  sep: 'sep only', oct: 'oct only', nov: 'nov only', dec: 'dec only'
};
