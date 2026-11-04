// IndexNow: tells Bing (and Yandex, Seznam, Naver…) the moment a URL is added,
// changed or removed. One POST per batch of up to 10,000 URLs.
// Docs: https://www.indexnow.org/documentation
//
// The key file lives at https://eplicant.com/8aac24519bd55434079e97180d8a080d.txt
// (public/8aac24519bd55434079e97180d8a080d.txt in the repo). Don't change one
// without the other.

const HOST = "eplicant.com";
const KEY = "8aac24519bd55434079e97180d8a080d";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_PER_CALL = 10000;

/**
 * Submit URLs to IndexNow. Never throws — a failed ping must never break the
 * function that called it. Returns the HTTP status codes for logging.
 */
export async function submitIndexNow(urls: string[]): Promise<number[]> {
  const list = Array.from(
    new Set(urls.filter((u) => typeof u === "string" && u.startsWith(`https://${HOST}/`)))
  );
  if (!list.length) return [];
  const statuses: number[] = [];
  for (let i = 0; i < list.length; i += MAX_PER_CALL) {
    const urlList = list.slice(i, i + MAX_PER_CALL);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ host: HOST, key: KEY, keyLocation: KEY_LOCATION, urlList }),
      });
      statuses.push(res.status);
      // 200/202 = accepted. 403 = key file not found. 422 = URL not on this host. 429 = too many.
      console.log(`IndexNow: ${urlList.length} URLs → HTTP ${res.status}`);
    } catch (e) {
      console.warn("IndexNow request failed:", e);
      statuses.push(0);
    }
  }
  return statuses;
}

export function jobUrl(job: { id: string; slug?: string | null }): string {
  return `https://${HOST}/job/${job.slug || job.id}`;
}
