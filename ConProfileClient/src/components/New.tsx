import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface Data {

}

const New = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('https://localhost:44300/LoadedData/GetAllLoadedData'); 
        console.log(response);
        setData(response.data);
      } catch (error) {
        console.error('Chyba pri načítavaní dát:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
    </div>
  );
};

export default New;