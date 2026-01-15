import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import SignIn from "./pages/SignIn";
import Header from "./components/Header";
import CreateResult from "./pages/CreateResult";
import Construction from "./pages/Construction";
import AddedSubjects from "./pages/AddedSubjects";
import ProtectedRoute from "./hoc/ProtectedRoute";
import PublicRoute from "./hoc/PublicRoute";
import UploadFiles from "./pages/UploadFiles";

function App() {
  return (
    <>
      <BrowserRouter>
        <Header />
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            }
          />
          <Route
            path="/create-result"
            element={
              <ProtectedRoute>
                <CreateResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/construction"
            element={
              <ProtectedRoute>
                <Construction />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload-files"
            element={
              <ProtectedRoute>
                <UploadFiles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subjects"
            element={
              <ProtectedRoute>
                <AddedSubjects />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
