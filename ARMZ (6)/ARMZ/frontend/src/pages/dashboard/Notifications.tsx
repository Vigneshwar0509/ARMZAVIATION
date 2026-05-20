import React, { useState, useEffect } from "react";
import { Bell, Briefcase, BookOpen, Calendar, Loader2, Trash2, Filter, CheckCircle2, Award, Zap, Mail, CalendarClock, Mic } from "lucide-react";
import { useAuthStore } from "@/src/store/authStore";
import { apiService } from "@/src/services/api";
import EmptyState from "@/src/components/common/EmptyState";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: string;
  icon: string;
  timestamp: string;
  read: boolean;
  actionUrl: string;
  priority: string;
}

export default function Notifications() {
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await apiService.getNotifications(user?.id || 'student1');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (error: any) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
      if (error?.response?.status === 401 || error?.response?.status === 429 || error?.response?.status === 400) {
        sessionStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await apiService.markNotificationAsRead(notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead(user?.id || 'student1');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleDelete = async (notifId: string) => {
    try {
      await apiService.deleteNotification(notifId);
      setNotifications(prev => prev.filter(n => n.id !== notifId));
      toast.success("Notification deleted");
    } catch (error) {
      toast.error("Failed to delete notification");
    }
  };

  const handleDeleteAll = async () => {
    if (notifications.length === 0) {
      toast.success("No notifications to delete");
      return;
    }
    try {
      await Promise.all(
        notifications.map(n => apiService.deleteNotification(n.id))
      );
      setNotifications([]);
      setUnreadCount(0);
      toast.success("All notifications cleared");
    } catch (error) {
      toast.error("Failed to clear notifications");
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'job': return Briefcase;
      case 'course': return BookOpen;
      case 'event': return Calendar;
      case 'webinar': return CalendarClock;
      case 'interview': return Mic;
      case 'digest': return Mail;
      case 'application': return CheckCircle2;
      case 'achievement': return Award;
      default: return Bell;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'job': return 'bg-purple-100/50 text-purple-700';
      case 'course': return 'bg-green-100/50 text-green-700';
      case 'event': return 'bg-orange-100/50 text-orange-700';
      case 'webinar': return 'bg-indigo-100/50 text-indigo-700';
      case 'interview': return 'bg-rose-100/50 text-rose-700';
      case 'digest': return 'bg-cyan-100/50 text-cyan-700';
      case 'application': return 'bg-blue-100/50 text-blue-700';
      case 'achievement': return 'bg-amber-100/50 text-amber-700';
      default: return 'bg-slate-100/50 text-slate-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100/50 text-red-700';
      case 'medium': return 'bg-yellow-100/50 text-yellow-700';
      case 'low': return 'bg-slate-100/50 text-slate-700';
      default: return 'bg-slate-100/50 text-slate-700';
    }
  };

  const getPriorityBorderClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-yellow-500';
      default: return 'border-slate-500';
    }
  };

  const filteredNotifications = filterType === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filterType);

  const timeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Notifications</h1>
          <p className="text-slate-500">Stay updated with the latest alerts and news.</p>
        </div>
        {unreadCount > 0 && (
          <div className="flex gap-3">
            <motion.button
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              onClick={handleMarkAllAsRead}
              className="px-6 py-2 bg-purple-100/50 text-purple-700 font-semibold rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark all as read ({unreadCount})
            </motion.button>
            {notifications.length > 0 && (
              <motion.button
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                onClick={handleDeleteAll}
                className="px-6 py-2 bg-red-100/50 text-red-700 font-semibold rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear all
              </motion.button>
            )}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      {notifications.length > 0 && (
        <div className="glass-card p-4 flex items-center gap-3 overflow-x-auto">
          <Filter className="h-5 w-5 text-slate-400 shrink-0" />
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
              filterType === 'all' 
                ? 'bg-purple-600 text-white' 
                : 'bg-white/20 text-slate-600 hover:bg-white/30'
            }`}
          >
            All ({notifications.length})
          </button>
          {['job', 'course', 'event', 'webinar', 'interview', 'digest', 'application', 'achievement'].map(type => {
            const count = notifications.filter(n => n.type === type).length;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition-all capitalize ${
                  filterType === type 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-white/20 text-slate-600 hover:bg-white/30'
                }`}
              >
                {type} ({count})
              </button>
            );
          })}
        </div>
      )}

      {filteredNotifications.length === 0 ? (
        <EmptyState 
          icon={Bell}
          title="All caught up!"
          description="You don't have any notifications in this category. We'll alert you when something important happens."
          actionLabel="Go to Dashboard"
          actionPath="/dashboard"
        />
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.map((n) => {
              const IconComponent = getIcon(n.type);
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  className={`glass-card p-6 rounded-2xl border-l-4 transition-all hover:shadow-lg ${
                    !n.read 
                      ? `${getPriorityBorderClass(n.priority)} bg-white/40`
                      : 'border-slate-200 bg-white/20'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl shrink-0 ${getColorClasses(n.type)}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-lg font-bold text-slate-900">{n.title}</h4>
                            {!n.read && (
                              <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest ${getPriorityColor(n.priority)}`}>
                                {n.priority}
                              </div>
                            )}
                          </div>
                          <p className="text-slate-600 leading-relaxed text-sm">{n.description}</p>
                          <p className="text-xs text-slate-400 mt-2">{timeAgo(n.timestamp)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!n.read && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              title="Mark as read"
                              className="p-2 hover:bg-white/30 rounded-lg transition-colors"
                            >
                              <Zap className="h-4 w-4 text-purple-600" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(n.id)}
                            title="Delete notification"
                            className="p-2 hover:bg-red-100/30 rounded-lg transition-colors text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
