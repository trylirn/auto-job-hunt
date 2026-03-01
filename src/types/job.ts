export interface Job {
  id: string;
  title: string;
  company: string;
  location: string | null;
  job_type: string | null;
  category: string | null;
  description: string | null;
  url: string;
  source: string | null;
  external_id: string | null;
  posted_at: string | null;
  salary: string | null;
  tags: string[] | null;
  company_logo: string | null;
  is_remote: boolean;
  created_at: string;
  updated_at: string;
}
