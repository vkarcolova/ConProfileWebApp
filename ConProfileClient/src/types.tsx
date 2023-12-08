export interface TableDataDTO {
    filename: string;
    intensity: number[];
    spectrum: number;
  }
  
  export interface FolderDTO {
    foldername: string;
    excitation: number[];
    data: TableDataDTO[];
  }

  export interface Factors {
    spectrum: number;
    factor: number;
  }