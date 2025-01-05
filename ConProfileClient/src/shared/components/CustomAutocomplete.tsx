import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import { Factors } from "../types";
import { TextField } from "@mui/material";
import { useEffect } from "react";

interface CustomInputAutocompleteProps {
  columnSpectrum: number;
  id: number;
  allFactors: Factors[];
  changeFactorValue?: (id: number, value: number | null) => void;
}

const CustomInputAutocomplete: React.FC<CustomInputAutocompleteProps> = ({
  columnSpectrum,
  allFactors,
  id,
  changeFactorValue,
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
    if (changeFactorValue) {
      changeFactorValue(id, defaultFactor);
    }
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
    if (changeFactorValue) {
      changeFactorValue(id, parseNumber(newValue));
    }
  };

  const handleInputChange = (
    event: React.SyntheticEvent,
    newInputValue: string
  ) => {
    const parsedValue = parseNumber(newInputValue);
    setSelectedValue(parsedValue);
    if (changeFactorValue) {
      changeFactorValue(id, parsedValue);
    }
  };
  return (
    <label>
      <Autocomplete
        disablePortal
        freeSolo
        size="small"
        sx={{
          backgroundColor: "#f3f2fe",
          paddingTop: "5px",
          borderRadius: 1,
          width: "85%",

          "& .MuiInputLabel-root.MuiInputLabel-shrink": {
            marginTop: "5px",
            //paddingBottom: "5px",
          },
          "& .MuiInputLabel-root:not(.MuiInputLabel-shrink)": {
            transform: "translate(14px, 45%)",
          },
          "& .MuiOutlinedInput-root": {
            "& legend": {
              display: "none",
            },
          },
        }}
        id={`autocomplete-${id}`}
        options={factors.map((option) => option.factor)}
        value={selectedValue !== null ? selectedValue.toString() : ""}
        getOptionLabel={(option) => option.toString()}
        onChange={handleAutocompleteChange}
        renderInput={(params) => <TextField {...params} label="Faktor" />}
        onInputChange={handleInputChange}
      />
    </label>
  );
};

export default CustomInputAutocomplete;
