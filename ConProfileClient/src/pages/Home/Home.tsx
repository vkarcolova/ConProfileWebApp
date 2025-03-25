import "../../index.css";
import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { FolderDTO, ProjectDTO } from "../../shared/types";
import { useNavigate } from "react-router-dom";
import "./index.css";

import {
  Backdrop,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Tooltip,
  tooltipClasses,
  Typography,
} from "@mui/material";
import FolderIcon from "@mui/icons-material/Folder";

import moment from "moment";
import SettingsIcon from "@mui/icons-material/Settings";
import GroupIcon from "@mui/icons-material/Group";
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
    console.log(user);
    if (user != undefined && user != null) {
      console.log("getProjectsByUser");
      getProjectsByUser();
    } else if (user == undefined && user != null) {
      console.log("setProjecsData");
      setProjecsData([]);
    } else if (user == null) {
      console.log("navigate");
      navigate("/auth/prihlasenie/");
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
    // const token = localStorage.getItem("token");
    if (user != undefined && user != null) {
      await clientApi
        .getProjectByUser(user.email, localStorage.getItem("token"))
        .then((response) => {
          const data: ProjectDTO[] = response.data;
          setProjecsData(data);
        })
        .catch((error) => {
          console.error("Chyba pri získavaní dát zo servera:", error);
        })
        .finally(() => {});
      // }  else if (user == null && token != undefined) {
      //   if (token != undefined || token != null) {
      //     await clientApi
      //       .getProjectByToken(token)
      //       .then((response) => {
      //         setProjecsData(response.data);
      //       })
      //       .catch((error) => {
      //         console.error("Chyba pri získavaní dát zo servera:", error);
      //       })
      //       .finally(() => {});
      //   }
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
      tooltip: "Prezeranie a správa databanky.",
    },
  ];

  if (user === null) {
    navigate("/auth/prihlasenie/");
    return null;
  }

  if (user === undefined) {
    return (
      <Backdrop
        open={true}
        sx={(theme) => ({ color: "#fff", zIndex: theme.zIndex.drawer + 1 })}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    );
  }

  return (
    <Box sx={{ width: "100%", maxHeight: "100%", overflowY: "auto" }}>
      {user != undefined && user != null && (
        <Box className="home-page">
          <SettingsDialog
            open={userSettingsDialogOpen}
            onClose={() => setUserSettingsDialogOpen(false)}
          />
          <AppBarLogin
            content={
              <>
                <Box sx={{ display: "flex" }}>
                  <Typography
                    sx={{
                      color: "#454545",
                      fontWeight: "550",
                      marginRight: "10px",
                      marginTop: "10px",
                    }}
                  >
                    Prihlásený {user.role == "admin" ? "admin " : "používateľ "}
                    <span style={{ color: "rgba(59, 49, 119, 0.87)" }}>
                      {user.email}
                    </span>
                  </Typography>
                  {user.role == "admin" && (
                    <IconButton
                      color="primary"
                      sx={{
                        color: "rgba(59, 49, 119, 0.87)",
                      }}
                      onClick={() => navigate("/pouzivatelia")}
                    >
                      <GroupIcon />
                    </IconButton>
                  )}
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
              spacing={2}
              justifyContent="center"
              sx={{
                padding: 3,
                width: "45%",
                maxHeight: "50%",
                paddingTop: { sm: 14, lg: 14, xxl: 20 },
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
                        height: { md: 150, lg: 150, xxl: 200 },
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
                    Projekty z databázy uložené k používateľskému profilu:
                  </Box>
                  <Box
                    sx={{
                      width: "60%",
                      paddingTop: { lg: 1, xl: 2 },
                    }}
                  >
                    <Paper
                      sx={{
                        borderRadius: "12px",
                        boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 12px",
                        maxHeight: "30vh",
                        overflowY: "auto",
                        marginBottom: "20px",
                      }}
                    >
                      <List>
                        {projectsData.map((project, index) => {
                          const displayedFolders = project.folders.slice(0, 3);
                          const hasMoreFolders = project.folders.length > 3;

                          return (
                            <React.Fragment key={project.idproject}>
                              <ListItem
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  "&:hover": { backgroundColor: "#f5f5f5" },
                                  transition: "0.3s ease-in-out",
                                }}
                              >
                                <FolderIcon
                                  sx={{
                                    marginRight: "10px",
                                    color: "#625b92",
                                  }}
                                />

                                {/* Názov projektu + dátum */}
                                <ListItemText
                                  primary={
                                    <Typography fontWeight="500">
                                      {project.projectname}
                                    </Typography>
                                  }
                                  secondary={`Vytvorené: ${moment(project.created).format("DD.MM.YYYY HH:mm:ss")}`}
                                />

                                {/* Zoznam nahraných priečinkov */}
                                <Box sx={{ flex: 1, ml: 1, mr: 5 }}>
                                  <Typography
                                    variant="body2"
                                    color="textSecondary"
                                  >
                                    <strong>Priečinky:</strong>{" "}
                                    {displayedFolders.map(
                                      (folder: FolderDTO, index: number) => (
                                        <React.Fragment key={index}>
                                          {folder.foldername}
                                          {index < displayedFolders.length - 1
                                            ? ", "
                                            : ""}
                                        </React.Fragment>
                                      )
                                    )}
                                    {hasMoreFolders && (
                                      <Tooltip
                                        title={project.folders
                                          .slice(3)
                                          .map((folder) => folder.foldername)
                                          .join(", ")}
                                      >
                                        <Typography
                                          variant="body2"
                                          color="primary"
                                          component="span"
                                          sx={{ cursor: "pointer", ml: 1 }}
                                        >
                                          + {project.folders.length - 3} ďalších
                                        </Typography>
                                      </Tooltip>
                                    )}
                                  </Typography>
                                </Box>

                                {/* Akčné tlačidlá */}
                                <ListItemSecondaryAction>
                                  <IconButton
                                    aria-label="edit"
                                    onClick={() =>
                                      handleEditProject(project.idproject)
                                    }
                                    sx={{ color: "gray" }}
                                  >
                                    <ModeEditIcon />
                                  </IconButton>
                                  <IconButton
                                    aria-label="delete"
                                    onClick={() =>
                                      handleDeleteProject(project.idproject)
                                    }
                                    sx={{ color: "error.main" }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </ListItemSecondaryAction>
                              </ListItem>
                              {index < projectsData.length - 1 && <Divider />}
                            </React.Fragment>
                          );
                        })}
                      </List>
                    </Paper>
                  </Box>
                </>
              )}
          </Box>
        </Box>
      )}
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
