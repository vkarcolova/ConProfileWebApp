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
  inputedFactor?: number | null;
}

const CustomInputAutocomplete: React.FC<CustomInputAutocompleteProps> = ({
  columnSpectrum,
  allFactors,
  id,
  changeFactorValue,
  inputedFactor,
}) => {
  const [selectedValue, setSelectedValue] = React.useState<string>("");
  const [factors, setFactors] = React.useState<Factors[]>([]);

  useEffect(() => {
    const filtered = allFactors.filter(
      (factor) => factor.spectrum === columnSpectrum
    );

    setFactors(filtered);
    let factorValue = filtered.length > 0 ? filtered[0].factor.toString() : "";
    if (inputedFactor) {
      factorValue = inputedFactor.toString();
    }
    setSelectedValue(factorValue);

    if (changeFactorValue) {
      changeFactorValue(id, parseFloat(factorValue) || null);
    }
  }, [allFactors, columnSpectrum, id, inputedFactor]);

  const parseNumber = (input: string): number | null => {
    const parsedNumber = parseFloat(input);
    return isNaN(parsedNumber) ? null : parsedNumber;
  };

  const handleAutocompleteChange = (
    event: React.SyntheticEvent,
    newValue: string | null
  ) => {
    if (newValue !== null && /^[0-9]*\.?[0-9]*$/.test(newValue)) {
      setSelectedValue(newValue);
      if (changeFactorValue) {
        changeFactorValue(id, parseNumber(newValue));
      }
    }
  };

  const handleInputChange = (
    event: React.SyntheticEvent,
    newInputValue: string
  ) => {
    let formattedValue = newInputValue.replace(/[^0-9.,]/g, "");
    formattedValue = formattedValue.replace(/,/g, ".");

    // Ak vstup nie je validné číslo, nemeníme stav
    if (/^[0-9]*\.?[0-9]*$/.test(formattedValue)) {
      setSelectedValue(formattedValue);
      if (changeFactorValue) {
        changeFactorValue(id, parseNumber(formattedValue));
      }
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
          "& .MuiInputLabel-root": {
            marginTop: "5px",
            transition: "transform 0.2s ease-out, color 0.2s ease-out",
          },
          "& .MuiOutlinedInput-root": {
            "& legend": {
              display: "none",
            },
          },
        }}
        id={`autocomplete-${id}`}
        options={factors.map((option) => option.factor.toString())}
        value={selectedValue}
        inputValue={selectedValue}
        getOptionLabel={(option) => option}
        onChange={handleAutocompleteChange}
        onInputChange={(event, newValue, reason) => {
          if (reason === "input") {
            handleInputChange(event, newValue);
          }
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Faktor"
            inputProps={{
              ...params.inputProps,
              inputMode: "decimal", // Zabezpečí numerickú klávesnicu na mobile
            }}
          />
        )}
      />
    </label>
  );
};

export default CustomInputAutocomplete;
