export interface FileContent {
  //na nacitanie suboru
  FILENAME: string;
  FOLDERNAME: string;
  CONTENT: string;
  IDPROJECT: number;
}

export interface IntensityDTO {
  idData?: number;
  intensity: number;
  multipliedintensity?: number;
  excitacion: number;
}

export interface FileDTO {
  id: number;
  filename: string;
  intensity: IntensityDTO[];
  spectrum: number;
}

export interface FolderDTO {
  id: number;
  foldername: string;
  excitation: number[];
  profile?: number[];
  data: FileDTO[];
}

export interface ProjectDTO {
  idproject: number;
  projectname: string;
  folders: FolderDTO[];
  created: Date;
}

export interface Profile {
  excitation: number[];
  profile: number[];
}

export interface Factors {
  spectrum: number;
  factor: number;
}

export interface MultiplyFolderDTO {
  IDFOLDER: number;
  FACTORS: number[];
  IDS: number[];
}

export interface TableData {
  excitacion: number[];
  intensities: TableDataColumn[];
  multipliedintensities?: TableDataColumn[];
  profileintensities?: TableDataColumn;
}

export interface TableDataColumn {
  name: string;
  intensities: (number | null | undefined)[];
}

// export interface MultipliedTableDataDTO {
//   filename: string;
//   multipliedintensity: number[];
//   factor: number;
// }
