import { useRef, useState } from "react";
import {
  FileText,
  FileUp,
  FileCheck2,
  Search,
  Settings2,
  Plus,
  Send,
  Paperclip,
  Bot,
  UserRound,
  Sparkles,
  BookOpen,
  Lightbulb,
  Clock3,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  LoaderCircle,
  X,
  Menu,
  RotateCcw,
  FileSearch,
  BrainCircuit,
} from "lucide-react";
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Something went wrong. Please try again."
    );
  }
  return data;
}
function formatSize(bytes) {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function IconButton({ children, onClick, title, className = "" }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`rounded-xl p-2.5 text-slate-500 transition hover:bg-sky-100/80 hover:text-slate-900 ${className}`}
    >
      {children}
    </button>
  );
}
function SectionHeading({ icon: Icon, children, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <Icon size={17} className="text-cyan-700" />
        <h3 className="text-sm font-semibold text-slate-800">
          {children}
        </h3>
      </div>
      {action}
    </div>
  );
}
function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-5 py-8 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/80 bg-white/70">
        <Icon size={24} className="text-slate-500" />
      </div>
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <p className="mt-2 max-w-xs text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}
export default function App() {
  const fileInput = useRef(null);
  const chatEnd = useRef(null);
  const idCounter = useRef(0);
  function createId() {
    idCounter.current += 1;
    return `message-${idCounter.current}`;
  }
  const [file, setFile] = useState(null);
  const [documentData, setDocumentData] = useState(null);
  const [documentHistory, setDocumentHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [activeTab, setActiveTab] = useState("summary");
  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [showInsights] = useState(true);
  const [expandedSources, setExpandedSources] = useState({});
  function selectFile(selectedFile) {
    if (!selectedFile) return;
    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file.");
      return;
    }
    setFile(selectedFile);
    setError("");
  }
  async function uploadDocument(event) {
    event?.preventDefault();
    if (!file || uploading) return;
    setUploading(true);
    setError("");
    setDocumentData(null);
    setMessages([]);
    setExpandedSources({});
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch(
        `${API_BASE}/api/documents/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await parseResponse(response);
      setDocumentData({
        ...data,
        originalName: file.name,
        size: file.size,
        uploadedAt: new Date().toLocaleString(),
      });
      setDocumentHistory((previous) => [
        {
          id: createId(),
          name: file.name,
          size: file.size,
          characters: data.characters,
        },
        ...previous.filter((item) => item.name !== file.name),
      ]);
      setFile(null);
      if (fileInput.current) {
        fileInput.current.value = "";
      }
      setMessages([
        {
          id: `${createId()}-welcome`,
          role: "assistant",
          content:
            `Your PDF "${file.name}" has been indexed successfully. ` +
            "You can ask questions, review the summary, or explore the key points.",
          sources: [],
          welcome: true,
        },
      ]);
    } catch (err) {
      setError(
        err.message ||
          "Unable to upload PDF. Check that the backend is running."
      );
    } finally {
      setUploading(false);
    }
  }
  async function askQuestion(event, suggestedQuestion) {
    event?.preventDefault();
    const currentQuestion = (
      suggestedQuestion ?? question
    ).trim();
    if (!currentQuestion || !documentData || asking) return;
    const userMessage = {
      id: `${createId()}-user`,
      role: "user",
      content: currentQuestion,
    };
    setMessages((previous) => [...previous, userMessage]);
    setQuestion("");
    setAsking(true);
    setError("");
    setExpandedSources({});
    try {
      const response = await fetch(
        `${API_BASE}/api/documents/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: currentQuestion,
            top_k: 3,
          }),
        }
      );
      const data = await parseResponse(response);
      setMessages((previous) => [
        ...previous,
        {
          id: `${createId()}-assistant`,
          role: "assistant",
          content: data.answer,
          sources: data.sources || [],
        },
      ]);
      setTimeout(() => {
        chatEnd.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }, 50);
    } catch (err) {
      setError(
        err.message ||
          "Could not search the document. Please try again."
      );
    } finally {
      setAsking(false);
    }
  }
  function startNewDocument() {
    setFile(null);
    setDocumentData(null);
    setMessages([]);
    setQuestion("");
    setError("");
    setExpandedSources({});
    if (fileInput.current) {
      fileInput.current.value = "";
    }
  }
  function toggleSource(messageId, sourceIndex) {
    const key = `${messageId}-${sourceIndex}`;
    setExpandedSources((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  }
  function chooseSuggestion(text) {
    askQuestion(null, text);
  }
  const suggestions = [
    "What are the main topics?",
    "List the important points",
    "What is the conclusion?",
    "Find the most relevant information",
  ];
  return (
    <div className="h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_left,#e8f9ff_0%,#d8f3fc_45%,#f5fcff_100%)] text-slate-800">
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={(event) => selectFile(event.target.files?.[0])}
      />
      {/* Top navigation */}
      <header className="relative z-40 flex h-[68px] shrink-0 items-center justify-between border-b border-sky-200/80 bg-white/65 px-4 backdrop-blur-2xl sm:px-6">
        <div className="flex items-center gap-3">
          <IconButton
            title="Toggle documents sidebar"
            className="lg:hidden"
            onClick={() => setMobileSidebar(!mobileSidebar)}
          >
            <Menu size={20} />
          </IconButton>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/20 bg-gradient-to-br from-indigo-500/20 to-violet-500/10">
            <FileText size={23} className="text-cyan-700" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Docu<span className="text-cyan-700">Sense</span>
            </h1>
            <p className="hidden text-[11px] text-slate-500 sm:block">
              Your PDF, smarter answers
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-gradient-to-br from-sky-500 to-cyan-500 text-sm font-semibold text-slate-900">
            D
          </div>
        </div>
      </header>
      <div className="flex h-[calc(100vh-68px)] min-h-0 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`fixed bottom-0 left-0 top-[68px] z-30 flex w-[260px] flex-col border-r border-sky-200/80 bg-white/75 backdrop-blur-2xl transition-transform duration-200 lg:sticky lg:top-0 lg:z-10 lg:h-full lg:translate-x-0 ${
            mobileSidebar ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="p-4">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-indigo-950/30 transition hover:brightness-110"
            >
              <Plus size={18} />
              Upload PDF
            </button>
            <button
              type="button"
              onClick={startNewDocument}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200/80 bg-white/65 px-4 py-2.5 text-xs text-slate-500 transition hover:bg-sky-100/70 hover:text-slate-900"
            >
              <RotateCcw size={14} />
              Start a new analysis
            </button>
          </div>
          <div className="px-4 pb-2 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.13em] text-slate-500">
                Recent documents
              </p>
              <span className="text-xs text-slate-500">
                {documentHistory.length}
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {documentHistory.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <FileSearch
                  size={25}
                  className="mx-auto text-slate-500"
                />
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Your uploaded documents will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {documentHistory.map((item) => {
                  const active =
                    documentData?.originalName === item.name;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (!active) {
                          setError(
                            "Upload this PDF again to analyze it. Previous documents are not retained in the backend index."
                          );
                        }
                        setMobileSidebar(false);
                      }}
                      className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-sky-200 bg-gradient-to-r from-indigo-500/[0.12] to-violet-500/[0.04]"
                          : "border-transparent hover:bg-sky-100/60"
                      }`}
                    >
                      <div className="flex h-10 w-9 shrink-0 items-center justify-center rounded-lg border border-rose-400/10 bg-rose-500/10">
                        <FileText size={20} className="text-rose-600" />
                      </div>
                      <div className="min-h-0 min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-slate-700">
                          {item.name}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          {formatSize(item.size)}
                          {item.characters
                            ? ` · ${item.characters.toLocaleString()} chars`
                            : ""}
                        </p>
                      </div>
                      {active && (
                        <CheckCircle2
                          size={15}
                          className="shrink-0 text-emerald-400"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="m-4 rounded-2xl border border-indigo-400/10 bg-gradient-to-br from-indigo-500/[0.09] to-violet-500/[0.025] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100">
              <BrainCircuit size={19} className="text-cyan-700" />
            </div>
            <p className="text-sm font-medium text-slate-900">
              Turn documents into insights
            </p>
            <p className="mt-1.5 text-xs leading-5 text-slate-500">
              Extract text, review summaries and find relevant passages.
            </p>
            <div className="mt-4 space-y-2.5 text-xs text-slate-500">
              <p className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                PDF text extraction
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Semantic search
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" />
                Extractive summaries
              </p>
            </div>
          </div>
        </aside>
        {mobileSidebar && (
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileSidebar(false)}
            className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          />
        )}
        {/* Main workspace */}
        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <div
            className={`mx-auto grid h-full w-full max-w-[1800px] min-h-0 grid-cols-1 items-stretch gap-3 p-3 sm:p-4 ${
              showInsights
                ? "xl:grid-cols-[minmax(0,1fr)_320px]"
                : "max-w-5xl"
            }`}
          >
            <section className="flex min-h-0 min-w-0 flex-col">
              {/* Selected file upload panel */}
              {file && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-100/70 p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileUp size={20} className="shrink-0 text-sky-700" />
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      disabled={uploading}
                      className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-900"
                      title="Remove selected file"
                    >
                      <X size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={uploadDocument}
                      disabled={uploading}
                      className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-sky-500 disabled:opacity-60"
                    >
                      {uploading ? (
                        <LoaderCircle size={15} className="animate-spin" />
                      ) : (
                        <FileCheck2 size={15} />
                      )}
                      {uploading ? "Processing..." : "Upload & analyze"}
                    </button>
                  </div>
                </div>
              )}
              {error && (
                <div
                  role="alert"
                  className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-500/[0.06] p-3 text-sm text-rose-700"
                >
                  <p>{error}</p>
                  <button
                    type="button"
                    onClick={() => setError("")}
                    className="shrink-0 text-rose-700 hover:text-slate-900"
                    aria-label="Dismiss error"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              {/* Conversation */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/90 bg-white/60 shadow-[0_12px_40px_rgba(91,166,190,0.12)] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-sky-100 px-4 py-3.5 sm:px-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 shadow-lg shadow-indigo-950/40">
                      <Bot size={20} className="text-slate-900" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Document assistant
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMessages([])}
                    disabled={!messages.length || asking}
                    className="rounded-lg px-2.5 py-2 text-xs text-slate-500 hover:bg-sky-100/70 hover:text-slate-700 disabled:opacity-30"
                  >
                    Clear chat
                  </button>
                </div>
                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-5">
                  {!documentData ? (
                    <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
                      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-[26px] border border-violet-400/15 bg-gradient-to-br from-indigo-500/15 to-violet-500/[0.04]">
                        <FileSearch
                          size={34}
                          className="text-cyan-700"
                        />
                        <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-[#080f1e] bg-indigo-500 text-slate-900">
                          <Plus size={15} />
                        </span>
                      </div>
                      <h2 className="text-xl font-semibold text-slate-900">
                        Your documents, understood.
                      </h2>
                      <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
                        Upload a PDF to extract its summary, explore
                        key points and search for relevant passages.
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInput.current?.click()}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-sky-500"
                      >
                        <FileUp size={17} />
                        Choose a PDF
                      </button>
                    </div>
                  ) : (
                    <>
                      {messages.length === 0 && (
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                            <Bot size={20} />
                          </div>
                          <div className="max-w-2xl rounded-2xl rounded-tl-md border border-sky-100 bg-white/80 p-4">
                            <p className="text-sm leading-6 text-slate-700">
                              Hi! Your document is ready. Ask me
                              something about its content, and I will
                              retrieve relevant passages.
                            </p>
                          </div>
                        </div>
                      )}
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex items-start gap-3 ${
                            message.role === "user"
                              ? "flex-row-reverse"
                              : ""
                          }`}
                        >
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              message.role === "user"
                                ? "bg-cyan-100 text-cyan-700"
                                : "bg-sky-100 text-sky-700"
                            }`}
                          >
                            {message.role === "user" ? (
                              <UserRound size={18} />
                            ) : (
                              <Bot size={20} />
                            )}
                          </div>
                          <div
                            className={`min-w-0 max-w-[90%] sm:max-w-[85%] ${
                              message.role === "user" ? "text-right" : ""
                            }`}
                          >
                            <div
                              className={`inline-block rounded-2xl p-4 text-left text-sm leading-6 ${
                                message.role === "user"
                                  ? "rounded-tr-md bg-gradient-to-br from-sky-500 to-cyan-500 text-slate-900"
                                  : "rounded-tl-md border border-sky-100 bg-white/80 text-slate-700"
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">
                                {message.content}
                              </p>
                            </div>
                            {message.role === "assistant" &&
                              message.sources?.length > 0 && (
                                <div className="mt-3 overflow-hidden rounded-xl border border-white/80 bg-[#0b1425] text-left">
                                  <div className="flex items-center gap-2 border-b border-sky-100 px-3 py-2.5">
                                    <BookOpen
                                      size={14}
                                      className="text-cyan-700"
                                    />
                                    <span className="text-xs font-medium text-slate-700">
                                      Retrieved passages
                                    </span>
                                    <span className="ml-auto text-[10px] text-slate-500">
                                      {message.sources.length} sources
                                    </span>
                                  </div>
                                  <div className="divide-y divide-sky-100">
                                    {message.sources.map((source, index) => {
                                      const key = `${message.id}-${index}`;
                                      const expanded =
                                        Boolean(expandedSources[key]);
                                      return (
                                        <div key={key} className="px-3 py-2.5">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              toggleSource(message.id, index)
                                            }
                                            className="flex w-full items-center gap-2 text-left"
                                          >
                                            <FileText
                                              size={15}
                                              className="shrink-0 text-slate-500"
                                            />
                                            <span className="flex-1 text-xs font-medium text-slate-700">
                                              Passage {index + 1}
                                            </span>
                                            {Number.isFinite(source.distance) && (
                                              <span className="text-[10px] text-slate-500">
                                                Distance{" "}
                                                {source.distance.toFixed(3)}
                                              </span>
                                            )}
                                            {expanded ? (
                                              <ChevronDown
                                                size={14}
                                                className="text-slate-500"
                                              />
                                            ) : (
                                              <ChevronRight
                                                size={14}
                                                className="text-slate-500"
                                              />
                                            )}
                                          </button>
                                          {expanded && (
                                            <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-sky-50/90 p-3 text-xs leading-6 text-slate-500">
                                              {source.chunk}
                                            </p>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                      {messages.length <= 1 && (
                        <div className="pl-12">
                          <p className="mb-2 text-[11px] text-slate-500">
                            Try asking
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {suggestions.map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                disabled={asking}
                                onClick={() =>
                                  chooseSuggestion(suggestion)
                                }
                                className="rounded-full border border-sky-200 bg-sky-50/80 px-3 py-2 text-xs text-sky-800 transition hover:border-indigo-400/35 hover:bg-sky-100 disabled:opacity-50"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {asking && (
                        <div className="flex items-center gap-3 pl-1">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                            <Bot size={20} />
                          </div>
                          <div className="flex items-center gap-2 rounded-xl border border-sky-100 bg-white/80 px-4 py-3 text-xs text-slate-500">
                            <LoaderCircle
                              size={14}
                              className="animate-spin text-cyan-700"
                            />
                            Searching document passages...
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={chatEnd} />
                </div>
                {/* Composer */}
                <div className="shrink-0 border-t border-sky-100 bg-white/65 p-3 sm:p-4">
                  <form
                    onSubmit={(event) => askQuestion(event)}
                    className="flex items-end gap-2 rounded-2xl border border-sky-200 bg-white/80 p-2 focus-within:border-sky-400"
                  >
                    <IconButton
                      title="Attach PDF"
                      onClick={() => fileInput.current?.click()}
                      className="mb-0.5"
                    >
                      <Paperclip size={18} />
                    </IconButton>
                    <textarea
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      onKeyDown={(event) => {
                        if (
                          event.key === "Enter" &&
                          !event.shiftKey &&
                          !event.nativeEvent.isComposing
                        ) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      rows={1}
                      maxLength={1000}
                      disabled={!documentData || asking}
                      placeholder={
                        documentData
                          ? "Ask a question about your PDF..."
                          : "Upload a PDF to start asking..."
                      }
                      className="max-h-28 min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-5 text-slate-800 outline-none placeholder:text-slate-500 disabled:cursor-not-allowed"
                    />
                    <button
                      type="submit"
                      disabled={!documentData || !question.trim() || asking}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-cyan-500 text-slate-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                      aria-label="Send question"
                    >
                      {asking ? (
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                      ) : (
                        <Send size={17} />
                      )}
                    </button>
                  </form>
                  <p className="mt-2 text-center text-[10px] leading-5 text-slate-500">
                    AI-generated answers grounded in your PDF · Enter to send · Shift + Enter for a new line.
                  </p>
                </div>
              </div>
            </section>
            {/* Right insights panel */}
            {showInsights && (
              <aside className="min-h-0 space-y-4 overflow-y-auto">
                <section className="rounded-2xl border border-white/80 bg-white/65 p-4">
                  <div className="grid grid-cols-3 rounded-xl border border-sky-100 bg-sky-50/80 p-1">
                    {[
                      { id: "summary", label: "Summary", icon: FileText },
                      { id: "points", label: "Key points", icon: Sparkles },
                      { id: "details", label: "Details", icon: Clock3 },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-1 py-2.5 text-[10px] transition sm:flex-row sm:text-xs ${
                            activeTab === tab.id
                              ? "bg-gradient-to-r from-sky-500 to-cyan-500 font-medium text-slate-900"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Icon size={14} />
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-5">
                    {activeTab === "summary" && (
                      <>
                        <SectionHeading icon={FileText}>
                          Document summary
                        </SectionHeading>
                        {documentData ? (
                          <>
                            <div className="rounded-xl border border-sky-100 bg-white/75 p-4">
                              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                                {documentData.summary ||
                                  "No summary was returned."}
                              </p>
                            </div>
                            <p className="mt-3 text-[10px] leading-5 text-slate-500">
                              Extractive summary · Selected from original
                              document sentences.
                            </p>
                          </>
                        ) : (
                          <EmptyState
                            icon={FileText}
                            title="No summary yet"
                            description="Upload a PDF to see its summary here."
                          />
                        )}
                      </>
                    )}
                    {activeTab === "points" && (
                      <>
                        <SectionHeading icon={Lightbulb}>
                          Key points
                        </SectionHeading>
                        {documentData?.key_points?.length ? (
                          <div className="space-y-3">
                            {documentData.key_points.map((point, index) => {
                              const iconStyles = [
                                "bg-emerald-500/15 text-emerald-700",
                                "bg-blue-500/15 text-blue-300",
                                "bg-cyan-100 text-cyan-700",
                                "bg-amber-500/15 text-amber-300",
                                "bg-pink-500/15 text-pink-300",
                              ];
                              return (
                                <div
                                  key={`${index}-${point}`}
                                  className="flex items-start gap-3"
                                >
                                  <div
                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                      iconStyles[index % iconStyles.length]
                                    }`}
                                  >
                                    <Sparkles size={15} />
                                  </div>
                                  <p className="pt-1 text-xs leading-6 text-slate-700">
                                    {point}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <EmptyState
                            icon={Lightbulb}
                            title="No key points yet"
                            description="Upload a PDF to extract important sentences."
                          />
                        )}
                      </>
                    )}
                    {activeTab === "details" && (
                      <>
                        <SectionHeading icon={Settings2}>
                          Document details
                        </SectionHeading>
                        {documentData ? (
                          <div className="space-y-4">
                            {[
                              {
                                label: "File name",
                                value: documentData.originalName,
                              },
                              {
                                label: "File size",
                                value: formatSize(documentData.size),
                              },
                              {
                                label: "Characters",
                                value:
                                  documentData.characters?.toLocaleString(),
                              },
                              {
                                label: "Text chunks",
                                value: documentData.chunks,
                              },
                              {
                                label: "Embedding dimensions",
                                value: documentData.embedding_dimension,
                              },
                              {
                                label: "Index status",
                                value: "Ready",
                              },
                            ].map((item) => (
                              <div
                                key={item.label}
                                className="flex items-start justify-between gap-3 text-xs"
                              >
                                <span className="text-slate-500">
                                  {item.label}
                                </span>
                                <span className="max-w-[60%] break-words text-right text-slate-700">
                                  {item.value ?? "—"}
                                </span>
                              </div>
                            ))}
                            <div className="rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] p-3">
                              <p className="flex items-center gap-2 text-xs font-medium text-emerald-700">
                                <CheckCircle2 size={15} />
                                Document indexed
                              </p>
                              <p className="mt-1 text-[10px] leading-5 text-slate-500">
                                Ready for semantic passage retrieval.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <EmptyState
                            icon={Settings2}
                            title="No document details"
                            description="Document metadata will appear after upload."
                          />
                        )}
                      </>
                    )}
                  </div>
                </section>
                <section className="rounded-2xl border border-white/80 bg-white/65 p-4">
                  <SectionHeading icon={Search}>
                    Search capabilities
                  </SectionHeading>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100">
                        <Search size={17} className="text-sky-700" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          Semantic retrieval
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          Find related passages by meaning
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
                        <BookOpen size={17} className="text-cyan-700" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-700">
                          Source passages
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">
                          Inspect the retrieved text
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </aside>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
