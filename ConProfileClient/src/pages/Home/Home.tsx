 import axios from 'axios';
import '../../index.css'; 
 import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

 interface LoadedFile{
  FILENAME: string,
  FOLDERNAME: string;
  CONTENT: string;
}


const Home: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState([]);

  useEffect(() => {
    console.log(data);
  }, [data]);


  const handleSelectFolder = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFolderChange = async (e: ChangeEvent<HTMLInputElement>) => {
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

  


  const sendData = async ( files : LoadedFile[]) => {
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
          window.location.href = "/create-profile";

      });
      
    } catch (error) {
      console.error('Chyba pri načítavaní dát:', error);
      
    }
  };
  return (
    <div >
      <div className="home-page">
      <div className="button-container">
        <button onClick={handleSelectFolder}  className="large-button">Načítať dáta</button>
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

      <div className="small-text">Informacie o webe, projekty ktoré tu už boli vytvorené...</div>
    </div>

    </div>
  );
};

export default Home;

declare module 'react' {
  interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    // extends React's HTMLAttributes
    directory?: string;
    webkitdirectory?:string;
  }
}
