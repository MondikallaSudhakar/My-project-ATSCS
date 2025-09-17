import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ambulance, TrafficCone, Activity } from "lucide-react";
import { UserRole } from "@/pages/Index";

interface RoleSelectionProps {
  onRoleSelect: (role: UserRole) => void;
  onShowDemo: () => void;
}

export const RoleSelection = ({ onRoleSelect, onShowDemo }: RoleSelectionProps) => {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <Activity className="w-16 h-16 text-white mr-4" />
            <h1 className="text-5xl font-bold text-white text-shadow">
              Smart Emergency Traffic Management
            </h1>
          </div>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Intelligent traffic control system that automatically clears routes for ambulances, 
            reducing emergency response time and saving lives.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="card-hover bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-emergency rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Ambulance className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Ambulance Driver</h3>
              <p className="text-muted-foreground mb-6">
                Register your ambulance and get real-time route optimization with automatic traffic signal control.
              </p>
              <Button 
                onClick={() => onRoleSelect("ambulance")}
                className="btn-emergency w-full text-lg py-3"
              >
                Access Ambulance Control
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Welcome! Please log in to access real-time ambulance services and signal control.
              </p>
            </CardContent>
          </Card>

          <Card className="card-hover bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="bg-gradient-medical rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <TrafficCone className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Traffic Control</h3>
              <p className="text-muted-foreground mb-6">
                Monitor and manage traffic signals to ensure smooth emergency vehicle passage.
              </p>
              <Button 
                onClick={() => onRoleSelect("traffic")}
                className="btn-medical w-full text-lg py-3"
              >
                Smart Traffic Dashboard
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Manage signals & vehicle flow with real-time emergency response.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live Demo Section */}
        <div className="text-center">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                See the System in Action
              </h3>
              <p className="text-white/90 mb-6">
                Watch how our system automatically clears traffic routes for emergency vehicles
              </p>
              <Button 
                onClick={onShowDemo}
                variant="outline"
                className="bg-white/20 text-white border-white/30 hover:bg-white/30 text-lg py-3 px-8"
              >
                View Live Demo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {[
            { title: "Real-Time Route Optimization", desc: "AI-powered path finding with live traffic data" },
            { title: "Automatic Signal Control", desc: "Smart traffic lights clear the way automatically" },
            { title: "Hospital Integration", desc: "Direct communication with destination hospitals" }
          ].map((feature, idx) => (
            <div key={idx} className="text-center text-white">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl font-bold">{idx + 1}</span>
              </div>
              <h4 className="font-semibold mb-2">{feature.title}</h4>
              <p className="text-sm text-white/80">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};