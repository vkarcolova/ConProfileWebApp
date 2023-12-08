import React, { useState, useEffect } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Autocomplete, TextField } from '@mui/material';
import axios from 'axios';
import { FolderDTO, Factors } from '../types';
import { blueGrey } from '@mui/material/colors';

interface DataTableProps {
  folderData: FolderDTO;
}

const DataTable: React.FC<DataTableProps> = ({ folderData }) => {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(Array(folderData.data.length).fill(0));
  const [factors, setFactors] = useState<Factors[]>([]); 
  const handleComboBoxChange = (index: number, value: number | null) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[index] = value ?? 0; // Ak je hodnota null, použijeme defaultnú hodnotu 0
    setSelectedOptions(newSelectedOptions);
  };
  useEffect(() => {
    // Získanie dát zo servera
    axios.get<Factors[]>('https://localhost:44300/Factor') // Zmenil som návratový typ na Factors[]
      .then(response => {
        setFactors(response.data); // Zmenil som setFolderData na setFactors
        console.log(response);
      })
      .catch(error => {
        console.error('Chyba pri získavaní dát zo servera:', error);
      });
  }, []);
  
  return (
    <TableContainer component={Paper} sx={{ maxHeight: 250 }}>
      <Table stickyHeader size="small" aria-label="a dense table">
 <TableHead>
 <TableRow>
    {folderData.data.map((tableData, index) => (
      <React.Fragment key={tableData.filename}>
        <TableCell>

        </TableCell>
        <TableCell style={{ margin: '0px', border: 'none', padding: '10px' }} > <Autocomplete
                id={`free-solo-demo-${index}`}
                freeSolo
                options={factors.map((option) => option.factor)}
                renderInput={(params) => <TextField {...params} label="freeSolo" />}
              /></TableCell>
      </React.Fragment>
    ))}
  </TableRow>
  <TableRow>
    {folderData.data.map((tableData, index) => (
      <React.Fragment key={tableData.filename}>
        <TableCell>

        </TableCell>
        <TableCell  >{tableData.filename}</TableCell>
      </React.Fragment>
    ))}
  </TableRow>
  </TableHead>
        <TableBody>
          <TableRow>
            {folderData.data.map((tableData, index) => (
              <React.Fragment key={tableData.filename}>
                <TableCell>{selectedOptions[index]}</TableCell>
                <TableCell>
                  {tableData.intensity.map((intensity, i) => (
                    <div key={i}>{intensity}</div>
                  ))}
                </TableCell>
              </React.Fragment>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
};

  


export default DataTable;
