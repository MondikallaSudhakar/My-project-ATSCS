import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Ambulance, MapPin, Hospital, LogOut, Activity, Clock } from "lucide-react";
import { User, AppPage } from "@/pages/Index";
import { DriverChatbot } from "@/components/DriverChatbot";
import { LiveAmbulanceMap } from "@/components/LiveAmbulanceMap";
import { supabase } from "@/integrations/supabase/client";

interface AmbulanceDashboardProps {
  user: User;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
}

export const AmbulanceDashboard = ({ user, onNavigate, onLogout }: AmbulanceDashboardProps) => {
  const [status, setStatus] = useState<"available" | "on-duty">("available");
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  // Register vehicle in Supabase on mount
  useEffect(() => {
    const registerVehicle = async () => {
      const { data, error } = await supabase.from("vehicles").insert({
        driver_name: user.name,
        vehicle_number: user.vehicleNumber || "AP01-AB-1234",
        status: "available",
        current_lat: 13.5550,
        current_lng: 78.8738,
      }).select().single();

      if (data) setVehicleId(data.id);
      if (error) console.error("Vehicle register error:", error);
    };
    registerVehicle();
  }, [user.name, user.vehicleNumber]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <div className="bg-gradient-emergency rounded-full w-12 h-12 flex items-center justify-center mr-4">
              <Ambulance className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Ambulance Control</h1>
              <p className="text-muted-foreground">Vehicle: {user.vehicleNumber}</p>
            </div>
          </div>
          <Button onClick={onLogout} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Driver Status
              </CardTitle>
              <Badge 
                variant={status === "available" ? "default" : "destructive"}
                className={status === "available" ? "bg-green-500" : ""}
              >
                {status === "available" ? "Available" : "On Duty"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {user.name}
                </div>
                <p className="text-sm text-muted-foreground">Driver Name</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {user.mobile}
                </div>
                <p className="text-sm text-muted-foreground">Contact</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {status === "available" ? "Ready" : "In Service"}
                </div>
                <p className="text-sm text-muted-foreground">Current Status</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <MapPin className="w-6 h-6 mr-2" />
                Patient Pickup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Respond to emergency calls and pick up patients from their location.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-primary" />
                  Real-time route optimization
                </div>
                <div className="flex items-center text-sm">
                  <Activity className="w-4 h-4 mr-2 text-primary" />
                  Automatic traffic signal control
                </div>
              </div>
              <Button 
                onClick={() => onNavigate("pickup")}
                className="btn-emergency w-full"
                disabled={status === "on-duty"}
              >
                Start Pickup Mission
              </Button>
            </CardContent>
          </Card>

          <Card className="card-hover">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <Hospital className="w-6 h-6 mr-2" />
                Hospital Drop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Transport patients to the nearest appropriate hospital facility.
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <Clock className="w-4 h-4 mr-2 text-blue-600" />
                  Nearest hospital detection
                </div>
                <div className="flex items-center text-sm">
                  <Activity className="w-4 h-4 mr-2 text-blue-600" />
                  Hospital ETA notifications
                </div>
              </div>
              <Button 
                onClick={() => onNavigate("drop")}
                className="btn-medical w-full"
                disabled={status === "on-duty"}
              >
                Start Hospital Drop
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Live Ambulance Map */}
        <div className="mt-6">
          <LiveAmbulanceMap vehicleId={vehicleId || undefined} isEmergency={true} />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[
            { label: "Today's Runs", value: "3", color: "text-primary" },
            { label: "Response Time", value: "4.2 min", color: "text-green-600" },
            { label: "Distance Covered", value: "127 km", color: "text-blue-600" },
            { label: "Lives Saved", value: "8", color: "text-purple-600" }
          ].map((stat, idx) => (
            <Card key={idx} className="text-center">
              <CardContent className="p-4">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Emergency Info */}
        <Card className="mt-6 border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start">
              <Activity className="w-5 h-5 text-orange-600 mr-3 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-800">Emergency Protocol</h4>
                <p className="text-sm text-orange-700 mt-1">
                  Use the AI chatbot (bottom-right) for hands-free operation. Say "Patient critical" to alert hospitals, 
                  "Need backup" for police, or ask about nearest ICU availability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver Chatbot */}
      <DriverChatbot 
        vehicleId={vehicleId || undefined}
        driverName={user.name}
        currentLat={13.5550}
        currentLng={78.8738}
      />
    </div>
  );
};