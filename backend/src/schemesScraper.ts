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

// In-memory caches by language
const cachedSchemesByLang: Record<string, GovernmentScheme[]> = {};

function loadLocalSchemes(lang = "en"): GovernmentScheme[] {
  const normLang = (lang || "en").toLowerCase();
  if (cachedSchemesByLang[normLang]?.length) {
    return cachedSchemesByLang[normLang];
  }

  const fileName = normLang === "ta" ? "schemesData_ta.json" : "schemesData.json";
  const possiblePaths = [
    path.resolve(process.cwd(), `src/${fileName}`),
    path.resolve(process.cwd(), `dist/${fileName}`),
    path.resolve(process.cwd(), `backend/src/${fileName}`),
    path.resolve(process.cwd(), `backend/dist/${fileName}`)
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const loaded = JSON.parse(fs.readFileSync(p, "utf8"));
        if (Array.isArray(loaded) && loaded.length > 0) {
          cachedSchemesByLang[normLang] = loaded;
          return loaded;
        }
      } catch {}
    }
  }

  // Fallback to default English dataset
  if (normLang !== "en") {
    return loadLocalSchemes("en");
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
      const items: any[] = [];
      const seen = new Set<string>();

      links.forEach((a: any) => {
        const titleEl = a.querySelector("h2, h3, h4, p, span");
        const title = titleEl ? titleEl.textContent?.trim() : a.textContent?.trim();
        const href = a.getAttribute("href") || "";

        if (title && title.length > 5 && !seen.has(href)) {
          seen.add(href);
          const fullUrl = href.startsWith("http") ? href : `https://www.myscheme.gov.in${href}`;
          const id = href.replace("/schemes/", "").replace(/\//g, "-") || `scheme-${Date.now()}`;

          let desc = "Government scheme for agricultural support and welfare benefits.";
          const parent = a.closest("div");
          if (parent) {
            const p = parent.querySelector("p");
            if (p && p.textContent && p.textContent.length > 20) {
              desc = p.textContent.trim();
            }
          }

          items.push({
            id,
            title,
            ministry: "Ministry of Agriculture",
            state: "ALL",
            category: "agriculture",
            url: fullUrl,
            applicationUrl: fullUrl,
            description: desc,
            benefits: "Direct government agricultural assistance & subsidies"
          });
        }
      });

      return items;
    });

    console.log(`[SchemesScraper] Scraped ${scraped.length} schemes live via Playwright`);
    return scraped;
  } catch (error: any) {
    console.warn(`[SchemesScraper] Playwright live scraping fallback:`, error.message);
    return [];
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}

/**
 * Get schemes filtering by state, category, search keyword, and language
 */
export async function getGovernmentSchemes(params: {
  state?: string;
  category?: string;
  q?: string;
  lang?: string;
} = {}): Promise<GovernmentScheme[]> {
  const { state, category, q, lang } = params;
  const langKey = (lang || "en").toLowerCase();

  const schemes = loadLocalSchemes(langKey);

  // If search query is provided and not in cache, optionally trigger live scrape
  if (q && q.trim().length > 2) {
    const matched = schemes.filter(s =>
      s.title.toLowerCase().includes(q.toLowerCase()) ||
      s.description.toLowerCase().includes(q.toLowerCase())
    );
    if (matched.length > 0) {
      return matched;
    }

    const live = await scrapeGovernmentSchemes(q.trim());
    if (live.length > 0) {
      return live;
    }
  }

  let results = [...schemes];

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
