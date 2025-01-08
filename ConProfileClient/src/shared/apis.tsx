import axios from "axios";
import { toast } from "react-toastify";
import config from "../../config";
import {
  ColumnDTO,
  Factors,
  FileContent,
  MultiplyFolderDTO,
  ProjectDTO,
} from "./types";

export const clientApi = {
  register: async (email: string, password: string, password2: string) => {
    type RegisterFormDTO = {
      EMAIL: string;
      PASSWORD: string;
      PASSWORD2: string;
    };
    const registerForm: RegisterFormDTO = {
      EMAIL: email,
      PASSWORD: password,
      PASSWORD2: password2,
    };

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
      `${config.apiUrl}/User/Register`,
      JSON.stringify(registerForm),
      {
        headers: customHeaders,
      }
    );
  },

  login: async (email: string, password: string) => {
    type LoginDTO = {
      EMAIL: string;
      PASSWORD: string;
    };
    const loginUser: LoginDTO = { EMAIL: email, PASSWORD: password };

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
      `${config.apiUrl}/User/Login`,
      JSON.stringify(loginUser),
      {
        headers: customHeaders,
      }
    );
  },

  updateProjectName: async (projectId: string, projectName: string) => {
    const dataToSend = new URLSearchParams({
      idproject: projectId,
      projectname: projectName,
    });

    return axios
      .put(`${config.apiUrl}/Project/UpdateProjectName?${dataToSend}`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
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

  getProjectByToken: async (token: string | null) => {
    return await axios.get<ProjectDTO[]>(
      `${config.apiUrl}/Project/GetProjectsByToken/` + token,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  getProjectByUser: async (useremail: string, token: string | null) => {
    return await axios.get<ProjectDTO[]>(
      `${config.apiUrl}/Project/GetProjectsByUser/` + useremail,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          UserEmail: useremail,
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
          UserEmail: localStorage.getItem("useremail"),
        },
      }
    );
    return response.data;
  },

  createProject: async (loadedFiles: FileContent[]) => {
    return await axios.post(
      `${config.apiUrl}/Project/CreateNewProject`,
      JSON.stringify(loadedFiles),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
        },
      }
    );
  },

  batchProcessFolders: async (loadedFiles: FileContent[]) => {
    return await axios.post(
      `${config.apiUrl}/LoadedFolder/BatchProcessFolders`,
      JSON.stringify(loadedFiles),
      {
        headers: {
          "Content-Type": "application/json",
        },
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
          UserEmail: localStorage.getItem("useremail"),
        },
      }
    );
  },

  calculateEmptyData: async (column: ColumnDTO) => {
    return await axios.post(
      `${config.apiUrl}/LoadedFolder/CalculateEmptyData`,
      JSON.stringify(column),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
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
        headers: {
          Authorization: `Bearer ${token}`,
          UserEmail: localStorage.getItem("useremail"),
        },
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

    return await axios.delete(
      `${config.apiUrl}/Project/DeleteFoldersFromProject`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          UserEmail: localStorage.getItem("useremail"),
          "Content-Type": "application/json",
        },
        data: request,
      }
    );
  },
};
