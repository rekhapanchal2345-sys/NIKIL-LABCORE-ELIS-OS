/**
 * LabCore ELIS - Doctors & Referral Management Application Engine
 * Renders the exact UI matching the screenshot with dynamic real-time capabilities.
 */

// Application State with pre-seeded doctors matching the user's live system
const AppState = {
  currentTabFilter: 'ALL', // 'ALL' | 'REFERRING' | 'PATHOLOGIST' | 'PAYOUTS'
  searchQuery: '',
  specFilter: 'ALL',
  statusFilter: 'ALL',
  sortFilter: 'AZ',
  selectedDoctorForPayout: null,

  doctors: [
    {
      id: "DOC-0002",
      doctorCode: "DOC-0002",
      title: "Dr.",
      fullName: "Dr. NIKILKUMAR",
      initials: "NI",
      initialsBg: "bg-indigo-600",
      qualifications: "MBBS, MD",
      doctorType: "Referring Doctor",
      councilRegNo: "MMC72342",
      specialization: "Nephrology",
      clinicName: "APEX HOSPITAL",
      patientCount: 0,
      businessVolume: 0,
      commissionPercent: 15,
      pendingPayout: 0,
      status: "Active",
      phone: "+91 98230 11223"
    },
    {
      id: "DOC-0001",
      doctorCode: "DOC-0001",
      title: "DR.",
      fullName: "DR. SUMANBEN",
      initials: "SU",
      initialsBg: "bg-purple-600",
      qualifications: "MBBS, MD Pathology",
      doctorType: "Referring Doctor",
      councilRegNo: "MMC49214",
      specialization: "Diabetology",
      clinicName: "AMAN LAB",
      patientCount: 2,
      businessVolume: 672.6,
      commissionPercent: 15,
      pendingPayout: 101,
      status: "Active",
      phone: "+91 98765 43210"
    },
    {
      id: "DOC-0003",
      doctorCode: "DOC-0003",
      title: "Dr.",
      fullName: "Dr. Rohit Deshmukh",
      initials: "RD",
      initialsBg: "bg-teal-600",
      qualifications: "MBBS, MD (Pathology), FICP",
      doctorType: "In-House Pathologist",
      councilRegNo: "MCI-48920/2012",
      specialization: "Pathology & Lab Medicine",
      clinicName: "LABCORE CENTRAL",
      patientCount: 140,
      businessVolume: 42000,
      commissionPercent: 0,
      pendingPayout: 0,
      status: "Active",
      phone: "+91 98234 56789"
    }
  ]
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  renderAll();
});

// Render UI Components & Tables
function renderAll() {
  updateKPICards();
  renderDoctorsTable();
}

// 1. UPDATE STAT CARDS & COUNTS
function updateKPICards() {
  const allDocs = AppState.doctors;
  const refDocs = allDocs.filter(d => d.doctorType === 'Referring Doctor');
  const pathDocs = allDocs.filter(d => d.doctorType === 'In-House Pathologist');
  
  const totalVolume = refDocs.reduce((sum, d) => sum + d.businessVolume, 0);
  const totalPayout = refDocs.reduce((sum, d) => sum + d.pendingPayout, 0);
  const totalReferredPatients = refDocs.reduce((sum, d) => sum + d.patientCount, 0);

  // Top Cards
  document.getElementById('statTotalDocCount').innerText = allDocs.length;
  document.getElementById('statRefDocCount').innerText = refDocs.length;
  document.getElementById('statPathDocCount').innerText = pathDocs.length;
  document.getElementById('badgeActiveCount').innerText = `${allDocs.filter(d => d.status === 'Active').length} Active`;

  document.getElementById('statMonthPatients').innerText = totalReferredPatients;
  document.getElementById('statTotalPatients').innerText = totalReferredPatients;

  document.getElementById('statPaidRevenue').innerText = `₹${totalVolume.toFixed(1)}`;
  document.getElementById('statUnsettledIncentives').innerText = `₹${totalPayout}`;

  // Filter Buttons Counts
  document.getElementById('countAll').innerText = allDocs.length;
  document.getElementById('countRef').innerText = refDocs.length;
  document.getElementById('countPath').innerText = pathDocs.length;
  document.getElementById('countPayouts').innerText = `₹${totalPayout}`;
}

// 2. RENDER TABLE WITH REAL-TIME FILTERS
function renderDoctorsTable() {
  const tbody = document.getElementById('doctorsTableBody');
  if (!tbody) return;

  let list = [...AppState.doctors];

  // Tab filter
  if (AppState.currentTabFilter === 'REFERRING') {
    list = list.filter(d => d.doctorType === 'Referring Doctor');
  } else if (AppState.currentTabFilter === 'PATHOLOGIST') {
    list = list.filter(d => d.doctorType === 'In-House Pathologist');
  } else if (AppState.currentTabFilter === 'PAYOUTS') {
    list = list.filter(d => d.pendingPayout > 0);
  }

  // Search filter
  if (AppState.searchQuery) {
    const q = AppState.searchQuery.toLowerCase();
    list = list.filter(d =>
      d.fullName.toLowerCase().includes(q) ||
      d.doctorCode.toLowerCase().includes(q) ||
      d.councilRegNo.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q) ||
      d.clinicName.toLowerCase().includes(q)
    );
  }

  // Specialization Filter
  if (AppState.specFilter !== 'ALL') {
    list = list.filter(d => d.specialization.toLowerCase().includes(AppState.specFilter.toLowerCase()));
  }

  // Status Filter
  if (AppState.statusFilter !== 'ALL') {
    list = list.filter(d => d.status === AppState.statusFilter);
  }

  // Sorting
  if (AppState.sortFilter === 'AZ') {
    list.sort((a, b) => a.fullName.localeCompare(b.fullName));
  } else if (AppState.sortFilter === 'ZA') {
    list.sort((a, b) => b.fullName.localeCompare(a.fullName));
  } else if (AppState.sortFilter === 'COMMISSION') {
    list.sort((a, b) => b.pendingPayout - a.pendingPayout);
  }

  // Update table count indicator
  document.getElementById('tableShowingCount').innerText = list.length;
  document.getElementById('tableTotalCount').innerText = AppState.doctors.length;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="text-center py-10 text-slate-500">
          <i class="fa-solid fa-user-slash text-2xl mb-2"></i>
          <div>No practitioners found matching the selected criteria.</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map((doc, idx) => {
    const isPath = doc.doctorType.includes('Pathologist');

    return `
      <tr class="hover:bg-slate-800/30 transition">
        <!-- 1. Row Index -->
        <td class="text-slate-500 font-mono text-[11px]">${idx + 1}</td>

        <!-- 2. Doctor Details -->
        <td>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg ${doc.initialsBg || 'bg-indigo-600'} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow">
              ${doc.initials || doc.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div class="font-bold text-slate-100 flex items-center gap-1.5">
                <span>${doc.fullName}</span>
              </div>
              <div class="flex items-center gap-2 mt-0.5">
                <span class="text-[10px] text-slate-400 font-mono font-medium">${doc.doctorCode}</span>
                <span class="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-semibold">${doc.qualifications}</span>
              </div>
            </div>
          </div>
        </td>

        <!-- 3. Type & Credentials -->
        <td>
          <div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 ${
              isPath ? 'badge-pathologist' : 'badge-referring'
            }">
              <i class="fa-solid ${isPath ? 'fa-microscope' : 'fa-stethoscope'} text-[9px]"></i>
              ${doc.doctorType}
            </span>
            <div class="text-[11px] text-slate-400 font-mono mt-1">
              <i class="fa-solid fa-id-card text-[10px] text-slate-500 mr-1"></i>Reg: <strong class="text-slate-300">${doc.councilRegNo}</strong>
            </div>
          </div>
        </td>

        <!-- 4. Specialization & Clinic -->
        <td>
          <div class="font-semibold text-slate-200">${doc.specialization}</div>
          <div class="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1">
            <i class="fa-regular fa-hospital text-[10px] text-slate-500"></i>
            <span>${doc.clinicName}</span>
          </div>
        </td>

        <!-- 5. Referrals & Business -->
        <td>
          <div class="font-semibold text-slate-200">${doc.patientCount} Patients</div>
          <div class="text-[11px] font-mono font-semibold ${doc.businessVolume > 0 ? 'text-emerald-400' : 'text-slate-500'} mt-0.5">
            ₹${doc.businessVolume.toFixed(1)} Volume
          </div>
        </td>

        <!-- 6. Commission Ledger -->
        <td>
          <div>
            <div class="flex items-center gap-1.5 font-mono">
              ${doc.pendingPayout > 0 ? `<strong class="text-purple-400 font-bold text-xs">₹${doc.pendingPayout}</strong>` : ''}
              <span class="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
                ${doc.commissionPercent}%
              </span>
            </div>
            ${doc.pendingPayout > 0 ? `
              <button onclick="openPayoutModal('${doc.id}')" class="text-[11px] text-sky-400 hover:text-sky-300 font-semibold mt-1 flex items-center gap-1">
                <i class="fa-solid fa-money-bill-transfer text-[10px]"></i> Settle Payout
              </button>
            ` : `
              <span class="text-[10px] text-slate-500 mt-1 block">No pending dues</span>
            `}
          </div>
        </td>

        <!-- 7. Status -->
        <td>
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold badge-active inline-flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            ${doc.status}
          </span>
        </td>

        <!-- 8. Actions (Eye, Edit, Signature, Trash) -->
        <td class="text-right">
          <div class="flex items-center justify-end gap-2 text-slate-400">
            <button onclick="viewDoctorDetails('${doc.id}')" class="p-1.5 hover:text-sky-400 transition" title="View Patient List & EMR Trends">
              <i class="fa-regular fa-eye"></i>
            </button>
            <button onclick="editDoctor('${doc.id}')" class="p-1.5 hover:text-indigo-400 transition" title="Edit Profile & Rates">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button onclick="deleteDoctor('${doc.id}')" class="p-1.5 hover:text-rose-400 transition" title="Delete">
              <i class="fa-regular fa-trash-can"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 3. TAB FILTER SWITCHER
function switchTabFilter(filterType) {
  AppState.currentTabFilter = filterType;

  // Reset button styles
  ['ALL', 'REFERRING', 'PATHOLOGIST', 'PAYOUTS'].forEach(key => {
    const btn = document.getElementById(`tab-btn-${key}`);
    if (!btn) return;
    if (key === filterType) {
      btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow transition flex items-center gap-2";
    } else {
      btn.className = "px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition flex items-center gap-2";
    }
  });

  renderDoctorsTable();
}

// 4. SEARCH & FILTER HANDLERS
function handleDoctorSearch(query) {
  AppState.searchQuery = query;
  renderDoctorsTable();
}

function handleFilterChange() {
  AppState.specFilter = document.getElementById('specFilter').value;
  AppState.statusFilter = document.getElementById('statusFilter').value;
  AppState.sortFilter = document.getElementById('sortFilter').value;
  renderDoctorsTable();
}

// 5. MODAL CONTROLS: ADD NEW DOCTOR
function openAddDoctorModal() {
  document.getElementById('addDoctorModal').classList.remove('hidden');
}

function closeAddDoctorModal() {
  document.getElementById('addDoctorModal').classList.add('hidden');
}

function handleSaveNewDoctor(e) {
  e.preventDefault();
  const name = document.getElementById('newDocName').value;
  const title = document.getElementById('newDocTitle').value;
  const type = document.getElementById('newDocType').value;
  const qual = document.getElementById('newDocQual').value || 'MBBS';
  const reg = document.getElementById('newDocReg').value;
  const spec = document.getElementById('newDocSpec').value || 'General Practitioner';
  const clinic = document.getElementById('newDocClinic').value || 'City Clinic';
  const phone = document.getElementById('newDocPhone').value;
  const comm = Number(document.getElementById('newDocComm').value) || 15;

  const newDoc = {
    id: `DOC-000${AppState.doctors.length + 1}`,
    doctorCode: `DOC-000${AppState.doctors.length + 1}`,
    title: title,
    fullName: `${title} ${name.toUpperCase()}`,
    initials: name.substring(0, 2).toUpperCase(),
    initialsBg: "bg-sky-600",
    qualifications: qual,
    doctorType: type,
    councilRegNo: reg,
    specialization: spec,
    clinicName: clinic.toUpperCase(),
    patientCount: 0,
    businessVolume: 0,
    commissionPercent: comm,
    pendingPayout: 0,
    status: "Active",
    phone: phone
  };

  AppState.doctors.unshift(newDoc);
  closeAddDoctorModal();
  renderAll();
  showToast(`Practitioner ${newDoc.fullName} registered successfully!`, 'success');
}

// 6. MODAL CONTROLS: COMMISSION PAYOUT SETTLEMENT
function openPayoutModal(doctorId) {
  const doc = AppState.doctors.find(d => d.id === doctorId);
  if (!doc) return;
  AppState.selectedDoctorForPayout = doc;

  document.getElementById('payoutDocName').innerText = doc.fullName;
  document.getElementById('payoutAmount').innerText = `₹${doc.pendingPayout}`;
  document.getElementById('payoutModal').classList.remove('hidden');
}

function closePayoutModal() {
  document.getElementById('payoutModal').classList.add('hidden');
  AppState.selectedDoctorForPayout = null;
}

function confirmPayoutSettlement() {
  if (!AppState.selectedDoctorForPayout) return;
  const utr = document.getElementById('payoutUtrInput').value;
  const mode = document.getElementById('payoutModeSelect').value;

  AppState.selectedDoctorForPayout.pendingPayout = 0;
  closePayoutModal();
  renderAll();
  showToast(`Incentive payout settled via ${mode}. UTR: ${utr}`, 'success');
}

// 7. APPROVALS STATION (Pathologist Panic & Delta Verification)
function openApprovalsStation() {
  document.getElementById('approvalsModal').classList.remove('hidden');
}

function closeApprovalsModal() {
  document.getElementById('approvalsModal').classList.add('hidden');
}

function signOffPanicReport() {
  closeApprovalsModal();
  showToast(`Critical Panic Report REP-9042 authorized and released with digital seal!`, 'success');
}

function orderReTest() {
  closeApprovalsModal();
  showToast(`Test re-draw order sent to phlebotomy & lab technologist.`, 'warning');
}

// 8. EXPORT CSV
function exportDoctorsCSV() {
  const headers = ["Doctor Code", "Full Name", "Type", "Registration", "Specialization", "Clinic", "Patients", "Volume", "Commission %", "Pending Payout", "Status"];
  const rows = AppState.doctors.map(d => [
    d.doctorCode,
    `"${d.fullName}"`,
    `"${d.doctorType}"`,
    d.councilRegNo,
    `"${d.specialization}"`,
    `"${d.clinicName}"`,
    d.patientCount,
    d.businessVolume,
    d.commissionPercent,
    d.pendingPayout,
    d.status
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `LabCore_Doctors_Roster_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast(`Doctors data roster exported as CSV!`, 'success');
}

// Doctor Actions
function viewDoctorDetails(id) {
  const doc = AppState.doctors.find(d => d.id === id);
  if (!doc) return;
  alert(`Doctor: ${doc.fullName}\nCouncil Reg: ${doc.councilRegNo}\nSpecialization: ${doc.specialization} (${doc.clinicName})\nTotal Referred Patients: ${doc.patientCount}\nRevenue Volume: ₹${doc.businessVolume}\nCommission Rate: ${doc.commissionPercent}%`);
}

function editDoctor(id) {
  const doc = AppState.doctors.find(d => d.id === id);
  if (!doc) return;
  const newComm = prompt(`Update Commission Rate (%) for ${doc.fullName}:`, doc.commissionPercent);
  if (newComm !== null) {
    doc.commissionPercent = Number(newComm);
    renderAll();
    showToast(`Commission rate updated to ${newComm}% for ${doc.fullName}`, 'success');
  }
}

function deleteDoctor(id) {
  if (confirm("Are you sure you want to deactivate/remove this practitioner from the LIS system?")) {
    AppState.doctors = AppState.doctors.filter(d => d.id !== id);
    renderAll();
    showToast(`Practitioner removed successfully.`, 'warning');
  }
}

function switchMainView(viewName) {
  const docView = document.getElementById('doctorsModuleView');
  const aiView = document.getElementById('aiStudioModuleView');
  const repView = document.getElementById('reportsModuleView');

  // Reset top nav item active classes
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  if (viewName === 'ai-studio') {
    if (docView) docView.classList.add('hidden');
    if (repView) repView.classList.add('hidden');
    if (aiView) aiView.classList.remove('hidden');
    const aiNav = document.getElementById('nav-item-ai-studio');
    if (aiNav) aiNav.classList.add('active');
    if (window.AiStudio) {
      window.AiStudio.init();
    }
    showToast(`Navigated to AI STUDIO & RESEARCH.`, 'info');
  } else if (viewName === 'reports') {
    if (docView) docView.classList.add('hidden');
    if (aiView) aiView.classList.add('hidden');
    if (repView) repView.classList.remove('hidden');
    const repNav = document.getElementById('nav-item-reports');
    if (repNav) repNav.classList.add('active');
    showToast(`Navigated to Full A4 Master Report & Print Studio.`, 'success');
  } else {
    if (repView) repView.classList.add('hidden');
    if (aiView) aiView.classList.add('hidden');
    if (docView) docView.classList.remove('hidden');
    if (viewName === 'doctors') {
      const docNav = document.querySelectorAll('.nav-item')[2]; // Doctors nav
      if (docNav) docNav.classList.add('active');
    }
    showToast(`Navigated to ${viewName.toUpperCase()} module.`, 'info');
  }
}

function switchAiTabDirect(tabName) {
  switchMainView('ai-studio');
  if (window.AiStudio) {
    window.AiStudio.switchTab(tabName);
  }
}

// Toast notification helper
function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-bold transition-all transform duration-300 ${
    type === 'success' ? 'bg-emerald-600 text-white' : type === 'warning' ? 'bg-amber-600 text-white' : 'bg-indigo-600 text-white'
  }`;
  toast.innerHTML = `<i class="fa-solid ${type === 'success' ? 'fa-check' : 'fa-circle-info'}"></i> ${msg}`;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

