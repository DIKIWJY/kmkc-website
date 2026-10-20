export interface Member {
  id: string;
  name: string;
  position: string;
  division: string;
  photo_url: string;
  period: string;
  order_index: number;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  event_date: string | null;
  category: "Acara" | "Kegiatan";
  featured?: boolean;
  visible?: boolean;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  author: string;
  category: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  icon: string;
  division: string;
  period: string;
  status: "upcoming" | "ongoing" | "completed";
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string;
  location: string;
  event_date: string; // YYYY-MM-DD
  event_time: string; // teks bebas, mis. "09.00 WIB"
  cover_image: string;
  link: string;
  created_at: string;
}

export interface StatItem {
  value: string;
  label: string;
}

export interface Founder {
  name: string;
  campus: string;
  role?: string;
}

export interface TimelineItem {
  date: string;
  title: string;
  desc: string;
}

export interface SiteSettings {
  name: string;
  full_name: string;
  tagline: string;
  about: string;
  vision: string;
  mission: string[];
  stats: StatItem[];
  email: string;
  phone: string;
  address: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  whatsapp: string;
  about_photo: string;
  history: string;
  founders: Founder[];
  timeline: TimelineItem[];
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditEntry {
  id: number;
  user_email: string;
  action: string;
  entity: string;
  label: string;
  created_at: string;
}
