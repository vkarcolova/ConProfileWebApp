import axios from "axios";
import { toast } from "react-toastify";
import config from "../../config";
import { Factors, FileContent, MultiplyFolderDTO, ProjectDTO } from "./types";

export const clientApi = {
  updateProjectName: async (projectId: string, projectName: string) => {
    const dataToSend = new URLSearchParams({
      idproject: projectId,
      projectname: projectName,
    });

    return axios
      .put(`${config.apiUrl}/Project/UpdateProjectName?${dataToSend}`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then(() => {
        toast.success("Názov projektu bol zmenený.");
      })
      .catch(() => {
        toast.error("Nepodarilo sa zmeniť názov projektu.");
      });
  },

  getFactors: async (factors: Factors[]): Promise<Factors[]> => {
    try {
      const response = await axios.get<Factors[]>(`${config.apiUrl}/Factor`);
      factors = factors.filter(
        (localFactor) =>
          !response.data.some(
            (responseFactor) =>
              responseFactor.spectrum === localFactor.spectrum &&
              responseFactor.factor === localFactor.factor
          )
      );
      factors = [...response.data, ...factors];
    } catch (error) {
      console.error("Chyba pri získavaní dát zo servera:", error);
    }
    return factors;
  },

  getProjectByUser: async (token: string | null) => {
    return await axios.get<ProjectDTO[]>(
      `${config.apiUrl}/Project/GetProjectsByToken/` + token,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  loadProjectFromId: async (loadedProjectId: string): Promise<ProjectDTO> => {
    const idProject = parseInt(loadedProjectId, 10);

    const response = await axios.get<ProjectDTO>(
      `${config.apiUrl}/Project/GetProject/${idProject}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
    return response.data;
  },

  createProject: async (loadedFiles: FileContent[]) => {
    const token = localStorage.getItem("token");

    let customHeaders:
      | { "Content-Type": string }
      | { "Content-Type": string; Authorization: string } = {
      "Content-Type": "application/json",
    };

    if (token != undefined || token != null) {
      customHeaders = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      };
    }
    return await axios.post(
      `${config.apiUrl}/Project/CreateNewProject`,
      JSON.stringify(loadedFiles),
      {
        headers: customHeaders,
      }
    );
  },

  postFolderToProject: async (loadedFiles: FileContent[]) => {
    return axios.post(
      `${config.apiUrl}/LoadedFolder/PostNewFolderToProject`,
      JSON.stringify(loadedFiles),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
  },

  postFolderToSession: async (loadedFiles: FileContent[]) => {
    return axios.post(
      `${config.apiUrl}/LoadedFolder/PostNewFolder`,
      loadedFiles
    );
  },

  postFolderMultiply: async (dataToSend: MultiplyFolderDTO) => {
    return axios.post(
      `${config.apiUrl}/LoadedFolder/PostFactorsMultiply`,
      JSON.stringify(dataToSend),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },

  deleteProject: async (projectId: number) => {
    const token = localStorage.getItem("token");
    if (!token || token == null) return;
    return await axios.delete(
      `${config.apiUrl}/Project/DeleteProject/` + projectId,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  deleteFoldersFromProject: async (folderIds: number[], projectId: string) => {
    const token = localStorage.getItem("token");
    if (!token || token == null) return;
    const request = {
      projectid: parseInt(projectId),
      folderids: folderIds,
    };

    console.log(JSON.stringify(request));
    return await axios.delete(
      `${config.apiUrl}/Project/DeleteFoldersFromProject`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: request,
      }
    );
  },
};
