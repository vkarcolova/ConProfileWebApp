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
  id?: number;
  spectrum?: number;
  name: string;
  intensities: (number | null | undefined)[];
}

// export interface MultipliedTableDataDTO {
//   filename: string;
//   multipliedintensity: number[];
//   factor: number;
// }


export interface ChartData {
  data: number[];
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
}
