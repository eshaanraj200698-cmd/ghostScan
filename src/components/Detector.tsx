import { useState, useCallback, useRef } from "react";
import { Upload, ShieldCheck, ShieldAlert, ShieldQuestion, Sparkles, Loader2, X, Eye, FileWarning, Zap } from "lucide-react";
import { analyzeMedia, type DetectionResult } from "@/lib/detect.functions";
import { toast } from "sonner";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

export function Detector() {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image too large. Max 8 MB.");
      return;
    }
    setResult(null);
    setFileName(file.name);
    const dataUrl = await readAsDataUrl(file);
    setPreview(dataUrl);
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const reset = () => {
    setPreview(null);
    setResult(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const analyze = async () => {
    if (!preview) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await analyzeMedia({ data: { imageDataUrl: preview, fileName } });
      setResult(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Upload / Preview */}
      <div className="glass rounded-3xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Upload className="h-5 w-5 text-[var(--primary)]" /> Upload Media
          </h3>
          {preview && (
            <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition flex items-center gap-1">
              <X className="h-4 w-4" /> Clear
            </button>
          )}
        </div>

        {!preview ? (
          <label
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
              dragOver ? "border-[var(--primary)] bg-[oklch(0.68_0.24_305_/_0.08)]" : "border-[var(--border)] hover:border-[var(--primary)]/60"
            }`}
            style={{ minHeight: 320 }}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-hero-gradient shadow-glow animate-float">
              <Upload className="h-7 w-7 text-white" />
            </div>
            <p className="font-semibold text-foreground">Drop an image here</p>
            <p className="mt-1 text-sm text-muted-foreground">or click to browse · PNG, JPG, WEBP up to 8 MB</p>
            <p className="mt-6 text-xs text-muted-foreground">🔒 Processed securely · not stored</p>
          </label>
        ) : (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-[var(--border)]">
              <img src={preview} alt="Uploaded preview" className="w-full h-auto max-h-[420px] object-contain bg-black/40" />
              {loading && (
                <>
                  <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent animate-scan" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-10 w-10 text-[var(--primary)] animate-spin" />
                    <p className="text-sm font-medium">Scanning facial patterns…</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={analyze}
              disabled={loading}
              className="w-full rounded-xl bg-hero-gradient px-6 py-4 font-semibold text-white shadow-glow transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Analyzing…</> : <><Sparkles className="h-5 w-5" /> Run Deepfake Analysis</>}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="glass rounded-3xl p-6 min-h-[400px]">
        <h3 className="mb-4 text-lg font-semibold flex items-center gap-2">
          <Eye className="h-5 w-5 text-[var(--accent)]" /> Forensic Report
        </h3>

        {!result && !loading && (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-center">
            <div className="mb-3 rounded-full bg-[oklch(0.25_0.06_290_/_0.5)] p-4">
              <ShieldQuestion className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Upload media and run analysis to see results.</p>
          </div>
        )}

        {loading && (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3">
            <Zap className="h-8 w-8 text-[var(--primary)] animate-pulse" />
            <p className="text-sm text-muted-foreground">AI model inspecting pixels, landmarks & artifacts…</p>
          </div>
        )}

        {result && <ResultView result={result} />}
      </div>
    </div>
  );
}

function ResultView({ result }: { result: DetectionResult }) {
  const isReal = result.verdict === "REAL";
  const isFake = result.verdict === "DEEPFAKE";
  const Icon = isReal ? ShieldCheck : isFake ? ShieldAlert : ShieldQuestion;
  const color = isReal ? "var(--success)" : isFake ? "var(--destructive)" : "var(--accent)";
  const label = isReal ? "AUTHENTIC" : isFake ? "DEEPFAKE DETECTED" : "INCONCLUSIVE";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-5 border" style={{ borderColor: `oklch(from ${color} l c h / 0.4)`, background: `oklch(from ${color} l c h / 0.08)` }}>
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2.5" style={{ background: `oklch(from ${color} l c h / 0.2)` }}>
            <Icon className="h-7 w-7" style={{ color }} />
          </div>
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Verdict</p>
            <p className="text-xl font-bold" style={{ color }}>{label}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Confidence</p>
            <p className="text-2xl font-bold tabular-nums">{Math.round(result.confidence)}%</p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${result.confidence}%`, background: `linear-gradient(90deg, ${color}, oklch(from ${color} 0.85 c h))` }}
          />
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Summary</p>
        <p className="text-sm leading-relaxed">{result.summary}</p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Forensic Signals</p>
        <ul className="space-y-2">
          {result.signals.map((s, i) => (
            <li key={i} className="rounded-xl border border-[var(--border)] bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-sm">{s.label}</span>
                <SeverityBadge severity={s.severity} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{s.detail}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-black/20 p-3 flex gap-2">
        <FileWarning className="h-4 w-4 text-[var(--accent)] mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">{result.recommendation}</p>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: "low" | "medium" | "high" }) {
  const map = {
    low: { c: "var(--success)", t: "Low" },
    medium: { c: "var(--accent)", t: "Medium" },
    high: { c: "var(--destructive)", t: "High" },
  } as const;
  const { c, t } = map[severity];
  return (
    <span
      className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border"
      style={{ color: c, borderColor: `oklch(from ${c} l c h / 0.5)`, background: `oklch(from ${c} l c h / 0.1)` }}
    >
      {t}
    </span>
  );
}
