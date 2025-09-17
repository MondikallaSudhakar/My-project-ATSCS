import { useState } from "react";
import { RoleSelection } from "@/components/RoleSelection";
import { AuthPage } from "@/components/AuthPage";
import { AmbulanceDashboard } from "@/components/AmbulanceDashboard";
import { TrafficDashboard } from "@/components/TrafficDashboard";
import { PickupFlow } from "@/components/PickupFlow";
import { DropFlow } from "@/components/DropFlow";
import { LiveDemo } from "@/components/LiveDemo";
import { NotificationCenter } from "@/components/NotificationCenter";

export type UserRole = "ambulance" | "traffic" | null;
export type AppPage = "role-selection" | "auth" | "dashboard" | "pickup" | "drop" | "demo";

export interface User {
  id: string;
  name: string;
  mobile: string;
  email: string;
  role: UserRole;
  vehicleNumber?: string;
  junctionName?: string;
  isVerified: boolean;
}

const Index = () => {
  const [currentPage, setCurrentPage] = useState<AppPage>("role-selection");
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setCurrentPage("auth");
  };

  const handleAuth = (user: User) => {
    setCurrentUser(user);
    setCurrentPage("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedRole(null);
    setCurrentPage("role-selection");
  };

  const handleNavigate = (page: AppPage) => {
    setCurrentPage(page);
  };

  const addNotification = (notification: any) => {
    setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
  };

  return (
    <div className="min-h-screen bg-background">
      {currentPage === "role-selection" && (
        <RoleSelection onRoleSelect={handleRoleSelect} onShowDemo={() => setCurrentPage("demo")} />
      )}
      
      {currentPage === "auth" && (
        <AuthPage 
          role={selectedRole} 
          onAuth={handleAuth} 
          onBack={() => setCurrentPage("role-selection")}
        />
      )}
      
      {currentPage === "dashboard" && currentUser?.role === "ambulance" && (
        <AmbulanceDashboard 
          user={currentUser}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      )}
      
      {currentPage === "dashboard" && currentUser?.role === "traffic" && (
        <TrafficDashboard 
          user={currentUser}
          onLogout={handleLogout}
          notifications={notifications}
        />
      )}
      
      {currentPage === "pickup" && (
        <PickupFlow 
          user={currentUser}
          onBack={() => setCurrentPage("dashboard")}
          onAddNotification={addNotification}
        />
      )}
      
      {currentPage === "drop" && (
        <DropFlow 
          user={currentUser}
          onBack={() => setCurrentPage("dashboard")}
          onAddNotification={addNotification}
        />
      )}
      
      {currentPage === "demo" && (
        <LiveDemo onBack={() => setCurrentPage("role-selection")} />
      )}

      <NotificationCenter notifications={notifications} />
    </div>
  );
};

export default Index;