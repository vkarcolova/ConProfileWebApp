import axios from 'axios';
import '../../index.css';
import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { FolderDTO, LoadedFile, ProjectDTO } from '../../types';
import { useNavigate } from 'react-router-dom';
import './index.css'
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

const Home: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [projectsData, setProjecsData] = useState<ProjectDTO[] | null>(null);

  useEffect(() => {
    getProjectsByUser();
  }, []);


  const handleSelectFolder = () => {
    try {
      if (inputRef.current) {
        inputRef.current.click();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleFolderChange = async (e: ChangeEvent<HTMLInputElement>) => {

    try {
      const selectedFiles = e.target.files;
      if (selectedFiles) {
        const filesArray: File[] = Array.from(selectedFiles).filter((file) =>
          file.name.endsWith('.sp')
        );
        const folderName = filesArray[0].webkitRelativePath.split('/')[0];
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
              IDPROJECT: -1,
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
    } catch (error) {
      console.log(error);
    }
  };


  const navigate = useNavigate()


  const sendData = async (files: LoadedFile[]) => {
    try {
      const token = localStorage.getItem('token');
      console.log(token);
      let customHeaders: { 'Content-Type': string } | { 'Content-Type': string; Authorization: string } = {
        'Content-Type': 'application/json'
      };

      if (token != undefined || token != null) {
        customHeaders = {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        };
      }
      console.log(customHeaders);


      const response = await axios.post(
        'https://localhost:44300/LoadedData/PostNewProject',
        JSON.stringify(files),
        {
          headers: customHeaders,
        }

      ).then(response => {
        console.log(response.data);
        // Uloženie tokenu do localStorage

        const token = response.data.token;
        const id = response.data.idproject;
        localStorage.setItem('token', token);
        navigate('/create-profile/' + id);
      });
    } catch (error) {
      console.error('Chyba pri načítavaní dát:', error);
    }
  };

  const getProjectsByUser = async () => {
    // Získanie dát zo servera

    const token = localStorage.getItem('token');

    if (token != undefined || token != null) {

      axios.get<ProjectDTO[]>('https://localhost:44300/Project/GetProjectsByToken/' + token,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        .then(response => {
          setProjecsData(response.data);
          console.log(response.data);
        })
        .catch(error => {
          console.error('Chyba pri získavaní dát zo servera:', error);
        })
        .finally(() => {
        });
    }

  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <div className="home-page">
        <div className='emptydiv'></div>
        <div className="button-container">
          <button onClick={handleSelectFolder} className="large-button">Načítať dáta</button>
          <button className="large-button">Načítať projekt</button>
        </div>
        <input
          ref={inputRef}
          type="file"
          directory=""
          webkitdirectory=""
          onChange={handleFolderChange}
          multiple
          style={{ display: 'none' }}
        />
        <div className='welcomebar'>
          <div className="small-text">Informacie o webe, projekty ktoré tu už boli vytvorené...</div>
          {projectsData && projectsData?.length > 0  ? <div className='table-container'> <TableContainer component={Paper} >

            <Table sx={{ width: '100%' }} stickyHeader size="small" aria-label="a dense table">
              <TableHead>
                <TableRow>

                  <TableCell > Názov projektu</TableCell >
                  <TableCell > Dátum úpravy</TableCell >
                  <TableCell > Načítané priečinky</TableCell >
                </TableRow>
              </TableHead>

              <TableBody>

                {projectsData.map((project: ProjectDTO, index: number) => (<TableRow>

                  <React.Fragment key={project.idproject}>
                    <TableCell> {project.projectname} </TableCell>
                    <TableCell>{new Date().getDate()}.{new Date().getMonth() + 1}.{new Date().getFullYear()}</TableCell>
                    <TableCell>
                      {project.folders.slice(0, 3).map((folder: FolderDTO, index: number) => (
                        <React.Fragment key={index}>
                          {folder.foldername}
                          {index < 2 && ' '} 
                        </React.Fragment>
                      ))}
                      {project.folders.length > 3 && '...'} 
                    </TableCell>

                  </React.Fragment>

                </TableRow>))}
              </TableBody>
            </Table>
          </TableContainer></div> : ""}

        </div>
      </div>

    </div>
  );
};

export default Home;

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // extends React's HTMLAttributes
    directory?: string;
    webkitdirectory?: string;
  }
}
