import * as React from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import { Factors } from '../types';
import axios from 'axios';
import { Chip, TextField } from '@mui/material';

const options = ['1', '2'];
interface CustomInputAutocomplete {
  id: number;
}

const CustomInputAutocomplete: React.FC<CustomInputAutocomplete> = ({id}) => {
  const [factors, setFactors] = React.useState<Factors[]>([]);
  const [selectedValue, setSelectedValue] = React.useState<number | null>(null);

 
  React.useEffect(() => {
    axios
      .get<Factors[]>('https://localhost:44300/Factor')
      .then(response => {
        setFactors(response.data);
        // Nájdi faktor podľa id
        const defaultFactor = response.data.find(factor => factor.spectrum === id);
        // Nastav default hodnotu
        setSelectedValue(defaultFactor ? defaultFactor.factor : null);
      })
      .catch(error => {
        console.error('Chyba pri získavaní dát zo servera:', error);
      });
  }, [id]);


  const parseNumber = (input: string | number | null): number | null => {
    if (input === null || typeof input === 'number') {
      return input;
    }
    const parsedNumber = parseInt(input, 10);
    return isNaN(parsedNumber) ? null : parsedNumber;
  };
   
  const handleAutocompleteChange = (event: React.ChangeEvent<{}>, newValue: string | number | null) => {
    setSelectedValue(parseNumber(newValue));
    // Ďalšie spracovanie podľa potreby
  };
  

  return (
    <label>
      <Autocomplete
       disablePortal
        freeSolo
        size="small"

         sx={{ width: 70 }}
        id={`autocomplete-${id}`}
        options={factors.map(option => option.factor)}
        value={selectedValue}
        onChange={handleAutocompleteChange}
        renderInput={params => (
            <TextField {...params} label="Faktor" />
        )}
      />
    </label>
     );

}


export default CustomInputAutocomplete;