let questions = [];
let currentQuestionId = 0;
const responses = {};

const questionContainer = document.getElementById('question-container');
const counterContainer = document.getElementById('counter');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const counter = document.getElementById('counter');

function fetchQuestions() {
    fetch('questions.json')
        .then(response => response.json())
        .then(data => {
            questions = data;
            displayQuestion(currentQuestionId);
            updateCounter();
        })
        .catch(error => console.error('Error fetching questions:', error));
}

function displayQuestion(questionId) {
    const question = questions.find(q => q.question_id === questionId);
    if (!question) {
        console.error(`Question with ID ${questionId} not found.`);
        return;
    }

    // Fetch section information
    fetch('section_info.json')
        .then(response => response.json())
        .then(data => {
            const section = data.sections.find(sec => sec.id === question.section_no);
            if (!section) {
                console.error(`Section with ID ${question.section_no} not found.`);
                return;
            }

            // Update section information in the HTML
            document.getElementById('section-id').textContent = `Section No.: ${section.id+1}`;
            document.getElementById('section-title').textContent = section.title;
            document.getElementById('section-description').textContent = section.description;

              })
        .catch(error => console.error('Error fetching section information:', error));




    let optionsHtml = '';
    if (Array.isArray(question.options)) {
        question.options.forEach((option, i) => {
            optionsHtml += `<label><input type="radio" name="response" value="${i}"> ${option}</label><br>`;
        });
    } else if (typeof question.options === 'object') {
        Object.keys(question.options).forEach(key => {
            optionsHtml += `<label><input type="radio" name="response" value="${key}"> ${question.options[key]}</label><br>`;
        });
    }
    questionContainer.innerHTML = `
        <p>${question.question}</p>
        ${optionsHtml}
    `;
}

function storeResponse(questionId, responseIndex) {
    responses[questionId] = responseIndex;
}
// Hide the Submit button if it was displayed
submitBtn.style.display = 'none';
function getNextQuestion() {
    const currentQuestion = questions.find(q => q.question_id === currentQuestionId);
    if (!currentQuestion) {
        console.error(`Current question with ID ${currentQuestionId} not found.`);
        return;
    }
    const currentIndex = questions.indexOf(currentQuestion);
    const nextQuestion = questions.find((q, index) => index > currentIndex && q.section_no === currentQuestion.section_no);
    if (!nextQuestion) {
        // If there is no next question in the same section, we need to find the first question of the next section
        const nextSectionNo = currentQuestion.section_no + 1;
        const firstQuestionOfNextSection = questions.find(q => q.section_no === nextSectionNo);
        if (!firstQuestionOfNextSection) {
            nextBtn.style.display = 'none'; // Hide the next button
            counterContainer.style.display = 'none'; // Hide the counter part
            questionContainer.innerHTML = '';// Empty the contents of the container
            questionContainer.textContent='Thank you for taking the survey!!'//Display thank you message after completing the survey
            questionContainer.style.fontWeight = 'bold';//Display the text in bold
            submitBtn.style.display = 'block';//display the submit button
            console.error(`First question of the next section with section number ${nextSectionNo} not found.`);
            return;
        }
        currentQuestionId = firstQuestionOfNextSection.question_id;
    } else {
        currentQuestionId = nextQuestion.question_id;
    }
    displayQuestion(currentQuestionId);
    updateCounter();

    
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
            const responseText = JSON.stringify(responses, null, 2); // Pretty-print responses
            alert('Error submitting survey.\n\nResponses:\n'+responseText);
        }
    }).catch(error => {
        console.error('Error:', error);
        const responseText = JSON.stringify(responses, null, 2); // Pretty-print responses
        alert('Error submitting survey.\n\nResponses:\n'+responseText);
    });
}

function updateCounter() {
    const currentQuestion = questions.find(q => q.question_id === currentQuestionId);
    if (!currentQuestion) {
        console.error(`Current question with ID ${currentQuestionId} not found.`);
        return;
    }
    const sectionNo = currentQuestion.section_no;
    const currentQuestionIndexInSection = questions.filter(q => q.section_no === sectionNo && q.question_id <= currentQuestionId).length;
    const totalQuestionsInSection = questions.filter(q => q.section_no === sectionNo).length;
    counter.textContent = `Section ${sectionNo+1} | ${currentQuestionIndexInSection}/${totalQuestionsInSection}`;
}

fetchQuestions();

nextBtn.addEventListener('click', () => {
    const selectedOption = document.querySelector('input[name="response"]:checked');
    if (selectedOption) {
        const responseIndex = parseInt(selectedOption.value);
        storeResponse(currentQuestionId, responseIndex);
        getNextQuestion();
    } else {
        alert('Please select an option.');
    }
});

submitBtn.addEventListener('click', submitSurvey);
