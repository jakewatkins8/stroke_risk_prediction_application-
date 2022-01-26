import React, { useContext, useEffect } from "react";

import { Route, Redirect, Switch } from "react-router-dom";

import LoginWindow from "./LoginWindow.jsx";
import AppWindow from "./components/AppWindow.jsx";
import Assessment from "./Assessment.jsx";
import DataVisuals from "./DataVisuals.jsx";
import Settings from "./Settings";

import AuthContext from "./store/auth_context.jsx";

import TouchContext from "./store/touch_context";

const App = () => {

  const authCtx = useContext(AuthContext);

  // 
  const touchCtx = useContext(TouchContext);
  // 
  const touchListener = () => {
    // console.log('the application screen has been touched.');
    // console.log('touchCtx userTouch val:', touchCtx.userTouch);
    if (!touchCtx.userTouch) {
      touchCtx.setUserTouch();
    }
  };
  // 
  // 
  useEffect(() => {
    window.addEventListener('touchstart', touchListener);

    // cleanup of event listener
    // if this is...right.
    return (() => {
      window.removeEventListener('touchstart', touchListener);
    })
  }, []);
  // 


  return (
      <AppWindow>
        <Switch>
          <Route exact path="/">
            {!authCtx.isLoggedIn ? <Redirect to="/login" /> : <Redirect to="/assessment" />}
          </Route>
          <Route exact path="/login">
            {authCtx.isLoggedIn ? <Redirect to="/assessment" /> : <LoginWindow />}
          </Route>
          <Route exact path="/assessment">
            {authCtx.isLoggedIn ? <Assessment /> : <Redirect to="/" />}
          </Route>
          <Route exact path="/data">
            {/* Route accessible outside of login in order to throw render error - 
            debug of ErrorBoundary page */}
            {/* Comment out below when live */}
            {/* <DataVisuals />  */}
            {/* Uncomment below when live */}
            {authCtx.isLoggedIn ? <DataVisuals /> : <Redirect to="/" />}
          </Route>
          <Route exact path="/settings">
            {authCtx.isLoggedIn ? <Settings /> : <Redirect to="/" />}
          </Route>
          <Route path="*">
            <Redirect to="/"/>
          </Route>
        </Switch>
      </AppWindow>
  );
};

export default App;
