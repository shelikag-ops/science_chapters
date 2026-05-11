/**
 * Chapter Quiz Sync — endpoints for the existing anthropic-proxy Worker.
 *
 * Routes added by this module:
 *   GET  /chapter-quiz?student=&chapter=         → list past attempts from Notion
 *   POST /chapter-quiz                            → create row + async AI eval (Claude Haiku 4.5)
 *   GET  /chapter-quiz/inprogress?student=&chapter=  → KV read
 *   PUT  /chapter-quiz/inprogress                 → KV write (debounced autosave)
 *   DELETE /chapter-quiz/inprogress?student=&chapter= → KV clear (called on quiz finish)
 *
 * Bindings expected on the Worker:
 *   env.KV                       — Cloudflare KV namespace (already configured)
 *   env.NOTION_TOKEN             — Notion integration secret
 *   env.ANTHROPIC_API_KEY        — Anthropic API key for AI eval
 *   env.CHAPTER_QUIZ_DB_ID       — Notion database ID for "Sarah Chapter Quiz Attempts"
 *
 * To install in the existing Worker: import this module and route requests
 * starting with /chapter-quiz to handleChapterQuiz(request, env, ctx).
 */

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-haiku-4-5';

// Soft daily cap so a runaway loop can't burn money.
const DAILY_EVAL_CAP = 200;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-notion-key',
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function handleChapterQuiz(request, env, ctx) {
  const url = new URL(request.url);

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS });
  }

  // --- in-progress (KV) routes ---
  if (url.pathname === '/chapter-quiz/inprogress') {
    return handleInProgress(request, env, url);
  }

  // --- main attempts route ---
  if (url.pathname === '/chapter-quiz') {
    if (request.method === 'GET') return listAttempts(env, url);
    if (request.method === 'POST') return createAttempt(request, env, ctx);
  }

  return json({ error: 'not found' }, 404);
}

// ---------------------------------------------------------------------------
// KV: in-progress slot
// ---------------------------------------------------------------------------

async function handleInProgress(request, env, url) {
  const student = url.searchParams.get('student');
  const chapter = url.searchParams.get('chapter');
  if (!student || !chapter) return json({ error: 'missing student/chapter' }, 400);
  const key = `chapter-inprogress:${student}:${chapter}`;

  if (request.method === 'GET') {
    const value = await env.KV.get(key, 'json');
    return value ? json(value) : json({ empty: true }, 404);
  }

  if (request.method === 'PUT') {
    const body = await request.json();
    // 24-hour TTL: if she abandons mid-quiz we don't keep stale state forever.
    await env.KV.put(key, JSON.stringify(body), { expirationTtl: 86400 });
    return json({ ok: true });
  }

  if (request.method === 'DELETE') {
    await env.KV.delete(key);
    return json({ ok: true });
  }

  return json({ error: 'method not allowed' }, 405);
}

// ---------------------------------------------------------------------------
// Notion: list past attempts
// ---------------------------------------------------------------------------

async function listAttempts(env, url) {
  const student = url.searchParams.get('student');
  const chapter = url.searchParams.get('chapter');
  if (!student || !chapter) return json({ error: 'missing student/chapter' }, 400);

  const res = await fetch(`${NOTION_API}/databases/${env.CHAPTER_QUIZ_DB_ID}/query`, {
    method: 'POST',
    headers: notionHeaders(env),
    body: JSON.stringify({
      filter: {
        and: [
          { property: 'Student', rich_text: { equals: student } },
          { property: 'Chapter', rich_text: { equals: chapter } },
        ],
      },
      sorts: [{ property: 'Date', direction: 'descending' }],
      page_size: 50,
    }),
  });

  if (!res.ok) return json({ error: 'notion query failed', detail: await res.text() }, 502);
  const data = await res.json();

  const attempts = data.results.map((page) => ({
    id: page.id,
    attempt: textOf(page.properties.Attempt?.title),
    student: textOf(page.properties.Student?.rich_text),
    chapter: textOf(page.properties.Chapter?.rich_text),
    type: page.properties.Type?.select?.name || null,
    date: page.properties.Date?.date?.start || null,
    autoScore: page.properties['Auto Score']?.number ?? null,
    autoTotal: page.properties['Auto Total']?.number ?? null,
    openCount: page.properties['Open Count']?.number ?? null,
    percent: page.properties.Percent?.number ?? null,
    answersJSON: textOf(page.properties['Answers JSON']?.rich_text),
    aiEvaluation: textOf(page.properties['AI Evaluation']?.rich_text),
    aiStatus: page.properties['AI Status']?.select?.name || 'pending',
    wrongQuestionIds: textOf(page.properties['Wrong Question IDs']?.rich_text),
    syncedAt: page.created_time,
  }));

  return json({ attempts });
}

function textOf(richTextArr) {
  if (!Array.isArray(richTextArr)) return '';
  return richTextArr.map((t) => t.plain_text || '').join('');
}

// ---------------------------------------------------------------------------
// Notion: create attempt + kick off async AI eval
// ---------------------------------------------------------------------------

async function createAttempt(request, env, ctx) {
  const body = await request.json();
  const { student, chapter, type, payload } = body;
  if (!student || !chapter || !type || !payload) {
    return json({ error: 'missing required fields' }, 400);
  }

  const answers = Array.isArray(payload.answers) ? payload.answers : [];
  const autoAnswers = answers.filter((a) => typeof a.correct === 'boolean');
  const autoCorrect = autoAnswers.filter((a) => a.correct).length;
  const autoTotal = autoAnswers.length;
  const openCount = answers.filter((a) => a.kind === 'open' || a.correct === null).length;
  const percent = autoTotal ? Math.round((autoCorrect / autoTotal) * 100) : 0;
  const wrongIds = autoAnswers
    .filter((a) => a.correct === false)
    .map((a) => a.qid)
    .join(',');

  const isoDate = (payload.ts || new Date().toISOString()).slice(0, 10);
  const attemptTitle = `${chapter} · ${isoDate} · ${type}`;

  const properties = {
    Attempt: { title: [{ text: { content: attemptTitle } }] },
    Student: { rich_text: [{ text: { content: student } }] },
    Chapter: { rich_text: [{ text: { content: chapter } }] },
    Type: { select: { name: type } },
    Date: { date: { start: isoDate } },
    'Auto Score': { number: autoCorrect },
    'Auto Total': { number: autoTotal },
    'Open Count': { number: openCount },
    Percent: { number: percent },
    'Answers JSON': chunkRichText(JSON.stringify(answers)),
    'AI Status': { select: { name: openCount > 0 ? 'pending' : 'evaluated' } },
    'Wrong Question IDs': { rich_text: [{ text: { content: wrongIds } }] },
  };

  // No open questions → no eval needed; skip AI call.
  if (openCount === 0) {
    properties['AI Evaluation'] = {
      rich_text: [{ text: { content: 'All questions auto-graded. No open answers to evaluate.' } }],
    };
  }

  const createRes = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: notionHeaders(env),
    body: JSON.stringify({
      parent: { database_id: env.CHAPTER_QUIZ_DB_ID },
      properties,
    }),
  });

  if (!createRes.ok) {
    return json({ error: 'notion create failed', detail: await createRes.text() }, 502);
  }
  const created = await createRes.json();

  // If there are open answers, evaluate asynchronously. ctx.waitUntil keeps the
  // Worker alive for the eval+PATCH cycle without making the chapter app wait.
  // The Apps Script POST happens at the END of evaluateAttempt so the PDF has
  // the AI feedback baked in.
  if (openCount > 0) {
    ctx.waitUntil(evaluateAttempt(created.id, { student, chapter, type, answers, payload }, env));
  } else {
    // No AI eval needed — forward to Apps Script immediately (best-effort).
    ctx.waitUntil(
      postToAppsScript(
        {
          attemptId: created.id,
          student,
          chapter,
          type,
          date: isoDate,
          autoScore: autoCorrect,
          autoTotal,
          openCount,
          percent,
          wrongQuestionIds: wrongIds,
          answers,
          aiSummary: null,
          notionUrl: created.url || `https://www.notion.so/${created.id.replace(/-/g, '')}`,
        },
        env
      )
    );
  }

  // Clear the in-progress slot — submission means she's done.
  ctx.waitUntil(env.KV.delete(`chapter-inprogress:${student}:${chapter}`));

  return json({ id: created.id, autoCorrect, autoTotal, openCount, percent });
}

// Notion rich_text fields cap at 2000 chars per chunk. Split long JSON into pieces.
function chunkRichText(str, chunkSize = 1900) {
  const chunks = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push({ text: { content: str.slice(i, i + chunkSize) } });
  }
  // Notion allows up to 100 chunks per rich_text field. If the JSON is bigger
  // than that (190KB+) we have a real problem, but for chapter quizzes we won't.
  return { rich_text: chunks.length ? chunks : [{ text: { content: '' } }] };
}

// ---------------------------------------------------------------------------
// AI eval — Claude Haiku 4.5 grades open answers through 8-year-old lens
// ---------------------------------------------------------------------------

async function evaluateAttempt(pageId, attempt, env) {
  // Daily cap check
  const today = new Date().toISOString().slice(0, 10);
  const capKey = `eval-cap:${today}`;
  const used = parseInt((await env.KV.get(capKey)) || '0', 10);
  if (used >= DAILY_EVAL_CAP) {
    await patchEvalError(pageId, env, 'Daily AI evaluation cap reached. Try again tomorrow.');
    return;
  }
  await env.KV.put(capKey, String(used + 1), { expirationTtl: 172800 });

  const openAnswers = attempt.answers
    .map((a, idx) => ({ ...a, _idx: idx }))
    .filter((a) => a.kind === 'open' || a.correct === null);

  const prompt = buildPrompt(attempt, openAnswers);

  let evalResult;
  try {
    const res = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) {
      await patchEvalError(pageId, env, `Anthropic ${res.status}: ${await res.text()}`);
      return;
    }
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    evalResult = parseEvalResponse(text);
  } catch (err) {
    await patchEvalError(pageId, env, `eval threw: ${err.message}`);
    return;
  }

  // Merge per-question feedback into Answers JSON
  const enrichedAnswers = attempt.answers.map((a, idx) => {
    if (a.kind !== 'open' && a.correct !== null) return { ...a, ai: null };
    const perQ = evalResult.perQuestion?.find((p) => p.qid === a.qid || p.qid === idx);
    return { ...a, ai: perQ || null };
  });

  await fetch(`${NOTION_API}/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders(env),
    body: JSON.stringify({
      properties: {
        'Answers JSON': chunkRichText(JSON.stringify(enrichedAnswers)),
        'AI Evaluation': chunkRichText(JSON.stringify(evalResult.summary || {})),
        'AI Status': { select: { name: 'evaluated' } },
      },
    }),
  });
}

async function patchEvalError(pageId, env, message) {
  await fetch(`${NOTION_API}/pages/${pageId}`, {
    method: 'PATCH',
    headers: notionHeaders(env),
    body: JSON.stringify({
      properties: {
        'AI Status': { select: { name: 'error' } },
        'AI Evaluation': { rich_text: [{ text: { content: message.slice(0, 1900) } }] },
      },
    }),
  }).catch(() => {});
}

function buildPrompt(attempt, openAnswers) {
  return `You are evaluating answers from Sarah, an 8-year-old US 3rd-grader homeschooler preparing for the 2027 National Science Bee. The chapter is ${attempt.chapter}. For each open-ended answer below, rate against age-appropriate expectations.

Score scale (be encouraging but truthful — Shell, the parent, uses this to decide whether to re-teach):
- 0 = not attempted or off-topic
- 1 = partial mental model
- 2 = correct for grade
- 3 = above grade level

Do NOT compare her to high-school answers. Use simple, kind language for the comment_for_sarah field — she will read it.

Open answers:
${openAnswers.map((a) => `qid=${a.qid}\nQ: ${a.q}\nA: ${a.a || '(blank)'}\n`).join('\n---\n')}

Return a single JSON object exactly matching this shape, no prose around it:
{
  "perQuestion": [
    {
      "qid": <number>,
      "score": 0|1|2|3,
      "strengths": "<teacher-voice, what she got right>",
      "gaps": "<teacher-voice, what's missing or wrong>",
      "misconception_flag": "<specific 3rd-grade misconception or null>",
      "comment_for_sarah": "<kid-voice, encouraging, uses simple words>"
    }
  ],
  "summary": {
    "overall_summary": "<one paragraph for the parent>",
    "three_things_to_revisit": ["<topic1>", "<topic2>", "<topic3>"],
    "ready_to_advance": true|false
  }
}`;
}

function parseEvalResponse(text) {
  // Defensive: model may wrap in code fences or add prose. Find the first { and last }.
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1) {
    return { perQuestion: [], summary: { overall_summary: 'Could not parse AI response.', three_things_to_revisit: [], ready_to_advance: false } };
  }
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return { perQuestion: [], summary: { overall_summary: 'AI response was not valid JSON.', three_things_to_revisit: [], ready_to_advance: false } };
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function notionHeaders(env) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${env.NOTION_TOKEN}`,
    'Notion-Version': NOTION_VERSION,
  };
}
