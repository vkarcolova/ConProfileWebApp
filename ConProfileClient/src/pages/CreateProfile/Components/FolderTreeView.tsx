import React, { useEffect, useState } from "react";
import { ProjectDTO } from "../../../shared/types";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { Box, Button, ButtonGroup, Checkbox } from "@mui/material";

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
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    const items: TreeViewItem[] = [];
    if (!projectData) return;
    projectData.folders.forEach((folder) => {
      const folderItem: TreeViewItem = {
        id: folder.foldername,
        label: folder.foldername,
        children: [],
      };
      folder.data.forEach((file) => {
        folderItem.children?.push({
          id: file.filename,
          label: file.filename,
        });
      });
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

  return (
    <>
      <p>Načítané priečinky</p>
      <Box
        className="treeViewWindow"
        sx={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          color: "black",
          "& *": {
            color: "inherit",
          },
        }}
      >
        {projectData && (
          <Box
            sx={{
              height: deleting ? "85%" : "100%",
              maxHeight: deleting ? "85%" : "100%",
              overflowY: "auto",
            }}
          >
            <SimpleTreeView onSelectedItemsChange={handleNodeSelect}>
              {items.map((folder, index) => (
                <TreeItem
                  itemId={folder.label}
                  label={
                    <>
                      {deleting && (
                        <Checkbox
                          onChange={(e) => {
                            e.stopPropagation();
                            handleCheckboxChange(folder.label);
                          }}
                          color="default"
                          sx={{
                            width: "20px",
                            height: "20px",
                            padding: 0,
                            left: 0,
                            position: "absolute",
                          }}
                        />
                      )}{" "}
                      <Box
                        sx={{
                          fontWeight:
                            index == selectedFolder ? "bold" : "normal",
                          fontSize: { md: "1rem", lg: "1.2rem" },
                        }}
                      >
                        {folder.label}
                      </Box>
                    </>
                  }
                  key={folder.label}
                  sx={{
                    fontFamily: "Poppins",
                    "& .MuiTreeItem-label": {
                      fontWeight: index === selectedFolder ? "bold" : "normal",
                      fontSize: { md: "1rem", lg: "1.2rem" },
                    },
                  }}
                >
                  {!deleting && (
                    <>
                      {folder.children?.map((file) => (
                        <TreeItem
                          itemId={file.label}
                          label={file.label}
                          key={file.label}
                          sx={{ paddingBottom: 0 }}
                        />
                      ))}
                    </>
                  )}
                </TreeItem>
              ))}
            </SimpleTreeView>
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
