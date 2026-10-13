import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Tariff from "./pages/Tariff.jsx";
import Book from "./pages/Book.jsx";
import Payment from "./pages/Payment.jsx";
import Success from "./pages/Success.jsx";
import Admin from "./pages/Admin.jsx";
import Track from "./pages/Track.jsx";
import Invoice from "./pages/Invoice.jsx";
import { Privacy, Refund, Terms } from "./pages/Legal.jsx";
import { SiteProvider } from "./site.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SiteProvider>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="tariff" element={<Tariff />} />
          <Route path="book" element={<Book />} />
          <Route path="payment" element={<Payment />} />
          <Route path="success" element={<Success />} />
          <Route path="track" element={<Track />} />
          <Route path="invoice" element={<Invoice />} />
          <Route path="terms" element={<Terms />} />
          <Route path="refund" element={<Refund />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </SiteProvider>
  </StrictMode>
);
