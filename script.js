// Daten beim Laden der Seite abrufen
document.addEventListener('DOMContentLoaded', () => {
    renderExams();
    renderTodos();
});

// --- KLAUSUREN LOGIK ---

function addExam() {
    const subject = document.getElementById('examSubject').value;
    const type = document.getElementById('examType').value;
    const date = document.getElementById('examDate').value;

    if (!subject || !date) return alert("Bitte Fach und Datum eingeben!");

    const exams = JSON.parse(localStorage.getItem('exams')) || [];
    exams.push({ subject, type, date });
    
    localStorage.setItem('exams', JSON.stringify(exams));
    
    // Eingabefelder leeren
    document.getElementById('examSubject').value = '';
    document.getElementById('examDate').value = '';
    
    renderExams();
}

function renderExams() {
    const list = document.getElementById('examList');
    list.innerHTML = '';
    
    let exams = JSON.parse(localStorage.getItem('exams')) || [];

    // Chronologisch sortieren (nächstes Datum zuerst)
    exams.sort((a, b) => new Date(a.date) - new Date(b.date));

    exams.forEach((exam, index) => {
        const li = document.createElement('li');
        li.className = 'list-item';
        
        // Datum schön formatieren
        const dateObj = new Date(exam.date);
        const dateStr = dateObj.toLocaleDateString('de-DE');

        li.innerHTML = `
            <div class="item-content">
                <strong>${exam.subject} (${exam.type})</strong>
                <small>Datum: ${dateStr}</small>
            </div>
            <button class="delete-btn" onclick="deleteExam(${index})">Löschen</button>
        `;
        list.appendChild(li);
    });
}

function deleteExam(index) {
    let exams = JSON.parse(localStorage.getItem('exams'));
    exams.splice(index, 1);
    localStorage.setItem('exams', JSON.stringify(exams));
    renderExams();
}

// --- TO-DO LOGIK ---

function addTodo() {
    const task = document.getElementById('todoTask').value;
    const note = document.getElementById('todoNote').value;
    const date = document.getElementById('todoDate').value;

    if (!task || !date) return alert("Bitte Aufgabe und Fälligkeitsdatum eingeben!");

    const todos = JSON.parse(localStorage.getItem('todos')) || [];
    todos.push({ task, note, date });
    
    localStorage.setItem('todos', JSON.stringify(todos));
    
    document.getElementById('todoTask').value = '';
    document.getElementById('todoNote').value = '';
    document.getElementById('todoDate').value = '';
    
    renderTodos();
}

function renderTodos() {
    const list = document.getElementById('todoList');
    list.innerHTML = '';
    
    let todos = JSON.parse(localStorage.getItem('todos')) || [];

    // Chronologisch sortieren
    todos.sort((a, b) => new Date(a.date) - new Date(b.date));

    todos.forEach((todo, index) => {
        const li = document.createElement('li');
        li.className = 'list-item';
        
        const dateObj = new Date(todo.date);
        const dateStr = dateObj.toLocaleDateString('de-DE');

        li.innerHTML = `
            <div class="item-content">
                <strong>${todo.task}</strong>
                <small>Bis: ${dateStr}</small>
                ${todo.note ? `<span class="item-note">📝 ${todo.note}</span>` : ''}
            </div>
            <button class="delete-btn" onclick="deleteTodo(${index})">Erledigt</button>
        `;
        list.appendChild(li);
    });
}

function deleteTodo(index) {
    let todos = JSON.parse(localStorage.getItem('todos'));
    todos.splice(index, 1);
    localStorage.setItem('todos', JSON.stringify(todos));
    renderTodos();
}
