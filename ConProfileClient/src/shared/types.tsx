export interface FileContent {
  //na nacitanie suboru
  FILENAME: string;
  FOLDERNAME: string;
  CONTENT: string;
  IDPROJECT: number;
  USEREMAIL?: string;
}

export interface IntensityDTO {
  idData?: number;
  intensity: number;
  multipliedintensity?: number;
  excitation: number;
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
  useremail: string;
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
  EXCITATION: number[];
}

export interface TableData {
  excitation: number[];
  intensities: TableDataColumn[];
  multipliedintensities?: TableDataColumn[];
}

export interface TableDataColumn {
  spectrum?: number;
  name: string;
  intensities: (number | undefined)[];
}

// export interface MultipliedTableDataDTO {
//   filename: string;
//   multipliedintensity: number[];
//   factor: number;
// }

export interface ChartData {
  data: (number | undefined)[];
  label: string;
}

export interface StatData {
  max: number;
  min: number;
  std: number;
}

export interface AllFolderData {
  chartData: ChartData[];
  normalStatData: StatData;
  multipliedStatData: StatData;
  folderData: FolderDTO;
  profileData: Profile;
  multiplied: boolean;
  tableData?: TableData;
  emptyDataColums: (number | undefined)[][];
}
