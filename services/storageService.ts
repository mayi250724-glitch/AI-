
import { StoryboardData } from "../types";
import { getApiConfig } from "./geminiService";
import { getAuthHeader } from "./authService";
import Dexie, { Table } from 'dexie';

export interface ProjectRecord {
  id: string;
  title: string;
  synopsis: string;
  updatedAt: number;
  data: StoryboardData;
}

// Singleton instance using direct instantiation and type casting
const db = new Dexie('YesirDB') as Dexie & {
  projects: Table<ProjectRecord, string>;
};

// Define Schema
db.version(1).stores({
  projects: 'id, title, updatedAt'
});

// Explicitly open the database to ensure it appears in DevTools immediately
db.open()
  .then(() => {
    console.log("✅ IndexedDB [YesirDB] successfully opened.");
  })
  .catch((err) => {
    console.error("❌ Failed to open IndexedDB. If you are using file:// protocol, please use a local server (http://localhost).", err);
  });

// Legacy Migration Helper
const migrateFromLocalStorage = async () => {
    try {
        const STORAGE_KEY = 'yesir_projects_history';
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            console.log("Migrating legacy projects to IndexedDB...");
            const projects: ProjectRecord[] = JSON.parse(raw);
            if (Array.isArray(projects) && projects.length > 0) {
                // Bulk add to IndexedDB
                await db.projects.bulkPut(projects);
                console.log(`Migrated ${projects.length} projects.`);
                // Clear localStorage to free up space
                localStorage.removeItem(STORAGE_KEY);
            }
        }
    } catch (e) {
        console.warn("Migration failed", e);
    }
};

// Run migration on module load
migrateFromLocalStorage();

export const saveProject = async (data: StoryboardData) => {
  if (!data) return;
  const config = getApiConfig();

  if (config.enableBackend) {
      // --- BACKEND MODE ---
      try {
          const response = await fetch(`${config.backendUrl}/projects`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  ...getAuthHeader()
              },
              body: JSON.stringify({
                  title: data.title,
                  synopsis: data.synopsis,
                  data: data
              })
          });
          
          if (!response.ok) {
              console.error("Failed to save to backend");
          }
      } catch (e) {
          console.error("Backend save error", e);
      }
  } else {
      // --- LOCAL MODE (IndexedDB) ---
      try {
          // Check if a project with this title already exists to update it
          const existing = await db.projects.where('title').equals(data.title).first();
          
          const record: ProjectRecord = {
            id: existing ? existing.id : Date.now().toString(),
            title: data.title,
            synopsis: data.synopsis,
            updatedAt: Date.now(),
            data: data
          };

          // Use put (Insert or Update)
          await db.projects.put(record);
          console.log(`Saved project "${data.title}" to IndexedDB`);

          // Optional: Limit total projects to prevent infinite growth (e.g., keep last 50)
          const count = await db.projects.count();
          if (count > 50) {
              const oldest = await db.projects.orderBy('updatedAt').first();
              if (oldest) {
                  await db.projects.delete(oldest.id);
              }
          }
      } catch (e) {
          console.error("IndexedDB save error", e);
          if (e instanceof Error && e.name === 'QuotaExceededError') {
              alert("本地存储空间已满，请删除一些旧项目。");
          }
      }
  }
};

export const getProjects = async (): Promise<ProjectRecord[]> => {
  const config = getApiConfig();

  if (config.enableBackend) {
      // --- BACKEND MODE ---
      try {
          const response = await fetch(`${config.backendUrl}/projects`, {
              method: 'GET',
              headers: {
                  ...getAuthHeader()
              }
          });
          if (response.ok) {
              const data = await response.json();
              return data as ProjectRecord[];
          }
      } catch (e) {
          console.error("Backend load error", e);
      }
      return [];
  } else {
      // --- LOCAL MODE (IndexedDB) ---
      try {
          // Get all projects, sorted by updatedAt descending (newest first)
          return await db.projects.orderBy('updatedAt').reverse().toArray();
      } catch (e) {
          console.error("IndexedDB load error", e);
          return [];
      }
  }
};

export const deleteProject = async (id: string) => {
  const config = getApiConfig();

  if (config.enableBackend) {
      // --- BACKEND MODE ---
      try {
          await fetch(`${config.backendUrl}/projects/${id}`, {
              method: 'DELETE',
              headers: { ...getAuthHeader() }
          });
      } catch (e) {
          console.error("Backend delete error", e);
      }
  } else {
      // --- LOCAL MODE (IndexedDB) ---
      try {
          await db.projects.delete(id);
      } catch (e) {
          console.error("IndexedDB delete error", e);
      }
  }
};

export const getProject = async (id: string): Promise<ProjectRecord | undefined> => {
     return await db.projects.get(id);
};
