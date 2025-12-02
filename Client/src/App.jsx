import { RouterProvider } from 'react-router-dom';
import { router } from './routes';

// import AppRoutes from "./routes";
import "./App.css";

const App = () => {
  return (
    <RouterProvider router={router} />
  );
};

export default App;
