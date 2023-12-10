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

  export interface Factors {
    spectrum: number;
    factor: number;
  }

  export interface MultiplyFolderDTO {
    IDFOLDER: number;
    FACTORS: number[];
    SPECTRUMS: number[];
  }