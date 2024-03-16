let questions = [];
let currentQuestionIndex = 0;
const responses = {};

const questionContainer = document.getElementById('question-container');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');

function fetchQuestions() {
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            questions = data;
            displayQuestion(currentQuestionIndex);
        })
        .catch(error => console.error('Error fetching questions:', error));
}

function displayQuestion(index) {
    const question = questions[index];
    let optionsHtml = '';
    question.options.forEach((option, i) => {
        optionsHtml += `<label><input type="radio" name="response" value="${i}"> ${option}</label><br>`;
    });
    questionContainer.innerHTML = `
        <p>${question.question}</p>
        ${optionsHtml}
    `;
}

function storeResponse(index, responseIndex) {
    const question = questions[index];
    responses[question.question] = question.options[responseIndex];
}

function getNextQuestion() {
    if (currentQuestionIndex < questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion(currentQuestionIndex);
    } else {
        // Reached the end of questions
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    }
}

function submitSurvey() {
    // Send responses to the server as JSON
    fetch('http://yourserver.com/submit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(responses)
    }).then(response => {
        if (response.ok) {
            alert('Survey submitted successfully!');
        } else {
            alert('Error submitting survey.');
        }
    }).catch(error => {
        console.error('Error:', error);
        alert('Error submitting survey.');
    });
}

nextBtn.addEventListener('click', () => {
    const selectedOption = document.querySelector('input[name="response"]:checked');
    if (selectedOption) {
        const responseIndex = parseInt(selectedOption.value);
        storeResponse(currentQuestionIndex, responseIndex);
        getNextQuestion();
    } else {
        alert('Please select an option.');
    }
});

submitBtn.addEventListener('click', submitSurvey);

// Fetch questions when the page loads
fetchQuestions();
