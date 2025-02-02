// Request AI Analysis System

function analyzeRequest(request) {
    return {
        urgencyScore: calculateUrgencyScore(request),
        communityImpact: assessCommunityImpact(request),
        costBenefit: analyzeCostBenefit(request),
        timeline: recommendTimeline(request)
    };
}

function calculateUrgencyScore(request) {
    let score = 0;
    
    // Priority based score
    const priorityScores = { high: 40, medium: 25, low: 10 };
    score += priorityScores[request.priority] || 0;
    
    // Type based score
    const typeUrgency = {
        pothole: 25,
        streetlight: 20,
        crossing: 15,
        sidewalk: 10,
        bike: 5
    };
    score += typeUrgency[request.type] || 0;
    
    // Text analysis score
    const urgentKeywords = ['dangerous', 'hazard', 'unsafe', 'immediate', 'risk', 'accident'];
    const descriptionWords = request.description.toLowerCase().split(' ');
    const keywordMatches = urgentKeywords.filter(word => descriptionWords.includes(word));
    score += keywordMatches.length * 5;
    
    // Time-based score (newer requests get slightly higher priority)
    const daysSinceSubmission = (new Date() - new Date(request.timestamp)) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 15 - daysSinceSubmission);
    
    // Cap at 100
    return Math.min(100, Math.round(score));
}

function assessCommunityImpact(request) {
    let impact = {
        score: 0,
        factors: [],
        benefitLevel: ''
    };
    
    // Analyze type impact
    const typeImpact = {
        crossing: { score: 25, reason: 'Pedestrian Safety Enhancement' },
        streetlight: { score: 20, reason: 'Public Safety Improvement' },
        sidewalk: { score: 15, reason: 'Accessibility Improvement' },
        pothole: { score: 15, reason: 'Vehicle Safety Impact' },
        bike: { score: 15, reason: 'Sustainable Transport' }
    };
    
    if (typeImpact[request.type]) {
        impact.score += typeImpact[request.type].score;
        impact.factors.push(typeImpact[request.type].reason);
    }
    
    // Population density impact (simulated)
    const populationScore = Math.random() * 30;
    impact.score += populationScore;
    impact.factors.push('Population Density Impact');
    
    // Accessibility impact
    if (request.description.toLowerCase().includes('school') || 
        request.description.toLowerCase().includes('hospital')) {
        impact.score += 20;
        impact.factors.push('Critical Infrastructure Proximity');
    }
    
    // Set benefit level
    if (impact.score >= 70) impact.benefitLevel = 'High Community Benefit';
    else if (impact.score >= 40) impact.benefitLevel = 'Medium Community Benefit';
    else impact.benefitLevel = 'Local Community Benefit';
    
    impact.score = Math.min(100, Math.round(impact.score));
    return impact;
}

function analyzeCostBenefit(request) {
    const baselineCosts = {
        sidewalk: 5000,
        streetlight: 3000,
        pothole: 500,
        crossing: 8000,
        bike: 10000
    };

    const baseCost = baselineCosts[request.type] || 5000;
    const estimatedBenefit = assessCommunityImpact(request).score * 200; // $200 per impact point
    
    return {
        estimatedCost: baseCost,
        estimatedBenefit: estimatedBenefit,
        ratio: (estimatedBenefit / baseCost).toFixed(2),
        recommendation: estimatedBenefit / baseCost > 1 ? 'Recommended Investment' : 'Review Required'
    };
}

function recommendTimeline(request) {
    const urgencyScore = calculateUrgencyScore(request);
    
    if (urgencyScore >= 80) {
        return {
            timeframe: 'Immediate',
            recommendation: '1-2 weeks',
            reason: 'High urgency requires immediate attention'
        };
    } else if (urgencyScore >= 60) {
        return {
            timeframe: 'Soon',
            recommendation: '2-4 weeks',
            reason: 'Important issue requiring prompt attention'
        };
    } else if (urgencyScore >= 40) {
        return {
            timeframe: 'Medium',
            recommendation: '1-2 months',
            reason: 'Moderate urgency, plan accordingly'
        };
    } else {
        return {
            timeframe: 'Flexible',
            recommendation: '2-3 months',
            reason: 'Can be addressed in regular maintenance schedule'
        };
    }
}