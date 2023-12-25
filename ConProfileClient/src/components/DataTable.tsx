import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FolderDTO, Factors } from '../types';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import './components.css'
import CustomInputAutocomplete from './CustomAutocomplete';
import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface DataTableProps {
  folderData: FolderDTO;
  showAutocomplete: boolean;
  
}

const DataTable: React.FC<DataTableProps> = ({ folderData, showAutocomplete }) => {
  const [selectedOptions, setSelectedOptions] = useState<number[]>(Array(folderData.data.length).fill(0));
  const [factors, setFactors] = useState<Factors[]>([]);

  const handleComboBoxChange = (index: number, value: number | null) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[index] = value ?? 0;
    setSelectedOptions(newSelectedOptions);
  };

  useEffect(() => {
    axios.get<Factors[]>('https://localhost:44300/Factor')
      .then(response => {
        setFactors(response.data);
        console.log(response);
      })
      .catch(error => {
        console.error('Chyba pri získavaní dát zo servera:', error);
      });
  }, []);

  return (
    <TableContainer component={Paper} >
      <Table stickyHeader size="small" aria-label="a dense table">
        <TableHead>

          <TableRow>
            {folderData.data.map((tableData, index) => (
              <React.Fragment key={tableData.filename}>

                <TableCell><div className='TableRowName'>{tableData.filename}</div></TableCell>
              </React.Fragment>
            ))}
          </TableRow>
          {showAutocomplete ? <TableRow>
            {folderData.data.map((tableData, index) => (
              <React.Fragment key={tableData.filename}>

                <TableCell> 
                  <div className='autocomplete'>
                <CustomInputAutocomplete id={tableData.spectrum}/>
                </div>
                </TableCell>
              </React.Fragment>
            ))}
          </TableRow> : ""}
        </TableHead>
        {showAutocomplete ? 
        <TableBody>
          <TableRow>
            {folderData.data.map((tableData, index) => (
              <React.Fragment key={tableData.filename}>
                <TableCell>
                  {tableData.intensity.map((intensity, i) => (
                    <div key={i}>{intensity.toFixed(5)}</div>
                  ))}
                </TableCell>
              </React.Fragment>
            ))}
          </TableRow>
        </TableBody> :        
        <TableBody>
          <TableRow>            
            {folderData.data.map((tableData, index) => (
              <React.Fragment key={tableData.filename}>
                {tableData.multipliedintensity ?
                <TableCell>
                  {tableData.multipliedintensity.map((multipliedintensity, i) => (
                    <div key={i}>{multipliedintensity.toFixed(5)}</div>
                  ))}
                </TableCell> : ""
                }
              </React.Fragment>
            ))}
          </TableRow>
        </TableBody>}
      </Table>
    </TableContainer>
  );
};

export default DataTable;
