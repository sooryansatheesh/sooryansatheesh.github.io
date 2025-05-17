// Create a new file: smartAnalysis.js

// Initialize smart analysis when document loads
document.addEventListener('DOMContentLoaded', function() {
    initializeSmartAnalysis();
});

function initializeSmartAnalysis() {
    const descriptionInput = document.getElementById('request-description');
    const infrastructureSelect = document.getElementById('infrastructure-type');
    const prioritySelect = document.getElementById('request-priority');
    
    // Create analysis feedback container
    const analysisFeedback = document.createElement('div');
    analysisFeedback.id = 'smart-analysis';
    analysisFeedback.className = 'smart-analysis hidden';
    descriptionInput.parentNode.insertBefore(analysisFeedback, descriptionInput.nextSibling);

    // Add typing event listener with debounce
    let timeout = null;
    descriptionInput.addEventListener('input', function() {
        // Show AI indicator immediately
        analysisFeedback.innerHTML = `
            <div class="ai-analyzing">
                <i class="fas fa-brain pulse"></i>
                <span>AI analyzing your description...</span>
            </div>
        `;
        analysisFeedback.classList.remove('hidden');

        // Clear existing timeout
        clearTimeout(timeout);

        // Set new timeout for analysis
        timeout = setTimeout(() => {
            analyzeDescription(
                descriptionInput.value,
                analysisFeedback,
                infrastructureSelect,
                prioritySelect
            );
        }, 1000); // Wait 1 second after typing stops
    });
}

function analyzeDescription(text, feedbackElement, typeSelect, prioritySelect) {
    // Skip analysis if text is too short
    if (text.length < 10) {
        feedbackElement.classList.add('hidden');
        return;
    }

    // Simulate AI analysis
    const analysis = {
        suggestedType: detectInfrastructureType(text),
        suggestedPriority: analyzePriority(text),
        similarRequests: findSimilarRequests(text),
        estimatedCost: estimateCost(text),
        keywords: extractKeywords(text)
    };

    // Update UI with analysis results
    updateAnalysisUI(analysis, feedbackElement, typeSelect, prioritySelect);
}

function detectInfrastructureType(text) {
    const keywords = {
        sidewalk: ['sidewalk', 'pavement', 'walkway', 'path', 'pedestrian'],
        streetlight: ['light', 'lighting', 'dark', 'lamp', 'visibility', 'night'],
        pothole: ['hole', 'pothole', 'crack', 'surface', 'bump', 'damaged'],
        crossing: ['cross', 'intersection', 'pedestrian crossing', 'traffic', 'signal'],
        bike: ['bike', 'bicycle', 'cycling', 'lane', 'cyclist']
    };

    let maxMatches = 0;
    let detectedType = null;

    for (const [type, words] of Object.entries(keywords)) {
        const matches = words.filter(word => 
            text.toLowerCase().includes(word.toLowerCase())
        ).length;
        
        if (matches > maxMatches) {
            maxMatches = matches;
            detectedType = type;
        }
    }

    return detectedType;
}

function analyzePriority(text) {
    const priorities = {
        high: ['urgent', 'dangerous', 'hazard', 'immediate', 'safety', 'risk', 'emergency'],
        medium: ['moderate', 'needed', 'should', 'important', 'fix', 'repair'],
        low: ['minor', 'eventually', 'small', 'slight', 'consider']
    };

    let maxMatches = 0;
    let suggestedPriority = 'low';

    for (const [priority, words] of Object.entries(priorities)) {
        const matches = words.filter(word => 
            text.toLowerCase().includes(word.toLowerCase())
        ).length;
        
        if (matches > maxMatches) {
            maxMatches = matches;
            suggestedPriority = priority;
        }
    }

    return suggestedPriority;
}

function findSimilarRequests(text) {
    // Get existing requests from localStorage
    const requests = JSON.parse(localStorage.getItem('requests') || '[]');
    
    // Simple similarity check based on word overlap
    const words = text.toLowerCase().split(/\W+/);
    
    return requests.filter(request => {
        const requestWords = request.description.toLowerCase().split(/\W+/);
        const commonWords = words.filter(word => requestWords.includes(word));
        return commonWords.length >= 3; // Consider similar if 3 or more words match
    }).slice(0, 2); // Return up to 2 similar requests
}

function estimateCost(text) {
    const baseCosts = {
        sidewalk: 5000,
        streetlight: 3000,
        pothole: 500,
        crossing: 8000,
        bike: 10000
    };

    const type = detectInfrastructureType(text);
    if (!type) return null;

    // Add variation based on text analysis
    const baseCost = baseCosts[type];
    const multiplier = text.includes('large') ? 1.5 : 
                      text.includes('small') ? 0.7 : 1;

    return Math.round(baseCost * multiplier);
}

function extractKeywords(text) {
    const commonWords = new Set(['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'is', 'are']);
    return text.toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 3 && !commonWords.has(word))
        .slice(0, 5);
}

function updateAnalysisUI(analysis, feedbackElement, typeSelect, prioritySelect) {
    let html = '<div class="analysis-results">';
    
    // Add AI icon and title
    html += `
        <div class="analysis-header">
            <i class="fas fa-robot"></i>
            <span>AI Analysis Results</span>
        </div>
    `;

    // Add suggestions if available
    if (analysis.suggestedType) {
        html += `
            <div class="suggestion">
                <i class="fas fa-lightbulb"></i>
                <span>Suggested Category: <strong>${analysis.suggestedType}</strong></span>
                <button onclick="applyTypeRecommendation('${analysis.suggestedType}')" class="apply-btn">Apply</button>
            </div>
        `;
    }

    if (analysis.suggestedPriority) {
        html += `
            <div class="suggestion">
                <i class="fas fa-exclamation-circle"></i>
                <span>Recommended Priority: <strong>${analysis.suggestedPriority}</strong></span>
                <button onclick="applyPriorityRecommendation('${analysis.suggestedPriority}')" class="apply-btn">Apply</button>
            </div>
        `;
    }

    // Show estimated cost if available
    if (analysis.estimatedCost) {
        html += `
            <div class="cost-estimate">
                <i class="fas fa-dollar-sign"></i>
                <span>Estimated Cost: <strong>$${analysis.estimatedCost.toLocaleString()}</strong></span>
            </div>
        `;
    }

    // Show similar requests if found
    if (analysis.similarRequests.length > 0) {
        html += `
            <div class="similar-requests">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Similar Requests Found:</span>
                <ul>
                    ${analysis.similarRequests.map(req => `
                        <li>${req.description.substring(0, 100)}...</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }

    html += '</div>';
    feedbackElement.innerHTML = html;
    feedbackElement.classList.remove('hidden');
}

// Helper functions to apply recommendations
window.applyTypeRecommendation = function(type) {
    document.getElementById('infrastructure-type').value = type;
};

window.applyPriorityRecommendation = function(priority) {
    document.getElementById('request-priority').value = priority;
};