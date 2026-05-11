---
type: tool
status: active
last_updated: 2026-05-11
sources: []
---

# Sheets + Drive Export — deploy guide for Shell

How to wire chapter quiz/homework submissions into a Google Sheet (one row per attempt) plus a Drive folder of PDF reports (one PDF per attempt) so you can share the folder with Sarah's teacher.

**You are deploying:**
1. A Google Sheet to hold rows
2. A Google Drive folder to hold PDF reports
3. A Google Apps Script web app that does the writing (Sheet append + PDF generation)
4. An update to the Cloudflare Worker so it POSTs each completed attempt to the Apps Script

The Apps Script source already lives at [`/apps-script/Code.gs`](../../apps-script/Code.gs). The Worker change already lives in [`/worker/chapter-quiz-sync.js`](../../worker/chapter-quiz-sync.js).

---

## Step 1 — Create the Sheet and Drive folder

In Google Drive (signed in as the account you want to *own* the data):

1. Create a new Google Sheet. Call it **Sarah's Chapter Attempts** (or whatever). Leave it empty — the script adds the header row on the first POST.
2. Copy its **Sheet ID** from the URL — the long string between `/d/` and `/edit`. You'll paste this into the Apps Script in step 3.
3. Create a new Drive folder. Call it **Sarah's Quiz Reports**. This is where the PDFs land.
4. Copy its **Folder ID** from the URL — the long string after `/folders/`.
5. Right-click the folder → Share → add your daughter's teacher as a viewer. They'll see PDFs land here as Sarah submits work.

---

## Step 2 — Pick a shared secret

Generate a random string (any password manager will do, or just mash the keyboard). 32+ characters. This stops randos who stumble onto your web-app URL from poisoning the Sheet.

Save it somewhere — you'll paste it into two places: the Apps Script and the Worker.

---

## Step 3 — Deploy the Apps Script

1. Go to [script.google.com](https://script.google.com) → New project. Name it **Sarah Chapter Sync**.
2. Delete the boilerplate `function myFunction() {}`.
3. Open [`/apps-script/Code.gs`](../../apps-script/Code.gs) from this repo, copy the entire contents, and paste into the Apps Script editor.
4. At the top, fill in the three constants:
   ```js
   const SHEET_ID       = 'paste sheet id from step 1';
   const FOLDER_ID      = 'paste folder id from step 1';
   const SHARED_SECRET  = 'paste the random string from step 2';
   ```
5. Save (Cmd-S).
6. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Description: `Sarah chapter sync v1`
   - Execute as: **Me** (your Google account)
   - Who has access: **Anyone**
7. Click **Deploy**. The first time you'll have to authorize — click **Authorize access**, pick your account, click **Advanced → Go to Sarah Chapter Sync (unsafe)**, then **Allow**. (Google calls it "unsafe" because it's your personal script — that's fine.)
8. Copy the **Web app URL** at the end. It looks like `https://script.google.com/macros/s/AKfyc.../exec`. You'll paste this into the Worker in the next step.

Quick sanity check: paste the URL into a new browser tab. You should see `{"ok":true,"message":"Sarah quiz sync web app is alive."}`. If you see a Google sign-in page or a permission error, the deployment isn't public yet — re-do step 6 and confirm "Who has access" is set to "Anyone".

---

## Step 4 — Configure the Worker

In your existing `Sarah Homeschooling/worker` directory:

```bash
cd path/to/Sarah\ Homeschooling/worker

# Apps Script web app URL from step 3
wrangler secret put APPS_SCRIPT_URL
# (paste the https://script.google.com/macros/s/.../exec URL when prompted)

# Same shared secret you put in the Apps Script
wrangler secret put APPS_SCRIPT_SECRET
# (paste the random string from step 2)
```

Then redeploy:

```bash
wrangler deploy
```

If you forget either secret, the Worker silently skips the Sheets/Drive forwarder — the Notion path keeps working as before. So you can deploy the Worker change at any time and only have it activate once you've added both secrets.

---

## Step 5 — Smoke test

Pick chapter A-3 (the only one wired through the new homework flow so far):

1. Open `chapter-a3-air-substance.html` in your browser.
2. Take a few questions on the quiz. Submit.
3. Wait ~15–30 seconds (AI eval needs to finish before the Apps Script gets called, so the PDF includes the feedback).
4. Open the Sheet. You should see a new row with the score, AI summary, and a PDF link.
5. Click the PDF link. A nicely-formatted report opens, showing each question with Sarah's answer and AI feedback.
6. Open the Drive folder. The same PDF should be there.

Then do the same for the **Homework** tab — fill in a couple of answers, submit. Within 15–30s a new row should appear with Type: `homework`, plus a corresponding PDF in the folder.

---

## What happens for chapters other than A-3

Quiz submissions in every chapter already go through the Worker, so **quizzes from any chapter** will land in the Sheet + Drive folder once the Worker is redeployed. No per-chapter work needed.

**Homework** is different — the current homework code in chapters other than A-3 still uses the legacy `webhookUrl`/mailto fallback, which doesn't go through the Worker. To get homework from chapter B-3 (or any other chapter) into the Sheet, the chapter's `submitHomework()` function needs the same edit that A-3 just got — see `chapter-a3-air-substance.html` around the line that calls `ChapterSync.submitFinal(hwPayload)`. I can do this for the other chapters when you're ready; it's a mechanical change.

---

## Sharing with the teacher

Once everything works:
- Share the **Drive folder** (Step 1, item 5) with the teacher's Google email. Pick "Viewer" — they can read but not edit.
- Optionally share the **Sheet** too if the teacher wants to scan trends. Same permissions.

The teacher's view: a folder of PDFs they can open like graded papers, sorted by date. Each PDF has Sarah's answers, what was right and wrong, AI feedback on open-ended answers, and an overall summary with "ready to advance" yes/no.

---

## Troubleshooting

**Sheet stays empty after I submit.**
1. Open the Notion DB and check if the row landed there. If yes, the Worker is fine — the problem is between Worker and Apps Script. Check Wrangler logs (`wrangler tail`) for `Apps Script POST failed: ...`.
2. If the row is in Notion but no Sheet row, the most common cause is the wrong `APPS_SCRIPT_URL` (re-check it ends with `/exec`) or a mismatched `APPS_SCRIPT_SECRET`.

**Apps Script returns `unauthorized`.**
Your Worker's `APPS_SCRIPT_SECRET` doesn't match the `SHARED_SECRET` in the script. Re-set both to the same string.

**PDF link in the Sheet opens "Access Denied".**
The PDF inherits permissions from the Drive folder. If the teacher can't open a PDF, share the folder with them (or with "anyone with the link"). PDFs created inside a shared folder pick up that sharing automatically.

**Quiz appears immediately but no AI feedback in the PDF.**
The Worker waits for AI eval to finish before POSTing to Apps Script. If you see a PDF land without AI feedback, the eval probably errored — check the Notion row's `AI Status`. If it's `error`, the PDF will still be generated but the feedback block will be empty.

**Daily AI eval cap hit.**
Same as before — see `chapter-quiz-sync-deploy.md`. The PDF is still generated; just without the AI summary.

---

## See also

- [`chapter-quiz-sync-deploy.md`](chapter-quiz-sync-deploy.md) — the prior Worker + Notion deploy this builds on
- [`chapter-quiz-sync-schema.md`](chapter-quiz-sync-schema.md) — Notion DB schema (unchanged by this work)
- [`/apps-script/Code.gs`](../../apps-script/Code.gs) — the web app source you'll paste in Step 3
- [`/worker/chapter-quiz-sync.js`](../../worker/chapter-quiz-sync.js) — the Worker source, updated with the Apps Script forwarder
