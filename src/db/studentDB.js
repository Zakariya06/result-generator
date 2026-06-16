import { openDB } from "idb";

const DB_NAME = "StudentDatabase";
const DB_VERSION = 3; // bumped again because store keyPath config changes
const STUDENTS_STORE = "students";
const SUBJECTS_STORE = "subjects";

const dbPromise = openDB(DB_NAME, DB_VERSION, {
  upgrade(db) {
    // Recreate stores with out-of-line keys so the IDB key field
    // is never injected into the stored object
    if (db.objectStoreNames.contains(STUDENTS_STORE)) {
      db.deleteObjectStore(STUDENTS_STORE);
    }
    db.createObjectStore(STUDENTS_STORE); // out-of-line key

    if (db.objectStoreNames.contains(SUBJECTS_STORE)) {
      db.deleteObjectStore(SUBJECTS_STORE);
    }
    db.createObjectStore(SUBJECTS_STORE); // out-of-line key
  },
  blocked() {
    console.warn(
      "IndexedDB upgrade blocked — please close other tabs running this app and refresh.",
    );
  },
  blocking() {
    dbPromise.then((db) => db.close());
  },
});

// ── Students ──────────────────────────────────────────────────────────────────

export async function saveStudentsToDB(students = []) {
  const db = await dbPromise;
  const tx = db.transaction(STUDENTS_STORE, "readwrite");

  await tx.store.clear();

  for (const student of students) {
    // Key lives outside the record — student object stored exactly as-is
    const idbKey = `${student.rollNumber || ""}_${student.institute || ""}`;
    await tx.store.put(student, idbKey);
  }

  await tx.done;
}

export async function getStudentsFromDB() {
  const db = await dbPromise;
  // Returns clean student objects with no injected `key` field
  return db.getAll(STUDENTS_STORE);
}

export async function clearStudentsDB() {
  const db = await dbPromise;
  await db.clear(STUDENTS_STORE);
}

// ── Subjects ──────────────────────────────────────────────────────────────────

export async function saveSubjectsToDB(subjects = []) {
  const db = await dbPromise;
  const tx = db.transaction(SUBJECTS_STORE, "readwrite");

  await tx.store.clear();

  for (const subject of subjects) {
    const idbKey = String(subject.id ?? subject.name ?? subject.subject ?? "");
    await tx.store.put(subject, idbKey);
  }

  await tx.done;
}

export async function getSubjectsFromDB() {
  const db = await dbPromise;
  return db.getAll(SUBJECTS_STORE);
}

export async function clearSubjectsDB() {
  const db = await dbPromise;
  await db.clear(SUBJECTS_STORE);
}
