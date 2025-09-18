import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Pause, RotateCcw, MapPin, Clock } from "lucide-react";

interface LiveDemoProps {
  onBack: () => void;
}

interface TrafficSignal {
  id: string;
  name: string;
  status: "red" | "yellow" | "green";
  distance: number;
}

export const LiveDemo = ({ onBack }: LiveDemoProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [ambulancePosition, setAmbulancePosition] = useState(0);
  const [currentSignal, setCurrentSignal] = useState(0);
  const [signals, setSignals] = useState<TrafficSignal[]>([
    { id: "1", name: "Bus Stand Junction", status: "red", distance: 0 },
    { id: "2", name: "Market Circle", status: "red", distance: 25 },
    { id: "3", name: "RS Colony", status: "red", distance: 50 },
    { id: "4", name: "Hospital Junction", status: "red", distance: 75 }
  ]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setAmbulancePosition(prev => {
          // Check if ambulance should return (at 100% position)
          if (prev >= 100) {
            const newPos = prev - 1; // Move backwards
            if (newPos <= 0) {
              setIsPlaying(false);
              return 0;
            }
            return newPos;
          }
          
          const newPos = prev + 1; // Move forwards
          
          // Check if ambulance is approaching a signal (within 2km = 5% of progress)
          signals.forEach((signal, index) => {
            const signalPos = (signal.distance / 100) * 100;
            if (Math.abs(newPos - signalPos) <= 5 && signal.status !== "green") {
              setSignals(prevSignals => 
                prevSignals.map((s, i) => ({
                  ...s,
                  status: i === index ? "green" : "red"
                }))
              );
              setCurrentSignal(index);
            }
          });

          // Continue to destination
          return newPos;
        });
      }, 100);
    }

    return () => clearInterval(interval);
  }, [isPlaying, signals]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setAmbulancePosition(0);
    setCurrentSignal(0);
    setSignals(prev => prev.map(s => ({ ...s, status: "red" })));
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "red": return "bg-red-500";
      case "yellow": return "bg-yellow-500";
      case "green": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero p-4">
      <div className="max-w-6xl mx-auto">
        <Button 
          onClick={onBack} 
          variant="ghost" 
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-4">Live System Demo</h1>
          <p className="text-xl text-white/90">
            Watch how our smart system automatically clears traffic routes for emergency vehicles
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Demo Controls */}
          <Card className="bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Demo Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={handlePlayPause}
                  className={isPlaying ? "btn-emergency" : "btn-success"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isPlaying ? "Pause" : "Start Demo"}
                </Button>
                <Button onClick={handleReset} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Demo Route</h4>
                <div className="text-sm text-muted-foreground">
                  <p><strong>Start:</strong> Madanapalle Bus Stand</p>
                  <p><strong>Destination:</strong> Government Hospital</p>
                  <p><strong>Vehicle:</strong> AP01-AB-1234</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Progress</h4>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-emergency h-3 rounded-full transition-all duration-300"
                    style={{ width: `${ambulancePosition}%` }}
                  ></div>
                </div>
                <p className="text-sm text-muted-foreground">{Math.round(ambulancePosition)}% Complete</p>
              </div>
            </CardContent>
          </Card>

          {/* Live Route Visualization */}
          <Card className="lg:col-span-2 bg-white/95 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Live Route Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Route Path */}
              <div className="relative bg-gray-100 rounded-lg p-6 h-64">
                {/* Road */}
                <div className="absolute top-1/2 left-4 right-4 h-16 bg-gray-600 rounded transform -translate-y-1/2">
                  {/* Road markings */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 border-t-2 border-dashed border-white transform -translate-y-1/2"></div>
                </div>

                {/* Traffic Signals */}
                {signals.map((signal, index) => (
                  <div 
                    key={signal.id}
                    className="absolute top-4"
                    style={{ left: `${20 + signal.distance * 0.6}%` }}
                  >
                    <div className="text-center">
                      <div className="bg-black rounded-lg p-2 mb-2 inline-block">
                        <div className={`w-4 h-4 rounded-full ${getStatusColor(signal.status)} shadow-lg`}></div>
                      </div>
                      <p className="text-xs font-medium">{signal.name}</p>
                    </div>
                  </div>
                ))}

                {/* Ambulance */}
                <div 
                  className="absolute top-1/2 transform -translate-y-1/2 transition-all duration-300"
                  style={{ left: `${15 + ambulancePosition * 0.7}%` }}
                >
                  <div className={`text-2xl ambulance-icon ${ambulancePosition >= 100 ? 'scale-x-[-1]' : ''}`}>🚑</div>
                  <div className="text-xs font-bold text-center mt-1">AP01-AB-1234</div>
                </div>

                {/* Start and End Points */}
                <div className="absolute top-4 left-4">
                  <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-medium">
                    🚌 Bus Stand
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                    🏥 Hospital
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Traffic Signal Status */}
        <div className="grid md:grid-cols-4 gap-4 mt-6">
          {signals.map((signal, index) => (
            <Card key={signal.id} className={`bg-white/95 backdrop-blur-sm ${index === currentSignal ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4 text-center">
                <div className={`w-8 h-8 rounded-full ${getStatusColor(signal.status)} mx-auto mb-2 shadow-lg`}></div>
                <h4 className="font-semibold text-sm">{signal.name}</h4>
                <Badge 
                  variant={signal.status === "green" ? "default" : "secondary"}
                  className={`mt-2 ${signal.status === "green" ? "bg-green-500" : ""}`}
                >
                  {signal.status.toUpperCase()}
                </Badge>
                {index === currentSignal && (
                  <p className="text-xs text-primary mt-1 font-medium">🚑 Approaching</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Real-time Notifications */}
        <Card className="mt-6 bg-white/95 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Live System Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isPlaying && (
                <>
                  <div className="flex items-center p-3 bg-red-50 rounded border-l-4 border-red-500">
                    <Clock className="w-4 h-4 text-red-600 mr-2" />
                    <div className="text-sm">
                      <p className="font-medium">Emergency Route Activated</p>
                      <p className="text-muted-foreground">Ambulance AP01-AB-1234 en route to Government Hospital</p>
                    </div>
                  </div>

                  {signals[currentSignal]?.status === "green" && (
                    <div className="flex items-center p-3 bg-green-50 rounded border-l-4 border-green-500">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2 pulse-emergency"></div>
                      <div className="text-sm">
                        <p className="font-medium">Signal Cleared: {signals[currentSignal]?.name}</p>
                        <p className="text-muted-foreground">Traffic light automatically switched to GREEN</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                    <MapPin className="w-4 h-4 text-blue-600 mr-2" />
                    <div className="text-sm">
                      <p className="font-medium">Hospital Notified</p>
                      <p className="text-muted-foreground">Government Hospital prepared for incoming patient</p>
                    </div>
                  </div>
                </>
              )}

              {!isPlaying && ambulancePosition === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  <p>Click "Start Demo" to see the system in action</p>
                </div>
              )}

              {ambulancePosition >= 100 && (
                <div className="flex items-center p-3 bg-green-50 rounded border-l-4 border-green-500">
                  <div className="text-sm">
                    <p className="font-medium">✅ Mission Complete</p>
                    <p className="text-muted-foreground">Patient successfully delivered to hospital</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};