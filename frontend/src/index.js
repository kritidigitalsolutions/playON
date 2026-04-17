import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import App from "./App.jsx";
import { APP_BASENAME } from "./utils/appPaths";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <BrowserRouter basename={APP_BASENAME}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
