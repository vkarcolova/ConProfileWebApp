import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import axios from 'axios';
import { FolderDTO, LoadedFile, MultiplyFolderDTO, Profile, ProjectDTO } from '../../types';
import DataTable from '../../components/DataTable';
import './index.css'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Backdrop, Button, CircularProgress, Divider, IconButton, Input, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import { ScatterChart } from '@mui/x-charts/ScatterChart';

interface ChartData {
  data: number[];
  label: string;
}

interface StatData {
  max: number;
  min: number;
  std: number;
}

const CreateProfile: React.FC = () => {
  const [selectedFolder, setSelectedFolder] = useState(0);
  const [folderData, setFolderData] = useState<FolderDTO | null>(null);
  const [projectData, setProjectData] = useState<ProjectDTO | null>(null);
  const [profileData, setProfileData] = useState<Profile | null>(null);
  const [multiplied, setMultiplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData[] | null>(null);
  const [normalStatData, setNormalStatData] = useState<StatData | null>(null);
  const [multipliedStatData, setMultipliedStatData] = useState<StatData | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  var foldersExpand: string[] = [];

  useEffect(() => {
    loadProject();
  }, []);

  useEffect(() => {
    //nacitanie legendy && statistik
    handleSelectedFolder();

  }, [folderData]);

  const handleSelectedFolder = async () => {
    if (folderData) {
      const dynamicChartData: ChartData[] = folderData.data.map((data, index) => ({
        data: data.intensity,
        label: data.filename
      }));
      console.log("som tuuuuu");
      var allData: number[] = [];
      folderData.data.forEach(element => {
        allData = allData.concat(element.intensity);
      });
      console.log(allData);
      const normalMax: number = Math.max(...allData);
      const normalMin: number = Math.min(...allData);

      const mean = allData.reduce((sum, number) => sum + number, 0) / allData.length;
      const squaredDifferences = allData.map(number => Math.pow(number - mean, 2));
      const variance = squaredDifferences.reduce((sum, squaredDifference) => sum + squaredDifference, 0) / allData.length;
      const standardDeviation = Math.sqrt(variance);

      const normalStat: StatData = { max: normalMax, min: normalMin, std: standardDeviation };
      setNormalStatData(normalStat);

      if (folderData.profile) {
        dynamicChartData.push({
          data: folderData.profile,
          label: 'Profil'
        });

        const multipliedMax: number = Math.max(...folderData.profile);
        const multipliedMin: number = Math.min(...folderData.profile);

        const mean = folderData.profile.reduce((sum, number) => sum + number, 0) / folderData.profile.length;
        const squaredDifferences = folderData.profile.map(number => Math.pow(number - mean, 2));
        const variance = squaredDifferences.reduce((sum, squaredDifference) => sum + squaredDifference, 0) / folderData.profile.length;
        const multipliedStandardDeviation = Math.sqrt(variance);

        const multipliedStat: StatData = { max: multipliedMax, min: multipliedMin, std: multipliedStandardDeviation };
        setMultipliedStatData(multipliedStat);
      }

      setChartData(dynamicChartData);
      if (folderData.profile) {
        const profile: Profile = { excitation: folderData.excitation, profile: folderData.profile };
        setProfileData(profile);
      }
      setIsLoading(false);

    }
  };

  const loadProject = async () => {
    // Získanie dát zo servera
    axios.get<ProjectDTO>('https://localhost:44300/Project/GetProject/1')
      .then(response => {
        setProjectData(response.data);
        console.log(response.data);
        setFolderData(response.data.folders[selectedFolder])
        response.data.folders.forEach(element => {
          foldersExpand.push(element.foldername)
        });
        if (response.data.folders[selectedFolder].data[0].multipliedintensity)
          setMultiplied(true);

      })
      .catch(error => {
        console.error('Chyba pri získavaní dát zo servera:', error);
      })
      .finally(() => {
      });
  }
  const handleSelectFolder = () => {

    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const loadNewFolder = async (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const filesArray: File[] = Array.from(selectedFiles).filter((file) =>
        file.name.endsWith('.sp')
      );
      const folderName = filesArray[0].webkitRelativePath.split('/')[0];
      projectData?.folders.forEach(element => {
        if (element.foldername == folderName) {
          alert("Priečinok s týmto menom už bol nahraný.");
          return;
        }
      });
      console.log("pokracuje sa");
      const loadedFiles: LoadedFile[] = [];

      const readFileAsync = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target) {
              resolve(event.target.result as string);
            } else {
              reject(new Error('Failed to read file.'));
            }
          };
          reader.readAsText(file);
        });
      };

      for (const file of filesArray) {
        try {
          const result = await readFileAsync(file);
          const loadedFile: LoadedFile = {
            IDPROJECT: projectData?.idproject ? projectData?.idproject : -1,
            FILENAME: file.name,
            FOLDERNAME: folderName,
            CONTENT: result
          };

          loadedFiles.push(loadedFile);

        } catch (error) {
          console.error(error);
        }
      }
      sendData(loadedFiles);

    }
  };

  const sendData = async (files: LoadedFile[]) => {
    try {

      console.log(files);
      const response = await axios.post(
        'https://localhost:44300/LoadedData',
        JSON.stringify(files),
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }

      ).then(() => {
        alert("Oki doki!");
        loadProject();
      });

    } catch (error) {
      console.error('Chyba pri načítavaní dát:', error);
    }
  };

  const handleNodeSelect = (event: React.ChangeEvent<{}>, nodeId: string) => {
    projectData?.folders.forEach((value: FolderDTO, index: number) => {
      if (value.id.toString() == nodeId && selectedFolder != index) {
        setIsLoading(true);

        setMultiplied(false);

        setSelectedFolder(index);
        setFolderData(value);
        if (value.data[0].multipliedintensity != null) {
          console.log("je true");
          setMultiplied(true);
        } else {
          setMultiplied(false);
          console.log("je false");
        }
        handleSelectedFolder();

      }
    });
  };


  const multiplyButtonClick = async () => {
    const factors: number[] = [];
    const ids: number[] = [];

    folderData?.data.forEach(element => {
      console.log(element.spectrum);
      const autocompleteInput = document.getElementById(`autocomplete-${element.spectrum}`) as HTMLInputElement | null;
      const inputFactor = autocompleteInput ? parseFloat(autocompleteInput.value) : null;
      if (inputFactor) {
        factors.push(inputFactor);
        ids.push(element.id);
      }
      else {
        alert("Nesprávne zadané reporty!");
        return;
      }

    });
    if (factors.length > 0 && folderData && ids) {
      const dataToSend: MultiplyFolderDTO = {
        IDFOLDER: folderData.id,
        FACTORS: factors,
        IDS: ids,
      };
      try {
        const response = await axios.post(
          'https://localhost:44300/LoadedData/PostFactorsMultiply',
          JSON.stringify(dataToSend),
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }

        ).then(() => {
          console.log(dataToSend);
          loadProject();
        });

      } catch (error) {
        console.error('Chyba pri načítavaní dát:', error);

      }
    }

  };

  if (isLoading) {
    return <div>
    Loading
  </div>;
  }

  if (!folderData) {
    return <div>Error loading data.</div>;
  }


  return (
    <div>
   
    <div className='center-items main' style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
      
        <div className='first center-items' style={{ display: 'flex', flexDirection: 'column', width: '25%', minHeight: '100vh', paddingRight: '20px', paddingLeft: '20px' }}>
          <div style={{ marginBottom: '10px', display: 'flex', flexDirection: 'row', fontWeight: 'bold' }}>
            <h4 style={{ marginLeft: '5px', fontWeight: 'bold' }}>Názov projektu</h4>
            <Input
              placeholder="Názov projektu"
              value={projectData?.projectname}
              sx={{
                "--Input-minHeight": "41px"
              }}
              id='inputName'
            />
          </div>
          <div className='treeView' >

            <p>Načítané priečinky</p>
            <div className='treeViewWindow'>
              {projectData != undefined ?
                <TreeView
                  aria-label="controlled"
                  defaultCollapseIcon={<ExpandMoreIcon />}
                  defaultExpandIcon={<ChevronRightIcon />}
                  defaultExpanded={[projectData?.folders[0].id.toString()]}
                  onNodeSelect={handleNodeSelect}
                >
                  {projectData?.folders.map((folder, index) => (
                    <TreeItem nodeId={folder.id.toString()}
                      label={folder.foldername}
                      style={{ fontFamily: 'Poppins', fontSize: 'larger' }}
                    >
                      {folder.data.map((file, index) => (
                        <TreeItem nodeId={file.filename} label={file.filename}>
                        </TreeItem>
                      ))}
                    </TreeItem>

                  ))}
                </TreeView> : ""}

            </div>

            <div className='buttonContainer'>
              <IconButton aria-label="delete" onClick={handleSelectFolder}>
                <AddCircleOutlineRoundedIcon />
              </IconButton>
              <input
                ref={inputRef}
                type="file"
                directory=""
                webkitdirectory=""
                onChange={loadNewFolder}
                multiple
                style={{ display: 'none' }}
              />
              <button onClick={multiplyButtonClick} className="button-13" role="button" style={{ padding: '0px', margin: '0px' }}>Porovnať</button>
            </div>

            <div className='buttonContainerRows'>
              <button onClick={multiplyButtonClick} className="button-13" role="button" style={{ padding: '0px', margin: '0px' }}>Exportovať</button>
              <button onClick={multiplyButtonClick} className="button-1" role="button" style={{ fontSize: '13px', marginTop: '10px', fontWeight: 'bolder', margin: '0px', width: 'auto' }}>Uložiť projekt</button>

            </div>
          </div>
        </div>
        <div className='second' style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '75%', }}>
          <div className='upperContainer' style={{ flexDirection: 'row', display: 'flex', marginTop: '10px' }}>
            <div className="table-container" style={{ width: '55%' }}>
              <DataTable folderData={folderData} showAutocomplete={true} />
            </div>
            <div className='otherContainer' style={{ width: '45%' }}>
              <div className='buttonCreateProfil'>
                <button onClick={multiplyButtonClick} className="button-1" role="button" style={{ fontSize: '11px' }}>Vytvoriť profil</button>
                <button onClick={multiplyButtonClick} className="button-1" role="button" style={{ fontSize: '11px', marginLeft: 'auto', marginRight: '30px' }}>Exportovať graf</button>

              </div>

              {chartData ?
                <div style={{ height: '80%', padding: '10px' }}>
                  <ScatterChart
                    series={chartData.map((data, i) => ({
                      label: data.label,
                      data: data.data.map((v, index) => ({ x: folderData.excitation[index], y: v, id: v })),
                    }))}
                    yAxis={[{ min: 0 }]}
                    xAxis={[{ min: 250 }]}
                  />
                </div>
                : ""}

            </div>
          </div>
          <div className='bottomContainer' style={{ flexDirection: 'row', display: 'flex', marginTop: '10px' }}>
            <div className="table-container" style={{ width: '55%' }}>
              {multiplied && projectData ?
                <DataTable folderData={folderData} showAutocomplete={false} /> : <div className='emptyTable'></div>}
            </div>
            <div className='otherContainer' style={{ width: '45%', flexDirection: 'row', display: 'flex' }}>
              <div className='profileTab'>
                {multiplied && projectData ?
                  <div className="table-container">
                    <TableContainer component={Paper} >
                      <Table stickyHeader size="small" aria-label="a dense table">
                        <TableHead>
                          <TableRow>
                            <TableCell><div className='TableRowName'>Excitácie</div></TableCell>
                            <TableCell><div className='TableRowName'>Intenzity</div></TableCell>

                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>

                            <TableCell>
                              {profileData?.excitation.map((value, i) => (
                                <div key={i}>{value.toFixed(5)}</div>
                              ))}
                            </TableCell>
                            <TableCell>
                              {profileData?.profile.map((value, i) => (
                                <div key={i}>{value.toFixed(5)}</div>
                              ))}
                            </TableCell>

                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </div>
                  :
                  <div className='emptyTable'></div>}

              </div>
              <div className='statsContainer' >
                <div className='stats'>
                  <div className='statsHead'>
                    <h3>Štatistiky</h3>
                  </div>
                  <div style={{ flexDirection: 'row', display: 'flex', marginTop: '10px' }}>
                    <div className='statsColumn'>
                      <h4>Originálne</h4>
                      <div className='center-items' style={{ marginTop: '20px', flexDirection: 'row', display: 'flex', textAlign: 'center' }}>
                        <div>
                          <h4>Max</h4>
                          <h4>Min</h4>
                          <h4>Std</h4>
                        </div>
                        <div>
                          <h5>{normalStatData?.max.toFixed(5)}</h5>
                          <h5>{normalStatData?.min.toFixed(5)}</h5>
                          <h5>{normalStatData?.std.toFixed(5)}</h5>
                        </div>
                      </div>
                    </div>
                    {multiplied ?
                      <div className='statsColumn'>
                        <h4>Prenásobené</h4>
                        <div className='center-items' style={{ marginTop: '20px', flexDirection: 'row', display: 'flex', textAlign: 'center' }}>
                          <div>
                            <h4>Max</h4>
                            <h4>Min</h4>
                            <h4>Std</h4>
                          </div>
                          <div>
                            <h5>{multipliedStatData?.max.toFixed(5)}</h5>
                            <h5>{multipliedStatData?.min.toFixed(5)}</h5>
                            <h5>{multipliedStatData?.std.toFixed(5)}</h5>
                          </div>
                        </div>
                      </div>
                      : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
      
    </div>
    </div>
  );
};

export default CreateProfile;

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // extends React's HTMLAttributes
    directory?: string;
    webkitdirectory?: string;
  }
}