 import '../../index.css'; 
 import React, { ChangeEvent, useCallback, useRef, useState } from 'react';
 import { useDropzone } from 'react-dropzone';
import FileUpload from '../../components/FileUpload';
import UploadDropZone from '@rpldy/upload-drop-zone';

interface FolderSelectionProps {
  onFoldersSelected: (folders: File[]) => void;
}
const Home: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelectFolder = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleFolderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles) {
      const filesArray : File[] = Array.from(selectedFiles).map((file) => file);
      for (const file of filesArray) {
        console.log(`Contents of ${file.name}:`);
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target) {
            const result = event.target.result as string;
            console.log(result);
          } else {
            console.log(new Error('Failed to read file.'));
          }
        };
        reader.readAsText(file);
      }
    
    }
  };

  return (
    <div>
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
