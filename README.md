# Phishy-Check

Phishy-Check is a Chrome extension that analyzes the URL of the current browser tab and determines whether it is **Safe, Suspicious, or Malicious**.

The project uses multiple security intelligence sources and a backend risk engine to produce a final security verdict.

## Features

- Detects the URL of the active Chrome tab.
- Scans URLs using the VirusTotal API.
- Checks URLs against Google Safe Browsing.
- Uses polling to wait for VirusTotal analysis completion.
- Combines results from multiple security sources.
- Calculates an explainable risk score.
- Classifies URLs as:
  - SAFE
  - SUSPICIOUS
  - MALICIOUS
- Keeps API keys on the backend instead of exposing them in the Chrome extension.
- Provides a simple Chrome extension interface.
- Includes independent testing for the risk engine.

---

# Architecture

The project follows a frontend/backend architecture.

```text
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
