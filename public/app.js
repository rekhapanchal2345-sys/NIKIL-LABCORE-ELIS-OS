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
      <tr style="border-bottom:1px solid #F1F5F9; transition:background 0.15s;" onmouseover="this.style.background='#F0F9FF'" onmouseout="this.style.background=''">
        <!-- 1. Row Index -->
        <td style="font-family:monospace; font-size:0.7rem; color:#94A3B8; padding:12px 14px;">${idx + 1}</td>

        <!-- 2. Doctor Details -->
        <td>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg ${doc.initialsBg || 'bg-indigo-600'} text-white font-bold flex items-center justify-center text-xs shrink-0 shadow">
              ${doc.initials || doc.fullName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div style="font-weight:700; color:#0F172A; font-size:0.82rem; display:flex; align-items:center; gap:5px;">
                <span>${doc.fullName}</span>
              </div>
              <div style="display:flex; align-items:center; gap:8px; margin-top:3px;">
                <span style="font-size:0.68rem; color:#64748B; font-family:monospace;">${doc.doctorCode}</span>
                <span style="font-size:0.65rem; background:#F1F5F9; color:#475569; padding:1px 6px; border-radius:4px; font-weight:600;">${doc.qualifications}</span>
              </div>
            </div>
          </div>
        </td>

        <!-- 3. Type & Credentials -->
        <td>
          <div>
            <span class="badge ${isPath ? 'badge-pathologist' : 'badge-referring'}" style="font-size:0.68rem;">
              <i class="fa-solid ${isPath ? 'fa-microscope' : 'fa-stethoscope'} text-[9px]"></i>
              ${doc.doctorType}
            </span>
            <div style="font-size:0.7rem; color:#64748B; font-family:monospace; margin-top:4px;">
              <i class="fa-solid fa-id-card" style="font-size:0.65rem; color:#94A3B8; margin-right:3px;"></i>Reg: <strong style="color:#0F172A;">${doc.councilRegNo}</strong>
            </div>
          </div>
        </td>

        <!-- 4. Specialization & Clinic -->
        <td>
          <div style="font-weight:600; color:#0F172A; font-size:0.8rem;">${doc.specialization}</div>
          <div style="font-size:0.72rem; color:#64748B; margin-top:3px; display:flex; align-items:center; gap:4px;">
            <i class="fa-regular fa-hospital" style="font-size:0.65rem; color:#94A3B8;"></i>
            <span>${doc.clinicName}</span>
          </div>
        </td>

        <!-- 5. Referrals & Business -->
        <td>
          <div style="font-weight:700; color:#0F172A; font-size:0.82rem;">${doc.patientCount} Patients</div>
          <div style="font-size:0.72rem; font-family:monospace; font-weight:600; color:${doc.businessVolume > 0 ? '#059669' : '#94A3B8'}; margin-top:3px;">
            ₹${doc.businessVolume.toFixed(1)} Volume
          </div>
        </td>

        <!-- 6. Commission Ledger -->
        <td>
          <div>
            <div style="display:flex; align-items:center; gap:6px; font-family:monospace;">
              ${doc.pendingPayout > 0 ? `<strong style="color:#D97706; font-size:0.82rem;">₹${doc.pendingPayout}</strong>` : ''}
              <span style="font-size:0.68rem; padding:2px 7px; border-radius:4px; background:#F5F3FF; color:#7C3AED; border:1px solid rgba(124,58,237,0.2); font-weight:700;">
                ${doc.commissionPercent}%
              </span>
            </div>
            ${doc.pendingPayout > 0 ? `
              <button onclick="openPayoutModal('${doc.id}')" style="font-size:0.7rem; color:#0891B2; font-weight:600; margin-top:4px; display:flex; align-items:center; gap:3px; background:none; border:none; cursor:pointer; padding:0;">
                <i class="fa-solid fa-money-bill-transfer" style="font-size:0.65rem;"></i> Settle Payout
              </button>
            ` : `
              <span style="font-size:0.68rem; color:#94A3B8; margin-top:3px; display:block;">No pending dues</span>
            `}
          </div>
        </td>

        <!-- 7. Status -->
        <td>
          <span class="badge badge-active" style="font-size:0.68rem;">
            <span style="width:5px; height:5px; border-radius:50%; background:#059669; display:inline-block;"></span>
            ${doc.status}
          </span>
        </td>

        <!-- 8. Actions (Eye, Edit, Signature, Trash) -->
        <td class="text-right">
          <div style="display:flex; align-items:center; justify-content:flex-end; gap:4px;">
            <button onclick="viewDoctorDetails('${doc.id}')" style="width:30px; height:30px; border-radius:7px; border:1.5px solid #E2E8F0; background:#F8FAFC; color:#475569; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.75rem; transition:all 0.15s;" title="View Details" onmouseover="this.style.borderColor='#0891B2'; this.style.color='#0891B2'; this.style.background='#E0F7FF';" onmouseout="this.style.borderColor='#E2E8F0'; this.style.color='#475569'; this.style.background='#F8FAFC';">
              <i class="fa-regular fa-eye"></i>
            </button>
            <button onclick="editDoctor('${doc.id}')" style="width:30px; height:30px; border-radius:7px; border:1.5px solid #E2E8F0; background:#F8FAFC; color:#475569; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.75rem; transition:all 0.15s;" title="Edit Profile" onmouseover="this.style.borderColor='#6366F1'; this.style.color='#6366F1'; this.style.background='#EEF2FF';" onmouseout="this.style.borderColor='#E2E8F0'; this.style.color='#475569'; this.style.background='#F8FAFC';">
              <i class="fa-regular fa-pen-to-square"></i>
            </button>
            <button onclick="deleteDoctor('${doc.id}')" style="width:30px; height:30px; border-radius:7px; border:1.5px solid #E2E8F0; background:#F8FAFC; color:#475569; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:0.75rem; transition:all 0.15s;" title="Remove" onmouseover="this.style.borderColor='#DC2626'; this.style.color='#DC2626'; this.style.background='#FEF2F2';" onmouseout="this.style.borderColor='#E2E8F0'; this.style.color='#475569'; this.style.background='#F8FAFC';">
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
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
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
  const iconMap = { success: 'fa-circle-check', warning: 'fa-triangle-exclamation', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const colorMap = { success: '#059669', warning: '#D97706', error: '#DC2626', info: '#2563EB' };

  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    Object.assign(container.style, { position:'fixed', bottom:'24px', right:'24px', zIndex:'9999', display:'flex', flexDirection:'column', gap:'8px', maxWidth:'380px' });
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type] || 'fa-circle-info'} toast-icon" style="color:${colorMap[type] || '#2563EB'};"></i>
    <div style="flex:1;">
      <div style="font-size:0.8rem; font-weight:600; color:#0F172A;">${msg}</div>
    </div>
    <button onclick="this.closest('.toast').remove()" style="color:#94A3B8; background:none; border:none; cursor:pointer; font-size:0.9rem; flex-shrink:0;"><i class="fa-solid fa-xmark"></i></button>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px) scale(0.95)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

