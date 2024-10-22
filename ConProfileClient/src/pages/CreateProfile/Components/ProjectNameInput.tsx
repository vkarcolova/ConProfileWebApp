import { Input } from "@mui/material";
import React, { useState } from "react";

interface ProjectNameInputProps {
  saveToProjectData: (projectName : string) => void;
  savedProjectName?: string;
}

export const ProjectNameInput: React.FC<ProjectNameInputProps> = ({
  saveToProjectData,
  savedProjectName
}) => {
  const [projectName, setProjectName] = useState(savedProjectName ? savedProjectName : "NovyProjekt");

  return (
    <Input
      placeholder="Názov projektu"
      value={projectName}
      sx={{
        "--Input-minHeight": "41px",
      }}
      id="inputName"
      onChange={(e) => {setProjectName(e.target.value);}}
      onBlur={() => {saveToProjectData(projectName)}}
    />
  );
};
