export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  is_admin: boolean;
  is_featured: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  total_pages: number | null;
  current_page: number;
  created_at: string;
}

export interface ReadingLog {
  id: string;
  user_id: string;
  book_id: string;
  pages_read: number;
  logged_at: string;
  created_at: string;
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface Reflection {
  id: string;
  user_id: string;
  title: string | null;
  book_id: string | null;
  page_number: number | null;
  audio_path: string;
  duration_seconds: number | null;
  tags: string[];
  notes: string | null;
  is_public: boolean;
  created_at: string;
  books?: Book;
}

export interface Quote {
  id: string;
  user_id: string;
  book_id: string | null;
  page_number: number | null;
  quote_text: string;
  notes: string | null;
  tags: string[];
  is_public: boolean;
  created_at: string;
  books?: Book;
}

export type FeedReflection = Reflection & { profiles: Pick<Profile, "id" | "display_name" | "is_verified"> };
export type FeedQuote = Quote & { profiles: Pick<Profile, "id" | "display_name" | "is_verified"> };

