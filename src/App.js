import { useEffect, useState } from "react";
import { getLiveData } from "./api/ddareung";
import { geocoding } from "./api/navermaps";

function App() {
  // initialize liveData, starting point, destination
  const [liveData, setLiveData] = useState([]);
  const [starting, setStarting] = useState("");
  const [destination, setDestination] = useState("");

  const handleStartingChange = e => {
    setStarting(e.target.value);
  };
  const handleDestinationChange = e => {
    setDestination(e.target.value);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const startingGeocode = await getGeocode(starting);
    const destinationGeocode = await getGeocode(destination);
    console.log(
      `출발지 좌표: ${startingGeocode} \n목적지 좌표: ${destinationGeocode}`
    );
  };

  const getGeocode = async address => {
    // TODO: check address
    const coord = await geocoding(address);
    return coord;
  };

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
      <form onSubmit={handleSubmit}>
        <input
          className="starting"
          placeholder="출발지를 입력해주세요..."
          type="text"
          name="starting"
          value={starting}
          onChange={handleStartingChange}
        />
        <input
          className="destination"
          placeholder="목적지를 입력해주세요..."
          type="text"
          name="destination"
          value={destination}
          onChange={handleDestinationChange}
        />
        <button type="submit">찾기</button>
      </form>
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
