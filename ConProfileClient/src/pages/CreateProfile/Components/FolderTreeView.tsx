import React, { useEffect, useState } from "react";
import { ProjectDTO } from "../../../shared/types";
import {
  Box,
  Button,
  ButtonGroup,
  Checkbox,
  IconButton,
  Typography,
} from "@mui/material";
import { ExpandMore, ChevronRight } from "@mui/icons-material";

interface FolderTreeViewProps {
  projectData: ProjectDTO | null;
  selectedFolder: number;
  handleNodeSelect: (event: React.SyntheticEvent, value: string | null) => void;
  deleting: boolean;
  setDeleting: (value: boolean) => void;
  deleteProjectFolders: (values: string[]) => void;
}

export const FolderTreeView: React.FC<FolderTreeViewProps> = ({
  projectData,
  selectedFolder,
  handleNodeSelect,
  deleting,
  setDeleting,
  deleteProjectFolders,
}) => {
  interface TreeViewItem {
    id: string;
    label: string;
    children?: TreeViewItem[];
  }

  const [items, setItems] = useState<TreeViewItem[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    const items: TreeViewItem[] = [];
    if (!projectData) return;
    projectData.folders.forEach((folder) => {
      const folderItem: TreeViewItem = {
        id: folder.foldername,
        label: folder.foldername,
        children: folder.data.map((file) => ({
          id: file.filename,
          label: file.filename,
        })),
      };
      items.push(folderItem);
    });

    setItems(items);
  }, [projectData]);

  useEffect(() => {
    if (!deleting) setSelectedItems([]);
  }, [deleting]);

  const handleCheckboxChange = (label: string) => {
    if (selectedItems.includes(label)) {
      setSelectedItems(selectedItems.filter((item) => item !== label));
    } else {
      setSelectedItems([...selectedItems, label]);
    }
  };

  const toggleNode = (id: string) => {
    const newExpandedNodes = new Set(expandedNodes);
    if (newExpandedNodes.has(id)) {
      newExpandedNodes.delete(id);
    } else {
      newExpandedNodes.add(id);
    }
    setExpandedNodes(newExpandedNodes);
  };

  const renderTree = (nodes: TreeViewItem[]) => {
    return nodes.map((node, index) => {
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <Box
        key={node.id}
        sx={{
          marginBottom: "8px",
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            width: "100%",
          }}
        >
          {hasChildren && (
            <IconButton
              size="small"
              disabled={deleting}
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              sx={{ visibility: deleting ? "hidden" : "visible" }}
            >
              {isExpanded ? <ExpandMore /> : <ChevronRight />}
            </IconButton>
          )}
          {!hasChildren && <Box sx={{ width: "24px" }} />}{" "}
          {deleting && (
            <Checkbox
              onChange={(e) => {
                e.stopPropagation();
                handleCheckboxChange(node.label);
              }}
              color="default"
              sx={{
                width: "20px",
                height: "20px",
                padding: 0,
                position: "relative",
              }}
            />
          )}
          <Typography
            onClick={(e) => handleNodeSelect(e, node.id)}
            sx={{
              fontWeight: index === selectedFolder ? "bold" : "normal",
              fontSize: { md: "1rem", lg: "1.2rem" },
              marginLeft: "8px",
              textAlign: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1, // Zaberie zvyšok dostupného priestoru
            }}
          >
            {node.label}
          </Typography>
        </Box>
      
          {isExpanded && node.children && !deleting && (
            <Box sx={{ paddingLeft: "16px" }}>
              {node.children.map((child) => {
                return (
                  <>
                    <Box
                      key={node.id}
                      sx={{ paddingLeft: "30px", marginBottom: "8px" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: "normal",
                            fontSize: { md: "1rem", lg: "1.2rem" },
                            marginLeft: "8px",
                          }}
                        >
                          {child.label}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                );
              })}
            </Box>
          )}
        </Box>
      );
    });
  };

  return (
    <>
      <p>Načítané priečinky</p>
      <Box
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "black",
          "& *": {
            color: "inherit",
          },
          fontFamily: '"Poppins", sans-serif',
          width: "70%",
          fontSize: "15px",
          minHeight: "250px",
          maxHeight: "250px",
          borderStyle: "solid",
          borderWidth: "1px",
          backgroundColor: "white",
          borderColor: "#97a7b7",
          alignItems: "center",
        }}
      >
        {projectData && (
          <Box
            sx={{
              height: deleting ? "85%" : "100%",
              maxHeight: deleting ? "85%" : "100%",
              overflowY: "auto",
              width: "100%",
            }}
          >
            {renderTree(items)}
          </Box>
        )}
        {deleting && (
          <Box
            sx={{
              bottom: 1,
              height: "20%",
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              posietion: "absolute",
            }}
          >
            <ButtonGroup variant="text" aria-label="Basic button group">
              <Button
                sx={{ fontWeight: "bold", color: "gray" }}
                onClick={() => {
                  setDeleting(false);
                }}
              >
                Zrušiť
              </Button>
              <Button
                sx={{ fontWeight: "bold", color: "red" }}
                disabled={
                  selectedItems.length == 0 ||
                  selectedItems.length == projectData?.folders.length
                }
                onClick={() => {
                  deleteProjectFolders(selectedItems);
                }}
              >
                Zmazať
              </Button>
            </ButtonGroup>
          </Box>
        )}
      </Box>
    </>
  );
};
