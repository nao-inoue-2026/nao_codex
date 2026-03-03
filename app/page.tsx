"use client";

import { useEffect, useMemo, useState } from "react";
import type { HistoryRecord, InputPayload, OutputPayload } from "@/lib/schema";

const initialInput: InputPayload = {
  company_name: "",
  company_url: "",
  raw_web_info: "",
  our_product: "",
  target_persona: "",
  stage: "cold"
};

function Field({
  label,
  required,
  value,
  onChange,
  multiline = false,
  placeholder
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block space-y-1">
      <div className="text-sm font-medium text-slate-700">
        {label} {required && <span className="text-rose-500">*</span>}
      </div>
      {multiline ? (
        <textarea
          className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-sky-500 focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="w-full rounded-lg border border-slate-300 p-3 text-sm focus:border-sky-500 focus:outline-none"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </label>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="rounded-md border border-slate-300 px-2 py-1 text-xs hover:bg-slate-100"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      type="button"
    >
      {copied ? "コピー済み" : "コピー"}
    </button>
  );
}

export default function HomePage() {
  const [form, setForm] = useState<InputPayload>(initialInput);
  const [output, setOutput] = useState<OutputPayload | null>(null);
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [selected, setSelected] = useState<HistoryRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState("");

  async function loadHistory() {
    const res = await fetch("/api/history");
    const data = await res.json();
    if (data.ok) {
      setRecords(data.records);
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => r.input.company_name.toLowerCase().includes(query.toLowerCase()));
  }, [records, query]);

  async function onGenerate() {
    setLoading(true);
    setError("");
    setSelected(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "生成に失敗しました");
      setOutput(data.output);
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成中にエラー");
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    if (!output) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: form, output })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "保存に失敗しました");
      await loadHistory();
      setSelected(data.record);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存中にエラー");
    } finally {
      setSaving(false);
    }
  }

  const view = selected ? selected.output : output;

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-4 p-4 lg:grid-cols-[380px_1fr]">
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h1 className="text-lg font-semibold">アプローチリスト作成MVP</h1>
        <p className="mt-1 text-xs text-slate-500">入力 → 生成 → 保存 → 履歴参照を1画面で実行</p>
        <div className="mt-4 space-y-3">
          <Field label="company_name" required value={form.company_name} onChange={(v) => setForm({ ...form, company_name: v })} />
          <Field label="company_url" value={form.company_url || ""} onChange={(v) => setForm({ ...form, company_url: v })} />
          <Field
            label="raw_web_info"
            required
            multiline
            value={form.raw_web_info}
            onChange={(v) => setForm({ ...form, raw_web_info: v })}
            placeholder="ニュース、採用、IR、導入事例などを貼り付け"
          />
          <Field
            label="our_product"
            required
            multiline
            value={form.our_product}
            onChange={(v) => setForm({ ...form, our_product: v })}
            placeholder="誰向け/何を解決/強み"
          />
          <Field label="target_persona" value={form.target_persona || ""} onChange={(v) => setForm({ ...form, target_persona: v })} />
          <Field label="stage" value={form.stage || ""} onChange={(v) => setForm({ ...form, stage: v })} />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
            onClick={onGenerate}
            disabled={loading}
            type="button"
          >
            {loading ? "生成中..." : "生成"}
          </button>
          <button
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            onClick={onSave}
            disabled={!output || saving}
            type="button"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
        {error && <div className="mt-3 rounded-md bg-rose-50 p-2 text-sm text-rose-700">{error}</div>}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-semibold">生成結果</h2>
          {!view && <p className="text-sm text-slate-500">まだ生成結果がありません。</p>}
          {view && (
            <div className="space-y-3 text-sm">
              <article className="rounded-lg border border-slate-200 p-3">
                <h3 className="font-semibold">Company Overview</h3>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{view.company_overview}</p>
              </article>

              <article className="rounded-lg border border-slate-200 p-3">
                <h3 className="font-semibold">Signals</h3>
                <ul className="mt-2 space-y-2">
                  {view.signals.map((s, i) => (
                    <li key={i} className="rounded bg-slate-50 p-2">
                      <div className="text-xs text-slate-500">{s.type}</div>
                      <div>{s.summary}</div>
                      <div className="text-xs text-slate-600">「{s.evidence}」</div>
                    </li>
                  ))}
                </ul>
              </article>

              <article className="rounded-lg border border-slate-200 p-3">
                <h3 className="font-semibold">Approach List</h3>
                <div className="mt-2 space-y-2">
                  {view.approach_list.map((a, i) => (
                    <div key={i} className="rounded bg-slate-50 p-2">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          [{a.priority}] {a.target_role}
                        </div>
                        <CopyButton text={a.opening_line} />
                      </div>
                      <p className="mt-1">{a.message_angle}</p>
                      <p className="text-slate-700">{a.opening_line}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <ul className="list-disc pl-5">
                          {a.questions.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                        <CopyButton text={a.questions.join("\n")} />
                      </div>
                      <div className="text-xs text-slate-500">next: {a.next_action}</div>
                    </div>
                  ))}
                </div>
              </article>

              <article className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Follow-up Email</h3>
                  <CopyButton text={`件名: ${view.followup_email.subject}\n\n${view.followup_email.body}`} />
                </div>
                <div className="mt-1 text-xs text-slate-500">{view.followup_email.subject}</div>
                <p className="mt-1 whitespace-pre-wrap">{view.followup_email.body}</p>
              </article>
            </div>
          )}
        </div>

        <aside className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="text-base font-semibold">履歴</h2>
          <input
            className="mt-2 w-full rounded-lg border border-slate-300 p-2 text-sm"
            placeholder="company_nameで検索"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <ul className="mt-3 space-y-2">
            {filtered.map((record) => (
              <li key={record.id}>
                <button
                  className="w-full rounded-lg border border-slate-200 p-2 text-left hover:bg-slate-50"
                  onClick={() => setSelected(record)}
                  type="button"
                >
                  <div className="font-medium">{record.input.company_name}</div>
                  <div className="text-xs text-slate-500">{new Date(record.created_at).toLocaleString()}</div>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
