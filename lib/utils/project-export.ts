import { ProjectWithOutputs } from "@/types/project";

/**
 * Export project data to JSON file
 */
export function exportProjectToFile(project: ProjectWithOutputs) {
  const dataStr = JSON.stringify(project, null, 2);
  const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
  
  const exportFileDefaultName = `${project.title.replace(/\s+/g, '_')}_export.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

/**
 * Import project from JSON file
 */
export async function importProjectFromFile(file: File): Promise<ProjectWithOutputs> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const project = JSON.parse(content);
        resolve(project);
      } catch (error) {
        reject(new Error("Invalid project file format"));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("Error reading file"));
    };
    
    reader.readAsText(file);
  });
}