import { Card, CardContent } from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NotificationCenterProps {
  notifications: any[];
}

export const NotificationCenter = ({ notifications }: NotificationCenterProps) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      {notifications.slice(-3).map((notification) => (
        <Card key={notification.id} className="mb-2 border-l-4 border-l-primary shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <Bell className="w-4 h-4 text-primary mr-2 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="p-1">
                <X className="w-3 h-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};