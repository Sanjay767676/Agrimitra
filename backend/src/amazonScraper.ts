import { chromium } from "playwright";
import fs from "fs";
import path from "path";

export interface AmazonProduct {
  name: string;
  imageUrl: string;
  price: string;
  rating: string;
  url: string;
  category: string;
  keyword?: string;
}

// In-memory cache for live scraped results
const scrapeCache = new Map<string, { timestamp: number; data: AmazonProduct[] }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

// Load initial pre-seeded data
let preseededData: Record<string, AmazonProduct[]> = {};
try {
  const jsonPath = path.resolve(process.cwd(), "src/amazonData.json");
  if (fs.existsSync(jsonPath)) {
    preseededData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  }
} catch (e) {
  console.warn("Could not load preseeded amazonData.json:", e);
}

/**
 * Scrape products from Amazon India using Playwright
 */
export async function scrapeAmazonProducts(
  category = "equipment",
  query = ""
): Promise<AmazonProduct[]> {
  const normalizedKey = (query || category).toLowerCase().trim().replace(/\s+/g, "_");

  // 1. Check in-memory cache
  const cached = scrapeCache.get(normalizedKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // 2. Check preseeded dataset
  if (preseededData[normalizedKey] && preseededData[normalizedKey].length > 0) {
    scrapeCache.set(normalizedKey, { timestamp: Date.now(), data: preseededData[normalizedKey] });
    return preseededData[normalizedKey];
  }

  // Also check direct category match
  if (preseededData[category.toLowerCase()] && (!query || query === category)) {
    return preseededData[category.toLowerCase()];
  }

  // 3. Live scrape via Playwright
  console.log(`[AmazonScraper] Live scraping Amazon with Playwright for: ${query || category}...`);
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    const searchTerm = query ? `agriculture ${query}` : `agriculture ${category} farming`;
    const searchUrl = `https://www.amazon.in/s?k=${encodeURIComponent(searchTerm)}`;

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeout: 20000
    });

    const products = await page.evaluate(
      ({ cat, q }: { cat: string; q: string }) => {
        const doc = (globalThis as any).document;
        const list: AmazonProduct[] = [];
        const elements = doc.querySelectorAll('div[data-component-type="s-search-result"]');
        elements.forEach((el: any) => {
          if (list.length >= 8) return;
          const titleEl = el.querySelector("h2 a span") || el.querySelector("h2 span");
          const title = titleEl ? (titleEl.textContent || "").trim() : "";
          const imgEl = el.querySelector("img.s-image");
          const imageUrl = imgEl ? (imgEl.getAttribute("src") || "") : "";
          const linkEl = el.querySelector("h2 a") || el.querySelector("a.a-link-normal.s-no-outline") || el.querySelector("a.a-link-normal");
          const href = linkEl ? (linkEl.getAttribute("href") || "") : "";
          const priceEl = el.querySelector(".a-price .a-offscreen");
          const price = priceEl ? (priceEl.textContent || "").trim() : "";
          const ratingEl = el.querySelector(".a-icon-alt");
          const rating = ratingEl ? (ratingEl.textContent || "").trim() : "";

          if (title && (imageUrl || href)) {
            list.push({
              name: title,
              imageUrl,
              price: price || "Check on Amazon",
              rating: rating ? rating.replace(" out of 5 stars", " ★") : "",
              url: href ? (href.startsWith("http") ? href : "https://www.amazon.in" + href) : `https://www.amazon.in/s?k=${encodeURIComponent(title)}`,
              category: cat,
              keyword: q || undefined
            });
          }
        });
        return list;
      },
      { cat: category, q: query }
    );

    await browser.close();

    if (products.length > 0) {
      scrapeCache.set(normalizedKey, { timestamp: Date.now(), data: products });
      return products;
    }
  } catch (err: any) {
    console.warn(`[AmazonScraper] Playwright live scraping encountered an issue (${err.message}). Using fallback.`);
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }

  // 4. Fallback to category items or default items
  const fallbackList = preseededData[category.toLowerCase()] || preseededData["equipment"] || [];
  return fallbackList;
}
