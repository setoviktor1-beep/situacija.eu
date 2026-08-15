// Sugeneruota automatiškai iš Directus schemos. Neredaguokite rankomis.

export interface BlockContactForm {
  "id"?: number | null;
  "title"?: string | null;
  "headline"?: string | null;
  "fields"?: unknown | null;
  "recipient_email"?: string | null;
  "success_message"?: string | null;
}

export interface BlockCta {
  "id"?: number | null;
  "title"?: string | null;
  "headline"?: string | null;
  "text"?: string | null;
  "button_label"?: string | null;
  "button_url"?: string | null;
  "background_style"?: string | null;
}

export interface BlockFaq {
  "id"?: number | null;
  "badge"?: string | null;
  "title"?: string | null;
  "intro"?: string | null;
  "headline"?: string | null;
  "items"?: unknown[] | null;
}

export interface BlockFeatures {
  "id"?: number | null;
  "title"?: string | null;
  "headline"?: string | null;
  "subheadline"?: string | null;
  "columns"?: number | null;
  "items"?: unknown | null;
}

export interface BlockGallery {
  "id"?: number | null;
  "badge"?: string | null;
  "title"?: string | null;
  "intro"?: string | null;
  "limit"?: number | null;
  "button_label"?: string | null;
  "button_url"?: string | null;
  "headline"?: string | null;
  "layout"?: string | null;
  "columns"?: number | null;
  "images"?: unknown[] | null;
}

export interface BlockGalleryFiles {
  "id"?: number | null;
  "block_gallery_id"?: string | number | Record<string, unknown> | null;
  "directus_files_id"?: string | number | Record<string, unknown> | null;
  "sort"?: number | null;
}

export interface BlockHero {
  "id"?: number | null;
  "badge"?: string | null;
  "title"?: string | null;
  "subtitle"?: string | null;
  "primary_label"?: string | null;
  "primary_url"?: string | null;
  "secondary_label"?: string | null;
  "secondary_url"?: string | null;
  "background_image"?: string | number | Record<string, unknown> | null;
  "headline"?: string | null;
  "subheadline"?: string | null;
  "cta_primary_label"?: string | null;
  "cta_primary_url"?: string | null;
  "cta_secondary_label"?: string | null;
  "cta_secondary_url"?: string | null;
  "background_video"?: string | number | Record<string, unknown> | null;
  "overlay_opacity"?: number | null;
  "height"?: string | null;
}

export interface BlockMap {
  "id"?: number | null;
  "title"?: string | null;
  "address"?: string | null;
  "lat"?: number | null;
  "lng"?: number | null;
  "zoom"?: number | null;
}

export interface BlockPricing {
  "id"?: number | null;
  "title"?: string | null;
  "headline"?: string | null;
  "plans"?: unknown | null;
}

export interface BlockRichtext {
  "id"?: number | null;
  "title"?: string | null;
  "content"?: string | null;
  "max_width"?: string | null;
  "align"?: string | null;
}

export interface BlockSpacer {
  "id"?: number | null;
  "title"?: string | null;
  "height"?: string | null;
}

export interface BlockTestimonials {
  "id"?: number | null;
  "title"?: string | null;
  "headline"?: string | null;
  "items"?: unknown | null;
}

export interface BlockTextImage {
  "id"?: number | null;
  "title"?: string | null;
  "headline"?: string | null;
  "content"?: string | null;
  "image"?: string | number | Record<string, unknown> | null;
  "image_position"?: string | null;
  "cta_label"?: string | null;
  "cta_url"?: string | null;
}

export interface FaqItems {
  "id"?: number | null;
  "block_faq_id"?: string | number | Record<string, unknown> | null;
  "sort"?: number | null;
  "question"?: string | null;
  "answer"?: string | null;
}

export interface FormsSubmissions {
  "id"?: number | null;
  "status"?: string | null;
  "name"?: string | null;
  "email"?: string | null;
  "phone"?: string | null;
  "message"?: string | null;
  "page"?: string | null;
  "date_created"?: string | null;
}

export interface Gallery {
  "id"?: number | null;
  "status"?: string | null;
  "sort"?: number | null;
  "image"?: string | number | Record<string, unknown> | null;
  "category"?: string | null;
  "title"?: string | null;
  "description"?: string | null;
  "source_filename"?: string | null;
  "date_created"?: string | null;
}

export interface Globals {
  "id"?: number | null;
  "site_name"?: string | null;
  "logo"?: string | number | Record<string, unknown> | null;
  "favicon"?: string | number | Record<string, unknown> | null;
  "phone"?: string | null;
  "email"?: string | null;
  "address"?: string | null;
  "working_hours"?: string | null;
  "social_links"?: unknown | null;
  "google_analytics_id"?: string | null;
  "meta_pixel_id"?: string | null;
}

export interface Navigation {
  "id"?: number | null;
  "title"?: string | null;
  "items"?: unknown[] | null;
}

export interface NavigationItems {
  "id"?: number | null;
  "navigation_id"?: string | number | Record<string, unknown> | null;
  "parent_id"?: string | number | Record<string, unknown> | null;
  "sort"?: number | null;
  "label"?: string | null;
  "url"?: string | null;
  "page_id"?: string | number | Record<string, unknown> | null;
  "open_new_tab"?: boolean | null;
}

export interface PageSections {
  "id"?: number | null;
  "pages_id"?: string | number | Record<string, unknown> | null;
  "collection"?: string | null;
  "item"?: string | null;
  "sort"?: number | null;
}

export interface Pages {
  "id"?: number | null;
  "status"?: string | null;
  "title"?: string | null;
  "slug"?: string | null;
  "seo"?: unknown | null;
  "sort"?: number | null;
  "seo_id"?: string | number | Record<string, unknown> | null;
  "user_created"?: string | null;
  "date_created"?: string | null;
  "user_updated"?: string | null;
  "date_updated"?: string | null;
  "blocks"?: unknown[] | null;
  "sections"?: unknown[] | null;
}

export interface Seo {
  "id"?: number | null;
  "meta_title"?: string | null;
  "meta_description"?: string | null;
  "og_image"?: string | number | Record<string, unknown> | null;
  "no_index"?: boolean | null;
}

export interface Services {
  "id"?: number | null;
  "status"?: string | null;
  "sort"?: number | null;
  "title"?: string | null;
  "description"?: string | null;
  "image"?: string | number | Record<string, unknown> | null;
  "link_label"?: string | null;
  "link_url"?: string | null;
}

export interface DirectusSchema {
  "block_contact_form": BlockContactForm[];
  "block_cta": BlockCta[];
  "block_faq": BlockFaq[];
  "block_features": BlockFeatures[];
  "block_gallery": BlockGallery[];
  "block_gallery_files": BlockGalleryFiles[];
  "block_hero": BlockHero[];
  "block_map": BlockMap[];
  "block_pricing": BlockPricing[];
  "block_richtext": BlockRichtext[];
  "block_spacer": BlockSpacer[];
  "block_testimonials": BlockTestimonials[];
  "block_text_image": BlockTextImage[];
  "faq_items": FaqItems[];
  "forms_submissions": FormsSubmissions[];
  "gallery": Gallery[];
  "globals": Globals[];
  "navigation": Navigation[];
  "navigation_items": NavigationItems[];
  "page_sections": PageSections[];
  "pages": Pages[];
  "seo": Seo[];
  "services": Services[];
}
