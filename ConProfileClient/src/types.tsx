export interface TableDataDTO {
    filename: string;
    intensity: number[];
    spectrum: number;
  }
  
  export interface FolderDTO {
    id: number;
    foldername: string;
    excitation: number[];
    data: TableDataDTO[];
  }

  export interface ProjectDTO {
    idproject: number;
    projectname: string;
    folders: FolderDTO[];
  }

  export interface Factors {
    spectrum: number;
    factor: number;
  }

  export interface MultiplyFolderDTO {
    IDFOLDER: number;
    FACTORS: number[];
    SPECTRUMS: number[];
  }