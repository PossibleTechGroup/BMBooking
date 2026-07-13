const express = require('express');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');

const router = express.Router();

// The markdown files are kept in backend/legal/ so they are always
// inside the Docker volume mount (./backend → /usr/src/app).
const LEGAL_DIR = path.join(__dirname, '../../legal');

/** Wrap rendered markdown in a responsive, self-contained HTML page. */
function renderPage(title, markdownContent) {
  const body = marked.parse(markdownContent);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — BM Booking</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                   'Helvetica Neue', Arial, sans-serif;
      background: #f5f5f5;
      color: #1a1a1a;
      line-height: 1.7;
      -webkit-font-smoothing: antialiased;
    }

    header {
      background: #1a1a1a;
      color: #fff;
      padding: 16px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    header .brand {
      font-size: 1.1rem;
      font-weight: 700;
      letter-spacing: -0.3px;
    }
    header .sep { opacity: 0.35; }
    header .doc-title { opacity: 0.8; font-size: 0.95rem; }

    main {
      max-width: 780px;
      margin: 32px auto;
      padding: 0 16px 64px;
    }

    .card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05);
      padding: 40px 48px;
    }

    /* ── typography ── */
    h1 {
      font-size: 1.6rem;
      font-weight: 700;
      margin-bottom: 6px;
      line-height: 1.25;
    }
    h2 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-top: 2.2em;
      margin-bottom: 0.6em;
      padding-bottom: 0.4em;
      border-bottom: 1px solid #eaecf0;
      color: #1a1a1a;
    }
    h3 {
      font-size: 0.95rem;
      font-weight: 600;
      margin-top: 1.4em;
      margin-bottom: 0.4em;
      color: #344054;
    }
    p {
      margin-bottom: 0.85em;
      color: #475467;
      font-size: 0.9375rem;
    }
    strong { color: #1a1a1a; }

    ul, ol {
      margin: 0.5em 0 1em 1.4em;
      color: #475467;
      font-size: 0.9375rem;
    }
    li { margin-bottom: 0.35em; line-height: 1.65; }

    /* ── tables ── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0 1.5em;
      font-size: 0.875rem;
      overflow: hidden;
      border-radius: 8px;
      border: 1px solid #eaecf0;
    }
    th {
      background: #f9fafb;
      text-align: left;
      padding: 10px 14px;
      font-weight: 600;
      color: #344054;
      border-bottom: 1px solid #eaecf0;
    }
    td {
      padding: 10px 14px;
      color: #475467;
      vertical-align: top;
      border-bottom: 1px solid #f2f4f7;
    }
    tr:last-child td { border-bottom: none; }

    /* ── last-updated badge ── */
    .meta {
      display: inline-block;
      font-size: 0.8rem;
      color: #667085;
      background: #f2f4f7;
      border-radius: 20px;
      padding: 3px 10px;
      margin-bottom: 2em;
    }

    /* ── responsive ── */
    @media (max-width: 640px) {
      .card { padding: 24px 20px; }
      h1 { font-size: 1.3rem; }
      h2 { font-size: 1rem; }

      /* make tables scrollable on small screens */
      table { display: block; overflow-x: auto; white-space: nowrap; }
    }
  </style>
</head>
<body>
  <header>
    <span class="brand">BM Booking</span>
    <span class="sep">|</span>
    <span class="doc-title">${title}</span>
  </header>
  <main>
    <div class="card">
      ${body}
    </div>
  </main>
</body>
</html>`;
}

router.get('/privacy', (req, res) => {
  const filePath = path.join(LEGAL_DIR, 'PRIVACY.md');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).json({ status: 'fail', message: 'Privacy policy not found.' });
    }
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(renderPage('Privacy Policy', data));
  });
});

router.get('/terms', (req, res) => {
  const filePath = path.join(LEGAL_DIR, 'TERMS.md');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(404).json({ status: 'fail', message: 'Terms of service not found.' });
    }
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(renderPage('Terms of Use', data));
  });
});

module.exports = router;
