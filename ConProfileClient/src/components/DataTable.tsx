import React, { useState, useEffect } from 'react';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Autocomplete, TextField } from '@mui/material';
import axios from 'axios';
import { FolderDTO, Factors } from '../types';
import { blueGrey } from '@mui/material/colors';
import './components.css'
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
    <TableContainer component={Paper} sx={{ maxHeight: 350, maxWidth: 700 }}>
    <Table stickyHeader>
      <TableHead style={{ width: '100%', backgroundColor: '#c0b3e7' }}>
        <TableRow>
          {folderData.data.map((tableData, index) => (
            <TableCell key={tableData.filename}  style={{ margin:'0px', paddingLeft: '20px', paddingRight: '20px', paddingBottom: '0px', border: '0px' }} > 
              <Autocomplete style={{ margin: '0px', padding: '0px', border: '0px', }}
                id={`free-solo-demo-${index}`}
                freeSolo
                options={factors.map((option) => option.factor)}
                renderInput={(params) => <TextField {...params} label="Faktor" />}
              />
            </TableCell>
          ))}
        </TableRow>
        <TableRow>
          {folderData.data.map((tableData) => (
            <TableCell key={tableData.filename} style={{ width: '100px' }}> {/* Nastavte želanú šírku stĺpca */}
              {tableData.filename}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          {folderData.data.map((tableData, index) => (
            <React.Fragment key={tableData.filename}>

              <TableCell style={{ width: '100px' }}> {/* Nastavte želanú šírku stĺpca */}
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
