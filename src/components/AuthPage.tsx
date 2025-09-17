import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Shield, AlertTriangle, Mic, MicOff } from "lucide-react";
import { UserRole, User } from "@/pages/Index";
import { useToast } from "@/hooks/use-toast";

interface AuthPageProps {
  role: UserRole;
  onAuth: (user: User) => void;
  onBack: () => void;
}

// Mock government database
const GOVERNMENT_DATABASE = [
  { name: "Dr. Rajesh Kumar", mobile: "9876543210", vehicleNumber: "AP01-AB-1234" },
  { name: "Amit Sharma", mobile: "9876543211", vehicleNumber: "AP02-CD-5678" },
  { name: "Priya Singh", mobile: "9876543212", vehicleNumber: "AP03-EF-9012" },
];

export const AuthPage = ({ role, onAuth, onBack }: AuthPageProps) => {
  const [isLogin, setIsLogin] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    vehicleNumber: "",
    junctionName: "",
    password: "",
    confirmPassword: ""
  });
  const { toast } = useToast();

  const handleVoiceRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      // Simulate voice recognition
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          name: "Dr. Rajesh Kumar",
          mobile: "9876543210"
        }));
        setIsRecording(false);
        toast({
          title: "Voice Input Processed",
          description: "Your details have been filled automatically.",
        });
      }, 3000);
    } else {
      setIsRecording(false);
    }
  };

  const validateAmbulance = (name: string, mobile: string, vehicleNumber: string) => {
    return GOVERNMENT_DATABASE.some(entry => 
      entry.name.toLowerCase() === name.toLowerCase() &&
      entry.mobile === mobile &&
      entry.vehicleNumber.toUpperCase() === vehicleNumber.toUpperCase()
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Please ensure both passwords match.",
      });
      return;
    }

    // Verify ambulance against government database
    if (role === "ambulance" && !isLogin) {
      if (!validateAmbulance(formData.name, formData.mobile, formData.vehicleNumber)) {
        toast({
          variant: "destructive",
          title: "Verification Failed",
          description: "Your details don't match our government database. Contact authorities.",
        });
        return;
      }
    }

    const user: User = {
      id: Date.now().toString(),
      name: formData.name,
      mobile: formData.mobile,
      email: formData.email,
      role: role,
      vehicleNumber: role === "ambulance" ? formData.vehicleNumber : undefined,
      junctionName: role === "traffic" ? formData.junctionName : undefined,
      isVerified: true
    };

    toast({
      title: "Success!",
      description: `${isLogin ? "Login" : "Registration"} successful. Welcome to the system!`,
    });

    onAuth(user);
  };

  const roleConfig = {
    ambulance: {
      title: "Ambulance Driver",
      icon: "🚑",
      color: "emergency"
    },
    traffic: {
      title: "Traffic Junction",
      icon: "🚥",
      color: "medical"
    }
  };

  const config = roleConfig[role || "ambulance"];

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button
          onClick={onBack}
          variant="ghost"
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Role Selection
        </Button>

        <Card className="bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="text-4xl mb-2">{config.icon}</div>
            <CardTitle className="text-2xl">
              {config.title} {isLogin ? "Login" : "Registration"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <div className="flex gap-2">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter your full name"
                    required
                  />
                  {role === "ambulance" && (
                    <Button
                      type="button"
                      onClick={handleVoiceRecording}
                      className={`px-3 ${isRecording ? 'bg-red-500 pulse-emergency' : 'bg-blue-500'}`}
                    >
                      {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  )}
                </div>
                {isRecording && (
                  <p className="text-sm text-blue-600 mt-1">🎤 Listening... Speak your details</p>
                )}
              </div>

              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  placeholder="Enter mobile number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  required
                />
              </div>

              {role === "ambulance" && (
                <div>
                  <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                  <Input
                    id="vehicleNumber"
                    value={formData.vehicleNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleNumber: e.target.value.toUpperCase() }))}
                    placeholder="AP01-AB-1234"
                    required
                  />
                </div>
              )}

              {role === "traffic" && (
                <div>
                  <Label htmlFor="junctionName">Junction Name</Label>
                  <Input
                    id="junctionName"
                    value={formData.junctionName}
                    onChange={(e) => setFormData(prev => ({ ...prev, junctionName: e.target.value }))}
                    placeholder="Enter junction name"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Enter password"
                  required
                />
              </div>

              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Shield className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Verification Required</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Your details will be verified with the Government database. Only verified ambulances and junction officers are allowed to use this system.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className={`w-full ${config.color === 'emergency' ? 'btn-emergency' : 'btn-medical'}`}
              >
                {isLogin ? "Login" : "Register & Enter"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Need to register?" : "Already have an account?"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};