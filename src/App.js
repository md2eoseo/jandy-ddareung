import { useEffect, useState } from "react";
import { getLiveData } from "./api/ddareung";
import { geocoding, reverseGeocoding } from "./api/navermaps";

function App() {
  // initialize liveData, starting point, destination
  const [liveData, setLiveData] = useState([]);
  const [starting, setStarting] = useState("");
  const [destination, setDestination] = useState("");
  const [currentPos, setCurrentPos] = useState([]);

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

  const handleCurrentPositionClick = async e => {
    e.preventDefault();
    navigator.geolocation.getCurrentPosition(position => {
      setCurrentPos([position.coords.longitude, position.coords.latitude]);
    });
  };

  const getGeocode = async address => {
    // TODO: check address
    const coord = await geocoding(address);
    return coord;
  };

  const getAddress = async coord => {
    const address = await reverseGeocoding(coord);
    return address;
  };

  // fetch initialData from ddareung api
  useEffect(() => {
    async function fetchLiveData() {
      const initialData = await getLiveData();
      setLiveData(initialData);
    }
    fetchLiveData();
  }, []);

  // if currentPos changes, set starting with reverse geocoded address
  useEffect(() => {
    async function setStartingWithCurrentPos() {
      if (currentPos.length !== 0) {
        const address = await getAddress(currentPos);
        setStarting(address);
      }
    }
    setStartingWithCurrentPos();
  }, [currentPos]);

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <button onClick={handleCurrentPositionClick}>현재 위치 가져오기</button>
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
