import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import { Factors } from "../types";
import { TextField } from "@mui/material";
import { useEffect } from "react";

interface CustomInputAutocompleteProps {
  columnSpectrum: number;
  id: number;
  allFactors: Factors[];
}

const CustomInputAutocomplete: React.FC<CustomInputAutocompleteProps> = ({
  columnSpectrum,
  allFactors,
  id,
}) => {
  const [selectedValue, setSelectedValue] = React.useState<number | null>(null);
  const [factors, setFactors] = React.useState<Factors[]>([]);

  useEffect(() => {
    const filtered = allFactors.filter(
      (factor) => factor.spectrum === columnSpectrum
    );
    setFactors(filtered);

    const defaultFactor = filtered.length > 0 ? filtered[0].factor : null;
    setSelectedValue(defaultFactor);
  }, [columnSpectrum, allFactors]);

  const parseNumber = (input: string | number | null): number | null => {
    if (input === null || typeof input === "number") {
      return input;
    }
    const parsedNumber = parseFloat(input);
    return isNaN(parsedNumber) ? null : parsedNumber;
  };

  const handleAutocompleteChange = (
    event: React.SyntheticEvent,
    newValue: string | number | null
  ) => {
    setSelectedValue(parseNumber(newValue));
  };

  return (
    <label>
      <Autocomplete
        disablePortal
        freeSolo
        size="small"
        sx={{ backgroundColor: "white", borderRadius: 1, width: 70 }}
        id={`autocomplete-${id}`}
        options={factors.map((option) => option.factor)}
        value={selectedValue !== null ? selectedValue.toString() : ""}
        getOptionLabel={(option) => option.toString()}
        onChange={handleAutocompleteChange}
        renderInput={(params) => <TextField {...params} label="Faktor" />}
      />
    </label>
  );
};

export default CustomInputAutocomplete;
