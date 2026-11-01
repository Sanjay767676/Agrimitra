import { chromium } from "playwright";
import fs from "fs";
import path from "path";

export interface GovernmentScheme {
  id: string;
  title: string;
  ministry?: string;
  state: string;
  category: string;
  url: string;
  applicationUrl: string;
  description: string;
  benefits?: string;
}

// In-memory cache
let cachedSchemes: GovernmentScheme[] = [];
let lastFetchedTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

function loadLocalSchemes(): GovernmentScheme[] {
  const possiblePaths = [
    path.resolve(process.cwd(), "src/schemesData.json"),
    path.resolve(process.cwd(), "dist/schemesData.json"),
    path.resolve(process.cwd(), "backend/src/schemesData.json"),
    path.resolve(process.cwd(), "backend/dist/schemesData.json")
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        return JSON.parse(fs.readFileSync(p, "utf8"));
      } catch {}
    }
  }
  return [];
}

/**
 * Scrape government schemes live using Playwright from myscheme.gov.in
 */
export async function scrapeGovernmentSchemes(query?: string): Promise<GovernmentScheme[]> {
  console.log(`[SchemesScraper] Live scraping myscheme.gov.in with Playwright for query: ${query || "agriculture"}...`);
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const targetUrl = query
      ? `https://www.myscheme.gov.in/search?q=${encodeURIComponent(query)}`
      : "https://www.myscheme.gov.in/search/category/Agriculture,Rural%20&%20Environment";

    await page.goto(targetUrl, {
      waitUntil: "networkidle",
      timeout: 20000
    });

    const scraped = await page.evaluate(() => {
      const doc = (globalThis as any).document;
      const links = doc.querySelectorAll('a[href*="/schemes/"]');
      const results: GovernmentScheme[] = [];
      links.forEach((a: any) => {
        if (results.length >= 15) return;
        const container = a.closest("div.cursor-pointer") || a.parentElement?.parentElement || a;
        const lines = (container.innerText || "").split("\n").map((l: string) => l.trim()).filter(Boolean);
        const title = lines[0] || "";
        const ministryOrState = lines[1] || "Ministry of Agriculture";
        const desc = lines.slice(2).join(" ") || "Government welfare scheme for farmers and rural development.";
        const href = a.getAttribute("href") || "";

        if (title && title.length > 5 && href) {
          const id = href.replace("/schemes/", "").toLowerCase().replace(/[^a-z0-9]/g, "-");
          results.push({
            id,
            title,
            ministry: ministryOrState,
            state: ministryOrState.length < 25 && !ministryOrState.toLowerCase().includes("ministry") ? ministryOrState : "ALL",
            category: "agriculture",
            url: href.startsWith("http") ? href : `https://www.myscheme.gov.in${href}`,
            applicationUrl: href.startsWith("http") ? href : `https://www.myscheme.gov.in${href}`,
            description: desc
          });
        }
      });
      return results;
    });

    await browser.close();
    return scraped;
  } catch (err: any) {
    console.warn(`[SchemesScraper] Playwright live scraping error (${err.message}). Using cached schemes.`);
    if (browser) {
      try { await browser.close(); } catch {}
    }
    return [];
  }
}

/**
 * Get schemes filtering by state, category, or search keyword
 */
export async function getGovernmentSchemes(params: {
  state?: string;
  category?: string;
  q?: string;
} = {}): Promise<GovernmentScheme[]> {
  const { state, category, q } = params;

  if (cachedSchemes.length === 0 || Date.now() - lastFetchedTime > CACHE_TTL_MS) {
    cachedSchemes = loadLocalSchemes();
    lastFetchedTime = Date.now();
  }

  // If search query is provided and not in cache, optionally trigger live scrape
  if (q && q.trim().length > 2) {
    const matched = cachedSchemes.filter(s =>
      s.title.toLowerCase().includes(q.toLowerCase()) ||
      s.description.toLowerCase().includes(q.toLowerCase())
    );
    if (matched.length > 0) {
      return matched;
    }

    const live = await scrapeGovernmentSchemes(q.trim());
    if (live.length > 0) {
      // Merge into cache
      live.forEach(item => {
        if (!cachedSchemes.some(c => c.id === item.id)) {
          cachedSchemes.push(item);
        }
      });
      return live;
    }
  }

  let results = [...cachedSchemes];

  if (state && state.toUpperCase() !== "ALL") {
    const sLower = state.toLowerCase();
    results = results.filter(
      s => s.state === "ALL" || s.state.toLowerCase() === sLower || (s.ministry && s.ministry.toLowerCase().includes(sLower))
    );
  }

  if (category) {
    const catLower = category.toLowerCase();
    results = results.filter(
      s => s.category.toLowerCase() === catLower || s.description.toLowerCase().includes(catLower)
    );
  }

  if (q) {
    const query = q.toLowerCase();
    results = results.filter(
      s => s.title.toLowerCase().includes(query) || s.description.toLowerCase().includes(query)
    );
  }

  return results;
}

