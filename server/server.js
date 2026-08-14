require("dotenv").config();

const express = require("express");
const protobuf = require("protobufjs");
const { calculateRisk } = require("./riskEngine");
const app = express();

const PORT = 3000;

app.use(express.json());


// Submit URL to VirusTotal
async function submitToVirusTotal(url) {

    const response = await fetch(
        "https://www.virustotal.com/api/v3/urls",
        {
            method: "POST",

            headers: {
                "x-apikey": process.env.VIRUSTOTAL_API_KEY
            },

            body: new URLSearchParams({
                url: url
            })
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `VirusTotal submission failed: ${response.status} ${errorText}`
        );
    }

    const data = await response.json();

    return data.data.id;
}


// Check VirusTotal analysis
async function getVirusTotalAnalysis(analysisId) {

    const response = await fetch(
        `https://www.virustotal.com/api/v3/analyses/${analysisId}`,
        {
            method: "GET",

            headers: {
                "x-apikey": process.env.VIRUSTOTAL_API_KEY
            }
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `VirusTotal analysis request failed: ${response.status} ${errorText}`
        );
    }

    return await response.json();
}


// Wait function
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// Poll VirusTotal until completed
async function pollVirusTotal(analysisId) {

    const maxAttempts = 20;
    const delay = 3000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {

        console.log(
            `Checking VirusTotal analysis... attempt ${attempt}`
        );

        const data = await getVirusTotalAnalysis(analysisId);

        const attributes = data.data.attributes;

        console.log("Analysis status:", attributes.status);

        if (attributes.status === "completed") {
            return attributes;
        }

        if (
            attributes.status !== "queued" &&
            attributes.status !== "in-progress"
        ) {
            throw new Error(
                `Unexpected VirusTotal status: ${attributes.status}`
            );
        }

        if (attempt < maxAttempts) {
            await wait(delay);
        }
    }

    throw new Error(
        "VirusTotal analysis timed out."
    );
}


// Home route
app.get("/", (req, res) => {

    res.json({
        message: "Phishy URL Detector backend is running"
    });

});
async function checkGoogleSafeBrowsing(url) {

    const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

    const params = new URLSearchParams();

    params.append("key", apiKey);
    params.append("urls", url);

    const endpoint =
        `https://safebrowsing.googleapis.com/v5/urls:search?${params.toString()}`;

    console.log("Checking Google Safe Browsing...");

    const response = await fetch(endpoint, {
        method: "GET"
    });

    if (!response.ok) {

        const errorText = await response.text();

        throw new Error(
            `Google Safe Browsing request failed: ${response.status} ${errorText}`
        );
    }

    const buffer = await response.arrayBuffer();

    console.log(
        "Google protobuf response:",
        buffer.byteLength,
        "bytes"
    );

    const root = await protobuf.load("safebrowsing.proto");

    const SearchUrlsResponse =
        root.lookupType(
            "google.security.safebrowsing.v5.SearchUrlsResponse"
        );

    const decoded =
        SearchUrlsResponse.decode(
            new Uint8Array(buffer)
        );

    const result =
        SearchUrlsResponse.toObject(decoded, {
            longs: String,
            enums: String
        });

    const threats = result.threats || [];

    const googleResult = {
        isThreat: threats.length > 0,

        threats: threats.map(threat => ({
            url: threat.url,
            threatTypes: threat.threatTypes || []
        }))
    };

    console.log(
        "Google Safe Browsing result:",
        googleResult
    );

    return googleResult;
}
// Scan route
app.post("/scan", async (req, res) => {

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({
            error: "URL is required"
        });
    }

    let parsedUrl;

    try {

        parsedUrl = new URL(url);

    } catch (error) {

        return res.status(400).json({
            error: "Invalid URL"
        });

    }

    if (
        parsedUrl.protocol !== "http:" &&
        parsedUrl.protocol !== "https:"
    ) {

        return res.status(400).json({
            error: "Only HTTP and HTTPS URLs are supported"
        });

    }

    try {

        console.log("Submitting URL to VirusTotal:");

        const analysisId = await submitToVirusTotal(
            parsedUrl.href
        );

        console.log("Analysis ID:", analysisId);

        const analysis = await pollVirusTotal(
            analysisId
        );
        const safeBrowsingResult =
            await checkGoogleSafeBrowsing(parsedUrl.href);

        const riskResult = calculateRisk(
            analysis.stats,
            safeBrowsingResult
        );
        console.log("Risk result:", riskResult);
        console.log(
            "Final security results:",
            {
                virustotal: analysis.stats,
                googleSafeBrowsing: safeBrowsingResult
            }
        );
        res.json({

            url: parsedUrl.href,

            virustotal: {
                status: analysis.status,
                stats: analysis.stats
            },

            googleSafeBrowsing: safeBrowsingResult,

            risk: riskResult

        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "VirusTotal analysis failed"
        });

    }

});


app.listen(PORT, () => {

    console.log(
        `Server running on http://localhost:${PORT}`
    );

});