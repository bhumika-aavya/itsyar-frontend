import React, { useEffect, useState } from "react";
import { Save, Settings, Bell, Shield, Globe, Loader2, CheckCircle2 } from "lucide-react";
import { AdminService, PlatformSettings } from "@/services/admin.service";

type Tab = "general" | "notifications" | "security";

const DEFAULT_GENERAL = {
  platformName: "ForgeInsight",
  platformTagline: "Build. Learn. Compete.",
  supportEmail: "support@forgeinsight.com",
  maxTeamSize: "4",
  maintenanceMode: false,
  allowRegistrations: true,
};

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [general, setGeneral] = useState(DEFAULT_GENERAL);

  useEffect(() => {
    AdminService.getSettings().then((s: PlatformSettings) => {
      setGeneral({
        platformName: s.platform.platformName,
        platformTagline: s.platform.platformTagline,
        supportEmail: s.platform.supportEmail,
        maxTeamSize: String(s.platform.defaultMaxTeamSize),
        maintenanceMode: s.accessControl.maintenanceMode,
        allowRegistrations: s.accessControl.allowNewRegistrations,
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await AdminService.updateSettings({
      platform: {
        platformName: general.platformName,
        platformTagline: general.platformTagline,
        supportEmail: general.supportEmail,
        defaultMaxTeamSize: Number(general.maxTeamSize) || 4,
      },
      accessControl: {
        maintenanceMode: general.maintenanceMode,
        allowNewRegistrations: general.allowRegistrations,
      },
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "general", label: "General", icon: Globe },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <Settings size={20} className="text-slate-600" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">Configure platform-wide settings</p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1.5 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === id ? "bg-white text-[#4F46E5] shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-8 shadow-sm space-y-6">
        {activeTab === "general" && <GeneralSettings form={general} setForm={setGeneral} />}
        {activeTab === "notifications" && <NotificationSettings />}
        {activeTab === "security" && <SecuritySettings />}

        {/* Save bar */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          {saved ? (
            <span className="flex items-center gap-2 text-sm font-bold text-emerald-600">
              <CheckCircle2 size={16} /> Settings saved successfully
            </span>
          ) : activeTab === "general" ? (
            <span className="text-xs font-bold text-slate-400">Platform &amp; access control settings are saved to the server</span>
          ) : (
            <span className="text-xs font-bold text-slate-400">Notification &amp; security settings are local-only — not yet backed by an API</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] text-white rounded-xl text-sm font-extrabold shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── General ─────────────────────────────────────────────────────────────────

function GeneralSettings({ form, setForm }: { form: typeof DEFAULT_GENERAL; setForm: React.Dispatch<React.SetStateAction<typeof DEFAULT_GENERAL>> }) {
  return (
    <div className="space-y-5">
      <SectionTitle>Platform</SectionTitle>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Platform Name">
          <input
            value={form.platformName}
            onChange={e => setForm(f => ({ ...f, platformName: e.target.value }))}
            className={INPUT}
          />
        </Field>
        <Field label="Support Email">
          <input
            value={form.supportEmail}
            onChange={e => setForm(f => ({ ...f, supportEmail: e.target.value }))}
            className={INPUT}
          />
        </Field>
      </div>
      <Field label="Platform Tagline">
        <input
          value={form.platformTagline}
          onChange={e => setForm(f => ({ ...f, platformTagline: e.target.value }))}
          className={INPUT}
        />
      </Field>
      <Field label="Default Max Team Size">
        <input
          type="number"
          min={1}
          max={20}
          value={form.maxTeamSize}
          onChange={e => setForm(f => ({ ...f, maxTeamSize: e.target.value }))}
          className={INPUT + " w-24"}
        />
      </Field>

      <div className="h-px bg-slate-100" />
      <SectionTitle>Access Control</SectionTitle>

      <Toggle
        label="Maintenance Mode"
        desc="Disables access for all non-admin users"
        checked={form.maintenanceMode}
        onChange={v => setForm(f => ({ ...f, maintenanceMode: v }))}
        danger
      />
      <Toggle
        label="Allow New Registrations"
        desc="Controls whether new users can create accounts"
        checked={form.allowRegistrations}
        onChange={v => setForm(f => ({ ...f, allowRegistrations: v }))}
      />
    </div>
  );
}

// ─── Notifications ────────────────────────────────────────────────────────────

function NotificationSettings() {
  const [form, setForm] = useState({
    emailOnRegister: true,
    emailOnSubmission: true,
    emailOnHackathonStart: true,
    emailOnTeamJoin: false,
    adminDigest: true,
  });

  return (
    <div className="space-y-5">
      <SectionTitle>User Emails</SectionTitle>
      <Toggle
        label="New User Registration"
        desc="Send welcome email when a new user signs up"
        checked={form.emailOnRegister}
        onChange={v => setForm(f => ({ ...f, emailOnRegister: v }))}
      />
      <Toggle
        label="Hackathon Start Reminder"
        desc="Notify registered participants when a hackathon goes live"
        checked={form.emailOnHackathonStart}
        onChange={v => setForm(f => ({ ...f, emailOnHackathonStart: v }))}
      />
      <Toggle
        label="Submission Confirmation"
        desc="Confirm when a participant submits their solution"
        checked={form.emailOnSubmission}
        onChange={v => setForm(f => ({ ...f, emailOnSubmission: v }))}
      />
      <Toggle
        label="Team Join Notification"
        desc="Notify team members when someone joins their team"
        checked={form.emailOnTeamJoin}
        onChange={v => setForm(f => ({ ...f, emailOnTeamJoin: v }))}
      />

      <div className="h-px bg-slate-100" />
      <SectionTitle>Admin Emails</SectionTitle>
      <Toggle
        label="Daily Admin Digest"
        desc="Receive a daily summary of platform activity"
        checked={form.adminDigest}
        onChange={v => setForm(f => ({ ...f, adminDigest: v }))}
      />
    </div>
  );
}

// ─── Security ─────────────────────────────────────────────────────────────────

function SecuritySettings() {
  const [form, setForm] = useState({
    sessionTimeout: "24",
    requireEmailVerification: true,
    allowPasswordReset: true,
    twoFactorAdmin: false,
    logAdminActions: true,
  });

  return (
    <div className="space-y-5">
      <SectionTitle>Session</SectionTitle>
      <Field label="Session Timeout (hours)">
        <input
          type="number"
          min={1}
          max={168}
          value={form.sessionTimeout}
          onChange={e => setForm(f => ({ ...f, sessionTimeout: e.target.value }))}
          className={INPUT + " w-24"}
        />
      </Field>

      <div className="h-px bg-slate-100" />
      <SectionTitle>Authentication</SectionTitle>

      <Toggle
        label="Require Email Verification"
        desc="New users must verify their email before accessing the platform"
        checked={form.requireEmailVerification}
        onChange={v => setForm(f => ({ ...f, requireEmailVerification: v }))}
      />
      <Toggle
        label="Allow Password Reset"
        desc="Enable the forgot password / reset password flow"
        checked={form.allowPasswordReset}
        onChange={v => setForm(f => ({ ...f, allowPasswordReset: v }))}
      />
      <Toggle
        label="2FA for Admin Accounts"
        desc="Require two-factor authentication for admin logins"
        checked={form.twoFactorAdmin}
        onChange={v => setForm(f => ({ ...f, twoFactorAdmin: v }))}
      />

      <div className="h-px bg-slate-100" />
      <SectionTitle>Audit</SectionTitle>
      <Toggle
        label="Log Admin Actions"
        desc="Record all admin operations in the audit log"
        checked={form.logAdminActions}
        onChange={v => setForm(f => ({ ...f, logAdminActions: v }))}
      />
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const INPUT =
  "h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD] focus:bg-white transition-all";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{children}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-bold text-slate-700 mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label, desc, checked, onChange, danger,
}: {
  label: string; desc: string; checked: boolean;
  onChange: (v: boolean) => void; danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div>
        <p className={`text-sm font-bold ${danger && checked ? "text-red-600" : "text-slate-800"}`}>{label}</p>
        <p className="text-xs font-medium text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full transition-all ${
          checked
            ? danger ? "bg-red-500" : "bg-[#4F46E5]"
            : "bg-slate-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}
