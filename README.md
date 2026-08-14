# Phishy-Check 🎣🔍

Phishy-Check is a Chrome extension that analyzes the URL of your current browser tab and tells you whether it is **Safe**, **Suspicious**, or **Malicious** — backed by a Node.js/Express server that aggregates results from multiple threat-intelligence sources into a single, explainable risk verdict.

## Overview

Phishing links are one of the easiest ways attackers trick people into handing over credentials or installing malware. Phishy-Check gives you a one-click check on any page you're currently viewing: it grabs the active tab's URL, sends it to a backend risk engine, and returns a clear verdict — **SAFE**, **SUSPICIOUS**, or **MALICIOUS** — along with the signals that produced it.

The extension itself stays intentionally "dumb": it only captures the URL and displays the result. All the actual intelligence-gathering and API key usage happens server-side, so your VirusTotal / Google Safe Browsing credentials are never exposed in client-side extension code.

## Features

- 🔎 Detects the URL of the currently active Chrome tab.
- 🧪 Scans URLs using the **VirusTotal API**.
- 🛡️ Cross-checks URLs against **Google Safe Browsing**.
- ⏳ Polls VirusTotal until the analysis job completes (VirusTotal scans are asynchronous).
- 🧮 Combines signals from multiple sources into a single **explainable risk score**.
- 🚦 Classifies each URL as `SAFE`, `SUSPICIOUS`, or `MALICIOUS`.
- 🔐 Keeps all API keys on the backend — nothing sensitive ships inside the extension bundle.
- 🖱️ Simple, lightweight popup UI for the verdict.
- ✅ Includes independent tests for the risk-scoring engine.

## Architecture

```
Chrome Extension
      |
      | POST /scan
      v
Node.js / Express Backend
      |
      +----------------------+
      |                      |
      v                      v
VirusTotal API       Google Safe Browsing API
      |                      |
      +----------+-----------+
                 |
                 v
          Risk Engine
                 |
                 v
       SAFE / SUSPICIOUS /
           MALICIOUS
                 |
                 v
          Chrome Popup
```

**Flow:**
1. User clicks the Phishy-Check extension icon while browsing.
2. The extension reads the active tab's URL.
3. It sends that URL to the backend via a `POST /scan` request.
4. The backend queries VirusTotal, then Google Safe Browsing, one after the other (sequentially — not in parallel).
5. The backend's risk engine combines both results into a single weighted score.
6. The final verdict (`SAFE` / `SUSPICIOUS` / `MALICIOUS`) is returned to the extension and rendered in the popup.

## Tech Stack

| Layer      | Technology                                   |
|------------|-----------------------------------------------|
| Extension  | HTML, CSS, JavaScript (Chrome Extension APIs) |
| Backend    | Node.js, Express                              |
| Threat Intel | VirusTotal API, Google Safe Browsing API   |
| Testing    | Independent unit tests for the risk engine    |

## Project Structure

```
Phishy-Check/
├── extension/
│   ├── background.js
│   ├── manifest.json
│   ├── popup.css
│   ├── popup.html
│   └── popup.js
│
├── server/
│   ├── server.js
│   ├── riskEngine.js
│   ├── safebrowsing.proto
│   ├── testrisk.js
│   ├── package.json
│   └── package-lock.json
│
├── .gitignore
└── README.md
```



## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended) and npm
- Google Chrome (or any Chromium-based browser that supports Manifest V3 extensions)
- API keys for:
  - [VirusTotal](https://www.virustotal.com/gui/join-us) (free tier available)
  - [Google Safe Browsing](https://developers.google.com/safe-browsing/v4/get-started) (requires a Google Cloud project with the Safe Browsing API enabled)

### 1. Clone the repo

```bash
git clone https://github.com/Akshit7-uni/Phishy-Check.git
cd Phishy-Check
```

### 2. Set up the backend server

```bash
cd server
npm install
```

Create a `.env` file inside `server/` with your API keys:

```env
PORT=3000
VIRUSTOTAL_API_KEY=your_virustotal_api_key
GOOGLE_SAFE_BROWSING_API_KEY=your_google_safe_browsing_api_key
```

Start the server:

```bash
npm start
```

By default the server should now be running at `http://localhost:3000`.

### 3. Load the Chrome extension

1. Open Chrome and go to `chrome://extensions/`.
2. Toggle on **Developer mode** (top-right corner).
3. Click **Load unpacked**.
4. Select the `extension/` folder from this repo.
5. The Phishy-Check icon should now appear in your Chrome toolbar.
6. If the extension needs the backend URL configured, make sure it points to `http://localhost:3000` (or wherever you're hosting the server) — check the extension's config/constants file.

## How It Works

1. **Capture** – The extension grabs the URL of the currently active tab using the Chrome Extensions API.
2. **Submit** – It sends that URL to the backend's `/scan` endpoint.
3. **Scan (VirusTotal)** – The backend submits the URL to VirusTotal and polls the analysis endpoint until the scan completes (since VirusTotal scans run asynchronously).
4. **Scan (Google Safe Browsing)** – Once the VirusTotal scan finishes, the backend then checks the URL against Google's Safe Browsing threat lists (this step currently runs sequentially, after VirusTotal, not in parallel).
5. **Score** – The risk engine combines both results into a single explainable score, weighing detections from each source.
6. **Classify** – Based on the score, the URL is labeled `SAFE`, `SUSPICIOUS`, or `MALICIOUS`.
7. **Display** – The verdict is sent back to the extension and shown in the popup.

## Configuration

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Port the Express server listens on | No (defaults typically to 3000) |
| `VIRUSTOTAL_API_KEY` | Your VirusTotal API key | Yes |
| `GOOGLE_SAFE_BROWSING_API_KEY` | Your Google Safe Browsing API key | Yes |

> Never commit your `.env` file or API keys to version control — `.gitignore` in this repo should already exclude it.

## Testing

The risk engine includes independent tests, separate from the API integrations (so scoring logic can be verified without live API calls). From the `server/` directory:

```bash
node testrisk.js
```

> Tip: you can wire this up as `npm test` by adding a `"test"` script to `server/package.json`:
> ```json
> "scripts": {
>   "test": "node testrisk.js"
> }
> ```
> Then `npm test` will work too.



No license file is currently specified in this repository. Consider adding one (e.g., MIT) if you plan to share or accept contributions.
