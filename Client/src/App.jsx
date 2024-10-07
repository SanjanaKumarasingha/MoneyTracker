// import React from "react";
// import { GlobalProvider } from "./context/globalContext"; // Adjust the path as necessary
// import Dashboard from "./pages/Dashboard/Dashboard";
// import IEForm from "./components/Form/IEForm";

// function App() {
//   return (
//     <GlobalProvider>
//       <Dashboard />
//       <IEForm />
//     </GlobalProvider>
//   );
// }

// export default App;

// src/App.js
import React from "react";
import AppRoutes from "./routes";

const App = () => {
  return (
    <div>
      <AppRoutes />
    </div>
  );
};

export default App;
