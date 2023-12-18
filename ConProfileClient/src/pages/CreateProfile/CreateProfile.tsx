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

const CreateProfile: React.FC = () => {
  const [folderData, setFolderData] = useState<FolderDTO | null>(null);
  const [projectData, setProjectData] = useState<ProjectDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  var foldersExpand : string[] = [];

  useEffect(() => {
    // Získanie dát zo servera
    axios.get<ProjectDTO>('https://localhost:44300/Project/GetProject/1')
      .then(response => {
        setProjectData(response.data);
        setFolderData(response.data.folders[0])
        response.data.folders.forEach(element => { foldersExpand.push(element.foldername)
        });
        console.log("expand" + foldersExpand);
        console.log(response);
      })
      .catch(error => {
        console.error('Chyba pri získavaní dát zo servera:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);



    const [selectedValues, setSelectedValues] = useState<number[]>([]);
  
    const handleAutocompleteValuesChange = (values: number[]) => {
      setSelectedValues(values);
    };
  
    const handleButtonClick = async () => {
      console.log('Vybrané hodnoty:', selectedValues);
      const factors : number[] = [];
      const spectrums : number[] = [];

      folderData?.data.forEach(element => {
        console.log(element.spectrum);
        const autocompleteInput = document.getElementById(`autocomplete-${element.spectrum}`) as HTMLInputElement | null;
        const inputFactor=   autocompleteInput ? parseFloat(autocompleteInput.value) : null;
        if(inputFactor) {
          factors.push(inputFactor);
          spectrums.push(element.spectrum);
        }
        else{
          alert("Nesprávne zadané reporty!");
          return;
        }
        
      });
      if(factors.length > 0 && folderData && spectrums){
        const dataToSend: MultiplyFolderDTO = {
          IDFOLDER: folderData.id, 
          FACTORS: factors,
          SPECTRUMS: spectrums,
        };
        try {
          console.log(dataToSend);
          const response = await axios.post(
            'https://localhost:44300/LoadedFolder/PostFactorsMultiply',
            JSON.stringify(dataToSend),
            {
                headers: {
                    'Content-Type': 'application/json'
                }
            }
    
          ).then(() => {
            console.log(dataToSend);

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

 
  
  return (
    <div className='center-items' style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', minHeight: '100vh', width: '100vh'}}>
      <div className='first center-items' style={{ flex: '1fr', minWidth: '50%', minHeight: '100vh', paddingRight: '20px', paddingLeft: '20px'  }}>
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
                <TreeItem nodeId={folder.id.toString()} label={folder.foldername} style={{fontFamily: 'Poppins', fontSize: 'larger'}}> 
                      {folder.data.map((file, index) => (
                      <TreeItem nodeId={file.filename} label={file.filename}>
                      </TreeItem>
                      ))}
                </TreeItem>
                
            ))}
          </TreeView> : "" }
         
      </div>

      <div className='buttonContainer'>
          <IconButton aria-label="delete">
            <AddCircleOutlineRoundedIcon />
        </IconButton>
        <button onClick={handleButtonClick} className="button-13" role="button" style={{padding: '0px', margin: '0px'}}>Porovnať</button>

          </div>
        </div>

        {/* Obsah pre first div */}
      </div>
      <div className='second' style={{ display: 'flex', flexDirection: 'column', flex: '2fr',minHeight: '100vh', }}>
        <div className="table-container">
          {/* Obsah pre druhý div */}
          <DataTable folderData={folderData} showAutocomplete={true} />
        </div>
        <div className="table-container">
          {/* Obsah pre druhý div */}
          <DataTable folderData={folderData} showAutocomplete={false} />
        </div>
      </div>
      <div className='third' style={{ flex: '2fr' }}>
        {/* Obsah pre tretí div */}

          <button onClick={handleButtonClick} className="button-13" role="button">Vynásob</button>

      </div>
    </div>
  );
};

export default CreateProfile;
