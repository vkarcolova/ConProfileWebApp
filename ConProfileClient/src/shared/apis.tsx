import axios from "axios";
import { toast } from "react-toastify";
import config from "../../config";
import {
  CalculatedDataDTO,
  ColumnDTO,
  DatabankExcelContentDTO,
  DataBankFileDTO,
  DataBankFolderDTO,
  ExcelContent,
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

  createProjectFromDatabank: async (ids: string[]) => {
    return await axios.post(
      `${config.apiUrl}/Project/CreateNewProjectWithDatabank`,
      JSON.stringify(ids),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
        },
      }
    );
  },

  createProjectWithExcel: async (
    data: string[][],
    headers: string[],
    name: string
  ) => {
    const content: ExcelContent = {
      data: data,
      header: headers,
      name: name,
    };

    return await axios.post(
      `${config.apiUrl}/Project/CreateNewProjectWithExcel`,
      JSON.stringify(content),
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

  postExcelToProject: async (excelFile: ExcelContent) => {
    return axios.post(
      `${config.apiUrl}/LoadedFolder/PostNewExcelToProject`,
      JSON.stringify(excelFile),
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

  postExcelToSession: async (excelFile: ExcelContent) => {
    return axios.post(
      `${config.apiUrl}/LoadedFolder/PostNewExcelToSession`,
      excelFile
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

  saveCalculatedData: async (calculatedData: CalculatedDataDTO) => {
    return await axios.post(
      `${config.apiUrl}/LoadedFolder/AddCalculatedData`,
      JSON.stringify(calculatedData),
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
        },
      }
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

  uploadExcelToDatabank: async (data: DataBankFileDTO) => {
    return await axios.post(
      `${config.apiUrl}/DataBank/UploadExcelToDatabank`,
      data,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
          "Content-Type": "application/json",
        },
      }
    );
  },

  uploadFolderToDatabank: async (folder: DataBankFolderDTO) => {
    return await axios.post(
      `${config.apiUrl}/DataBank/UploadFolderToDatabank`,
      folder,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
          "Content-Type": "application/json",
        },
      }
    );
  },

  getAllDatabankData: async () => {
    return await axios.get<DataBankFolderDTO[]>(
      `${config.apiUrl}/DataBank/GetAllDatabankData/`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
        },
      }
    );
  },

  getExcelContents: async (ids: string[]) => {
    return await axios.post<DatabankExcelContentDTO[]>(
      `${config.apiUrl}/DataBank/GetExcelsForUpload/`,
      ids,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
        },
      }
    );
  },
};
