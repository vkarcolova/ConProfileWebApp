import React from "react";
import { ProjectDTO } from "../../../shared/types";
import { TreeView } from "@mui/x-tree-view/TreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box } from "@mui/material";

interface FolderTreeViewProps {
  projectData: ProjectDTO | null;
  selectedFolder: number;
  handleNodeSelect: (event: React.SyntheticEvent, value: string) => void;
}

export const FolderTreeView: React.FC<FolderTreeViewProps> = ({
  projectData,
  selectedFolder,
  handleNodeSelect,
}) => {
  return (
    <>
      <p>Načítané priečinky</p>
      <Box className="treeViewWindow">
        {projectData && (
          <TreeView aria-label="controlled" onNodeSelect={handleNodeSelect}>
            {projectData.folders.map((folder, index) => (
              <TreeItem
                nodeId={folder.foldername}
                label={folder.foldername}
                key={folder.foldername}
                sx={{
                  fontFamily: "Poppins",
                  "& .MuiTreeItem-label": {
                    fontWeight: index === selectedFolder ? "bold" : "normal",
                  },
                  fontWeight: index === selectedFolder ? "bold" : "normal",
                }}
              >
                {folder.data.map((file) => (
                  <TreeItem
                    nodeId={file.filename}
                    label={file.filename}
                    key={file.filename}
                    sx={{ paddingBottom: 0 }}
                  />
                ))}
              </TreeItem>
            ))}
          </TreeView>
        )}
      </Box>
    </>
  );
};
