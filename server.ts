import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

function getFromCache(key: string) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setToCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now() });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Robust Search Proxy
  app.get("/api/search", async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: "Query is required" });

    const cacheKey = `search:${query}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) return res.json(cachedData);

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "RAPIDAPI_KEY is not configured" });
    }

    // List of API providers to try
    const providers = [
      {
        name: "Brand-Based Fallback (Internal)",
        host: "internal",
        getUrl: (q: string) => `internal`,
        transform: async (q: string) => {
          try {
            // First try to get brands
            const brandsRes = await fetch("https://phone-specs-api.vercel.app/brands");
            if (!brandsRes.ok) return null;
            const brandsData: any = await brandsRes.json();
            if (!brandsData.status || !Array.isArray(brandsData.data)) return null;

            const query = q.toLowerCase();
            // Try to find a matching brand
            const matchedBrand = brandsData.data.find((b: any) => 
              b.brand_name.toLowerCase() === query || 
              query.includes(b.brand_name.toLowerCase())
            );

            if (matchedBrand) {
              console.log(`[Search Fallback] Brand match found: ${matchedBrand.brand_name}`);
              const modelsRes = await fetch(`https://phone-specs-api.vercel.app/brands/${matchedBrand.brand_slug}`);
              if (modelsRes.ok) {
                const modelsData: any = await modelsRes.json();
                if (modelsData.status && modelsData.data && Array.isArray(modelsData.data.phones)) {
                  return modelsData.data.phones.map((p: any) => ({
                    phone_custom_id: p.slug,
                    brand: matchedBrand.brand_name,
                    device_name: p.phone_name,
                    image: p.image
                  }));
                }
              }
            }

            // If no direct brand match, try to search in some popular brands or just return latest as fallback
            // For now, let's just return null and let other providers try, 
            // but this internal one is quite fast if it works.
          } catch (e) {
            console.error("[Search Fallback] Error:", e);
          }
          return null;
        }
      },
      {
        name: "PhoneSpecsAPI (Direct)",
        host: "phone-specs-api.vercel.app",
        getUrl: (q: string) => `https://phone-specs-api.vercel.app/search?q=${encodeURIComponent(q)}`,
        transform: (data: any) => {
          if (data && data.status && data.data && Array.isArray(data.data.phones)) {
            return data.data.phones.map((p: any) => ({
              phone_custom_id: p.slug,
              brand: p.brand,
              device_name: p.phone_name,
              image: p.image
            }));
          }
          return null;
        }
      },
      {
        name: "PhoneLabo",
        host: "phonelabo.p.rapidapi.com",
        getUrl: (q: string) => `https://phonelabo.p.rapidapi.com/matchdevices?matchString=${encodeURIComponent(q)}&limit=15`,
        transform: (data: any) => {
          if (Array.isArray(data)) {
            return data.map((d: any) => ({
              phone_custom_id: d.id || d.device_id || d.name,
              brand: d.brand || d.brand_name,
              device_name: d.name || d.device_name || d.title,
              image: d.image || d.thumbnail
            }));
          }
          const list = data?.data || data?.results || data?.devices;
          if (Array.isArray(list)) {
            return list.map((d: any) => ({
              phone_custom_id: d.id || d.device_id || d.name,
              brand: d.brand || d.brand_name,
              device_name: d.name || d.device_name || d.title,
              image: d.image || d.thumbnail
            }));
          }
          return null;
        }
      }
    ];

    let lastError = "";

    for (const provider of providers) {
      try {
        console.log(`[Search Proxy] Trying ${provider.name}...`);
        
        let results = null;

        if (provider.host === "internal") {
          // Internal fallback doesn't use a standard URL/Fetch loop
          results = await (provider.transform as any)(query as string);
        } else {
          const isRapidAPI = provider.host.includes(".rapidapi.com");
          const headers: any = { "Content-Type": "application/json" };
          if (isRapidAPI && apiKey) {
            headers["x-rapidapi-key"] = apiKey;
            headers["x-rapidapi-host"] = provider.host;
          }

          const response = await fetch(provider.getUrl(query as string), { headers });

          if (response.status === 429) {
            console.warn(`[Search Proxy] ${provider.name} rate limited (429). skipping...`);
            lastError = "Rate limit exceeded on primary source.";
            continue;
          }

          if (response.status === 502 || response.status === 503 || response.status === 504) {
            console.warn(`[Search Proxy] ${provider.name} unavailable (${response.status}). skipping...`);
            lastError = "Provider temporarily unavailable.";
            continue;
          }

          if (!response.ok) {
            console.warn(`[Search Proxy] ${provider.name} error (${response.status}). skipping...`);
            continue;
          }

          const rawData = await response.json();
          results = (provider.transform as any)(rawData);
        }
        
        if (results && results.length > 0) {
          console.log(`[Search Proxy] Success with ${provider.name}. Found ${results.length} results.`);
          setToCache(cacheKey, results);
          return res.json(results);
        } else {
          console.warn(`[Search Proxy] ${provider.name} returned NO results.`);
        }
      } catch (err: any) {
        console.error(`[Search Proxy] Error with ${provider.name}:`, err.message);
        lastError = err.message;
      }
    }

    // If we get here, all providers failed
    res.status(500).json({ error: lastError || "All API providers failed or returned no results." });
  });

  // Device Details Proxy
  app.get("/api/device", async (req, res) => {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: "Device ID is required" });

    const cacheKey = `device:${id}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) return res.json(cachedData);

    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "RAPIDAPI_KEY is not configured" });
    }

    const detailProviders = [
      {
        name: "PhoneSpecsAPI (Direct)",
        host: "phone-specs-api.vercel.app",
        getUrl: (deviceId: string) => `https://phone-specs-api.vercel.app/${deviceId}`,
        transform: (data: any) => {
          if (data && data.status && data.data) {
            return data.data;
          }
          return null;
        }
      },
      {
        name: "PhoneLabo",
        host: "phonelabo.p.rapidapi.com",
        getUrl: (deviceId: string) => `https://phonelabo.p.rapidapi.com/getdevice?device=${encodeURIComponent(deviceId)}`,
        transform: (data: any) => data
      },
      {
        name: "Legacy Specs Database",
        host: "mobile-phone-specs-database.p.rapidapi.com",
        getUrl: (deviceId: string) => `https://mobile-phone-specs-database.p.rapidapi.com/gsm/get-specifications-by-phone-custom-id/${deviceId}`,
        transform: (data: any) => data
      }
    ];

    let lastError = "";

    for (const provider of detailProviders) {
      try {
        console.log(`[Device Proxy] Trying ${provider.name} for ID: ${id}...`);
        
        const isRapidAPI = provider.host.includes(".rapidapi.com");
        const headers: any = { "Content-Type": "application/json" };
        if (isRapidAPI && apiKey) {
          headers["x-rapidapi-key"] = apiKey;
          headers["x-rapidapi-host"] = provider.host;
        }

        const response = await fetch(provider.getUrl(id as string), { headers });

        if (response.status === 429) {
          console.warn(`[Device Proxy] ${provider.name} rate limited (429). skipping...`);
          lastError = "Rate limit exceeded on provider.";
          continue;
        }

        if (response.status === 502 || response.status === 503 || response.status === 504) {
          console.warn(`[Device Proxy] ${provider.name} unavailable (${response.status}). skipping...`);
          lastError = "Provider temporarily unavailable.";
          continue;
        }

        if (!response.ok) {
          console.warn(`[Device Proxy] ${provider.name} error (${response.status}). skipping...`);
          continue;
        }

        const rawData = await response.json();
        const data = provider.transform(rawData);
        
        if (data) {
          console.log(`[Device Proxy] Success with ${provider.name}`);
          setToCache(cacheKey, data);
          return res.json(data);
        }
      } catch (err: any) {
        console.error(`[Device Proxy] Error with ${provider.name}:`, err.message);
        lastError = err.message;
      }
    }

    res.status(500).json({ error: lastError || "Failed to fetch device details from any provider." });
  });

  // Latest Devices Proxy
  app.get("/api/latest", async (req, res) => {
    const cacheKey = "latest_devices";
    const cachedData = getFromCache(cacheKey);
    if (cachedData) return res.json(cachedData);

    const apiKey = process.env.RAPIDAPI_KEY;
    
    // Providers for latest phones
    const latestProviders = [
      {
        name: "PhoneSpecsAPI (Direct)",
        host: "phone-specs-api.vercel.app",
        getUrl: () => `https://phone-specs-api.vercel.app/latest`,
        transform: (data: any) => {
          if (data && data.status && data.data && Array.isArray(data.data.phones)) {
            return data.data.phones.map((p: any) => ({
              phone_custom_id: p.slug,
              brand: p.phone_name.split(' ')[0],
              device_name: p.phone_name,
              image: p.image
            }));
          }
          return null;
        }
      },
      {
        name: "Mock Fallback (Offline)",
        host: "internal",
        getUrl: () => "internal",
        transform: () => {
          // If public APIs are down, return some safe fallback
          return [
            { phone_custom_id: "samsung_galaxy_s24_ultra-12771", brand: "Samsung", device_name: "Galaxy S24 Ultra", image: "https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra.jpg" },
            { phone_custom_id: "apple_iphone_15_pro_max-12548", brand: "Apple", device_name: "iPhone 15 Pro Max", image: "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone-15-pro-max.jpg" },
            { phone_custom_id: "google_pixel_8_pro-12546", brand: "Google", device_name: "Pixel 8 Pro", image: "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-8-pro.jpg" }
          ];
        }
      }
    ];

    for (const provider of latestProviders) {
      try {
        console.log(`[Latest Proxy] Trying ${provider.name}...`);
        
        if (provider.host === "internal") {
          const results = provider.transform(null);
          return res.json(results);
        }

        const response = await fetch(provider.getUrl(), {
          headers: apiKey ? {
            "x-rapidapi-key": apiKey,
            "x-rapidapi-host": provider.host
          } : {}
        });

        if (response.ok) {
          const rawData = await response.json();
          const results = (provider.transform as any)(rawData);
          if (results && results.length > 0) {
            console.log(`[Latest Proxy] Success with ${provider.name}. Found ${results.length} phones.`);
            setToCache(cacheKey, results);
            return res.json(results);
          }
        } else {
           console.warn(`[Latest Proxy] ${provider.name} failed with status: ${response.status}`);
        }
      } catch (err: any) {
        console.error(`[Latest Proxy] Error with ${provider.name}:`, err.message);
      }
    }

    res.status(500).json({ error: "Failed to fetch latest devices" });
  });

  // Brands Proxy
  app.get("/api/brands", async (req, res) => {
    const cacheKey = "all_brands";
    const cachedData = getFromCache(cacheKey);
    if (cachedData) return res.json(cachedData);

    const apiKey = process.env.RAPIDAPI_KEY;
    const host = "phone-specs-api.vercel.app";

    try {
      const response = await fetch(`https://${host}/brands`);
      if (response.ok) {
        const rawData: any = await response.json();
        if (rawData && rawData.status && Array.isArray(rawData.data)) {
          setToCache(cacheKey, rawData.data);
          return res.json(rawData.data);
        }
      }
    } catch (err: any) {
      console.error(`[Brands Proxy] Error:`, err.message);
    }
    res.status(500).json({ error: "Failed to fetch brands" });
  });

  // Brand Models Proxy
  app.get("/api/brand/:slug", async (req, res) => {
    const { slug } = req.params;
    const cacheKey = `brand_models:${slug}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) return res.json(cachedData);

    const host = "phone-specs-api.vercel.app";

    try {
      const response = await fetch(`https://${host}/brands/${slug}`);
      if (response.ok) {
        const rawData: any = await response.json();
        if (rawData && rawData.status && rawData.data && Array.isArray(rawData.data.phones)) {
          const results = rawData.data.phones.map((p: any) => ({
            phone_custom_id: p.slug,
            brand: rawData.data.title.split(' ')[0],
            device_name: p.phone_name,
            image: p.image
          }));
          setToCache(cacheKey, results);
          return res.json(results);
        }
      }
    } catch (err: any) {
      console.error(`[Brand Models Proxy] Error:`, err.message);
    }
    res.status(500).json({ error: "Failed to fetch brand models" });
  });

  // Flipkart Price Scraper Proxy
  app.get("/api/flipkart-price", async (req, res) => {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Query is required" });

    const cacheKey = `flipkart:${q}`;
    const cachedData = getFromCache(cacheKey);
    if (cachedData) return res.json(cachedData);

    try {
      // Flipkart search URL
      const searchUrl = `https://www.flipkart.com/search?q=${encodeURIComponent(q as string + " mobile")}`;
      
      const response = await fetch(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
          "Accept-Language": "en-US,en;q=0.9",
        }
      });

      const html = await response.text();

      // Simple regex extraction for price and product link
      // Flipkart price often looks like: ₹54,999 in various classes
      // Common class for price in search results is .Nx9Wp0 or ._30jeq3
      const priceMatch = html.match(/₹(\d{1,3}(?:,\d{3})*)/);
      const price = priceMatch ? priceMatch[1] : null;

      // Extract title to verify match
      const titleMatch = html.match(/<div class="KzDlHZ">([^<]+)<\/div>/); 
      const title = titleMatch ? titleMatch[1] : null;

      // Extract primary product link
      const linkMatch = html.match(/href="([^"]+\/p\/[^"]+)"/);
      const link = linkMatch ? `https://www.flipkart.com${linkMatch[1].split('?')[0]}` : searchUrl;

      const result = {
        query: q,
        price: price ? `₹${price}` : "N/A",
        title: title || "Flipkart Result",
        link: link,
        source: "Flipkart"
      };

      setToCache(cacheKey, result);
      res.json(result);
    } catch (error) {
      console.error(`[Flipkart Scraper] Error:`, error);
      res.status(500).json({ error: "Failed to fetch Flipkart data" });
    }
  });

  // Proxy route for RapidAPI (Old one, kept for compatibility if needed)
  app.get("/api/phone-specs/:id", async (req, res) => {
    const { id } = req.params;
    const apiKey = process.env.RAPIDAPI_KEY;
    const apiHost = process.env.RAPIDAPI_HOST || "mobile-phone-specs-database.p.rapidapi.com";

    if (!apiKey) {
      return res.status(500).json({ error: "RAPIDAPI_KEY is not configured" });
    }

    try {
      const response = await fetch(`https://${apiHost}/gsm/get-specifications-by-phone-custom-id/${id}`, {
        method: "GET",
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host": apiHost
        }
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Error fetching phone specs:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
