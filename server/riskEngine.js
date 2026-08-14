function calculateRisk(virusTotal, googleSafeBrowsing) {

    let score = 0;
    const reasons = [];

    const malicious = virusTotal.malicious || 0;
    const suspicious = virusTotal.suspicious || 0;

    // Google Safe Browsing
    if (googleSafeBrowsing.isThreat) {

        score += 70;

        reasons.push(
            "Google Safe Browsing detected a known threat."
        );
    }

    // VirusTotal malicious detections
    if (malicious > 0) {

        const vtMaliciousScore = malicious * 5;

        score += vtMaliciousScore;

        reasons.push(
            `VirusTotal detected ${malicious} malicious engine(s).`
        );
    }

    // VirusTotal suspicious detections
    if (suspicious > 0) {

        const vtSuspiciousScore = suspicious * 3;

        score += vtSuspiciousScore;

        reasons.push(
            `VirusTotal detected ${suspicious} suspicious engine(s).`
        );
    }

    // Limit score to 100
    score = Math.min(score, 100);

    let verdict;

    if (score >= 50) {

        verdict = "MALICIOUS";

    } else if (score >= 20) {

        verdict = "SUSPICIOUS";

    } else {

        verdict = "SAFE";
    }

    if (reasons.length === 0) {

        reasons.push(
            "No known threats were detected by the configured security sources."
        );
    }

    return {
        verdict,
        riskScore: score,
        reasons
    };
}

module.exports = {
    calculateRisk
};