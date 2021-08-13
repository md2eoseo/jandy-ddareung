import { useEffect, useRef, useState } from 'react';
import { getLiveData } from './api/ddareung';
import { geocoding, reverseGeocoding } from './api/navermaps';
import { RenderAfterNavermapsLoaded, NaverMap, Marker } from 'react-naver-maps';
import { useForm } from 'react-hook-form';
import CurrentPositionIcon from './img/ic_my_location_48px.svg';
import SwapIcon from './img/ic_swap_horiz_48px.svg';
import SearchIcon from './img/ic_search_48px.svg';
import StartIcon from './img/ic_android_48px.svg';
import DestIcon from './img/ic_golf_course_48px.svg';
import GreenStop from './img/greenStop.png';
import OrangeStop from './img/orangeStop.png';
import GrayStop from './img/grayStop.png';

const defaultCoord = { lng: 126.988205, lat: 37.551229 };
const noCoord = { lng: -1, lat: -1 };

function NaverMapWithMarkers({ liveData, currentCoord, startCoord, destCoord, routeCenterCoord, directRouteDistance }) {
  const navermaps = window.naver.maps;
  const [info, setInfo] = useState('');
  const [mapOptions, setMapOptions] = useState({
    center: {
      lng: currentCoord.lng,
      lat: currentCoord.lat,
    },
    zoom: 14,
  });

  const infoRef = useRef();
  const tsRef = useRef();

  useEffect(() => {
    setMapOptions({
      center: {
        lng: currentCoord.lng,
        lat: currentCoord.lat,
      },
      zoom: 16,
    });
  }, [currentCoord]);

  useEffect(() => {
    if (routeCenterCoord !== undefined) {
      // TODO: directRouteDistance를 사용해서 zoom 조절하기
      setMapOptions({
        center: {
          lng: routeCenterCoord.lng,
          lat: routeCenterCoord.lat,
        },
        zoom: 14,
      });
    }
  }, [routeCenterCoord]);

  const whichIcon = count => (count === 0 ? GrayStop : count < 5 ? OrangeStop : GreenStop);

  const onStopClick = (stationName, parkingBikeTotCnt) => {
    setInfo(`${stationName} / ${parkingBikeTotCnt}대 남음`);
    if (infoRef.current.classList.contains('show')) {
      clearTimeout(tsRef.current);
    }
    infoRef.current.classList.add('show');
    tsRef.current = setTimeout(() => {
      infoRef.current.classList.remove('show');
    }, 3000);
  };

  return (
    <>
      <NaverMap id="map" {...mapOptions}>
        {liveData.length !== 0 &&
          liveData.map(stop => {
            const { stationId, stationName, parkingBikeTotCnt, stationLatitude: lat, stationLongitude: lng } = stop;
            return (
              <Marker
                key={stationId}
                position={new navermaps.LatLng(lat, lng)}
                icon={whichIcon(Number(parkingBikeTotCnt))}
                onClick={() => {
                  onStopClick(stationName, parkingBikeTotCnt);
                }}
              />
            );
          })}
        {startCoord && <Marker position={new navermaps.LatLng(startCoord.lat, startCoord.lng)} icon={StartIcon} />}
        {destCoord && <Marker position={new navermaps.LatLng(destCoord.lat, destCoord.lng)} icon={DestIcon} />}
      </NaverMap>
      <div className="infoBox" ref={infoRef}>
        {info}
      </div>
    </>
  );
}

function App() {
  // initialize liveData, starting point, destination
  const [liveData, setLiveData] = useState([]);
  const [currentCoord, setCurrentCoord] = useState(defaultCoord);
  const [loadingCurrentPos, setLoadingCurrentPos] = useState(false);
  const [routeCenterCoord, setRouteCenterCoord] = useState();
  const [directRouteDistance, setDirectRouteDistance] = useState(0);
  const [startCoord, setStartCoord] = useState();
  const [destCoord, setDestCoord] = useState();

  const startingRef = useRef(null);
  const destinationRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    setValue,
  } = useForm();
  const { ref: startingHookRef, ...startingRest } = register('starting', { required: '출발지를 입력해주세요.' });
  const { ref: destinationHookRef, ...destinationRest } = register('destination', { required: '목적지를 입력해주세요.' });

  // if currentCoord changes, set starting with reverse geocoded address
  const setStartingWithCurrentPosAddress = async coord => {
    if (!Object.is(coord, defaultCoord)) {
      const address = await getAddress(coord);
      setValue('starting', address);
      destinationRef.current.focus();
    }
  };

  const onCurrentPosClick = () => {
    setLoadingCurrentPos(true);
    navigator.geolocation.getCurrentPosition(
      position => {
        const coord = { lng: Number(position.coords.longitude), lat: Number(position.coords.latitude) };
        setCurrentCoord(coord);
        setStartingWithCurrentPosAddress(coord);
        setStartCoord(coord);
        setLoadingCurrentPos(false);
      },
      () => {
        alert('현위치를 불러올 수 없습니다.');
        setLoadingCurrentPos(false);
      }
    );
  };

  const swapAddress = () => {
    const { starting, destination } = getValues();
    setValue('starting', destination);
    setValue('destination', starting);
  };

  const getCoord = address => geocoding(address);
  const getAddress = coord => reverseGeocoding(coord);
  const getRouteCenterCoord = (startingCoord, destinationCoord) => ({
    lat: (startingCoord.lat + destinationCoord.lat) / 2,
    lng: (startingCoord.lng + destinationCoord.lng) / 2,
  });
  const getDirectRouteDistance = (startingCoord, destinationCoord) =>
    Math.sqrt((startingCoord.lat - destinationCoord.lat) ** 2 + (startingCoord.lng - destinationCoord.lng) ** 2);

  const validateForm = (starting, destination) => {
    if (starting.trim() === '') {
      alert('출발지를 다시 입력해주세요.');
      setValue('starting', starting.trim());
      startingRef.current.focus();
      return false;
    }
    if (destination.trim() === '') {
      alert('목적지를 다시 입력해주세요.');
      setValue('destination', destination.trim());
      destinationRef.current.focus();
      return false;
    }
    return true;
  };

  const validateCoord = (startingCoord, destinationCoord) => {
    if (Object.is(startingCoord, noCoord)) {
      alert('출발지 좌표를 찾을 수 없습니다.');
      startingRef.current.focus();
      return false;
    }
    if (Object.is(destinationCoord, noCoord)) {
      alert('목적지 좌표를 찾을 수 없습니다.');
      destinationRef.current.focus();
      return false;
    }
    return true;
  };

  const onSearch = async ({ starting, destination }) => {
    const isFormOK = validateForm(starting, destination);
    if (!isFormOK) {
      return;
    }
    const startingCoord = await getCoord(starting);
    const destinationCoord = await getCoord(destination);
    const isCoordOK = validateCoord(startingCoord, destinationCoord);
    if (!isCoordOK) {
      return;
    }
    const routeCenterCoord = getRouteCenterCoord(startingCoord, destinationCoord);
    const directRouteDistance = getDirectRouteDistance(startingCoord, destinationCoord);
    setStartCoord(startingCoord);
    setDestCoord(destinationCoord);
    setRouteCenterCoord(routeCenterCoord);
    setDirectRouteDistance(directRouteDistance);
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
    <div className="wrapper">
      <form className="searchBox" onSubmit={handleSubmit(onSearch)}>
        <button className="currentPosBtn" type="button" disabled={loadingCurrentPos}>
          <img src={CurrentPositionIcon} alt="CurrentPositionIcon" onClick={onCurrentPosClick} />
        </button>
        <input
          className="addressInput"
          name="starting"
          placeholder="출발지"
          ref={e => {
            startingHookRef(e);
            startingRef.current = e;
          }}
          {...startingRest}
          style={errors.starting && { borderBottomColor: 'red' }}
        />
        <button className="swapBtn" type="button">
          <img src={SwapIcon} alt="SwapIcon" onClick={swapAddress} />
        </button>
        <input
          className="addressInput"
          name="destination"
          placeholder="목적지"
          ref={e => {
            destinationHookRef(e);
            destinationRef.current = e;
          }}
          {...destinationRest}
          style={errors.destination && { borderBottomColor: 'red' }}
        />
        <button className="searchBtn">
          <img src={SearchIcon} alt="SearchIcon" />
        </button>
      </form>
      <RenderAfterNavermapsLoaded
        ncpClientId={process.env.REACT_APP_NCP_CLIENT_ID}
        error={<p>Maps Load Error</p>}
        loading={<p>Maps Loading...</p>}
      >
        <NaverMapWithMarkers
          liveData={liveData}
          currentCoord={currentCoord}
          startCoord={startCoord}
          destCoord={destCoord}
          routeCenterCoord={routeCenterCoord}
          directRouteDistance={directRouteDistance}
        />
      </RenderAfterNavermapsLoaded>
    </div>
  );
}

export default App;
