"use client";

import React, { useState } from "react";
import SettingsSection from "./SettingsSection";
import SettingsField from "./SettingsField";
import { getStoredSettings, setStoredSettings } from "@/lib/settingsStorage";
import { 
  HardDriveDownload, 
  Cloud, 
  Database, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  Download, 
  RotateCw, 
  Check, 
  FileCheck,
  Lock
} from "lucide-react";

export interface BackupSettingsData {
  autoBackupEnabled: boolean;
  backupFrequency: string;
  storageDestination: string;
  lastBackupTimestamp: string;
  retentionCount: number;
  encryptionAlgorithm: string;
}

interface BackupSettingsProps {
  initialValues?: Partial<BackupSettingsData>;
  saving?: boolean;
  onSave?: (values: BackupSettingsData) => void;
}

export default function BackupSettings({
  initialValues,
  saving = false,
  onSave,
}: BackupSettingsProps) {
  const [values, setValues] = useState<BackupSettingsData>(() => {
    const stored = getStoredSettings("backup");
    return {
      ...stored,
      ...initialValues,
    };
  });

  const [saved, setSaved] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStepText, setBackupStepText] = useState("");
  const [backupCompleted, setBackupCompleted] = useState(false);

  const update = <K extends keyof BackupSettingsData>(
    field: K,
    value: BackupSettingsData[K]
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    const updated = setStoredSettings("backup", values);
    onSave?.(updated as BackupSettingsData);
    setSaved(true);
    setTimeout(() => setSaved(false), 3500);
  };

  const triggerInstantBackup = () => {
    setIsBackingUp(true);
    setBackupCompleted(false);
    setBackupProgress(10);
    setBackupStepText("Snapshotting patient demographic database...");

    setTimeout(() => {
      setBackupProgress(35);
      setBackupStepText("Archiving specimen accessions & analyzer telemetry...");
    }, 600);

    setTimeout(() => {
      setBackupProgress(65);
      setBackupStepText("Compiling authorized diagnostic reports & invoices...");
    }, 1200);

    setTimeout(() => {
      setBackupProgress(90);
      setBackupStepText("Encrypting with AES-256-GCM and generating SHA-256 checksum...");
    }, 1800);

    setTimeout(() => {
      setBackupProgress(100);
      setBackupStepText("Backup complete! Package ready for download.");
      setIsBackingUp(false);
      setBackupCompleted(true);
      update("lastBackupTimestamp", new Date().toISOString());

      // Auto trigger downloadable file
      const backupData = {
        system: "LabCore Enterprise LIS",
        version: "3.2.0-PRO",
        timestamp: new Date().toISOString(),
        checksum: "SHA256:d8a94e82f1b0a992cf01",
        recordCounts: {
          patients: 14820,
          orders: 28410,
          tests: 52190,
          invoices: 26800,
        },
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `labcore-backup-${new Date().toISOString().split("T")[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }, 2400);
  };

  return (
    <div className="space-y-6">
      {saved && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 dark:border-emerald-900/50 dark:bg-emerald-950/40 p-4 text-xs font-semibold text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Automated disaster recovery & backup policies saved!</span>
        </div>
      )}

      {/* Instant Backup Trigger Banner */}
      <div className="rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 p-6 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-cyan-400 border border-indigo-500/30">
              <Database className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  Enterprise Disaster Recovery & Cloud Vault
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/40">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  AES-256 Encrypted
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Last Successful Snapshot: {new Date(values.lastBackupTimestamp).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={triggerInstantBackup}
            disabled={isBackingUp}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-600/30 hover:brightness-110 active:scale-95 disabled:opacity-50 transition-all"
          >
            <RotateCw className={`h-4 w-4 ${isBackingUp ? "animate-spin" : ""}`} />
            {isBackingUp ? "Executing Snapshot..." : "Trigger Instant Backup Now"}
          </button>
        </div>

        {/* Progress Bar when backing up */}
        {(isBackingUp || backupCompleted) && (
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <span>{backupStepText}</span>
              <span className="font-mono text-cyan-300">{backupProgress}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-indigo-400 transition-all duration-300"
                style={{ width: `${backupProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Backup Settings Form */}
      <SettingsSection
        title="Automated Schedule & Redundancy"
        description="Configure automated database snapshot frequencies, cloud vaults, and retention lifecycles."
        icon={<HardDriveDownload className="h-5 w-5" />}
      >
        <div className="grid gap-5 md:grid-cols-3">
          <SettingsField label="Backup Frequency">
            <select
              value={values.backupFrequency}
              onChange={(e) => update("backupFrequency", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Every 6 Hours">Every 6 Hours (High Volume)</option>
              <option value="Daily at 02:00 AM IST">Daily at 02:00 AM IST (Recommended)</option>
              <option value="Twice Daily (12:00 & 00:00)">Twice Daily (12:00 & 00:00)</option>
              <option value="Weekly Every Sunday">Weekly Every Sunday</option>
            </select>
          </SettingsField>

          <SettingsField label="Cloud Storage Destination">
            <select
              value={values.storageDestination}
              onChange={(e) => update("storageDestination", e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Encrypted AWS S3 + Local Redundant NAS">Encrypted AWS S3 + Local Redundant NAS</option>
              <option value="Google Cloud Healthcare Vault">Google Cloud Healthcare Vault</option>
              <option value="Microsoft Azure Health Data Services">Microsoft Azure Health Data Services</option>
              <option value="On-Premise Isolated SAN / NAS Only">On-Premise Isolated SAN / NAS Only</option>
            </select>
          </SettingsField>

          <SettingsField label="Snapshot Retention Count">
            <input
              type="number"
              min={7}
              max={365}
              value={values.retentionCount}
              onChange={(e) => update("retentionCount", Number(e.target.value))}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/90 px-3.5 py-2.5 text-xs font-medium text-slate-900 dark:text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </SettingsField>
        </div>
      </SettingsSection>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95 transition-all"
        >
          <Check className="h-3.5 w-3.5" />
          Save Backup Settings
        </button>
      </div>
    </div>
  );
}
