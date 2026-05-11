/**
 * Sarah Chapter — Sheets + Drive Export
 *
 * Receives POSTs from the Cloudflare Worker (chapter-quiz-sync.js) after
 * each quiz/homework attempt is graded. Appends a row to the master tracker
 * Sheet AND generates a PDF report saved to a shared Drive folder.
 *
 * Deploy as: Web App, "Execute as: Me", "Who has access: Anyone".
 * Then paste the deployment URL into the Worker as APPS_SCRIPT_URL secret.
 *
 * One-time setup before deploying:
 *   1. Create a Google Sheet — paste its ID into SHEET_ID below.
 *      First row: leave blank; the script auto-adds headers on first POST.
 *   2. Create a Drive folder for PDF reports — paste its ID into FOLDER_ID.
 *   3. Generate a random string and paste it into SHARED_SECRET below
 *      AND into the Worker as APPS_SCRIPT_SECRET. This stops randos who
 *      stumble onto the web-app URL from poisoning the Sheet.
 */

// ========= CONFIGURE THESE =========
const SHEET_ID       = 'PASTE_GOOGLE_SHEET_ID_HERE';
const FOLDER_ID      = 'PASTE_DRIVE_FOLDER_ID_HERE';
const SHARED_SECRET  = 'PASTE_A_LONG_RANDOM_STRING_HERE';
// ===================================

const HEADERS = [
  'Logged At', 'Student', 'Chapter', 'Type', 'Attempt Date',
  'Auto Score', 'Auto Total', 'Percent', 'Open Count',
  'AI: Overall Summary', 'AI: Things to Revisit', 'AI: Ready to Advance',
  'Wrong Question IDs', 'PDF Report', 'Notion Row'
];

function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ error: 'invalid json' }, 400);
  }
  if (body.secret !== SHARED_SECRET) {
    return reply({ error: 'unauthorized' }, 401);
  }

  try {
    const pdfUrl = writePdfReport_(body);
    const sheetUrl = appendSheetRow_(body, pdfUrl);
    return reply({ ok: true, pdfUrl, sheetUrl });
  } catch (err) {
    return reply({ error: 'apps-script failed', detail: String(err) }, 500);
  }
}

// Lets you ping the deployment URL in a browser to confirm it's live.
function doGet() {
  return reply({ ok: true, message: 'Sarah quiz sync web app is alive.' });
}

// ----------------------------------------------------------------------
// Sheet: append one row per attempt
// ----------------------------------------------------------------------

function appendSheetRow_(p, pdfUrl) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getActiveSheet();

  // Auto-create headers on first write
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#f3f4f6');
    sheet.setFrozenRows(1);
  }

  const summary = p.aiSummary || {};
  sheet.appendRow([
    new Date(),                                        // Logged At
    p.student || '',                                   // Student
    p.chapter || '',                                   // Chapter
    p.type || '',                                      // Type
    p.date || '',                                      // Attempt Date
    p.autoScore != null ? p.autoScore : '',            // Auto Score
    p.autoTotal != null ? p.autoTotal : '',            // Auto Total
    p.percent != null ? p.percent : '',                // Percent
    p.openCount != null ? p.openCount : '',            // Open Count
    summary.overall_summary || '',                     // AI: Overall Summary
    (summary.three_things_to_revisit || []).join(' | '), // AI: Things to Revisit
    summary.ready_to_advance === true ? 'YES'
      : summary.ready_to_advance === false ? 'no' : '',
    p.wrongQuestionIds || '',                          // Wrong Question IDs
    pdfUrl || '',                                      // PDF Report
    p.notionUrl || ''                                  // Notion Row
  ]);

  return ss.getUrl();
}

// ----------------------------------------------------------------------
// PDF report: render an HTML template and save to Drive
// ----------------------------------------------------------------------

function writePdfReport_(p) {
  const filename = `${p.chapter || 'unknown'}_${p.date || 'undated'}_${p.type || 'attempt'}_${p.student || 'student'}.pdf`
    .replace(/[\\\/:*?"<>|]/g, '-');
  const html = buildReportHtml_(p);
  const pdfBlob = Utilities.newBlob(html, 'text/html', filename).getAs('application/pdf').setName(filename);
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const file = folder.createFile(pdfBlob);
  return file.getUrl();
}

function buildReportHtml_(p) {
  const answers = Array.isArray(p.answers) ? p.answers : [];
  const answersHtml = answers.map((a, i) => questionBlock_(a, i)).join('');
  const summary = p.aiSummary || {};
  const summaryHtml = summary.overall_summary ? `
    <div class="summary">
      <h2>Overall</h2>
      <p>${esc_(summary.overall_summary)}</p>
      ${summary.three_things_to_revisit && summary.three_things_to_revisit.length ? `
        <p><strong>Three things to revisit:</strong></p>
        <ol>${summary.three_things_to_revisit.map(t => `<li>${esc_(t)}</li>`).join('')}</ol>` : ''}
      ${summary.ready_to_advance !== undefined ? `
        <p class="advance"><strong>Ready to advance:</strong> ${summary.ready_to_advance ? 'Yes ✓' : 'Not yet'}</p>` : ''}
    </div>` : '';

  const scoreLine = (p.autoTotal != null && p.autoTotal > 0)
    ? `${p.autoScore || 0} / ${p.autoTotal} (${p.percent || 0}%)`
    : 'No auto-graded questions';

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: -apple-system, Arial, sans-serif; padding: 32px; color: #1f2937; line-height: 1.5; }
  h1 { color: #1e3a8a; margin: 0 0 4px; }
  h2 { color: #1e3a8a; border-bottom: 2px solid #dbeafe; padding-bottom: 4px; }
  .meta { color: #64748b; margin-bottom: 18px; font-size: 13px; }
  .score-block { padding: 14px 18px; background: #f0fdf4; border-left: 5px solid #16a34a; border-radius: 6px; margin: 14px 0; }
  .summary { padding: 14px 18px; background: #eff6ff; border-left: 5px solid #2563eb; border-radius: 6px; margin: 18px 0; }
  .summary .advance { margin-bottom: 0; }
  .q { margin: 14px 0; padding: 12px 14px; border: 1px solid #e5e7eb; border-radius: 8px; page-break-inside: avoid; }
  .q .qtext { font-weight: 700; color: #111827; }
  .q .answer { margin: 6px 0; color: #475569; }
  .q .answer .blank { color: #94a3b8; font-style: italic; }
  .q .status { font-size: 12px; font-weight: 600; }
  .q .status.correct { color: #15803d; }
  .q .status.incorrect { color: #b91c1c; }
  .q .status.open { color: #6d28d9; }
  .q .status.unanswered { color: #94a3b8; }
  .q .ai { margin-top: 10px; padding: 10px; background: #faf5ff; border-left: 3px solid #8b5cf6; border-radius: 4px; font-size: 13px; }
  .q .ai .stars { color: #f59e0b; font-size: 16px; }
  .q .ai .label { font-weight: 700; color: #4c1d95; }
  .q .ai .misconception { color: #b91c1c; font-weight: 700; }
  .q .ai .kid { margin-top: 6px; padding: 8px; background: #f0fdf4; border-radius: 4px; color: #14532d; }
</style></head><body>
  <h1>${esc_(p.chapter || '')} · ${esc_(p.type || 'attempt')}</h1>
  <div class="meta">Student: <strong>${esc_(p.student || '')}</strong> · Date: ${esc_(p.date || '')}</div>
  <div class="score-block">
    <div><strong>Auto-graded:</strong> ${scoreLine}</div>
    ${p.openCount > 0 ? `<div><strong>Open-ended questions:</strong> ${p.openCount}</div>` : ''}
    ${p.wrongQuestionIds ? `<div><strong>Wrong on MCQ:</strong> ${esc_(String(p.wrongQuestionIds))}</div>` : ''}
  </div>
  ${summaryHtml}
  <h2>Questions and answers</h2>
  ${answersHtml || '<p>No question data.</p>'}
</body></html>`;
}

function questionBlock_(a, i) {
  const isOpen = a.kind === 'open' || a.correct === null;
  const unanswered = a.unanswered === true;
  const status = unanswered
      ? '<span class="status unanswered">⊘ Unanswered</span>'
    : isOpen
      ? '<span class="status open">○ Open-ended</span>'
    : a.correct
      ? '<span class="status correct">✓ Correct</span>'
      : '<span class="status incorrect">✗ Incorrect</span>';
  const answerText = unanswered
      ? '<span class="blank">(blank)</span>'
    : isOpen
      ? esc_(a.a || '')
      : `Selected option ${a.selected != null ? a.selected : '?'}`;

  let aiBlock = '';
  if (a.ai) {
    const score = parseInt(a.ai.score, 10) || 0;
    const stars = '★'.repeat(score) + '☆'.repeat(Math.max(0, 3 - score));
    aiBlock = `
      <div class="ai">
        <div><span class="label">Feedback:</span> <span class="stars">${stars}</span></div>
        ${a.ai.strengths ? `<div><span class="label">Strengths:</span> ${esc_(a.ai.strengths)}</div>` : ''}
        ${a.ai.gaps ? `<div><span class="label">Gaps:</span> ${esc_(a.ai.gaps)}</div>` : ''}
        ${a.ai.misconception_flag ? `<div class="misconception">Misconception: ${esc_(a.ai.misconception_flag)}</div>` : ''}
        ${a.ai.comment_for_sarah ? `<div class="kid">For Sarah: ${esc_(a.ai.comment_for_sarah)}</div>` : ''}
      </div>`;
  }

  return `
    <div class="q">
      <div class="qtext">Q${i + 1}. ${esc_(a.q || '')}</div>
      <div class="answer">${answerText}</div>
      <div>${status}</div>
      ${aiBlock}
    </div>`;
}

function esc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function reply(obj, status) {
  // Apps Script web apps can't actually set HTTP status; the status arg here
  // is informational. The client should check the `error` field on the body.
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
