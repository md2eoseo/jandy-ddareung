import { useEffect, useRef, useState } from 'react';
import { getLiveData } from './api/ddareung';
import { geocoding, reverseGeocoding } from './api/navermaps';
import { RenderAfterNavermapsLoaded, NaverMap, Marker } from 'react-naver-maps';
import { useForm } from 'react-hook-form';

const defaultPos = [126.988205, 37.551229];
const noPos = [-1, -1];

function NaverMapWithMarkers({ liveData, currentPos, routeCenterPos, directRouteDistance, setLoadingCurrentPos }) {
  const navermaps = window.naver.maps;
  const [mapOptions, setMapOptions] = useState({
    center: {
      lng: currentPos[0],
      lat: currentPos[1],
    },
    zoom: 14,
  });

  useEffect(() => {
    setLoadingCurrentPos(false);
    if (currentPos !== noPos) {
      setMapOptions({
        center: {
          lng: currentPos[0],
          lat: currentPos[1],
        },
        zoom: 14,
      });
    }
  }, [currentPos]);

  useEffect(() => {
    if (routeCenterPos !== noPos) {
      // TODO: directRouteDistance를 사용해서 zoom 조절하기
      setMapOptions({
        center: {
          lng: routeCenterPos[0],
          lat: routeCenterPos[1],
        },
        zoom: 14,
      });
    }
  }, [routeCenterPos]);

  return (
    <NaverMap id="map" {...mapOptions}>
      {liveData.length !== 0 &&
        liveData.map(stop => {
          const { stationId, stationName, parkingBikeTotCnt, stationLatitude: lat, stationLongitude: lng } = stop;
          return (
            <Marker
              key={stationId}
              position={new navermaps.LatLng(lat, lng)}
              animation={2}
              onClick={() => {
                alert(`${stationName} / ${parkingBikeTotCnt}대 남음`);
              }}
            />
          );
        })}
    </NaverMap>
  );
}

function App() {
  // initialize liveData, starting point, destination
  const [liveData, setLiveData] = useState([]);
  const [currentPos, setCurrentPos] = useState(defaultPos);
  const [loadingCurrentPos, setLoadingCurrentPos] = useState(false);
  const [routeCenterPos, setRouteCenterPos] = useState(noPos);
  const [directRouteDistance, setDirectRouteDistance] = useState(0);
  const [startPos, setStartPos] = useState(noPos);
  const [destPos, setDestPos] = useState(noPos);

  const startingRef = useRef(null);
  const destinationRef = useRef(null);

  const { register, handleSubmit } = useForm();
  const { ref: startingHookRef, ...startingRest } = register('starting');
  const { ref: destinationHookRef, ...destinationRest } = register('destination');

  const getCoord = address => geocoding(address);
  const getAddress = coord => reverseGeocoding(coord);
  const getRouteCenterCoord = (startingCoord, destinationCoord) => [
    (startingCoord[0] + destinationCoord[0]) / 2,
    (startingCoord[1] + destinationCoord[1]) / 2,
  ];
  const getDirectRouteDistance = (startingCoord, destinationCoord) =>
    Math.sqrt((startingCoord[0] - destinationCoord[0]) ** 2 + (startingCoord[1] - destinationCoord[1]) ** 2);

  const handleCurrentPositionClick = () => {
    setLoadingCurrentPos(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        setCurrentPos([Number(position.coords.longitude), Number(position.coords.latitude)]);
      },
      () => {
        alert('현위치를 불러올 수 없습니다.');
        setLoadingCurrentPos(false);
      }
    );
  };

  const onSubmit = async ({ starting, destination }) => {
    if (starting === '') {
      alert('출발지를 입력해주세요.');
      startingRef.current.focus();
    } else if (destination === '') {
      alert('목적지를 입력해주세요.');
      destinationRef.current.focus();
    } else {
      const startingCoord = await getCoord(starting);
      const destinationCoord = await getCoord(destination);
      // TODO: 출발지/목적지 좌표 state로 할 수 있는게...
      setStartPos(startingCoord);
      setDestPos(destinationCoord);
      // TODO: 같은 array 동치 비교 왜 안 될까?
      if (startingCoord.toString() === noPos.toString()) {
        alert('출발지를 다시 입력해주세요.');
        startingRef.current.focus();
      } else if (destinationCoord.toString() === noPos.toString()) {
        alert('목적지를 다시 입력해주세요.');
        destinationRef.current.focus();
      } else {
        const routeCenterCoord = getRouteCenterCoord(startingCoord, destinationCoord);
        const directRouteDistance = getDirectRouteDistance(startingCoord, destinationCoord);
        console.log(`출발지 좌표: ${startingCoord}`);
        console.log(`목적지 좌표: ${destinationCoord}`);
        console.log(`경로 중심 좌표: ${routeCenterCoord}`);
        console.log(`경로 직선 거리: ${directRouteDistance}`);
        setRouteCenterPos(routeCenterCoord);
        setDirectRouteDistance(directRouteDistance);
      }
    }
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
      if (currentPos !== defaultPos) {
        const address = await getAddress(currentPos);
        startingRef.current.value = address;
        startingRef.current.focus();
      }
    }
    setStartingWithCurrentPos();
  }, [currentPos]);

  return (
    <div>
      <div className="searchBox">
        <button className="currentPosBtn" onClick={handleCurrentPositionClick} disabled={loadingCurrentPos}>
          {loadingCurrentPos ? '가져오는 중...' : '현재 위치 가져오기'}
        </button>
        <form className="searchForm" onSubmit={handleSubmit(onSubmit)}>
          <input
            className="starting"
            name="starting"
            placeholder="출발지를 입력해주세요..."
            ref={e => {
              startingHookRef(e);
              startingRef.current = e;
            }}
            {...startingRest}
          />
          <input
            className="destination"
            name="destination"
            placeholder="목적지를 입력해주세요..."
            ref={e => {
              destinationHookRef(e);
              destinationRef.current = e;
            }}
            {...destinationRest}
          />
          <button type="submit">찾기</button>
        </form>
      </div>
      <RenderAfterNavermapsLoaded
        ncpClientId={process.env.REACT_APP_NCP_CLIENT_ID}
        error={<p>Maps Load Error</p>}
        loading={<p>Maps Loading...</p>}
      >
        <NaverMapWithMarkers
          liveData={liveData}
          currentPos={currentPos}
          routeCenterPos={routeCenterPos}
          directRouteDistance={directRouteDistance}
          setLoadingCurrentPos={setLoadingCurrentPos}
        />
      </RenderAfterNavermapsLoaded>
    </div>
  );
}

export default App;
