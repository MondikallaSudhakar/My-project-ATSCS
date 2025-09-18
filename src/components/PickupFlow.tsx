import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MapPin, Navigation, Mic, MicOff, Play } from "lucide-react";
import { User } from "@/pages/Index";
import { HospitalMap } from "@/components/HospitalMap";
import { useToast } from "@/hooks/use-toast";

interface PickupFlowProps {
  user: User;
  onBack: () => void;
  onAddNotification: (notification: any) => void;
}

export const PickupFlow = ({ user, onBack, onAddNotification }: PickupFlowProps) => {
  const [currentStep, setCurrentStep] = useState<"form" | "route" | "completed">("form");
  const [isRecording, setIsRecording] = useState(false);
  const [formData, setFormData] = useState({
    sourceLocation: "",
    destinationLocation: "",
    patientName: "",
    emergency: "high"
  });
  const [routeActive, setRouteActive] = useState(false);
  const [routeInfo, setRouteInfo] = useState({ 
    distance: "0 km", 
    duration: "0 min",
    summary: "",
    startAddress: "",
    endAddress: "",
    signals: [] as string[],
    steps: [] as string[]
  });
  const { toast } = useToast();

  const handleVoiceInput = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulate voice recognition
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          sourceLocation: "Madanapalle Bus Stand",
          destinationLocation: "Government Hospital, Madanapalle",
          patientName: "Emergency Patient"
        }));
        setIsRecording(false);
        toast({
          title: "Voice Input Processed",
          description: "Location details filled automatically.",
        });
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const handleEmergencyStart = () => {
    setCurrentStep("route");
    setRouteActive(true);
    
    // Send notifications to traffic junctions
    onAddNotification({
      title: "Emergency Route Activated",
      message: `Ambulance ${user.vehicleNumber} en route: ${formData.sourceLocation} → ${formData.destinationLocation}`,
      timestamp: new Date().toISOString(),
      type: "emergency"
    });

    toast({
      title: "Emergency Route Activated",
      description: "Traffic signals are being notified along your route.",
    });
  };

  const handleCompleteTrip = () => {
    setCurrentStep("completed");
    setRouteActive(false);
    
    toast({
      title: "Mission Completed",
      description: "Patient successfully picked up and route cleared.",
    });

    setTimeout(() => {
      onBack();
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        {currentStep === "form" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <MapPin className="w-6 h-6 mr-2" />
                Patient Pickup Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="source">Pickup Location</Label>
                    <div className="flex gap-2">
                      <Input
                        id="source"
                        value={formData.sourceLocation}
                        onChange={(e) => setFormData(prev => ({ ...prev, sourceLocation: e.target.value }))}
                        placeholder="Enter pickup address"
                        required
                      />
                      <Button
                        type="button"
                        onClick={handleVoiceInput}
                        className={`px-3 ${isRecording ? 'bg-red-500 pulse-emergency' : 'bg-blue-500'}`}
                      >
                        {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </Button>
                    </div>
                    {isRecording && (
                      <p className="text-sm text-blue-600 mt-1">🎤 Listening... Say the pickup location</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="destination">Destination Hospital</Label>
                    <Input
                      id="destination"
                      value={formData.destinationLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, destinationLocation: e.target.value }))}
                      placeholder="Enter hospital name or address"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="patient">Patient Name (Optional)</Label>
                    <Input
                      id="patient"
                      value={formData.patientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                      placeholder="Patient identification"
                    />
                  </div>

                  <Button 
                    onClick={handleEmergencyStart}
                    className="btn-emergency w-full text-lg py-3"
                    disabled={!formData.sourceLocation || !formData.destinationLocation}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Emergency End Note - Start Route
                  </Button>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-3">Quick Info</h4>
                  <div className="space-y-2 text-sm text-blue-700">
                    <p>• Voice input available for hands-free operation</p>
                    <p>• Route will be optimized in real-time</p>
                    <p>• Traffic signals will be notified automatically</p>
                    <p>• Hospital will receive ETA notification</p>
                  </div>
                  
                  <div className="mt-4 p-3 bg-white rounded border">
                    <h5 className="font-medium mb-2">Driver: {user.name}</h5>
                    <p className="text-sm">Vehicle: {user.vehicleNumber}</p>
                    <p className="text-sm">Contact: {user.mobile}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "route" && (
          <div className="space-y-6">
            {/* Notification Section - Separate from route display */}
            <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
              <Card className="border-primary bg-red-50 shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="bg-primary rounded-full w-3 h-3 mr-3 pulse-emergency"></div>
                    <div>
                      <h3 className="font-bold text-primary">Emergency Route Active</h3>
                      <p className="text-sm">Route: {formData.sourceLocation} → {formData.destinationLocation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Address Information Section */}
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-800">Route Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-blue-700">From:</p>
                    <p className="text-sm text-blue-900">{routeInfo.startAddress || formData.sourceLocation}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-700">To:</p>
                    <p className="text-sm text-blue-900">{routeInfo.endAddress || formData.destinationLocation}</p>
                  </div>
                </div>
                {routeInfo.steps && routeInfo.steps.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-blue-700 mb-2">Route Steps:</p>
                    <div className="space-y-1">
                      {routeInfo.steps.map((step, index) => (
                        <div key={index} className="flex items-center text-xs text-blue-800">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Live Route Map</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HospitalMap 
                      showRoute={true} 
                      startLocation={formData.sourceLocation}
                      destinationLocation={formData.destinationLocation}
                      onRouteUpdate={setRouteInfo}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Route Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="space-y-2 border-b pb-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium">From:</span>
                          <span className="text-sm text-right max-w-[200px]">{routeInfo.startAddress || formData.sourceLocation}</span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium">To:</span>
                          <span className="text-sm text-right max-w-[200px]">{routeInfo.endAddress || formData.destinationLocation}</span>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>Distance</span>
                        <span className="font-bold">{routeInfo.distance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ETA</span>
                        <span className="font-bold text-primary">{routeInfo.duration}</span>
                      </div>
                      {routeInfo.summary && (
                        <div className="flex justify-between">
                          <span>Route</span>
                          <span className="text-sm text-right max-w-[200px]">{routeInfo.summary}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Signals Cleared</span>
                        <span className="font-bold text-green-600">4/4</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Next Signals</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {routeInfo.signals?.length > 0 ? routeInfo.signals.map((signal, idx) => (
                        <div key={signal} className="flex items-center justify-between">
                          <span className="text-sm">{signal}</span>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs text-green-600">Clear</span>
                          </div>
                        </div>
                      )) : ["Market Circle", "RS Colony", "Hospital Junction"].map((signal, idx) => (
                        <div key={signal} className="flex items-center justify-between">
                          <span className="text-sm">{signal}</span>
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-xs text-green-600">Clear</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={handleCompleteTrip}
                  className="btn-success w-full"
                >
                  Patient Picked Up - Complete
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === "completed" && (
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Mission Completed</h2>
              <p className="text-muted-foreground mb-4">
                Patient successfully picked up from {formData.sourceLocation}
              </p>
              <p className="text-sm text-muted-foreground">
                Returning to dashboard in 3 seconds...
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};