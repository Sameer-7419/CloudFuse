import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Landing from "./routes/Landing";
import Auth from "./routes/Auth";
import Home from "./routes/Home";
import History from "./routes/History";
import FileDetails from "./routes/FileDetails";
import OAuthCallback from "./routes/OAuthCallback";

function App() {
  return (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/home" element={<Home />} />
        <Route path="/dashboard" element={<OAuthCallback />} />
        <Route path="/history" element={<History />} />
        <Route path="/file/:fileId" element={<FileDetails />} />
      </Routes>
  );
}

export default App;
