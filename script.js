import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy, setDoc 
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referenzen
const examList = document.getElementById('examList');
const todoList = document.getElementById('todoList');

// --- 1. STUDIENFORTSCHRITT (CPs & NOTE) ---

// Wir nutzen nun setDoc mit { merge: true }, damit wir CPs und Note unabhängig speichern können
import { setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const creditDocRef = doc(db, "stats", "credits");

// Echtzeit-Update der Anzeige
onSnapshot(creditDocRef, (docSnap) => {
    // Standardwerte, falls die Datenbank leer ist
    let data = { compulsory: 0, elective: 0, thesis: 0, grade: 0 }; 
    
    if (docSnap.exists()) {
        data = docSnap.data();
    }

    // 1. Pflichtmodule (Max 173)
    updateCPUI('Compulsory', data.compulsory || 0, 173);
    
    // 2. Wahlpflicht (Max 25)
    updateCPUI('Elective', data.elective || 0, 25);
    
    // 3. Bachelor (Max 12)
    updateCPUI('Thesis', data.thesis || 0, 12);

    // 4. Notendurchschnitt (NEU)
    const currentGrade = data.grade || 0;
    // Text anzeigen (z.B. "2.3")
    document.getElementById('gradeText').innerText = currentGrade > 0 ? currentGrade.toFixed(1) : "-,-";
    // Input-Feld füllen (nur wenn User nicht tippt)
    const gradeInput = document.getElementById('valGrade');
    if(document.activeElement !== gradeInput) {
        gradeInput.value = currentGrade > 0 ? currentGrade : '';
    }
});

// Hilfsfunktion für die Balken
function updateCPUI(type, current, max) {
    const input = document.getElementById('val' + type);
    if(document.activeElement !== input) { 
        input.value = current;
    }
    document.getElementById('cpText' + type).innerText = `${current} / ${max} CP`;
    
    let percent = (current / max) * 100;
    if(percent > 100) percent = 100;
    document.getElementById('bar' + type).style.width = percent + "%";
}

// Speichern der CPs (nur die CPs, Note bleibt erhalten)
async function saveCredits() {
    const compVal = Number(document.getElementById('valCompulsory').value);
    const elecVal = Number(document.getElementById('valElective').value);
    const thesVal = Number(document.getElementById('valThesis').value);

    // WICHTIG: { merge: true } sorgt dafür, dass die Note nicht gelöscht wird!
    await setDoc(creditDocRef, {
        compulsory: compVal,
        elective: elecVal,
        thesis: thesVal
    }, { merge: true });
}

// Speichern der Note (nur die Note, CPs bleiben erhalten)
async function saveGrade() {
    let gradeVal = parseFloat(document.getElementById('valGrade').value.replace(',', '.')); // Komma zu Punkt

    if (isNaN(gradeVal) || gradeVal < 1.0 || gradeVal > 6.0) {
        return alert("Bitte eine gültige Note eingeben (z.B. 2.3)");
    }

    // WICHTIG: { merge: true } sorgt dafür, dass die CPs nicht gelöscht werden!
    await setDoc(creditDocRef, {
        grade: gradeVal
    }, { merge: true });
}

// Listener
document.getElementById('saveCpBtn').addEventListener('click', saveCredits);
document.getElementById('saveCpBtn2').addEventListener('click', saveCredits);
document.getElementById('saveCpBtn3').addEventListener('click', saveCredits);
document.getElementById('saveGradeBtn').addEventListener('click', saveGrade); // NEU

// --- 2. KLAUSUREN LOGIK ---

document.getElementById('addExamBtn').addEventListener('click', async () => {
    const subject = document.getElementById('examSubject').value;
    const type = document.getElementById('examType').value;
    const date = document.getElementById('examDate').value;
    const time = document.getElementById('examTime').value;
    const room = document.getElementById('examRoom').value;

    if (!subject || !date) return alert("Bitte Fach und Datum eingeben!");

    await addDoc(collection(db, "exams"), { subject, type, date, time, room });
    
    document.getElementById('examSubject').value = '';
    document.getElementById('examDate').value = '';
    document.getElementById('examTime').value = '';
    document.getElementById('examRoom').value = '';
});

// Echtzeit-Anzeige Klausuren
const qExams = query(collection(db, "exams"), orderBy("date", "asc"));

onSnapshot(qExams, (snapshot) => {
    const items = [];
    snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data(), isExam: true }));
    renderListWithGroups(examList, items);
});


// --- 3. TO-DO LOGIK ---

document.getElementById('addTodoBtn').addEventListener('click', async () => {
    const task = document.getElementById('todoTask').value;
    const note = document.getElementById('todoNote').value;
    const date = document.getElementById('todoDate').value;

    if (!task || !date) return alert("Bitte Aufgabe und Datum eingeben!");

    await addDoc(collection(db, "todos"), { task, note, date });
    
    document.getElementById('todoTask').value = '';
    document.getElementById('todoNote').value = '';
    document.getElementById('todoDate').value = '';
});

// Echtzeit-Anzeige To-Dos
const qTodos = query(collection(db, "todos"), orderBy("date", "asc"));

onSnapshot(qTodos, (snapshot) => {
    const items = [];
    snapshot.forEach(doc => items.push({ id: doc.id, ...doc.data(), isExam: false }));
    renderListWithGroups(todoList, items);
});

// Löschen Funktion (generisch für beide)
window.deleteItem = async (collectionName, id) => {
    if(confirm("Eintrag wirklich löschen?")) {
        await deleteDoc(doc(db, collectionName, id));
    }
}

// --- 5. NACHHOL-KLAUSUREN LOGIK (Backlog) ---

const addRetakeBtn = document.getElementById('addRetakeBtn');

if (addRetakeBtn) { // Sicherheitscheck: Gibt es den Button überhaupt?
    addRetakeBtn.addEventListener('click', async () => {
        const subject = document.getElementById('retakeSubject').value;
        const type = document.getElementById('retakeType').value;

        if (!subject) return alert("Bitte ein Fach eingeben!");

        try {
            // Versuch, in die Datenbank zu schreiben
            await addDoc(collection(db, "retakes"), { 
                subject: subject, 
                type: type 
            });
            
            // Wenn es geklappt hat: Feld leeren
            document.getElementById('retakeSubject').value = '';
            console.log("Erfolgreich gespeichert!"); // Nur für die Konsole

        } catch (error) {
            // Wenn ein Fehler passiert:
            console.error("Fehler beim Speichern:", error);
            alert("Fehler: " + error.message); 
            // Falls hier "permission-denied" steht, liegt es an den Regeln!
        }
    });
} else {
    console.error("ACHTUNG: Der Button 'addRetakeBtn' wurde im HTML nicht gefunden!");
}

// Echtzeit-Anzeige
const qRetakes = query(collection(db, "retakes"), orderBy("subject", "asc"));

onSnapshot(qRetakes, (snapshot) => {
    const list = document.getElementById('retakeList');
    if (!list) return; // Abbruch, falls Liste nicht im HTML ist

    list.innerHTML = ''; 

    if (snapshot.empty) {
        list.innerHTML = '<li style="padding:10px; color:#888; font-style:italic;">Keine offenen Nachhol-Klausuren 🎉</li>';
        return;
    }

    snapshot.forEach((docSnap) => {
        const item = docSnap.data();
        const li = document.createElement('li');
        li.className = 'list-item retake'; // Orange Klasse
        
        li.innerHTML = `
            <div class="item-content">
                <strong>${item.subject}</strong>
                <small>Typ: ${item.type} (Noch kein Termin)</small>
            </div>
            <button class="delete-btn" onclick="deleteItem('retakes', '${docSnap.id}')">
                Löschen
            </button>
        `;
        list.appendChild(li);
    });
});


// --- 4. NEUE RENDER-LOGIK MIT MONATEN ---

function renderListWithGroups(container, items) {
    container.innerHTML = '';
    
    let lastMonthYear = '';

    items.forEach(item => {
        const dateObj = new Date(item.date);
        
        // Formatieren: "Januar 2026"
        const currentMonthYear = dateObj.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
        const dateStr = dateObj.toLocaleDateString('de-DE');

        // PRÜFUNG: Ist das ein neuer Monat?
        if (currentMonthYear !== lastMonthYear) {
            // Neue Überschrift einfügen
            const header = document.createElement('h3');
            header.className = 'month-header';
            header.textContent = currentMonthYear;
            container.appendChild(header);
            
            lastMonthYear = currentMonthYear;
        }

        // Das eigentliche Item (wie vorher)
        const li = document.createElement('li');
        li.className = 'list-item';

        let content = '';
        let deleteCall = '';

        if (item.isExam) {
            // Layout für Klausur
            let details = `Datum: ${dateStr}`;
            if (item.time) details += ` • 🕒 ${item.time}`;
            if (item.room) details += ` • 📍 ${item.room}`;
            
            content = `
                <div class="item-content">
                    <strong>${item.subject} (${item.type})</strong>
                    <small>${details}</small>
                </div>
            `;
            deleteCall = `deleteItem('exams', '${item.id}')`;
        } else {
            // Layout für To-Do
            content = `
                <div class="item-content">
                    <strong>${item.task}</strong>
                    <small>Bis: ${dateStr}</small>
                    ${item.note ? `<span class="item-note">📝 ${item.note}</span>` : ''}
                </div>
            `;
            deleteCall = `deleteItem('todos', '${item.id}')`;
        }

        li.innerHTML = `
            ${content}
            <button class="delete-btn" onclick="${deleteCall}">
                ${item.isExam ? 'Löschen' : 'Erledigt'}
            </button>
        `;
        
        container.appendChild(li);
    });
}
