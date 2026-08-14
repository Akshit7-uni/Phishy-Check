document.addEventListener("DOMContentLoaded", async () => {

    const urlElement = document.getElementById("url");
    const scanButton = document.getElementById("scanButton");
    const resultElement = document.getElementById("result");

    const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (tabs.length === 0 || !tabs[0].url) {
        urlElement.textContent = "Unable to get current URL.";
        return;
    }

    const currentUrl = tabs[0].url;

    urlElement.textContent = currentUrl;

    scanButton.addEventListener("click", async () => {

        resultElement.textContent = "Scanning...";

        try {

            const response = await fetch("http://localhost:3000/scan", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    url: currentUrl
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Scan failed");
            }

            console.log("Backend response:", data);

            if (!data.risk) {
                resultElement.textContent =
                    "Risk assessment unavailable.";
                return;
            }

            const risk = data.risk;

            let verdictClass = "";

            if (risk.verdict === "SAFE") {
                verdictClass = "safe";
            } else if (risk.verdict === "SUSPICIOUS") {
                verdictClass = "suspicious";
            } else if (risk.verdict === "MALICIOUS") {
                verdictClass = "malicious";
            }

            let resultHTML = `
                <div class="verdict-card ${verdictClass}">
                    <p class="verdict-title">Security Verdict</p>
                    <p class="verdict">${risk.verdict}</p>
                    <p class="risk-score">Risk Score: ${risk.riskScore}/100</p>
                </div>
            `;

            if (risk.reasons && risk.reasons.length > 0) {

                resultHTML += `
                    <p><strong>Reasons:</strong></p>
                    <ul>
                `;

                risk.reasons.forEach(reason => {

                    resultHTML += `<li>${reason}</li>`;

                });

                resultHTML += `
                    </ul>
                `;
            }

            if (data.virustotal) {

                const stats = data.virustotal.stats;

                resultHTML += `
                    <hr>
                    <p><strong>VirusTotal Analysis</strong></p>
                    <p>Status: ${data.virustotal.status}</p>
                    <p>Malicious: ${stats.malicious}</p>
                    <p>Suspicious: ${stats.suspicious}</p>
                    <p>Harmless: ${stats.harmless}</p>
                    <p>Undetected: ${stats.undetected}</p>
                `;
            }

            if (data.googleSafeBrowsing) {

                const google = data.googleSafeBrowsing;

                resultHTML += `
                    <hr>
                    <p><strong>Google Safe Browsing</strong></p>
                    <p>Threat detected: ${google.isThreat ? "Yes" : "No"}</p>
                `;
            }

            resultElement.innerHTML = resultHTML;

        } catch (error) {

            console.error("Scan error:", error);

            resultElement.textContent =
                "Unable to connect to the backend.";
        }
    });
});