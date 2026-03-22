import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TrafficCone, LogOut, AlertTriangle, CheckCircle, Activity, MapPin } from "lucide-react";
import { User } from "@/pages/Index";
import { AmbulanceTracker } from "./AmbulanceTracker";

interface TrafficDashboardProps {
  user: User;
  onLogout: () => void;
  notifications: any[];
}

interface TrafficLight {
  id: string;
  status: "red" | "yellow" | "green";
  timeRemaining: number;
}

export const TrafficDashboard = ({ user, onLogout, notifications }: TrafficDashboardProps) => {
  const [trafficLights, setTrafficLights] = useState<TrafficLight[]>([
    { id: "North", status: "red", timeRemaining: 45 },
    { id: "South", status: "green", timeRemaining: 30 },
    { id: "East", status: "red", timeRemaining: 45 },
    { id: "West", status: "red", timeRemaining: 45 },
  ]);

  const [junctionStatus, setJunctionStatus] = useState<"clear" | "heavy" | "emergency">("clear");
  const [emergencyActive, setEmergencyActive] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTrafficLights(prev => prev.map(light => ({
        ...light,
        timeRemaining: Math.max(0, light.timeRemaining - 1)
      })));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleEmergencyOverride = () => {
    setEmergencyActive(true);
    setTrafficLights(prev => prev.map(light => ({
      ...light,
      status: light.id === "South" ? "green" : "red",
      timeRemaining: 120
    })));

    setTimeout(() => {
      setEmergencyActive(false);
    }, 120000);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "clear": return "bg-green-500";
      case "heavy": return "bg-yellow-500";
      case "emergency": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-medical rounded-full w-12 h-12 flex items-center justify-center mr-4">
              <TrafficCone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Traffic Control Center</h1>
              <p className="text-muted-foreground">Junction: {user.junctionName}</p>
            </div>
          </div>
          <Button onClick={onLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Emergency Alert */}
        {emergencyActive && (
          <Card className="mb-6 border-red-500 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-6 h-6 text-red-600 mr-3 pulse-emergency" />
                <div>
                  <h3 className="font-bold text-red-800">Emergency Vehicle Approaching</h3>
                  <p className="text-red-700">Ambulance AP01-AB-1234 approaching from North. Route cleared.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Traffic Light Control */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Live Traffic Signal Control
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {trafficLights.map((light) => (
                    <div key={light.id} className="text-center">
                      <h4 className="font-semibold mb-3">{light.id} Lane</h4>
                      <div className="flex justify-center space-x-2 mb-3">
                        <div className={`traffic-light ${light.status === 'red' ? 'traffic-red' : 'bg-gray-300'}`}></div>
                        <div className={`traffic-light ${light.status === 'yellow' ? 'traffic-yellow' : 'bg-gray-300'}`}></div>
                        <div className={`traffic-light ${light.status === 'green' ? 'traffic-green' : 'bg-gray-300'}`}></div>
                      </div>
                      <div className="text-lg font-bold">
                        {light.timeRemaining}s
                      </div>
                      <Badge variant={light.status === 'green' ? 'default' : 'secondary'}>
                        {light.status.toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-3">Junction Controls</h4>
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleEmergencyOverride}
                      className="btn-emergency"
                      disabled={emergencyActive}
                    >
                      Emergency Override
                    </Button>
                    <Button variant="outline">
                      Manual Control
                    </Button>
                    <Button variant="outline">
                      Reset to Auto
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status & Notifications */}
          <div className="space-y-6">
            {/* Junction Status */}
            <Card>
              <CardHeader>
                <CardTitle>Junction Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Traffic Flow</span>
                    <Badge className={getStatusColor(junctionStatus)}>
                      {junctionStatus.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Emergency Mode</span>
                    <Badge variant={emergencyActive ? "destructive" : "default"}>
                      {emergencyActive ? "ACTIVE" : "NORMAL"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>System Status</span>
                    <Badge className="bg-green-500">
                      ONLINE
                    </Badge>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setJunctionStatus("clear")}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Clear
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setJunctionStatus("heavy")}
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Report Heavy Traffic
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Notifications */}
            <Card>
              <CardHeader>
                <CardTitle>Live Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? notifications.map((notification) => (
                    <div key={notification.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                        <div className="text-sm">
                          <p className="font-medium">{notification.title}</p>
                          <p className="text-muted-foreground">{notification.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notification.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <p className="text-muted-foreground text-sm">No active notifications</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Today's Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Vehicles Passed", value: "1,247", color: "text-blue-600" },
                    { label: "Emergency Overrides", value: "3", color: "text-red-600" },
                    { label: "Avg Wait Time", value: "32s", color: "text-green-600" },
                    { label: "System Uptime", value: "99.8%", color: "text-purple-600" }
                  ].map((stat, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-sm">{stat.label}</span>
                      <span className={`font-bold ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};