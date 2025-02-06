import "../../index.css";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { FolderDTO, ProjectDTO } from "../../shared/types";
import { useNavigate } from "react-router-dom";
import "./index.css";
import {
  Box,
  Button,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import moment from "moment";
import DeleteIcon from "@mui/icons-material/Delete";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import { clientApi } from "../../shared/apis";
import { toast } from "react-toastify";
import { AppBarLogin } from "../../shared/components/AppBarLogin";
import { useUserContext } from "../../shared/context/useContext";
import BatchDataLoadButtonModal from "./components/BatchDataLoadButtonModal";

const Home: React.FC = () => {
  const inputRefProject = useRef<HTMLInputElement>(null);

  const [projectsData, setProjecsData] = useState<ProjectDTO[] | null>(null);
  const navigate = useNavigate();
  const { user, logoutUser } = useUserContext();

  useEffect(() => {
    console.log("user", user);
    getProjectsByUser();
  }, [user]);

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

    if (file) {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          sessionStorage.setItem("loadeddata", JSON.stringify(json));

          navigate("/uprava-profilu/");
        } catch (error) {
          console.error("Chyba pri čítaní alebo spracovaní súboru:", error);
        }
      };

      reader.readAsText(file);
    }
  };

  const getProjectsByUser = async () => {
    const token = localStorage.getItem("token");
    if (user != undefined) {
      await clientApi
        .getProjectByUser(user.email, localStorage.getItem("token"))
        .then((response) => {
          console.log(response);

          setProjecsData(response.data);
        })
        .catch((error) => {
          console.error("Chyba pri získavaní dát zo servera:", error);
        })
        .finally(() => {});
    } else if (user == undefined && token != undefined) {

      if (token != undefined || token != null) {
        await clientApi
          .getProjectByToken(token)
          .then((response) => {
            setProjecsData(response.data);
          })
          .catch((error) => {
            console.error("Chyba pri získavaní dát zo servera:", error);
          })
          .finally(() => {});
      }
    } else {
      setProjecsData([]);
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
    navigate("/uprava-profilu/" + id);
  };

  return (
    <Box style={{ width: "100%", height: "100%" }}>
      <Box className="home-page">
        <AppBarLogin
          content={
            <>
              {user == undefined ? (
                <>
                  <Button
                    color="primary"
                    variant="text"
                    size="small"
                    component="a"
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                      width: "80px",
                      borderRadius: 100,
                      color: "rgba(59, 49, 119, 0.87)",
                      padding: "10px",
                      marginRight: "10px",

                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "#E2E3E8",
                      },
                    }}
                    onClick={() => {
                      navigate("/auth/prihlasenie/");
                    }}
                  >
                    <Typography fontWeight={600}>Prihlásenie</Typography>
                  </Button>
                  <Button
                    color="primary"
                    variant="text"
                    size="small"
                    component="a"
                    onClick={() => {
                      navigate("/auth/registracia/");
                    }}
                    sx={{
                      backgroundColor: "#BFC2D2",
                      width: "80px",
                      borderRadius: 100,
                      color: "rgba(59, 49, 119, 0.87)",
                      padding: "10px",

                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "#E2E3E8",
                      },
                    }}
                  >
                    <Typography fontWeight={600}>Registrácia</Typography>
                  </Button>
                </>
              ) : (
                <Box sx={{ display: "flex" }}>
                  <Typography
                    sx={{
                      color: "#454545",
                      fontWeight: "550",
                      marginRight: "10px",
                      marginTop: "10px",
                    }}
                  >
                    Prihlásený používateľ{" "}
                    <span style={{ color: "rgba(59, 49, 119, 0.87)" }}>
                      {user.email}
                    </span>
                  </Typography>
                  <Button
                    onClick={() => {
                      logoutUser();
                      toast.success("Boli ste úspešne odhlásený.");
                    }}
                    color="primary"
                    variant="text"
                    size="small"
                    sx={{
                      backgroundColor: "#BFC2D2",
                      width: "80px",
                      borderRadius: 100,
                      color: "rgba(59, 49, 119, 0.87)",
                      padding: "10px",

                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "#E2E3E8",
                      },
                    }}
                  >
                    {" "}
                    <Typography fontWeight={600}>Odhlásenie</Typography>
                  </Button>
                </Box>
              )}
            </>
          }
        />
        <Box
          className="emptydiv"
          sx={{
            minWidth: "100%",
            minHeight: "20%",
          }}
        ></Box>
        <Box className="button-container">
          <BatchDataLoadButtonModal />

          <Button
            onClick={handleSelectProject}
            sx={{
              backgroundColor: "rgba(59, 49, 119, 0.87)",
              width: "300px",
              borderRadius: "30px",
              color: "white",
              padding: "10px",
              marginBlock: "5px",
              textTransform: "none",
              height: "70px",

              "&:hover": {
                backgroundColor: "#625b92",
                color: "white",
              },
              boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px;",
            }}
          >
            <Typography fontWeight={500} fontSize={"20px"}>
              Načítať projekt
            </Typography>
          </Button>
          <input
            type="file"
            id="fileInput"
            ref={inputRefProject}
            onChange={handleUploadExportedProject}
            accept=".cprj"
            style={{ display: "none" }}
          />
        </Box>

        <Box
          className="welcomebar"
          sx={{
            position: "absolute",
            bottom: { xl: "100px", md: "50px", xs: "30px" },
          }}
        >
          {projectsData && projectsData?.length > 0 && (
            <>
              <Box className="small-text">
                {user ? (
                  "Projekty z databázy uložené k používateľskému profilu:"
                ) : (
                  <>
                    Projekty uložené v prehliadači bez prihlásenia sú viazané na
                    dočasný token a zostávajú dostupné po dobu 30 dní.
                    <br />
                    Po prihlásení sa tieto dáta automaticky presunú do vášho
                    profilu a zostanú bezpečne uložené.
                  </>
                )}
              </Box>
              <Box
                sx={{
                  width: "60%",
                  paddingTop: "10px",
                }}
              >
                <TableContainer
                  sx={{
                    maxHeight: "200px",
                    bottom: 10,
                    boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px;",
                  }}
                  component={Paper}
                >
                  <Table
                    sx={{ width: "100%", border: "none" }}
                    stickyHeader
                    size="small"
                    aria-label="a dense table"
                  >
                    <TableHead
                      sx={{ height: "40px", backgroundColor: "#bfc3d9" }}
                    >
                      <TableRow>
                        <TableCell>
                          <Typography
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: "550",
                              marginLeft: "10px",
                            }}
                          >
                            Názov projektu
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: "550",
                              marginLeft: "10px",
                            }}
                          >
                            Dátum vytvorenia
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            style={{
                              fontFamily: "Poppins",
                              fontWeight: "550",
                              marginLeft: "10px",
                            }}
                          >
                            Načítané priečinky
                          </Typography>
                        </TableCell>

                        <TableCell> </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody sx={{ maxHeight: "200px", overflowY: "auto" }}>
                      {projectsData.map((project: ProjectDTO) => {
                        return (
                          <TableRow>
                            <React.Fragment key={project.idproject}>
                              <TableCell sx={{ borderBlock: "none" }}>
                                <Typography>{project.projectname}</Typography>
                              </TableCell>
                              <TableCell sx={{ borderBlock: "none" }}>
                                <Typography>
                                  {moment(project.created).format(
                                    "DD.MM.YYYY HH:mm:ss"
                                  )}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ borderBlock: "none" }}>
                                <Typography>
                                  {project.folders
                                    .slice(0, 3)
                                    .map((folder: FolderDTO, index: number) => (
                                      <React.Fragment key={index}>
                                        {folder.foldername}
                                        {index < 2 && " "}
                                      </React.Fragment>
                                    ))}
                                  {project.folders.length > 3 && "..."}
                                </Typography>
                              </TableCell>
                              <TableCell
                                align="center"
                                sx={{ borderBlock: "none" }}
                              >
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
            </>
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
