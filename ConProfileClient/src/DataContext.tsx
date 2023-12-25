import React from 'react';
import { createContext, useContext } from 'react';

interface DataContextProps {
  // Definujte typy dát, ktoré chcete ukladať
  data: string[];
  setData: React.Dispatch<React.SetStateAction<string[]>>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within a DataContextProvider');
  }
  return context;
};

export const DataContextProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }) => {
    // Inicializujte dáta a funkcie na aktualizáciu dát
    const [data, setData] = React.useState<string[]>([]);
  
    return (
      <DataContext.Provider value={{ data, setData }}>
        {children}
      </DataContext.Provider>
    );
  };
  
