import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FolderDTO } from '../../types';
import DataTable from '../../components/DataTable';
import './index.css'

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
    <div>
          <div className="table-container">
      <DataTable folderData={folderData} />
      </div>

    </div>
  );
};

export default CreateProfile;
