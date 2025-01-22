import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React, { useState, useEffect, ChangeEvent, useRef } from "react";
import Home from "@mui/icons-material/HomeRounded";
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
  ColumnDTO,
  CalculatedDataDTO,
} from "../../shared/types";
import DataTable from "../../shared/components/DataTable";
import "./index.css";
import {
  Box,
  CircularProgress,
  Grid,
  IconButton,
  Skeleton,
  Tooltip,
  tooltipClasses,
} from "@mui/material";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import { ScatterChart } from "@mui/x-charts/ScatterChart";
import { useNavigate, useParams } from "react-router-dom";
import Comparison from "../Comparison/Comparison";
import { emptyTable } from "../../shared/styles";
import { ExportMenu } from "./Components/ExportMenu";
import { SaveToDbButton } from "./Components/SaveToDbButton";
import { ProfileDataTable } from "./Components/ProfileDataTable";
import { StatsBox } from "./Components/StatsBox";
import { ProjectNameInput } from "./Components/ProjectNameInput";
import { clientApi } from "../../shared/apis";
import { FolderTreeView } from "./Components/FolderTreeView";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import { NunuButton } from "../../shared/components/NunuButton";
import { UserMenu } from "./Components/UserMenu";
import CalculateData from "../CalculateData/CalculateDataButtonDialog";

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

  useEffect(() => {
    //console.log(projectData);
  }, [projectData]);

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
      emptyDataColums: [],
    };

    if (folderData.profile) {
      fillMultipliedFolder(allFolderData);
    }
    allFolderData.tableData = processDataForTable(allFolderData);
    const emptyColumns: ColumnDTO[] = [];
    allFolderData.tableData.intensities.forEach((column) => {
      dynamicChartData.push({ data: column.intensities, label: column.name });

      if (column.intensities.some((x) => x === undefined)) {
        emptyColumns.push({
          intensities: column.intensities,
          name: column.name,
          excitations: allFolderData.tableData!.excitation,
        });
      }
    });
    if (allFolderData.multiplied) {
      dynamicChartData.filter((item) => item.label !== "Profil");

      dynamicChartData.push({
        data: allFolderData.profileData.profile,
        label: "Profil",
      });
    }
    allFolderData.emptyDataColums = emptyColumns;
    allFolderData.chartData = dynamicChartData;
    return allFolderData;
  };

  const fillMultipliedFolder = (folder: AllFolderData) => {
    if (folder.folderData.profile) {
      let allData: number[] = [];

      folder.folderData.data.forEach((file) => {
        const intensities: number[] = file.intensity
          .filter((dto) => dto.multipliedintensity !== undefined)
          .map((dto) => dto.multipliedintensity!);
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
        row < project.folders[selectedFolder].excitation.length;
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

      for (
        let file = 0;
        file < project.folders[selectedFolder].data.length;
        file++
      ) { 
        project.folders[selectedFolder].data[file].factor = factors[file];
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
      const comparefolders: FolderDTO[] = foldersToCompare || [];
      comparefolders.push(project.folders[selectedFolder]);
      setFoldersToCompare(comparefolders);
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
          let intensities: (IntensityDTO | undefined)[] = [];
          intensities = folder.folderData.excitation.map((value) => {
            const singleIntensity = file.intensity.find(
              (x) => x.excitation === value
            );
            return singleIntensity ? singleIntensity : undefined;
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
        let intensities: (IntensityDTO | undefined)[] = [];

        intensities = folder.folderData.excitation.map((value) => {
          const singleIntensity = file.intensity.find(
            (x) => x.excitation === value
          );
          return singleIntensity;
        });

        const column: TableDataColumn = {
          name: file.filename,
          intensities: intensities.map((x) => (x ? x?.intensity : undefined)),
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
    if (projectName === projectData?.projectname) return;

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
      const projectCopy: ProjectDTO = {
        ...projectData!,
        folders: [...projectData!.folders],
      };

      projectCopy.folders = projectCopy.folders.filter(
        (folder) => !selectedFolders.includes(folder.foldername)
      );

      const updatedFolders = projectFolders.filter(
        (folderData) =>
          !selectedFolders.includes(folderData.folderData.foldername)
      );

      setProjectData(projectCopy);
      setProjectFolders(updatedFolders);
      saveSessionData(projectCopy);
    }
    setDeletingFolders(false);
    setSelectedFolder(0);
  };

  const saveCalculatedColumn = async (
    column: ColumnDTO,
    calculatedIntensities: number[], //toto su cele data z nejakeho dovodu  chceme ibe tie dopocitane a bude to oke todooo
    excitation: number[]
  ): Promise<boolean> => {
    console.log(excitation);
    console.log(calculatedIntensities);

    const columnToRewrite = projectFolders[selectedFolder].folderData.data.find(
      (x) => x.filename === column.name
    );
    const columntToRewriteIndex = projectFolders[
      selectedFolder
    ].folderData.data.findIndex((x) => x.filename === column.name);

    if (columnToRewrite === undefined) return false;

    if (loadedProjectId) {
      const excitations: number[] = [];
      const intensities: number[] = [];

      for (let i = 0; i < calculatedIntensities.length; i++) {
        if (calculatedIntensities[i] !== undefined) {
          
            excitations.push(excitation[i]);
            intensities.push(calculatedIntensities[i]);
        }
      }

      const calculatedColumn: CalculatedDataDTO = {
        calculatedintensities: intensities,
        excitacions: excitations,
        idfile: columnToRewrite.id,
      };

      await clientApi.saveCalculatedData(calculatedColumn).catch(() => {
        toast.error("Chyba pri ukladaní dát.");
        return false;
      });
      loadProjectFromId();
    } else {
      for (let i = 0; i < calculatedIntensities.length; i++) {
          columnToRewrite.intensity.push({
            excitation: excitation[i],
            intensity: calculatedIntensities[i],
          });
        
      }
      columnToRewrite.intensity.sort((a, b) => a.excitation - b.excitation);
      const projectCopy: ProjectDTO = projectData!;
      const updatedFolders = projectFolders;
      projectCopy.folders[selectedFolder].data[columntToRewriteIndex] =
        columnToRewrite;

      updatedFolders[selectedFolder] = await fillFolder(
        projectCopy.folders[selectedFolder]
      );
      updatedFolders[selectedFolder].tableData = await processDataForTable(
        updatedFolders[selectedFolder]
      );

      setProjectData(projectCopy);
      setProjectFolders(updatedFolders);
      saveSessionData(projectCopy);
    }
    // ak je načítaný projekt z databázy tak nahratie dát do databázy ako nove dáta do filu
    // bude to iba vlozenie calculated ziadne prepisovanie
    // ak je faktor tak aj to ale
    // je factor v allfolderdata?
    // pridat aj multiply ak na colume je multiplied a prepocitat profil podla faktoru
    // pridat do session

    //alebo kaslat a dat upozornenie nech si sami prepocitaju factor?
    return true;
  };

  if (!projectFolders) {
    return <Box>Error loading data.</Box>;
  }

  return (
    <>
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
          <Grid
            container
            spacing={1}
            sx={{ justifyContent: "center" }}
            className="center-items main"
          >
            <Comparison
              open={dialogOpen}
              onClose={() => {
                setDialogOpen(false);
              }}
              folders={foldersToCompare}
            />

            <Grid
              item
              xs={2}
              className="center-items"
              style={{
                flexDirection: "column",
                minHeight: "100vh",
              }}
            >
              <Box
                className="treeView"
                sx={{
                  backgroundColor: "#515060",
                  color: "white",
                  "& *": {
                    color: "inherit",
                  },
                  justifyContent: "space-between",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      marginTop: "40px",
                      marginBottom: "10px",
                      display: "flex",
                      justifyContent: "center", // Horizontálne centrovanie
                      alignItems: "center",
                      flexDirection: "row",
                      fontWeight: "bold",
                      maxWidth: "90%",
                    }}
                  >
                    <IconButton
                      sx={{
                        width: "35px",
                        height: "35px",
                        color: "white",
                        position: "absolute",
                        top: 5,
                        left: 5,
                        opacity: "0.7",
                      }}
                      onClick={() => {
                        navigate("/");
                      }}
                    >
                      <Home sx={{ fontSize: "30px" }} />
                    </IconButton>

                    <h4 style={{ marginLeft: "5px", fontWeight: "500" }}>
                      Názov projektu
                    </h4>
                    <ProjectNameInput
                      savedProjectName={projectData?.projectname}
                      saveToProjectData={handleProjectNameSave}
                    />
                  </Box>
                  <Box
                    sx={{
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
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
                                color: "white",
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
                              color: "white",
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

                      <NunuButton
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
                        bgColour="f8f6ff"
                        textColour="rgba(59, 49, 119, 0.87)"
                        hoverTextColour="rgba(59, 49, 119, 0.87)"
                        hoverBgColour="#E2E3E8"
                        label="Porovnať"
                        sx={{
                          backgroundColor: "#f8f6ff",
                          marginTop: { md: "15px", lg: "15px" },
                          width: "60%",
                          height: { md: "45px", borderRadius: "20px" },
                        }}
                        fontSize="14px"
                      />
                    </Box>
                  </Box>
                  <Box className="buttonContainerRows">
                    <ExportMenu
                      projectData={projectData}
                      multiplied={!projectFolders[selectedFolder].multiplied}
                      tableData={projectFolders[selectedFolder].tableData!}
                      profile={projectFolders[selectedFolder].profileData}
                    />
                    <SaveToDbButton
                      loadedProjectId={loadedProjectId}
                      projectData={projectData}
                      setLoading={setIsLoading}
                    />
                  </Box>
                </Box>
                <UserMenu />
              </Box>
            </Grid>
            <Grid
              item
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: "100vh",
                width: "75%",
              }}
              xs={10}
            >
              <Grid
                container
                direction="column"
                sx={{
                  justifyContent: "center",
                  alignItems: "stretch",
                }}
              >
                <Grid
                  container
                  sx={{
                    flexDirection: "row",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    minHeight: "50vh",
                    height: "50vh",
                  }}
                >
                  <Grid
                    item
                    sx={{
                      width: "55%",
                      height: "100%",
                      paddingTop: "25px",
                      paddingRight: "10px",
                    }}
                  >
                    <DataTable
                      tableData={projectFolders[selectedFolder].tableData!}
                      showAutocomplete={true}
                      factors={factors}
                    />
                  </Grid>
                  <Grid
                    className="otherContainer"
                    style={{
                      width: "45%",
                      height: "100%",
                      paddingTop: "10px",
                      paddingLeft: "4px",
                      backgroundColor: "#bebdbd",
                      boxShadow: "inset 10px 0 10px -10px rgba(0, 0, 0, 0.1)",
                    }}
                  >
                    <Box className="buttonCreateProfil">
                      <NunuButton
                        onClick={multiplyButtonClick}
                        bgColour="#4e4b6f"
                        textColour="white"
                        hoverTextColour="white"
                        hoverBgColour="#1f1e2c"
                        label="Vytvoriť profil"
                        sx={{
                          maxWidth: "150px",
                          height: "40px",
                          borderRadius: "30px",
                          width: "100%",
                        }}
                        fontSize="12px"
                      />

                      <NunuButton
                        onClick={() => {}}
                        bgColour="#4e4b6f"
                        textColour="white"
                        hoverTextColour="white"
                        hoverBgColour="#1f1e2c"
                        label="Exportovať graf"
                        sx={{
                          maxWidth: "150px",
                          height: "40px",
                          borderRadius: "30px",
                          width: "100%",
                          marginRight: "10px",
                        }}
                        fontSize="12px"
                      />
                    </Box>
                    {projectFolders[selectedFolder].chartData ? (
                      <Box
                        style={{
                          height: "83%",
                          margin: "10px",
                          backgroundColor: "white",
                          boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 10px",
                        }}
                      >
                        <ScatterChart
                          series={projectFolders[selectedFolder].chartData.map(
                            (data) => ({
                              label: data.label,
                              data: data.data
                                .map(
                                  (v, index) =>
                                    v !== undefined
                                      ? {
                                          x: projectFolders[selectedFolder]
                                            .folderData.excitation[index],
                                          y: v,
                                          id: index,
                                        }
                                      : null // Ak je hodnota `undefined`, vrátim `null`
                                )
                                .filter((point) => point !== null), // Odstránim `null` hodnoty
                            })
                          )}
                          yAxis={[
                            {
                              min: projectFolders[selectedFolder].normalStatData
                                .min
                                ? projectFolders[selectedFolder].normalStatData
                                    .min
                                : 0,
                            },
                          ]}
                          xAxis={[{ min: 250 }]}
                          sx={{
                            backgroundColor: "white",
                          }}
                        />
                      </Box>
                    ) : (
                      ""
                    )}
                  </Grid>
                </Grid>
                <Grid
                  xs={12}
                  style={{
                    flexDirection: "row",
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    sx={{
                      height: "50vh",
                      width: "55%",
                      alignContent: "center",
                      display: "flex",
                      justifyContent: "center",
                      paddingRight: "10px",
                    }}
                  >
                    {isLoading ? (
                      <Skeleton />
                    ) : (
                      <>
                        {projectFolders[selectedFolder].multiplied &&
                        projectData ? (
                          <DataTable
                            tableData={
                              projectFolders[selectedFolder].tableData!
                            }
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
                      backgroundColor: "#bebdbd",
                      boxShadow: "inset 10px 0 10px -10px rgba(0, 0, 0, 0.1)",
                      paddingLeft: "8px",
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
                    <Box
                      sx={{
                        height: "100%",
                        width: "60%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <StatsBox
                        statsData={
                          projectFolders[selectedFolder].normalStatData
                        }
                        multipliedStatsData={
                          projectFolders[selectedFolder].multiplied
                            ? projectFolders[selectedFolder].multipliedStatData
                            : undefined
                        }
                      />

                      <CalculateData
                        columns={projectFolders[selectedFolder].emptyDataColums}
                        setColumns={(columns) => {
                          const folders = [...projectFolders];
                          folders[selectedFolder].emptyDataColums = columns;
                          setProjectFolders(folders);
                        }}
                        saveColumn={saveCalculatedColumn}
                      />
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </>
      )}
    </>
  );
};
export default CreateProfile;

declare module "react" {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    directory?: string;
    webkitdirectory?: string;
  }
}
