import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SubmitComplaint from "./pages/SubmitComplaint";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/submit" element={<SubmitComplaint />} />
      </Routes>
    </BrowserRouter>
  );
}