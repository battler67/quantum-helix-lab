import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  Atom, Binary, Dna, Search, LineChart, Sparkles, Upload, Cpu, BrainCircuit, Gauge,
  ArrowRight, Github, Zap,
} from "lucide-react";
import { DNAHelix } from "@/components/DNAHelix";
import { BackgroundFX } from "@/components/BackgroundFX";

const fadeUp = {
  hidden: { opacity: 0, y: 24, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const stagger = { show: { transition: { staggerChildren: 0.08 } } };

const floatingFeatures = [
  { icon: Cpu, label: "Quantum Computing", tone: "from-emerald-400/30 to-emerald-600/10" },
  { icon: Binary, label: "FRQI Encoding", tone: "from-cyan-400/30 to-cyan-600/10" },
  { icon: Dna, label: "DNA Visualization", tone: "from-emerald-400/30 to-teal-600/10" },
  { icon: Search, label: "Grover Search", tone: "from-cyan-400/30 to-emerald-600/10" },
  { icon: LineChart, label: "Alignment Analytics", tone: "from-emerald-400/30 to-cyan-600/10" },
];

const features = [
  { icon: Upload, title: "DNA Sequence Upload", desc: "Drag-and-drop FASTA, TXT, or paste raw sequences. Instant parsing with base-level validation." },
  { icon: Binary, title: "Quantum Encoding", desc: "FRQI amplitude encoding maps nucleotide intensities into quantum states." },
  { icon: LineChart, title: "Alignment Analytics", desc: "Real-time similarity, gap %, mismatch heatmaps and mutation scoring." },
  { icon: Dna, title: "3D Visualization", desc: "Interactive double-helix viewer with base coloring and mutation highlighting." },
  { icon: BrainCircuit, title: "AI Assisted Analysis", desc: "Genomic assistant summarizes alignments and surfaces meaningful variants." },
  { icon: Gauge, title: "High Performance Simulation", desc: "Optimized qiskit-style simulator with Grover speedup benchmarks." },
];

export function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundFX />

      {/* Nav */}
      <header className="relative z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-emerald to-cyan-glow glow-emerald">
              <Dna className="absolute inset-0 m-auto h-4 w-4 text-background" />
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">QDNA</span>
            <span className="ml-1 rounded-full border border-emerald/30 bg-emerald/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-emerald">
              alpha
            </span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition">Features</a>
            <a href="#research" className="hover:text-foreground transition">Research</a>
            <a href="#pipeline" className="hover:text-foreground transition">Pipeline</a>
            <a href="#" className="flex items-center gap-1 hover:text-foreground transition"><Github className="h-4 w-4" /> GitHub</a>
          </nav>
          <Link to="/dashboard" className="group relative inline-flex items-center gap-1.5 rounded-full border border-emerald/40 bg-emerald/10 px-4 py-1.5 text-sm font-medium text-emerald transition hover:bg-emerald/20">
            Launch <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 pt-10 pb-24 lg:grid-cols-[1.05fr_1fr] lg:pt-16">
          <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col justify-center">
            <motion.div variants={fadeUp} className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-emerald/30 bg-card/60 px-3 py-1 text-xs text-emerald backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Quantum × Bioinformatics Hackathon Build
            </motion.div>
            <motion.h1 variants={fadeUp} className="font-display text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Quantum DNA<br />
              <span className="text-gradient-emerald">Sequence Alignment</span>
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-6 max-w-xl text-lg text-muted-foreground">
              Accelerating genomic analysis using Quantum Computing, FRQI Encoding, and Grover Search — an interactive lab for the next era of computational biology.
            </motion.p>
            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/dashboard" className="group relative inline-flex items-center gap-2 rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:scale-[1.02] glow-emerald">
                <Zap className="h-4 w-4" /> Launch Dashboard
                <span className="absolute inset-0 -z-10 rounded-full bg-emerald opacity-0 blur-xl transition group-hover:opacity-60" />
              </Link>
              <a href="#research" className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-foreground backdrop-blur transition hover:border-emerald/40 hover:bg-emerald/10">
                View Research <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </motion.div>
            <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" /> 12 qubits online</div>
              <div>FRQI encoded</div>
              <div>Grover √N speedup</div>
              <div>Realtime simulator</div>
            </motion.div>
          </motion.div>

          {/* DNA + floating cards */}
          <div className="relative h-[520px] lg:h-[620px]">
            <div className="absolute inset-0">
              <DNAHelix className="absolute inset-0" />
            </div>
            {/* orbiting feature cards */}
            {floatingFeatures.map((f, i) => {
              const positions = [
                "top-0 left-2",
                "top-16 right-0",
                "bottom-20 left-0",
                "bottom-0 right-8",
                "top-1/2 -right-2",
              ];
              return (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.12, duration: 0.6 }}
                  whileHover={{ rotateX: -6, rotateY: 8, scale: 1.05 }}
                  style={{ transformStyle: "preserve-3d" }}
                  className={`absolute ${positions[i]} pointer-events-auto`}
                >
                  <div className="glass animate-float rounded-2xl px-4 py-3" style={{ animationDelay: `${i * 0.6}s` }}>
                    <div className={`mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${f.tone}`}>
                      <f.icon className="h-4 w-4 text-emerald" />
                    </div>
                    <div className="text-xs font-medium">{f.label}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 border-t border-white/5 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-100px" }} className="mb-14 max-w-2xl">
            <motion.div variants={fadeUp} className="mb-3 text-xs uppercase tracking-widest text-emerald">Platform</motion.div>
            <motion.h2 variants={fadeUp} className="text-4xl font-semibold tracking-tight sm:text-5xl">
              A complete quantum bioinformatics workbench.
            </motion.h2>
            <motion.p variants={fadeUp} className="mt-4 text-muted-foreground">
              Every step of the pipeline — from raw FASTA upload to Grover-accelerated alignment — engineered for clarity and speed.
            </motion.p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <motion.div key={f.title} variants={fadeUp} whileHover={{ y: -6 }} className="group relative overflow-hidden rounded-2xl glass p-6 transition hover:glow-emerald">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald/60 to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald/15 text-emerald">
                  <f.icon className="h-5 w-5" />
                </div>
                <div className="font-display text-lg font-semibold">{f.title}</div>
                <div className="mt-2 text-sm text-muted-foreground">{f.desc}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pipeline */}
      <section id="pipeline" className="relative z-10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }} className="mb-14 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            From nucleotide to <span className="text-gradient-emerald">quantum insight</span> in seconds.
          </motion.h2>
          <div className="relative grid gap-6 lg:grid-cols-4">
            {["Upload FASTA", "FRQI Encode", "Grover Search", "Align & Analyze"].map((step, i) => (
              <motion.div key={step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="glass relative rounded-2xl p-6">
                <div className="text-xs font-mono text-emerald">STEP 0{i + 1}</div>
                <div className="mt-2 font-display text-xl font-semibold">{step}</div>
                <div className="mt-3 h-24 rounded-lg bg-gradient-to-br from-emerald/10 to-cyan-glow/5 border border-emerald/10" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Research callout */}
      <section id="research" className="relative z-10 pb-32">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} className="glass-strong relative overflow-hidden rounded-3xl p-12">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald/30 blur-3xl" />
            <div className="absolute -left-20 -bottom-20 h-72 w-72 rounded-full bg-cyan-glow/20 blur-3xl" />
            <div className="relative grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-center">
              <div>
                <div className="mb-3 text-xs uppercase tracking-widest text-emerald">Research Preview</div>
                <h3 className="font-display text-3xl font-semibold sm:text-4xl">Grover-accelerated sequence matching, benchmarked.</h3>
                <p className="mt-4 max-w-2xl text-muted-foreground">
                  Read our whitepaper on quadratic speedup for pattern search in genomic databases using FRQI-encoded oracles.
                </p>
              </div>
              <div className="flex justify-start lg:justify-end">
                <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-full bg-emerald px-6 py-3 text-sm font-semibold text-primary-foreground glow-emerald">
                  Enter the lab <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 text-xs text-muted-foreground">
          <div>© QDNA Labs · Quantum Bioinformatics</div>
          <div className="flex items-center gap-2"><Atom className="h-3.5 w-3.5 text-emerald" /> 12-qubit simulator</div>
        </div>
      </footer>
    </div>
  );
}
