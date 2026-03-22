import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Volume2, VolumeX, Siren, Timer, Route, ShieldAlert } from "lucide-react";
import { useVoiceAnnouncement } from "./useVoiceAnnouncement";

interface Signal {
  id: string;
  name: string;
  distanceKm: number;
}

interface Ambulance {
  id: string;
  label: string;
  vehicleNumber: string;
  speedKmh: number;
  currentDistanceKm: number;
  route: Signal[];
  urgency: "critical" | "high" | "normal";
  color: string;
}

const ROUTES: Signal[][] = [
  [
    { id: "s1", name: "MG Road Junction", distanceKm: 1.2 },
    { id: "s2", name: "Clock Tower Circle", distanceKm: 2.8 },
    { id: "s3", name: "Market Square", distanceKm: 4.1 },
    { id: "s4", name: "Hospital Gate", distanceKm: 5.5 },
  ],
  [
    { id: "s5", name: "Railway Crossing", distanceKm: 0.8 },
    { id: "s6", name: "Bus Stand Junction", distanceKm: 2.0 },
    { id: "s7", name: "Temple Road Signal", distanceKm: 3.3 },
    { id: "s8", name: "City Hospital Entry", distanceKm: 4.8 },
  ],
];

const AMBULANCE_COLORS = [
  "hsl(0 84% 55%)",
  "hsl(210 100% 50%)",
  "hsl(38 100% 50%)",
  "hsl(280 70% 50%)",
];

const createAmbulance = (index: number): Ambulance => ({
  id: `amb-${index}`,
  label: `Ambulance ${index + 1}`,
  vehicleNumber: `AP${String(index + 1).padStart(2, "0")}-AB-${1234 + index}`,
  speedKmh: 40 + Math.random() * 30,
  currentDistanceKm: 0,
  route: ROUTES[index % ROUTES.length],
  urgency: index === 0 ? "critical" : index === 1 ? "high" : "normal",
  color: AMBULANCE_COLORS[index % AMBULANCE_COLORS.length],
});

const getEta = (distanceKm: number, currentKm: number, speedKmh: number) => {
  const remaining = Math.max(0, distanceKm - currentKm);
  return Math.round((remaining / speedKmh) * 3600);
};

export const AmbulanceTracker = () => {
  const [ambulances, setAmbulances] = useState<Ambulance[]>([createAmbulance(0)]);
  const [corridorActive, setCorridorActive] = useState(true);
  const { enabled: voiceEnabled, setEnabled: setVoiceEnabled, announceCountdown } = useVoiceAnnouncement();

  // Simulate ambulance movement
  useEffect(() => {
    const interval = setInterval(() => {
      setAmbulances((prev) =>
        prev.map((amb) => {
          const maxDist = amb.route[amb.route.length - 1].distanceKm;
          const increment = amb.speedKmh / 3600; // km per second
          const next = amb.currentDistanceKm + increment;
          return {
            ...amb,
            currentDistanceKm: next >= maxDist ? 0 : next, // loop
            speedKmh: 40 + Math.random() * 30,
          };
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Voice announcements for nearest signal of first ambulance
  useEffect(() => {
    if (ambulances.length === 0) return;
    const amb = ambulances[0];
    const nextSignal = amb.route.find((s) => s.distanceKm > amb.currentDistanceKm);
    if (!nextSignal) return;
    const eta = getEta(nextSignal.distanceKm, amb.currentDistanceKm, amb.speedKmh);
    announceCountdown(amb.label, eta, nextSignal.name);
  }, [ambulances, announceCountdown]);

  const addAmbulance = useCallback(() => {
    setAmbulances((prev) => {
      if (prev.length >= 4) return prev;
      return [...prev, createAmbulance(prev.length)];
    });
  }, []);

  const removeAmbulance = useCallback(() => {
    setAmbulances((prev) => (prev.length <= 1 ? prev : prev.slice(0, -1)));
  }, []);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return <Badge className="bg-[hsl(0_84%_55%)] text-white border-0">CRITICAL</Badge>;
      case "high":
        return <Badge className="bg-[hsl(38_100%_50%)] text-white border-0">HIGH</Badge>;
      default:
        return <Badge className="bg-[hsl(210_100%_50%)] text-white border-0">NORMAL</Badge>;
    }
  };

  const getSignalStatus = (signal: Signal, ambulance: Ambulance) => {
    const eta = getEta(signal.distanceKm, ambulance.currentDistanceKm, ambulance.speedKmh);
    if (ambulance.currentDistanceKm > signal.distanceKm) return "passed";
    if (eta <= 10 && corridorActive) return "green";
    if (eta <= 30 && corridorActive) return "yellow";
    return "red";
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-lg">
              <Siren className="w-5 h-5 mr-2 text-[hsl(var(--primary))]" />
              Ambulance Communication Panel
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={voiceEnabled ? "default" : "outline"}
                onClick={() => setVoiceEnabled(!voiceEnabled)}
              >
                {voiceEnabled ? <Volume2 className="w-4 h-4 mr-1" /> : <VolumeX className="w-4 h-4 mr-1" />}
                Voice {voiceEnabled ? "On" : "Off"}
              </Button>
              <Button
                size="sm"
                variant={corridorActive ? "default" : "outline"}
                onClick={() => setCorridorActive(!corridorActive)}
              >
                <ShieldAlert className="w-4 h-4 mr-1" />
                Corridor {corridorActive ? "Active" : "Off"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={addAmbulance} disabled={ambulances.length >= 4}>
              + Add Ambulance
            </Button>
            <Button size="sm" variant="outline" onClick={removeAmbulance} disabled={ambulances.length <= 1}>
              − Remove
            </Button>
            <span className="text-sm text-muted-foreground ml-2">
              {ambulances.length} ambulance{ambulances.length > 1 ? "s" : ""} active
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Corridor Status */}
      {corridorActive && (
        <Card className="border-[hsl(var(--traffic-green))] bg-[hsl(120_100%_97%)]">
          <CardContent className="py-3 px-4">
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5 text-[hsl(var(--traffic-green))]" />
              <span className="font-semibold text-[hsl(120_50%_25%)]">
                Smart Corridor Active
              </span>
              <span className="text-sm text-[hsl(120_30%_35%)]">
                — All cross-traffic routes blocked. Only ambulance corridor is open.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per-ambulance cards */}
      {ambulances.map((amb) => {
        const nextSignal = amb.route.find((s) => s.distanceKm > amb.currentDistanceKm);
        const progress = (amb.currentDistanceKm / amb.route[amb.route.length - 1].distanceKm) * 100;

        return (
          <Card key={amb.id} className="overflow-hidden">
            <CardHeader
              className="py-3 px-4"
              style={{ borderLeft: `4px solid ${amb.color}` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">🚑</span>
                  <div>
                    <h4 className="font-bold text-sm">{amb.label}</h4>
                    <p className="text-xs text-muted-foreground">{amb.vehicleNumber}</p>
                  </div>
                  {getUrgencyBadge(amb.urgency)}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Speed</p>
                  <p className="font-bold text-sm">{Math.round(amb.speedKmh)} km/h</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-3 space-y-3">
              {/* Route progress */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Route Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              {/* Signal countdown list */}
              <div className="space-y-2">
                {amb.route.map((signal) => {
                  const eta = getEta(signal.distanceKm, amb.currentDistanceKm, amb.speedKmh);
                  const status = getSignalStatus(signal, amb);
                  const isPassed = status === "passed";

                  return (
                    <div
                      key={signal.id}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                        isPassed
                          ? "bg-[hsl(var(--muted))] opacity-50"
                          : status === "green"
                          ? "bg-[hsl(120_100%_95%)] border border-[hsl(var(--traffic-green))]"
                          : status === "yellow"
                          ? "bg-[hsl(45_100%_95%)] border border-[hsl(var(--traffic-yellow))]"
                          : "bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {/* Signal light indicator */}
                        <div
                          className={`w-3 h-3 rounded-full ${
                            isPassed
                              ? "bg-[hsl(var(--muted-foreground))]"
                              : status === "green"
                              ? "bg-[hsl(var(--traffic-green))] animate-pulse"
                              : status === "yellow"
                              ? "bg-[hsl(var(--traffic-yellow))] animate-pulse"
                              : "bg-[hsl(var(--traffic-red))]"
                          }`}
                        />
                        <span className={isPassed ? "line-through" : "font-medium"}>
                          {signal.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({signal.distanceKm} km)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isPassed ? (
                          <Badge variant="secondary" className="text-xs">Passed</Badge>
                        ) : (
                          <>
                            <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                            <span
                              className={`font-mono font-bold tabular-nums ${
                                eta <= 10
                                  ? "text-[hsl(var(--traffic-green))]"
                                  : eta <= 30
                                  ? "text-[hsl(var(--traffic-yellow))]"
                                  : "text-[hsl(var(--primary))]"
                              }`}
                            >
                              {eta}s
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Next signal highlight */}
              {nextSignal && (
                <div className="rounded-lg bg-[hsl(var(--secondary))] px-3 py-2 text-sm">
                  <span className="text-[hsl(var(--secondary-foreground))]">
                    Next: <strong>{nextSignal.name}</strong> — ETA{" "}
                    <strong className="font-mono tabular-nums">
                      {getEta(nextSignal.distanceKm, amb.currentDistanceKm, amb.speedKmh)}s
                    </strong>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
