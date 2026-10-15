import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Home from "./pages/Home.jsx";
import Tariff from "./pages/Tariff.jsx";
import Book from "./pages/Book.jsx";
const Payment = lazy(() => import("./pages/Payment.jsx"));
const Success = lazy(() => import("./pages/Success.jsx"));
const Admin = lazy(() => import("./pages/Admin.jsx"));
import Track from "./pages/Track.jsx";
const Invoice = lazy(() => import("./pages/Invoice.jsx"));
import NotFound from "./pages/NotFound.jsx";
import { Privacy, Refund, Terms } from "./pages/Legal.jsx";
import { SiteProvider } from "./site.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <SiteProvider>
    <BrowserRouter>
      <Suspense fallback={null}>
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
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
    </SiteProvider>
  </StrictMode>
);
