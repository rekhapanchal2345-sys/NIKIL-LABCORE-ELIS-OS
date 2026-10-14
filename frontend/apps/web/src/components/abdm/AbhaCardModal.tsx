"use client";

import { useEffect, useRef } from "react";
import { X, Download, PrinterIcon, Shield, User, MapPin, Phone, Droplets, Calendar, QrCode } from "lucide-react";
import { formatBloodGroup } from "@/lib/patient-utils";

interface AbhaCardData {
  abhaNumber: string;
  abhaAddress: string;
  name: string;
  gender: string;
  dob?: string | null;
  mobile?: string | null;
  bloodGroup?: string | null;
  address?: string | null;
  linkedAt?: string | null;
  status?: string;
  qrData: string;
  photo?: string | null;
}

interface AbhaCardModalProps {
  data: AbhaCardData;
  onClose: () => void;
}

function formatAbhaNumber(num: string): string {
  return num.replace(/(\d{2})(\d{4})(\d{4})(\d{4})/, "$1-$2-$3-$4");
}

export default function AbhaCardModal({ data, onClose }: AbhaCardModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>ABHA Card – ${data.name}</title>
      <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        .card { width: 340px; background: linear-gradient(135deg, #1e40af 0%, #312e81 100%); border-radius: 16px; padding: 20px; color: white; }
      </style></head><body>
      ${printContent}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const genderDisplay = data.gender === "MALE" ? "Male" : data.gender === "FEMALE" ? "Female" : "Other";

  // Simple QR-like placeholder (in production use a real QR library like qrcode.react)
  const qrDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(data.qrData)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">ABHA Card</h2>
              <p className="text-xs text-gray-500">Ayushman Bharat Health Account</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Card Preview */}
        <div className="p-6 flex justify-center">
          <div ref={printRef} id="abha-card-printable">
            {/* Official-style ABHA Card */}
            <div style={{
              width: "340px",
              background: "linear-gradient(135deg, #1e40af 0%, #312e81 100%)",
              borderRadius: "16px",
              padding: "20px",
              color: "white",
              boxShadow: "0 20px 60px rgba(30,64,175,0.3)",
              fontFamily: "Arial, sans-serif",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Decorative circles */}
              <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
              <div style={{ position: "absolute", bottom: "-30px", left: "-30px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />

              {/* Top: Logo + Title */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <div style={{ fontSize: "10px", letterSpacing: "1.5px", color: "rgba(255,255,255,0.7)", textTransform: "uppercase" }}>Government of India</div>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: "white" }}>Ayushman Bharat</div>
                  <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.85)" }}>Health Account (ABHA)</div>
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  {data.photo && (
                    <div style={{ background: "white", borderRadius: "8px", padding: "2px", width: "60px", height: "60px", overflow: "hidden" }}>
                      <img src={data.photo} alt="Patient" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />
                    </div>
                  )}
                  <div style={{ background: "white", borderRadius: "8px", padding: "4px" }}>
                    <img src={qrDataUrl} alt="ABHA QR" width={60} height={60} style={{ display: "block" }} />
                  </div>
                </div>
              </div>

              {/* ABHA Number (prominent) */}
              <div style={{ background: "rgba(255,255,255,0.12)", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", marginBottom: "3px" }}>ABHA Number</div>
                <div style={{ fontSize: "18px", fontWeight: "bold", fontFamily: "monospace", letterSpacing: "2px" }}>
                  {formatAbhaNumber(data.abhaNumber)}
                </div>
              </div>

              {/* ABHA Address */}
              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.6)", marginBottom: "2px" }}>ABHA Address</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#93c5fd" }}>{data.abhaAddress}</div>
              </div>

              {/* Patient Details */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.55)" }}>Name</div>
                  <div style={{ fontSize: "12px", fontWeight: "600" }}>{data.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.55)" }}>Gender</div>
                  <div style={{ fontSize: "12px", fontWeight: "600" }}>{genderDisplay}</div>
                </div>
                {data.dob && (
                  <div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.55)" }}>Date of Birth</div>
                    <div style={{ fontSize: "12px", fontWeight: "600" }}>{new Date(data.dob).toLocaleDateString("en-IN")}</div>
                  </div>
                )}
                {data.bloodGroup && (
                  <div>
                    <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.55)" }}>Blood Group</div>
                    <div style={{ fontSize: "12px", fontWeight: "600" }}>{formatBloodGroup(data.bloodGroup)}</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.5)" }}>
                  {data.linkedAt ? `Linked: ${new Date(data.linkedAt).toLocaleDateString("en-IN")}` : ""}
                </div>
                <div style={{ fontSize: "9px", background: data.status === "VERIFIED" ? "rgba(34,197,94,0.2)" : "rgba(250,204,21,0.2)", color: data.status === "VERIFIED" ? "#86efac" : "#fde047", padding: "2px 8px", borderRadius: "999px" }}>
                  {data.status ?? "LINKED"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Details below card */}
        <div className="px-6 pb-4 grid grid-cols-2 gap-3 text-sm">
          {data.mobile && (
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={14} className="text-gray-400" />
              <span>{data.mobile}</span>
            </div>
          )}
          {data.address && (
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin size={14} className="text-gray-400" />
              <span className="truncate">{data.address}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            id="abdm-card-print"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            <PrinterIcon size={16} />
            Print Card
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
