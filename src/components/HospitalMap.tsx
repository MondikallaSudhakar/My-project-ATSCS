import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface HospitalMapProps {
  showRoute?: boolean;
}

export const HospitalMap = ({ showRoute = false }: HospitalMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    map.current = L.map(mapContainer.current).setView([13.5550, 78.8738], 13); // Madanapalle coordinates

    // Load free OSM tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map.current);

    // Fix for default markers
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTEyLjUgNDFMMjUgMTJIMFoiIGZpbGw9IiMzMzMiLz4KPC9zdmc+',
      iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiMzMzMiLz4KPHBhdGggZD0iTTEyLjUgNDFMMjUgMTJIMFoiIGZpbGw9IiMzMzMiLz4KPC9zdmc+',
      shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjIwLjUiIGN5PSIyMC41IiByeD0iMjAuNSIgcnk9IjIwLjUiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4zIi8+Cjwvc3ZnPg==',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    // Get user location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation([lat, lng]);

        // Show current location
        const currentLocationIcon = L.divIcon({
          html: '<div style="background: #ef4444; border: 3px solid white; border-radius: 50%; width: 20px; height: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
          iconSize: [20, 20],
          className: 'current-location-marker'
        });

        L.marker([lat, lng], { icon: currentLocationIcon })
          .addTo(map.current!)
          .bindPopup("📍 You are here")
          .openPopup();
        
        map.current!.setView([lat, lng], 14);

        // Query nearby hospitals from Overpass API
        const query = `
          [out:json];
          (
            node["amenity"="hospital"](around:3000,${lat},${lng});
            way["amenity"="hospital"](around:3000,${lat},${lng});
          );
          out geom;
        `;
        
        fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: query
        })
        .then(res => res.json())
        .then(data => {
          const hospitalIcon = L.divIcon({
            html: '<div style="background: #dc2626; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏥</div>',
            iconSize: [30, 30],
            className: 'hospital-marker'
          });

          data.elements.forEach((place: any) => {
            if (place.lat && place.lon) {
              const hospitalName = place.tags?.name || "Hospital";
              const distance = calculateDistance(lat, lng, place.lat, place.lon);
              
              L.marker([place.lat, place.lon], { icon: hospitalIcon })
                .addTo(map.current!)
                .bindPopup(`
                  <div>
                    <h4 style="margin: 0 0 5px 0; font-weight: bold;">${hospitalName}</h4>
                    <p style="margin: 0; font-size: 12px; color: #666;">Distance: ${distance.toFixed(1)} km</p>
                  </div>
                `);
            }
          });
        })
        .catch(error => {
          console.error("Error fetching hospitals:", error);
          // Add some default hospitals for demo
          const defaultHospitals = [
            { lat: 13.5580, lng: 78.8758, name: "Government Hospital Madanapalle" },
            { lat: 13.5520, lng: 78.8720, name: "Apollo Clinic" },
            { lat: 13.5565, lng: 78.8715, name: "Care Hospital" },
            { lat: 13.5545, lng: 78.8780, name: "Sri Venkateswara Hospital" }
          ];

          const hospitalIcon = L.divIcon({
            html: '<div style="background: #dc2626; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏥</div>',
            iconSize: [30, 30],
            className: 'hospital-marker'
          });

          defaultHospitals.forEach(hospital => {
            const distance = calculateDistance(lat, lng, hospital.lat, hospital.lng);
            L.marker([hospital.lat, hospital.lng], { icon: hospitalIcon })
              .addTo(map.current!)
              .bindPopup(`
                <div>
                  <h4 style="margin: 0 0 5px 0; font-weight: bold;">${hospital.name}</h4>
                  <p style="margin: 0; font-size: 12px; color: #666;">Distance: ${distance.toFixed(1)} km</p>
                </div>
              `);
          });
        });

        // Show route if requested
        if (showRoute) {
          const routeCoordinates: [number, number][] = [
            [lat, lng],
            [13.5560, 78.8748],
            [13.5570, 78.8758],
            [13.5580, 78.8758] // Government Hospital
          ];

          const routeLine = L.polyline(routeCoordinates, {
            color: '#ef4444',
            weight: 5,
            opacity: 0.8,
            dashArray: '10, 10'
          }).addTo(map.current!);

          // Add ambulance icon on route
          const ambulanceIcon = L.divIcon({
            html: '<div style="font-size: 24px;">🚑</div>',
            iconSize: [30, 30],
            className: 'ambulance-marker'
          });

          L.marker([lat + 0.001, lng + 0.001], { icon: ambulanceIcon })
            .addTo(map.current!)
            .bindPopup("🚑 Emergency Vehicle - AP01-AB-1234");

          map.current!.fitBounds(routeLine.getBounds(), { padding: [20, 20] });
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        // Default to Madanapalle if geolocation fails
        const defaultLat = 13.5550;
        const defaultLng = 78.8738;
        
        map.current!.setView([defaultLat, defaultLng], 13);
        
        // Add default hospitals
        const defaultHospitals = [
          { lat: 13.5580, lng: 78.8758, name: "Government Hospital Madanapalle" },
          { lat: 13.5520, lng: 78.8720, name: "Apollo Clinic" },
          { lat: 13.5565, lng: 78.8715, name: "Care Hospital" },
          { lat: 13.5545, lng: 78.8780, name: "Sri Venkateswara Hospital" }
        ];

        const hospitalIcon = L.divIcon({
          html: '<div style="background: #dc2626; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">🏥</div>',
          iconSize: [30, 30],
          className: 'hospital-marker'
        });

        defaultHospitals.forEach(hospital => {
          L.marker([hospital.lat, hospital.lng], { icon: hospitalIcon })
            .addTo(map.current!)
            .bindPopup(`<h4 style="margin: 0;">${hospital.name}</h4>`);
        });
      }
    );

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [showRoute]);

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  return (
    <div className="relative w-full h-96 rounded-lg overflow-hidden">
      <div ref={mapContainer} className="w-full h-full" />
      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded px-3 py-1 text-sm font-medium">
        📍 Live Location & Nearby Hospitals
      </div>
      {showRoute && (
        <div className="absolute top-2 right-2 bg-red-500/90 text-white rounded px-3 py-1 text-sm font-medium">
          🚑 Emergency Route Active
        </div>
      )}
    </div>
  );
};