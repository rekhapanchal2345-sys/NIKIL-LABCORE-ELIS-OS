'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/dashboardlayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import LogisticsHeaderBanner from '@/components/logistics/LogisticsHeaderBanner';
import LiveFleetRadarView from '@/components/logistics/LiveFleetRadarView';
import WardStatDispatchView from '@/components/logistics/WardStatDispatchView';
import HubSpokeManifestView from '@/components/logistics/HubSpokeManifestView';
import HomePhlebotomyView from '@/components/logistics/HomePhlebotomyView';
import ColdChainIoTView from '@/components/logistics/ColdChainIoTView';
import FleetRosterView from '@/components/logistics/FleetRosterView';
import ChainOfCustodyPrintModal from '@/components/logistics/ChainOfCustodyPrintModal';
import DispatchTripModal from '@/components/logistics/DispatchTripModal';
import ColdChainAlertModal from '@/components/logistics/ColdChainAlertModal';
import {
  INITIAL_SHIPMENTS,
  MOCK_COLD_CHAIN_SENSORS,
  MOCK_PNEUMATIC_STATIONS,
  MOCK_LOGISTICS_KPI,
} from '@/components/logistics/mockLogisticsData';
import { ShipmentTrip, TripStatus, PneumaticTubeStation, ColdChainSensor } from '@/components/logistics/logistics.types';
import {
  Truck,
  Radio,
  Zap,
  Package,
  Home,
  ThermometerSnowflake,
  FileText,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

function LogisticsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state synchronization
  const tabParam = searchParams.get('tab') || 'radar';
  const typeParam = searchParams.get('type');

  const [activeTab, setActiveTab] = useState<string>(tabParam);
  const [activeCenter, setActiveCenter] = useState<string>('ALL');
  const [shipments, setShipments] = useState<ShipmentTrip[]>(INITIAL_SHIPMENTS);
  const [stations, setStations] = useState<PneumaticTubeStation[]>(MOCK_PNEUMATIC_STATIONS);
  const [sensors, setSensors] = useState<ColdChainSensor[]>(MOCK_COLD_CHAIN_SENSORS);

  // Modals state
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedShipmentForPrint, setSelectedShipmentForPrint] = useState<ShipmentTrip | null>(null);
  const [coldChainAlertBoxId, setColdChainAlertBoxId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync tab with URL
  useEffect(() => {
    if (tabParam) {
      if (tabParam === 'fleet') {
        setActiveTab('fleet');
      } else if (tabParam === 'ward-stat') {
        setActiveTab('ward-stat');
      } else if (tabParam === 'manifests') {
        setActiveTab('manifests');
      } else if (tabParam === 'home-phlebo') {
        setActiveTab('home-phlebo');
      } else if (tabParam === 'coldchain') {
        setActiveTab('coldchain');
      } else if (tabParam === 'coc') {
        setActiveTab('coc');
      } else {
        setActiveTab('radar');
      }
    } else if (typeParam) {
      if (typeParam === 'HOME') {
        setActiveTab('home-phlebo');
      } else if (typeParam === 'SAMPLE_PICKUP') {
        setActiveTab('manifests');
      } else {
        setActiveTab('radar');
      }
    }
  }, [tabParam, typeParam]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    router.push(`/logistics?tab=${tabId}`, { scroll: false });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // State handlers
  const handleUpdateStatus = (id: string, newStatus: TripStatus) => {
    setShipments(prev =>
      prev.map(s => {
        if (s.id === id) {
          const progress =
            newStatus === 'DELIVERED'
              ? 100
              : newStatus === 'PICKED_UP'
              ? 50
              : newStatus === 'ARRIVED_ORIGIN'
              ? 25
              : s.progressPercent;
          return {
            ...s,
            status: newStatus,
            progressPercent: progress,
            etaMinutes: newStatus === 'DELIVERED' ? 0 : s.etaMinutes,
          };
        }
        return s;
      })
    );
    showToast(`Trip ${id} status updated to ${newStatus}`);
  };

  const handleCreateDispatch = (newTrip: any) => {
    const created: ShipmentTrip = {
      ...newTrip,
      id: `log-${Date.now().toString().slice(-4)}`,
      trackingId: `TRK-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      dispatchedAt: new Date().toISOString(),
      progressPercent: 15,
    };
    setShipments(prev => [created, ...prev]);
    showToast(`Consignment ${created.trackingId} dispatched successfully!`);
  };

  const handleQuickWardDispatch = (wardName: string, bedNumber: string, reason: string) => {
    const trip: ShipmentTrip = {
      id: `stat-${Date.now().toString().slice(-4)}`,
      trackingId: `STAT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'WARD_STAT',
      title: `${wardName} (${bedNumber}) Emergency STAT Run`,
      description: reason,
      origin: `${wardName} (${bedNumber})`,
      originType: 'ICU_WARD',
      destination: 'Central Lab - Core Accessioning Bay 1',
      driver: 'Ramesh Yadav (Hospital Porter #04)',
      driverPhone: '+91 98250 11442',
      vehicle: 'Hospital Electric Cart #02',
      vehiclePlate: 'CART-ICU-02',
      vehicleType: 'HOSPITAL_PORTER',
      status: 'IN_TRANSIT',
      priority: 'STAT',
      etaMinutes: 10,
      etaTimestamp: new Date(Date.now() + 10 * 60000).toISOString(),
      dispatchedAt: new Date().toISOString(),
      samplesCount: 4,
      currentTempCelsius: 4.4,
      tempRequirement: '2_TO_8_C',
      tamperSealNumber: `SEAL-${Math.floor(10000 + Math.random() * 90000)}`,
      progressPercent: 30,
      wardInfo: {
        wardName,
        bedNumber,
        orderingDoctor: 'Duty Critical Care Specialist',
        statReason: reason,
        targetTatMinutes: 15,
        elapsedMinutes: 2,
      },
      tubes: [
        {
          id: `t-w-${Date.now()}-1`,
          barcode: `STAT-${Math.floor(1000 + Math.random() * 9000)}`,
          uhid: 'UH-2026-CRIT',
          patientName: 'Emergency Inpatient',
          ageGender: '62Y / M',
          vacutainerType: 'EDTA_LAVENDER',
          colorHex: '#8B5CF6',
          testName: 'STAT Emergency CBC & Biomarkers',
          department: 'Hematology',
          conditionStatus: 'INTACT',
          isScannedAtDock: false,
        },
      ],
      chainOfCustody: {
        releasedBy: `Staff Nurse (${wardName})`,
        releaseTime: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        courierRunnerName: 'Ramesh Yadav',
      },
    };
    setShipments(prev => [trip, ...prev]);
    showToast(`STAT Porter Runner dispatched to ${wardName} (${bedNumber})`);
  };

  const handlePneumaticSend = (stationCode: string) => {
    setStations(prev =>
      prev.map(st => {
        if (st.stationCode === stationCode) {
          return { ...st, status: 'SENDING', capsuleEtaSeconds: 35 };
        }
        if (st.stationCode === 'STN-LAB-01') {
          return { ...st, status: 'RECEIVING', capsuleEtaSeconds: 35 };
        }
        return st;
      })
    );
    showToast(`Pneumatic capsule launched from ${stationCode} to Central Lab`);
  };

  const handleBookHomeVisit = (pName: string, pAddress: string, pSlot: string, pTest: string) => {
    const trip: ShipmentTrip = {
      id: `home-${Date.now().toString().slice(-4)}`,
      trackingId: `HOME-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      type: 'HOME_COLLECTION',
      title: `Home Phlebotomy: ${pName}`,
      description: pTest,
      origin: pAddress,
      originType: 'PATIENT_HOME',
      destination: 'Central Processing Lab - Phlebotomy Intake',
      driver: 'Anil Sharma (Senior Phlebotomist)',
      driverPhone: '+91 97234 55890',
      vehicle: 'Electric Bike with Cryo-Box (GJ-01-EE-4192)',
      vehiclePlate: 'GJ-01-EE-4192',
      vehicleType: 'BIKE_COLD_BOX',
      status: 'DISPATCHED',
      priority: 'ROUTINE',
      etaMinutes: 45,
      etaTimestamp: new Date(Date.now() + 45 * 60000).toISOString(),
      dispatchedAt: new Date().toISOString(),
      samplesCount: 3,
      currentTempCelsius: 4.1,
      tempRequirement: '2_TO_8_C',
      tamperSealNumber: `HOME-SEAL-${Math.floor(1000 + Math.random() * 9000)}`,
      progressPercent: 20,
      homeInfo: {
        patientAddress: pAddress,
        appointmentSlot: pSlot,
        phlebotomistName: 'Anil Sharma',
        otpCode: `${Math.floor(1000 + Math.random() * 9000)}`,
        kitVerified: true,
        geofenceStatus: 'APPROACHING',
      },
      tubes: [
        {
          id: `th-${Date.now()}`,
          barcode: `BC-HOME-${Math.floor(1000 + Math.random() * 9000)}`,
          uhid: `UH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
          patientName: pName,
          ageGender: 'Adult',
          vacutainerType: 'SST_GOLD',
          colorHex: '#EAB308',
          testName: pTest,
          department: 'Biochemistry',
          conditionStatus: 'INTACT',
          isScannedAtDock: false,
        },
      ],
      chainOfCustody: {
        releasedBy: `Patient ${pName}`,
        releaseTime: 'Pending Home Arrival',
        courierRunnerName: 'Anil Sharma',
      },
    };
    setShipments(prev => [trip, ...prev]);
    showToast(`Home phlebotomy visit scheduled for ${pName}`);
  };

  const handleExcursionTrigger = (boxId: string) => {
    setColdChainAlertBoxId(boxId);
  };

  const handleExcursionAction = (actionDesc: string) => {
    setColdChainAlertBoxId(null);
    showToast(`NABL CAPA Action executed: ${actionDesc}`);
  };

  const statCount = shipments.filter(s => s.priority === 'STAT' && s.status !== 'DELIVERED').length;

  return (
    <ProtectedRoute>
      <DashboardLayout title="Sample Logistics & Fleet Management">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* TOAST NOTIFICATION */}
          {toastMessage && (
            <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top-4 duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          )}

          {/* MASTER LOGISTICS HEADER & COMMAND BANNER */}
          <LogisticsHeaderBanner
            activeCenter={activeCenter}
            onCenterChange={setActiveCenter}
            onOpenDispatch={() => setIsDispatchModalOpen(true)}
            onOpenPrintManifest={() => setSelectedShipmentForPrint(shipments[0])}
            onOpenDockScanner={() => handleTabChange('manifests')}
            onSimulateExcursion={() => handleExcursionTrigger('Cold-Box #CB-04')}
            activeStatCount={statCount}
          />

          {/* ENTERPRISE WORKFLOW TABS */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              <button
                onClick={() => handleTabChange('radar')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'radar'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Radio className="w-4 h-4" />
                Live Fleet Radar
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  activeTab === 'radar' ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {shipments.length}
                </span>
              </button>

              <button
                onClick={() => handleTabChange('ward-stat')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'ward-stat'
                    ? 'bg-red-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Zap className="w-4 h-4" />
                Hospital Ward STAT Runs
                {statCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse ${
                    activeTab === 'ward-stat' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-700'
                  }`}>
                    {statCount} STAT
                  </span>
                )}
              </button>

              <button
                onClick={() => handleTabChange('manifests')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'manifests'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Package className="w-4 h-4" />
                Hub-Spoke Consignments &amp; Dock Scan
              </button>

              <button
                onClick={() => handleTabChange('home-phlebo')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'home-phlebo'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Home className="w-4 h-4" />
                Home Phlebotomy Fleet
              </button>

              <button
                onClick={() => handleTabChange('coldchain')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'coldchain'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <ThermometerSnowflake className="w-4 h-4" />
                Cold-Chain IoT (2°C–8°C)
              </button>

              <button
                onClick={() => handleTabChange('fleet')}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'fleet'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                }`}
              >
                <Users className="w-4 h-4" />
                Fleet &amp; Courier Roster
              </button>

              <button
                onClick={() => setSelectedShipmentForPrint(shipments[0])}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap text-slate-600 hover:text-blue-700 hover:bg-blue-50/70 transition-all cursor-pointer ml-auto"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                Print Manifest Slip
              </button>
            </div>
          </div>

          {/* ACTIVE TAB VIEW CONTENT */}
          <div>
            {activeTab === 'radar' && (
              <LiveFleetRadarView
                shipments={shipments}
                onUpdateStatus={handleUpdateStatus}
                onSelectForManifest={(shipment) => setSelectedShipmentForPrint(shipment)}
                onOpenDispatch={() => setIsDispatchModalOpen(true)}
                onTriggerExcursion={(id) => handleExcursionTrigger(id)}
              />
            )}

            {activeTab === 'ward-stat' && (
              <WardStatDispatchView
                shipments={shipments}
                stations={stations}
                onQuickWardDispatch={handleQuickWardDispatch}
                onSendPneumaticCapsule={handlePneumaticSend}
              />
            )}

            {activeTab === 'manifests' && (
              <HubSpokeManifestView
                onOpenPrintSlip={() => setSelectedShipmentForPrint(shipments[0])}
              />
            )}

            {activeTab === 'home-phlebo' && (
              <HomePhlebotomyView
                shipments={shipments}
                onVerifyOtp={(tripId, otp) => showToast(`OTP ${otp} authenticated for trip ${tripId}`)}
                onBookHomeVisit={handleBookHomeVisit}
              />
            )}

            {activeTab === 'coldchain' && (
              <ColdChainIoTView
                sensors={sensors}
                onSimulateExcursionAlert={handleExcursionTrigger}
                onResolveExcursion={(id) => showToast(`Excursion resolved for sensor ${id}`)}
              />
            )}

            {activeTab === 'fleet' && (
              <FleetRosterView
                onAssignTrip={(driverName) => {
                  setIsDispatchModalOpen(true);
                  showToast(`Selected ${driverName} for new trip dispatch`);
                }}
              />
            )}
          </div>

          {/* NABL COMPLIANCE PROTOCOL BAR */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>NABL ISO 15189:2022 Certified Pre-analytical Logistics:</strong> All biological specimens transported in compliant triple-packaging with continuous thermal logging.
              </span>
            </div>
            <span className="font-mono text-slate-400 shrink-0">ISO 15189:2022 §5.4.4</span>
          </div>

          {/* MODALS */}
          <DispatchTripModal
            isOpen={isDispatchModalOpen}
            onClose={() => setIsDispatchModalOpen(false)}
            onDispatch={handleCreateDispatch}
          />

          <ChainOfCustodyPrintModal
            shipment={selectedShipmentForPrint}
            onClose={() => setSelectedShipmentForPrint(null)}
          />

          <ColdChainAlertModal
            isOpen={!!coldChainAlertBoxId}
            boxId={coldChainAlertBoxId || 'Cold-Box #CB-04'}
            onClose={() => setColdChainAlertBoxId(null)}
            onActionTaken={handleExcursionAction}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

export default function LogisticsPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-xs text-slate-400">Loading Enterprise Sample Logistics...</div>}>
      <LogisticsContent />
    </Suspense>
  );
}
