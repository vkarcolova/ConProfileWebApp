import { ToastContainer, Bounce, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React, { useState, useEffect, ChangeEvent, useRef } from "react";
import {
  FolderDTO,
  FileContent,
  MultiplyFolderDTO,
  Profile,
  ProjectDTO,
  Factors,
  TableDataColumn,
  IntensityDTO,
  TableData,
  AllFolderData,
  ChartData,
  StatData,
} from "../../shared/types";
import DataTable from "../../shared/components/DataTable";
import "./index.css";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  Skeleton,
  Tooltip,
  tooltipClasses,
} from "@mui/material";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { useNavigate, useParams } from "react-router-dom";
import Comparison from "../Comparison/Comparison";
import {
  basicButtonStyle,
  darkButtonStyle,
  emptyTable,
  greenButtonStyle,
} from "../../shared/styles";
import { ExportMenu } from "./Components/ExportMenu";
import { SaveToDbButton } from "./Components/SaveToDbButton";
import { ProfileDataTable } from "./Components/ProfileDataTable";
import { StatsBox } from "./Components/StatsBox";
import { ProjectNameInput } from "./Components/ProjectNameInput";
import { clientApi } from "../../shared/apis";
import { FolderTreeView } from "./Components/FolderTreeView";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
const CreateProfile: React.FC = () => {
  const navigate = useNavigate();
  const { id: loadedProjectId } = useParams<{ id: string }>();
  const [factors, setFactors] = React.useState<Factors[]>([]);

  const [selectedFolder, setSelectedFolder] = useState(0);
  const [projectData, setProjectData] = useState<ProjectDTO | null>(null);
  const [projectFolders, setProjectFolders] = useState<AllFolderData[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [foldersToCompare, setFoldersToCompare] = useState<FolderDTO[] | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [deletingFolders, setDeletingFolders] = useState(false);

  //const foldersExpand: string[] = [];

  // const currentFolderData = useMemo(() => {
  //   return projectFolders[selectedFolder];
  // }, [projectFolders, selectedFolder]);

  // useEffect(() => {
  //   console.log(selectedFolder);
  // }, [selectedFolder]);
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (loadedProjectId) {
          await loadProjectFromId();
        } else {
          const sessionData = sessionStorage.getItem("loadeddata");
          if (!sessionData) {
            navigate("/");
            return;
          }
          const obj = JSON.parse(sessionData) as ProjectDTO;
          setProjectData(obj);
          const comparefolders: FolderDTO[] = [];
          const folders: AllFolderData[] = [];
          obj.folders.forEach(async (folder) => {
            const filledFolder = await fillFolder(folder);
            if (filledFolder.multiplied) {
              comparefolders.push(folder);
            }
            folders.push(filledFolder);
          });
          setFoldersToCompare(comparefolders);

          setProjectFolders(folders);
        }
      } catch (error) {
        console.error("Chyba pri načítavaní dát:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [loadedProjectId, navigate]); //load project from id or session

  useEffect(() => {
    const fetchFactors = async () => {
      const factorsdata = localStorage.getItem("factorsdata");
      const localFactors: Factors[] = factorsdata
        ? JSON.parse(factorsdata)
        : [];
      const updatedFactors = await clientApi.getFactors(localFactors);
      setFactors(updatedFactors);
    };
    fetchFactors();
  }, []); //load factors

  const fillFolder = async (folderData: FolderDTO): Promise<AllFolderData> => {
    const dynamicChartData: ChartData[] = [];
    let allData: number[] = [];

    folderData.data.forEach((file) => {
      const intensities: number[] = file.intensity.map((dto) => dto.intensity);
      dynamicChartData.push({ data: intensities, label: file.filename });
      allData = allData.concat(intensities);
    });

    const normalStat: StatData = calculateStats(allData);

    const allFolderData: AllFolderData = {
      chartData: dynamicChartData,
      normalStatData: normalStat,
      multipliedStatData: { max: 0, min: 0, std: 0 },
      folderData: folderData,
      profileData: { excitation: [], profile: [] },
      multiplied: false,
    };

    if (folderData.profile) {
      fillMultipliedFolder(allFolderData);
    }
    allFolderData.tableData = processDataForTable(allFolderData);
    return allFolderData;
  };

  const fillMultipliedFolder = (folder: AllFolderData) => {
    if (folder.folderData.profile) {
      folder.chartData = folder.chartData.filter(
        (item) => item.label !== "Profil"
      );

      folder.chartData.push({
        data: folder.folderData.profile,
        label: "Profil",
      });

      let allData: number[] = [];

      folder.folderData.data.forEach((file) => {
        const intensities: number[] = file.intensity.map(
          (dto) => dto.multipliedintensity!
        );
        allData = allData.concat(intensities);
      });

      const multipliedStat: StatData = calculateStats(allData);

      const profile: Profile = {
        excitation: folder.folderData.excitation,
        profile: folder.folderData.profile,
      };

      folder.multipliedStatData = multipliedStat;
      folder.profileData = profile;
      folder.multiplied = true;
    }
  };

  const calculateStats = (allData: number[]): StatData => {
    const max: number = Math.max(...allData);
    const min: number = Math.min(...allData);

    const mean =
      allData.reduce((sum, number) => sum + number, 0) / allData.length;
    const squaredDifferences = allData.map((number) =>
      Math.pow(number - mean, 2)
    );
    const variance =
      squaredDifferences.reduce(
        (sum, squaredDifference) => sum + squaredDifference,
        0
      ) / allData.length;
    const standardDeviation = Math.sqrt(variance);

    const stats: StatData = {
      max: max,
      min: min,
      std: standardDeviation,
    };
    return stats;
  };

  const loadProjectFromId = async () => {
    if (loadedProjectId) {
      try {
        const project = await clientApi.loadProjectFromId(loadedProjectId);
        setProjectData(project);
        const comparefolders: FolderDTO[] = [];
        console.log(project.folders.length);

        const folders: AllFolderData[] = [];
        project.folders.forEach(async (folder) => {
          const filledFolder = await fillFolder(folder);
          if (filledFolder.multiplied) {
            comparefolders.push(folder);
          }
          folders.push(filledFolder);
        });
        setProjectFolders(folders);

        setFoldersToCompare(comparefolders);
      } catch (error) {
        console.error("Chyba pri získavaní dát zo servera:", error);
      }
    }
  };

  const loadNewFolder = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const filesArray: File[] = Array.from(selectedFiles).filter((file) =>
        file.name.endsWith(".sp")
      );
      const folderName = filesArray[0].webkitRelativePath.split("/")[0];
      if (
        projectData?.folders.some(
          (element) => element.foldername === folderName
        )
      ) {
        toast.info("Priečinok s rovnakým názvom už bol do projektu nahraný.");
        return;
      }
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
            IDPROJECT: projectData?.idproject ? projectData?.idproject : -1,
            FILENAME: file.name,
            FOLDERNAME: folderName,
            CONTENT: result,
          };

          loadedFiles.push(loadedFile);
        } catch (error) {
          console.error(error);
        }
      }
      if (loadedProjectId) {
        try {
          await clientApi.postFolderToProject(loadedFiles).then(() => {
            loadProjectFromId();
          });
        } catch (error) {
          console.error("Chyba pri načítavaní dát:", error);
        }
      } else {
        const project: ProjectDTO = { ...projectData! };

        try {
          await clientApi
            .postFolderToSession(loadedFiles)
            .then(async (response) => {
              const objString = response.data.folder as FolderDTO;
              const filledFolder = await fillFolder(objString);
              const folders: AllFolderData[] = projectFolders;
              folders.push(filledFolder);
              setProjectFolders(folders);

              project.folders.push(objString);
              setProjectData(project);
              saveSessionData(project);
            });
        } catch (error) {
          console.error("Chyba pri načítavaní dát:", error);
        }
      }
    }
  };

  const handleNodeSelect = (
    event: React.SyntheticEvent,
    nodeId: string | null
  ) => {
    const target = event.target as HTMLElement;
    const isExpandIconClick = target.closest(".MuiTreeItem-iconContainer");

    if (!isExpandIconClick) {
      projectData?.folders.forEach(async (value: FolderDTO, index: number) => {
        if (value.foldername.toString() == nodeId && selectedFolder != index) {
          setIsLoading(true);
          setSelectedFolder(index);
          setIsLoading(false);
        }
      });
    }
  };

  const handleSelectFolder = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const multiplyButtonClick = async () => {
    const factors: number[] = [];
    const ids: number[] = [];
    let wrongInput: boolean = false;

    const factorsToSave: Factors[] = [];

    projectFolders[selectedFolder].folderData.data.forEach((element) => {
      const autocompleteInput = document.getElementById(
        `autocomplete-${element.spectrum}`
      ) as HTMLInputElement | null;
      const inputFactor = autocompleteInput
        ? parseFloat(autocompleteInput.value)
        : null;

      if (inputFactor) {
        factors.push(inputFactor);
        ids.push(element.id);

        factorsToSave.push({ factor: inputFactor, spectrum: element.spectrum });
      } else {
        wrongInput = true;
      }
    });
    if (wrongInput) {
      toast.error("Chýbajúce alebo nesprávne zadané hodnoty faktorov.");
      toast("Chýbajúce alebo nesprávne zadané hodnoty faktorov.");

      return;
    }

    if (
      factors.length !==
        projectFolders[selectedFolder].folderData.data.length ||
      !projectFolders[selectedFolder].folderData ||
      !ids
    )
      return;

    saveFactorsToStorage(factorsToSave);

    if (loadedProjectId) {
      const dataToSend: MultiplyFolderDTO = {
        IDFOLDER: projectFolders[selectedFolder].folderData.id,
        FACTORS: factors,
        IDS: ids,
        EXCITATION: projectFolders[selectedFolder].folderData.excitation,
      };

      try {
        await clientApi.postFolderMultiply(dataToSend).then(() => {
          loadProjectFromId();
        });
      } catch (error) {
        console.error("Chyba pri načítavaní dát:", error);
      }
    } else {
      const project: ProjectDTO = { ...projectData! };

      const profile: number[] = [];
      for (
        let row = 0;
        row < project.folders[selectedFolder].data[0].intensity.length;
        row++
      ) {
        let max: number = Number.MIN_VALUE;
        for (
          let file = 0;
          file < project.folders[selectedFolder].data.length;
          file++
        ) {
          let multiplied: number | undefined = undefined;
          if (
            project.folders[selectedFolder].data[file].intensity[row] !=
            undefined
          ) {
            multiplied =
              project.folders[selectedFolder].data[file].intensity[row]
                .intensity * factors[file];
            project.folders[selectedFolder].data[file].intensity[
              row
            ].multipliedintensity = multiplied;
            if (multiplied > max) max = multiplied;
          }
        }
        profile.push(max);
      }
      const newProfile: Profile = {
        excitation: projectFolders[selectedFolder].folderData.excitation,
        profile: profile,
      };
      project.folders[selectedFolder].profile = profile;
      const folders: AllFolderData[] = projectFolders;
      folders[selectedFolder].folderData.profile = profile;
      folders[selectedFolder].profileData = newProfile;
      folders[selectedFolder].multiplied = true;
      folders[selectedFolder].tableData = processDataForTable(
        folders[selectedFolder]
      );

      fillMultipliedFolder(folders[selectedFolder]);
      setProjectFolders(folders);
      setProjectData(project);
      saveSessionData(project);
    }
  };

  const saveFactorsToStorage = async (factorsToSave: Factors[]) => {
    const factorsdata = localStorage.getItem("factorsdata");
    let localFactors: Factors[] = [];
    if (factorsdata) {
      localFactors.push(...(JSON.parse(factorsdata) as Factors[]));
    }

    const exists = (factor: Factors) => {
      return localFactors.some(
        (f) => f.spectrum === factor.spectrum && f.factor === factor.factor
      );
    };

    factorsToSave.forEach((factor) => {
      if (!exists(factor)) {
        localFactors.push(factor);
      }
    });

    if (localFactors.length > 25) localFactors = localFactors.slice(-25);
    const objString = JSON.stringify(localFactors);
    localStorage.setItem("factorsdata", objString);
  };

  const saveSessionData = (project: ProjectDTO) => {
    if (loadedProjectId) return;
    const objString = JSON.stringify(project);
    sessionStorage.setItem("loadeddata", objString);
  };

  const processDataForTable = (folder: AllFolderData): TableData => {
    let intensitiesColumns: TableDataColumn[] = [];
    const multipliedIntensitiesColumns: TableDataColumn[] = [];
    if (folder.tableData) {
      intensitiesColumns = folder.tableData.intensities;

      if (folder.multiplied) {
        folder.folderData.data.forEach((file) => {
          let intensities: (IntensityDTO | null)[] = [];
          intensities = folder.folderData.excitation.map((value) => {
            const singleIntensity = file.intensity.find(
              (x) => x.excitation === value
            );
            return singleIntensity ? singleIntensity : null;
          });
          const multipliedColumn: TableDataColumn = {
            name: file.filename,
            intensities: intensities.map((x) => x?.multipliedintensity),
          };
          multipliedIntensitiesColumns.push(multipliedColumn);
        });
      }
    } else {
      folder.folderData.data.forEach((file) => {
        let intensities: (IntensityDTO | null)[] = [];

        intensities = folder.folderData.excitation.map((value) => {
          const singleIntensity = file.intensity.find(
            (x) => x.excitation === value
          );
          return singleIntensity ? singleIntensity : null;
        });
        const column: TableDataColumn = {
          name: file.filename,
          intensities: intensities.map((x) => x?.intensity),
          spectrum: file.spectrum,
        };
        intensitiesColumns.push(column);
        if (folder.multiplied) {
          const multipliedColumn: TableDataColumn = {
            name: file.filename,
            intensities: intensities.map((x) => x?.multipliedintensity),
          };
          multipliedIntensitiesColumns.push(multipliedColumn);
        }
      });
    }

    const result: TableData = {
      excitation: folder.folderData.excitation,
      intensities: intensitiesColumns,
      multipliedintensities: multipliedIntensitiesColumns,
    };
    return result;
  };

  const handleProjectNameSave = async (projectName: string) => {
    console.log("here");

    const newProject: ProjectDTO = {
      ...projectData!,
      projectname: projectName,
    };
    setProjectData(newProject);

    if (loadedProjectId) {
      await clientApi.updateProjectName(loadedProjectId, projectName);
    } else {
      saveSessionData(newProject);
    }
  };

  const deleteProjectFolders = async (selectedFolders: string[]) => {
    if (loadedProjectId) {
      console.log("deleteProjectFolders");
      const folderIdToDelete: number[] = [];
      projectFolders.forEach((value) => {
        if (selectedFolders.includes(value.folderData.foldername))
          folderIdToDelete.push(value.folderData.id);
      });

      await clientApi
        .deleteFoldersFromProject(folderIdToDelete, loadedProjectId)
        .then(async () => {
          await loadProjectFromId();
          toast.success("Priečinky boli vymazané.");
        })
        .catch((error: unknown) => {
          if (axios.isAxiosError(error)) {
            toast.error(error.message);
          }
        });
    } else {
      const project: ProjectDTO = { ...projectData! };
      let folders: AllFolderData[] = projectFolders;
      const foldersToDelete: FolderDTO[] = [];
      project.folders.forEach((value) => {
        if (selectedFolders.includes(value.foldername)) {
          foldersToDelete.push(value);
        }
      });
      project.folders = project.folders.filter((value) =>
        selectedFolders.includes(value.foldername)
      );

      folders = folders.filter((value) =>
        selectedFolders.includes(value.folderData.foldername)
      );
      project.folders = project.folders.filter(
        (value) =>
          value.foldername !== project.folders[selectedFolder].foldername
      );

      setProjectData(project);
      setProjectFolders(folders);
      saveSessionData(project);
    }
    setDeletingFolders(false);
    setSelectedFolder(0);
  };

  if (!projectFolders) {
    return <Box>Error loading data.</Box>;
  }

  return (
    <Box>
      {isLoading ? (
        <Box
          sx={{
            width: "100%",
            height: "100vh",
            boxShadow: "none",
            backgroundColor: "#d5d9d9",
            alignContent: "center",
          }}
        >
          <CircularProgress
            sx={{
              "& svg": {
                "& circle": {
                  r: 20,
                },
              },
            }}
          />
        </Box>
      ) : (
        <>
          <Box
            className="center-items main"
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "flex-start",
            }}
          >
            <Comparison
              open={dialogOpen}
              onClose={() => {
                setDialogOpen(false);
              }}
              folders={foldersToCompare}
            />

            <Box
              className="first center-items"
              style={{
                display: "flex",
                flexDirection: "column",
                width: "25%",
                minHeight: "100vh",
                paddingRight: "20px",
                paddingLeft: "20px",
              }}
            >
              <Box
                style={{
                  marginBottom: "10px",
                  display: "flex",
                  flexDirection: "row",
                  fontWeight: "bold",
                }}
              >
                <h4 style={{ marginLeft: "5px", fontWeight: "500" }}>
                  Názov projektu
                </h4>
                <ProjectNameInput
                  savedProjectName={projectData?.projectname}
                  saveToProjectData={handleProjectNameSave}
                />
              </Box>
              <Box className="treeView">
                <FolderTreeView
                  projectData={projectData}
                  selectedFolder={selectedFolder}
                  handleNodeSelect={handleNodeSelect}
                  deleting={deletingFolders}
                  setDeleting={setDeletingFolders}
                  deleteProjectFolders={deleteProjectFolders}
                />
                <Box className="buttonContainer">
                  <Box
                    sx={{
                      marginTop: "5px",
                      justifyContent: "space-between",
                      width: "35%",
                    }}
                  >
                    {projectData?.folders.length != 0 && (
                      <Tooltip
                        slotProps={{
                          popper: {
                            sx: {
                              [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]:
                                {
                                  marginTop: "0px",
                                  fontSize: "12px",
                                },
                            },
                          },
                        }}
                        title="Vymazať priečinky z projektu"
                      >
                        <IconButton
                          sx={{
                            width: "35px",
                            height: "35px",
                          }}
                          onClick={() => {
                            setDeletingFolders(!deletingFolders);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}

                    <Tooltip
                      slotProps={{
                        popper: {
                          sx: {
                            [`&.${tooltipClasses.popper}[data-popper-placement*="bottom"] .${tooltipClasses.tooltip}`]:
                              {
                                marginTop: "0px",
                                fontSize: "12px",
                              },
                          },
                        },
                      }}
                      title="Pridať ďalší priečinok"
                    >
                      <IconButton
                        sx={{
                          width: "35px",
                          height: "35px",
                        }}
                        onClick={handleSelectFolder}
                      >
                        <AddCircleOutlineRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  <input
                    ref={inputRef}
                    type="file"
                    directory=""
                    webkitdirectory=""
                    onChange={loadNewFolder}
                    multiple
                    style={{ display: "none" }}
                  />
                  <Button
                    variant="contained"
                    onClick={() => {
                      if (
                        foldersToCompare != null &&
                        foldersToCompare.length < 2
                      )
                        toast.info(
                          "Pre porovnanie je potrebné mať vytvorené aspoň dva profily."
                        );
                      else setDialogOpen(true);
                    }}
                    role="button"
                    sx={{
                      ...basicButtonStyle,
                      ...greenButtonStyle,
                      marginBottom: "10px",
                      fontWeight: "bold",
                      marginTop: { md: "10px", lg: "5px" },
                      width: "60%",
                      fontSize: { md: "1.2rem", lg: "1.2rem" },
                      padding: { md: "1px" },
                      height: { md: "50px" },
                    }}
                  >
                    Porovnať
                  </Button>
                </Box>

                <Box className="buttonContainerRows">
                  <ExportMenu projectData={projectData} />
                  <SaveToDbButton
                    loadedProjectId={loadedProjectId}
                    projectData={projectData}
                    setLoading={setIsLoading}
                  />
                </Box>
              </Box>
            </Box>
            <Box
              className="second"
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                width: "75%",
              }}
            >
              <Box
                className="upperContainer"
                style={{
                  flexDirection: "row",
                  display: "flex",
                  marginTop: "10px",
                }}
              >
                <Box className="table-container" style={{ width: "55%" }}>
                  <DataTable
                    tableData={projectFolders[selectedFolder].tableData!}
                    showAutocomplete={true}
                    factors={factors}
                  />
                </Box>
                <Box className="otherContainer" style={{ width: "45%" }}>
                  <Box className="buttonCreateProfil">
                    <Button
                      variant="contained"
                      onClick={multiplyButtonClick}
                      role="button"
                      sx={{
                        ...basicButtonStyle,
                        ...darkButtonStyle,
                        marginLeft: "30px",
                        maxWidth: "150px",
                      }}
                    >
                      Vytvoriť profil
                    </Button>

                    <Button
                      variant="contained"
                      onClick={multiplyButtonClick}
                      role="button"
                      sx={{
                        ...basicButtonStyle,
                        ...darkButtonStyle,
                        marginLeft: "auto",
                        marginRight: "30px",
                        maxWidth: "150px",
                      }}
                    >
                      Exportovať graf
                    </Button>
                  </Box>
                  {projectFolders[selectedFolder].chartData ? (
                    <Box
                      style={{
                        height: "83%",
                        margin: "10px",
                        backgroundColor: "white",
                      }}
                    >
                      <ScatterChart
                        series={projectFolders[selectedFolder].chartData.map(
                          (data) => ({
                            label: data.label,
                            data: data.data.map((v, index) => ({
                              x: projectFolders[selectedFolder].folderData
                                .excitation[index],
                              y: v,
                              id: index,
                            })),
                          })
                        )}
                        yAxis={[{ min: 0 }]}
                        xAxis={[{ min: 250 }]}
                      />
                    </Box>
                  ) : (
                    ""
                  )}
                </Box>
              </Box>
              <Box
                className="bottomContainer"
                style={{
                  flexDirection: "row",
                  display: "flex",
                  marginTop: "10px",
                }}
              >
                <Box className="table-container" style={{ width: "55%" }}>
                  {isLoading ? (
                    <Skeleton />
                  ) : (
                    <>
                      {projectFolders[selectedFolder].multiplied &&
                      projectData ? (
                        <DataTable
                          tableData={projectFolders[selectedFolder].tableData!}
                          showAutocomplete={false}
                        />
                      ) : (
                        <Box sx={emptyTable}></Box>
                      )}
                    </>
                  )}
                </Box>
                <Box
                  style={{
                    width: "45%",
                    flexDirection: "row",
                    display: "flex",
                  }}
                >
                  <Box
                    sx={{
                      paddingRight: "10px",
                      paddingLeft: "10px",
                      width: "40%",
                    }}
                  >
                    {projectFolders[selectedFolder].multiplied &&
                    projectData ? (
                      <ProfileDataTable
                        profile={projectFolders[selectedFolder].profileData}
                      />
                    ) : (
                      <Box className="emptyTable"></Box>
                    )}
                  </Box>
                  <StatsBox
                    statsData={projectFolders[selectedFolder].normalStatData}
                    multipliedStatsData={
                      projectFolders[selectedFolder].multiplied
                        ? projectFolders[selectedFolder].multipliedStatData
                        : undefined
                    }
                  />
                </Box>
              </Box>
            </Box>
          </Box>
        </>
      )}
      <ToastContainer transition={Bounce} />
    </Box>
  );
};
export default CreateProfile;

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}
