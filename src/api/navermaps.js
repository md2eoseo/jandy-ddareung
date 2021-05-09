import axios from 'axios';

const geocodingUrl = '/api/map-geocode/v2/geocode';
const reverseGeocodingUrl = '/api/map-reversegeocode/v2/gc';
const noCoord = { lng: -1, lat: -1 };

export async function geocoding(query) {
  const coord = await axios
    .get(`${geocodingUrl}`, {
      params: {
        query,
      },
      headers: {
        'X-NCP-APIGW-API-KEY-ID': `${process.env.REACT_APP_NCP_CLIENT_ID}`,
        'X-NCP-APIGW-API-KEY': `${process.env.REACT_APP_NCP_CLIENT_SECRET}`,
      },
    })
    .then(res => {
      // TODO: check if response is ok
      return res.data;
    })
    .then(data => {
      if (data.addresses.length > 1) {
        console.log(`"${query}"에는 여러 주소가 있어요.`);
      } else if (data.addresses.length === 0) {
        console.log(`"${query}"에 해당되는 좌표가 없어요.`);
        return noCoord;
      }
      return { lng: Number(data.addresses[0].x), lat: Number(data.addresses[0].y) };
    });

  return coord;
}

export async function reverseGeocoding(coord) {
  const address = await axios
    .get(`${reverseGeocodingUrl}`, {
      params: {
        coords: `${coord.lng},${coord.lat}`,
        orders: 'legalcode,addr,admcode,roadaddr',
        output: 'json',
      },
      headers: {
        'X-NCP-APIGW-API-KEY-ID': `${process.env.REACT_APP_NCP_CLIENT_ID}`,
        'X-NCP-APIGW-API-KEY': `${process.env.REACT_APP_NCP_CLIENT_SECRET}`,
      },
    })
    .then(res => {
      if (res.statusText === 'OK') return res.data.results;
    })
    .then(results => {
      const addressArr = [];
      results.forEach(result => {
        if (result.name === 'admcode') {
          for (let area in result.region) {
            if (area !== 'area0' && area !== 'area1') {
              if (result.region[area].name !== '') {
                addressArr.push(result.region[area].name);
              }
            }
          }
        }
      });
      return addressArr.join(' ');
    });

  return address;
}
