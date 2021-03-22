import { useEffect, useState } from "react";
import { getLiveData } from "./api/ddareung";

function App() {
  // initialize liveData
  const [liveData, setLiveData] = useState([]);

  // fetch initialData from ddareung api
  useEffect(() => {
    async function fetchLiveData() {
      const initialData = await getLiveData();
      setLiveData(initialData);
    }
    fetchLiveData();
  }, []);

  return (
    <div>
      {liveData.length !== 0 &&
        liveData.map(stop => {
          const { stationId, stationName, parkingBikeTotCnt } = stop;
          return (
            <div key={stationId}>
              {stationName} / {parkingBikeTotCnt}대 남음
            </div>
          );
        })}
    </div>
  );
}

export default App;
