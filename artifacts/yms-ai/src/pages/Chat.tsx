import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, PenSquare, Trash2, Plus, ChevronLeft,
  Copy, Check, Menu, Zap, Code2, BookOpen,
  Globe, Brain, Lightbulb, SquareTerminal,
  Mic, MicOff, Paperclip, X, ImagePlus, LogOut, User, Crown
} from "lucide-react";
import { Link } from "wouter";
import { useAuthClerk, useAuthUser } from "@/lib/auth";

interface Message {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
  isAnime?: boolean;
}

interface Conversation {
  id: number;
  title: string;
  createdAt: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API = `${BASE}/api`;

// ─── Markdown renderer ───
function renderContent(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const parts = text.split(/(```[\w]*\n?[\s\S]*?```)/g);
  parts.forEach((part, pi) => {
    if (part.startsWith("```")) {
      const match = part.match(/```([\w]*)\n?([\s\S]*?)```/);
      const lang = match?.[1] || "";
      const code = match?.[2]?.trimEnd() || "";
      nodes.push(<CodeBlock key={`cb-${pi}`} lang={lang} code={code} />);
    } else {
      const lines = part.split("\n");
      let i = 0;
      const lineNodes: React.ReactNode[] = [];
      while (i < lines.length) {
        const line = lines[i];
        if (line.startsWith("### ")) { lineNodes.push(<h3 key={`h3-${i}`} className="text-base font-bold text-foreground mt-4 mb-1">{inlineFormat(line.slice(4))}</h3>); }
        else if (line.startsWith("## ")) { lineNodes.push(<h2 key={`h2-${i}`} className="text-lg font-bold text-foreground mt-5 mb-2 border-b border-border pb-1">{inlineFormat(line.slice(3))}</h2>); }
        else if (line.startsWith("# ")) { lineNodes.push(<h1 key={`h1-${i}`} className="text-xl font-bold text-foreground mt-5 mb-2">{inlineFormat(line.slice(2))}</h1>); }
        else if (/^[-*] /.test(line)) {
          const items: React.ReactNode[] = [];
          while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(<li key={i} className="ml-1">{inlineFormat(lines[i].slice(2))}</li>); i++; }
          lineNodes.push(<ul key={`ul-${pi}-${i}`} className="list-disc pl-5 space-y-0.5 my-2 text-foreground/90">{items}</ul>);
          continue;
        }
        else if (/^\d+\. /.test(line)) {
          const items: React.ReactNode[] = [];
          while (i < lines.length && /^\d+\. /.test(lines[i])) { const txt = lines[i].replace(/^\d+\. /, ""); items.push(<li key={i} className="ml-1">{inlineFormat(txt)}</li>); i++; }
          lineNodes.push(<ol key={`ol-${pi}-${i}`} className="list-decimal pl-5 space-y-0.5 my-2 text-foreground/90">{items}</ol>);
          continue;
        }
        else if (/^---+$/.test(line.trim())) { lineNodes.push(<hr key={`hr-${i}`} className="border-border my-4" />); }
        else if (line.trim() === "") { lineNodes.push(<div key={`br-${i}`} className="h-2" />); }
        else { lineNodes.push(<p key={`p-${i}`} className="leading-relaxed text-foreground/90">{inlineFormat(line)}</p>); }
        i++;
      }
      nodes.push(<span key={`text-${pi}`}>{lineNodes}</span>);
    }
  });
  return nodes;
}

function inlineFormat(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="font-semibold text-foreground">{p.slice(2, -2)}</strong>;
    if (p.startsWith("*") && p.endsWith("*")) return <em key={i} className="italic">{p.slice(1, -1)}</em>;
    if (p.startsWith("`") && p.endsWith("`")) return <code key={i} className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-sm font-mono">{p.slice(1, -1)}</code>;
    return p;
  });
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="my-3 rounded-xl overflow-hidden border border-border/60 bg-[#0a0a14]">
      <div className="flex items-center justify-between px-4 py-2 bg-[#0f0f1e] border-b border-border/40">
        <span className="font-mono text-[11px] text-primary/70 uppercase tracking-widest">{lang || "code"}</span>
        <button onClick={copy} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-xs transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "تم النسخ" : "نسخ"}
        </button>
      </div>
      <pre className="p-4 text-sm text-cyan-300 overflow-x-auto leading-relaxed font-mono whitespace-pre">{code}</pre>
    </div>
  );
}

const SUGGESTIONS = [
  { icon: Code2, text: "اكتب لي كود Python لـ API REST", label: "برمجة" },
  { icon: Brain, text: "اشرح لي الذكاء الاصطناعي ببساطة", label: "علوم" },
  { icon: BookOpen, text: "لخص لي أحداث الحرب العالمية الثانية", label: "تاريخ" },
  { icon: Lightbulb, text: "ساعدني في بناء خطة عمل لمشروع تقني", label: "أعمال" },
  { icon: Globe, text: "Translate this paragraph to Arabic", label: "ترجمة" },
  { icon: Zap, text: "What's the best way to optimize React performance?", label: "تقنية" },
];

// ─── Message bubble ───
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const copy = () => { navigator.clipboard.writeText(msg.content); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  const { user } = useAuthUser();

  const shareImage = async () => {
    if (!msg.imageUrl) return;
    try {
      const res = await fetch(msg.imageUrl);
      const blob = await res.blob();
      const file = new File([blob], `yms-ai-image-${msg.id}.png`, { type: blob.type || "image/png" });

      type NavShare = Navigator & { canShare?: (data?: { files?: File[] }) => boolean; share?: (data: { files?: File[]; title?: string }) => Promise<void> };
      const nav = navigator as NavShare;
      if (nav.canShare && nav.share && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: "Y M S AI" });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      }
    } catch {
      /* fall through to download */
    }
    const a = document.createElement("a");
    a.href = msg.imageUrl;
    a.download = `yms-ai-image-${msg.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`group flex gap-3 ${isUser ? "max-w-2xl ml-auto flex-row-reverse" : "max-w-3xl mr-auto"}`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full shrink-0 mt-1 overflow-hidden border border-primary/30 shadow-[0_0_8px_rgba(0,255,255,0.15)]">
          <img src="/images/logo.png" alt="YMS AI" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex flex-col gap-1 min-w-0 max-w-full">
        {/* Image attachment */}
        {msg.imageUrl && (
          <div className="mb-2">
            <img src={msg.imageUrl} alt="attachment" className="max-w-xs rounded-xl border border-border/40 shadow" />
            <div className="flex items-center justify-between mt-1 gap-2">
              {msg.isAnime ? (
                <div className="text-xs text-primary/70 font-mono flex items-center gap-1">
                  <ImagePlus className="w-3 h-3" /> تم التحويل إلى أنمي
                </div>
              ) : <div />}
              <button onClick={shareImage} data-testid={`button-share-image-${msg.id}`}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary text-xs transition-colors px-2 py-1 rounded-lg hover:bg-primary/10">
                {shared ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Send className="w-3.5 h-3.5" />}
                {shared ? "تم الإرسال" : "إرسال / تحميل"}
              </button>
            </div>
          </div>
        )}

        {isUser ? (
          <div className="bg-[#1a1a2e] border border-border/60 rounded-2xl rounded-tr-sm px-4 py-3 text-foreground text-sm leading-relaxed whitespace-pre-wrap">
            {msg.content}
          </div>
        ) : (
          <div className="text-foreground text-sm leading-relaxed min-w-0">
            {renderContent(msg.content)}
          </div>
        )}

        {!isUser && msg.content && (
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
            <button onClick={copy} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs transition-colors px-2 py-1 rounded-lg hover:bg-card">
              {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
              {copied ? "تم النسخ" : "نسخ"}
            </button>
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full shrink-0 mt-1 bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
          {user?.imageUrl
            ? <img src={user.imageUrl} alt="You" className="w-full h-full object-cover" />
            : <User className="w-4 h-4 text-primary" />
          }
        </div>
      )}
    </motion.div>
  );
}

function StreamingBubble({ content }: { content: string }) {
  return (
    <div className="flex gap-3 max-w-3xl mr-auto">
      <div className="w-8 h-8 rounded-full shrink-0 mt-1 overflow-hidden border border-primary/30">
        <img src="/images/logo.png" alt="YMS AI" className="w-full h-full object-cover" />
      </div>
      <div className="text-foreground text-sm leading-relaxed min-w-0 flex-1">
        {content.length > 0 ? (
          <span>
            {renderContent(content)}
            <span className="inline-block w-0.5 h-4 bg-primary animate-pulse ml-0.5 align-text-bottom rounded-full" />
          </span>
        ) : (
          <div className="flex items-center gap-1.5 h-8">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="w-2 h-2 bg-primary/60 rounded-full"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───
export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [pendingImage, setPendingImage] = useState<{ base64: string; url: string; mime: string } | null>(null);
  const [convertingAnime, setConvertingAnime] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const { signOut } = useAuthClerk();
  const { user } = useAuthUser();
  const isAdmin = user?.emailAddresses?.some(
    (e) => e.emailAddress.toLowerCase() === "yms123456789123456@gmail.com",
  ) ?? false;

  const scrollToBottom = useCallback(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, []);
  useEffect(() => { scrollToBottom(); }, [messages, streamContent, scrollToBottom]);

  useEffect(() => {
    fetch(`${API}/openai/conversations`)
      .then(r => (r.ok ? r.json() : []))
      .then(data => setConversations(Array.isArray(data) ? data : []))
      .catch(() => setConversations([]));
  }, []);

  const loadConversation = useCallback(async (id: number) => {
    setActiveId(id);
    try {
      const res = await fetch(`${API}/openai/conversations/${id}`);
      if (!res.ok) { setMessages([]); return; }
      const data = await res.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
    } catch {
      setMessages([]);
    }
  }, []);

  const newConversation = useCallback(() => {
    setActiveId(null); setMessages([]); textareaRef.current?.focus();
  }, []);

  const deleteConversation = useCallback(async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`${API}/openai/conversations/${id}`, { method: "DELETE" });
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeId === id) { setActiveId(null); setMessages([]); }
  }, [activeId]);

  const autoResize = useCallback(() => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 200) + "px";
  }, []);

  // ─── Voice input ───
  const toggleVoice = useCallback(() => {
    type SpeechRecAny = {
      lang: string; continuous: boolean; interimResults: boolean;
      onstart: (() => void) | null; onend: (() => void) | null;
      onerror: (() => void) | null;
      onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } }; length: number } }) => void) | null;
      start(): void; stop(): void;
    };
    type WinWithSpeech = Window & { SpeechRecognition?: new () => SpeechRecAny; webkitSpeechRecognition?: new () => SpeechRecAny };
    const w = window as WinWithSpeech;
    const SpeechRec = w.SpeechRecognition || w.webkitSpeechRecognition;

    if (!SpeechRec) {
      alert("المتصفح لا يدعم التعرف على الصوت. استخدم Chrome.");
      return;
    }

    if (isListening && recognitionRef.current) {
      (recognitionRef.current as unknown as SpeechRecAny).stop();
      setIsListening(false);
      return;
    }

    const rec = new SpeechRec();
    rec.lang = "ar-SA";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    rec.onresult = (e) => {
      const results = e.results;
      let transcript = "";
      for (let i = 0; i < results.length; i++) transcript += results[i][0].transcript;
      setInput(transcript);
      setTimeout(autoResize, 10);
    };

    recognitionRef.current = rec;
    rec.start();
  }, [isListening, autoResize]);

  // ─── Convert to anime ───
  const convertToAnime = useCallback(async (image: { base64: string; url: string; mime: string }) => {
    setConvertingAnime(true);
    const timeoutId = setTimeout(() => setConvertingAnime((c) => {
      if (c) {
        setMessages(prev => [...prev, { id: Date.now(), conversationId: activeId ?? 0, role: "assistant", content: "التحويل بياخد وقت أطول من المعتاد... استنى شوية أو حاول تاني.", createdAt: new Date().toISOString() }]);
      }
      return c;
    }), 25000);
    try {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 90000);
      const res = await fetch(`${API}/openai/anime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: image.base64, mimeType: image.mime }),
        signal: controller.signal,
      });
      clearTimeout(abortTimer);
      if (!res.ok) {
        const errBody = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(errBody?.error || `Anime conversion failed: ${res.status}`);
      }
      const data = await res.json();
      if (data.url) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          conversationId: activeId ?? 0,
          role: "assistant",
          content: "✨ تم تحويل الصورة إلى أنمي!",
          createdAt: new Date().toISOString(),
          imageUrl: data.url,
          isAnime: true,
        }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now(), conversationId: activeId ?? 0, role: "assistant", content: "فشل تحويل الصورة. حاول مرة أخرى.", createdAt: new Date().toISOString() }]);
      }
    } catch (err: unknown) {
      const timedOut = err instanceof Error && err.name === "AbortError";
      const errMsg = err instanceof Error ? err.message : "";
      setMessages(prev => [...prev, { id: Date.now(), conversationId: activeId ?? 0, role: "assistant", content: timedOut ? "استغرق التحويل وقت طويل جدًا. حاول مرة أخرى." : (errMsg || "فشل تحويل الصورة. حاول مرة أخرى."), createdAt: new Date().toISOString() }]);
    } finally {
      clearTimeout(timeoutId);
      setConvertingAnime(false);
      setPendingImage(null);
    }
  }, [activeId]);

  // ─── Generate image from text prompt ───
  const generateImage = useCallback(async (prompt: string) => {
    setGeneratingImage(true);
    try {
      const controller = new AbortController();
      const abortTimer = setTimeout(() => controller.abort(), 90000);
      const res = await fetch(`${API}/openai/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: controller.signal,
      });
      clearTimeout(abortTimer);
      if (!res.ok) {
        const errBody = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(errBody?.error || `Image generation failed: ${res.status}`);
      }
      const data = await res.json();
      if (data.url) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          conversationId: activeId ?? 0,
          role: "assistant",
          content: "✨ تم إنشاء الصورة!",
          createdAt: new Date().toISOString(),
          imageUrl: data.url,
        }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now(), conversationId: activeId ?? 0, role: "assistant", content: "فشل إنشاء الصورة. حاول مرة أخرى.", createdAt: new Date().toISOString() }]);
      }
    } catch (err: unknown) {
      const timedOut = err instanceof Error && err.name === "AbortError";
      const errMsg = err instanceof Error ? err.message : "";
      setMessages(prev => [...prev, { id: Date.now(), conversationId: activeId ?? 0, role: "assistant", content: timedOut ? "استغرق إنشاء الصورة وقت طويل جدًا. حاول مرة أخرى." : (errMsg || "فشل إنشاء الصورة. حاول مرة أخرى."), createdAt: new Date().toISOString() }]);
    } finally {
      setGeneratingImage(false);
    }
  }, [activeId]);

  // ─── File upload ───
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        const image = { base64, url: dataUrl, mime: file.type };
        setPendingImage(image);
      };
      reader.readAsDataURL(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setInput(prev => prev + (prev ? "\n\n" : "") + `[ملف: ${file.name}]\n${text.slice(0, 3000)}`);
        setTimeout(autoResize, 10);
      };
      reader.readAsText(file);
    }

    e.target.value = "";
  }, [autoResize]);

  // ─── Send message ───
  const sendMessage = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;

    // If the user has an attached image and asks to convert it, trigger anime conversion instead of a normal chat message
    const convertKeywords = ["حول", "حوّل", "لانمي", "الى انمي", "إلى انمي", "بانمي", "انمي", "anime", "convert"];
    if (pendingImage && convertKeywords.some(k => content.toLowerCase().includes(k))) {
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setMessages(prev => [...prev, { id: Date.now(), conversationId: activeId ?? 0, role: "user", content, createdAt: new Date().toISOString() }]);
      const image = pendingImage;
      convertToAnime(image);
      return;
    }

    // If the user asks to generate/create an image (with no image attached), trigger image generation
    const generatePatterns = [
      /انشئ\s*(لي|لى)?\s*صور[ةه]?/i, /أنشئ\s*(لي|لى)?\s*صور[ةه]?/i, /اعمل\s*(لي|لى)?\s*صور[ةه]?/i,
      /اصنع\s*(لي|لى)?\s*صور[ةه]?/i, /ارسم\s*(لي|لى)?/i, /صمم\s*(لي|لى)?\s*صور[ةه]?/i,
      /generate\s+(an?\s+)?image/i, /create\s+(an?\s+)?image/i, /draw\s+(an?\s+)?(image|picture)/i, /make\s+(an?\s+)?image/i,
    ];
    if (!pendingImage && generatePatterns.some(re => re.test(content))) {
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setMessages(prev => [...prev, { id: Date.now(), conversationId: activeId ?? 0, role: "user", content, createdAt: new Date().toISOString() }]);
      generateImage(content);
      return;
    }

    let convId = activeId;
    setStreaming(true);

    try {
      if (!convId) {
        const title = content.slice(0, 50) + (content.length > 50 ? "…" : "");
        const res = await fetch(`${API}/openai/conversations`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        });
        if (!res.ok) throw new Error(`Failed to create conversation: ${res.status}`);
        const conv = await res.json();
        setConversations(prev => [conv, ...prev]);
        setActiveId(conv.id);
        convId = conv.id;
      }

      setMessages(prev => [...prev, { id: Date.now(), conversationId: convId!, role: "user", content, createdAt: new Date().toISOString() }]);
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      setStreamContent("");
      abortRef.current = new AbortController();

      // Stall watchdog: if no data arrives (server hung, model slow) for 45s, abort automatically
      let stallTimer: ReturnType<typeof setTimeout> = setTimeout(() => {}, 0);
      const resetStallTimer = () => {
        clearTimeout(stallTimer);
        stallTimer = setTimeout(() => abortRef.current?.abort(), 45000);
      };
      resetStallTimer();

      const res = await fetch(`${API}/openai/conversations/${convId}/messages`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
        signal: abortRef.current.signal,
      });
      resetStallTimer();
      if (!res.ok) {
        clearTimeout(stallTimer);
        const errBody = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(errBody?.error || `Failed to send message: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "", full = "";

      while (reader) {
        const { done, value } = await reader.read();
        resetStallTimer();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const json = JSON.parse(line.slice(6));
            if (json.done) break;
            if (json.content) { full += json.content; setStreamContent(full); }
          } catch { /* ignore */ }
        }
      }
      clearTimeout(stallTimer);

      setMessages(prev => [...prev, { id: Date.now() + 1, conversationId: convId!, role: "assistant", content: full, createdAt: new Date().toISOString() }]);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setMessages(prev => [...prev, { id: Date.now() + 1, conversationId: convId ?? 0, role: "assistant", content: "الرد استغرق وقت طويل جدًا ولم يستجب الخادم. حاول مرة أخرى.", createdAt: new Date().toISOString() }]);
      } else if (err instanceof Error) {
        setMessages(prev => [...prev, { id: Date.now() + 1, conversationId: convId ?? 0, role: "assistant", content: err.message || "حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.", createdAt: new Date().toISOString() }]);
      }
    } finally {
      setStreaming(false);
      setStreamContent("");
    }
  }, [input, streaming, activeId, pendingImage, convertToAnime, generateImage]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const isEmpty = messages.length === 0 && !streaming && !generatingImage;

  return (
    <div className="flex h-screen bg-[#0c0c18] text-foreground overflow-hidden">

      {/* ── Sidebar ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="w-[260px] shrink-0 flex flex-col bg-[#0a0a16] border-r border-white/5 overflow-hidden absolute md:relative z-30 h-full"
          >
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <img src="/images/logo.png" alt="Y M S AI" className="w-7 h-7 object-contain" />
                <span className="font-display font-bold text-sm tracking-widest text-foreground">Y M S AI</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="md:hidden w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3">
              <button data-testid="button-new-conversation" onClick={newConversation}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> محادثة جديدة
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-1">
              {conversations.length > 0 && (
                <div className="mb-2 px-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-mono">المحادثات</span>
                </div>
              )}
              {conversations.map(conv => (
                <div key={conv.id} data-testid={`conversation-item-${conv.id}`}
                  onClick={() => { loadConversation(conv.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-sm transition-all duration-150 mb-0.5 ${
                    activeId === conv.id ? "bg-primary/15 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <SquareTerminal className="w-3.5 h-3.5 shrink-0 opacity-50" />
                    <span className="truncate text-xs">{conv.title}</span>
                  </div>
                  <button data-testid={`button-delete-${conv.id}`}
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="shrink-0 flex items-center gap-1 text-muted-foreground/70 hover:text-red-400 hover:bg-red-400/10 transition-all ml-1 px-2 py-1 rounded-lg border border-transparent hover:border-red-400/20"
                    title="حذف المحادثة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-medium hidden sm:inline">حذف</span>
                  </button>
                </div>
              ))}
            </div>

            {/* User profile + sign out */}
            <div className="p-3 border-t border-white/5 space-y-1">
              {user && (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/3">
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-primary/20 shrink-0">
                    {user.imageUrl
                      ? <img src={user.imageUrl} alt="avatar" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-primary/20 flex items-center justify-center"><User className="w-3.5 h-3.5 text-primary" /></div>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-medium text-foreground truncate">{user.fullName || user.primaryEmailAddress?.emailAddress}</p>
                      {isAdmin && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {isAdmin ? "المؤسس • YMS" : user.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </div>
              )}
              <button onClick={() => signOut({ redirectUrl: `${import.meta.env.BASE_URL.replace(/\/$/, "")}/` })}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-400/5 text-xs transition-colors">
                <LogOut className="w-3.5 h-3.5" /> تسجيل الخروج
              </button>
              <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 text-xs transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" /> الرجوع للرئيسية
              </Link>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {/* Topbar */}
        <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-white/5 bg-[#0c0c18]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button data-testid="button-toggle-sidebar" onClick={() => setSidebarOpen(v => !v)}
              className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg hover:bg-white/5 transition-colors">
              <Menu className="w-4 h-4" />
            </button>
            {!sidebarOpen && (
              <div className="flex items-center gap-2">
                <img src="/images/logo.png" alt="YMS AI" className="w-6 h-6 object-contain" />
                <span className="font-display font-bold text-sm tracking-widest">Y M S AI</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_6px_rgba(0,255,255,0.8)]" />
              <span className="font-mono text-[11px] text-muted-foreground/60 uppercase tracking-widest hidden sm:block">متصل</span>
            </div>
            {activeId && (
              <button onClick={newConversation}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <PenSquare className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">جديد</span>
              </button>
            )}
          </div>
        </div>

        {/* Messages / Welcome */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full px-4 pb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-10">
                <img src="/images/logo.png" alt="Y M S AI" className="w-16 h-16 object-contain mx-auto mb-4 drop-shadow-[0_0_20px_rgba(0,255,255,0.4)]" />
                <h1 className="text-2xl md:text-3xl font-display font-bold tracking-widest text-foreground mb-2">Y M S AI</h1>
                <p className="text-muted-foreground text-sm max-w-md">
                  مساعدك الذكي الشامل — اسألني أي شيء، في أي موضوع، بأي لغة.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                    onClick={() => sendMessage(s.text)} data-testid={`suggestion-${i}`}
                    className="flex items-start gap-3 p-4 rounded-2xl border border-white/8 bg-white/3 hover:bg-white/6 hover:border-primary/30 text-left transition-all group text-sm">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <s.icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-widest text-primary/60 mb-0.5 font-mono">{s.label}</div>
                      <div className="text-foreground/80 text-xs leading-relaxed">{s.text}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-6">
              {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
              {streaming && <StreamingBubble content={streamContent} />}
              {generatingImage && (
                <div className="flex items-center gap-2 text-xs text-primary">
                  <motion.div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                  جاري إنشاء الصورة...
                </div>
              )}
              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* ── Input area ── */}
        <div className="shrink-0 px-4 py-4 bg-[#0c0c18]/90 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            {/* Pending image preview / conversion status */}
            {pendingImage && (
              <div className="mb-2 flex items-center gap-2">
                <img src={pendingImage.url} alt="pending" className="h-12 w-12 object-cover rounded-lg border border-border/40" />
                {convertingAnime ? (
                  <span className="flex items-center gap-2 text-xs text-primary">
                    <motion.div className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                    جاري تحويل الصورة إلى أنمي...
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">صورة مرفقة — اكتب "حول" في الرسالة عشان أحوّلها لأنمي</span>
                )}
                <button onClick={() => setPendingImage(null)} className="text-muted-foreground hover:text-red-400 ml-auto"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            <div className="relative flex items-end gap-2 bg-[#141428] border border-white/10 rounded-2xl px-3 py-3 focus-within:border-primary/40 transition-colors shadow-lg">
              {/* File upload */}
              <button onClick={() => fileInputRef.current?.click()} title="إرفاق ملف أو صورة"
                className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-primary rounded-lg hover:bg-primary/10 transition-colors shrink-0">
                <Paperclip className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*,.txt,.md,.pdf,.js,.ts,.py,.json,.csv" className="hidden" onChange={handleFileChange} />

              {/* Textarea */}
              <textarea ref={textareaRef} data-testid="textarea-chat-input"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none caret-primary leading-relaxed"
                placeholder="اسألني أي شيء... (Enter للإرسال، Shift+Enter لسطر جديد)"
                value={input} onChange={(e) => { setInput(e.target.value); autoResize(); }}
                onKeyDown={handleKey} rows={1}
                style={{ minHeight: "24px", maxHeight: "200px" }}
                disabled={streaming} dir="auto"
              />

              {/* Voice */}
              <button onClick={toggleVoice} title={isListening ? "إيقاف التسجيل" : "تسجيل صوتي"}
                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all shrink-0 ${
                  isListening ? "text-red-400 bg-red-400/10 animate-pulse" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                }`}>
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Send */}
              <button data-testid="button-send-message" onClick={() => sendMessage()} disabled={streaming || !input.trim()}
                className={`w-8 h-8 flex items-center justify-center rounded-xl shrink-0 transition-all ${
                  input.trim() && !streaming ? "bg-primary text-primary-foreground hover:bg-white shadow-[0_0_12px_rgba(0,255,255,0.3)]" : "bg-white/5 text-muted-foreground/30 cursor-not-allowed"
                }`}>
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground/25 mt-2 font-mono">Y M S AI — Code The Impossible</p>
          </div>
        </div>
      </div>

    </div>
  );
}
