import { useEffect } from "react";
import { useDataContext } from "../DataContext";


const Component = () => {
    const { data, setData } = useDataContext();


    useEffect(() => {
        console.log(data);
      }, [data]);

      
    return (
      <div>
        <h1>Comparison</h1>
      </div>
    );
  };
  
  export default Component;