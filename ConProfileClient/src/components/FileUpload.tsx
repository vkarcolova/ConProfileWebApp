import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';

const FileUpload: React.FC = () => {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Implementácia načítania súborov a odoslanie na server
    acceptedFiles.forEach((file) => {
      const formData = new FormData();
      formData.append('file', file);

      // Odošlite súbor na server
      axios.post('http://localhost:5203/LoadedData/PostLoadedData', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      .then((response) => {
        console.log('Úspešne odoslané na server', response.data);
      })
      .catch((error) => {
        console.error('Chyba pri odosielaní na server', error);
      });
    });
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {'text/html': ['.sp'], }, // Prijíma iba súbory s koncovkou .sp
    multiple: true,
  });

  return (
    <div>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <p>Presuňte sem súbory alebo kliknite na túto oblasť na ich výber.</p>
      </div>
      {selectedFolder && <p>Vybraný priečinok: {selectedFolder}</p>}
    </div>
  );
};

export default FileUpload;
