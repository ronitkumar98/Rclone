// src/db.js
import { openDB } from 'idb';

const DB_NAME = 'RemixFiles';
const STORE_NAME = 'files';

export async function initDB() {
  console.log('Initializing database');
  const db = await openDB(DB_NAME, 1, {
    upgrade(db) {
      console.log('Upgrading database, creating object store');
      db.createObjectStore(STORE_NAME);
    },
  });
  const defaultFolders = ['artifacts/', 'contracts/'];
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (const folder of defaultFolders) {
    if (!(await store.getKey(folder))) {
      console.log('Creating default folder:', folder);
      await store.put(null, folder);
    }
  }
  await tx.done.catch(err => console.error('Init transaction failed:', err));
  console.log('Database initialized with default folders');
  // Verify initial state
  const allKeys = await db.getAllKeys(STORE_NAME);
  console.log('Initial DB state:', allKeys);
  return db;
}

export async function getAllPaths() {
  const db = await initDB();
  const paths = await db.getAllKeys(STORE_NAME);
  console.log('All paths:', paths);
  return paths;
}

export async function getPathContent(path) {
  const db = await initDB();
  const content = await db.get(STORE_NAME, path);
  console.log('Retrieved content for:', { path, content });
  return content || null;
}

export async function savePath(path, content = null) {
  if (!path || typeof path !== 'string') {
    throw new Error('Invalid path: must be a non-empty string');
  }
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  console.log('Saving to DB:', { path, content });
  await store.put(content, path);
  await tx.done.catch(err => console.error('Save transaction failed:', err));
  console.log('Saved to DB:', { path, content });
  // Verify save
  const savedContent = await db.get(STORE_NAME, path);
  console.log('Verified save:', { path, savedContent });
}

export async function deletePath(path) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  console.log('Deleting from DB:', path);
  await store.delete(path);
  await tx.done.catch(err => console.error('Delete transaction failed:', err));
}

export async function pathExists(path) {
  const db = await initDB();
  const exists = (await db.getKey(STORE_NAME, path)) !== undefined;
  console.log('Path exists check:', { path, exists });
  return exists;
}

export async function getAllFiles() {
  const db = await initDB();
  const allPaths = await db.getAllKeys(STORE_NAME);
  const files = {};
  for (const path of allPaths) {
    const content = await db.get(STORE_NAME, path);
    if (content !== null) {
      files[path] = { content };
    }
  }
  console.log('All files retrieved:', files);
  return files;
}

export async function getFolderChildren(folderPath) {
  const db = await initDB();
  const allPaths = await db.getAllKeys(STORE_NAME);
  const children = allPaths.filter(path => path.startsWith(folderPath) && path !== folderPath);
  console.log('Folder children for:', { folderPath, children });
  return children;
}