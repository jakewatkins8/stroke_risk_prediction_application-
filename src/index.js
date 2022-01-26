import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.css';
import App from './App';
import { logToErrorQueue } from './Logger';


import { AuthContextProvider } from "./store/auth_context.jsx";
import { HashRouter } from 'react-router-dom';

import ErrorBoundary from './ErrorBoundary';

import { TouchContextProvider } from './store/touch_context';







window.onerror = (msg, src, line, col, error) => {
  
  error.cause = `uncaught; line:col ${line}:${col} of ${src}`;

  console.log(error.message);

  logToErrorQueue(error);
};

// receives PromiseRejectionEvents (say, an async function returns a promise rejection)
// window.onunhandledrejection = (e) => {
//   let error = new Error(e.reason);
//   error.cause = 'unhandled promise rejection';
//   logToErrorQueue(error);
// };

// window.addEventListener('error', (errorEvent) => {
// console.log('ERROR CAPTURED');
// console.log(errorEvent);
// });


// TODO:
// - check the order of wrapped elements below. 

ReactDOM.render(
  (
  <ErrorBoundary>
    <HashRouter>
      <AuthContextProvider>
        <TouchContextProvider>
          <App />
        </TouchContextProvider>
      </AuthContextProvider>
    </HashRouter>
  </ErrorBoundary>
  ),
  document.getElementById('root')
);

