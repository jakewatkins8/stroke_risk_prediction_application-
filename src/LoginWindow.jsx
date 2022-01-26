import React, { useState, useEffect, useContext, useCallback } from "react";
import { useHistory } from "react-router-dom";
import "./styles/LoginWindow.css";
import AuthContext from "./store/auth_context";

import { BASE_URL } from "./store/environment"
import { logToErrorQueue } from "./Logger";

const Login = (props) => {

    const authCtx = useContext(AuthContext);

    const history = useHistory();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [isLoading, setIsLoading] = useState(false);

    const [message, setMessage] = useState("");

    const [error, setError] = useState(false);

    function handleChange(event) {

        if (event.target.name === "username") {
            setUsername(event.target.value);
        }
        if (event.target.name === "password") {
            setPassword(event.target.value);
        }
    
    }

    // i think authCtx.autoLoggedOut is a safe dependency here, right?
    // hm.
    useEffect(() => {
        if (authCtx.autoLoggedOut) {
            setError(true);
            setMessage("Your login session has expired.");
        }
    }, [authCtx.autoLoggedOut]);


    // TODO testing throwing an error to the errorQueue:
    // useEffect(() => {

    //     console.log('run run run run ');
    //     // let jimmy = 'this - looks - like - a - job - for -- ME!';
    //     try {
    //         null.props = '2'/NaN+(+23); 
    //         console.log('no problems here.');
    //     }
    //     catch (err) {
    //         err.cause = 'JIMMY!!!!';
    //         logToErrorQueue(err); 
    //     }
    // }, []);


    async function send(event) {

        // suppress page change on form submit:
        event.preventDefault();

        // clear any old messages?
        // 
        setMessage("");

        // first, validate that username and password fields are not blank:
        if (!username || !password) {

            // update UI
            setError(true);
            setMessage('Please fill in both fields.');

            return;
        }

        setIsLoading(true);
        

        let user = {
        username: username,
        password: password
        };


        try {

            const response = await fetch((BASE_URL + "login"), {
                method: 'POST',
                body: JSON.stringify(user),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const result = await response.json();
            console.log(result);

            // if an error message is returned in a JSON object:
            if (result.error || !result.expiration_time) {
                // console.log('it has an ERROR');
                // console.log(result.error);
                setError(true);
                setMessage(result.error);
                setIsLoading(false);
                // and return; do not try to log in or set times below
                return;
            }
            //setMessage(JSON.stringify(result));


            // obtain new expiration in time from the data passed in the jwt:
            const expireTime = new Date(new Date().getTime() + (+result.expiration_time * 1000));

            console.log('expireTime:', expireTime.toISOString());

            authCtx.login(result.access_token, expireTime.toISOString(), result.refresh_token);

            // -----> see how this goes:
            // setIsLoading(false);
            // seems unnecessary since the component receiving the state is unmounted by then.
            // but, do I need to clean up anything before it's unmounted? Hm.
            

            history.replace("/assessment");

        } catch(error) {
            setIsLoading(false);
            setMessage("Something went wrong while logging in. Please try again.");
            
            // console.log(error);
            
            error.cause = "login fetch request";
            logToErrorQueue(error);
        }



    }

  



    return (
    <>
    <div className="loginwindow">
        <h2>User Login</h2>
        <form onSubmit={send}  method="post">
        <div className="formGrid">
            <label htmlFor="username">Username</label>
            <input onChange={handleChange} name="username" id="username" type='text' value={username}></input>
            <label htmlFor="password">Password</label>
            <input onChange={handleChange} name="password" id="password" type='password' value={password}></input>
        </div>
        {
            !isLoading && 
            (error && <div className='messageBox messageBoxError'>
                <p>{message}</p>
            </div>)
        }

        {isLoading && (<div className='loadingWrapper'>
        <div className='loading1'></div>
        <div className='loading2'></div>
        </div>
        )}

        
        <div className="buttonWrapper">
            <button type="submit">Log In</button>
        </div>
        </form>
    </div>
    </>
    );
}

export default Login;