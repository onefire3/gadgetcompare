import React from "react";
import { motion } from "motion/react";
import { Heart, Star, ArrowRightLeft, Smartphone as PhoneIcon } from "lucide-react";
import { Smartphone } from "../data";

interface PhoneCardProps {
  phone: Smartphone;
  toggleComparison: (phone: Smartphone) => void;
  isComparing: boolean;
}

const ImageWithFallback = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [error, setError] = React.useState(false);
  const [loading, setLoading] = React.useState(true);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-input animate-pulse">
          <PhoneIcon className="text-text-muted opacity-20" size={40} />
        </div>
      )}
      <img
        src={error ? "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop" : src}
        alt={alt}
        className={`${className} ${loading ? "opacity-0" : "opacity-100"} transition-opacity duration-500`}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
};

export const PhoneCard: React.FC<PhoneCardProps> = ({ phone, toggleComparison, isComparing }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group h-full flex flex-col bg-bg-card border border-border-subtle rounded-3xl overflow-hidden hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-2xl transition-all"
    >
      <div className="h-64 bg-bg-input border-b border-border-subtle flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#3b82f610,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        <ImageWithFallback 
          src={phone.image} 
          alt={phone.name} 
          className="h-full object-contain group-hover:scale-110 transition-transform duration-700 relative z-10" 
        />
        
        <div className="absolute top-4 right-4 flex flex-col gap-2 scale-75 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all">
          <button className="w-10 h-10 bg-bg-card/50 backdrop-blur rounded-full flex items-center justify-center text-text-main hover:text-brand-pink transition-colors shadow-sm">
            <Heart size={20} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleComparison(phone);
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${
              isComparing ? "bg-brand-blue text-white" : "bg-bg-card/50 text-text-main hover:bg-bg-card/80"
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
              isComparing 
              ? "bg-brand-blue/20 text-brand-blue border border-brand-blue/30" 
              : "bg-bg-input text-text-muted hover:bg-slate-200 dark:hover:bg-slate-800 border border-transparent"
            }`}
          >
            <ArrowRightLeft size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
