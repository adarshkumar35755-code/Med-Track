import { useEffect, useRef, useState } from "react";
import { parsePrescription } from "../api/prescription";
import type { Medicine, PrescriptionResult, TrackedMedication } from "../types";

const STORAGE_KEY = "amr_tracked_medications";

function computeScheduleTimes(freq: number | null): string[] {
  const f = freq && freq > 0 ? freq : 1;
  const slots = ["08:00", "13:00", "18:00", "22:00"];
  return slots.slice(0, Math.min(f, 4));
}

function loadMeds(): TrackedMedication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMeds(meds: TrackedMedication[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(meds));
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export default function PrescriptionTracker() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<PrescriptionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracked, setTracked] = useState<TrackedMedication[]>(loadMeds());
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // reminder check every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const hhmm = now.toTimeString().slice(0, 5);
      const today = todayStr();
      tracked.forEach((med) => {
        if (med.schedule_times.includes(hhmm)) {
          const takenToday = med.doses_taken[today] || [];
          if (!takenToday.includes(hhmm) && Notification.permission === "granted") {
            new Notification(`Time to take ${med.name}`, {
              body: med.dosage ? `Dosage: ${med.dosage}` : "Don't forget your dose.",
            });
          }
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [tracked]);

  function acceptFile(f: File) {
    if (!f.type.startsWith("image/")) {
      setError("Please upload an image file (JPG or PNG).");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setResult(null);
    setError(null);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    // reset so selecting the same file again still fires onChange
    e.target.value = "";
  }

  function handleDrag(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  }

  function openBrowser() {
    fileInputRef.current?.click();
  }

  function handleDropzoneKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openBrowser();
    }
  }

  async function handleExtract() {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await parsePrescription(file);
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed");
    } finally {
      setLoading(false);
    }
  }

  function addToTracker(med: Medicine) {
    const newMed: TrackedMedication = {
      ...med,
      id: crypto.randomUUID(),
      start_date: todayStr(),
      schedule_times: computeScheduleTimes(med.frequency_per_day),
      doses_taken: {},
    };
    const updated = [...tracked, newMed];
    setTracked(updated);
    saveMeds(updated);
  }

  function toggleDose(medId: string, time: string) {
    const today = todayStr();
    const updated = tracked.map((m) => {
      if (m.id !== medId) return m;
      const takenToday = m.doses_taken[today] || [];
      const nowTaken = takenToday.includes(time)
        ? takenToday.filter((t) => t !== time)
        : [...takenToday, time];
      return { ...m, doses_taken: { ...m.doses_taken, [today]: nowTaken } };
    });
    setTracked(updated);
    saveMeds(updated);
  }

  function removeMed(medId: string) {
    const updated = tracked.filter((m) => m.id !== medId);
    setTracked(updated);
    saveMeds(updated);
  }

  return (
    <div className="prescription-tracker">
      <section className="upload-box">
        <h3>Upload a prescription photo</h3>

        <div
          className={`dropzone ${dragActive ? "drag-active" : ""} ${preview ? "has-preview" : ""}`}
          onClick={openBrowser}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          aria-label="Upload a prescription photo, drag and drop or click to browse"
          onKeyDown={handleDropzoneKeyDown}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="dropzone-input"
            tabIndex={-1}
          />
          {preview ? (
            <>
              <img src={preview} alt="Prescription preview" className="rx-preview" />
              <p className="dropzone-hint">{file?.name} · click or drop to replace</p>
            </>
          ) : (
            <>
              <p className="dropzone-title">Drop a prescription photo here</p>
              <p className="dropzone-hint">or click to browse · JPG, PNG</p>
            </>
          )}
        </div>

        <button
  className="tracker-extract-btn"
  onClick={handleExtract}
  disabled={!file || loading}
>
  <span className="tracker-flap-left"></span>
  <span className="tracker-flap-right"></span>
  {loading ? "Reading prescription…" : "Extract medicines"}
</button>
        {error && <div className="error-box">{error}</div>}
      </section>

      {result && (
        <section className="extracted-meds">
          <h4>Found {result.medicines.length} medicine(s)</h4>
          {result.notes && <p className="notes">{result.notes}</p>}
          {result.medicines.map((m, i) => (
            <div className="med-card" key={i}>
              <strong>{m.name}</strong>{" "}
              {m.is_antibiotic && <span className="chip antibiotic-chip">Antibiotic</span>}
              <p>
                {m.dosage || "dosage unclear"} · {m.frequency_per_day ?? "?"}x/day ·{" "}
                {m.duration_days ? `${m.duration_days} days` : "duration unclear"}
              </p>
              {m.instructions && <p className="instructions">{m.instructions}</p>}
              <button className="tracker-add-btn" onClick={() => addToTracker(m)}>
                <span className="tracker-flap-left" />
                Add to my tracker
                <span className="tracker-flap-right" />
              </button>
            </div>
          ))}
        </section>
      )}

      <section className="tracked-meds">
        <h3>Today's doses</h3>
        {tracked.length === 0 && <p>No medicines tracked yet.</p>}
        {tracked.map((med) => {
          const takenToday = med.doses_taken[todayStr()] || [];
          return (
            <div className="med-card" key={med.id}>
              <div className="med-card-header">
                <strong>{med.name}</strong>
                <button className="remove-btn" onClick={() => removeMed(med.id)}>✕</button>
              </div>
              <div className="dose-times">
                {med.schedule_times.map((t) => (
                  <label key={t} className="dose-checkbox">
                    <input
                      type="checkbox"
                      checked={takenToday.includes(t)}
                      onChange={() => toggleDose(med.id, t)}
                    />
                    {t}
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}