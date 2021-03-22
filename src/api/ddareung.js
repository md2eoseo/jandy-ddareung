const links = [
  `http://openapi.seoul.go.kr:8088/${process.env.REACT_APP_DDAREUNG_API_KEY}/json/bikeList/1/1000`,
  `http://openapi.seoul.go.kr:8088/${process.env.REACT_APP_DDAREUNG_API_KEY}/json/bikeList/1001/2000`,
  `http://openapi.seoul.go.kr:8088/${process.env.REACT_APP_DDAREUNG_API_KEY}/json/bikeList/2001/3000`,
];

export async function getLiveData() {
  let data = [];

  for (const link of links) {
    const partialData = await fetch(link)
      .then(res => res.json())
      .then(res => {
        // TODO: check if response is ok
        return res.rentBikeStatus.row;
      });
    data = data.concat(partialData);
  }

  return data;
}
