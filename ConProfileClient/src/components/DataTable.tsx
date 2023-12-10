import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FolderDTO, Factors } from '../types';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import './components.css'
import CustomInputAutocomplete from './CustomAutocomplete';

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
    <table className="table" style={{ width: '100%', borderCollapse: 'collapse', maxHeight: '350px', maxWidth: '800px' }}>
      <thead className="table__thead"  style={{ position: 'sticky',     top: '0'}} >
      {showAutocomplete ? <tr className="table__head"   style={{ maxHeight: '10px' }} >
          {folderData.data.map((tableData, index) => (
            <th className="table__th" key={tableData.filename}  style={{ height: '10px', fontSize: '14px', paddingTop: '3px', paddingBottom: '3x' }} >
              <CustomInputAutocomplete id={tableData.spectrum}/>
            </th>
          ))}
        </tr> :null }
        <tr className="table__thead">
          {folderData.data.map((tableData) => (
            <th className="table__th" key={tableData.filename} style={{ width: '100px', fontSize: '12px' }}>
              {tableData.filename}
            </th>
          ))}
        </tr >
      </thead>
      <tbody className="table__tbody">
        <tr className="">
          {folderData.data.map((tableData, index) => (
            <React.Fragment key={tableData.filename}>
              <td className="table__tr " style={{ width: '100px', fontSize: '12px' }}>
                {tableData.intensity.map((intensity, i) => (
                  <div key={i}>{intensity}</div>
                ))}
              </td>
            </React.Fragment>
          ))}
        </tr>
      </tbody>
    </table>
  );
};

export default DataTable;
