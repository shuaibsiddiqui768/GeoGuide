import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Homepage from "./pages/Homepage";
import PageNotFound from "./pages/PageNotFound";
import Login from "./pages/Login";
import AppLayout from "./pages/AppLayout";
import CityList from "./components/CityList";
import CountryList from "./components/CountryList";
import City from "./components/City";
import Form from "./components/Form";
import { CitiesProvider } from "./contexts/CitiesContext";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Signup from "./pages/Signup";
import Settings from "./pages/Settings";
import Guides from "./pages/Guides";
import Galleries from "./pages/Gallaries";

function App() {
  return (
    <AuthProvider>
      <CitiesProvider>
        <BrowserRouter>
          <Routes>
            <Route index element={<Homepage />} />

            <Route path="gallery" element={<Galleries />} />
            <Route path="guide" element={<Guides />} />

            <Route path="login" element={<Login />} />
            <Route path="signup" element={<Signup />} />
            <Route
              path="settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route path="app" element={<AppLayout />}>
              {/* nested routes */}
              <Route
                index
                // default set to city app/city
                element={<Navigate replace to="cities" />}
              />

              <Route path="cities" element={<CityList />} />

              <Route path="cities/:id" element={<City />} />

              <Route path="countries" element={<CountryList />} />

              {/* Protected route - only logged in users can add cities */}
              <Route
                path="form"
                element={
                  <ProtectedRoute>
                    <Form />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </BrowserRouter>
      </CitiesProvider>
    </AuthProvider>
  );
}

export default App;

