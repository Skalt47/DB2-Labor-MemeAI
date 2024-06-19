import { useState } from "react";
import Images from "./components/Images.jsx";
import GenerateImage from "./components/GenerateImage.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <GenerateImage />
      <Images />
    </>
  );
}

export default App;
