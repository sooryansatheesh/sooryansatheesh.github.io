// Class Manager Module
class ClassManager {
    constructor() {
        this.classes = [
            { id: 1, name: 'Water', color: '#0077be' },
            { id: 2, name: 'Dense Vegetation', color: '#228B22' },
            { id: 3, name: 'Agriculture', color: '#90EE90' },
            { id: 4, name: 'Urban Habitation', color: '#808080' }
        ];
        this.currentClass = 1;
        this.callbacks = {
            onClassDelete: null
        };
        this.initializeUI();
    }

    initializeUI() {
        // Get DOM elements
        this.modal = document.getElementById('classModal');
        this.manageClassesBtn = document.getElementById('manageClassesBtn');
        this.classList = document.getElementById('classList');
        this.classButtons = document.getElementById('classButtons');

        // Bind event listeners
        this.manageClassesBtn.onclick = () => this.openModal();
        window.onclick = (event) => {
            if (event.target == this.modal) {
                this.closeModal();
            }
        };

        // Initial update
        this.updateClassButtons();
    }

    openModal() {
        this.modal.style.display = 'block';
        this.updateClassList();
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    updateClassList() {
        this.classList.innerHTML = '';
        this.classes.forEach(cls => {
            const div = document.createElement('div');
            div.className = 'class-item';
            div.innerHTML = `
                <div style="display: flex; align-items: center;">
                    <div class="class-color" style="background-color: ${cls.color}"></div>
                    <span>${cls.name}</span>
                </div>
                <button class="btn" onclick="classManager.removeClass(${cls.id})">Remove</button>
            `;
            this.classList.appendChild(div);
        });
        this.updateClassButtons();
    }

    updateClassButtons() {
        this.classButtons.innerHTML = '';
        this.classes.forEach(cls => {
            const button = document.createElement('button');
            button.className = 'class-btn';
            button.dataset.class = cls.id;
            button.style.backgroundColor = cls.color;
            button.style.color = this.isLightColor(cls.color) ? 'black' : 'white';
            button.textContent = cls.name;
            if (this.currentClass === cls.id) button.classList.add('active');
            this.classButtons.appendChild(button);
        });
    }

    addClass() {
        const name = document.getElementById('className').value;
        const color = document.getElementById('classColor').value;
        if (name) {
            const newId = Math.max(...this.classes.map(c => c.id)) + 1;
            this.classes.push({ id: newId, name, color });
            this.updateClassList();
            document.getElementById('className').value = '';
        }
    }
    // Add method to register callbacks
    onClassDelete(callback) {
        this.callbacks.onClassDelete = callback;
    }
    removeClass(id) {
        if (this.classes.length > 1) {
            this.classes = this.classes.filter(c => c.id !== id);
            if (this.currentClass === id) {
                this.currentClass = this.classes[0].id;
            }
            // Trigger callback before updating UI
            if (this.callbacks.onClassDelete) {
                this.callbacks.onClassDelete(id);
            }
            this.updateClassList();
        } else {
            alert('You must maintain at least one class');
        }
    }

    getColorForClass(classId) {
        const cls = this.classes.find(c => c.id === classId);
        return cls ? cls.color : '#3388ff';
    }

    getCurrentClass() {
        return this.currentClass;
    }

    setCurrentClass(id) {
        this.currentClass = id;
        this.updateClassButtons();
    }

    getAllClasses() {
        return this.classes;
    }

    // Helper function to determine text color based on background
    isLightColor(color) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return brightness > 155;
    }
}

// Initialize and export class manager
const classManager = new ClassManager();