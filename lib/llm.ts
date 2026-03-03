import { inputSchema, outputSchema, type InputPayload, type OutputPayload } from "@/lib/schema";

function buildPrompt(input: InputPayload) {
  return `あなたはB2B SaaSのセールス戦略アシスタントです。必ず指定JSONスキーマに合うJSONのみを返してください。\n\n入力:\n${JSON.stringify(
    input,
    null,
    2
  )}\n\n出力ルール:\n- 日本語で作成\n- evidenceはraw_web_infoから短く引用\n- confidenceは0-100の整数\n- followup_email.bodyは200〜350字\n- JSON以外のテキストは禁止`;
}

function fallbackOutput(input: InputPayload): OutputPayload {
  const excerpt = input.raw_web_info.slice(0, 80);
  return {
    company_overview: `${input.company_name}は公開情報から事業拡大フェーズが示唆される企業。直近の情報発信量が多く、改善施策の実行余地がある。`,
    signals: [
      { type: "news", summary: "公開情報で事業活動が活発", evidence: excerpt },
      { type: "hiring", summary: "採用や体制強化の可能性", evidence: excerpt }
    ],
    hypotheses: [
      { pain: "営業・CSの運用負荷が高い", why_now: "情報発信が増え、対応件数が増加しやすい", confidence: 68 },
      { pain: "データ活用が部門ごとに分断", why_now: "組織拡大タイミングで統合ニーズが顕在化", confidence: 61 }
    ],
    approach_list: [
      {
        priority: "A",
        target_role: input.target_persona || "営業企画/事業責任者",
        message_angle: `${input.our_product.slice(0, 60)}を軸に、短期で成果が出る運用改善を提案`,
        opening_line: `${input.company_name}様の最近の取り組みを拝見し、業務拡大期に効く打ち手としてご連絡しました。`,
        questions: [
          "現在もっとも工数がかかっている業務はどこですか？",
          "成果指標はどの部門で追っていますか？",
          "3か月以内に改善したいテーマは何ですか？"
        ],
        next_action: "15分のオンライン壁打ち打診"
      }
    ],
    followup_email: {
      subject: `${input.company_name}様：直近の事業拡大に合わせた運用改善のご提案`,
      body: `${input.company_name}様\n\n突然のご連絡失礼します。公開情報を拝見し、取り組みが非常に加速されている印象を受けました。拡大フェーズでは、現場の運用負荷や部門横断の情報連携がボトルネックになりやすいため、${input.our_product.slice(
        0,
        90
      )}という観点で、短期間で実行可能な改善余地があると考えています。もし差し支えなければ、現状の優先課題を15分ほどで伺い、適用可否を率直にお伝えします。`.
        slice(0, 340)
        .padEnd(210, "。")
    },
    risks: ["公開情報の解釈違い", "部署・役職の推定誤り", "導入時期の前提ズレ"]
  };
}

async function callOpenAI(input: InputPayload): Promise<OutputPayload> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallbackOutput(input);
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: buildPrompt(input) }]
    })
  });

  if (!res.ok) {
    throw new Error(`LLM API failed: ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  const parsed = JSON.parse(content);
  return outputSchema.parse(parsed);
}

export async function generateOutput(rawInput: unknown): Promise<OutputPayload> {
  const input = inputSchema.parse(rawInput);

  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const output = await callOpenAI(input);
      return outputSchema.parse(output);
    } catch (error) {
      lastErr = error;
    }
  }

  throw lastErr instanceof Error ? lastErr : new Error("生成に失敗しました");
}
