import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Sparkles, Cpu, Eye, Lock, Zap } from "lucide-react";
import { Detector } from "@/components/Detector";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <Toaster theme="dark" position="top-center" richColors />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-hero-gradient shadow-glow">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="font-bold tracking-tight">GHOSTSCAN</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Deepfake Forensics</p>
          </div>
        </div>
        <a
          href="#detect"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-black/20 px-4 py-2 text-xs font-medium hover:border-[var(--primary)]/60 transition"
        >
          <Sparkles className="h-3.5 w-3.5 text-[var(--primary)]" /> Try the detector
        </a>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pt-10 pb-16 sm:pt-20 sm:pb-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-black/20 px-3 py-1 text-xs text-muted-foreground mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--success)] animate-pulse" />
          AI vision model · live
        </div>
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
          <span className="text-gradient">Detect deepfakes</span>
          <br />
          <span className="text-foreground">before they fool you.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground">
          Upload an image. Our AI examines facial landmarks, lighting, texture and pixel-level
          artifacts to tell you if it's <span className="text-foreground">real or synthetic</span> —
          with a confidence score and a forensic explanation you can read.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <a
            href="#detect"
            className="rounded-xl bg-hero-gradient px-6 py-3 font-semibold text-white shadow-glow hover:scale-[1.02] transition"
          >
            Analyze an image
          </a>
          <a
            href="#how"
            className="rounded-xl border border-[var(--border)] bg-black/20 px-6 py-3 font-semibold hover:border-[var(--primary)]/60 transition"
          >
            How it works
          </a>
        </div>
      </section>

      {/* Detector */}
      <section id="detect" className="mx-auto max-w-7xl px-6 pb-20 scroll-mt-20">
        <Detector />
      </section>

      {/* How */}
      <section id="how" className="mx-auto max-w-7xl px-6 pb-24 scroll-mt-20">
        <div className="mb-10 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold"><span className="text-gradient">How GHOSTSCAN sees</span></h2>
          <p className="mt-3 text-muted-foreground">Multi-signal analysis powered by a vision-language model.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          <Feature icon={Eye} title="Facial forensics" desc="Inspects landmark geometry, eye reflections, pupil shape, jaw and ear asymmetry." />
          <Feature icon={Cpu} title="Pixel artifacts" desc="Looks for warping, frequency anomalies, edge halos and compression mismatches." />
          <Feature icon={Zap} title="Lighting coherence" desc="Verifies that shadows, highlights and color temperature agree across the scene." />
          <Feature icon={Sparkles} title="Confidence score" desc="Every verdict comes with a 0-100 score so you know how sure the model is." />
          <Feature icon={ShieldCheck} title="Explainable" desc="See the exact signals that drove the verdict — never a black-box answer." />
          <Feature icon={Lock} title="Private by default" desc="Images are sent only for analysis and are not retained." />
        </div>
      </section>

      {/* Manifesto */}
      <section className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28 text-center">
        <h2 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05]">
          <span className="text-gradient">“AI SHOULD PROTECT REALITY,</span>
          <br />
          <span className="text-gradient">NOT DISTORT IT.”</span>
        </h2>
      </section>

      <footer className="border-t border-[var(--border)] py-8 text-center text-xs text-muted-foreground">
        GHOSTSCAN · Deepfake Forensics
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <div className="glass rounded-2xl p-5 transition hover:-translate-y-0.5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-hero-gradient shadow-glow">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
    </div>
  );
}
