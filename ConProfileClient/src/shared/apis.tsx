import { toast } from "react-toastify";
import config from "../../config";
import {
  CalculatedDataDTO,
  UserDTO,
  ColumnDTO,
  DatabankDataToSend,
  DatabankExcelContentDTO,
  DataBankFileDTO,
  DataBankFolderDTO,
  ExcelContent,
  Factors,
  FileContent,
  MultiplyFolderDTO,
  ProjectDTO,
  ShareDatabankObjectDTO,
  UserAllDTO,
} from "./types";
import axiosInstance from "../pages/axiosInstance";

export const clientApi = {
  register: async (email: string, password: string, password2: string) => {
    const registerForm = {
      EMAIL: email,
      PASSWORD: password,
      PASSWORD2: password2,
    };

    return await axiosInstance.post(
      `${config.apiUrl}/User/Register`,
      registerForm,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },

  // register: async (email: string, password: string, password2: string) => {
  //   type RegisterFormDTO = {
  //     EMAIL: string;
  //     PASSWORD: string;
  //     PASSWORD2: string;
  //   };
  //   const registerForm: RegisterFormDTO = {
  //     EMAIL: email,
  //     PASSWORD: password,
  //     PASSWORD2: password2,
  //   };

  //   const token = localStorage.getItem("token");

  //   let customHeaders:
  //     | { "Content-Type": string }
  //     | { "Content-Type": string; Authorization: string } = {
  //     "Content-Type": "application/json",
  //   };

  //   if (token != undefined || token != null) {
  //     customHeaders = {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${localStorage.getItem("token")}`,
  //     };
  //   }
  //   return await axiosInstance.post(
  //     `${config.apiUrl}/User/Register`,
  //     JSON.stringify(registerForm),
  //     {
  //       headers: customHeaders,
  //     }
  //   );
  // },

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
    return await axiosInstance.post(
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

    return axiosInstance
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
      const response = await axiosInstance.get<Factors[]>(
        `${config.apiUrl}/Factor`
      );
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
    return await axiosInstance.get<ProjectDTO[]>(
      `${config.apiUrl}/Project/GetProjectsByToken/` + token,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  getProjectByUser: async (useremail: string, token: string | null) => {
    return await axiosInstance.get<ProjectDTO[]>(
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

    const response = await axiosInstance.get<ProjectDTO>(
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
    return await axiosInstance.post(
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

  createProjectFromDatabank: async (data: DatabankDataToSend) => {
    return await axiosInstance.post(
      `${config.apiUrl}/Project/CreateNewProjectWithDatabank`,
      JSON.stringify(data),
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

    return await axiosInstance.post(
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
    return await axiosInstance.post(
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
    return axiosInstance.post(
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
    return axiosInstance.post(
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
    return axiosInstance.post(
      `${config.apiUrl}/LoadedFolder/PostNewFolder`,
      loadedFiles
    );
  },

  postExcelToSession: async (excelFile: ExcelContent) => {
    return axiosInstance.post(
      `${config.apiUrl}/LoadedFolder/PostNewExcelToSession`,
      excelFile
    );
  },

  calculateEmptyData: async (column: ColumnDTO) => {
    return await axiosInstance.post(
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

  calculateEmptyData2: async (column: ColumnDTO) => {
    return await axiosInstance.post(
      `${config.apiUrl}/LoadedFolder/CalculateEmptyData2`,
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

  calculateAjustedData: async (column: ColumnDTO, exampleData: number[]) => {
    const AdjustedDataRequest = {
      Column: column,
      ReferenceSeries: exampleData,
    };
    return await axiosInstance.post(
      `${config.apiUrl}/LoadedFolder/CalculateAdjustedData`,
      JSON.stringify(AdjustedDataRequest),
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
    return await axiosInstance.post(
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

  replaceCalculatedData: async (calculatedData: CalculatedDataDTO) => {
    return await axiosInstance.post(
      `${config.apiUrl}/LoadedFolder/ReplaceCalculatedData`,
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
    return axiosInstance.post(
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
    return await axiosInstance.delete(
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

    return await axiosInstance.delete(
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
    return await axiosInstance.post(
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
    return await axiosInstance.post(
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
    return await axiosInstance.get<DataBankFolderDTO[]>(
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
    return await axiosInstance.post<DatabankExcelContentDTO[]>(
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

  deleteDatabankObject: async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token || token == null) return;
    return await axiosInstance.delete(
      `${config.apiUrl}/DataBank/DeleteDatabankObject/` + id,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          UserEmail: localStorage.getItem("useremail"),
        },
      }
    );
  },

  changeDatabankShareSettings: async (share: ShareDatabankObjectDTO) => {
    return await axiosInstance.post(
      `${config.apiUrl}/DataBank/ChangeDatabankShareSettings`,
      share,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
          "Content-Type": "application/json",
        },
      }
    );
  },

  getAllUserNames: async () => {
    return await axiosInstance.get<string[]>(`${config.apiUrl}/User/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
        UserEmail: localStorage.getItem("useremail"),
      },
    });
  },

  deleteUser: async (password: string, DeleteDatabankData: boolean) => {
    const request = {
      Password: password,
      DeleteDatabankData: DeleteDatabankData,
    };
    return await axiosInstance.post(
      `${config.apiUrl}/User/DeleteUser`,
      request,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
          "Content-Type": "application/json",
        },
      }
    );
  },

  changePassword: async (
    oldPassword: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    const request = {
      oldPassword: oldPassword,
      newPassword: newPassword,
      confirmPassword: confirmPassword,
    };
    return await axiosInstance.post(
      `${config.apiUrl}/User/ChangePassword`,
      request,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
          "Content-Type": "application/json",
        },
      }
    );
  },

  deleteUserByAdmin: async (userToDelete: string) => {
    return await axiosInstance.post(
      `${config.apiUrl}/User/DeleteUserByAdmin`,
      userToDelete,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
          "Content-Type": "application/json",
        },
      }
    );
  },

  // changeUsersRoleByAdmin: async (users: ChangeUserRoleByAdminDTO[]) => {
  //   return await axiosInstance.post(
  //     `${config.apiUrl}/User/ChangeUsersRoleByAdmin`,
  //     users,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         UserEmail: localStorage.getItem("useremail"),
  //         "Content-Type": "application/json",
  //       },
  //     }
  //   );
  // },

  changeUsersRoleByAdmin: async (user: UserDTO) => {
    return await axiosInstance.post(
      `${config.apiUrl}/User/ChangeUsersRoleByAdmin`,
      user,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
          "Content-Type": "application/json",
        },
      }
    );
  },

  getAllUsersForAdmin: async () => {
    return await axiosInstance.get<UserAllDTO[]>(
      `${config.apiUrl}/User/GetAllUsersForAdmin`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          UserEmail: localStorage.getItem("useremail"),
        },
      }
    );
  },

  verifyEmail: async (token: string) => {
    return await axiosInstance.get(`${config.apiUrl}/User/VerifyEmail`, {
      params: { token },
    });
  },

  forgotPassword: async (email: string) => {
    return await axiosInstance.post(
      `${config.apiUrl}/User/ForgotPassword`,
      JSON.stringify(email),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  },

  resetPassword: async (
    token: string | null,
    newPassword: string,
    confirmPassword: string
  ) => {
    return await axiosInstance.post(`${config.apiUrl}/User/ResetPassword`, {
      Token: token,
      NewPassword: newPassword,
      confirmPassword: confirmPassword,
    });
  },
};
