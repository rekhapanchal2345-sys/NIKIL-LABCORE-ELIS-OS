export const chunk5 = `
        {/* ==================================================================== */}
        {/* TAB 3: ABHA CREATION & KYC WORKSTATION (MILESTONE 1)                 */}
        {/* ==================================================================== */}
        {activeTab === "abha-m1" && (
          <div className="space-y-6">
            {/* Sub-mode Navigation Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900">ABHA Registration, KYC & Health Card Desk (M1)</h2>
                  <p className="text-xs text-slate-500">Government of India UIDAI & NHA e-KYC Verification Pipeline</p>
                </div>
              </div>

              {/* Sub-mode Switcher */}
              <div className="flex items-center p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setM1Mode("enroll");
                    setAadhaarStep("input");
                    setCreatedAbha(null);
                  }}
                  className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer \${
                    m1Mode === "enroll" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }\`}
                >
                  Enroll New ABHA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setM1Mode("verify");
                    setVerifyStep("input");
                    setVerifyResult(null);
                  }}
                  className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer \${
                    m1Mode === "verify" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                  }\`}
                >
                  Lookup & KYC Verify
                </button>
              </div>
            </div>

            {/* Mode A: Enrollment Flow */}
            {m1Mode === "enroll" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                  {/* Method Selection */}
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                    <button
                      type="button"
                      onClick={() => setM1EnrollMethod("aadhaar")}
                      className={\`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer \${
                        m1EnrollMethod === "aadhaar"
                          ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }\`}
                    >
                      <Fingerprint className="w-4 h-4" />
                      <span>Aadhaar OTP (Recommended)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setM1EnrollMethod("mobile")}
                      className={\`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer \${
                        m1EnrollMethod === "mobile"
                          ? "bg-blue-50 border-blue-300 text-blue-700 shadow-2xs"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }\`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Mobile OTP Fallback</span>
                    </button>
                  </div>

                  {/* Step 1: Input */}
                  {aadhaarStep === "input" && (
                    <div className="space-y-4">
                      {m1EnrollMethod === "aadhaar" ? (
                        <>
                          <div>
                            <label className="text-xs font-bold text-slate-800 block mb-1.5">
                              Patient 12-Digit Aadhaar Number
                            </label>
                            <input
                              type="text"
                              maxLength={14}
                              value={aadhaarInput}
                              onChange={(e) => setAadhaarInput(e.target.value)}
                              placeholder="XXXX-XXXX-XXXX"
                              className="w-full bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                              An OTP will be dispatched to the mobile number registered with UIDAI.
                            </p>
                          </div>

                          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              id="aadhaarConsentCheck"
                              checked={aadhaarConsent}
                              onChange={(e) => setAadhaarConsent(e.target.checked)}
                              className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                            />
                            <label htmlFor="aadhaarConsentCheck" className="text-[11px] text-slate-600 leading-relaxed cursor-pointer">
                              I hereby give voluntary consent to create Ayushman Bharat Health Account (ABHA) and verify demographic details with UIDAI under the Aadhaar Act 2016.
                            </label>
                          </div>

                          <button
                            type="button"
                            onClick={handleAadhaarSendOtp}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>Generate & Send Aadhaar OTP</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-700 block mb-1">First Name</label>
                              <input
                                type="text"
                                value={mobileDemographics.firstName}
                                onChange={(e) => setMobileDemographics({ ...mobileDemographics, firstName: e.target.value })}
                                placeholder="e.g. Ramesh"
                                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-700 block mb-1">Last Name</label>
                              <input
                                type="text"
                                value={mobileDemographics.lastName}
                                onChange={(e) => setMobileDemographics({ ...mobileDemographics, lastName: e.target.value })}
                                placeholder="e.g. Patil"
                                className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-bold text-slate-700 block mb-1">10-Digit Mobile Number</label>
                            <input
                              type="text"
                              maxLength={10}
                              value={mobileInput}
                              onChange={(e) => setMobileInput(e.target.value)}
                              placeholder="98XXXXXXXX"
                              className="w-full bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-900 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>

                          <button
                            type="button"
                            onClick={handleMobileEnroll}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <span>Enroll via Mobile OTP</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Step 2: OTP Verification */}
                  {aadhaarStep === "otp" && (
                    <div className="space-y-4">
                      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                        <span className="text-xs font-bold text-blue-900 block">Enter 6-Digit Verification OTP</span>
                        <p className="text-[11px] text-blue-700 mt-0.5">
                          A 6-digit OTP has been dispatched to patient's Aadhaar-linked mobile number.
                        </p>
                      </div>

                      <div>
                        <input
                          type="text"
                          maxLength={6}
                          value={aadhaarOtp}
                          onChange={(e) => setAadhaarOtp(e.target.value)}
                          placeholder="849201"
                          className="w-full bg-slate-50 border border-slate-200 text-center tracking-widest text-lg font-mono font-bold text-slate-900 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Resend OTP in: <strong className="font-mono text-slate-800">{aadhaarTimer}s</strong></span>
                        <button
                          type="button"
                          disabled={aadhaarTimer > 0}
                          onClick={() => {
                            setAadhaarTimer(60);
                            showToast("New OTP dispatched to registered mobile");
                          }}
                          className={\`font-bold \${aadhaarTimer > 0 ? "text-slate-400 cursor-not-allowed" : "text-blue-600 hover:text-blue-800 cursor-pointer"}\`}
                        >
                          Resend Code
                        </button>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setAadhaarStep("input")}
                          className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={handleAadhaarVerifyOtp}
                          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify & Issue ABHA</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Success View */}
                  {aadhaarStep === "success" && createdAbha && (
                    <div className="space-y-4">
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
                        <h4 className="text-sm font-bold text-emerald-950">ABHA Created & Verified Successfully!</h4>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          National Health Account issued and authenticated with Central NHA Gateway.
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">ABHA Number:</span>
                          <strong className="font-mono text-emerald-700 font-bold text-sm">
                            {formatAbhaNumber(createdAbha.abhaNumber)}
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">ABHA Address:</span>
                          <strong className="font-mono text-blue-700">{createdAbha.abhaAddress}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Patient Name:</span>
                          <span className="font-bold text-slate-900">{createdAbha.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Gender / DOB:</span>
                          <span>{createdAbha.gender} • {createdAbha.dateOfBirth}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setCardModalPatient(createdAbha)}
                          className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View & Print Official ABHA Card</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAadhaarStep("input");
                            setCreatedAbha(null);
                            setAadhaarInput("");
                          }}
                          className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          New Enrollment
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Live ABHA Digital Card Preview */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-blue-600" /> Digital ABHA Card Preview
                  </h3>

                  <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-blue-200 font-extrabold block">
                          Government of India
                        </span>
                        <h4 className="text-sm font-black tracking-wide">Ayushman Bharat Health Account</h4>
                      </div>
                      <Shield className="w-6 h-6 text-emerald-400" />
                    </div>

                    <div className="flex items-center gap-3.5 my-4">
                      <div className="w-14 h-14 bg-white/10 rounded-xl border border-white/20 flex items-center justify-center shrink-0">
                        <User className="w-8 h-8 text-white/80" />
                      </div>
                      <div>
                        <span className="text-base font-bold text-white block">
                          {createdAbha?.name || "Aarav Deshmukh"}
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-300 block tracking-wider">
                          {formatAbhaNumber(createdAbha?.abhaNumber || "91-4402-8812-9901")}
                        </span>
                        <span className="text-[11px] text-blue-200 block font-mono">
                          {createdAbha?.abhaAddress || "aarav.deshmukh@sbx"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/15 flex justify-between items-center text-[10px] text-blue-100">
                      <span>Gender: <strong>{createdAbha?.gender || "MALE"}</strong></span>
                      <span>DOB: <strong>{createdAbha?.dateOfBirth || "1989-11-14"}</strong></span>
                      <span>Status: <strong className="text-emerald-300 font-bold">VERIFIED</strong></span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed text-center">
                    Official NHA health card compatible with ABDM QR scanners across all healthcare facilities in India.
                  </p>
                </div>
              </div>
            )}

            {/* Mode B: Lookup & Demographic KYC Verification */}
            {m1Mode === "verify" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
                <div className="max-w-xl space-y-3">
                  <label className="text-xs font-bold text-slate-800 block">
                    Search Patient by 14-Digit ABHA Number or PHR Address
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verifyInput}
                      onChange={(e) => setVerifyInput(e.target.value)}
                      placeholder="e.g. 91-4402-8812-9901 or patient@sbx"
                      className="flex-1 bg-slate-50 border border-slate-200 text-sm font-mono font-bold text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyAbha}
                      disabled={verifyLoading}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                    >
                      {verifyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      <span>Verify KYC</span>
                    </button>
                  </div>
                </div>

                {verifyResult && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        <h4 className="text-sm font-bold text-slate-900">ABDM Registry Match Confirmed</h4>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
                        {verifyResult.matchingScore}% KYC Match Score
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Patient Full Name</span>
                        <strong className="text-slate-900 text-sm">{verifyResult.name}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ABHA Number</span>
                        <strong className="font-mono text-emerald-700 text-sm font-bold">
                          {formatAbhaNumber(verifyResult.abhaNumber)}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ABHA Address</span>
                        <strong className="font-mono text-blue-700 text-sm font-bold">
                          {verifyResult.abhaAddress}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Gender & DOB</span>
                        <span className="text-slate-800 font-semibold">{verifyResult.gender} • {verifyResult.dateOfBirth}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCardModalPatient(verifyResult)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print ABHA Digital Card</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================================================================== */}
        {/* TAB 4: CARE CONTEXT LINKER (MILESTONE 2 - HIP)                       */}
        {/* ==================================================================== */}
        {activeTab === "care-context-m2" && (
          <div className="space-y-6">
            {/* Header with Search, Filter & New Care Context Button */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-indigo-600" />
                    <span>Care Context Linker & HIP Discovery Desk (M2)</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Links patient OPD consultations, IPD ward episodes, and diagnostic laboratory panels to their national ABHA profile.
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowNewCcModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Link New Episode</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={ccSearch}
                    onChange={(e) => setCcSearch(e.target.value)}
                    placeholder="Search by UHID, Patient Name, or Order Ref..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Filter:</span>
                  {(["ALL", "LINKED", "UNLINKED"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setCcFilter(mode)}
                      className={\`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer \${
                        ccFilter === mode
                          ? "bg-indigo-600 text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }\`}
                    >
                      {mode === "ALL" ? "All Episodes" : mode === "LINKED" ? "Linked (M2)" : "Unlinked"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Care Context Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider bg-slate-50/70">
                      <th className="py-3 px-4">Care Context Reference</th>
                      <th className="py-3 px-4">Patient UHID & Demographics</th>
                      <th className="py-3 px-4">Encounter / Episode Details</th>
                      <th className="py-3 px-4">ABHA ID & Address</th>
                      <th className="py-3 px-4">Gateway Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {careContexts
                      .filter((c) => {
                        if (ccFilter === "LINKED" && !c.isLinked) return false;
                        if (ccFilter === "UNLINKED" && c.isLinked) return false;
                        if (ccSearch.trim()) {
                          const q = ccSearch.toLowerCase();
                          const matchesName = \`\${c.patient.firstName} \${c.patient.lastName}\`.toLowerCase().includes(q);
                          const matchesUhid = c.patient.uhid.toLowerCase().includes(q);
                          const matchesRef = c.careContextReference.toLowerCase().includes(q);
                          return matchesName || matchesUhid || matchesRef;
                        }
                        return true;
                      })
                      .map((cc) => (
                        <tr key={cc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-slate-900 block">{cc.careContextReference}</span>
                            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">{cc.orderId || "OPD-VISIT"}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <strong className="text-slate-900 block font-bold">
                              {cc.patient.firstName} {cc.patient.lastName}
                            </strong>
                            <span className="text-[11px] font-mono text-blue-600 block">{cc.patient.uhid}</span>
                            <span className="text-[10px] text-slate-500">{cc.patient.gender} • {cc.patient.phone}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-900 block">{cc.display}</span>
                            <span className="text-[11px] text-slate-500 block">{cc.episodeType} ({cc.department})</span>
                            <span className="text-[10px] text-slate-400">{cc.doctorName}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-slate-800 font-bold block text-[11px]">
                              {formatAbhaNumber(cc.patient.abhaNumber || "")}
                            </span>
                            <span className="text-blue-600 text-[11px] font-semibold">{cc.patient.abhaAddress}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            {cc.isLinked ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Linked (M2)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" /> Pending Link
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {!cc.isLinked ? (
                                <button
                                  type="button"
                                  onClick={() => handleLinkCareContext(cc.id)}
                                  disabled={linkingCcId === cc.id}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                                >
                                  {linkingCcId === cc.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <LinkIcon className="w-3 h-3" />}
                                  <span>Link</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDelinkCareContext(cc.id)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                                  title="Delink Care Context"
                                >
                                  Delink
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveTab("fhir-m3");
                                  handleLoadFhirPreset("sample-cbc-001");
                                }}
                                className="p-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer"
                                title="View HL7 FHIR R4 Bundle"
                              >
                                <FileCode className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
`;
