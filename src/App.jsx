import React from "react";
import { CustomGoogleMap } from "./CustomGoogleMap.jsx";
import './styles.css';

function App() {
  return (
    <div className="app-container">
      <CustomGoogleMap zoom={10}/>
    </div>
  );
}

export default App;
