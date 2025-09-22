import { BrowserRouter, Routes, Route,Navigate} from "react-router-dom";

// import Guides from "./pages/Guides";
// import Galleries from "./pages/Galleries";
import Homepage from "./pages/Homepage";
import PageNotFound from "./pages/PageNotFound";
import Login from "./pages/Login";
import AppLayout from "./pages/AppLayout";
import CityList from "./components/CityList";
import CountryList from "./components/CountryList";
import City from "./components/City"
import Form from "./components/Form"
import { CitiesProvider } from "./contexts/CitiesContext";
import Signup from "./pages/Signup";
import Guides from "./pages/Guides";
import Galleries from "./pages/Gallaries";

function App() {
  return (
    <>
    <CitiesProvider>

      <BrowserRouter>
        <Routes>
          <Route index element={<Homepage />} />


          <Route path="gallery" element={<Galleries/>} />
          <Route path="guide" element={<Guides />} />

          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />

          <Route path="app" element={<AppLayout />}>
            
            <Route
              index
              element={<Navigate replace  to="cities"/>}
              />
            
            <Route
              path="cities"
              element={<CityList  />}
              />
            
            <Route path="cities/:id" element={<City/>}/>

            <Route
              path="countries"
              element={<CountryList/>}
              />
            <Route path="form" element={<Form/>} />
          </Route>

           <Route path="*" element={<PageNotFound />} />
        </Routes>
      </BrowserRouter>
    </CitiesProvider>
     </>
  );
}

export default App;
