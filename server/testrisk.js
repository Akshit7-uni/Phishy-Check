const { calculateRisk } = require("./riskEngine");

// Test 1: SAFE
const safeResult = calculateRisk(
    {
        malicious: 0,
        suspicious: 0
    },
    {
        isThreat: false,
        threats: []
    }
);

console.log("SAFE TEST:");
console.log(safeResult);


// Test 2: SUSPICIOUS
const suspiciousResult = calculateRisk(
    {
        malicious: 3,
        suspicious: 2
    },
    {
        isThreat: false,
        threats: []
    }
);

console.log("\nSUSPICIOUS TEST:");
console.log(suspiciousResult);


// Test 3: MALICIOUS
const maliciousResult = calculateRisk(
    {
        malicious: 2,
        suspicious: 1
    },
    {
        isThreat: true,
        threats: [
            {
                url: "https://example-test.com",
                threatTypes: ["SOCIAL_ENGINEERING"]
            }
        ]
    }
);

console.log("\nMALICIOUS TEST:");
console.log(maliciousResult);