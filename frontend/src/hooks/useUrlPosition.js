import { useSearchParams } from "react-router-dom";
//useSearchParams read the URL query string

export function useUrlPosition(){
      const [searchParams] = useSearchParams();
      const lat = searchParams.get("lat");
      const lng = searchParams.get("lng");

      return [lat,lng] ;
}
// URL: /app/form?lat=12.345&lng=67.890 → useUrlPosition() returns ["12.345", "67.890"]