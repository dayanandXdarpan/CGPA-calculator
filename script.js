// Advanced CGPA Calculator with Enhanced Features
class CGPACalculator {
    constructor() {
        this.gradingSystems = {
            '10point': {
                name: '10 Point Scale',
                gradeMap: { 'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'P': 4, 'F': 0 },
                numericRange: { min: 0, max: 10 },
                placeholder: 'Grade (10, 9, 8, 7, 6, 5, 4, 0 or A+, A, B+, B, C+, C, D, P, F)'
            },
            '4point': {
                name: '4.0 Scale',
                gradeMap: { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D+': 1.3, 'D': 1.0, 'F': 0.0 },
                numericRange: { min: 0, max: 4 },
                placeholder: 'Grade (4.0, 3.7, 3.3, 3.0, 2.7, 2.3, 2.0, 1.7, 1.3, 1.0, 0.0 or A, A-, B+, B, B-, C+, C, C-, D+, D, F)'
            },
            'percentage': {
                name: 'Percentage',
                gradeMap: {},
                numericRange: { min: 0, max: 100 },
                placeholder: 'Grade (0-100%)',
                convertToPoints: (percentage) => (percentage / 100) * 10 // Convert to 10-point scale for calculation
            }
        };
        this.currentSystem = '10point';
        this.subjects = [];
        this.savedSemesters = this.loadSavedSemesters();
        this.init();
    }

    init() {
        this.loadTheme();
        this.updateGradingSystem();
        this.calculateCGPA();
        this.displaySavedSemesters();
        this.setupAutoSave();
    }

    // Theme Management
    loadTheme() {
        const savedTheme = localStorage.getItem('cgpa-calculator-theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('cgpa-calculator-theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#themeToggle i');
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }

    // Grading System Management
    updateGradingSystem() {
        this.currentSystem = document.getElementById('gradingSystem').value;
        const system = this.gradingSystems[this.currentSystem];
        
        // Update all grade input placeholders
        document.querySelectorAll('.grade').forEach(input => {
            input.placeholder = system.placeholder;
        });
        
        this.calculateCGPA();
    }

    // Subject Management
    addSubject() {
        const subjectDiv = document.createElement('div');
        subjectDiv.classList.add('subject-input');
        
        const system = this.gradingSystems[this.currentSystem];
        subjectDiv.innerHTML = `
            <input type="text" placeholder="Subject Name (e.g., Mathematics)" class="subject-name">
            <input type="text" placeholder="${system.placeholder}" class="grade" oninput="calculator.calculateCGPA()">
            <input type="number" placeholder="Credits" class="credit" min="0.5" max="10" step="0.5" oninput="calculator.calculateCGPA()">
            <button onclick="calculator.removeSubject(this)" class="remove-subject-btn" title="Remove Subject">
                <i class="fas fa-trash"></i>
            </button>
        `;
        
        document.getElementById('subjects').appendChild(subjectDiv);
        
        // Focus on the first input of the new subject
        subjectDiv.querySelector('.subject-name').focus();
    }

    removeSubject(button) {
        if (document.querySelectorAll('.subject-input').length > 1) {
            button.closest('.subject-input').remove();
            this.calculateCGPA();
        } else {
            this.showMessage('At least one subject is required!', 'error');
        }
    }

    clearAll() {
        if (this.confirmAction('Are you sure you want to clear all subjects? This action cannot be undone.')) {
            const system = this.gradingSystems[this.currentSystem];
            document.getElementById('subjects').innerHTML = `
                <div class="subject-input">
                    <input type="text" placeholder="Subject Name (e.g., Mathematics)" class="subject-name">
                    <input type="text" placeholder="${system.placeholder}" class="grade" oninput="calculator.calculateCGPA()">
                    <input type="number" placeholder="Credits" class="credit" min="0.5" max="10" step="0.5" oninput="calculator.calculateCGPA()">
                    <button onclick="calculator.removeSubject(this)" class="remove-subject-btn" title="Remove Subject">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            document.getElementById('result').innerHTML = '';
            document.getElementById('error').innerHTML = '';
            document.getElementById('stats').innerHTML = '';
            this.clearMessage();
        }
    }

    // CGPA Calculation
    calculateCGPA() {
        const grades = document.querySelectorAll('.grade');
        const credits = document.querySelectorAll('.credit');
        const subjectNames = document.querySelectorAll('.subject-name');
        const errorElement = document.getElementById('error');
        const resultElement = document.getElementById('result');
        const statsElement = document.getElementById('stats');
        
        this.clearMessage();
        errorElement.innerHTML = '';

        let totalScore = 0;
        let totalCredits = 0;
        let hasError = false;
        let validSubjects = 0;
        const gradeDistribution = {};
        const subjectDetails = [];

        const system = this.gradingSystems[this.currentSystem];

        for (let i = 0; i < grades.length; i++) {
            let gradeValue = grades[i].value.trim().toUpperCase();
            const creditValue = parseFloat(credits[i].value);
            const subjectName = subjectNames[i].value.trim();

            // Reset validation styles
            grades[i].classList.remove('invalid');
            credits[i].classList.remove('invalid');

            // Skip empty rows
            if (!gradeValue && !creditValue) continue;

            // Validate inputs
            if (!gradeValue || (!creditValue || creditValue <= 0)) {
                if (!gradeValue) grades[i].classList.add('invalid');
                if (!creditValue || creditValue <= 0) credits[i].classList.add('invalid');
                hasError = true;
                continue;
            }

            // Convert grade to numeric value
            let numericGrade;
            if (system.gradeMap[gradeValue] !== undefined) {
                numericGrade = system.gradeMap[gradeValue];
            } else {
                numericGrade = parseFloat(gradeValue);
                if (isNaN(numericGrade) || numericGrade < system.numericRange.min || numericGrade > system.numericRange.max) {
                    grades[i].classList.add('invalid');
                    hasError = true;
                    continue;
                }
            }

            // Convert percentage to points if needed
            if (this.currentSystem === 'percentage' && system.convertToPoints) {
                numericGrade = system.convertToPoints(numericGrade);
            }

            // Add to totals
            totalScore += numericGrade * creditValue;
            totalCredits += creditValue;
            validSubjects++;

            // Track grade distribution
            const gradeKey = gradeValue;
            gradeDistribution[gradeKey] = (gradeDistribution[gradeKey] || 0) + 1;

            // Store subject details
            subjectDetails.push({
                name: subjectName || `Subject ${i + 1}`,
                grade: gradeValue,
                numericGrade: numericGrade,
                credits: creditValue
            });
        }

        this.subjects = subjectDetails;

        if (hasError) {
            errorElement.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                Please fix the highlighted errors. Ensure all grades and credits are valid.
            `;
            return;
        }

        if (totalCredits === 0) {
            resultElement.innerHTML = 'Please enter valid grades and credits to calculate CGPA.';
            return;
        }

        // Calculate and display CGPA
        const cgpa = totalScore / totalCredits;
        const cgpaDisplay = this.currentSystem === 'percentage' ? 
            `${(cgpa * 10).toFixed(2)}% (${cgpa.toFixed(2)} points)` : 
            cgpa.toFixed(2);

        resultElement.innerHTML = `
            <div class="cgpa-value">${cgpaDisplay}</div>
            <div class="cgpa-label">Current CGPA</div>
        `;

        // Display statistics
        this.displayStatistics(totalCredits, validSubjects, gradeDistribution);
        
        // Auto-save data
        this.autoSave();
    }

    displayStatistics(totalCredits, validSubjects, gradeDistribution) {
        const statsElement = document.getElementById('stats');
        
        const topGrades = Object.entries(gradeDistribution)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([grade, count]) => `${grade} (${count})`)
            .join(', ');

        statsElement.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${validSubjects}</div>
                <div class="stat-label">Total Subjects</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${totalCredits}</div>
                <div class="stat-label">Total Credits</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${topGrades || 'N/A'}</div>
                <div class="stat-label">Most Common Grades</div>
            </div>
        `;
    }

    // Target CGPA Calculator
    calculateTargetGrades() {
        const targetCGPA = parseFloat(document.getElementById('targetCGPA').value);
        const remainingCredits = parseFloat(document.getElementById('remainingCredits').value);
        const resultElement = document.getElementById('targetResult');

        if (!targetCGPA || !remainingCredits || targetCGPA <= 0 || remainingCredits <= 0) {
            resultElement.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Please enter valid target CGPA and remaining credits.
                </div>
            `;
            return;
        }

        // Calculate current totals
        let currentTotalScore = 0;
        let currentTotalCredits = 0;
        
        this.subjects.forEach(subject => {
            currentTotalScore += subject.numericGrade * subject.credits;
            currentTotalCredits += subject.credits;
        });

        if (currentTotalCredits === 0) {
            resultElement.innerHTML = `
                <div class="error">
                    <i class="fas fa-exclamation-triangle"></i>
                    Please add some subjects first to calculate target grades.
                </div>
            `;
            return;
        }

        // Calculate required average grade for remaining subjects
        const totalCreditsNeeded = currentTotalCredits + remainingCredits;
        const totalScoreNeeded = targetCGPA * totalCreditsNeeded;
        const requiredScore = totalScoreNeeded - currentTotalScore;
        const requiredAverage = requiredScore / remainingCredits;

        const maxGrade = this.gradingSystems[this.currentSystem].numericRange.max;
        
        let message, className;
        if (requiredAverage <= maxGrade && requiredAverage >= 0) {
            const percentage = (requiredAverage / maxGrade) * 100;
            message = `
                <div class="success">
                    <i class="fas fa-check-circle"></i>
                    <strong>Achievable!</strong> You need an average grade of <strong>${requiredAverage.toFixed(2)}</strong> 
                    (${percentage.toFixed(1)}% of maximum) in your remaining ${remainingCredits} credits to reach your target CGPA of ${targetCGPA}.
                </div>
            `;
        } else if (requiredAverage > maxGrade) {
            message = `
                <div class="error">
                    <i class="fas fa-times-circle"></i>
                    <strong>Not achievable!</strong> You would need an average grade of <strong>${requiredAverage.toFixed(2)}</strong> 
                    in your remaining subjects, which exceeds the maximum possible grade of ${maxGrade}.
                </div>
            `;
        } else {
            message = `
                <div class="success">
                    <i class="fas fa-check-circle"></i>
                    <strong>Already achieved!</strong> Your current CGPA is already above your target. 
                    You can achieve your target with any passing grades.
                </div>
            `;
        }

        resultElement.innerHTML = message;
    }

    // Semester Management
    saveSemester() {
        const semesterName = document.getElementById('semesterName').value.trim();
        
        if (!semesterName) {
            this.showMessage('Please enter a semester name.', 'error');
            return;
        }

        if (this.subjects.length === 0) {
            this.showMessage('Please add some subjects before saving.', 'error');
            return;
        }

        // Calculate current CGPA
        let totalScore = 0;
        let totalCredits = 0;
        this.subjects.forEach(subject => {
            totalScore += subject.numericGrade * subject.credits;
            totalCredits += subject.credits;
        });

        const cgpa = totalScore / totalCredits;
        
        const semester = {
            id: Date.now(),
            name: semesterName,
            cgpa: cgpa,
            totalCredits: totalCredits,
            subjects: [...this.subjects],
            gradingSystem: this.currentSystem,
            date: new Date().toLocaleDateString()
        };

        this.savedSemesters.push(semester);
        this.saveSemestersToStorage();
        this.displaySavedSemesters();
        
        document.getElementById('semesterName').value = '';
        this.showMessage(`Semester "${semesterName}" saved successfully!`, 'success');
    }

    loadSemester(semesterId) {
        const semester = this.savedSemesters.find(s => s.id === semesterId);
        if (!semester) return;

        // Set grading system
        document.getElementById('gradingSystem').value = semester.gradingSystem;
        this.updateGradingSystem();

        // Clear current subjects
        document.getElementById('subjects').innerHTML = '';

        // Load semester subjects
        semester.subjects.forEach((subject, index) => {
            if (index === 0) {
                this.addSubject();
            } else {
                this.addSubject();
            }
            
            const subjectInputs = document.querySelectorAll('.subject-input');
            const currentInput = subjectInputs[subjectInputs.length - 1];
            
            currentInput.querySelector('.subject-name').value = subject.name;
            currentInput.querySelector('.grade').value = subject.grade;
            currentInput.querySelector('.credit').value = subject.credits;
        });

        this.calculateCGPA();
        this.showMessage(`Semester "${semester.name}" loaded successfully!`, 'success');
    }

    deleteSemester(semesterId) {
        if (this.confirmAction('Are you sure you want to delete this semester? This action cannot be undone.')) {
            this.savedSemesters = this.savedSemesters.filter(s => s.id !== semesterId);
            this.saveSemestersToStorage();
            this.displaySavedSemesters();
            this.showMessage('Semester deleted successfully!', 'success');
        }
    }

    displaySavedSemesters() {
        const container = document.getElementById('semestersList');
        
        if (this.savedSemesters.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No saved semesters yet. Save your current semester to track your progress over time.</p>';
            return;
        }

        container.innerHTML = this.savedSemesters.map(semester => `
            <div class="semester-card">
                <div class="semester-name">${semester.name}</div>
                <div class="semester-cgpa">${semester.cgpa.toFixed(2)}</div>
                <div class="semester-details">
                    ${semester.subjects.length} subjects • ${semester.totalCredits} credits<br>
                    Saved on ${semester.date}
                </div>
                <div class="semester-actions">
                    <button onclick="calculator.loadSemester(${semester.id})" class="load-btn">
                        <i class="fas fa-upload"></i> Load
                    </button>
                    <button onclick="calculator.deleteSemester(${semester.id})" class="delete-btn">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Data Import/Export
    exportData() {
        const data = {
            subjects: this.subjects,
            gradingSystem: this.currentSystem,
            savedSemesters: this.savedSemesters,
            exportDate: new Date().toISOString()
        };

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `cgpa-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showMessage('Data exported successfully!', 'success');
    }

    importData() {
        document.getElementById('fileInput').click();
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (data.savedSemesters) {
                    this.savedSemesters = [...this.savedSemesters, ...data.savedSemesters];
                    this.saveSemestersToStorage();
                    this.displaySavedSemesters();
                }
                
                if (data.subjects && data.subjects.length > 0) {
                    // Load the subjects
                    document.getElementById('subjects').innerHTML = '';
                    
                    if (data.gradingSystem) {
                        document.getElementById('gradingSystem').value = data.gradingSystem;
                        this.updateGradingSystem();
                    }
                    
                    data.subjects.forEach((subject, index) => {
                        this.addSubject();
                        const subjectInputs = document.querySelectorAll('.subject-input');
                        const currentInput = subjectInputs[subjectInputs.length - 1];
                        
                        currentInput.querySelector('.subject-name').value = subject.name;
                        currentInput.querySelector('.grade').value = subject.grade;
                        currentInput.querySelector('.credit').value = subject.credits;
                    });
                    
                    this.calculateCGPA();
                }
                
                this.showMessage('Data imported successfully!', 'success');
            } catch (error) {
                this.showMessage('Error importing data. Please check the file format.', 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }

    // Storage Management
    loadSavedSemesters() {
        try {
            const stored = localStorage.getItem('cgpa-calculator-semesters');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading saved semesters:', error);
            return [];
        }
    }

    saveSemestersToStorage() {
        try {
            localStorage.setItem('cgpa-calculator-semesters', JSON.stringify(this.savedSemesters));
        } catch (error) {
            console.error('Error saving semesters:', error);
        }
    }

    setupAutoSave() {
        // Auto-save current state every 30 seconds
        setInterval(() => {
            this.autoSave();
        }, 30000);
    }

    autoSave() {
        const currentState = {
            subjects: this.subjects,
            gradingSystem: this.currentSystem,
            lastSaved: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('cgpa-calculator-autosave', JSON.stringify(currentState));
        } catch (error) {
            console.error('Error auto-saving:', error);
        }
    }

    // Utility Methods
    showMessage(message, type = 'info') {
        const existingMessage = document.querySelector('.message');
        if (existingMessage) {
            existingMessage.remove();
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
            ${message}
        `;

        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);

        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }

    clearMessage() {
        const message = document.querySelector('.message');
        if (message) {
            message.remove();
        }
    }

    confirmAction(message) {
        return confirm(message);
    }

    showHelp() {
        document.getElementById('helpModal').style.display = 'block';
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    showAbout() {
        alert('Advanced CGPA Calculator v2.0\n\nA comprehensive tool for calculating and tracking your academic performance.\n\nFeatures:\n• Multiple grading systems\n• Target CGPA calculator\n• Semester tracking\n• Data import/export\n• Dark mode\n• Auto-save functionality\n\nDeveloped by Darpan');
    }
}

// Global Functions (for HTML onclick handlers)
let calculator;

function toggleTheme() {
    calculator.toggleTheme();
}

function updateGradingSystem() {
    calculator.updateGradingSystem();
}

function addSubject() {
    calculator.addSubject();
}

function removeSubject(button) {
    calculator.removeSubject(button);
}

function clearAll() {
    calculator.clearAll();
}

function calculateTargetGrades() {
    calculator.calculateTargetGrades();
}

function saveSemester() {
    calculator.saveSemester();
}

function exportData() {
    calculator.exportData();
}

function importData() {
    calculator.importData();
}

function handleFileImport(event) {
    calculator.handleFileImport(event);
}

function showHelp() {
    calculator.showHelp();
}

function showAbout() {
    calculator.showAbout();
}

function closeModal(modalId) {
    calculator.closeModal(modalId);
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    calculator = new CGPACalculator();
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('helpModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}
