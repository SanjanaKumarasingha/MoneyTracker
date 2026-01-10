import { RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { router } from './routes';
import { store } from './store';
import { MenuOpenProvider } from './provider/MenuOpenProvider';
import { RecordDateProvider } from './provider/RecordDataProvider';
import { AuthProvider } from './provider/AuthProvider';
import { DarkModeProvider } from './provider/DarkModeProvider';

import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import 'react-datepicker/dist/react-datepicker.css';

export const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Provider store={store}>
        <AuthProvider>
          <DarkModeProvider>
            <MenuOpenProvider>
              <RecordDateProvider>
                <RouterProvider router={router} />
              </RecordDateProvider>
            </MenuOpenProvider>
          </DarkModeProvider>
        </AuthProvider>
      </Provider>
      <ToastContainer />
    </QueryClientProvider>
  );
}

export default App;
