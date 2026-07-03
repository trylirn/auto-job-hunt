export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  job_type: string | null;
  category: string | null;
  description: string | null;
  clean_description: string | null;
  apply_url: string | null;
  url: string;
  source: string | null;
  external_id: string | null;
  posted_at: string | null;
  salary: string | null;
  tags: string[] | null;
  company_logo: string | null;
  is_remote: boolean;
  created_at: string;
  listing_type: string | null;
  slug: string | null;
  updated_at: string;
  apply_before: string | null;
  apply_before_date: string | null;
  archived_at: string | null;
  skills: string[] | null;
  employment_type: string | null;
  is_featured: boolean;
  featured_until: string | null;
}

// Explicit column list for public reads. Sensitive fields (submitter_email,
// payment_id, payment_status) are intentionally excluded — the DB revokes
// SELECT on those columns from anon/authenticated, so `select("*")` would fail.
export const PUBLIC_JOB_COLUMNS =
  "id,title,company,location,job_type,category,description,clean_description,apply_url,url,source,external_id,posted_at,salary,tags,company_logo,is_remote,created_at,listing_type,slug,updated_at,apply_before,apply_before_date,archived_at,skills,employment_type,is_featured,featured_until";
