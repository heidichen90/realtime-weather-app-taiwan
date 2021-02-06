import { useState, useEffect, useCallback } from "react";

const fetchWeatherForcast = (cityName) => {
  return fetch(
    `https://opendata.cwb.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=CWB-9DB55513-F2CE-42AC-9EBF-24B716B033FE&locationName=%E8%87%BA%E5%8C%97%E5%B8%82&locationName=${cityName}`
  )
    .then((response) => response.json())
    .then((data) => {
      const locationData = data.records.location[0];

      const weatherElement = locationData.weatherElement.reduce(
        (neededElements, item) => {
          if (["Wx", "PoP", "CI"].includes(item.elementName)) {
            neededElements[item.elementName] = item.time[0].parameter;
          }
          return neededElements;
        },
        {}
      );

      return {
        description: weatherElement.Wx.parameterName,
        weatherCode: weatherElement.Wx.parameterValue,
        rainPossibility: weatherElement.PoP.parameterName,
        comfortability: weatherElement.CI.parameterName
      };
    });
};

const fetchCurrentWeather = (locationName) => {
  return fetch(
    `https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=CWB-9DB55513-F2CE-42AC-9EBF-24B716B033FE&locationName=${locationName}`
  )
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      const locationData = data.records.location[0];

      const weatherElement = locationData.weatherElement.reduce((acc, item) => {
        if (["WDSD", "TEMP", "HUMD"].includes(item.elementName)) {
          acc[item.elementName] = item.elementValue;
        }
        return acc;
      }, {});

      return {
        observationTime: locationData.time.obsTime,
        locationName: locationData.locationName,
        temperature: weatherElement.TEMP,
        windSpeed: weatherElement.WDSD,
        humidity: weatherElement.HUMD
      };
    });
};

const useWeatherApi = (currentLocation) => {
  const {locationName, cityName} = currentLocation;
  const [weatherElements, setWeatherElements] = useState({
    observationTime: new Date(),
    locationName: "",
    humid: 0,
    temperature: 0,
    windSpeed: 0,
    description: "",
    weatherCode: 0,
    rainPossibility: 0,
    comfortability: "",
    isLoading: true
  });

  const fetchData = useCallback(() => {
    const fetchingData = async () => {
      const [currentWeather, weatherForcast] = await Promise.all([
        fetchCurrentWeather(locationName),
        fetchWeatherForcast(cityName)
      ]);
      setWeatherElements({
        ...currentWeather,
        ...weatherForcast,
        isLoading: false
      });
    };

    setWeatherElements((prevState) => ({
      ...prevState,
      isLoading: true
    }));
    fetchingData();
  }, [locationName, cityName]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return [weatherElements, fetchData];
};

export default useWeatherApi;
