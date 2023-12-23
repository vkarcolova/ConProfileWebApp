import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FolderDTO, MultiplyFolderDTO, ProjectDTO } from '../../types';
import DataTable from '../../components/DataTable';
import './index.css'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { TreeView } from '@mui/x-tree-view/TreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { Button, Divider, IconButton } from '@mui/material';
import AddCircleOutlineRoundedIcon from '@mui/icons-material/AddCircleOutlineRounded';
import { LineChart } from '@mui/x-charts/LineChart';
import { ScatterChart } from '@mui/x-charts/ScatterChart';

interface ChartData {
  data: number[];
  label: string;
}

const CreateProfile: React.FC = () => {
  const [selectedFolder, setSelectedFolder] = useState(0);
  const [folderData, setFolderData] = useState<FolderDTO | null>(null);
  const [projectData, setProjectData] = useState<ProjectDTO | null>(null);
  const [multiplied, setMultiplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedValues, setSelectedValues] = useState<number[]>([]); //to co je?
  const [chartData, setChartData] = useState<ChartData[] | null>(null);
  var foldersExpand: string[] = [];

  useEffect(() => {
    loadProject();
  }, []);

  useEffect(() => {
    //nacitanie legendy
    if (folderData) {
      const dynamicChartData: ChartData[] = folderData.data.map((data, index) => ({
        data: data.intensity,
        label: 'pv'
      }));

      setChartData(dynamicChartData);
      console.log(dynamicChartData);
    }

  }, [folderData]);

  const loadProject = async () => {
    // Získanie dát zo servera
    axios.get<ProjectDTO>('https://localhost:44300/Project/GetProject/1')
      .then(response => {
        setProjectData(response.data);
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
        setIsLoading(false);
      });
  }


  const multiplyButtonClick = async () => {
    console.log('Vybrané hodnoty:', selectedValues);
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
        console.log(dataToSend);
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
    return <div>Loading...</div>;
  }

  if (!folderData) {
    return <div>Error loading data.</div>;
  }

  const dotStyle = {
    r: 2, // Nastavte veľkosť bodov podľa potreby
    fill: 'blue', // Nastavte farbu bodov podľa potreby
  };

  return (
    <div className='center-items main' style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start' }}>
      <div className='first center-items' style={{ width: '25%', minHeight: '100vh', paddingRight: '20px', paddingLeft: '20px' }}>
        <div className='treeView' >
          <p>Načítané priečinky</p>
          <div className='treeViewWindow'>
            {projectData != undefined ?
              <TreeView
                aria-label="controlled"
                defaultCollapseIcon={<ExpandMoreIcon />}
                defaultExpandIcon={<ChevronRightIcon />}
                defaultExpanded={[projectData?.folders[0].id.toString()]}
              >
                {projectData?.folders.map((folder, index) => (
                  <TreeItem nodeId={folder.id.toString()} label={folder.foldername} style={{ fontFamily: 'Poppins', fontSize: 'larger' }}>
                    {folder.data.map((file, index) => (
                      <TreeItem nodeId={file.filename} label={file.filename}>
                      </TreeItem>
                    ))}
                  </TreeItem>

                ))}
              </TreeView> : ""}

          </div>

          <div className='buttonContainer'>
            <IconButton aria-label="delete">
              <AddCircleOutlineRoundedIcon />
            </IconButton>
            <button onClick={multiplyButtonClick} className="button-13" role="button" style={{ padding: '0px', margin: '0px' }}>Porovnať</button>

          </div>
        </div>
      </div>
      <div className='second' style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '75%', }}>
        <div className='upperContainer' style={{ flexDirection: 'row', display: 'flex' }}>
          <div className="table-container" style={{ width: '55%' }}>
            <DataTable folderData={folderData} showAutocomplete={true} />
          </div>
          <div className='otherContainer' style={{ width: '45%' }}>
            <div className='buttonCreateProfil'>
              <button onClick={multiplyButtonClick} className="button-13" role="button">Vytvoriť profil</button>
            </div>

            {folderData ?
              <ScatterChart
                height={300}
                series={folderData.data.map((data, i) => ({

                  label: data.filename,
                  data: data.intensity.map((v, index) => ({ x: folderData.excitation[index], y: v, id: v })),
                }))}
                yAxis={[{ min: 0 }]}
                xAxis={[{ min: 250 }]}
              />
              : ""}

          </div>
        </div>
        <div className='bottomContainer' style={{ flexDirection: 'row', display: 'flex' }}>
          <div className="table-container" style={{ width: '55%' }}>
            {multiplied && projectData ?
              <DataTable folderData={folderData} showAutocomplete={false} /> : <div className='emptyTable'></div>}
          </div>
          <div className='otherContainer' style={{ width: '45%' }}>
              <div className='profileTab'>
              {multiplied && projectData ?
               <div className='emptyTable'></div>: <div className='emptyTable'></div>}
              </div>
              <div className='stats' style={{ width: '45%' }}>

              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProfile;
