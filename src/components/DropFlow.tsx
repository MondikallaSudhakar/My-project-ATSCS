import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Hospital, Navigation, MapPin, Clock, Play } from "lucide-react";
import { User } from "@/pages/Index";
import { HospitalMap } from "@/components/HospitalMap";
import { useToast } from "@/hooks/use-toast";

interface DropFlowProps {
  user: User;
  onBack: () => void;
  onAddNotification: (notification: any) => void;
}

const NEARBY_HOSPITALS = [
  { id: "1", name: "Government Hospital Madanapalle", distance: "2.1 km", speciality: "General", eta: "6 min" },
  { id: "2", name: "Apollo Clinic", distance: "3.4 km", speciality: "Cardiology", eta: "9 min" },
  { id: "3", name: "Care Hospital", distance: "1.8 km", speciality: "Emergency", eta: "5 min" },
  { id: "4", name: "Sri Venkateswara Hospital", distance: "4.2 km", speciality: "Trauma", eta: "12 min" },
];

export const DropFlow = ({ user, onBack, onAddNotification }: DropFlowProps) => {
  const [currentStep, setCurrentStep] = useState<"form" | "route" | "completed">("form");
  const [formData, setFormData] = useState({
    currentLocation: "",
    selectedHospital: "",
    patientCondition: "stable",
    specialCare: ""
  });
  const [routeActive, setRouteActive] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Auto-detect current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            currentLocation: "Madanapalle Bus Stand (Current Location)"
          }));
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  const selectedHospital = NEARBY_HOSPITALS.find(h => h.id === formData.selectedHospital);

  const handleEmergencyStart = () => {
    if (!selectedHospital) return;
    
    setCurrentStep("route");
    setRouteActive(true);
    
    // Send notifications
    onAddNotification({
      title: "Hospital Drop Route Activated",
      message: `Ambulance ${user.vehicleNumber} en route to ${selectedHospital.name}`,
      timestamp: new Date().toISOString(),
      type: "emergency"
    });

    // Notify hospital
    onAddNotification({
      title: "Hospital Notification",
      message: `${selectedHospital.name} notified. ETA: ${selectedHospital.eta}`,
      timestamp: new Date().toISOString(),
      type: "hospital"
    });

    toast({
      title: "Emergency Route Activated",
      description: `${selectedHospital.name} has been notified of your arrival.`,
    });
  };

  const handleCompleteTrip = () => {
    setCurrentStep("completed");
    setRouteActive(false);
    
    toast({
      title: "Patient Delivered",
      description: "Patient successfully delivered to hospital.",
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
              <CardTitle className="flex items-center text-blue-600">
                <Hospital className="w-6 h-6 mr-2" />
                Hospital Drop Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="current">Current Location</Label>
                    <Input
                      id="current"
                      value={formData.currentLocation}
                      onChange={(e) => setFormData(prev => ({ ...prev, currentLocation: e.target.value }))}
                      placeholder="Auto-detected via GPS"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="hospital">Select Hospital</Label>
                    <Select onValueChange={(value) => setFormData(prev => ({ ...prev, selectedHospital: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose nearest hospital" />
                      </SelectTrigger>
                      <SelectContent>
                        {NEARBY_HOSPITALS.map((hospital) => (
                          <SelectItem key={hospital.id} value={hospital.id}>
                            <div className="flex flex-col">
                              <span className="font-medium">{hospital.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {hospital.distance} • {hospital.speciality} • ETA: {hospital.eta}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="condition">Patient Condition</Label>
                    <Select 
                      defaultValue="stable"
                      onValueChange={(value) => setFormData(prev => ({ ...prev, patientCondition: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">Critical</SelectItem>
                        <SelectItem value="serious">Serious</SelectItem>
                        <SelectItem value="stable">Stable</SelectItem>
                        <SelectItem value="minor">Minor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="care">Special Care Requirements</Label>
                    <Input
                      id="care"
                      value={formData.specialCare}
                      onChange={(e) => setFormData(prev => ({ ...prev, specialCare: e.target.value }))}
                      placeholder="e.g., Oxygen support, cardiac monitor"
                    />
                  </div>

                  <Button 
                    onClick={handleEmergencyStart}
                    className="btn-medical w-full text-lg py-3"
                    disabled={!formData.selectedHospital}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Emergency End Note - Start Route
                  </Button>
                </div>

                <div className="space-y-4">
                  <Card className="bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-lg">Nearby Hospitals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {NEARBY_HOSPITALS.map((hospital) => (
                          <div 
                            key={hospital.id} 
                            className={`p-3 rounded border cursor-pointer transition-colors ${
                              formData.selectedHospital === hospital.id 
                                ? 'border-blue-500 bg-blue-100' 
                                : 'border-gray-200 hover:border-blue-300'
                            }`}
                            onClick={() => setFormData(prev => ({ ...prev, selectedHospital: hospital.id }))}
                          >
                            <h4 className="font-medium">{hospital.name}</h4>
                            <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
                              <span>{hospital.speciality}</span>
                              <span className="flex items-center">
                                <MapPin className="w-3 h-3 mr-1" />
                                {hospital.distance}
                              </span>
                            </div>
                            <div className="flex items-center text-sm mt-1">
                              <Clock className="w-3 h-3 mr-1 text-green-600" />
                              <span className="text-green-600">ETA: {hospital.eta}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {selectedHospital && (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-green-800 mb-2">Selected Hospital</h4>
                        <p className="font-medium">{selectedHospital.name}</p>
                        <p className="text-sm text-green-700">
                          Distance: {selectedHospital.distance} • ETA: {selectedHospital.eta}
                        </p>
                        <p className="text-sm text-green-700">
                          Speciality: {selectedHospital.speciality}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === "route" && selectedHospital && (
          <div className="space-y-6">
            <Card className="border-blue-500 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="bg-blue-500 rounded-full w-3 h-3 mr-3 pulse-emergency"></div>
                  <div>
                    <h3 className="font-bold text-blue-800">Hospital Drop Route Active</h3>
                    <p className="text-sm">Destination: {selectedHospital.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Live Route to Hospital</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <HospitalMap showRoute={true} />
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
                      <div className="flex justify-between">
                        <span>Distance</span>
                        <span className="font-bold">{selectedHospital.distance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>ETA</span>
                        <span className="font-bold text-blue-600">{selectedHospital.eta}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hospital Notified</span>
                        <span className="font-bold text-green-600">✓ Yes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Patient Info</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Condition:</span>
                        <span className={`font-medium ${
                          formData.patientCondition === 'critical' ? 'text-red-600' :
                          formData.patientCondition === 'serious' ? 'text-orange-600' :
                          'text-green-600'
                        }`}>
                          {formData.patientCondition.toUpperCase()}
                        </span>
                      </div>
                      {formData.specialCare && (
                        <div>
                          <span className="text-sm font-medium">Special Care:</span>
                          <p className="text-sm text-muted-foreground">{formData.specialCare}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Hospital Preparation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span>Emergency room alerted</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span>Medical team prepared</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                        <span>Bed reserved</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button 
                  onClick={handleCompleteTrip}
                  className="btn-success w-full"
                >
                  Patient Delivered - Complete
                </Button>
              </div>
            </div>
          </div>
        )}

        {currentStep === "completed" && (
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="text-6xl mb-4">🏥</div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Patient Delivered</h2>
              <p className="text-muted-foreground mb-4">
                Patient successfully delivered to {selectedHospital?.name}
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