import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Homepage from "./pages/Homepage";
import PageNotFound from "./pages/PageNotFound";
import Login from "./pages/Login";
import AppLayout from "./pages/AppLayout";
import CityList from "./components/CityList";
import CountryList from "./components/CountryList";
import City from "./components/City";
import Form from "./components/Form";
import TourList from "./components/TourList";
import Tour from "./components/Tour";
import { CitiesProvider } from "./contexts/CitiesContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ToursProvider } from "./contexts/ToursContext";
import { SocialProvider } from "./contexts/SocialContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Signup from "./pages/Signup";
import Settings from "./pages/Settings";
import Guides from "./pages/Guides";
import Galleries from "./pages/Gallaries";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import Friends from "./pages/Friends";
import UserProfile from "./pages/UserProfile";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <AuthProvider>
      <CitiesProvider>
        <ToursProvider>
          <SocialProvider>
            <BrowserRouter>
              <Routes>
                <Route index element={<Homepage />} />

                <Route path="gallery" element={<Galleries />} />
                <Route path="guide" element={<Guides />} />
                
                {/* Search - accessible but with limited features if not logged in */}
                <Route
                  path="search"
                  element={
                    <ProtectedRoute>
                      <Search />
                    </ProtectedRoute>
                  }
                />

                <Route path="login" element={<Login />} />
                <Route path="signup" element={<Signup />} />
                
                {/* Settings */}
                <Route
                  path="settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                
                {/* My Profile */}
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                
                {/* Friends Page */}
                <Route
                  path="friends"
                  element={
                    <ProtectedRoute>
                      <Friends />
                    </ProtectedRoute>
                  }
                />
                
                {/* Public User Profile */}
                <Route
                path="user/:identifier"
                  element={
                    <ProtectedRoute>
                      <UserProfile />
                    </ProtectedRoute>
                  }
                />

                {/* Notifications */}
                <Route
                  path="notifications"
                  element={
                    <ProtectedRoute>
                      <Notifications />
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

                  {/* Tour routes */}
                  <Route
                    path="tours"
                    element={
                      <ProtectedRoute>
                        <TourList />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="tours/:id"
                    element={
                      <ProtectedRoute>
                        <Tour />
                      </ProtectedRoute>
                    }
                  />

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
          </SocialProvider>
        </ToursProvider>
      </CitiesProvider>
    </AuthProvider>
  );
}

export default App;
