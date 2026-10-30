import { useState, useEffect, useCallback, useRef } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Copy,
  History,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  ClipboardList,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useStore } from "../lib/store";
import { backend, safeLink } from "../lib/supabase";
import {
  answerRini,
  feedbackCategory,
  classify,
  sentimentSummary,
  topics,
  type Scenario,
} from "../lib/intelligence";
import { municipalities, type Post } from "../lib/types";
import {
  AuthPrompt,
  Badge,
  Empty,
  PageTitle,
  Skeleton,
  dateTime,
} from "../components/common";
import { Button } from "../components/ui/button";
import { Simulation } from "./Simulation";
import scenarios from "../data/ferry_scenarios.json";
export function Notifications() {
  const s = useStore();
  if (!s.session)
    return (
      <div className="page">
        <PageTitle
          eyebrow="NOTIFICATIONS"
          title="Stay in the loop."
          description="Your conversations, updates and community connections, all together."
        />
        <AuthPrompt />
      </div>
    );
  const events = s.events.filter(
    (e) =>
      e.recipient_id === s.session?.user.id &&
      [
        "notification",
        "feedback_update",
        "moderation",
        "business_review",
      ].includes(e.event_type),
  );
  return (
    <div className="page narrow-page">
      <PageTitle
        eyebrow="NOTIFICATIONS"
        title="A little news for you."
        description={`${events.filter((e) => !e.read_at).length} unread updates · private to your account`}
        action={
          <Button
            variant="outline"
            onClick={() =>
              void s.run(() => s.markRead(), "All notifications marked read")
            }
          >
            <CheckCheck size={17} />
            Mark all read
          </Button>
        }
      />
      {s.loading ? (
        <Skeleton />
      ) : events.length ? (
        <div className="card notifications">
          {events.map((e) => (
            <div
              key={e.id}
              className={"notification-row " + (!e.read_at ? "unread" : "")}
            >
              <span className="notification-icon">
                <Bell size={18} />
              </span>
              <div className="grow">
                <strong>
                  {String(e.payload.message ?? "You have an update")}
                </strong>
                <small>{dateTime(e.created_at)}</small>
                {typeof e.payload.url === "string" &&
                  e.payload.url.startsWith("/") &&
                  !e.payload.url.startsWith("//") && (
                    <Link
                      className="text-link"
                      to={e.payload.url}
                      onClick={() =>
                        void s.run(
                          () => s.markRead(e.id),
                          "Notification opened",
                        )
                      }
                    >
                      Open related content →
                    </Link>
                  )}
              </div>
              {!e.read_at && (
                <button
                  className="text-link"
                  onClick={() =>
                    void s.run(() => s.markRead(e.id), "Marked read")
                  }
                >
                  Mark read
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Empty title="You’re all caught up">
          New comments, feedback decisions and listing reviews will appear here.
        </Empty>
      )}
    </div>
  );
}
type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  sources?: { name: string; url: string; publisher?: string; date?: string }[];
  action?: string;
};
export function RiniLegacy() {
  const s = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Mabuhay! I’m RINI, your Marinduque companion. I look up tourism records and show my sources. What would you like to explore?",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  async function send(text: string) {
    if (!text.trim() || busy) return;
    setMessages((old) => [
      ...old,
      { id: crypto.randomUUID(), role: "user", text },
    ]);
    setInput("");
    setBusy(true);
    try {
      const result = answerRini(text, s.listings);
      await Promise.resolve();
      setMessages((old) => [
        ...old,
        { id: crypto.randomUUID(), role: "assistant", ...result },
      ]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page rini-page">
      <PageTitle
        eyebrow="RINI · YOUR ISLAND COMPANION"
        title="A good journey starts with a question."
        description="Source-grounded answers in English and Filipino. No paid AI service, no invented official information."
      />
      <div className="card chat">
        <div className="chat-header">
          <span className="rini-icon">
            <Sparkles />
          </span>
          <div>
            <h3>RINI</h3>
            <small>Curated lookup · deterministic assistant</small>
          </div>
          <Badge tone="success">Here to help</Badge>
        </div>
        <div
          className="messages"
          role="log"
          aria-live="polite"
          aria-label="Conversation with RINI"
        >
          {messages.map((m) => (
            <div className={"message " + m.role} key={m.id}>
              <span className="message-label">
                {m.role === "user" ? "You" : "RINI"}
              </span>
              <p>{m.text}</p>
              {m.sources?.map((source) => (
                <a
                  className="source-link"
                  href={safeLink(source.url)}
                  key={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink size={13} />
                  {source.name}
                </a>
              ))}
              {m.action && (
                <Link className="chat-action" to={m.action}>
                  Continue in DALUYAN →
                </Link>
              )}
            </div>
          ))}
          {busy && (
            <div className="message assistant" role="status">
              Looking through the records…
            </div>
          )}
        </div>
        <div className="chat-suggestions">
          {[
            "Tell me about Boac",
            "Plan a two-day beach itinerary",
            "Where are official weather advisories?",
            "Submit tourism feedback",
          ].map((q) => (
            <button key={q} disabled={busy} onClick={() => void send(q)}>
              {q}
            </button>
          ))}
        </div>
        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            aria-label="Message RINI"
            placeholder="Ask about a place, a plan, or a local experience…"
            value={input}
            maxLength={1000}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button
            size="icon"
            aria-label="Send message to RINI"
            disabled={busy || !input.trim()}
          >
            <Send size={18} />
          </Button>
        </form>
        <small className="chat-disclaimer">
          RINI can be incomplete. Confirm fees, access and operations with
          authoritative sources. Your chat stays in this tab.
        </small>
      </div>
    </div>
  );
}
type RiniSource = { name: string; url: string; publisher?: string; date?: string };
type SmartChatMessage = ChatMessage & { verified?: boolean; intent?: string; sources?: RiniSource[] };
function SmartMessage({ message, onCopy, onRegenerate }: { message: SmartChatMessage; onCopy: () => void; onRegenerate?: () => void }) {
  return <div className={`message ${message.role}`}>
    <span className="message-label">{message.role === "user" ? "You" : "RINI"}</span>
    <p className="message-text">{message.text}</p>
    {message.verified && <small className="verified-label">Information verified from available sources.</small>}
    {message.sources?.length ? <details className="sources-panel"><summary>Sources &amp; References ({message.sources.length})</summary>{message.sources.map((source) => <a className="source-link" href={safeLink(source.url)} key={source.url} target="_blank" rel="noreferrer"><ExternalLink size={13} />{source.name}{source.publisher ? ` · ${source.publisher}` : ""}</a>)}</details> : null}
    {message.role === "assistant" && <div className="message-tools"><button type="button" aria-label="Copy response" onClick={onCopy}><Copy size={13} /></button>{onRegenerate && <button type="button" aria-label="Regenerate response" onClick={onRegenerate}><RefreshCw size={13} /></button>}<button type="button" aria-label="Helpful"><ThumbsUp size={13} /></button><button type="button" aria-label="Not helpful"><ThumbsDown size={13} /></button></div>}
  </div>;
}
export function Rini() {
  const s = useStore();
  const [conversationId, setConversationId] = useState(() => crypto.randomUUID());
  const [messages, setMessages] = useState<SmartChatMessage[]>([{ id: "welcome", role: "assistant", text: "Mabuhay! I’m RINI, your Marinduque tourism companion. Ask me about destinations, culture, routes, budgets, safety, or current travel information.", verified: false }]);
  const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [historyOpen, setHistoryOpen] = useState(false); const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!historyOpen || !s.session) return;
    let active = true;
    void backend().from("rini_messages").select("id,conversation_id,role,content,sources,grounded,intent,created_at").eq("user_id", s.session.user.id).order("created_at", { ascending: true }).limit(100).then(({ data, error: queryError }) => {
      if (!active) return;
      if (queryError) {
        setError(queryError.message);
        return;
      }
      if (data?.length) {
        const latestConversation = data.filter((message) => message.conversation_id === conversationId);
        if (latestConversation.length) {
          setMessages(latestConversation.map((message) => ({
            id: message.id,
            role: message.role,
            text: message.content,
            sources: Array.isArray(message.sources) ? message.sources as RiniSource[] : [],
            verified: message.grounded,
            intent: message.intent ?? undefined,
          })));
        }
      }
    });
    return () => { active = false; };
  }, [conversationId, historyOpen, s.session]);
  async function riniError(error: unknown) {
    if (error instanceof Error && "context" in error && error.context instanceof Response) {
      if (error.context.status === 404) return "RINI is not deployed in this Supabase project yet. Deploy the rini-chat Edge Function, then try again.";
      try {
        const body = await error.context.clone().json() as { error?: string };
        if (body.error) return body.error;
      } catch {
        // Use the SDK error when the response is not JSON.
      }
    }
    return error instanceof Error ? error.message : "RINI could not reach the research service.";
  }
  async function ask(text: string, retryText?: string) {
    const question = text.trim(); if (!question || busy) return;
    setMessages((old) => [...old, { id: crypto.randomUUID(), role: "user", text: question }]); setInput(""); setBusy(true); setError("");
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      let result: SmartChatMessage;
      const response = await backend().functions.invoke("rini-chat", { body: { conversationId, message: question, previousMessages: messages.slice(-8).map(({ role, text: value }) => ({ role, text: value })) }, signal: controller.signal });
      if (response.error) throw response.error;
      result = { id: crypto.randomUUID(), role: "assistant", text: String(response.data?.text ?? "I could not produce a grounded answer."), sources: Array.isArray(response.data?.sources) ? response.data.sources : [], verified: Boolean(response.data?.verified), intent: response.data?.intent };
      setMessages((old) => [...old, result]);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === "AbortError") return;
      const message = await riniError(cause);
      setError(message);
      setMessages((old) => [...old, { id: crypto.randomUUID(), role: "assistant", text: message, verified: false }]);
    }
    finally { setBusy(false); abortRef.current = null; }
    void retryText;
  }
  function newConversation() { abortRef.current?.abort(); setConversationId(crypto.randomUUID()); setMessages([{ id: "welcome-" + crypto.randomUUID(), role: "assistant", text: "New conversation started. What would you like to discover in Marinduque?" }]); setError(""); }
  const lastQuestion = [...messages].reverse().find((message) => message.role === "user")?.text;
  return <div className="page rini-page"><PageTitle eyebrow="RINI · YOUR ISLAND COMPANION" title="A good journey starts with a question." description="Research-powered answers with source links, verified DALUYAN records, and transparent uncertainty." /><div className="card chat">
    <div className="chat-header"><span className="rini-icon"><Sparkles /></span><div><h3>RINI</h3><small>Marinduque research assistant · English, Filipino, and Taglish</small></div><Badge tone="success">Here to help</Badge></div>
    <div className="rini-toolbar"><button type="button" className="text-link" onClick={newConversation}><Plus size={14} />New conversation</button><button type="button" className="text-link" onClick={() => setHistoryOpen(!historyOpen)}><History size={14} />{historyOpen ? "Hide history" : "Conversation history"}</button></div>
    {historyOpen && <div className="rini-history"><p className="muted">Conversation history is associated with your signed-in account and loaded from Supabase.</p></div>}
    <div className="messages" role="log" aria-live="polite" aria-label="Conversation with RINI">{messages.map((message) => <SmartMessage key={message.id} message={message} onCopy={() => void navigator.clipboard?.writeText(message.text)} onRegenerate={message.role === "assistant" && lastQuestion ? () => void ask(lastQuestion) : undefined} />)}{busy && <div className="message assistant" role="status">RINI is researching trusted sources…</div>}</div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="chat-suggestions">{["Explore Marinduque destinations", "Plan a budget-friendly trip", "Explain Moriones Festival", "Find official weather and safety sources", "Recommend family-friendly places", "Anong magandang puntahan para sa photography?"].map((question) => <button key={question} disabled={busy} onClick={() => void ask(question)}>{question}</button>)}</div>
    <form className="chat-input" onSubmit={(event) => { event.preventDefault(); void ask(input); }}><input aria-label="Message RINI" placeholder="Ask about a place, a plan, or a local experience…" value={input} maxLength={2000} onChange={(event) => setInput(event.target.value)} /><Button size="icon" aria-label="Send message to RINI" disabled={busy || !input.trim()}><Send size={18} /></Button></form>
    {busy && <button type="button" className="stop-rini" onClick={() => abortRef.current?.abort()}><Square size={13} /> Stop generation</button>}
    <small className="chat-disclaimer">RINI distinguishes retrieved facts from recommendations. Fees, access, schedules, and safety conditions should still be confirmed with the cited source.</small>
  </div></div>;
}
export function Feedback() {
  const s = useStore();
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("Tourist experience");
  const [municipality, setMunicipality] = useState("Boac");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  if (!s.session)
    return (
      <div className="page">
        <PageTitle
          eyebrow="TOURISM FEEDBACK"
          title="Help shape a better island journey."
          description="Private reports for the tourism team. Not an emergency service."
        />
        <AuthPrompt />
      </div>
    );
  const reports = s.posts.filter(
    (p) => p.post_type === "feedback" && p.author_id === s.session?.user.id,
  );
  return (
    <div className="page feedback-page">
      <PageTitle
        eyebrow="RINI · TOURISM FEEDBACK"
        title="Your experience can make a difference."
        description="Share a concern privately. Reports are community allegations until reviewed, not verified findings. For emergencies, contact local emergency services."
      />
      <div className="feedback-grid">
        <form
          className="card form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            setBusy(true);
            void s
              .run(async () => {
                const media_urls = file
                  ? [await s.upload(file, "feedback-evidence")]
                  : [];
                await s.publish({
                  body,
                  post_type: "feedback",
                  listing_id: null,
                  municipality: municipality as Post["municipality"],
                  category,
                  media_urls,
                });
                setBody("");
                setFile(null);
              }, "Report received")
              .finally(() => setBusy(false));
          }}
        >
          <h2>Tell us what happened</h2>
          <label>
            Your concern
            <textarea
              required
              minLength={10}
              maxLength={5000}
              rows={6}
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                setCategory(feedbackCategory(e.target.value));
              }}
            />
          </label>
          <div className="form-grid">
            <label>
              Category (suggested; editable)
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {[...Object.keys(topics), "Tourist experience"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Municipality
              <select
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
              >
                {municipalities.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Optional private evidence
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <small>
            Evidence is stored in a private bucket. Only you and MFA-verified
            administrators may access it.
          </small>
          <Button disabled={busy || body.trim().length < 10}>
            <ClipboardList size={17} />
            {busy ? "Submitting…" : "Submit private report"}
          </Button>
        </form>
        <section>
          <h2>Track your reports</h2>
          <p className="fine-print">
            Received → Under Review → Action Noted → Closed
          </p>
          {reports.length ? (
            reports.map((p) => (
              <div className="card report-card" key={p.id}>
                <Badge tone="warning">{p.feedback_status}</Badge>
                <h3>
                  {p.category} · {p.municipality}
                </h3>
                <p>{p.body}</p>
                <small>{dateTime(p.created_at)}</small>
                {p.media_urls.map((path) => (
                  <Evidence key={path} path={path} />
                ))}
              </div>
            ))
          ) : (
            <Empty title="No reports submitted yet">
              Your report status and updates will appear here.
            </Empty>
          )}
        </section>
      </div>
    </div>
  );
}
function Evidence({ path }: { path: string }) {
  const s = useStore();
  const [url, setUrl] = useState("");
  return (
    <div>
      {url ? (
        <a href={url} target="_blank" rel="noreferrer">
          Open private evidence (expires in 60 seconds)
        </a>
      ) : (
        <button
          className="text-link"
          onClick={() =>
            void s.run(async () => {
              const { data, error } = await backend()
                .storage.from("feedback-evidence")
                .createSignedUrl(path, 60);
              if (error) throw error;
              setUrl(data.signedUrl);
            }, "Private evidence link created")
          }
        >
          View private evidence
        </button>
      )}
    </div>
  );
}
export function Admin() {
  const s = useStore();
  const [scenario, setScenario] = useState<Scenario>(scenarios[0]);
  const [tab, setTab] = useState("Overview");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [municipality, setMunicipality] = useState("");
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  if (!s.authReady || s.loading)
    return (
      <div className="page">
        <Skeleton />
      </div>
    );
  if (!s.session) return <Navigate to="/auth" replace />;
  if (s.role !== "admin")
    return (
      <div className="page">
        <Empty title="Administrator access required">
          This page is restricted by database authorization.
        </Empty>
      </div>
    );
  if (!s.isAdmin)
    return (
      <div className="page">
        <Empty title="Verify your authenticator">
          <ShieldCheck />
          Sensitive administrator operations require MFA assurance AAL2.{" "}
          <Link to="/settings">Open security settings</Link>
        </Empty>
      </div>
    );
  const feedback = s.posts.filter((p) => p.post_type === "feedback");
  const reports = s.events.filter((e) => e.event_type === "report");
  const pending = s.posts.filter(
    (p) => p.moderation_status === "pending" && p.post_type !== "feedback",
  );
  async function updatePost(id: string, patch: Partial<Post>) {
    const { error } = await backend().from("posts").update(patch).eq("id", id);
    if (error) throw error;
  }
  async function updateListing(id: string, patch: Record<string, unknown>) {
    const { error } = await backend()
      .from("listings")
      .update(patch)
      .eq("id", id);
    if (error) throw error;
  }
  const chartData = Object.keys(topics).map((name) => ({
    name,
    count: feedback.filter((p) => p.category === name).length,
  }));
  return (
    <div className="page admin-page">
      <PageTitle
        eyebrow="ADMINISTRATION · AAL2 PROTECTED"
        title="Better tourism, together."
        description="Review evidence, moderate responsibly, and protect private community reports."
      />
      <div className="filter-chips">
        {[
          "Overview",
          "Content",
          "Businesses",
          "Feedback",
          "Intelligence",
          "Sources",
          "Announcements",
        ].map((t) => (
          <button
            className={tab === t ? "active" : ""}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Overview" && (
        <>
          <div className="metric-grid">
            {[
              [
                "Published destinations",
                s.listings.filter(
                  (l) =>
                    l.listing_type === "destination" &&
                    l.moderation_status === "published",
                ).length,
              ],
              [
                "Business listings",
                s.listings.filter((l) => l.listing_type === "enterprise")
                  .length,
              ],
              ["Pending content", pending.length],
              ["Feedback reports", feedback.length],
            ].map(([label, n]) => (
              <div className="card" key={label}>
                <small>{label}</small>
                <strong>{n}</strong>
              </div>
            ))}
          </div>
          <h2>Recent audit activity</h2>
          {s.events
            .filter((e) => e.event_type === "audit")
            .slice(0, 20)
            .map((e) => (
              <div className="card report-card" key={e.id}>
                <Badge>AUDIT</Badge>
                <p>{JSON.stringify(e.payload)}</p>
                <small>{dateTime(e.created_at)}</small>
              </div>
            ))}
        </>
      )}
      {tab === "Content" && (
        <>
          <h2>Reported and pending content</h2>
          {!pending.length && <Empty title="Moderation queue is clear" />}
          {pending.map((p) => (
            <div className="card report-card" key={p.id}>
              <p>{p.body}</p>
              <small>
                {p.municipality} · {p.post_type}
              </small>
              {reports
                .filter((r) => r.post_id === p.id)
                .map((r) => (
                  <p key={r.id}>Report reason: {String(r.payload.reason)}</p>
                ))}
              <div className="row">
                <Button
                  size="sm"
                  onClick={() =>
                    void s.run(
                      () =>
                        updatePost(p.id, { moderation_status: "published" }),
                      "Content approved",
                    )
                  }
                >
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    void s.run(
                      () => updatePost(p.id, { moderation_status: "rejected" }),
                      "Content rejected",
                    )
                  }
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </>
      )}
      {tab === "Businesses" && (
        <>
          <h2>Listing, heritage and accreditation review</h2>
          {s.listings.map((l) => (
            <div className="card report-card" key={l.id}>
              <h3>
                <Link to={"/places/" + l.id}>{l.name} · Edit details →</Link>
              </h3>
              <p>{l.description}</p>
              <div className="row wrap">
                <Badge>{l.moderation_status}</Badge>
                <Badge>{l.accreditation_status}</Badge>
                <Badge>
                  {l.metadata.verified
                    ? "Source reviewed"
                    : "Source not reviewed"}
                </Badge>
              </div>
              {l.source_url && (
                <a
                  href={safeLink(l.source_url)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Source reference
                </a>
              )}
              <p>
                Submitted reference:{" "}
                {String(
                  (l.metadata as unknown as Record<string, unknown>)
                    .accreditation_reference ?? "None",
                )}
              </p>
              <label>
                Authoritative evidence URL (required for official accreditation)
                <input
                  type="url"
                  value={evidence[l.id] ?? ""}
                  onChange={(e) =>
                    setEvidence({ ...evidence, [l.id]: e.target.value })
                  }
                  placeholder="https://"
                />
              </label>
              <div className="row wrap">
                <Button
                  size="sm"
                  onClick={() =>
                    void s.run(
                      () =>
                        updateListing(l.id, { moderation_status: "published" }),
                      "Listing published",
                    )
                  }
                >
                  Publish
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void s.run(
                      () =>
                        updateListing(l.id, { moderation_status: "rejected" }),
                      "Listing rejected",
                    )
                  }
                >
                  Reject
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    void s.run(async () => {
                      if (!safeLink(evidence[l.id])?.startsWith("https://"))
                        throw new Error(
                          "Provide the source checked before verification",
                        );
                      await updateListing(l.id, {
                        source_url: evidence[l.id],
                        metadata: {
                          ...l.metadata,
                          verified: true,
                          source_label: "VERIFIED",
                          last_checked: new Date().toISOString(),
                          public_promotion: true,
                        },
                      });
                    }, "Source review recorded")
                  }
                >
                  Mark source reviewed & ready
                </Button>
                <select
                  aria-label={"Accreditation for " + l.name}
                  value={l.accreditation_status}
                  onChange={(e) =>
                    void s.run(async () => {
                      const value = e.target.value;
                      if (
                        value === "Official DOT accreditation verified" &&
                        !safeLink(evidence[l.id])?.startsWith("https://")
                      )
                        throw new Error(
                          "Authoritative DOT evidence URL required",
                        );
                      await updateListing(l.id, {
                        accreditation_status: value,
                        metadata: {
                          ...l.metadata,
                          accreditation_evidence_url: evidence[l.id] || null,
                        },
                      });
                    }, "Accreditation review recorded")
                  }
                >
                  {[
                    "Unverified",
                    "Documents submitted",
                    "Platform reviewed",
                    "Official DOT accreditation verified",
                  ].map((a) => (
                    <option key={a}>{a}</option>
                  ))}
                </select>
              </div>
              <label>
                Assign owner after verified claim
                <input
                  placeholder="Verified applicant UUID"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const value = e.currentTarget.value;
                      if (!/^[0-9a-f-]{36}$/i.test(value)) {
                        s.notify("Enter a valid user UUID");
                        return;
                      }
                      void s.run(
                        () => updateListing(l.id, { owner_id: value }),
                        "Owner assigned",
                      );
                    }
                  }}
                />
              </label>
            </div>
          ))}
        </>
      )}
      {tab === "Feedback" && (
        <>
          <div className="hub-filters">
            <label>
              Category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All</option>
                {[...Object.keys(topics), "Tourist experience"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All</option>
                {["Received", "Under Review", "Action Noted", "Closed"].map(
                  (t) => (
                    <option key={t}>{t}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              Municipality
              <select
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
              >
                <option value="">All</option>
                {municipalities.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
          </div>
          {feedback
            .filter(
              (p) =>
                (!category || p.category === category) &&
                (!status || p.feedback_status === status) &&
                (!municipality || p.municipality === municipality),
            )
            .map((p) => (
              <div className="card report-card" key={p.id}>
                <h3>
                  {p.category} · {p.municipality}
                </h3>
                <p>{p.body}</p>
                <small>
                  Private allegation · approximate sentiment {classify(p.body)}{" "}
                  · {dateTime(p.created_at)}
                </small>
                {p.media_urls.map((path) => (
                  <Evidence key={path} path={path} />
                ))}
                <label>
                  Resolution status
                  <select
                    value={p.feedback_status ?? "Received"}
                    onChange={(e) =>
                      void s.run(
                        () =>
                          updatePost(p.id, { feedback_status: e.target.value }),
                        "Feedback status updated; recipient notified",
                      )
                    }
                  >
                    {["Received", "Under Review", "Action Noted", "Closed"].map(
                      (t) => (
                        <option key={t}>{t}</option>
                      ),
                    )}
                  </select>
                </label>
              </div>
            ))}
        </>
      )}
      {tab === "Intelligence" && (
        <>
          <h2>Published review sentiment & destination mentions</h2>
          <div className="listing-grid">
            {s.listings
              .filter((l) => l.listing_type === "destination")
              .map((l) => {
                const summary = sentimentSummary(
                  s.posts.filter((p) => p.listing_id === l.id),
                );
                return (
                  <div key={l.id} className="card report-card">
                    <h3>{l.name}</h3>
                    <Badge>{summary.label}</Badge>
                    <p>
                      Published review sample: {summary.total}. Public community
                      mentions:{" "}
                      {
                        s.posts.filter(
                          (p) =>
                            p.listing_id === l.id &&
                            p.post_type === "social" &&
                            p.moderation_status === "published",
                        ).length
                      }
                      .
                    </p>
                    <small>
                      {Object.entries(summary.counts)
                        .map(([label, n]) => label + ": " + n)
                        .join(" · ")}
                    </small>
                  </div>
                );
              })}
          </div>
          <h2>Community feedback patterns</h2>
          <p>
            Private aggregate analytics. Counts reflect allegations and
            community sentiment, not verified outcomes.
          </p>
          <div className="card chart">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" fontSize={10} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#17897f" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {[
            ...municipalities,
            ...["Received", "Under Review", "Action Noted", "Closed"],
            ...["Positive", "Neutral", "Mixed", "Negative"],
          ].map((k) => (
            <p key={k}>
              {k}:{" "}
              {
                feedback.filter(
                  (p) =>
                    p.municipality === k ||
                    p.feedback_status === k ||
                    classify(p.body) === k,
                ).length
              }
            </p>
          ))}
          <h3>Repeated concerns (category counts, not verified findings)</h3>
          <p>
            {chartData
              .filter((c) => c.count > 1)
              .map((c) => c.name + ": " + c.count)
              .join(" · ") ||
              "No repeated category pattern in available reports."}
          </p>
          <Simulation scenario={scenario} setScenario={setScenario} />
        </>
      )}
      {tab === "Sources" && <SourceManager />}
      {tab === "Announcements" && (
        <form
          className="card form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const f = new FormData(form);
            void s.run(async () => {
              await s.publish({
                body: String(f.get("body")),
                municipality: String(
                  f.get("municipality"),
                ) as Post["municipality"],
                listing_id: null,
                post_type: "announcement",
              });
              form.reset();
            }, "Public announcement published");
          }}
        >
          <h2>Publish a public announcement</h2>
          <label>
            Message
            <textarea name="body" required maxLength={5000} />
          </label>
          <label>
            Municipality
            <select name="municipality">
              {municipalities.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <Button>Publish announcement</Button>
        </form>
      )}
    </div>
  );
}

type SourceRecord = {
  id: string;
  title: string;
  url: string;
  approved: boolean;
  last_checked: string | null;
};
function SourceManager() {
  const s = useStore();
  const [sources, setSources] = useState<SourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await backend()
      .from("information_sources")
      .select("*")
      .order("title");
    setError(error?.message ?? "");
    if (!error) setSources(data as SourceRecord[]);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <section>
      <form
        className="card form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const f = new FormData(form);
          void s.run(async () => {
            const { error } = await backend()
              .from("information_sources")
              .insert({
                title: f.get("title"),
                url: f.get("url"),
                approved: true,
                last_checked: new Date().toISOString(),
              });
            if (error) throw error;
            form.reset();
            await load();
          }, "Approved source saved");
        }}
      >
        <h2>Register a reviewed source</h2>
        <label>
          Title
          <input name="title" required maxLength={200} />
        </label>
        <label>
          HTTPS URL
          <input name="url" type="url" pattern="https://.*" required />
        </label>
        <p>
          Review source authority before approval. Registration does not
          independently verify every listing claim.
        </p>
        <Button>Save approved source</Button>
      </form>
      {error && (
        <p role="alert">
          {error}
          <button onClick={() => void load()}>Retry</button>
        </p>
      )}
      {loading ? (
        <Skeleton />
      ) : (
        sources.map((source) => (
          <div key={source.id} className="card report-card">
            <h3>{source.title}</h3>
            <a
              className="text-link"
              href={safeLink(source.url)}
              target="_blank"
              rel="noreferrer"
            >
              Source reference <ExternalLink size={12} />
            </a>
            <small>
              Reviewed{" "}
              {source.last_checked ? dateTime(source.last_checked) : "not yet"}{" "}
              · {source.approved ? "Approved" : "Withdrawn"}
            </small>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                void s.run(async () => {
                  const { error } = await backend()
                    .from("information_sources")
                    .update({
                      approved: !source.approved,
                      last_checked: new Date().toISOString(),
                    })
                    .eq("id", source.id);
                  if (error) throw error;
                  await load();
                }, "Source approval updated")
              }
            >
              {source.approved ? "Withdraw approval" : "Approve source"}
            </Button>
          </div>
        ))
      )}
    </section>
  );
}
