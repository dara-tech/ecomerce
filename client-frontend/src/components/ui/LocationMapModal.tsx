"use client";
import { useState, useEffect } from "react";
import { X, MapPin } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { InlineLoader } from "./PageLoader";
import { cn } from "@/lib/utils";

const MapPicker = dynamic(() => import("./MapPicker"), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center bg-muted/50 rounded-xl animate-pulse"><InlineLoader /></div> });

interface LocationData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: LocationData) => void;
}

export default function LocationMapModal({ open, onClose, onConfirm }: Props) {
  const [position, setPosition] = useState({ lat: 11.5564, lng: 104.9282 }); // Default Phnom Penh
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (open && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      }, () => {
         // ignore error, just use default
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`);
      const data = await res.json();
      
      let address = "";
      let city = "";
      let state = "";
      let zipCode = "";

      if (data && data.address) {
        if (data.address.road || data.address.suburb) {
          address = `${data.address.road || ''} ${data.address.suburb || ''}`.trim();
        }
        if (data.address.city || data.address.town || data.address.village) {
          city = data.address.city || data.address.town || data.address.village;
        }
        if (data.address.state) {
          state = data.address.state;
        }
        if (data.address.postcode) {
          zipCode = data.address.postcode;
        }
        
        onConfirm({ address, city, state, zipCode });
        toast.success("Location retrieved from map!");
      } else {
        toast.error("Could not determine address for this location.");
      }
    } catch (error) {
      toast.error("Failed to fetch address data.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex md:items-center md:justify-center md:bg-black/50 md:p-4 md:backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="flex h-[100dvh] w-full flex-col bg-background md:h-auto md:max-h-[min(92dvh,700px)] md:max-w-2xl md:rounded-2xl overflow-hidden md:shadow-2xl md:ring-1 md:ring-border/60">
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/60 px-5 pb-4 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-6 md:pt-5">
          <p className="text-base font-semibold md:text-lg">Select Location on Map</p>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted active:scale-95 transition-all">
             <X className="size-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 relative bg-muted/20 p-4 md:p-5 md:min-h-[400px]">
           <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
           <div className="h-full w-full rounded-xl overflow-hidden shadow-inner ring-1 ring-border/60 isolate relative z-0">
             <MapPicker position={position} setPosition={setPosition} />
           </div>
        </div>

        <div className="shrink-0 border-t border-border/60 bg-background px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom,0px))] md:px-6 md:py-5">
          <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
             <p className="text-xs text-muted-foreground flex-1">
               Drag the map pin to your exact delivery location.
             </p>
             <button
               type="button"
               disabled={isLoading}
               onClick={handleConfirm}
               className="inline-flex h-11 w-full sm:w-auto min-w-[140px] items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-transform active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
             >
               {isLoading ? <InlineLoader size="sm" className="border-2 size-4" /> : <MapPin className="size-4" />}
               {isLoading ? "Retrieving..." : "Confirm Location"}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
