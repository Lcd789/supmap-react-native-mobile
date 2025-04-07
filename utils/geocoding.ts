export const getAddressFromCoords = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_API_KEY;
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}&language=fr`
  );
  const data = await response.json();
  if (data.status === "OK" && data.results.length > 0) {
    return data.results[0].formatted_address;
  }
  throw new Error("Impossible de récupérer l'adresse");
};
