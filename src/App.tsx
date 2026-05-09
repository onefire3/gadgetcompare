/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef } from "react";
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
  ChevronLeft,
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
import { PhoneCard } from "./components/PhoneCard";

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [liveSearchResults, setLiveSearchResults] = useState<any[]>([]);
  const [devices, setDevices] = useState<Smartphone[]>(SMARTPHONES);
  const [currentPage, setCurrentPage] = useState(1);
  const [brandSearch, setBrandSearch] = useState("");
  const itemsPerPage = 9; // Grid friendly
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
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEvents = (event: Event) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setLiveSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleEvents as any);
    document.addEventListener("scroll", handleEvents as any, true); // Capture scroll events everywhere
    return () => {
      document.removeEventListener("mousedown", handleEvents as any);
      document.removeEventListener("scroll", handleEvents as any, true);
    };
  }, []);

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
        
        setDevices(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newOnes = mapped.filter(m => !existingIds.has(m.id));
          return [...prev, ...newOnes];
        });
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
            
            setDevices(prev => {
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
    setCurrentPage(1); // Reset to first page
    if (query.length < 3) {
      setLiveSearchResults([]);
      return;
    }
  };

  const performFullSearch = async () => {
    if (searchQuery.length < 3) return;
    
    try {
      setIsSearching(true);
      const res = await fetch(`/api/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      
      let results = [];
      if (data && data.status && Array.isArray(data.data)) {
        results = data.data;
      } else if (Array.isArray(data)) {
        results = data;
      }
      
      if (results.length > 0) {
        const mapped: Smartphone[] = results.map((d: any) => ({
          id: d.phone_custom_id || `search-${Math.random()}`,
          name: d.device_name || d.phone_name,
          brand: d.brand || (d.device_name || "").split(' ')[0],
          price: 0,
          currency: "USD",
          releaseDate: "Search Result",
          image: d.image || d.thumbnail || "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop",
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
          rating: 4.0,
          categories: ["mid-range"]
        }));

        setDevices(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newOnes = mapped.filter(m => !existingIds.has(m.id));
          return [...newOnes, ...prev]; // Put new results at top
        });
        setIsSearchMode(true);
        setLiveSearchResults([]);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Full search failed", err);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect for both live results and local filtering
  useEffect(() => {
    const timer = setTimeout(async () => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset visible count on any search update
      
      if (searchQuery.length < 3) {
        setLiveSearchResults([]);
        return;
      }

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

        const internalMem = findSpec("Memory", "Internal");
        const ramMatch = internalMem.match(/(\d+GB)\s*RAM/i) || internalMem.match(/(\d+\s*GB)/i);
        const storageMatch = internalMem.match(/(128GB|256GB|512GB|1TB|2TB)/i);

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
            ram: ramMatch ? ramMatch[1] : (internalMem.split(" ")[1] || "N/A"),
            storage: storageMatch ? storageMatch[1] : (internalMem.split(" ")[0] || "N/A"),
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
        
        setDevices(prev => {
          if (prev.some(p => p.id === newPhone.id)) return prev;
          return [newPhone, ...prev];
        });
        
        setComparisonList(prev => {
          if (prev.some(p => p.name === newPhone.name)) return prev;
          if (prev.length >= 3) {
            return [...prev.slice(1), newPhone];
          }
          return [...prev, newPhone];
        });
        setSearchQuery("");
        setLiveSearchResults([]);
        setIsSearchMode(false); // Reset search mode to show the new item in catalog
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
    const all = ["All", ...Array.from(new Set([...staticBrands, ...apiBrands]))].sort();
    
    if (!brandSearch) return all;
    const query = brandSearch.toLowerCase();
    return all.filter(b => b === "All" || b.toLowerCase().includes(query));
  }, [brandList, brandSearch]);

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

          setDevices(prev => {
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
    const allPhones = devices;
    const query = debouncedSearchQuery.toLowerCase();
    return allPhones.filter(phone => {
      const matchesSearch = query.length === 0 || 
                          phone.name.toLowerCase().includes(query) || 
                          phone.brand.toLowerCase().includes(query);
      const matchesBrand = selectedBrand === "All" || phone.brand === selectedBrand;
      const matchesTab = activeTab === "all" || phone.categories.includes(activeTab as any);
      return matchesSearch && matchesBrand && matchesTab;
    });
  }, [debouncedSearchQuery, selectedBrand, activeTab, devices]);

  const totalPages = Math.ceil(filteredPhones.length / itemsPerPage);
  
  const pagedPhones = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPhones.slice(start, start + itemsPerPage);
  }, [filteredPhones, currentPage, itemsPerPage]);

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

            const internalMem = findSpec("Memory", "Internal");
            const ramMatch = internalMem.match(/(\d+GB)\s*RAM/i) || internalMem.match(/(\d+\s*GB)/i);
            const storageMatch = internalMem.match(/(128GB|256GB|512GB|1TB|2TB)/i);

            const updatedSpecs = {
              display: findSpec("Display", "Size"),
              processor: findSpec("Platform", "Chipset") || findSpec("Platform", "CPU"),
              ram: ramMatch ? ramMatch[1] : (internalMem.split(" ")[1] || "N/A"),
              storage: storageMatch ? storageMatch[1] : (internalMem.split(" ")[0] || "N/A"),
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

            fullPhoneDetail.specs = updatedSpecs;

            // Sync with catalog grid
            setDevices(prev => 
              prev.map(p => p.id === phone.id ? { ...p, specs: updatedSpecs } : p)
            );
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
            <div ref={searchRef} className="relative group">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-brand-blue transition-colors ${isSearching ? "animate-pulse" : ""}`} size={18} />
              <input 
                type="text" 
                placeholder="Search smartphones, brands, or specs..."
                className="w-full bg-bg-input border border-border-subtle rounded-full py-2 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-blue transition-all"
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.length >= 3 && liveSearchResults.length === 0 && !isSearching) {
                    handleSearch(searchQuery);
                  }
                }}
                onChange={(e) => handleSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    performFullSearch();
                  }
                }}
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
                            <span className="text-sm font-medium text-text-main group-hover:text-brand-blue transition-colors line-clamp-1">
                              {result.device_name || result.phone_name || result.name || result.title || "Unknown Device"}
                            </span>
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

        <div className="flex-1 flex overflow-hidden relative">
          {/* AdSense Placeholder - Sidebar Left (Hidden on small screens) */}
          <div className="hidden 2xl:flex w-40 flex-col gap-4 p-4 border-r border-border-subtle bg-bg-card/20 items-center shrink-0">
            <div className="w-full aspect-[1/4] bg-bg-input border border-dashed border-border-subtle rounded-xl flex items-center justify-center p-4 text-center">
              <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] leading-tight">AdSense Vertical Placeholder</span>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="hidden lg:flex w-80 bg-bg-card/30 border-r border-border-subtle p-8 flex-col gap-8 h-full sticky top-0 overflow-y-auto no-scrollbar shrink-0">
            <section className="bg-bg-input/30 p-5 rounded-2xl border border-border-subtle/50 mb-4 sticky top-0 z-10 backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div className="sidebar-label !mb-0 flex items-center gap-2">
                  <Filter size={14} className="text-brand-blue" />
                  Active Filters
                </div>
                {(activeTab !== "all" || selectedBrand !== "All" || debouncedSearchQuery) && (
                  <button 
                    onClick={() => {
                      setActiveTab("all");
                      setSelectedBrand("All");
                      setSearchQuery("");
                      setDebouncedSearchQuery("");
                      setCurrentPage(1);
                    }}
                    className="text-[9px] font-black text-brand-pink uppercase tracking-widest hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {activeTab !== "all" && (
                  <span className="px-2.5 py-1.5 bg-brand-blue text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 shadow-lg shadow-brand-blue/20">
                    {activeTab}
                    <X size={10} className="cursor-pointer hover:scale-125 transition-transform" onClick={() => { setActiveTab("all"); setCurrentPage(1); }} />
                  </span>
                )}
                {selectedBrand !== "All" && (
                  <span className="px-2.5 py-1.5 bg-brand-green text-white text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 shadow-lg shadow-brand-green/20">
                    {selectedBrand}
                    <X size={10} className="cursor-pointer hover:scale-125 transition-transform" onClick={() => { setSelectedBrand("All"); setCurrentPage(1); }} />
                  </span>
                )}
                {debouncedSearchQuery && (
                  <span className="px-2.5 py-1.5 bg-text-main text-bg-deep text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2">
                    "{debouncedSearchQuery}"
                    <X size={10} className="cursor-pointer hover:scale-125 transition-transform" onClick={() => { setSearchQuery(""); setDebouncedSearchQuery(""); setCurrentPage(1); }} />
                  </span>
                )}
                {activeTab === "all" && selectedBrand === "All" && !debouncedSearchQuery && (
                  <span className="text-[10px] text-text-muted font-bold italic opacity-40">Showing all models</span>
                )}
              </div>
            </section>

            <section>
              <span className="sidebar-label">Price Point</span>
              <div className="space-y-4">
                {(["all", "flagship", "mid-range", "budget"] as const).map(tab => (
                  <label key={tab} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className="peer appearance-none w-5 h-5 rounded-lg border-2 border-border-subtle bg-bg-input checked:bg-brand-blue checked:border-brand-blue transition-all" 
                        checked={activeTab === tab}
                        onChange={() => {
                          setActiveTab(tab);
                          setCurrentPage(1);
                        }}
                      />
                      <Search size={10} className="absolute text-white scale-0 peer-checked:scale-100 transition-transform pointer-events-none" />
                    </div>
                    <span className={`text-sm font-bold transition-colors ${activeTab === tab ? "text-brand-blue" : "text-text-muted group-hover:text-text-main"}`}>
                      {tab === "all" ? "All Price Ranges" : tab === "flagship" ? "Premium / Flagship" : tab === "mid-range" ? "Mid-range Value" : "Budget Friendly"}
                    </span>
                  </label>
                ))}
              </div>
            </section>

            <section className="flex flex-col min-h-0 space-y-4">
              <span className="sidebar-label">Trending Models</span>
              <div className="flex flex-col gap-2">
                {[
                  { name: "iPhone 15 Pro", id: "apple-iphone-15-pro-12557" },
                  { name: "Galaxy S24", id: "samsung-galaxy-s24-12773" },
                  { name: "Pixel 8 Pro", id: "google-pixel-8-pro-12545" }
                ].map(model => (
                  <button 
                    key={model.id}
                    onClick={() => fetchAndAddDevice(model.id)}
                    className="text-left py-2 px-3 rounded-lg border border-transparent hover:border-brand-blue/30 hover:bg-brand-blue/5 transition-all group flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-text-muted group-hover:text-text-main transition-colors">{model.name}</span>
                    <TrendingUp size={12} className="text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </section>

            <section className="flex flex-col min-h-0 space-y-4">
              <div className="flex items-center justify-between">
                <span className="sidebar-label !mb-0">Brands</span>
                <span className="text-[10px] font-black text-brand-blue uppercase tracking-widest">{brands.length - 1} AVAILABLE</span>
              </div>
              
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="text"
                  placeholder="Filter brands..."
                  className="w-full bg-bg-input/50 border border-border-subtle rounded-xl py-2 pl-9 pr-3 text-xs focus:outline-none focus:border-brand-blue transition-all"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                />
              </div>

              <div className="space-y-1 overflow-y-auto pr-2 no-scrollbar flex-1 max-h-[400px] pb-4">
                {brands.map(brand => (
                  <div 
                    key={brand} 
                    onClick={() => {
                      setSelectedBrand(brand);
                      setCurrentPage(1);
                    }}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                      selectedBrand === brand 
                      ? "bg-bg-input border-border-subtle shadow-inner" 
                      : "border-transparent hover:bg-bg-input/30"
                    }`}
                  >
                    <span className={`text-sm font-bold ${selectedBrand === brand ? "text-text-main" : "text-text-muted"}`}>{brand}</span>
                    <span className={`text-[10px] font-black p-1.5 rounded-lg transition-colors ${selectedBrand === brand ? "bg-brand-blue/10 text-brand-blue" : "text-text-muted group-hover:text-text-main"}`}>
                      {brand === "All" 
                        ? devices.length 
                        : devices.filter(p => p.brand === brand).length || (brandList.find(b => b.brand_name === brand)?.device_count)
                      }
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* Sidebar AdSense Placeholder */}
            <div className="mt-auto pt-6 border-t border-border-subtle">
              <div className="w-full aspect-square bg-bg-input border border-dashed border-border-subtle rounded-2xl flex items-center justify-center p-6 text-center group">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] leading-tight opacity-40 group-hover:opacity-100 transition-opacity">AdSense Sticky Placeholder</span>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto no-scrollbar bg-[radial-gradient(circle_at_top_right,var(--bg-input),transparent_50%)] relative">
            {/* AdSense Top Banner Placeholder */}
            <div className="w-full h-24 bg-bg-card border border-dashed border-border-subtle rounded-3xl mb-10 flex items-center justify-center shadow-xl group shrink-0">
              <div className="flex flex-col items-center gap-1 opacity-30 group-hover:opacity-100 transition-all">
                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">AdSense Leaderboard Placeholder</span>
                <span className="text-[8px] text-text-muted italic">Optimized for high CTR (728 x 90)</span>
              </div>
            </div>

            <header className="flex flex-col gap-8 mb-10 shrink-0">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                {isSearchMode ? (
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button 
                        onClick={() => {
                          setIsSearchMode(false);
                          setSearchQuery("");
                          setDebouncedSearchQuery("");
                        }}
                        className="p-2 hover:bg-bg-input rounded-lg text-brand-blue transition-colors"
                      >
                        <X size={20} />
                      </button>
                      <h1 className="text-3xl font-bold text-text-main tracking-tight">
                        Search <span className="italic text-brand-blue">Results</span>
                      </h1>
                    </div>
                    <p className="text-text-muted text-sm font-medium">
                      Found {filteredPhones.length} matches for <span className="text-brand-pink font-bold">"{debouncedSearchQuery}"</span>
                    </p>
                  </div>
                ) : (
                  <div>
                    <h1 className="text-4xl font-light text-text-main mb-2 tracking-tight">
                      Discovery <span className="font-bold italic text-brand-blue">Catalog</span>
                    </h1>
                    <p className="text-text-muted text-sm font-medium">Displaying specialized tech across {totalPages} pages</p>
                  </div>
                )}
                <div className="flex items-center gap-4 bg-bg-card p-1 rounded-xl border border-border-subtle shadow-xl self-end">
                  <button className="p-2 bg-bg-input rounded-lg text-text-main shadow-lg"><LayoutGrid size={18} /></button>
                </div>
              </div>

              {/* Active Filter Chips Row */}
              {(activeTab !== "all" || selectedBrand !== "All" || debouncedSearchQuery) && (
                <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-2 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-3 shrink-0">
                    <Filter size={14} className="text-brand-blue" />
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Active Filters:</span>
                  </div>
                  <div className="flex gap-2">
                    {activeTab !== "all" && (
                      <div className="px-3 py-1.5 bg-brand-blue text-white text-[10px] font-black rounded-lg flex items-center gap-2 shadow-lg shadow-brand-blue/10">
                        {activeTab.toUpperCase()}
                        <X size={12} className="cursor-pointer hover:scale-110" onClick={() => { setActiveTab("all"); setCurrentPage(1); }} />
                      </div>
                    )}
                    {selectedBrand !== "All" && (
                      <div className="px-3 py-1.5 bg-brand-green text-white text-[10px] font-black rounded-lg flex items-center gap-2 shadow-lg shadow-brand-green/10">
                        {selectedBrand.toUpperCase()}
                        <X size={12} className="cursor-pointer hover:scale-110" onClick={() => { setSelectedBrand("All"); setCurrentPage(1); }} />
                      </div>
                    )}
                    {debouncedSearchQuery && (
                      <div className="px-3 py-1.5 bg-bg-input border border-border-subtle text-text-main text-[10px] font-black rounded-lg flex items-center gap-2 shadow-sm">
                        "{debouncedSearchQuery.toUpperCase()}"
                        <X size={12} className="cursor-pointer hover:scale-110" onClick={() => { setSearchQuery(""); setDebouncedSearchQuery(""); setCurrentPage(1); }} />
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        setActiveTab("all");
                        setSelectedBrand("All");
                        setSearchQuery("");
                        setDebouncedSearchQuery("");
                        setCurrentPage(1);
                      }}
                      className="px-3 py-1.5 text-[10px] font-black text-brand-pink uppercase tracking-widest hover:bg-brand-pink/10 rounded-lg transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </header>

            <div className="relative flex-1 min-h-[400px]">
              {isLoadingGrid || isLoadingLatest ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-deep/20 backdrop-blur-sm z-10 rounded-3xl">
                  <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-sm font-bold uppercase tracking-widest text-text-main animate-pulse">Syncing market data...</p>
                </div>
              ) : null}

              {/* Grid with in-grid Ad placeholder */}
              <div className={`h-full transition-opacity duration-300 ${isLoadingGrid ? "opacity-30 pointer-events-none" : "opacity-100"}`}>
                <div className="flex flex-col h-full items-center">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 w-full max-w-7xl">
                    {pagedPhones.map((phone, idx) => (
                      <div key={phone.id} className="h-[520px]">
                        <PhoneCard 
                          phone={phone} 
                          toggleComparison={toggleComparison} 
                          isComparing={comparisonList.some(p => p.id === phone.id)} 
                        />
                      </div>
                    ))}
                    
                    {/* Native styled ad in grid */}
                    {pagedPhones.length >= 3 && (
                      <div className="h-[520px] bg-bg-card border border-dashed border-border-subtle rounded-[2.5rem] flex flex-col items-center justify-center p-12 text-center group">
                        <div className="w-16 h-16 bg-bg-input rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <LayoutGrid size={32} className="text-text-muted opacity-30" />
                        </div>
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-4">Native Ad Slot</span>
                        <p className="text-xs text-text-muted font-medium leading-relaxed opacity-60">Highly relevant tech offers<br/>matching current segment</p>
                      </div>
                    )}
                  </div>
                  
                {/* Numbered Pagination */}
                {totalPages > 1 && (
                  <div className="mt-20 mb-10 flex flex-col items-center gap-10 w-full">
                    <div className="h-px w-64 bg-linear-to-r from-transparent via-border-subtle to-transparent" />
                    
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={() => { setCurrentPage(prev => Math.max(1, prev - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentPage === 1}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center border border-border-subtle bg-bg-card text-text-main disabled:opacity-20 hover:bg-bg-input transition-all shadow-lg active:scale-95"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      
                      <div className="flex items-center gap-2 p-1.5 bg-bg-card border border-border-subtle rounded-2xl shadow-2xl">
                        {Array.from({ length: totalPages }).map((_, i) => {
                          const page = i + 1;
                          if (totalPages > 7) {
                            if (page > 1 && page < totalPages && Math.abs(page - currentPage) > 1) {
                              if (page === 2 || page === totalPages - 1) return <span key={page} className="px-2 text-text-muted opacity-30 font-black">...</span>;
                              return null;
                            }
                          }
                          
                          return (
                            <button
                              key={page}
                              onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                              className={`w-12 h-12 rounded-xl text-sm font-black transition-all ${
                                currentPage === page 
                                ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/30 scale-110" 
                                : "text-text-muted hover:bg-bg-input hover:text-text-main"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        })}
                      </div>

                      <button 
                        onClick={() => { setCurrentPage(prev => Math.min(totalPages, prev + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        disabled={currentPage === totalPages}
                        className="w-14 h-14 rounded-2xl flex items-center justify-center border border-border-subtle bg-bg-card text-text-main disabled:opacity-20 hover:bg-bg-input transition-all shadow-lg active:scale-95"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </div>
                    
                    {/* AdSense Bottom Banner */}
                    <div className="w-full max-w-4xl h-32 bg-bg-card border border-dashed border-border-subtle rounded-3xl flex items-center justify-center shadow-inner group">
                      <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-100 transition-all">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.5em]">AdSense Billboard Placeholder</span>
                        <span className="text-[8px] text-text-muted italic">Contextual Catalog Ads (970 x 250)</span>
                      </div>
                    </div>

                    <div className="bg-bg-input/60 px-6 py-2 rounded-full border border-border-subtle/50 shadow-inner">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">
                          Viewing <span className="text-text-main">{pagedPhones.length}</span> models on page <span className="text-text-main">{currentPage}</span> of {totalPages}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {filteredPhones.length === 0 && !isLoadingGrid && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Search size={64} className="text-text-muted mb-6 opacity-10" />
                      <h3 className="text-2xl font-bold text-text-main mb-2">No matches found</h3>
                      <p className="text-text-muted max-w-xs">We couldn't find any devices matching your filters locally or in our quick database.</p>
                      {debouncedSearchQuery && (
                        <p className="text-brand-blue text-xs font-bold mt-4 animate-pulse">Try searching for "{debouncedSearchQuery}" in the search bar</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <footer className="mt-20 pt-8 border-t border-border-subtle/50 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-text-muted font-bold uppercase tracking-widest italic shrink-0">
              <p>* Specifications and availability may vary by region. Affiliate commissions help support our platform.</p>
              <div className="flex gap-8 not-italic">
                <a href="#" className="hover:text-text-main transition-colors">Terms</a>
                <a href="#" className="hover:text-text-main transition-colors">Privacy</a>
                <a href="#" className="hover:text-text-main transition-colors">Ad Settings</a>
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
                        <div className="space-y-8 text-sm font-bold text-text-muted uppercase tracking-widest">
                          <p className="h-10 flex items-center">Chipset</p>
                          <p className="h-10 flex items-center">Display</p>
                          <p className="h-10 flex items-center">Memory</p>
                          <p className="h-10 flex items-center">Storage</p>
                          <p className="h-10 flex items-center">Battery</p>
                          <p className="h-10 flex items-center">Main Camera</p>
                          <p className="h-10 flex items-center">Selfie Camera</p>
                          <p className="h-10 flex items-center">OS / Weight</p>
                          <p className="h-10 flex items-center">Buy (IN)</p>
                          <p className="h-10 flex items-center">Price (Global)</p>
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

                          <div className="space-y-8 text-sm text-text-main font-medium">
                            <p className="h-10 flex items-center justify-center text-xs px-2 text-center leading-tight">{phone.specs.processor}</p>
                            <p className="h-10 flex items-center justify-center leading-tight text-xs px-2 text-center">{phone.specs.display}</p>
                            <p className="h-10 flex items-center justify-center font-bold text-brand-blue">{phone.specs.ram}</p>
                            <p className="h-10 flex items-center justify-center text-xs px-2 text-center leading-tight">{phone.specs.storage}</p>
                            <p className="h-10 flex items-center justify-center text-brand-green font-bold">{phone.specs.battery}</p>
                            <p className="h-10 flex items-center justify-center leading-tight text-xs px-2 text-center">{phone.specs.camera.main}</p>
                            <p className="h-10 flex items-center justify-center leading-tight text-xs px-2 text-center">{phone.specs.camera.front}</p>
                            <div className="h-10 flex flex-col items-center justify-center leading-tight text-[10px] text-text-muted text-center">
                              <span className="line-clamp-1">{phone.specs.os}</span>
                              <span className="opacity-60">{phone.specs.weight}</span>
                            </div>
                            <div className="h-10 flex flex-col items-center justify-center">
                              {phone.flipkartData ? (
                                <div className="flex flex-col items-center">
                                  <span className="text-brand-blue font-bold text-xs">{phone.flipkartData.price}</span>
                                  <a 
                                    href={phone.flipkartData.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-[8px] text-text-muted hover:text-brand-blue flex items-center gap-1 transition-colors uppercase font-black"
                                  >
                                    Buy Now <ExternalLink size={8} />
                                  </a>
                                </div>
                              ) : (
                                <span className="text-text-muted italic text-[10px]">Unavailable</span>
                              )}
                            </div>
                            <div className="pt-4 flex flex-col items-center gap-4">
                              <p className="text-xl font-bold text-text-main">${phone.price > 0 ? phone.price : "???"}</p>
                              <a 
                                href={phone.affiliateUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="w-full bg-brand-pink hover:bg-opacity-90 text-white py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-pink/10"
                              >
                                View Specs
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
