export type FileRef = string | { id: string; filename_download?: string; title?: string } | null;
export type Link = { label?: string; url?: string };
export type RepeaterItem = Record<string, unknown>;

export interface CmsBlock {
  id: string | number;
  title?: string;
  collection: string;
  [key: string]: unknown;
}

export interface Seo {
  meta_title?: string;
  meta_description?: string;
  og_image?: FileRef;
  no_index?: boolean;
}

export interface CmsPage {
  id: string | number;
  title: string;
  slug: string;
  status: 'draft' | 'published' | 'archived';
  seo_id?: Seo | number | null;
  sections: CmsBlock[];
}

export interface Globals {
  site_name?: string;
  logo?: FileRef;
  favicon?: FileRef;
  phone?: string;
  email?: string;
  address?: string;
  working_hours?: string;
  social_links?: RepeaterItem[];
  google_analytics_id?: string;
  meta_pixel_id?: string;
}

export interface NavigationItem {
  id: string | number;
  label: string;
  url?: string;
  page?: { slug?: string } | number | null;
  open_new_tab?: boolean;
  parent?: string | number | null;
  children?: NavigationItem[];
}
