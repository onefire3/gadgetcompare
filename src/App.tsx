/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
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
  Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SMARTPHONES, Smartphone } from "./data";

export default function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [comparisonList, setComparisonList] = useState<Smartphone[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "flagship" | "mid-range" | "budget">("all");

  const brands = ["All", ...Array.from(new Set(SMARTPHONES.map(p => p.brand)))];

  const filteredPhones = useMemo(() => {
    return SMARTPHONES.filter(phone => {
      const matchesSearch = phone.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          phone.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand = selectedBrand === "All" || phone.brand === selectedBrand;
      const matchesTab = activeTab === "all" || phone.categories.includes(activeTab as any);
      return matchesSearch && matchesBrand && matchesTab;
    });
  }, [searchQuery, selectedBrand, activeTab]);

  const toggleComparison = (phone: Smartphone) => {
    if (comparisonList.some(p => p.id === phone.id)) {
      setComparisonList(prev => prev.filter(p => p.id !== phone.id));
    } else {
      if (comparisonList.length >= 3) {
        alert("You can compare up to 3 phones at once.");
        return;
      }
      setComparisonList(prev => [...prev, phone]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-bg-deep text-slate-300 overflow-hidden">
      {/* Navbar */}
      <nav className="h-16 flex items-center justify-between px-6 bg-bg-card border-b border-slate-800 shadow-xl shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-brand-blue via-brand-green to-brand-pink rounded-lg flex items-center justify-center">
            <div className="w-5 h-5 bg-bg-deep rounded-sm"></div>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            compare.<span className="text-brand-blue">tect</span>.my
          </span>
        </div>

        <div className="flex-1 max-w-xl mx-10">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-blue transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search smartphones, brands, or specs..."
              className="w-full bg-slate-900 border border-slate-800 rounded-full py-2 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-blue transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div 
            onClick={() => setIsCompareOpen(true)}
            className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-full cursor-pointer hover:bg-slate-800 transition-all group"
          >
            <ArrowRightLeft size={16} className="text-brand-blue group-hover:rotate-180 transition-transform duration-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-white">Compare</span>
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
        <aside className="hidden lg:flex w-72 bg-bg-card/30 border-r border-slate-800 p-8 flex-col gap-8 overflow-y-auto no-scrollbar">
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
                <span className="text-xs text-slate-600 italic">No filters active</span>
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
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-brand-blue focus:ring-0" 
                    checked={activeTab === tab}
                    onChange={() => setActiveTab(tab)}
                  />
                  <span className={`text-sm font-medium transition-colors ${activeTab === tab ? "text-white" : "text-slate-400 group-hover:text-slate-300"}`}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace("-", " ")}
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <span className="sidebar-label">Top Brands</span>
            <div className="space-y-4">
              {brands.slice(0, 6).map(brand => (
                <div 
                  key={brand} 
                  onClick={() => setSelectedBrand(brand)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${
                    selectedBrand === brand 
                    ? "bg-slate-800 border-slate-700 shadow-inner" 
                    : "border-transparent hover:bg-slate-800/30"
                  }`}
                >
                  <span className={`text-sm font-medium ${selectedBrand === brand ? "text-white" : "text-slate-400"}`}>{brand}</span>
                  <span className="text-[10px] font-bold text-slate-600">
                    {SMARTPHONES.filter(p => p.brand === brand || brand === "All").length}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Ad Slot */}
          <div className="mt-auto p-5 bg-linear-to-br from-brand-blue/5 to-brand-pink/5 border border-slate-800 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp size={48} />
            </div>
            <p className="text-[9px] font-bold text-slate-500 mb-3 tracking-[0.2em]">SPONSORED</p>
            <p className="text-sm font-bold text-white mb-1">Affiliate Booster</p>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">Join our partner network and earn through tech reviews.</p>
            <button className="w-full py-2.5 bg-white text-bg-deep font-black text-[10px] rounded-lg uppercase tracking-widest hover:bg-slate-100 transition-colors">
              Learn More
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col p-6 lg:p-10 overflow-y-auto no-scrollbar bg-[radial-gradient(circle_at_top_right,#1e293b,transparent_50%)]">
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-10 gap-4 shrink-0">
            <div>
              <h1 className="text-4xl font-light text-white mb-2 tracking-tight">
                Comparison <span className="font-bold italic text-brand-blue">Grid</span>
              </h1>
              <p className="text-slate-500 text-sm font-medium">Showing {filteredPhones.length} matching devices</p>
            </div>
            <div className="flex items-center gap-4 bg-bg-card p-1 rounded-xl border border-slate-800 shadow-xl self-end">
              <button className="p-2 bg-slate-800 rounded-lg text-white shadow-lg"><LayoutGrid size={18} /></button>
            </div>
          </header>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8 pb-10">
            {filteredPhones.map((phone, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={phone.id}
                className="group flex flex-col bg-bg-card border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 hover:shadow-2xl hover:shadow-brand-blue/5 transition-all"
              >
                <div className="h-64 bg-slate-900 border-b border-slate-800 flex items-center justify-center p-8 relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3b82f610,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <img src={phone.image} alt={phone.name} className="h-full object-contain group-hover:scale-110 transition-transform duration-700 relative z-10" referrerPolicy="no-referrer" />
                  
                  <div className="absolute top-4 right-4 flex flex-col gap-2 scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center text-white hover:text-brand-pink transition-colors">
                      <Heart size={20} />
                    </button>
                    <button 
                      onClick={() => toggleComparison(phone)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        comparisonList.some(p => p.id === phone.id) 
                        ? "bg-brand-blue text-white" 
                        : "bg-white/10 text-white hover:bg-white/20"
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
                      <h3 className="text-xl font-bold text-white group-hover:text-brand-blue transition-colors line-clamp-1">{phone.name}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-white">${phone.price}</p>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs justify-end">
                        <Star size={12} fill="currentColor" />
                        <span>{phone.rating}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800/50">
                      <span className="text-slate-500">Chipset</span>
                      <span className="text-slate-300 font-medium line-clamp-1">{phone.specs.processor}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-2 border-b border-slate-800/50">
                      <span className="text-slate-500">Memory</span>
                      <span className="text-slate-300 font-medium">{phone.specs.ram}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-2">
                      <span className="text-slate-500">Battery</span>
                      <span className="text-brand-green font-medium">{phone.specs.battery}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-auto">
                    <a 
                      href={phone.affiliateUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-pink-600 hover:bg-pink-500 text-white p-3 rounded-xl font-bold text-xs text-center transition-colors uppercase tracking-widest shadow-lg shadow-pink-600/10"
                    >
                      View Deal
                    </a>
                    <button 
                      onClick={() => toggleComparison(phone)}
                      className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        comparisonList.some(p => p.id === phone.id) 
                        ? "bg-brand-blue/20 text-brand-blue border border-brand-blue/30" 
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent"
                      }`}
                    >
                      <ArrowRightLeft size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <footer className="mt-auto pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest italic shrink-0">
            <p>* Prices vary by region. Affiliate links help support our research.</p>
            <div className="flex gap-8 not-italic">
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Country List</a>
            </div>
          </footer>
        </main>
      </div>

      {/* Comparison Modal (Redesigned for Dark Theme) */}
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
              className="bg-bg-card w-full max-w-7xl h-full rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-slate-800"
            >
              <div className="p-6 md:p-12 h-full flex flex-col overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h2 className="text-4xl font-bold text-white mb-2">Technical Analysis</h2>
                    <p className="text-slate-500 font-medium">Side-by-side performance benchmarking</p>
                  </div>
                  <button 
                    onClick={() => setIsCompareOpen(false)}
                    className="w-14 h-14 bg-slate-800 hover:bg-slate-700 rounded-2xl flex items-center justify-center text-white transition-all shadow-xl"
                  >
                    <X size={28} />
                  </button>
                </div>

                {comparisonList.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-700">
                    <ArrowRightLeft size={80} className="mb-6 opacity-10" />
                    <p className="text-xl font-bold uppercase tracking-widest opacity-20">Select devices to compare</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-[180px_repeat(auto-fit,minmax(200px,1fr))] gap-px bg-slate-800/30 rounded-3xl overflow-hidden border border-slate-800">
                    <div className="bg-slate-900/40 p-8 hidden md:flex flex-col">
                      <div className="h-64 mb-8 flex items-end">
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Hardware Specs</span>
                      </div>
                      <div className="space-y-12 text-sm font-bold text-slate-500 uppercase tracking-widest">
                        <p className="h-8 flex items-center">Processor</p>
                        <p className="h-8 flex items-center">Display</p>
                        <p className="h-8 flex items-center">Memory</p>
                        <p className="h-8 flex items-center">Energy</p>
                        <p className="h-8 flex items-center">Imaging</p>
                        <p className="h-8 flex items-center">MSRP</p>
                      </div>
                    </div>

                    {comparisonList.map(phone => (
                      <div key={`col-${phone.id}`} className="bg-bg-card p-8 flex flex-col text-center border-l border-slate-800/50">
                        <div className="h-64 flex flex-col items-center mb-8 relative">
                          <img src={phone.image} alt={phone.name} className="h-40 object-contain mb-6 drop-shadow-2xl" referrerPolicy="no-referrer" />
                          <h3 className="text-xl font-bold text-white mb-1">{phone.name}</h3>
                          <p className="text-[10px] font-black text-brand-blue uppercase tracking-[0.1em]">{phone.brand}</p>
                          <button 
                            onClick={() => toggleComparison(phone)}
                            className="absolute -top-4 -right-4 w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="space-y-12 text-sm text-slate-300 font-medium">
                          <p className="h-8 flex items-center justify-center">{phone.specs.processor}</p>
                          <p className="h-8 flex items-center justify-center leading-tight">{phone.specs.display}</p>
                          <p className="h-8 flex items-center justify-center">{phone.specs.ram}</p>
                          <p className="h-8 flex items-center justify-center text-brand-green">{phone.specs.battery}</p>
                          <p className="h-8 flex items-center justify-center leading-tight">{phone.specs.camera.main}</p>
                          <div className="pt-4 flex flex-col items-center gap-4">
                            <p className="text-2xl font-bold text-white">${phone.price}</p>
                            <a 
                              href={phone.affiliateUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full bg-pink-600 hover:bg-pink-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-pink-600/10"
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
  );
}

// Support functions and components removed for brevity as they are now integrated or changed to match theme better directly
