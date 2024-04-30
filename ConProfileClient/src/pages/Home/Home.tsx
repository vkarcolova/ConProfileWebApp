import axios from 'axios';
import '../../index.css';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { FolderDTO, FileContent, ProjectDTO } from '../../types';
import { useNavigate } from 'react-router-dom';
import './index.css'
import { IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import moment from 'moment';
import DeleteIcon from '@mui/icons-material/Delete';
import ModeEditIcon from '@mui/icons-material/ModeEdit';

const Home: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [projectsData, setProjecsData] = useState<ProjectDTO[] | null>(null);
  const navigate = useNavigate()

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
        const loadedFiles: FileContent[] = [];

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
            const loadedFile: FileContent = {
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


  const sendData = async (files: FileContent[]) => {
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
        'https://localhost:44300/Project/CreateNewProject',
        JSON.stringify(files),
        {
          headers: customHeaders,
        }
      ).then(response => {
        console.log(response.data);
        const token = response.data.token;
        const id = response.data.idproject;
        localStorage.setItem('token', token);
        const objString = JSON.stringify(response.data.project);
        sessionStorage.setItem('loadeddata', objString);
        navigate('/create-profile/');
       // navigate('/create-profile/' + id);
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


const handleDeleteProject = async (id: number) => {
  const token = localStorage.getItem('token');

  if (token != undefined || token != null) {
    try {
      const response = await axios.delete('https://localhost:44300/Project/DeleteProject/' + id, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      getProjectsByUser();
      console.log(response.data);
    } catch (error) {
      console.error('Chyba pri získavaní dát zo servera:', error);
    }
  }
};

const handleEditProject = async (id: number) => {
  navigate('/create-profile/' + id);
};


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
          {projectsData && projectsData?.length > 0 && (<div className='tab-container'> <TableContainer component={Paper} >

            <Table sx={{ width: '100%' }} stickyHeader size="small" aria-label="a dense table">
              <TableHead>
                <TableRow >
                  <TableCell style={{fontFamily: 'Poppins', fontWeight: 'bolder'}}> Názov projektu</TableCell >
                  <TableCell  style={{fontFamily: 'Poppins', fontWeight: 'bolder'}}> Dátum vytvorenia</TableCell >
                  <TableCell  style={{fontFamily: 'Poppins', fontWeight: 'bolder'}}> Načítané priečinky</TableCell >
                  <TableCell> </TableCell >
                </TableRow>
              </TableHead>
              <TableBody>
                {projectsData.map((project: ProjectDTO) => {
                  return (<TableRow>
                    <React.Fragment key={project.idproject}>
                      <TableCell> {project.projectname} </TableCell>
                      <TableCell>{moment(project.created).format('DD.MM.YYYY HH:mm:ss')}</TableCell>
                      <TableCell>
                        {project.folders.slice(0, 3).map((folder: FolderDTO, index: number) => (
                          <React.Fragment key={index}>
                            {folder.foldername}
                            {index < 2 && ' '}
                          </React.Fragment>
                        ))}
                        {project.folders.length > 3 && '...'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton aria-label="delete" onClick={() => handleDeleteProject(project.idproject)}>
                          <DeleteIcon />
                        </IconButton>
                        <IconButton aria-label="edit" onClick={() => handleEditProject(project.idproject)}>
                          <ModeEditIcon />
                        </IconButton>
                      </TableCell>
                    </React.Fragment>
                  </TableRow>);
                })}
              </TableBody>
            </Table>
          </TableContainer></div>)}
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
