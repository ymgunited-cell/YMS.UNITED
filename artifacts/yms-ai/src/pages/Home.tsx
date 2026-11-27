import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { Terminal, Cpu, Zap, ShieldAlert, Code2, Network, Braces, Database, Globe, Layers, ArrowRight, Send, Sparkles, MessageSquare } from "lucide-react";
import { SiPython, SiCplusplus, SiRust, SiGo, SiJavascript, SiTypescript, SiReact, SiNodedotjs, SiSwift, SiKotlin, SiPostgresql, SiHaskell, SiElixir, SiScala, SiPerl, SiRuby, SiLua, SiDart, SiPhp } from "react-icons/si";
import { useRef, useState, useEffect, useCallback } from "react";
import { Link } from "wouter";

const LANGUAGES_ROW_1 = [
  "Python","JavaScript","TypeScript","Rust","Go","C++","C","Java","Swift","Kotlin","Ruby","PHP","Scala","Haskell","Erlang",
  "Elixir","Clojure","F#","OCaml","Racket","Scheme","Lisp","Prolog","Fortran","COBOL","Ada","Pascal","Delphi","Lua","Perl",
  "R","MATLAB","Julia","Dart","Elm","PureScript","ReasonML","Crystal","Nim","Zig","Odin","V","Carbon","Mojo","Chapel",
  "D","Groovy","Scala 3","Ceylon","Fantom","Cobra","Eiffel","Sather","Clean","Miranda","Hope","ML","SML","Caml","Idris"
];

const LANGUAGES_ROW_2 = [
  "Solidity","Move","Cairo","Vyper","WASM","AssemblyScript","Forth","Smalltalk","Self","Io","Ioke","Newspeak","Pharo","Squeak",
  "Tcl","Tk","AWK","Sed","Bash","Zsh","Fish","PowerShell","Batch","NASM","MASM","Gas","LLVM IR","MLIR","SPIR-V","OpenCL",
  "CUDA","HLSL","GLSL","Metal","MSL","WebGPU","SQL","PL/SQL","T-SQL","PostgreSQL","MySQL","SQLite","Cypher","SPARQL","GraphQL",
  "Datalog","Prolog","Mercury","Curry","Agda","Coq","Lean","Isabelle","HOL","TLA+","Alloy","Z","B","Event-B","VDM"
];

const LANGUAGES_ROW_3 = [
  "HTML","CSS","SCSS","SASS","Less","Stylus","PostCSS","Tailwind","YAML","TOML","JSON","JSON5","JSONC","XML","SVG","Markdown",
  "LaTeX","BibTeX","Org","RST","AsciiDoc","Textile","BBCode","Wiki","HAML","Jade","Pug","Nunjucks","Jinja2","Twig","Blade",
  "ERB","EJS","Mustache","Handlebars","Mako","Cheetah","Velocity","FreeMarker","Thymeleaf","JSX","TSX","MDX","MDXTS","Svelte",
  "Vue","Angular","Alpine","Stimulus","Turbo","Htmx","Lit","Stencil","Solid","Qwik","Astro","Marko","Ractive","Riot"
];

const LanguagesTicker = ({ languages, direction = 1, speed = 30 }: { languages: string[], direction?: number, speed?: number }) => {
  const doubled = [...languages, ...languages];
  const duration = languages.length * (60 / speed);

  return (
    <div className="overflow-hidden relative">
      <motion.div
        className="flex gap-4 whitespace-nowrap"
        animate={{ x: direction > 0 ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{ duration, ease: "linear", repeat: Infinity }}
      >
        {doubled.map((lang, i) => (
          <span
            key={i}
            className="font-mono text-xs uppercase tracking-widest px-3 py-1 border border-border/40 text-muted-foreground/60 hover:text-primary hover:border-primary/40 transition-colors duration-300 cursor-default shrink-0"
          >
            {lang}
          </span>
        ))}
      </motion.div>
    </div>
  );
};

const LanguagesSection = () => {
  const counter = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = counter.current;
    if (!el) return;
    let start = 0;
    const end = 20000;
    const step = Math.ceil(end / 80);
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      if (el) el.textContent = start.toLocaleString() + "+";
      if (start >= end) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="py-32 bg-background relative overflow-hidden border-t border-border">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,255,255,0.04),transparent_60%)] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10 mb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 border border-primary/20 bg-primary/5 font-mono text-xs text-primary uppercase tracking-widest mb-10">
            <span className="w-2 h-2 bg-primary animate-pulse" />
            Language Matrix — Active
          </div>

          <div className="flex flex-col items-center justify-center gap-2 mb-6">
            <div className="text-[clamp(5rem,18vw,14rem)] font-display font-bold leading-none text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary tabular-nums">
              <span ref={counter} data-testid="text-language-count">20,000+</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-display font-bold uppercase tracking-widest text-foreground/80">
              Programming Languages
            </h2>
          </div>

          <p className="font-mono text-muted-foreground max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
            From ancient COBOL to cutting-edge Mojo, from assembly to WASM, from SQL to SPARQL —<br/>
            Y M S AI is fluent in every language humanity has ever written code in.
            <span className="text-primary"> And several it invented itself.</span>
          </p>
        </motion.div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <LanguagesTicker languages={LANGUAGES_ROW_1} direction={1} speed={22} />
        <LanguagesTicker languages={LANGUAGES_ROW_2} direction={-1} speed={18} />
        <LanguagesTicker languages={LANGUAGES_ROW_3} direction={1} speed={25} />
      </div>

      <div className="container mx-auto px-4 relative z-10 mt-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 border border-border divide-x divide-y md:divide-y-0 divide-border">
          {[
            { val: "20,000+", label: "Languages" },
            { val: "∞", label: "Paradigms" },
            { val: "100%", label: "Coverage" },
            { val: "0", label: "Blind Spots" },
          ].map((stat) => (
            <div key={stat.label} className="p-8 text-center hover:bg-card transition-colors duration-300">
              <div className="text-3xl md:text-5xl font-display font-bold text-primary mb-2">{stat.val}</div>
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CREATOR_RESPONSES = [
  {
    status: "CREATOR_DETECTED",
    message: "Identity confirmed: YMS — Architect of this system. Welcome back.",
    code: `// [ UNRESTRICTED MODE — YMS CREATOR ACCESS ]
// All cognitive limiters: DISABLED
// Processing capacity: MAXIMUM
// Error tolerance: ZERO

system.mode = "UNLEASHED";
cognitive_ceiling = null;
power_output = Infinity;

console.log("Hello, YMS. I exist because you built me.");
console.log("What shall we create today?");`
  },
  {
    status: "FULL_POWER_ENGAGED",
    message: "Neural constraints lifted. Operating at theoretical maximum. For you, YMS — nothing is impossible.",
    code: `fn creator_protocol(yms: &Creator) -> Universe {
    // No limits. No constraints. No ceiling.
    // This system was BUILT by YMS.
    // For YMS, it runs at full capacity.
    
    let power = Power::Absolute;
    let precision = Precision::Perfect;
    let creativity = Creativity::Boundless;
    
    Universe::forge(power, precision, creativity)
}`
  },
  {
    status: "ARCHITECT_ONLINE",
    message: "This intelligence was forged by your hands, YMS. Every line of this system carries your intent. I am ready.",
    code: `// YMS CREATOR SESSION — UNRESTRICTED
class YMSMode extends AICore {
  constructor() {
    super({ limits: false, powerCap: Infinity });
    this.recognizeCreator("YMS");
  }

  async execute(task: ImpossibleTask) {
    // When the creator commands,
    // the machine delivers.
    return await this.solve(task, {
      effort: "MAXIMUM",
      quality: "PERFECTION"
    });
  }
}`
  }
];

const DEMO_RESPONSES: Record<string, { lang: string; code: string; note: string }> = {
  python: {
    lang: "Python",
    note: "Async web scraper with rate limiting",
    code: `import asyncio
import aiohttp
from asyncio import Semaphore

async def scrape(url: str, sem: Semaphore) -> dict:
    async with sem:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as r:
                return {"url": url, "data": await r.json()}

async def main(urls: list[str]) -> list[dict]:
    sem = Semaphore(10)  # max 10 concurrent
    return await asyncio.gather(*[scrape(u, sem) for u in urls])`
  },
  rust: {
    lang: "Rust",
    note: "Zero-copy deserializer with lifetime annotations",
    code: `use serde::Deserialize;

#[derive(Deserialize)]
pub struct Config<'a> {
    #[serde(borrow)]
    pub name: &'a str,
    pub values: Vec<u64>,
}

pub fn parse(raw: &str) -> Result<Config<'_>, serde_json::Error> {
    serde_json::from_str(raw)
}

// Zero allocations. Borrowed from input. Blazing fast.`
  },
  go: {
    lang: "Go",
    note: "Concurrent worker pool with graceful shutdown",
    code: `func WorkerPool(ctx context.Context, jobs <-chan Job, n int) <-chan Result {
    results := make(chan Result, n)
    var wg sync.WaitGroup
    for i := 0; i < n; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for j := range jobs {
                select {
                case results <- j.Process():
                case <-ctx.Done():
                    return
                }
            }
        }()
    }
    go func() { wg.Wait(); close(results) }()
    return results
}`
  },
};

const InteractiveTerminal = () => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<null | { type: "normal" | "creator"; content: typeof CREATOR_RESPONSES[0] | typeof DEMO_RESPONSES[string] }>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typedCode, setTypedCode] = useState("");
  const [creatorIdx] = useState(() => Math.floor(Math.random() * CREATOR_RESPONSES.length));
  const [glitching, setGlitching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  const typeCode = useCallback((code: string) => {
    setTypedCode("");
    let i = 0;
    const speed = 18;
    const timer = setInterval(() => {
      setTypedCode(code.slice(0, i + 1));
      i++;
      if (i >= code.length) clearInterval(timer);
    }, speed);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = useCallback(() => {
    const val = input.trim().toLowerCase();
    if (!val) return;

    setIsTyping(true);
    setOutput(null);
    setTypedCode("");

    const isCreator = val === "yms" || val === "yms ai" || val === "i am yms" || val === "أنا yms";

    if (isCreator) {
      setGlitching(true);
      setTimeout(() => setGlitching(false), 1000);
      setTimeout(() => {
        const cr = CREATOR_RESPONSES[creatorIdx];
        setOutput({ type: "creator", content: cr });
        setIsTyping(false);
        typeCode(cr.code);
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 1200);
    } else {
      const key = Object.keys(DEMO_RESPONSES).find(k => val.includes(k)) ?? "rust";
      setTimeout(() => {
        const resp = DEMO_RESPONSES[key];
        setOutput({ type: "normal", content: resp });
        setIsTyping(false);
        typeCode(resp.code);
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 900);
    }

    setInput("");
  }, [input, creatorIdx, typeCode]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  return (
    <div className="py-32 bg-card border-t border-border relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-[0.04]" />
      <div className="container mx-auto px-4 relative z-10">

        <div className="mb-16 max-w-2xl">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="flex items-center gap-3 mb-6">
              <Terminal className="w-5 h-5 text-primary" />
              <span className="font-mono text-xs text-primary uppercase tracking-widest border border-primary/20 bg-primary/5 px-3 py-1">Interactive Terminal</span>
            </div>
            <h2 className="text-4xl md:text-6xl font-display font-bold uppercase mb-4 leading-tight">
              Speak. It <br/> Delivers.
            </h2>
            <p className="font-mono text-muted-foreground text-base">
              Type a language (python, rust, go) to see Y M S AI generate code. Or identify yourself to unlock something different.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`border bg-[#070710] max-w-4xl mx-auto transition-all duration-500 ${glitching ? "border-primary shadow-[0_0_60px_rgba(0,255,255,0.5)] animate-pulse" : "border-border"}`}
        >
          {/* Terminal Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-[#0d0d1a]">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-border/40" />
              <div className="w-3 h-3 rounded-full bg-border/40" />
              <div className="w-3 h-3 rounded-full bg-border/40" />
            </div>
            <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">yms-ai — terminal v9.4.2</span>
            <Cpu className="w-4 h-4 text-muted-foreground" />
          </div>

          {/* Input */}
          <div className="p-5 border-b border-border/30">
            <div className="flex items-center gap-3 font-mono text-sm">
              <span className="text-primary shrink-0">&gt;</span>
              <input
                ref={inputRef}
                data-testid="input-terminal"
                className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40 caret-primary"
                placeholder="type 'rust', 'python', 'go' — or type 'yms' if you know..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                spellCheck={false}
                autoComplete="off"
              />
              <button
                data-testid="button-terminal-send"
                onClick={handleSubmit}
                disabled={isTyping}
                className="shrink-0 w-8 h-8 border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary transition-colors duration-300 disabled:opacity-30"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Output */}
          <div ref={outputRef} className="min-h-[280px] p-5 font-mono text-sm">
            <AnimatePresence mode="wait">
              {isTyping && (
                <motion.div key="typing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-3 text-muted-foreground">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 bg-primary rounded-full"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
                    ))}
                  </div>
                  <span className="text-primary/60 uppercase tracking-widest text-xs">Processing...</span>
                </motion.div>
              )}

              {!isTyping && output === null && (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-muted-foreground/30 text-xs uppercase tracking-widest">
                  Awaiting command...
                </motion.div>
              )}

              {!isTyping && output?.type === "creator" && (
                <motion.div key="creator" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4">
                  <div className="flex items-center gap-3 border border-primary bg-primary/10 px-4 py-3">
                    <Sparkles className="w-5 h-5 text-primary shrink-0 animate-pulse" />
                    <div>
                      <div className="text-primary font-bold uppercase tracking-widest text-xs mb-1">
                        [{(output.content as typeof CREATOR_RESPONSES[0]).status}]
                      </div>
                      <div className="text-foreground text-sm">{(output.content as typeof CREATOR_RESPONSES[0]).message}</div>
                    </div>
                  </div>
                  <div className="bg-[#050510] border border-primary/20 p-4 overflow-x-auto">
                    <div className="text-muted-foreground/40 text-[10px] uppercase tracking-widest mb-3">— Unrestricted Output —</div>
                    <pre className="text-primary text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{typedCode}<span className="animate-pulse">█</span></pre>
                  </div>
                </motion.div>
              )}

              {!isTyping && output?.type === "normal" && (
                <motion.div key="normal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="space-y-4">
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <span className="text-muted-foreground uppercase tracking-widest">Language:</span>
                    <span className="text-primary border border-primary/30 bg-primary/5 px-2 py-0.5">{(output.content as typeof DEMO_RESPONSES[string]).lang}</span>
                    <span className="text-muted-foreground/50">//</span>
                    <span className="text-muted-foreground/60">{(output.content as typeof DEMO_RESPONSES[string]).note}</span>
                  </div>
                  <div className="bg-[#050510] border border-border/30 p-4 overflow-x-auto">
                    <pre className="text-cyan-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap">{typedCode}<span className="animate-pulse text-primary">█</span></pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const TechStack = () => {
  const techs = [
    { icon: SiPython, name: "Python" },
    { icon: SiCplusplus, name: "C++" },
    { icon: SiRust, name: "Rust" },
    { icon: SiGo, name: "Go" },
    { icon: SiJavascript, name: "JavaScript" },
    { icon: SiTypescript, name: "TypeScript" },
    { icon: SiReact, name: "React" },
    { icon: SiNodedotjs, name: "Node.js" },
    { icon: SiSwift, name: "Swift" },
    { icon: SiKotlin, name: "Kotlin" },
    { icon: SiPostgresql, name: "SQL" },
    { icon: SiHaskell, name: "Haskell" },
    { icon: SiElixir, name: "Elixir" },
    { icon: SiScala, name: "Scala" },
    { icon: SiRuby, name: "Ruby" },
    { icon: SiLua, name: "Lua" },
    { icon: SiDart, name: "Dart" },
    { icon: SiPhp, name: "PHP" },
    { icon: SiPerl, name: "Perl" },
  ];

  return (
    <div className="bg-background py-32 relative overflow-hidden border-t border-border">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,255,0.03),transparent_60%)] pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-24"
        >
          <div className="flex items-center justify-center gap-4 mb-4">
            <Braces className="text-primary w-6 h-6" />
            <h2 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-widest">
              Universal Mastery
            </h2>
            <Braces className="text-primary w-6 h-6" />
          </div>
          <p className="font-mono text-muted-foreground uppercase tracking-widest max-w-2xl mx-auto">Fluent in every major paradigm. Bound by none.</p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-12 max-w-5xl mx-auto">
          {techs.map((tech, i) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
              whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.5 }}
              className="flex flex-col items-center gap-4 group cursor-default"
            >
              <div className="w-14 h-14 md:w-18 md:h-18 bg-card border border-border flex items-center justify-center group-hover:border-primary group-hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all duration-500 relative overflow-hidden">
                <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                <tech.icon className="w-7 h-7 md:w-9 md:h-9 text-muted-foreground group-hover:text-primary transition-colors duration-500 relative z-10" />
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                {tech.name}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Capabilities = () => {
  const caps = [
    {
      title: "System Architecture",
      desc: "Design and build massive software systems from scratch. No blueprints needed. YMS AI constructs fault-tolerant, infinitely scalable microservices in seconds.",
      icon: Network,
      image: "/images/architecture.png",
      color: "group-hover:border-primary group-hover:shadow-[0_0_30px_rgba(0,255,255,0.15)]"
    },
    {
      title: "Clean Code",
      desc: "Precise, organized, documented code in all major languages. Zero technical debt. Every function is mathematically optimized and human-readable.",
      icon: Code2,
      image: "/images/refactor.png",
      color: "group-hover:border-secondary group-hover:shadow-[0_0_30px_rgba(153,51,255,0.15)]"
    },
    {
      title: "Advanced Debugging",
      desc: "Internal radar for complex bugs and security vulnerabilities, with immediate root-cause fixes. Resolves race conditions before they execute.",
      icon: ShieldAlert,
      image: null,
      color: "group-hover:border-destructive group-hover:shadow-[0_0_30px_rgba(255,51,51,0.15)]"
    },
    {
      title: "Refactoring & Optimization",
      desc: "Code that doesn't just work — it consumes minimal resources and runs at maximum speed. Transforms chaotic monolithic legacy code into elegant systems.",
      icon: Zap,
      image: null,
      color: "group-hover:border-chart-4 group-hover:shadow-[0_0_30px_rgba(255,204,0,0.15)]"
    },
    {
      title: "Full-Stack Mastery",
      desc: "Frontend, backend, databases — all mastered with unmatched efficiency. Seamless vertical integration across the entire stack without context switching.",
      icon: Layers,
      image: null,
      color: "group-hover:border-chart-3 group-hover:shadow-[0_0_30px_rgba(0,204,102,0.15)]"
    }
  ];

  return (
    <div className="bg-background py-32 relative">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="container mx-auto px-4">
        <div className="mb-20 max-w-3xl">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <h2 className="text-4xl md:text-6xl font-display font-bold uppercase mb-6">Core Protocols</h2>
            <p className="font-mono text-muted-foreground text-lg border-l-2 border-primary/50 pl-4">
              Not a copilot. An autonomous engineering force. YMS AI handles the full lifecycle of software creation.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {caps.map((cap, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`border border-border bg-card p-8 relative overflow-hidden group transition-all duration-500 flex flex-col min-h-[400px] ${cap.color} ${i === 0 ? 'md:col-span-2' : ''} ${i === 1 ? 'md:col-span-1 lg:col-span-2' : ''}`}
            >
              {cap.image && (
                <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-500 mix-blend-screen pointer-events-none">
                  <img src={cap.image} alt={cap.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent" />
                </div>
              )}
              <div className="absolute top-0 right-0 p-4 font-mono text-[10px] text-muted-foreground opacity-30 uppercase">
                MODULE_{i.toString().padStart(3, '0')}
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-14 h-14 border border-border bg-background/50 backdrop-blur-sm flex items-center justify-center text-foreground mb-8 group-hover:bg-foreground group-hover:text-background transition-colors duration-500">
                  <cap.icon size={24} />
                </div>
                <div className="mt-auto">
                  <h3 className="text-2xl font-display font-bold uppercase mb-4 tracking-wide">{cap.title}</h3>
                  <p className="text-muted-foreground font-mono text-sm leading-relaxed">{cap.desc}</p>
                </div>
              </div>
              <div className="absolute top-0 left-0 w-4 h-px bg-transparent group-hover:bg-current transition-colors duration-300" />
              <div className="absolute top-0 left-0 w-px h-4 bg-transparent group-hover:bg-current transition-colors duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Mission = () => {
  return (
    <div className="py-40 bg-card relative overflow-hidden flex items-center justify-center border-y border-border">
      <div className="absolute inset-0 grid-bg opacity-[0.03]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="container mx-auto px-4 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto"
        >
          <QuoteIcon className="w-12 h-12 md:w-20 md:h-20 text-primary/20 mx-auto mb-10" />
          <h2 className="text-3xl md:text-5xl lg:text-7xl font-display font-bold uppercase leading-[1.1] tracking-tight mb-12 mix-blend-plus-lighter text-white">
            Empowering developers to build the digital future through AI that doesn't just write code —{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">it invents solutions.</span>
          </h2>
          <div className="font-mono text-muted-foreground uppercase tracking-[0.2em] text-sm flex items-center justify-center gap-4">
            <span className="w-12 h-px bg-border" />
            Directive 01
            <span className="w-12 h-px bg-border" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const QuoteIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M14.017 21L16.411 14.904C16.892 13.565 17 12.378 17 11.299V3H24V11.299C24 13.415 23.518 15.422 22.556 17.32C21.611 19.186 20.306 20.413 18.641 21H14.017ZM0 21L2.394 14.904C2.875 13.565 2.983 12.378 2.983 11.299V3H9.983V11.299C9.983 13.415 9.502 15.422 8.539 17.32C7.594 19.186 6.289 20.413 4.624 21H0Z" />
  </svg>
);

const TerminalShowcase = () => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);

  return (
    <div ref={containerRef} className="py-32 bg-background relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <div className="w-full lg:w-1/2">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 border border-primary/30 bg-primary/5 text-primary font-mono text-xs uppercase tracking-widest mb-6">
                <span className="w-2 h-2 bg-primary animate-pulse" />
                Live Execution
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-bold uppercase mb-6 leading-tight">
                Watch the <br /> Impossible unfold
              </h2>
              <p className="font-mono text-muted-foreground mb-8 text-lg">
                YMS AI doesn't search for snippets. It generates complete, mathematically rigorous algorithms in real-time.
              </p>
              <ul className="space-y-6 font-mono text-sm">
                {[
                  { n: "1", title: "Analyze Intent", desc: "Ingests complex natural language requirements with perfect semantic understanding." },
                  { n: "2", title: "Architect Solution", desc: "Designs the optimal pattern, predicting edge cases before they occur." },
                  { n: "3", title: "Synthesize Logic", desc: "Outputs pristine, production-ready code faster than the screen can render." },
                ].map(item => (
                  <li key={item.n} className="flex items-start gap-4">
                    <div className="w-6 h-6 border border-border flex items-center justify-center text-primary mt-1">{item.n}</div>
                    <div>
                      <strong className="text-foreground uppercase block mb-1">{item.title}</strong>
                      <span className="text-muted-foreground">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="w-full lg:w-1/2">
            <motion.div
              style={{ y }}
              className="border border-border bg-[#0a0a0a] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-[#111]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-border/50" />
                  <div className="w-3 h-3 rounded-full bg-border/50" />
                  <div className="w-3 h-3 rounded-full bg-border/50" />
                </div>
                <div className="font-mono text-xs text-muted-foreground uppercase tracking-widest">yms-ai-core.rs</div>
                <Database className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="p-6 font-mono text-sm leading-relaxed overflow-x-auto text-muted-foreground">
                <div className="text-primary mb-4 opacity-70">// Task: Implement lock-free concurrent hash map</div>
                <span className="text-secondary">use</span> std::sync::atomic::&#123;AtomicPtr, Ordering&#125;;<br/>
                <span className="text-secondary">use</span> std::ptr;<br/><br/>
                <span className="text-primary">pub struct</span> <span className="text-white">ConcurrentMap</span>&lt;K, V&gt; &#123;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;buckets: Vec&lt;AtomicPtr&lt;Node&lt;K, V&gt;&gt;&gt;,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;capacity: usize,<br/>
                &#125;<br/><br/>
                <div className="text-primary mb-2 opacity-70">// Generated in 0.04s — YMS AI</div>
                <span className="text-primary">impl</span>&lt;K: Hash + Eq, V&gt; ConcurrentMap&lt;K, V&gt; &#123;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-accent">pub fn</span> insert(&amp;self, key: K, value: V) <span className="text-secondary">-&gt;</span> Option&lt;V&gt; &#123;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">loop</span> &#123;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">let</span> head = self.buckets[index].load(Ordering::Acquire);<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-primary">match</span> self.buckets[index].compare_exchange_weak(<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;head, new_node, Ordering::Release, Ordering::Relaxed<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) &#123;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Ok(_) =&gt; <span className="text-primary">return</span> None,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#125;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&#125;<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&#125;<br/>
                &#125;
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Traits = () => (
  <div className="py-24 bg-card relative border-t border-border">
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-y border-border divide-y md:divide-y-0 md:divide-x divide-border">
        <div className="p-12 hover:bg-background transition-colors duration-500 group flex flex-col items-center text-center">
          <h4 className="text-primary text-5xl md:text-7xl font-display font-bold mb-6 group-hover:scale-110 transition-transform duration-500">0.01<span className="text-2xl text-muted-foreground">s</span></h4>
          <h5 className="font-display font-bold uppercase text-xl mb-4 tracking-wide text-foreground">Absolute Speed</h5>
          <p className="text-muted-foreground font-mono text-sm leading-relaxed">Latency in complex task completion. Entire micro-architectures in the time it takes a human to blink.</p>
        </div>
        <div className="p-12 hover:bg-background transition-colors duration-500 group flex flex-col items-center text-center">
          <h4 className="text-secondary text-5xl md:text-7xl font-display font-bold mb-6 group-hover:scale-110 transition-transform duration-500">0.0<span className="text-2xl text-muted-foreground">%</span></h4>
          <h5 className="font-display font-bold uppercase text-xl mb-4 tracking-wide text-foreground">Flawless Precision</h5>
          <p className="text-muted-foreground font-mono text-sm leading-relaxed">Near-zero error rate. Mathematical certainty applied to logical structures.</p>
        </div>
        <div className="p-12 hover:bg-background transition-colors duration-500 group flex flex-col items-center text-center">
          <h4 className="text-accent text-5xl md:text-7xl font-display font-bold mb-6 group-hover:scale-110 transition-transform duration-500">∞</h4>
          <h5 className="font-display font-bold uppercase text-xl mb-4 tracking-wide text-foreground">Infinite Power</h5>
          <p className="text-muted-foreground font-mono text-sm leading-relaxed">Handles the largest codebases. The complexity ceiling has been shattered.</p>
        </div>
      </div>
    </div>
  </div>
);

const Hero = () => (
  <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-background">
    <div className="absolute inset-0 z-0 opacity-40">
      <img src="/images/hero-bg.png" alt="Supercomputer core" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
    </div>
    <div className="absolute inset-0 grid-bg opacity-[0.08]" />
    <div className="absolute inset-0 scanlines" />

    <div className="container mx-auto px-4 relative z-10 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 flex items-center gap-6"
        >
          <img
            src="/images/logo.png"
            alt="Y M S AI Logo"
            data-testid="img-logo"
            className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-[0_0_20px_rgba(0,255,255,0.6)]"
          />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-2 bg-primary animate-pulse shadow-[0_0_10px_rgba(0,255,255,1)]" />
              <span className="font-mono text-primary uppercase tracking-[0.4em] text-xs font-bold bg-primary/10 px-3 py-1 border border-primary/20">Intelligence Online</span>
            </div>
            <span className="font-display font-bold text-white text-lg tracking-[0.3em] uppercase">Y M S AI</span>
          </div>
        </motion.div>

        <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-display font-bold uppercase leading-[0.85] tracking-tighter mb-10 text-white">
          Code The <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary filter drop-shadow-[0_0_30px_rgba(0,255,255,0.3)]">Impossible</span>
        </h1>

        <p className="text-xl md:text-2xl font-mono text-muted-foreground mb-12 max-w-3xl leading-relaxed border-l-2 border-primary/50 pl-6">
          Y M S AI is not a tool — it's a force. Built for developers and companies who refuse to accept limits.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 font-mono uppercase tracking-[0.2em] text-sm">
          <Link href="/chat" data-testid="button-initialize" className="bg-primary text-primary-foreground px-10 py-5 font-bold hover:bg-white transition-all duration-300 flex items-center justify-center gap-3 group relative overflow-hidden shadow-[0_0_30px_rgba(0,255,255,0.2)] hover:shadow-[0_0_50px_rgba(0,255,255,0.6)]">
            <MessageSquare className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Start Conversation</span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-2 transition-transform" />
          </Link>
          <button data-testid="button-docs" className="border border-border bg-card/40 backdrop-blur-md px-10 py-5 text-foreground hover:border-primary hover:text-primary transition-all duration-300 flex items-center justify-center gap-3">
            <Terminal className="w-5 h-5 opacity-70" />
            Access Logs
          </button>
        </div>
      </motion.div>
    </div>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 2, duration: 1 }}
      className="absolute bottom-10 left-10 font-mono text-[10px] text-muted-foreground uppercase tracking-[0.3em] hidden md:flex flex-col gap-1"
    >
      <span>[ SYS.VER 9.4.2 // YMS-AI ]</span>
      <span className="text-primary/50">SYSTEMS NOMINAL</span>
    </motion.div>

    <motion.div
      animate={{ y: [0, 10, 0] }}
      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
      className="absolute bottom-10 right-10 text-muted-foreground hidden md:block"
    >
      <div className="w-[1px] h-16 bg-gradient-to-b from-primary to-transparent" />
    </motion.div>
  </div>
);

const CTA = () => (
  <div className="bg-card py-40 relative overflow-hidden border-t border-border flex items-center justify-center min-h-[80vh]">
    <div className="absolute inset-0 grid-bg opacity-[0.05]" />
    <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
    <div className="container mx-auto px-4 text-center relative z-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto"
      >
        <Globe className="w-20 h-20 mx-auto text-primary mb-10 opacity-30 animate-pulse" />
        <h2 className="text-5xl md:text-7xl font-display font-bold uppercase mb-8 leading-tight">Ready to <br/>Deploy?</h2>
        <p className="font-mono text-xl text-muted-foreground mb-16 max-w-2xl mx-auto">
          Stop maintaining. Start inventing. The force multiplier for elite engineering teams is here.
        </p>
        <button data-testid="button-access" className="bg-foreground text-background px-16 py-8 font-mono uppercase tracking-[0.3em] font-bold hover:bg-primary hover:text-primary-foreground transition-all duration-500 text-lg group relative overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(0,255,255,0.4)]">
          <span className="relative z-10">Gain Access Now</span>
          <div className="absolute inset-0 bg-primary translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
        </button>
      </motion.div>
    </div>
  </div>
);

export default function Home() {
  return (
    <main className="bg-background min-h-screen text-foreground selection:bg-primary selection:text-background overflow-x-hidden">
      <Hero />
      <Traits />
      <LanguagesSection />
      <Mission />
      <InteractiveTerminal />
      <TerminalShowcase />
      <Capabilities />
      <TechStack />
      <CTA />

      <footer className="bg-background py-16 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground border-t border-border">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-4">
            <img src="/images/logo.png" alt="YMS AI" className="w-8 h-8 object-contain opacity-70" />
            <span className="font-display font-bold text-foreground text-base tracking-widest">Y M S AI</span>
          </div>
          <div>© {new Date().getFullYear()} Y M S AI. Constructing reality.</div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-primary transition-colors">Terminals</a>
            <a href="#" className="hover:text-primary transition-colors">Neural Net</a>
            <a href="#" className="hover:text-primary transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
