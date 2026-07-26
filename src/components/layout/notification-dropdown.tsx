"use client";

import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Mail, Users, Rocket, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/firebase/auth";
import { collection, query, onSnapshot, orderBy, limit, doc, writeBatch, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  icon: "campaign" | "lead" | "template" | "system" | "mail";
  createdAt: number;
  read: boolean;
}

export function NotificationDropdown() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as AppNotification);
      });
      
      // If there are no notifications, let's create a welcome one (for demo purposes if empty)
      if (notifs.length === 0 && user) {
        const welcomeNotif: AppNotification = {
          id: "welcome-1",
          title: "Welcome to MailForge AI",
          message: "You're all set to create your first campaign.",
          type: "success",
          icon: "system",
          createdAt: Date.now(),
          read: false
        };
        setDoc(doc(db, "users", user.uid, "notifications", "welcome-1"), welcomeNotif);
      } else {
        setNotifications(notifs);
      }
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, "users", user.uid, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };

  const markAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    await setDoc(doc(db, "users", user.uid, "notifications", id), { read: true }, { merge: true });
  };

  const clearAll = async () => {
    if (!user || notifications.length === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(n => {
      batch.delete(doc(db, "users", user.uid, "notifications", n.id));
    });
    await batch.commit();
    setOpen(false);
  };

  const getIcon = (iconType: string, type: string) => {
    let colorClass = "text-blue-500";
    if (type === "success") colorClass = "text-green-500";
    if (type === "warning") colorClass = "text-yellow-500";
    if (type === "error") colorClass = "text-destructive";

    switch (iconType) {
      case "campaign": return <Rocket className={`h-4 w-4 ${colorClass}`} />;
      case "lead": return <Users className={`h-4 w-4 ${colorClass}`} />;
      case "template": return <Sparkles className={`h-4 w-4 ${colorClass}`} />;
      case "mail": return <Mail className={`h-4 w-4 ${colorClass}`} />;
      case "system":
      default: return <AlertCircle className={`h-4 w-4 ${colorClass}`} />;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-2 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-4 pb-2">
          <DropdownMenuLabel className="p-0 font-semibold text-base">Notifications</DropdownMenuLabel>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground" onClick={markAllAsRead}>
                <Check className="mr-1 h-3 w-3" /> Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10" onClick={clearAll}>
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <DropdownMenuSeparator className="m-0" />
        
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center p-4">
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1">Check back later for updates.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className={`flex gap-3 p-4 border-b border-border/50 hover:bg-muted/30 transition-colors last:border-0 ${notif.read ? 'opacity-70' : 'bg-primary/5'}`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getIcon(notif.icon, notif.type)}
                  </div>
                  <div className="flex flex-col flex-1 gap-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-sm leading-tight ${notif.read ? 'font-medium' : 'font-semibold'}`}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notif.message}
                    </p>
                    {!notif.read && (
                      <button 
                        onClick={(e) => markAsRead(notif.id, e)}
                        className="text-[10px] text-primary hover:underline self-start mt-1"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
