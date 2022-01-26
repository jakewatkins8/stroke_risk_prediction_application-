import React, { useContext } from "react";
import { Switch, Route, BrowserRouter, NavLink } from "react-router-dom";
import LoginWindow from "./LoginWindow";

import { BASE_URL } from "./store/environment";

import { logToErrorQueue } from "./Logger";
import "./styles/ErrorBoundary.css";


export default class ErrorBoundary extends React.Component {

    constructor(props) {
        super(props);
        this.state = { 
            error: null,
        errorInfo: null 
        };

    }


    componentDidCatch(error, errorInfo) {
        
        // console.log(error, ':', errorInfo);
        
        // const errorJson = {'errordata': {
        //     'error': error,
        //     'errorInfo': errorInfo
        //     }
        // };
        
        // log the error object to the error queue:
        error.cause = "React render error";
        console.log('errB error:');
        console.log(Object.keys(error), Object.values(error));
        logToErrorQueue(error);

        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }


    render() {
        if (this.state.errorInfo) {
            // render a custom fallback UI
            return (
            <>
            <div className="errorwrapper">
                <h1 className="errorheader">Error</h1>
                <hr/>
                <h1 className="face">☹</h1>
                <h2>Sorry, an unexpected error has occurred.</h2>
                <hr/>
                <p>Please follow the below link to return to the home screen:</p>
                <a href={ BASE_URL } className="link">Return to Home Screen</a>
            </div>
            </>
            );
        }

        return this.props.children;
    }
}