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
  factor?: number; //pridat do db TODO
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

export interface ColumnDTO {
  name: string;
  intensities: (number | undefined)[];
  excitations: number[];
}

export interface AllFolderData {
  chartData: ChartData[];
  normalStatData: StatData;
  multipliedStatData: StatData;
  folderData: FolderDTO;
  profileData: Profile;
  multiplied: boolean;
  tableData?: TableData;
  emptyDataColums: ColumnDTO[];
}

export interface CalculatedDataDTO {
  idfile: number;
  calculatedintensities: number[];
  excitacions: number[];
}

export interface DataBankFileDTO {
  id?: number;
  folderId: number | null;
  fileName: string;
  type: string;
  size: number;
  content: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface DataBankFolderDTO {
  id?: number;
  folderName: string;
  createdAt: string;
  files: DataBankFileDTO[];
}

export interface DatabankExcelContentDTO {
  id: number;
  fileName: string;
  contentBase64: string;
}

export interface ExcelContent {
  data: string[][];
  header: string[];
  name: string;
  idproject?: number;
}
