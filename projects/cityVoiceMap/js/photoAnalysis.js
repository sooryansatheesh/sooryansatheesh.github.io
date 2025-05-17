// Photo Analysis Feature
document.addEventListener('DOMContentLoaded', function() {
    initializePhotoAnalysis();
    initializeTabSwitching();
});

function initializePhotoAnalysis() {
    const uploadArea = document.getElementById('upload-area');
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');
    const aiAnalysis = document.getElementById('ai-analysis');

    // Handle click on upload area
    uploadArea.addEventListener('click', () => {
        photoInput.click();
    });

    // Handle file selection
    photoInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                photoPreview.innerHTML = `
                    <img src="${e.target.result}" alt="Issue preview">
                `;
                photoPreview.classList.remove('hidden');
                
                // Start AI analysis
                simulateAIAnalysis();
            };
            reader.readAsDataURL(file);
        }
    });

    // Drag and drop support
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#3b82f6';
        uploadArea.style.backgroundColor = '#f8fafc';
    });

    uploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#e5e7eb';
        uploadArea.style.backgroundColor = 'white';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#e5e7eb';
        uploadArea.style.backgroundColor = 'white';
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            photoInput.files = dataTransfer.files;
            photoInput.dispatchEvent(new Event('change'));
        }
    });
}

function simulateAIAnalysis() {
    const aiAnalysis = document.getElementById('ai-analysis');
    
    // Show loading state
    aiAnalysis.innerHTML = `
        <div class="analysis-loading">
            <div class="loading-spinner"></div>
            <p>AI analyzing image...</p>
        </div>
    `;
    aiAnalysis.classList.remove('hidden');

    // Simulate AI processing time
    setTimeout(() => {
        // Mock AI analysis results
        const analysisResults = {
            issueType: detectIssueType(),
            severity: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
            estimatedSize: generateRandomSize(),
            suggestedPriority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
            safetyRisk: generateSafetyRisk(),
            estimatedCost: generateEstimatedCost(),
            additionalFindings: generateAdditionalFindings()
        };

        // Display results
        displayAnalysisResults(analysisResults);
    }, 2000);
}

function displayAnalysisResults(results) {
    const aiAnalysis = document.getElementById('ai-analysis');
    
    aiAnalysis.innerHTML = `
        <div class="analysis-result">
            <div class="result-item">
                <div class="result-label">Issue Type</div>
                <div class="result-value">${results.issueType}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Severity</div>
                <div class="result-value">${results.severity}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Estimated Size</div>
                <div class="result-value">${results.estimatedSize}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Suggested Priority</div>
                <div class="result-value">${results.suggestedPriority}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Safety Risk Assessment</div>
                <div class="result-value">${results.safetyRisk}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Estimated Repair Cost</div>
                <div class="result-value">${results.estimatedCost}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Additional Findings</div>
                <div class="result-value">${results.additionalFindings}</div>
            </div>
        </div>
    `;
}

// Helper functions for generating mock analysis results
function detectIssueType() {
    const types = ['Pothole', 'Damaged Sidewalk', 'Street Light Issue', 'Road Surface Damage', 'Pedestrian Crossing Need'];
    return types[Math.floor(Math.random() * types.length)];
}

function generateRandomSize() {
    return `${(Math.random() * 3 + 1).toFixed(1)} feet wide`;
}

function generateSafetyRisk() {
    const risks = [
        'Low - Monitor for changes',
        'Medium - Needs attention within 30 days',
        'High - Immediate attention required',
    ];
    return risks[Math.floor(Math.random() * risks.length)];
}

function generateEstimatedCost() {
    const baseCost = Math.floor(Math.random() * 1000) + 500;
    return `$${baseCost.toLocaleString()} - $${(baseCost * 1.5).toLocaleString()}`;
}

function generateAdditionalFindings() {
    const findings = [
        'Surface cracking around edges',
        'Water accumulation risk',
        'Impact on accessibility',
        'Potential tripping hazard',
        'May affect traffic flow'
    ];
    return findings[Math.floor(Math.random() * findings.length)];
}

function initializeTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // Add active class to clicked button and corresponding pane
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}