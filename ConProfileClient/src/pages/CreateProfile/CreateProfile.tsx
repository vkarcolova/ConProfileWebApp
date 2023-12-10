import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FolderDTO } from '../../types';
import DataTable from '../../components/DataTable';
import './index.css'
import { Button, Divider } from '@mui/material';

const CreateProfile: React.FC = () => {
  const [folderData, setFolderData] = useState<FolderDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Získanie dát zo servera
    axios.get<FolderDTO>('https://localhost:44300/LoadedFolder/GetFolder/1')
      .then(response => {
        setFolderData(response.data);
        console.log(response);
      })
      .catch(error => {
        console.error('Chyba pri získavaní dát zo servera:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!folderData) {
    return <div>Error loading data.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <div className='first' style={{ flex: '1fr', minWidth: '25%' }}>
        {/* Obsah pre first div */}
      </div>
      <div className='second' style={{ display: 'flex', flexDirection: 'column', flex: '2fr' }}>
        <div className="table-container">
          {/* Obsah pre druhý div */}
          <DataTable folderData={folderData} showAutocomplete={true} />
        </div>
        <div className="table-container">
          {/* Obsah pre druhý div */}
          <DataTable folderData={folderData} showAutocomplete={false} />
        </div>
      </div>
      <div className='third' style={{ flex: '1fr' }}>
        {/* Obsah pre tretí div */}

          <button  className="button-13" role="button">Vynásob</button>

      </div>
    </div>
  );
};

export default CreateProfile;
