import "../../index.css";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { FolderDTO, ProjectDTO } from "../../shared/types";
import { useNavigate } from "react-router-dom";
import "./index.css";
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  tooltipClasses,
  Typography,
} from "@mui/material";
import moment from "moment";
import SettingsIcon from "@mui/icons-material/Settings";

import DeleteIcon from "@mui/icons-material/Delete";
import ModeEditIcon from "@mui/icons-material/ModeEdit";
import { clientApi } from "../../shared/apis";
import { toast } from "react-toastify";
import { AppBarLogin } from "../../shared/components/AppBarLogin";
import { useUserContext } from "../../shared/context/useContext";
import BatchDataLoadModal from "./components/BatchDataLoadModal";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import StorageIcon from "@mui/icons-material/Storage";
import UploadModal from "./components/UploadModal";
import SettingsDialog from "./components/SettingsDialog";

const Home: React.FC = () => {
  const inputRefProject = useRef<HTMLInputElement>(null);

  const [projectsData, setProjecsData] = useState<ProjectDTO[] | null>(null);
  const navigate = useNavigate();
  const { user, logoutUser } = useUserContext();
  const [dataUploadDialogOpen, setDataUploadDialogOpen] =
    useState<boolean>(false);
  const [batchProcessFoldersDialogOpen, setBatchProcessFoldersDialogOpen] =
    useState<boolean>(false);
  const [userSettingsDialogOpen, setUserSettingsDialogOpen] =
    useState<boolean>(false);
  useEffect(() => {
    if (user != undefined) {
      getProjectsByUser();
    } else {
      setProjecsData([]);
    }
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
    if (user != undefined && user != null) {
      await clientApi
        .getProjectByUser(user.email, localStorage.getItem("token"))
        .then((response) => {
          setProjecsData(response.data);
        })
        .catch((error) => {
          console.error("Chyba pri získavaní dát zo servera:", error);
        })
        .finally(() => {});
    } else if (user == null && token != undefined) {
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
    } else if (user == undefined) {
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
  const options = [
    {
      label: "Načítať dáta a vytvoriť projekt",
      icon: <CloudUploadIcon sx={{ fontSize: 48, color: "#625b92" }} />,
      value: "loadData",
      function: () => {
        setDataUploadDialogOpen(true);
      },
      disabled: false,
      tooltip: "",
    },
    {
      label: "Načítať projekt",
      icon: <AssignmentIcon sx={{ fontSize: 48, color: "#625b92" }} />,
      value: "loadProject",
      function: () => {
        handleSelectProject();
      },
      disabled: false,
      tooltip: "Načítanie projektu z exportovaného súboru.",
    },
    {
      label: "Spracovať viac priečinkov",
      icon: <FolderOpenIcon sx={{ fontSize: 48, color: "#625b92" }} />,
      value: "processFolders",
      function: () => {
        setBatchProcessFoldersDialogOpen(true);
      },
      disabled: false,
      tooltip: "Načítanie viacerých priečinkov naraz (zrýchlený režim).",
    },
    {
      label: "Databanka",
      icon: (
        <StorageIcon
          sx={{
            fontSize: 48,
            color: user !== null ? "#625b92" : "gray",
          }}
        />
      ),
      value: "databank",
      function: () => {
        if (user != null && user != undefined) {
          navigate("/databanka/");
        }
      },
      disabled: user == null || user == undefined ? true : false,
      tooltip:
        user != undefined || user != null
          ? "Prezeranie a správa databanky."
          : "Prezeranie a správa databanky. Prihláste sa pre prístup k databanke.",
    },
  ];

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
                  <IconButton
                    color="primary"
                    sx={{
                      marginLeft: "8px",
                      color: "rgba(59, 49, 119, 0.87)",
                    }}
                    onClick={() => setUserSettingsDialogOpen(true)}
                  >
                    <SettingsIcon />
                  </IconButton>

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

        <Box className="button-container">
          <UploadModal
            openModal={dataUploadDialogOpen}
            setOpenModal={setDataUploadDialogOpen}
          />
          <BatchDataLoadModal
            openModal={batchProcessFoldersDialogOpen}
            setOpenModal={setBatchProcessFoldersDialogOpen}
          />
          <Grid
            container
            spacing={3}
            justifyContent="center"
            sx={{
              padding: 3,
              width: "45%",
              height: "50%",
              paddingTop: { lg: 13, xl: 20 },
            }}
          >
            {options.map((option) => (
              <Tooltip
                enterDelay={500}
                slotProps={{
                  popper: {
                    sx: {
                      [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]:
                        {
                          marginTop: "2px",
                          fontSize: "12px",
                        },
                    },
                  },
                }}
                title={option.tooltip}
              >
                <Grid item key={option.value} xs={12} sm={6}>
                  <Card
                    sx={{
                      height: { lg: 140, xl: 200 },
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 5,
                      backgroundColor: "#f6f5f5",
                    }}
                  >
                    <CardActionArea
                      onClick={option.function}
                      sx={{ height: "100%" }}
                      disabled={option.disabled}
                    >
                      <CardContent sx={{ textAlign: "center" }}>
                        {option.icon}
                        <Typography
                          variant="h6"
                          sx={{
                            marginTop: 1,
                            color: option.disabled ? "gray" : "black",
                          }}
                        >
                          {option.label}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              </Tooltip>
            ))}
          </Grid>

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
            bottom: { xl: "100px", md: "50px", xs: "30px" },
          }}
        >
          {Array.isArray(projectsData) &&
            projectsData != null &&
            projectsData &&
            projectsData?.length > 0 && (
              <>
                <Box className="small-text">
                  {user ? (
                    "Projekty z databázy uložené k používateľskému profilu:"
                  ) : (
                    <>
                      Projekty uložené v prehliadači bez prihlásenia sú viazané
                      na dočasný token a zostávajú dostupné po dobu 30 dní.
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
                      borderRadius: "10px",
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
                          <TableCell sx={{ backgroundColor: "#bfc3d9" }}>
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
                          <TableCell sx={{ backgroundColor: "#bfc3d9" }}>
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
                          <TableCell sx={{ backgroundColor: "#bfc3d9" }}>
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

                          <TableCell sx={{ backgroundColor: "#bfc3d9" }}>
                            {" "}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody sx={{ maxHeight: "200px", overflowY: "auto" }}>
                        {Array.isArray(projectsData) &&
                          projectsData != null &&
                          projectsData.length > 0 &&
                          projectsData.map((project: ProjectDTO) => {
                            return (
                              <TableRow>
                                <React.Fragment key={project.idproject}>
                                  <TableCell sx={{ borderBlock: "none" }}>
                                    <Typography>
                                      {project.projectname}
                                    </Typography>
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
                                        .map(
                                          (
                                            folder: FolderDTO,
                                            index: number
                                          ) => (
                                            <React.Fragment key={index}>
                                              {folder.foldername}
                                              {index < 2 && " "}
                                            </React.Fragment>
                                          )
                                        )}
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
      <SettingsDialog
        open={userSettingsDialogOpen}
        onClose={() => setUserSettingsDialogOpen(false)}
      />
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
