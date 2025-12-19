// Importiere die notwendigen Firebase Funktionen
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    deleteDoc, 
    doc, 
    query, 
    orderBy 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- DEINE FIREBASE CONFIG HIER EINFÜGEN ---
const firebaseConfig = {
  apiKey: "AIzaSyDhHEbyzIEour2a4TDkaU1LKCwaNLomTU4",
  authDomain: "studienplaner-431d4.firebaseapp.com",
  projectId: "studienplaner-431d4",
  storageBucket: "studienplaner-431d4.firebasestorage.app",
  messagingSenderId: "607950473164",
  appId: "1:607950473164:web:f98b623b291704fcae3f69",
  measurementId: "G-2GG4VZQGVV"
};

// Initialisierung
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referenzen auf HTML Elemente
const examList = document.getElementById('examList');
const todoList = document.getElementById('todoList');

// --- 1. KLAUSUREN LOGIK ---

// Hinzufügen
document.getElementById('addExamBtn').addEventListener('click', async () => {
    const subject = document.getElementById('examSubject').value;
    const type = document.getElementById('examType').value;
    const date = document.getElementById('examDate').value;

    if (!subject || !date) return alert("Bitte Fach und Datum eingeben!");

    try {
        await addDoc(collection(db, "exams"), {
            subject: subject,
            type: type,
            date: date
        });
        // Felder leeren
        document.getElementById('examSubject').value = '';
        document.getElementById('examDate').value = '';
    } catch (e) {
        console.error("Fehler beim Hinzufügen: ", e);
        alert("Fehler beim Speichern!");
    }
});

// Echtzeit-Anzeige (Automatisch sortiert)
const qExams = query(collection(db, "exams"), orderBy("date", "asc"));

onSnapshot(qExams, (snapshot) => {
    examList.innerHTML = ''; // Liste leeren
    
    snapshot.forEach((docSnap) => {
        const exam = docSnap.data();
        const li = document.createElement('li');
        li.className = 'list-item';
        
        const dateObj = new Date(exam.date);
        const dateStr = dateObj.toLocaleDateString('de-DE');

        li.innerHTML = `
            <div class="item-content">
                <strong>${exam.subject} (${exam.type})</strong>
                <small>Datum: ${dateStr}</small>
            </div>
            <button class="delete-btn" data-id="${docSnap.id}">Löschen</button>
        `;
        
        // Event Listener für den Löschen-Button direkt anhängen
        li.querySelector('.delete-btn').addEventListener('click', () => deleteExam(docSnap.id));
        
        examList.appendChild(li);
    });
});

async function deleteExam(id) {
    if(confirm("Klausur wirklich löschen?")) {
        await deleteDoc(doc(db, "exams", id));
    }
}


// --- 2. TO-DO LOGIK ---

// Hinzufügen
document.getElementById('addTodoBtn').addEventListener('click', async () => {
    const task = document.getElementById('todoTask').value;
    const note = document.getElementById('todoNote').value;
    const date = document.getElementById('todoDate').value;

    if (!task || !date) return alert("Bitte Aufgabe und Datum eingeben!");

    try {
        await addDoc(collection(db, "todos"), {
            task: task,
            note: note,
            date: date
        });
        document.getElementById('todoTask').value = '';
        document.getElementById('todoNote').value = '';
        document.getElementById('todoDate').value = '';
    } catch (e) {
        console.error("Fehler: ", e);
    }
});

// Echtzeit-Anzeige (Sortiert)
const qTodos = query(collection(db, "todos"), orderBy("date", "asc"));

onSnapshot(qTodos, (snapshot) => {
    todoList.innerHTML = '';
    
    snapshot.forEach((docSnap) => {
        const todo = docSnap.data();
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
            <button class="delete-btn" data-id="${docSnap.id}">Erledigt</button>
        `;

        li.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(docSnap.id));

        todoList.appendChild(li);
    });
});

async function deleteTodo(id) {
    await deleteDoc(doc(db, "todos", id));
}
