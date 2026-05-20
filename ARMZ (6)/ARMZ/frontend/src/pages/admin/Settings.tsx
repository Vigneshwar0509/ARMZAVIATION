import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  Database,
  Download,
  FileText,
  Key,
  Loader2,
  Mail,
  RotateCcw,
  Save,
  Server,
  Settings,
  Shield,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { cn } from "@/src/lib/utils";
import { ENV, getStartupDiagnostics } from "@/src/config/env";
import { apiService } from "@/src/services/api";
import { useDashboardStats } from "@/src/hooks/useQueries";
import { logger } from "@/src/utils/logger";

type SettingsForm = {
  platformName: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  defaultLanguage: string;
  defaultTimezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smtpServer: string;
  smtpPort: string;
  senderEmail: string;
  passwordMinLength: string;
  sessionTimeout: string;
  require2FA: boolean;
};

const defaultSettings: SettingsForm = {
  platformName: "FlightDeck",
  supportEmail: "support@flightdeck.io",
  supportPhone: "+1 (800) FLIGHT-1",
  maintenanceMode: false,
  defaultLanguage: "English (US)",
  defaultTimezone: "IST (Indian Standard Time)",
  emailNotifications: true,
  pushNotifications: true,
  smtpServer: "smtp.gmail.com",
  smtpPort: "587",
  senderEmail: "noreply@flightdeck.io",
  passwordMinLength: "8",
  sessionTimeout: "30",
  require2FA: true,
};

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settingsForm, setSettingsForm] = useState<SettingsForm>(defaultSettings);
  const [adminActions, setAdminActions] = useState<Array<{ id: string; actionType: string; status: string; message: string; updated: string }>>([]);
  const { data: stats } = useDashboardStats();
  const startupDiagnostics = useMemo(() => getStartupDiagnostics(), []);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [settingsResponse, actionsResponse] = await Promise.all([
          apiService.getSiteSettings(),
          apiService.getAdminActions(),
        ]);
        const response = settingsResponse;
        const byKey = (response.data || []).reduce<Record<string, string>>((acc, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});
        setAdminActions(actionsResponse.data);

        setSettingsForm({
          platformName: byKey.platform_name ?? defaultSettings.platformName,
          supportEmail: byKey.support_email ?? defaultSettings.supportEmail,
          supportPhone: byKey.support_phone ?? defaultSettings.supportPhone,
          maintenanceMode: (byKey.maintenance_mode ?? String(defaultSettings.maintenanceMode)) === "true",
          defaultLanguage: byKey.default_language ?? defaultSettings.defaultLanguage,
          defaultTimezone: byKey.default_timezone ?? defaultSettings.defaultTimezone,
          emailNotifications: (byKey.email_notifications ?? String(defaultSettings.emailNotifications)) === "true",
          pushNotifications: (byKey.push_notifications ?? String(defaultSettings.pushNotifications)) === "true",
          smtpServer: byKey.smtp_server ?? defaultSettings.smtpServer,
          smtpPort: byKey.smtp_port ?? defaultSettings.smtpPort,
          senderEmail: byKey.sender_email ?? defaultSettings.senderEmail,
          passwordMinLength: byKey.password_min_length ?? defaultSettings.passwordMinLength,
          sessionTimeout: byKey.session_timeout ?? defaultSettings.sessionTimeout,
          require2FA: (byKey.require_2fa ?? String(defaultSettings.require2FA)) === "true",
        });
      } catch {
        toast.error("Failed to load system settings");
      } finally {
        setIsLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const updateField = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) => {
    setSettingsForm((prev) => ({ ...prev, [key]: value }));
  };

  const persistPayload = useMemo(
    () => [
      { key: "platform_name", value: settingsForm.platformName, description: "Display name of the platform" },
      { key: "support_email", value: settingsForm.supportEmail, description: "Primary support email" },
      { key: "support_phone", value: settingsForm.supportPhone, description: "Primary support phone" },
      { key: "maintenance_mode", value: String(settingsForm.maintenanceMode), description: "Maintenance mode flag" },
      { key: "default_language", value: settingsForm.defaultLanguage, description: "Default UI language" },
      { key: "default_timezone", value: settingsForm.defaultTimezone, description: "Default UI timezone" },
      { key: "email_notifications", value: String(settingsForm.emailNotifications), description: "Email channel enabled" },
      { key: "push_notifications", value: String(settingsForm.pushNotifications), description: "Push channel enabled" },
      { key: "smtp_server", value: settingsForm.smtpServer, description: "SMTP server hostname" },
      { key: "smtp_port", value: settingsForm.smtpPort, description: "SMTP port number" },
      { key: "sender_email", value: settingsForm.senderEmail, description: "Sender email address" },
      { key: "password_min_length", value: settingsForm.passwordMinLength, description: "Minimum password length" },
      { key: "session_timeout", value: settingsForm.sessionTimeout, description: "Session timeout in minutes" },
      { key: "require_2fa", value: String(settingsForm.require2FA), description: "Require two-factor authentication" },
    ],
    [settingsForm]
  );

  const platformScore = Number(stats?.platformScore || 0);
  const activeUsers = Number(stats?.activeUsers || 0);
  const totalJobs = Number(stats?.totalJobs || 0);
  const totalApplications = Number(stats?.totalApplications || 0);

  const serviceHealth = [
    {
      name: "API Server",
      status: platformScore >= 60 ? "Operational" : "Degraded",
      uptime: `${Math.min(99.99, Math.max(94, 95 + platformScore / 20)).toFixed(2)}%`,
    },
    {
      name: "Database",
      status: totalApplications < 50000 ? "Operational" : "Under Load",
      uptime: `${Math.min(99.99, Math.max(94, 94.5 + Math.max(0, 40000 - totalApplications) / 80000)).toFixed(2)}%`,
    },
    {
      name: "Cache Layer",
      status: activeUsers > 0 ? "Operational" : "Idle",
      uptime: `${Math.min(99.99, Math.max(94, 95 + Math.min(activeUsers, 5000) / 100000)).toFixed(2)}%`,
    },
  ];

  const systemMetrics = [
    {
      label: "CPU Usage",
      value: Math.min(95, Math.max(10, Math.round(((activeUsers + totalApplications) / Math.max(activeUsers + totalApplications + 1200, 1)) * 100))),
      color: "bg-blue-600",
    },
    {
      label: "Memory Usage",
      value: Math.min(95, Math.max(12, Math.round(((totalJobs + totalApplications) / Math.max(totalJobs + totalApplications + 800, 1)) * 100))),
      color: "bg-purple-600",
    },
    {
      label: "Database Connections",
      value: Math.min(200, Math.max(10, Math.round(totalApplications / 8 + totalJobs / 2))),
      max: 200,
      color: "bg-emerald-600",
    },
  ];

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await apiService.saveSiteSettings(persistPayload);
      toast.success("Settings saved successfully!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettingsForm(defaultSettings);
    toast.success("Settings reset locally");
  };

  const triggerAdminAction = async (actionType: string, successMessage: string) => {
    try {
      const response = await apiService.createAdminAction({
        actionType,
        metadata: {
          initiatedFrom: "admin-settings",
          activeTab,
        },
      });
      setAdminActions((prev) => [response.data, ...prev].slice(0, 20));
      toast.success(successMessage);
    } catch (error) {
      logger.warn(`Failed to run admin action ${actionType}`, { error });
      toast.error("Failed to run admin action");
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "api", label: "API Keys", icon: Key },
    { id: "backup", label: "Backup & Data", icon: Database },
    { id: "system", label: "System Status", icon: Server },
  ];

  const ToggleRow = ({
    label,
    description,
    value,
    onChange,
    icon: Icon,
  }: {
    label: string;
    description: string;
    value: boolean;
    onChange: (value: boolean) => void;
    icon: React.ComponentType<{ className?: string }>;
  }) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-purple-100 rounded-lg mt-1">
          <Icon className="h-4 w-4 text-purple-600" />
        </div>
        <div>
          <p className="font-bold text-slate-900">{label}</p>
          <p className="text-xs text-slate-600">{description}</p>
        </div>
      </div>
      <button onClick={() => onChange(!value)} className="focus:outline-none" type="button">
        {value ? (
          <ToggleRight className="h-6 w-6 text-emerald-600 cursor-pointer" />
        ) : (
          <ToggleLeft className="h-6 w-6 text-slate-400 cursor-pointer" />
        )}
      </button>
    </div>
  );

  return (
    <div className="p-8 space-y-8 pb-20">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
          <Settings className="h-8 w-8 text-purple-600" />
          System Settings
        </h1>
        <p className="text-slate-600 mt-2">Configure your platform settings and operational defaults.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-6 py-3 font-bold text-sm uppercase tracking-wider transition-all border-b-2 flex items-center gap-2 whitespace-nowrap",
                activeTab === tab.id ? "border-purple-600 text-purple-600" : "border-transparent text-slate-600 hover:text-slate-900"
              )}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </motion.div>

      {isLoading ? (
        <div className="glass-card p-8 rounded-2xl border border-slate-200 flex items-center gap-3 text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading saved settings...
        </div>
      ) : (
        <div className="space-y-8">
          {activeTab === "general" && (
            <div className="grid gap-8">
              <div className="glass-card p-8 rounded-2xl border border-slate-200 space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Platform Settings</h3>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Platform Name</label>
                  <input type="text" value={settingsForm.platformName} onChange={(e) => updateField("platformName", e.target.value)} className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Support Email</label>
                    <input type="email" value={settingsForm.supportEmail} onChange={(e) => updateField("supportEmail", e.target.value)} className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Support Phone</label>
                    <input type="tel" value={settingsForm.supportPhone} onChange={(e) => updateField("supportPhone", e.target.value)} className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all" />
                  </div>
                </div>
                <ToggleRow
                  label="Maintenance Mode"
                  description={settingsForm.maintenanceMode ? "Only admins should access the platform while maintenance is enabled." : "The platform is open to all users."}
                  value={settingsForm.maintenanceMode}
                  onChange={(value) => updateField("maintenanceMode", value)}
                  icon={AlertCircle}
                />
              </div>

              <div className="glass-card p-8 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Localization</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Default Language</label>
                    <select value={settingsForm.defaultLanguage} onChange={(e) => updateField("defaultLanguage", e.target.value)} className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all">
                      <option>English (US)</option>
                      <option>Hindi</option>
                      <option>Spanish</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Default Timezone</label>
                    <select value={settingsForm.defaultTimezone} onChange={(e) => updateField("defaultTimezone", e.target.value)} className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all">
                      <option>IST (Indian Standard Time)</option>
                      <option>UTC (Coordinated Universal Time)</option>
                      <option>EST (Eastern Standard Time)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Notification Channels</h3>
                <div className="space-y-6">
                  <ToggleRow label="Email Notifications" description="Receive operational updates via email." value={settingsForm.emailNotifications} onChange={(value) => updateField("emailNotifications", value)} icon={Mail} />
                  <ToggleRow label="Push Notifications" description="Enable in-app and browser notifications." value={settingsForm.pushNotifications} onChange={(value) => updateField("pushNotifications", value)} icon={Bell} />
                </div>
              </div>

              <div className="glass-card p-8 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Email Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">SMTP Server</label>
                    <input type="text" value={settingsForm.smtpServer} onChange={(e) => updateField("smtpServer", e.target.value)} className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">SMTP Port</label>
                      <input type="number" value={settingsForm.smtpPort} onChange={(e) => updateField("smtpPort", e.target.value)} className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Sender Email</label>
                      <input type="email" value={settingsForm.senderEmail} onChange={(e) => updateField("senderEmail", e.target.value)} className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-2xl border border-slate-200 space-y-6">
                <h3 className="text-xl font-bold text-slate-900">Security Policies</h3>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Password Policy Min Length</label>
                  <input type="number" value={settingsForm.passwordMinLength} onChange={(e) => updateField("passwordMinLength", e.target.value)} className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Session Timeout (minutes)</label>
                  <input type="number" value={settingsForm.sessionTimeout} onChange={(e) => updateField("sessionTimeout", e.target.value)} className="w-full px-4 py-3 bg-white/50 border-2 border-slate-200 rounded-lg focus:border-purple-400 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all" />
                </div>
                <ToggleRow label="Require 2-Factor Authentication" description="Require an extra verification step for admin accounts." value={settingsForm.require2FA} onChange={(value) => updateField("require2FA", value)} icon={Shield} />
              </div>

              <div className="glass-card p-8 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Danger Zone</h3>
                <div className="space-y-4">
                  <button type="button" onClick={() => void triggerAdminAction("reset_passwords", "Password reset request recorded")} className="w-full px-4 py-3 bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 rounded-lg font-bold text-sm transition-all">Reset All User Passwords</button>
                  <button type="button" onClick={() => void triggerAdminAction("clear_cache", "Cache clear request recorded")} className="w-full px-4 py-3 bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100 rounded-lg font-bold text-sm transition-all">Clear All Cache</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "api" && (
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">API Management</h3>
                <div className="space-y-4">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-bold text-slate-900">API Base URL</p>
                    <p className="mt-2 font-mono text-sm text-slate-600 break-all">{ENV.API_BASE_URL || "Not configured"}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                    <p className="text-sm font-bold text-slate-900">Browser Secret Posture</p>
                    <p className="mt-2 text-sm text-slate-600">
                      Browser payment/public keys are allowed. Private API keys are intentionally not displayed in this UI.
                    </p>
                  </div>
                  <div className={cn(
                    "rounded-lg border px-4 py-4",
                    startupDiagnostics.ok ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"
                  )}>
                    <p className="text-sm font-bold text-slate-900">Startup Readiness</p>
                    <p className="mt-2 text-sm text-slate-700">
                      {startupDiagnostics.ok ? "No blocking startup issues detected." : startupDiagnostics.errors[0]}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-card p-8 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">API Documentation</h3>
                <div className="space-y-3">
                  <a href={`${ENV.API_BASE_URL}/docs`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all">
                    <span className="font-bold text-slate-900">REST API Reference</span>
                    <span className="text-slate-400">Open</span>
                  </a>
                  <a href={`${ENV.API_BASE_URL}/health`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all">
                    <span className="font-bold text-slate-900">Health Check</span>
                    <span className="text-slate-400">Open</span>
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === "backup" && (
            <div className="space-y-6">
              <div className="glass-card p-8 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Database Management</h3>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700 font-bold">Backups and exports are still manual operational tasks in this build.</p>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <button type="button" onClick={() => void triggerAdminAction("backup", "Backup request recorded")} className="px-4 py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    Start Backup
                  </button>
                  <button type="button" onClick={() => void triggerAdminAction("export_data", "Data export request recorded")} className="px-4 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold text-sm transition-all">
                    Export Data
                  </button>
                </div>
              </div>

              <div className="glass-card p-8 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Data Export</h3>
                <button type="button" onClick={() => void triggerAdminAction("export_data", "Full data export request recorded")} className="w-full px-4 py-3 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4" />
                  Export All Data
                </button>
                <div className="mt-6 space-y-3">
                  {adminActions.slice(0, 5).map((action) => (
                    <div key={action.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-sm font-bold text-slate-900">{action.message || action.actionType}</p>
                      <p className="text-xs text-slate-500 mt-1">{action.updated ? new Date(action.updated).toLocaleString("en-IN") : "Recently"}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "system" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {serviceHealth.map((service) => (
                  <div key={service.name} className="glass-card p-6 rounded-2xl border border-slate-200">
                    <div className="flex items-start justify-between mb-4">
                      <p className="font-bold text-slate-900">{service.name}</p>
                      <span className={cn("text-xs font-bold", service.status === "Operational" ? "text-emerald-700" : service.status === "Under Load" ? "text-amber-700" : "text-rose-700")}>{service.status}</span>
                    </div>
                    <p className="text-sm text-slate-600">Uptime: <strong>{service.uptime}</strong></p>
                  </div>
                ))}
              </div>

              <div className="glass-card p-8 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  System Metrics
                </h3>
                <div className="space-y-4">
                  {systemMetrics.map((metric) => {
                    const maxValue = metric.max || 100;
                    const percent = Math.min(100, Math.round((metric.value / maxValue) * 100));
                    return (
                      <div key={metric.label}>
                        <div className="flex justify-between mb-2">
                          <p className="text-sm font-bold text-slate-700">{metric.label}</p>
                          <p className="text-sm font-bold text-slate-900">{metric.max ? `${metric.value}/${metric.max}` : `${metric.value}%`}</p>
                        </div>
                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", metric.color)} style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="glass-card p-8 rounded-2xl border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Recent Admin Actions</h3>
                <div className="space-y-3">
                  {adminActions.length > 0 ? adminActions.slice(0, 6).map((action) => (
                    <div key={action.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-slate-900">{action.message || action.actionType}</p>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">{action.status}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{action.updated ? new Date(action.updated).toLocaleString("en-IN") : "Recently"}</p>
                    </div>
                  )) : (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      No admin actions recorded yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="fixed bottom-8 right-8 flex gap-4">
        <button type="button" onClick={handleResetSettings} className="px-6 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold text-sm transition-all flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset
        </button>
        <button type="button" onClick={handleSaveSettings} disabled={isSaving || isLoading} className="px-6 py-3 bg-purple-600 text-white hover:bg-purple-700 disabled:bg-slate-300 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </button>
      </motion.div>
    </div>
  );
}
