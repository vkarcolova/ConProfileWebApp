import "../../index.css";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { FolderDTO, FileContent, ProjectDTO } from "../../shared/types";
import { useNavigate } from "react-router-dom";
import "./index.css";
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import moment from "moment";
import DeleteIcon from "@mui/icons-material/Delete";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import { clientApi } from "../../shared/apis";
import { toast } from "react-toastify";

const Home: React.FC = () => {
  const inputRefFolders = useRef<HTMLInputElement>(null);
  const inputRefProject = useRef<HTMLInputElement>(null);

  const [projectsData, setProjecsData] = useState<ProjectDTO[] | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    getProjectsByUser();
  }, []);

  const handleSelectFolder = () => {
    try {
      if (inputRefFolders.current) {
        inputRefFolders.current.click();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleUploadNewData = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      const selectedFiles = e.target.files;
      if (selectedFiles) {
        const filesArray: File[] = Array.from(selectedFiles).filter((file) => {
          const pathParts = file.webkitRelativePath.split("/");
          return file.name.endsWith(".sp") && pathParts.length === 2;
        });
        const folderName = filesArray[0].webkitRelativePath.split("/")[0];
        const loadedFiles: FileContent[] = [];

        const readFileAsync = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
              if (event.target) {
                resolve(event.target.result as string);
              } else {
                reject(new Error("Failed to read file."));
              }
            };
            reader.readAsText(file);
          });
        };

        for (const file of filesArray) {
          try {
            const result = await readFileAsync(file);
            const loadedFile: FileContent = {
              IDPROJECT: -1,
              FILENAME: file.name,
              FOLDERNAME: folderName,
              CONTENT: result,
            };

            loadedFiles.push(loadedFile);
          } catch (error) {
            console.error(error);
          }
        }
        try {
          await clientApi.createProject(loadedFiles).then((response) => {
            const token = response.data.token;
            localStorage.setItem("token", token);
            const objString = JSON.stringify(response.data.project);
            sessionStorage.setItem("loadeddata", objString);
            navigate("/create-profile/");
          });
        } catch (error) {
          console.error("Chyba pri načítavaní dát:", error);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleSelectProject = () => {
    try {
      if (inputRefProject.current) {
        inputRefProject.current.click();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleUploadExportedProject = async (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    console.log("gere");

    if (file) {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          sessionStorage.setItem("loadeddata", JSON.stringify(json));

          navigate("/create-profile/");
        } catch (error) {
          console.error("Chyba pri čítaní alebo spracovaní súboru:", error);
        }
      };

      reader.readAsText(file);
    }
  };

  const getProjectsByUser = async () => {
    const token = localStorage.getItem("token");
    if (token != undefined || token != null) {
      await clientApi
        .getProjectByUser(token)
        .then((response) => {
          setProjecsData(response.data);
        })
        .catch((error) => {
          console.error("Chyba pri získavaní dát zo servera:", error);
        })
        .finally(() => {});
    }
  };

  const handleDeleteProject = async (id: number) => {
    try {
      await clientApi.deleteProject(id);
      getProjectsByUser();
      toast.success("Projekt bol úspešne vymazaný.");
    } catch (error) {
      toast.error("Chyba pri získavaní dát zo servera:" + error);
    }
  };

  const handleEditProject = async (id: number) => {
    navigate("/create-profile/" + id);
  };

  return (
    <Box style={{ width: "100%", height: "100%" }}>
      <Box className="home-page">
        <Box
          className="emptydiv"
          sx={{ minWidth: "100%", minHeight: "30%" }}
        ></Box>
        <Box className="button-container">
          <button onClick={handleSelectFolder} className="large-button">
            Načítať dáta
          </button>
          <input
            ref={inputRefFolders}
            type="file"
            directory=""
            webkitdirectory=""
            onChange={handleUploadNewData}
            multiple
            style={{ display: "none" }}
          />
          <button className="large-button" onClick={handleSelectProject}>
            Načítať projekt
          </button>
          <input
            type="file"
            id="fileInput"
            ref={inputRefProject}
            onChange={handleUploadExportedProject}
            accept=".cprj"
            style={{ display: "none" }}
          />
        </Box>

        <Box className="welcomebar">
          <Box className="small-text">
            Informacie o webe, projekty ktoré tu už boli vytvorené...
          </Box>
          {projectsData && projectsData?.length > 0 && (
            <Box className="tab-container">
              {" "}
              <TableContainer sx={{ maxHeight: "200px" }} component={Paper}>
                <Table
                  sx={{ width: "100%" }}
                  stickyHeader
                  size="small"
                  aria-label="a dense table"
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        style={{ fontFamily: "Poppins", fontWeight: "bolder" }}
                      >
                        Názov projektu
                      </TableCell>
                      <TableCell
                        style={{ fontFamily: "Poppins", fontWeight: "bolder" }}
                      >
                        Dátum vytvorenia
                      </TableCell>
                      <TableCell
                        style={{ fontFamily: "Poppins", fontWeight: "bolder" }}
                      >
                        Načítané priečinky
                      </TableCell>
                      <TableCell> </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projectsData.map((project: ProjectDTO) => {
                      return (
                        <TableRow>
                          <React.Fragment key={project.idproject}>
                            <TableCell> {project.projectname} </TableCell>
                            <TableCell>
                              {moment(project.created).format(
                                "DD.MM.YYYY HH:mm:ss"
                              )}
                            </TableCell>
                            <TableCell>
                              {project.folders
                                .slice(0, 3)
                                .map((folder: FolderDTO, index: number) => (
                                  <React.Fragment key={index}>
                                    {folder.foldername}
                                    {index < 2 && " "}
                                  </React.Fragment>
                                ))}
                              {project.folders.length > 3 && "..."}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                aria-label="delete"
                                onClick={() =>
                                  handleDeleteProject(project.idproject)
                                }
                              >
                                <DeleteIcon />
                              </IconButton>
                              <IconButton
                                aria-label="edit"
                                onClick={() =>
                                  handleEditProject(project.idproject)
                                }
                              >
                                <ModeEditIcon />
                              </IconButton>
                            </TableCell>
                          </React.Fragment>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Home;

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}
