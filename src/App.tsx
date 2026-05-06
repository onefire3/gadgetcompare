/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  Filter, 
  ArrowRightLeft, 
  X, 
  ExternalLink, 
  Smartphone as PhoneIcon, 
  Cpu, 
  MemoryStick, 
  Battery, 
  Camera, 
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  Heart,
  Star,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SMARTPHONES, Smartphone } from "./data";

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [liveSearchResults, setLiveSearchResults] = useState<any[]>([]);
  const [latestDevices, setLatestDevices] = useState<Smartphone[]>([]);
  const [brandList, setBrandList] = useState<any[]>([]);
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);
  const [isLoadingGrid, setIsLoadingGrid] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [comparisonList, setComparisonList] = useState<Smartphone[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "flagship" | "mid-range" | "budget">("all");
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Initial data fetch
    const fetchLatest = async () => {
      try {
        setIsLoadingLatest(true);
        const res = await fetch("/api/latest");
        if (!res.ok) throw new Error("Failed to fetch latest");
        const data = await res.json();
        
        // Map simple latest results to Smartphone structure (with minimal specs)
        const mapped: Smartphone[] = data.map((d: any) => ({
          id: d.phone_custom_id,
          name: d.device_name,
          brand: d.brand,
          price: 0, // Will be fetched or shown as TBD
          currency: "USD",
          releaseDate: "Latest",
          image: d.image,
          affiliateUrl: "#",
          specs: {
            display: "Click for details",
            processor: "Loading...",
            ram: "N/A",
            storage: "N/A",
            battery: "N/A",
            camera: { main: "N/A", front: "N/A" },
            os: "N/A",
            network: [],
            weight: "N/A"
          },
          rating: 4.0 + Math.random() * 1.0,
          categories: ["mid-range"]
        }));
        
        setLatestDevices(mapped);
      } catch (err) {
        console.error("Failed to load latest devices", err);
      } finally {
        setIsLoadingLatest(false);
      }
    };

    fetchLatest();

    const fetchBrands = async () => {
      try {
        const res = await fetch("/api/brands");
        if (res.ok) {
          const data = await res.json();
          setBrandList(data);
        }
      } catch (err) {
        console.error("Failed to load brands", err);
      }
    };

    fetchBrands();

    // Fetch popular brand models to fill the grid
    const fetchPopularBrands = async () => {
      const popularSlugs = ["apple-phones-48", "samsung-phones-9", "google-phones-107"];
      for (const slug of popularSlugs) {
        try {
          const res = await fetch(`/api/brand/${slug}`);
          if (res.ok) {
            const data = await res.json();
            const mapped: Smartphone[] = data.map((d: any) => ({
              id: d.phone_custom_id,
              name: d.device_name,
              brand: d.brand,
              price: 0,
              currency: "USD",
              releaseDate: "In Catalog",
              image: d.image,
              affiliateUrl: "#",
              specs: {
                display: "Click for details",
                processor: "Loading...",
                ram: "N/A",
                storage: "N/A",
                battery: "N/A",
                camera: { main: "N/A", front: "N/A" },
                os: "N/A",
                network: [],
                weight: "N/A"
              },
              rating: 4.0 + Math.random(),
              categories: ["mid-range"]
            })).slice(0, 100);
            
            setLatestDevices(prev => {
              const existingIds = new Set(prev.map(p => p.id));
              const newOnes = mapped.filter(m => !existingIds.has(m.id));
              return [...prev, ...newOnes];
            });
          }
        } catch (err) {
          console.error("Failed to fetch popular brand:", slug, err);
        }
      }
    };

    fetchPopularBrands();

    // Sync with system preference if needed, but here we'll just initialize with true
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("theme");
      if (saved) setIsDarkMode(saved === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setSearchError(null);
    if (query.length < 3) {
      setLiveSearchResults([]);
      return;
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length < 3) return;

      try {
        setIsSearching(true);
        setSearchError(null);
        const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        console.log("[Search] API Response Data:", data);
        
        if (!res.ok) {
          setSearchError(data.error || "Failed to search database");
          setLiveSearchResults([]);
          return;
        }

        // Mobile Phone Specs Database mapping
        let results = [];
        if (data && data.status && Array.isArray(data.data)) {
          results = data.data; // Typical response for this API
        } else if (Array.isArray(data)) {
          results = data;
        } else if (data.data && Array.isArray(data.data)) {
          results = data.data;
        } else if (data.results && Array.isArray(data.results)) {
          results = data.results;
        } else if (data.status === "success" && Array.isArray(data.data)) {
          results = data.data;
        } else if (data && typeof data === 'object' && (data.name || data.title) && (data.url || data.phone_custom_id)) {
          results = [data]; // Single result object
        }

        setLiveSearchResults(results.slice(0, 10)); 
      } catch (err) {
        console.error("Live search failed", err);
        setSearchError("Connection error. Please try again.");
        setLiveSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchAndAddDevice = async (deviceId: string) => {
    try {
      setIsSearching(true);
      setSearchError(null);
      const res = await fetch(`/api/device?id=${encodeURIComponent(deviceId)}`);
      const dataResponse = await res.json();
      console.log("[Device Detail] API Response Data:", dataResponse);
      
      // The API might wrap the device data in a 'data' property
      const data = dataResponse.data || dataResponse;
      
      if (!res.ok) {
        setSearchError(dataResponse.error || "Failed to fetch device details");
        return;
      }
      
      if (data && (data.phone_name || data.name)) {
        // Map Mobile Phone Specs Database data to internal Smartphone type
        const findSpec = (categoryName: string, specName: string) => {
          const category = data.specifications?.find((cat: any) => 
            (cat.title || cat.category || "").toLowerCase().includes(categoryName.toLowerCase())
          );
          const specsArr = category?.specs || category?.specifications || [];
          const spec = specsArr.find((s: any) => 
            (s.key || s.name || "").toLowerCase().includes(specName.toLowerCase())
          );
          return spec?.val || spec?.value || "N/A";
        };

        const phoneName = data.phone_name || data.name || "Unknown Device";
        
        // Fetch Flipkart price
        let flipkartData = undefined;
        try {
          const fkRes = await fetch(`/api/flipkart-price?q=${encodeURIComponent(phoneName)}`);
          if (fkRes.ok) {
            const fkJson = await fkRes.json();
            if (fkJson.price !== "N/A") {
              flipkartData = {
                price: fkJson.price,
                title: fkJson.title,
                link: fkJson.link
              };
            }
          }
        } catch (fkErr) {
          console.error("Flipkart fetch failed", fkErr);
        }

        const newPhone: Smartphone = {
          id: `live-${Date.now()}`,
          name: phoneName,
          brand: data.brand || phoneName.split(' ')[0],
          price: 0,
          currency: "USD",
          releaseDate: findSpec("Launch", "Announced") || findSpec("Network", "Announced") || "N/A",
          image: data.thumbnail || data.image || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop",
          affiliateUrl: "#",
          specs: {
            display: findSpec("Display", "Size"),
            processor: findSpec("Platform", "Chipset") || findSpec("Platform", "CPU"),
            ram: findSpec("Memory", "Internal"),
            storage: findSpec("Memory", "Internal"),
            battery: findSpec("Battery", "Type") || findSpec("Battery", "Capacity"),
            camera: {
              main: data.specifications?.find((s: any) => (s.title || s.category || "").toLowerCase().includes("main camera"))?.specs?.[0]?.val || 
                    data.specifications?.find((s: any) => (s.title || s.category || "").toLowerCase().includes("main camera"))?.specs?.[0]?.value || "N/A",
              front: data.specifications?.find((s: any) => (s.title || s.category || "").toLowerCase().includes("selfie camera"))?.specs?.[0]?.val ||
                     data.specifications?.find((s: any) => (s.title || s.category || "").toLowerCase().includes("selfie camera"))?.specs?.[0]?.value || "N/A"
            },
            os: findSpec("Platform", "OS"),
            network: [findSpec("Network", "Technology")],
            weight: findSpec("Body", "Weight")
          },
          rating: 4.5,
          categories: ["flagship"],
          flipkartData
        };
        
        setComparisonList(prev => {
          if (prev.some(p => p.name === newPhone.name)) return prev;
          if (prev.length >= 3) {
            return [...prev.slice(1), newPhone];
          }
          return [...prev, newPhone];
        });
        setSearchQuery("");
        setLiveSearchResults([]);
        setIsCompareOpen(true);
      }
    } catch (err) {
      console.error("Failed to fetch device details", err);
    } finally {
      setIsSearching(false);
    }
  };

  const brands = useMemo(() => {
    const staticBrands = Array.from(new Set(SMARTPHONES.map(p => p.brand)));
    const apiBrands = brandList.map(b => b.brand_name);
    return ["All", ...Array.from(new Set([...staticBrands, ...apiBrands]))].sort();
  }, [brandList]);

  // Fetch models for a brand if selected
  useEffect(() => {
    if (selectedBrand === "All") return;
    
    // Check if we already have these models (to avoid re-fetching)
    const brandObj = brandList.find(b => b.brand_name === selectedBrand);
    if (!brandObj) return;

    const fetchBrandModels = async () => {
      try {
        setIsLoadingGrid(true);
        const res = await fetch(`/api/brand/${brandObj.brand_slug}`);
        if (res.ok) {
          const data = await res.json();
          const mapped: Smartphone[] = data.map((d: any) => ({
            id: d.phone_custom_id,
            name: d.device_name,
            brand: d.brand,
            price: 0,
            currency: "USD",
            releaseDate: "In Catalog",
            image: d.image,
            affiliateUrl: "#",
            specs: {
              display: "Click for details",
              processor: "Loading...",
              ram: "N/A",
              storage: "N/A",
              battery: "N/A",
              camera: { main: "N/A", front: "N/A" },
              os: "N/A",
              network: [],
              weight: "N/A"
            },
            rating: 4.0 + Math.random(),
            categories: ["mid-range"]
          }));

          setLatestDevices(prev => {
            // Merge results, avoiding duplicates
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = mapped.filter(m => !existingIds.has(m.id));
            return [...prev, ...newOnes];
          });
        }
      } catch (err) {
        console.error("Failed to fetch brand models", err);
      } finally {
        setIsLoadingGrid(false);
      }
    };

    fetchBrandModels();
  }, [selectedBrand, brandList]);

  const filteredPhones = useMemo(() => {
    const allPhones = [...SMARTPHONES, ...latestDevices];
    return allPhones.filter(phone => {
      const matchesSearch = phone.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          phone.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand = selectedBrand === "All" || phone.brand === selectedBrand;
      const matchesTab = activeTab === "all" || phone.categories.includes(activeTab as any);
      return matchesSearch && matchesBrand && matchesTab;
    });
  }, [searchQuery, selectedBrand, activeTab, latestDevices]);

  const toggleComparison = async (phone: Smartphone) => {
    const isAlreadyInList = comparisonList.some(p => p.id === phone.id || p.name === phone.name);
    
    if (isAlreadyInList) {
      setComparisonList(prev => prev.filter(p => p.id !== phone.id && p.name !== phone.name));
    } else {
      let fullPhoneDetail = { ...phone };

      // If it's a "partial" phone from latestDevices, fetch full specs
      if (phone.specs.processor === "Loading..." || phone.specs.display === "Click for details") {
        try {
          setIsSearching(true);
          const res = await fetch(`/api/device?id=${encodeURIComponent(phone.id)}`);
          if (res.ok) {
            const dataResponse = await res.json();
            const data = dataResponse.data || dataResponse;
            
            const findSpec = (categoryName: string, specName: string) => {
              const category = data.specifications?.find((cat: any) => 
                (cat.title || cat.category || "").toLowerCase().includes(categoryName.toLowerCase())
              );
              const specsArr = category?.specs || category?.specifications || [];
              const spec = specsArr.find((s: any) => 
                (s.key || s.name || "").toLowerCase().includes(specName.toLowerCase())
              );
              return spec?.val || spec?.value || "N/A";
            };

            fullPhoneDetail.specs = {
              display: findSpec("Display", "Size"),
              processor: findSpec("Platform", "Chipset") || findSpec("Platform", "CPU"),
              ram: findSpec("Memory", "Internal"),
              storage: findSpec("Memory", "Internal"),
              battery: findSpec("Battery", "Type") || findSpec("Battery", "Capacity"),
              camera: {
                main: data.specifications?.find((s: any) => (s.title || s.category || "").toLowerCase().includes("main camera"))?.specs?.[0]?.val || 
                      data.specifications?.find((s: any) => (s.title || s.category || "").toLowerCase().includes("main camera"))?.specs?.[0]?.value || "N/A",
                front: data.specifications?.find((s: any) => (s.title || s.category || "").toLowerCase().includes("selfie camera"))?.specs?.[0]?.val ||
                       data.specifications?.find((s: any) => (s.title || s.category || "").toLowerCase().includes("selfie camera"))?.specs?.[0]?.value || "N/A"
              },
              os: findSpec("Platform", "OS"),
              network: [findSpec("Network", "Technology")],
              weight: findSpec("Body", "Weight")
            };
          }
        } catch (err) {
          console.error("Failed to fetch details for comparison", err);
        } finally {
          setIsSearching(false);
        }
      }

      // Add flipkart data if missing
      if (!fullPhoneDetail.flipkartData) {
        try {
          const fkRes = await fetch(`/api/flipkart-price?q=${encodeURIComponent(fullPhoneDetail.name)}`);
          if (fkRes.ok) {
            const fkJson = await fkRes.json();
            if (fkJson && fkJson.price !== "N/A") {
              fullPhoneDetail.flipkartData = {
                price: fkJson.price,
                title: fkJson.title,
                link: fkJson.link
              };
              // Extract numerical price if possible for sorting/display
              const priceNum = parseInt(fkJson.price.replace(/[^\d]/g, '')) / 83; // Approx INR to USD
              if (!isNaN(priceNum) && fullPhoneDetail.price === 0) {
                fullPhoneDetail.price = Math.round(priceNum);
              }
            }
          }
        } catch (err) {
          console.error("Flipkart fetch error", err);
        }
      }

      setComparisonList(prev => {
        if (prev.length >= 3) {
          return [...prev.slice(1), fullPhoneDetail];
        }
        return [...prev, fullPhoneDetail];
      });
      setIsCompareOpen(true);
    }
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isDarkMode ? "dark" : ""}`}>
      <div className="flex flex-col h-full bg-bg-deep text-text-main transition-colors duration-300">
        {/* Navbar */}
        <nav className="h-16 flex items-center justify-between px-6 bg-bg-card border-b border-border-subtle shadow-xl shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-brand-blue via-brand-green to-brand-pink rounded-lg flex items-center justify-center">
              <div className="w-5 h-5 bg-bg-deep rounded-sm"></div>
            </div>
            <span className="text-xl font-bold tracking-tight text-text-main">
              compare.<span className="text-brand-blue">tect</span>.my
            </span>
          </div>

          <div className="flex-1 max-w-xl mx-10">
            <div className="relative group">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-blue transition-colors ${isSearching ? "animate-pulse" : ""}`} size={18} />
              <input 
                type="text" 
                placeholder="Search smartphones, brands, or specs..."
                className="w-full bg-bg-input border border-border-subtle rounded-full py-2 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-blue transition-all"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />

              {/* Live Search Results Dropdown */}
              <AnimatePresence>
                {(liveSearchResults.length > 0 || (isSearching && searchQuery.length >= 3)) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-bg-card border border-border-subtle rounded-2xl shadow-2xl overflow-hidden z-50 py-2"
                  >
                    <div className="px-4 py-2 flex items-center justify-between border-b border-border-subtle/50 mb-1">
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Live Database</p>
                      {isSearching && <div className="w-3 h-3 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>}
                    </div>

                    {searchError ? (
                      <div className="px-4 py-6 text-center text-red-400 text-xs font-medium bg-red-400/5">
                        {searchError}
                      </div>
                    ) : liveSearchResults.length > 0 ? (
                      liveSearchResults.map((result, idx) => (
                        <div 
                          key={idx}
                          onClick={() => fetchAndAddDevice(result.phone_custom_id || result.url)}
                          className="px-4 py-3 hover:bg-bg-input cursor-pointer flex items-center justify-between group transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <PhoneIcon size={16} className="text-brand-blue shrink-0" />
                            <span className="text-sm font-medium text-text-main group-hover:text-brand-blue transition-colors line-clamp-1">{result.title || result.name || result.phone_name}</span>
                          </div>
                          <ChevronRight size={14} className="text-text-muted group-hover:translate-x-1 transition-transform shrink-0" />
                        </div>
                      ))
                    ) : isSearching ? (
                      <div className="px-4 py-8 text-center text-text-muted text-xs">
                        Searching Database...
                      </div>
                    ) : (
                      <div className="px-4 py-8 text-center text-text-muted text-xs">
                        No results found in live database
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-bg-input border border-border-subtle text-text-main hover:bg-slate-200 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div 
              onClick={() => setIsCompareOpen(true)}
              className="flex items-center gap-3 bg-bg-input border border-border-subtle px-4 py-2.5 rounded-full cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-800 transition-all group shadow-sm"
            >
              <ArrowRightLeft size={16} className="text-brand-blue group-hover:rotate-180 transition-transform duration-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-text-main">Compare</span>
              {comparisonList.length > 0 && (
                <span className="flex items-center justify-center w-5 h-5 bg-brand-pink text-white text-[10px] rounded-full shadow-lg shadow-brand-pink/20">
                  {comparisonList.length}
                </span>
              )}
            </div>
          </div>
        </nav>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="hidden lg:flex w-72 bg-bg-card/30 border-r border-border-subtle p-8 flex-col gap-8 overflow-y-auto no-scrollbar">
            <section>
              <span className="sidebar-label">Active Filters</span>
              <div className="flex flex-wrap gap-2">
                {activeTab !== "all" && (
                  <span className="px-3 py-1.5 bg-brand-blue/10 border border-brand-blue/30 text-brand-blue text-[10px] font-bold rounded-lg flex items-center gap-2">
                    {activeTab.toUpperCase()}
                    <X size={12} className="cursor-pointer" onClick={() => setActiveTab("all")} />
                  </span>
                )}
                {selectedBrand !== "All" && (
                  <span className="px-3 py-1.5 bg-brand-green/10 border border-brand-green/30 text-brand-green text-[10px] font-bold rounded-lg flex items-center gap-2">
                    {selectedBrand}
                    <X size={12} className="cursor-pointer" onClick={() => setSelectedBrand("All")} />
                  </span>
                )}
                {activeTab === "all" && selectedBrand === "All" && (
                  <span className="text-xs text-text-muted italic">No filters active</span>
                )}
              </div>
            </section>

            <section>
              <span className="sidebar-label">Category</span>
              <div className="space-y-4">
                {(["all", "flagship", "mid-range", "budget"] as const).map(tab => (
                  <label key={tab} className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-border-subtle bg-bg-input text-brand-blue focus:ring-0" 
                      checked={activeTab === tab}
                      onChange={() => setActiveTab(tab)}
                    />
                    <span className={`text-sm font-medium transition-colors ${activeTab === tab ? "text-text-main" : "text-text-muted group-hover:text-text-main"}`}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="flex flex-col flex-1 min-h-0">
              <span className="sidebar-label">Top Brands</span>
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                {brands.slice(0, 30).map(brand => (
                  <div 
                    key={brand} 
                    onClick={() => setSelectedBrand(brand)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedBrand === brand 
                      ? "bg-bg-input border-border-subtle shadow-inner" 
                      : "border-transparent hover:bg-bg-input/30"
                    }`}
                  >
                    <span className={`text-sm font-medium ${selectedBrand === brand ? "text-text-main" : "text-text-muted"}`}>{brand}</span>
                    <span className="text-[10px] font-bold text-text-muted">
                      {brand === "All" 
                        ? [...SMARTPHONES, ...latestDevices].length 
                        : [...SMARTPHONES, ...latestDevices].filter(p => p.brand === brand).length || (brandList.find(b => b.brand_name === brand)?.device_count)
                      }
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Ad Slot */}
            <div className="mt-auto p-5 bg-linear-to-br from-brand-blue/5 to-brand-pink/5 border border-border-subtle rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={48} />
              </div>
              <p className="text-[9px] font-bold text-text-muted mb-3 tracking-[0.2em]">SPONSORED</p>
              <p className="text-sm font-bold text-text-main mb-1">Affiliate Booster</p>
              <p className="text-xs text-text-muted mb-4 leading-relaxed">Join our partner network and earn through tech reviews.</p>
              <button className="w-full py-2.5 bg-text-main text-bg-deep font-black text-[10px] rounded-lg uppercase tracking-widest hover:bg-opacity-90 transition-colors">
                Learn More
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto no-scrollbar bg-[radial-gradient(circle_at_top_right,var(--bg-input),transparent_50%)]">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4 shrink-0">
              <div>
                <h1 className="text-4xl font-light text-text-main mb-2 tracking-tight">
                  Comparison <span className="font-bold italic text-brand-blue">Grid</span>
                </h1>
                <p className="text-text-muted text-sm font-medium">Showing {filteredPhones.length} matching devices</p>
              </div>
              <div className="flex items-center gap-4 bg-bg-card p-1 rounded-xl border border-border-subtle shadow-xl self-end">
                <button className="p-2 bg-bg-input rounded-lg text-text-main shadow-lg"><LayoutGrid size={18} /></button>
              </div>
            </header>

            <div className="relative min-h-[400px]">
              {isLoadingGrid || isLoadingLatest ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-deep/20 backdrop-blur-sm z-10 rounded-3xl">
                  <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-bold uppercase tracking-widest text-text-main animate-pulse">Populating market models...</p>
                </div>
              ) : filteredPhones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Search size={48} className="text-text-muted mb-4 opacity-20" />
                  <p className="text-lg font-bold text-text-main">No devices found</p>
                  <p className="text-sm text-text-muted">Try adjusting your filters or search query</p>
                </div>
              ) : null}

              <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-10 transition-opacity duration-300 ${isLoadingGrid ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
                {filteredPhones.map((phone, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={phone.id}
                    className="group flex flex-col bg-bg-card border border-border-subtle rounded-3xl overflow-hidden hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-2xl transition-all"
                  >
                    <div className="h-64 bg-bg-input border-b border-border-subtle flex items-center justify-center p-8 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3b82f610,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                      <img src={phone.image} alt={phone.name} className="h-full object-contain group-hover:scale-110 transition-transform duration-700 relative z-10" referrerPolicy="no-referrer" />
                      
                      <div className="absolute top-4 right-4 flex flex-col gap-2 scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="w-10 h-10 bg-bg-card/50 backdrop-blur rounded-full flex items-center justify-center text-text-main hover:text-brand-pink transition-colors shadow-sm">
                          <Heart size={20} />
                        </button>
                        <button 
                          onClick={() => toggleComparison(phone)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                            comparisonList.some(p => p.id === phone.id) 
                            ? "bg-brand-blue text-white" 
                            : "bg-bg-card/50 text-text-main hover:bg-bg-card/80"
                          }`}
                        >
                          <ArrowRightLeft size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-1">{phone.brand}</p>
                          <h3 className="text-xl font-bold text-text-main group-hover:text-brand-blue transition-colors line-clamp-1">{phone.name}</h3>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-text-main">{phone.price > 0 ? `$${phone.price}` : "TBD"}</p>
                          <div className="flex items-center gap-1 text-amber-500 font-bold text-xs justify-end">
                            <Star size={12} fill="currentColor" />
                            <span>{phone.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center justify-between text-xs py-2 border-b border-border-subtle/50">
                          <span className="text-text-muted">Chipset</span>
                          <span className="text-text-main font-medium line-clamp-1">{phone.specs.processor}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-2 border-b border-border-subtle/50">
                          <span className="text-text-muted">Memory</span>
                          <span className="text-text-main font-medium">{phone.specs.ram}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs py-2">
                          <span className="text-text-muted">Battery</span>
                          <span className="text-brand-green font-medium">{phone.specs.battery}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-auto">
                        <button 
                          onClick={() => toggleComparison(phone)}
                          className="flex-1 bg-brand-pink hover:bg-opacity-90 text-white p-3 rounded-xl font-bold text-xs text-center transition-all uppercase tracking-widest shadow-lg shadow-brand-pink/10"
                        >
                          {phone.specs.processor === "Loading..." ? "Details" : "Compare"}
                        </button>
                        <button 
                          onClick={() => toggleComparison(phone)}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                            comparisonList.some(p => p.id === phone.id) 
                            ? "bg-brand-blue/20 text-brand-blue border border-brand-blue/30" 
                            : "bg-bg-input text-text-muted hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent"
                          }`}
                        >
                          <ArrowRightLeft size={18} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <footer className="mt-auto pt-8 border-t border-border-subtle/50 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-text-muted font-bold uppercase tracking-widest italic shrink-0">
              <p>* Prices vary by region. Affiliate links help support our research.</p>
              <div className="flex gap-8 not-italic">
                <a href="#" className="hover:text-text-main transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-text-main transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-text-main transition-colors">Country List</a>
              </div>
            </footer>
          </main>
        </div>

        {/* Comparison Modal (Redesigned for Dynamic Theme) */}
        <AnimatePresence>
          {isCompareOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-bg-deep/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 30 }}
                className="bg-bg-card w-full max-w-7xl h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-border-subtle"
              >
                <div className="p-6 md:p-12 h-full flex flex-col overflow-y-auto custom-scrollbar">
                  <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6">
                    <div className="flex-1">
                      <h2 className="text-4xl font-bold text-text-main mb-2">Technical Analysis</h2>
                      <p className="text-text-muted font-medium">Side-by-side performance benchmarking</p>
                    </div>
                    <button 
                      onClick={() => setIsCompareOpen(false)}
                      className="w-14 h-14 bg-bg-input hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl flex items-center justify-center text-text-main transition-all shadow-xl"
                    >
                      <X size={28} />
                    </button>
                  </div>

                  {comparisonList.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted">
                      <ArrowRightLeft size={80} className="mb-6 opacity-10" />
                      <p className="text-xl font-bold uppercase tracking-widest opacity-20">Select devices to compare</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-[180px_repeat(auto-fit,minmax(200px,1fr))] gap-px bg-border-subtle rounded-3xl overflow-hidden border border-border-subtle">
                      <div className="bg-bg-input/40 p-8 hidden md:flex flex-col">
                        <div className="h-64 mb-8 flex items-end">
                          <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Hardware Specs</span>
                        </div>
                        <div className="space-y-12 text-sm font-bold text-text-muted uppercase tracking-widest">
                          <p className="h-8 flex items-center">Processor</p>
                          <p className="h-8 flex items-center">Display</p>
                          <p className="h-8 flex items-center">Memory</p>
                          <p className="h-8 flex items-center">Energy</p>
                          <p className="h-8 flex items-center">Imaging</p>
                          <p className="h-8 flex items-center">Flipkart Price</p>
                          <p className="h-8 flex items-center">MSRP</p>
                        </div>
                      </div>

                      {comparisonList.map(phone => (
                        <div key={`col-${phone.id}`} className="bg-bg-card p-8 flex flex-col text-center border-l border-border-subtle/50">
                          <div className="h-64 flex flex-col items-center mb-8 relative">
                            <img src={phone.image} alt={phone.name} className="h-40 object-contain mb-6 drop-shadow-2xl" referrerPolicy="no-referrer" />
                            <h3 className="text-xl font-bold text-text-main mb-1">{phone.name}</h3>
                            <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.1em]">{phone.brand}</p>
                            <button 
                              onClick={() => toggleComparison(phone)}
                              className="absolute -top-4 -right-4 w-8 h-8 bg-bg-input rounded-full flex items-center justify-center text-text-muted hover:text-red-400 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="space-y-12 text-sm text-text-main font-medium">
                            <p className="h-8 flex items-center justify-center">{phone.specs.processor}</p>
                            <p className="h-8 flex items-center justify-center leading-tight">{phone.specs.display}</p>
                            <p className="h-8 flex items-center justify-center">{phone.specs.ram}</p>
                            <p className="h-8 flex items-center justify-center text-brand-green">{phone.specs.battery}</p>
                            <p className="h-8 flex items-center justify-center leading-tight">{phone.specs.camera.main}</p>
                            <div className="h-8 flex flex-col items-center justify-center">
                              {phone.flipkartData ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-brand-blue font-bold">{phone.flipkartData.price}</span>
                                  <a 
                                    href={phone.flipkartData.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[9px] text-text-muted hover:text-brand-blue flex items-center gap-1 transition-colors"
                                  >
                                    View on Flipkart <ExternalLink size={8} />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-text-muted italic text-[10px]">Checking Flipkart...</span>
                              )}
                            </div>
                            <div className="pt-4 flex flex-col items-center gap-4">
                              <p className="text-2xl font-bold text-text-main">${phone.price}</p>
                              <a 
                                href={phone.affiliateUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full bg-brand-pink hover:bg-opacity-90 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-pink/10"
                              >
                                View Deal
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
