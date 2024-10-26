import React from "react";
import { ProjectDTO } from "../../../shared/types";
import { TreeView } from "@mui/x-tree-view/TreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Box, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

interface FolderTreeViewProps {
  projectData: ProjectDTO | null;
  selectedFolder: number;
  handleNodeSelect: (event: React.SyntheticEvent, value: string) => void;
  deleting: boolean;
}

export const FolderTreeView: React.FC<FolderTreeViewProps> = ({
  projectData,
  selectedFolder,
  handleNodeSelect,
  deleting,
}) => {
  return (
    <>
      <p>Načítané priečinky</p>
      <Box className="treeViewWindow" sx={{ position: "relative" }}>
        {projectData && (
          <Box>
            <TreeView
              defaultCollapseIcon={<ExpandMoreIcon />}
              defaultExpandIcon={<ChevronRightIcon />}
              aria-label="controlled"
              onNodeSelect={handleNodeSelect}
              check
            >
              {projectData.folders.map((folder, index) => (
                <TreeItem
                  nodeId={folder.foldername}
                  label={folder.foldername}
                  key={folder.foldername}
                  sx={{
                    fontFamily: "Poppins",
                    "& .MuiTreeItem-label": {
                      fontWeight: index === selectedFolder ? "bold" : "normal",
                      fontSize: { md: "1rem", lg: "1.2rem" },
                    },
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
          </Box>
        )}
      </Box>
    </>
  );
};
