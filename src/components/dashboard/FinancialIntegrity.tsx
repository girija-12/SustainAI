import { useEffect, useState } from "react";
import Tesseract from "tesseract.js";

/* ---------- Mock data ---------- */
const mockUser = {
  _id: "user1",
  role: "block",
  linkedShg: "SHG_203",
};

const validSHGs = ["SHG_203", "SHG_101", "SHG_305"];

/* ---------- Workflow stages ---------- */
const fundStages = [
  "Central to State",
  "State to District",
  "District to Block",
  "Block to VO",
  "VO to SHG",
  "SHG to Member",
] as const;
type Stage = (typeof fundStages)[number];

/* ---------- Types ---------- */
type UploadedDoc = {
  id: string;
  role: string;
  type: string;
  stage: Stage;
  pfmsRef?: string;
  uploadedAt: string; // YYYY-MM-DD
  shg: string;
  filename: string;
  url: string;
  fileBlobUrl?: string;
  verificationStatus: "verified" | "suspicious" | "pending";
  verificationReason?: string;
};

type StageLog = {
  id: string;
  stage: Stage;
  amountTransferred?: number | null;
  transferredAt: string; // ISO
  proof?: UploadedDoc; // reference to uploaded doc
  note?: string;
};

type FundRecord = {
  id: string; // local id or PFMS id
  fundId?: string; // optional PFMS ref or government fund id
  scheme?: string;
  sanctionedAmount: number;
  createdAtGov?: string; // ISO date when sanctioned (optional)
  shg: string;
  currentStage: Stage;
  status: "pending" | "complete" | "flagged";
  history: StageLog[];
  pfmsRef?: string;
  createdLocalAt: string;
};

type AlertItem = {
  id: string;
  fundId: string;
  level: "info" | "warn" | "critical";
  message: string;
  createdAt: string;
  resolved?: boolean;
};

/* ---------- Helpers ---------- */
const todayDate = () => new Date().toISOString().split("T")[0];
const uid = (prefix = "") => `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 7)}`;

/* ---------- Local storage keys ---------- */
const LS_KEYS = {
  funds: "fi_funds_v1",
  uploads: "fi_uploads_v1",
  alerts: "fi_alerts_v1",
};

/* ---------- Small UI helper component: StageStepper ---------- */
function StageStepper({
  fund,
  onAttachProof,
  onJumpToStage,
}: {
  fund: FundRecord;
  onAttachProof: (stage: Stage) => void;
  onJumpToStage?: (stage: Stage) => void;
}) {
  // Calculate verified stages count
  const verifiedStages = fundStages.filter(stage => {
    const log = fund.history.find(h => h.stage === stage);
    return log?.proof?.verificationStatus === "verified";
  }).length;

  const percent = Math.round((verifiedStages / fundStages.length) * 100);
  const [displayPercent, setDisplayPercent] = useState(percent);

  // Animate percentage change
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayPercent(percent);
    }, 10); // Small delay to allow CSS transition to work
    return () => clearTimeout(timer);
  }, [percent]);

  function statusForStage(stage: Stage): "complete" | "pending" | "suspicious" | "missing" {
    const log = fund.history.find(h => h.stage === stage);
    if (!log || !log.proof) return "missing";
    if (log.proof.verificationStatus === "verified") return "complete";
    if (log.proof.verificationStatus === "pending") return "pending";
    if (log.proof.verificationStatus === "suspicious") return "suspicious";
    return "missing";
  }
  return (
    <div className="mt-3">
      <div className="flex items-center gap-3 mb-2">
        <div className="text-sm font-medium">Progress</div>
        <div className="flex-1 bg-gray-200 rounded h-2 overflow-hidden">
          <div 
            style={{ width: `${displayPercent}%` }} 
            className={`h-2 transition-all duration-500 ease-out ${
              displayPercent === 100 ? "bg-green-600" : "bg-indigo-500"
            }`} 
          />
        </div>
        <div className="text-xs text-gray-600 w-12 text-right">{displayPercent}%</div>
      </div>
      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {fundStages.map((stage, idx) => {
          const s = statusForStage(stage);
          const isCurrent = fund.currentStage === stage;
          const base =
            s === "complete"
              ? "bg-green-100 text-green-800 border-green-300"
              : s === "suspicious"
              ? "bg-red-100 text-red-800 border-red-300"
              : s === "pending"
              ? "bg-yellow-100 text-yellow-800 border-yellow-300"
              : "bg-gray-100 text-gray-700 border-gray-200";

          return (
            <div
              key={stage}
              className={`border rounded-lg p-3 ${base} flex flex-col justify-between h-full`}
            >
              <div>
                <p className="font-medium">Step {idx + 1}</p>
                <p className="text-sm">{stage}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {s === "complete" && "Verified"}
                  {s === "pending" && "Uploaded (pending)"}
                  {s === "suspicious" && "Suspicious"}
                  {s === "missing" && "Not uploaded"}
                </p>
              </div>

              <div className="mt-2 flex justify-between gap-1">
                <button 
                  className="text-blue-600 text-xs hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAttachProof(stage);
                  }}
                >
                  Attach
                </button>
                <button 
                  className="text-gray-600 text-xs hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onJumpToStage) onJumpToStage(stage);
                  }}
                >
                  View
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Component ---------- */
export default function FinancialIntegrity() {
  /* Upload & form state */
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<"sanction" | "receipt" | "transfer" | "utilization">("sanction");
  const [selectedStage, setSelectedStage] = useState<Stage>(fundStages[0]);
  const [pfmsRef, setPfmsRef] = useState("");
  const [docTypeFilter, setDocTypeFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");

  /* Fund creation inputs */
  const [createFundMode, setCreateFundMode] = useState(true);
  const [sanctionedAmountInput, setSanctionedAmountInput] = useState<string>("0");
  const [schemeInput, setSchemeInput] = useState<string>("NRLM");
  const [shgInput, setShgInput] = useState<string>(mockUser.linkedShg);

  /* Data stores */
  const [recentUploads, setRecentUploads] = useState<UploadedDoc[]>([]);
  const [funds, setFunds] = useState<FundRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [openPreviewId, setOpenPreviewId] = useState<string | null>(null);

  /* initialize from localStorage */
  useEffect(() => {
    const savedUploads = localStorage.getItem(LS_KEYS.uploads);
    const savedFunds = localStorage.getItem(LS_KEYS.funds);
    const savedAlerts = localStorage.getItem(LS_KEYS.alerts);
    if (savedUploads) setRecentUploads(JSON.parse(savedUploads));
    if (savedFunds) setFunds(JSON.parse(savedFunds));
    if (savedAlerts) setAlerts(JSON.parse(savedAlerts));
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.uploads, JSON.stringify(recentUploads));
  }, [recentUploads]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.funds, JSON.stringify(funds));
  }, [funds]);

  useEffect(() => {
    localStorage.setItem(LS_KEYS.alerts, JSON.stringify(alerts));
  }, [alerts]);

  /* Browser Notification permission */
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  /* ---------- OCR verification ---------- */
  const runOCRVerification = async (file: File, shg: string, stage: Stage, pfms?: string) => {
    return new Promise<{ status: "verified" | "suspicious"; reason: string }>(async (resolve) => {
      try {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const { data } = await Tesseract.recognize(e.target?.result as string, "eng", {
              logger: () => {},
            });
            const text = (data.text || "").toUpperCase();
            if (!validSHGs.includes(shg)) {
              resolve({ status: "suspicious", reason: "Unknown SHG ID in system" });
              return;
            }
            if (!text.includes(shg.toUpperCase())) {
              resolve({ status: "suspicious", reason: "SHG ID not found in document (OCR)" });
              return;
            }
            const stageKeyword = stage.split(" ")[0].toUpperCase();
            if (!text.includes(stageKeyword)) {
              resolve({ status: "suspicious", reason: `Stage keyword missing: ${stageKeyword}` });
              return;
            }
            if (pfms && !text.includes(pfms.toUpperCase())) {
              resolve({ status: "suspicious", reason: "PFMS reference not found in document" });
              return;
            }
            resolve({ status: "verified", reason: "Document matches SHG, stage & PFMS (where provided)" });
          } catch (err) {
            console.error("OCR inner error", err);
            resolve({ status: "suspicious", reason: "OCR engine failed to parse" });
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("OCR setup error", err);
        resolve({ status: "suspicious", reason: "OCR setup failed" });
      }
    });
  };

  /* ---------- Local anomaly engine ---------- */
  const runAnomalyChecksLocal = (fund: FundRecord): AlertItem[] => {
    const res: AlertItem[] = [];
    const hist = fund.history.sort((a, b) => new Date(a.transferredAt).getTime() - new Date(b.transferredAt).getTime());

    if (hist.length > 0 && fund.sanctionedAmount > 0) {
      const first = hist[0];
      const transferred = Number(first.amountTransferred || 0);
      if (transferred < fund.sanctionedAmount * 0.95) {
        res.push({
          id: uid("A"),
          fundId: fund.id,
          level: "warn",
          message: `First transfer (${transferred}) is significantly less than sanctioned (${fund.sanctionedAmount}).`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const last = hist[hist.length - 1];
    if (last) {
      const diffDays = (Date.now() - new Date(last.transferredAt).getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 10 && fund.currentStage !== "SHG to Member") {
        res.push({
          id: uid("A"),
          fundId: fund.id,
          level: "critical",
          message: `Fund at "${fund.currentStage}" for ${Math.floor(diffDays)} days without progress.`,
          createdAt: new Date().toISOString(),
        });
      }
    }

    const finalLog = hist.find((h) => h.stage === "SHG to Member");
    if (finalLog) {
      const hasUtil = hist.find((h) => h.stage === "SHG to Member" && h.proof);
      if (!hasUtil) {
        const diffDays = (Date.now() - new Date(finalLog.transferredAt).getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > 15) {
          res.push({
            id: uid("A"),
            fundId: fund.id,
            level: "warn",
            message: `Final transfer logged but no utilization proof uploaded after ${Math.floor(diffDays)} days.`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    const stageGroups: Record<string, number[]> = {};
    for (const h of hist) {
      stageGroups[h.stage] = stageGroups[h.stage] || [];
      if (typeof h.amountTransferred === "number") stageGroups[h.stage].push(h.amountTransferred);
    }
    for (const s of Object.keys(stageGroups)) {
      const arr = stageGroups[s];
      if (arr.length > 1) {
        const uniq = Array.from(new Set(arr.map((n) => Number(n).toFixed(2))));
        if (uniq.length > 1) {
          res.push({
            id: uid("A"),
            fundId: fund.id,
            level: "warn",
            message: `Multiple transfers recorded for stage "${s}" with different amounts (${uniq.join(", ")}).`,
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    return res;
  };

  const pushAlerts = (newAlerts: AlertItem[]) => {
    if (!newAlerts || newAlerts.length === 0) return;
    setAlerts((prev) => {
      const existingKeys = new Set(prev.map((p) => `${p.fundId}|${p.message}`));
      const filtered = newAlerts.filter((a) => !existingKeys.has(`${a.fundId}|${a.message}`));
      const merged = [...filtered, ...prev];
      for (const a of filtered) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification(`Alert: ${a.level.toUpperCase()}`, { body: a.message });
        }
      }
      return merged;
    });
  };

  /* ---------- Upload handling (creates UploadedDoc) ---------- */
  const handleProofUpload = async () => {
    if (!uploadedFile) return;
    setUploading(true);
    const blobUrl = URL.createObjectURL(uploadedFile);

    const upload: UploadedDoc = {
      id: uid("U-"),
      role: mockUser.role,
      type: docType,
      stage: selectedStage,
      pfmsRef: pfmsRef || undefined,
      uploadedAt: todayDate(),
      shg: shgInput || mockUser.linkedShg,
      filename: uploadedFile.name,
      url: "#",
      fileBlobUrl: blobUrl,
      verificationStatus: "pending",
      verificationReason: "Verification in progress...",
    };

    setRecentUploads((prev) => [upload, ...prev]);

    let newFund: FundRecord | undefined = undefined;
    if (docType === "sanction" && createFundMode) {
      const sanctionedAmount = Number(sanctionedAmountInput || 0);
      const fund: FundRecord = {
        id: uid("F-"),
        fundId: pfmsRef || undefined,
        scheme: schemeInput || "NRLM",
        sanctionedAmount,
        createdAtGov: new Date().toISOString(),
        shg: shgInput || mockUser.linkedShg,
        currentStage: "Central to State",
        status: "pending",
        history: [],
        pfmsRef: pfmsRef || undefined,
        createdLocalAt: new Date().toISOString(),
      };
      setFunds((prev) => [fund, ...prev]);
      newFund = fund;
    }

    const verification = await runOCRVerification(uploadedFile, upload.shg, upload.stage, upload.pfmsRef);
    setRecentUploads((prev) => prev.map((d) => (d.id === upload.id ? { ...d, verificationStatus: verification.status, verificationReason: verification.reason } : d)));

    let matchedFund = newFund || funds.find((f) => (pfmsRef && f.pfmsRef === pfmsRef) || (f.shg === upload.shg && f.currentStage === upload.stage));

    if (matchedFund) {
      const stageLog: StageLog = {
        id: uid("L-"),
        stage: upload.stage,
        amountTransferred: null,
        transferredAt: new Date().toISOString(),
        proof: upload,
        note: `Uploaded by ${mockUser.role}`,
      };
      setFunds((prev) => prev.map((f) => (f.id === matchedFund!.id ? { ...f, history: [stageLog, ...f.history], currentStage: upload.stage } : f)));
      const updatedFund = { ...matchedFund, history: [stageLog, ...matchedFund.history] } as FundRecord;
      const newAlerts = runAnomalyChecksLocal(updatedFund);
      pushAlerts(newAlerts);
    }

    setUploadedFile(null);
    setUploading(false);
    setPfmsRef("");
  };

  /* ---------- Attach proof to a specific fund stage (UI action) ---------- */
  const attachProofToFund = async (fundId: string, file: File, stage: Stage, amount?: number | null, note?: string) => {
  setUploading(true);
  const blobUrl = URL.createObjectURL(file);
  const upload: UploadedDoc = {
    id: uid("U-"),
    role: mockUser.role,
    type: "transfer",
    stage,
    pfmsRef: undefined,
    uploadedAt: todayDate(),
    shg: shgInput || mockUser.linkedShg,
    filename: file.name,
    url: "#",
    fileBlobUrl: blobUrl,
    verificationStatus: "pending",
    verificationReason: "Verification in progress...",
  };

  // Add the upload immediately
  setRecentUploads((prev) => [upload, ...prev]);

  // Create the stage log with pending status
  const stageLog: StageLog = {
    id: uid("L-"),
    stage,
    amountTransferred: amount ?? null,
    transferredAt: new Date().toISOString(),
    proof: upload,
    note: note || `Uploaded by ${mockUser.role}`,
  };

  // Update the fund immediately with pending proof
  setFunds((prev) =>
    prev.map((f) =>
      f.id === fundId
        ? {
            ...f,
            history: [stageLog, ...f.history],
            currentStage: stage,
          }
        : f
    )
  );

  // Run verification
  const verification = await runOCRVerification(file, shgInput || mockUser.linkedShg, stage);
  
  // Update the upload with verification status
  setRecentUploads((prev) => 
    prev.map((d) => 
      d.id === upload.id 
        ? { ...d, verificationStatus: verification.status, verificationReason: verification.reason } 
        : d
    )
  );

  // Update the fund's history with verified proof
  setFunds((prev) =>
    prev.map((f) =>
      f.id === fundId
        ? {
            ...f,
            history: f.history.map(h => 
              h.id === stageLog.id 
                ? { 
                    ...h, 
                    proof: { ...h.proof!, verificationStatus: verification.status, verificationReason: verification.reason } 
                  } 
                : h
            ),
            // Update status if we're at the final stage with verified proof
            status: f.currentStage === "SHG to Member" && verification.status === "verified" 
              ? "complete" 
              : f.status
          }
        : f
    )
  );

  const updated = funds.find((f) => f.id === fundId);
  if (updated) {
    const newAlerts = runAnomalyChecksLocal({
      ...updated,
      history: [stageLog, ...updated.history]
    });
    pushAlerts(newAlerts);
  }

  setUploading(false);
};

  /* ---------- Fund utilities ---------- */
  const advanceFundStage = (fundId: string) => {
  setFunds((prev) =>
    prev.map((f) => {
      if (f.id !== fundId) return f;
      const currentIndex = fundStages.indexOf(f.currentStage);
      const nextIndex = Math.min(currentIndex + 1, fundStages.length - 1);
      const nextStage = fundStages[nextIndex] as Stage;
      
      // Check if we have a verified proof for the current stage
      const hasVerifiedProof = f.history.some(
        h => h.stage === f.currentStage && 
             h.proof?.verificationStatus === "verified"
      );

      const updated = { 
        ...f, 
        currentStage: nextStage,
        // Update status if we're at the final stage with verified proof
        status: nextStage === "SHG to Member" && hasVerifiedProof 
          ? "complete" 
          : f.status
      };
      
      return updated;
    })
  );
};
  const resolveAlert = (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a)));
  };

  const deleteFund = (fundId: string) => {
    setFunds((prev) => prev.filter((f) => f.id !== fundId));
  };

  /* ---------- Filters & export ---------- */
  const filteredUploads = recentUploads.filter((doc) => (docTypeFilter === "all" || doc.type === docTypeFilter) && (stageFilter === "all" || doc.stage === stageFilter));

  const exportToCSV = () => {
    const csvHeader = "ID,Type,Stage,SHG,Uploaded At,Role,Filename,PFMS Ref,Verification Status,Reason\n";
    const csvRows = filteredUploads.map((doc) => `${doc.id},${doc.type},${doc.stage},${doc.shg},${doc.uploadedAt},${doc.role},${doc.filename},${doc.pfmsRef || ""},${doc.verificationStatus},${doc.verificationReason || ""}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + csvRows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "uploads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ---------- UI helpers: open file picker and attach ---------- */
  const openFileAndAttach = (fundId: string, stage: Stage) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const amountStr = prompt("Optional: Enter amount transferred in this proof (numeric)", "");
      const amount = amountStr ? Number(amountStr) : null;
      await attachProofToFund(fundId, file, stage, amount, `Proof uploaded via stepper by ${mockUser.role}`);
    };
    input.click();
  };

  /* ---------- Render UI ---------- */
  return (
    <>
      <style>{`
  .progress-transition {
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
`}</style>
      
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Panel */}
        <div className="lg:col-span-1">
          {/* Alerts */}
          <div className="bg-white p-4 rounded-xl shadow-md mt-4">
            <h4 className="font-semibold mb-2">Alerts</h4>
            {alerts.filter((a) => !a.resolved).length === 0 ? (
              <p className="text-sm text-gray-500">No active alerts.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {alerts
                  .filter((a) => !a.resolved)
                  .map((a) => (
                    <li key={a.id} className="flex justify-between items-start gap-2">
                      <div>
                        <div className={`font-medium ${a.level === "critical" ? "text-red-600" : a.level === "warn" ? "text-orange-600" : "text-gray-700"}`}>
                          {a.level.toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-600">{a.message}</div>
                        <div className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button className="text-blue-600 text-xs" onClick={() => resolveAlert(a.id)}>
                          Resolve
                        </button>
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        {/* Main Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upload Document + Fund creation */}
          <div className="bg-white p-6 rounded-xl shadow-md space-y-4">
            <h3 className="text-lg font-semibold">Upload Document / Create Fund</h3>

            <div className="grid grid-cols-2 gap-3">
              <select className="border p-2 rounded w-full" value={docType} onChange={(e) => setDocType(e.target.value as any)}>
                <option value="sanction">Sanction Letter</option>
                <option value="receipt">Bank Receipt</option>
                <option value="transfer">Fund Transfer Proof</option>
                <option value="utilization">Utilization Proof</option>
              </select>

              <select className="border p-2 rounded w-full" value={selectedStage} onChange={(e) => setSelectedStage(e.target.value as Stage)}>
                {fundStages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <input type="text" className="border p-2 rounded w-full" placeholder="PFMS Reference ID (optional)" value={pfmsRef} onChange={(e) => setPfmsRef(e.target.value)} />

              <select className="border p-2 rounded w-full" value={shgInput} onChange={(e) => setShgInput(e.target.value)}>
                {validSHGs.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="OTHER">OTHER - enter below</option>
              </select>

              {shgInput === "OTHER" && <input className="border p-2 rounded w-full col-span-2" placeholder="Enter SHG ID (e.g., SHG_999)" onChange={(e) => setShgInput(e.target.value)} />}

              <input type="text" className="border p-2 rounded w-full" placeholder="Scheme (e.g., NRLM)" value={schemeInput} onChange={(e) => setSchemeInput(e.target.value)} />

              <div className="flex items-center gap-2">
                <input type="checkbox" id="createFundMode" checked={createFundMode} onChange={(e) => setCreateFundMode(e.target.checked)} />
                <label htmlFor="createFundMode" className="text-sm">Create Fund from this sanction</label>
              </div>

              <input type="number" step="0.01" className="border p-2 rounded w-full" placeholder="Sanctioned amount (if creating fund)" value={sanctionedAmountInput} onChange={(e) => setSanctionedAmountInput(e.target.value)} />

              <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setUploadedFile(e.target.files?.[0] || null)} className="block w-full col-span-2" />

              {uploadedFile && (
                <p className="text-sm text-gray-600 col-span-2">
                  <strong>Selected:</strong> {uploadedFile.name}
                </p>
              )}

              <div className="col-span-2 flex gap-3">
                <button className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50" onClick={handleProofUpload} disabled={!uploadedFile || uploading}>
                  {uploading ? "Uploading & Verifying..." : "Upload Document"}
                </button>

                <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => { setUploadedFile(null); setPfmsRef(""); }}>
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Funds list with visual stage tracker */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-lg font-semibold mb-4">Funds</h3>

            {funds.length === 0 ? (
              <p className="text-sm text-gray-500">No funds created yet. Upload a sanction order and enable "Create Fund from Sanction".</p>
            ) : (
              <ul className="space-y-4">
                {funds.map((f) => (
                  <li key={f.id} className="border rounded p-3">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className="font-medium">{f.scheme} {f.fundId ? `— ${f.fundId}` : ""}</div>
                            <div className="text-xs text-gray-600">Sanctioned: ₹{f.sanctionedAmount.toLocaleString()} | SHG: {f.shg}</div>
                            <div className="text-xs text-gray-600">Current Stage: <span className="font-semibold">{f.currentStage}</span></div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xs text-gray-500">Created: {new Date(f.createdLocalAt).toLocaleDateString()}</div>
                            <div className={`text-xs font-semibold ${f.status === "flagged" ? "text-red-600" : "text-gray-700"}`}>{f.status.toUpperCase()}</div>
                          </div>
                        </div>

                        {/* StageStepper */}
                        <StageStepper
                          fund={f}
                          onAttachProof={(stage) => openFileAndAttach(f.id, stage)}
                          onJumpToStage={(stage) => {
                            // Scroll to uploaded docs filter for this stage
                            setStageFilter(stage);
                          }}
                        />

                        {/* history summary */}
                        <div className="mt-3 text-xs text-gray-600">
                          <strong>Last updates:</strong>{" "}
                          {f.history.length === 0 ? <span className="text-gray-400">No logs yet</span> : f.history.slice(0, 3).map((h) => `${h.stage} @ ${new Date(h.transferredAt).toLocaleDateString()}`).join(" • ")}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button className="text-sm text-blue-600" onClick={() => advanceFundStage(f.id)}>Advance Stage</button>

                        <button
                          className="text-sm text-green-600"
                          onClick={() => {
                            // attach proof to current stage
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = ".pdf,.jpg,.jpeg,.png";
                            input.onchange = async (e: any) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const amountStr = prompt("Optional: Enter amount transferred in this proof (numeric)", "");
                              const amount = amountStr ? Number(amountStr) : null;
                              await attachProofToFund(f.id, file, f.currentStage, amount, `Proof uploaded by ${mockUser.role}`);
                            };
                            input.click();
                          }}
                        >
                          Attach proof to current stage
                        </button>

                        <button className="text-sm text-red-600" onClick={() => deleteFund(f.id)}>Delete Fund</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Uploaded Docs + Filters */}
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Uploaded Documents</h3>
              <div className="flex gap-2 items-center">
                <select className="border p-1 rounded" value={docTypeFilter} onChange={(e) => setDocTypeFilter(e.target.value)}>
                  <option value="all">All Types</option>
                  <option value="sanction">Sanction Letter</option>
                  <option value="receipt">Bank Receipt</option>
                  <option value="transfer">Fund Transfer Proof</option>
                  <option value="utilization">Utilization Proof</option>
                </select>

                <select className="border p-1 rounded" value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
                  <option value="all">All Stages</option>
                  {fundStages.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <button onClick={exportToCSV} className="bg-blue-600 text-white px-3 py-2 rounded text-sm">Export CSV</button>
              </div>
            </div>

            {filteredUploads.length === 0 ? (
              <p className="text-gray-500 text-sm">No matching documents.</p>
            ) : (
              <ul className="divide-y text-sm space-y-4">
                {filteredUploads.map((doc) => (
                  <li key={doc.id} className="pt-3 pb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium capitalize">{doc.type} — {doc.shg}</p>
                        <p className="text-gray-500 text-xs">{doc.uploadedAt} by {doc.role}</p>
                        <p className="text-xs text-gray-700">Stage: {doc.stage} {doc.pfmsRef && (
                          <a href={`https://pfms.nic.in/Users/AgencyView.aspx?ref=${doc.pfmsRef}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-1">(PFMS)</a>
                        )}</p>
                        <p className="text-xs text-gray-700">{doc.filename}</p>
                        <p className={`text-xs font-bold ${doc.verificationStatus === "verified" ? "text-green-600" : doc.verificationStatus === "pending" ? "text-yellow-600" : "text-red-600"}`}>
                          {doc.verificationStatus.toUpperCase()} — {doc.verificationReason}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        {doc.fileBlobUrl && (
                          <button className="text-blue-600 text-sm" onClick={() => setOpenPreviewId((prev) => (prev === doc.id ? null : doc.id))}>
                            {openPreviewId === doc.id ? "Hide Preview" : "Preview"}
                          </button>
                        )}
                        <button className="text-red-600 text-sm" onClick={() => {
                          if (doc.fileBlobUrl) URL.revokeObjectURL(doc.fileBlobUrl);
                          setRecentUploads((prev) => prev.filter((d) => d.id !== doc.id));
                        }}>Delete</button>
                      </div>
                    </div>

                    {doc.fileBlobUrl && openPreviewId === doc.id && (
                      <iframe src={doc.fileBlobUrl} className="mt-3 w-full h-64 border rounded" title={`Preview of ${doc.filename}`} />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </>
  );
}