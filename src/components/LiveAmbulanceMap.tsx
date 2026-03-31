import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Square, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LiveAmbulanceMapProps {
  vehicleId?: string;
  startCoords?: [number, number];
  endCoords?: [number, number];
  routeCoords?: [number, number][];
  isEmergency?: boolean;
}

export const LiveAmbulanceMap = ({
  vehicleId,
  startCoords,
  endCoords,
  routeCoords,
  isEmergency = true,
}: LiveAmbulanceMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const ambulanceMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const passedLineRef = useRef<L.Polyline | null>(null);
  const signalMarkersRef = useRef<L.Marker[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simIndex, setSimIndex] = useState(0);
  const [eta, setEta] = useState<string>("");
  const simulationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Default demo route (Madanapalle area)
  const defaultRoute: [number, number][] = routeCoords || [
    [13.5530, 78.8700],
    [13.5540, 78.8710],
    [13.5550, 78.8720],
    [13.5555, 78.8730],
    [13.5560, 78.8738],
    [13.5565, 78.8745],
    [13.5570, 78.8750],
    [13.5575, 78.8755],
    [13.5580, 78.8758],
  ];

  // Traffic signal positions along route
  const signalPositions = [
    { pos: Math.floor(defaultRoute.length * 0.25), name: "Junction A", cleared: false },
    { pos: Math.floor(defaultRoute.length * 0.5), name: "Junction B", cleared: false },
    { pos: Math.floor(defaultRoute.length * 0.75), name: "Junction C", cleared: false },
  ];

  const [signals, setSignals] = useState(signalPositions);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current).setView(
      startCoords || [13.5550, 78.8738],
      14
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    mapRef.current = map;

    // Draw route
    routeLineRef.current = L.polyline(defaultRoute, {
      color: isEmergency ? "#ef4444" : "#3b82f6",
      weight: 5,
      opacity: 0.8,
      dashArray: "10, 10",
    }).addTo(map);

    // Start marker
    const startIcon = L.divIcon({
      html: '<div style="background:#22c55e;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">S</div>',
      iconSize: [28, 28],
      className: "",
    });
    L.marker(defaultRoute[0], { icon: startIcon }).addTo(map).bindPopup("📍 Start");

    // End marker
    const endIcon = L.divIcon({
      html: '<div style="background:#dc2626;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:12px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏥</div>',
      iconSize: [28, 28],
      className: "",
    });
    L.marker(defaultRoute[defaultRoute.length - 1], { icon: endIcon }).addTo(map).bindPopup("🏥 Hospital");

    // Signal markers
    const newSignalMarkers: L.Marker[] = [];
    signalPositions.forEach((sig) => {
      const sigIcon = L.divIcon({
        html: `<div style="background:#ef4444;color:white;border-radius:4px;padding:2px 6px;font-size:10px;white-space:nowrap;border:1px solid white;">🔴 ${sig.name}</div>`,
        className: "",
        iconSize: [80, 20],
      });
      const marker = L.marker(defaultRoute[sig.pos], { icon: sigIcon }).addTo(map);
      newSignalMarkers.push(marker);
    });
    signalMarkersRef.current = newSignalMarkers;

    // Ambulance marker (blinking effect via CSS)
    const ambIcon = L.divIcon({
      html: `<div class="ambulance-blink" style="font-size:32px;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));">🚑</div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      className: "",
    });
    ambulanceMarkerRef.current = L.marker(defaultRoute[0], { icon: ambIcon, zIndexOffset: 1000 }).addTo(map);

    map.fitBounds(L.latLngBounds(defaultRoute), { padding: [30, 30] });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Subscribe to real-time vehicle updates
  useEffect(() => {
    if (!vehicleId) return;

    const channel = supabase
      .channel("vehicle-tracking")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "vehicles", filter: `id=eq.${vehicleId}` },
        (payload) => {
          const { current_lat, current_lng } = payload.new;
          if (current_lat && current_lng && ambulanceMarkerRef.current) {
            const newLatLng = L.latLng(current_lat, current_lng);
            ambulanceMarkerRef.current.setLatLng(newLatLng);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vehicleId]);

  // Simulation
  const startSimulation = useCallback(() => {
    setIsSimulating(true);
    setSimIndex(0);
    setSignals(signalPositions.map(s => ({ ...s, cleared: false })));

    let idx = 0;
    simulationRef.current = setInterval(() => {
      if (idx >= defaultRoute.length - 1) {
        if (simulationRef.current) clearInterval(simulationRef.current);
        setIsSimulating(false);
        setEta("Arrived!");
        return;
      }

      idx++;
      setSimIndex(idx);

      const pos = defaultRoute[idx];
      if (ambulanceMarkerRef.current) {
        ambulanceMarkerRef.current.setLatLng(pos);
      }

      // Update passed route portion
      if (passedLineRef.current && mapRef.current) {
        mapRef.current.removeLayer(passedLineRef.current);
      }
      if (mapRef.current) {
        passedLineRef.current = L.polyline(defaultRoute.slice(0, idx + 1), {
          color: "#9ca3af",
          weight: 5,
          opacity: 0.6,
        }).addTo(mapRef.current);
      }

      // Update signals
      setSignals(prev => prev.map((sig) => {
        if (idx >= sig.pos - 1 && !sig.cleared) {
          // Update signal marker to green
          const markerIdx = signalPositions.findIndex(s => s.name === sig.name);
          if (signalMarkersRef.current[markerIdx] && mapRef.current) {
            mapRef.current.removeLayer(signalMarkersRef.current[markerIdx]);
            const greenIcon = L.divIcon({
              html: `<div style="background:#22c55e;color:white;border-radius:4px;padding:2px 6px;font-size:10px;white-space:nowrap;border:1px solid white;">🟢 ${sig.name}</div>`,
              className: "",
              iconSize: [80, 20],
            });
            signalMarkersRef.current[markerIdx] = L.marker(defaultRoute[sig.pos], { icon: greenIcon }).addTo(mapRef.current);
          }
          return { ...sig, cleared: true };
        }
        return sig;
      }));

      // Update ETA
      const remaining = defaultRoute.length - 1 - idx;
      const etaMins = Math.ceil((remaining * 2) / 60 * 10);
      setEta(etaMins > 0 ? `~${etaMins} min` : "< 1 min");

      // Update Supabase if vehicleId exists
      if (vehicleId) {
        supabase.from("vehicles").update({
          current_lat: pos[0],
          current_lng: pos[1],
          status: "en_route",
          updated_at: new Date().toISOString(),
        }).eq("id", vehicleId).then(() => {});
      }
    }, 2000);
  }, [vehicleId, defaultRoute]);

  const stopSimulation = () => {
    if (simulationRef.current) clearInterval(simulationRef.current);
    setIsSimulating(false);
  };

  useEffect(() => {
    return () => {
      if (simulationRef.current) clearInterval(simulationRef.current);
    };
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="w-5 h-5" />
            Live Ambulance Tracking
          </CardTitle>
          <div className="flex items-center gap-2">
            {eta && (
              <Badge variant="destructive" className="animate-pulse">
                ETA: {eta}
              </Badge>
            )}
            {!isSimulating ? (
              <Button size="sm" onClick={startSimulation} className="btn-emergency text-xs px-3 py-1 h-8">
                <Play className="w-3 h-3 mr-1" />
                Start Simulation
              </Button>
            ) : (
              <Button size="sm" variant="outline" onClick={stopSimulation} className="text-xs h-8">
                <Square className="w-3 h-3 mr-1" />
                Stop
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div ref={mapContainerRef} className="w-full h-80 rounded-b-lg" />
        
        {/* Signal status strip */}
        <div className="flex justify-around p-2 border-t bg-muted/50">
          {signals.map((sig, i) => (
            <div key={i} className="flex items-center gap-1 text-xs">
              <div className={`w-3 h-3 rounded-full ${sig.cleared ? "bg-green-500" : "bg-red-500"}`} />
              <span className={sig.cleared ? "text-green-700" : "text-red-700"}>
                {sig.name}
              </span>
            </div>
          ))}
        </div>
      </CardContent>

      {/* CSS for blinking ambulance */}
      <style>{`
        .ambulance-blink {
          animation: blink-amb 1s infinite;
        }
        @keyframes blink-amb {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </Card>
  );
};
