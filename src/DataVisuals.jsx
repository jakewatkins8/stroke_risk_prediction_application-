import { useEffect, useState, useContext, useRef, useCallback, useMemo } from "react";
import "./components/patients";
import "./styles/DataVisuals.css";

import Plotly from "plotly.js-cartesian-dist";
import createPlotlyComponent from 'react-plotly.js/factory';

// this seems to crash the compiler:
// import Plot from 'react-plotly.js';

import QueryStatement from "./components/QueryStatement";


import AuthContext from "./store/auth_context";

import { BASE_URL } from "./store/environment";
import { logToErrorQueue } from "./Logger";


import TouchContext from "./store/touch_context";


const Plot = createPlotlyComponent(Plotly);

const DataVisuals = () => {

    const authCtx = useContext(AuthContext);

    const [patientData, setPatientData] = useState([]);

    const [customQueryData, setCustomQueryData] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setExpanded] = useState(true);

    const [isCustomExpanded, setCustomExpanded] = useState(false);

    const [queryData, setQueryData] = useState(
        {"0": 
            {
                'statement_id': 0,
                'type': 'base',
                'chaining_op': null,
                'attribute': 'id',
                'operator': 'equals',
                'attributeval': null
            }
        });

    const [error, setError] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");


// disused plotLoading state hooks:
 
    const [plot1loading, setPlot1Loading] = useState(false);
    const [plot2loading, setPlot2Loading] = useState(false);
    const [plot3loading, setPlot3Loading] = useState(false);
    const [plot4loading, setPlot4Loading] = useState(false);
    const [plot5loading, setPlot5Loading] = useState(false);
    const [custPlotLoading, setCustPlotLoading] = useState(false);


    // bg colors for the interactive plot switch buttons:
    const plotSwitchOnColor = '#FFF';
    const plotSwitchOffColor = '#000';




    const [activeCustPlot, setActiveCustPlot] = useState('bp');

    const [plot1, setPlot1] = useState({
        data: null,
        layout: null,
        config: null
    });

    const [plot2, setPlot2] = useState({
        data: null,
        layout: null,
        config: null
    });

    const [plot3, setPlot3] = useState({
        data: null,
        layout: null,
        config: null
    });

    const [plot4, setPlot4] = useState({
        data: null,
        layout: null,
        config: null
    });

    const [plot5, setPlot5] = useState({
        data: null,
        layout: null,
        config: null
    });

    const getData = () => {

        setPatientData([]);
        // console.log("getting full patient data:");

        // setIsLoading(true);

        fetch((BASE_URL + 'api/patients'), 
        {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        }).then(res => {
            
            if (res.ok) {
            return res.json();
            }
            // if the res status is 422, the fetch was likely missing a token.
            // so perform an autologout if that happens.
            else if (res.status === 422 || res.status === 401) {
                authCtx.logout(true);
            }
            else {
                let err = new Error('something went wrong getting the patient data from the server.');
                throw err;
            }
            
            }
        ).then(data => {


            // if the received data does NOT have an error message property included:
            if (!data.hasOwnProperty('errormsg')) {

                console.log('it\'s set');

                setPatientData(data);
            }
            else {
                console.log(data['errormsg']);
            }
            
            // setIsLoading(false);

        }
        ).catch(error => {
            error.cause = "patient data fetch request";
            logToErrorQueue(error);
        });


    };

    const initBarPlot1 = (dataSource = patientData, custom = false) => {

        // // filter the values out of patientData?
        // // stroke == 0 && stroke == 1?
        // const strokeNeg = patientData.filter(dataRow => dataRow.stroke == 0);
        // console.log(strokeNeg.length);

        // and then, get the counts of which ones are hyper == 0 and hyper == 1:
        const strokeNegHyperNeg = dataSource.filter(dataRow => {
            return (dataRow.stroke === 0 && dataRow.hyper === 0); 
        });
        // console.log("0, 0 ->", strokeNegHyperNeg.length);

        const strokeNegHyperPos = dataSource.filter(dataRow => {
            return (dataRow.stroke === 0 && dataRow.hyper === 1); 
        });
        // console.log("0, 1 ->", strokeNegHyperPos.length);

        const strokePosHyperNeg = dataSource.filter(dataRow => {
            return (dataRow.stroke === 1 && dataRow.hyper === 0);
        });
        // console.log("1, 0 ->", strokePosHyperNeg.length);

        const strokePosHyperPos = dataSource.filter(dataRow => {
            return (dataRow.stroke === 1 && dataRow.hyper === 1);
        });
        // console.log("1, 1 ->", strokePosHyperPos.length);


        const trace1 = {
            x: ['Never had stroke', 'Had stroke in lifetime'],
            y: [strokeNegHyperNeg.length, strokePosHyperNeg.length],
            name: 'Not hypertensive',
            type: 'bar'
        };

        const trace2 = {
            x: ['Never had stroke', 'Had stroke in lifetime'],
            y: [strokeNegHyperPos.length, strokePosHyperPos.length],
            name: 'Hypertensive',
            type: 'bar'
        };

        const data = [trace1, trace2];

        const layout = {
            barmode: 'group',
            title: 'Stroke Frequency by Blood Pressure Status',
            // margin: initMargin,
            // font: {
            //     size: initPlotFontSize
            // }
        };

        const config = {responsive: true};



        if (!custom) {
            setPlot3({
                data: data,
                layout: layout,
                config: config
            });
        }
        else {
            setCustPlot({
                data: data,
                layout: layout,
                config: config
            });
        }

        setPlot3Loading(false);

    };

    const toPatientDataString = (dataRow) => {
        const id = dataRow.id;
        const gender = dataRow.gender;
        const age = dataRow.age;
        const hyper = dataRow.hyper;
        const heart_d = dataRow.heart_d;
        const avg_glucose = dataRow.avg_glucose;
        const bmi = dataRow.bmi;
        const stroke = dataRow.stroke;
        return (
            `id#: ${id}; gender: ${gender}; age: ${age}; hyper: ${hyper}; heart_d: ${heart_d}; avg_glucose: ${avg_glucose}; bmi: ${bmi}`
        );
    }

    const initBarPlot2 = (dataSource = patientData, custom = false) => {
        
        // // filter the values out of patientData
        // // stroke === 0 && stroke === 1

        // and then, get the counts of which ones are heart_d === 0 and heart_d === 1:
        const strokeNegHeartNeg = dataSource.filter(dataRow => {
            return (dataRow.stroke === 0 && dataRow.heart_d === 0); 
        });
  
        const strokeNegHeartPos = dataSource.filter(dataRow => {
            return (dataRow.stroke === 0 && dataRow.heart_d === 1); 
        });

        const strokePosHeartNeg = dataSource.filter(dataRow => {
            return (dataRow.stroke === 1 && dataRow.heart_d === 0);
        });

        const strokePosHeartPos = dataSource.filter(dataRow => {
            return (dataRow.stroke === 1 && dataRow.heart_d === 1);
        });

        const trace1 = {
            x: ['Never had stroke', 'Had stroke in lifetime'],
            y: [strokeNegHeartNeg.length, strokePosHeartNeg.length],
            name: 'No Heart Disease',
            type: 'bar',
            marker: { color: 'green' }
        };

        const trace2 = {
            x: ['Never had stroke', 'Had stroke in lifetime'],
            y: [strokeNegHeartPos.length, strokePosHeartPos.length],
            name: 'Has Heart Disease',
            type: 'bar',
            marker: { color: 'salmon' }
        };

        const data = [trace1, trace2];

        const layout = {
            barmode: 'group',
            title: 'Stroke Frequency by Heart Disease Status'
        };

        const config = {responsive: true};

        // Plotly.newPlot(plotLoc, data, layout, config);

        if (!custom) {
            setPlot4({
                data: data,
                layout: layout,
                config: config
            });
        }
        else {
            setCustPlot(
                {
                    data: data, 
                    layout: layout, 
                    config: config
                }
            );
        }


        setPlot3Loading(false);

    };

    const initScatterPlot = (dataSource = patientData, custom = false) => {
        
        // // filter the values out of patientData
        // // stroke === 0 && stroke === 1

        // and then, plot each with age as x, and avg. glucose as y:
        const strokeNeg = dataSource.filter(dataRow => {
            return (dataRow.stroke === 0); 
        });

        const strokePos = dataSource.filter(dataRow => {
            return (dataRow.stroke === 1);
        });

        const trace1 = {
            x: strokeNeg.map(dataRow => dataRow.age),
            y: strokeNeg.map(dataRow => dataRow.avg_glucose),
            mode: 'markers',
            name: 'No Stroke',
            text: strokeNeg.map(dataRow => toPatientDataString(dataRow)),
            type: 'scatter',
            marker: { color: 'blue' }
        };

        const trace2 = {
            x: strokePos.map(dataRow => dataRow.age),
            y: strokePos.map(dataRow => dataRow.avg_glucose),
            mode: 'markers',
            name: 'Had Stroke in Lifetime',
            text: strokePos.map(dataRow => toPatientDataString(dataRow)),
            type: 'scatter',
            marker: { color: 'red' }
        };

        const data = [trace1, trace2];

        const layout = {
            title: 'Stroke Incidence as a function of Age and Average Glucose Level',
            xaxis: {title: 'Age, yrs',
            autotick: false,
            showticklabels: true,
            ticks: 'outside',
            dtick: 10,
            showgrid: true,
            zeroline: true,
            showline: true},
            yaxis: {
                title: 'Avg. Blood Glucose, mg/dL',
                autotick: false,
                showticklabels: true,
                ticks: 'outside',
                dtick: 50,
                showgrid: true,
                zeroline: true,
                showline: true
            },
            legend: {
                "orientation": "h",
                y: -0.2
            },
            margin: {
                // b: 100
            }

        };

        const config = {responsive: true};

        // Plotly.newPlot(plotLoc, data, layout, config);

        setPlot4Loading(false);

        if (!custom) {
        setPlot2(
            {
                data: data, 
                layout: layout, 
                config: config
            }
        );
        }
        else {
            setCustPlot(
                {
                    data: data, 
                    layout: layout, 
                    config: config
                }
            );
        }

    };

    // const plotRef = useRef(null);


    const initHeatmap = () => {
                
        const xVals = ['age', 'hyper', 'heart_d', 'avg_glucose', 'bmi', 'stroke'];
        const yVals = ['age', 'hyper', 'heart_d', 'avg_glucose', 'bmi', 'stroke'];
        const zVals = [
        [1.000000, 0.257110, 0.266740, 0.249023, -0.012788, 0.512787],
        [0.257110, 1.000000, 0.094666, 0.174113, 0.113003, 0.168053],
        [0.266740, 0.094666, 1.000000, 0.253447, 0.018437, 0.186316],
        [0.249023, 0.174113, 0.253447, 1.000000, 0.229055, 0.230373],
        [-0.012788,	0.113003, 0.018437, 0.229055, 1.000000, -0.037703],
        [0.512787, 0.168053, 0.186316, 0.230373, -0.037703, 1.000000]
        ];
        const colorScaleVal = [
            [0, '#ffe2b0'], 
            [0.5, '#FFA500'],
            [1, '#7d3c00']
        ]
        const heatmapData = [{
            x: xVals,
            y: yVals,
            z: zVals,
            type: 'heatmap',
            colorscale: colorScaleVal
        }];
        const heatmapLayout = {
            title: 'Correlation Matrix Heatmap - Major Features', 
            xaxis: {
                automargin: true
            },
            annotations: [],
            yaxis: {
                automargin: true
            },
            margin: {
                l: 100,
                r: 110
            },
            autosize: true
            };


        // add all annotations to the plot layout constant before rendering:
        for (let i = 0; i < yVals.length; i++) {
            for (let j = 0; j < xVals.length; j++) {
                let currentVal = zVals[i][j];

                // truncate to 1 decimal
                let currentValPrec;
                if (Math.abs(currentVal) < 0.1) {
                    currentValPrec = currentVal.toPrecision(1);
                }
                else {
                    currentValPrec = currentVal.toPrecision(2);
                }
                let textColor;
                if (currentVal > 0.7) {
                    textColor = 'white';
                }
                else {
                    textColor = 'black';
                }
                let result = {
                    xref: 'x1',
                    yref: 'y1',
                    x: xVals[j],
                    y: yVals[i],
                    text: currentValPrec,
                    font: {
                        family: 'Questrial',
                        color: 'black'
                    },
                    showarrow: false,
                    font: {
                        color: textColor
                    }
                };
                heatmapLayout.annotations.push(result);
            }
        }


        const config = {
            // I don't even know that responsive does anything here haha:
            responsive: true,
            modeBarButtonsToRemove: 
            ['zoom2d', 'pan2d', 'select2d', 'lasso2d', 'zoomIn2d', 'zoomOut2d']
        };


        setPlot1({
            data: heatmapData,
            layout: heatmapLayout,
            config: config
        });


        setPlot1Loading(false);

    };

    const initConfMatrix = () => {

        const xVals = ['Will not have stroke', 'Will have stroke'];
        const yVals = ['Did not have stroke', 'Had stroke'];
        const zVals = [[34, 6], [9, 23]];
        const colorScaleVal = [
        [0, '#ffaea8'], 
        [0.5, '#ff5447'],
        [1, '#520500']];
        const heatmapData = [{
            x: xVals,
            y: yVals,
            z: zVals,
            type: 'heatmap',
            colorscale: colorScaleVal
        }];
        const heatmapLayout = {
            margin: {
                t: 150,
                l: 150,
                r: 150,
                b: 130,
                pad: 4
            },
            title: 'Confusion Matrix - Model Performance',
            annotations: [],
            showlegend: true,
            legend: {
                x: 0,
                y: 0,
                traceorder: 'normal',
                font: {
                  family: 'sans-serif',
                  size: 12,
                  color: '#000'
                },
                bgcolor: '#E2E2E2',
                bordercolor: '#FFFFFF',
                borderwidth: 2
              }
            };

        // add all annotations to the plot layout constant before rendering:
        for (let i = 0; i < yVals.length; i++) {
            for (let j = 0; j < xVals.length; j++) {
                let currentVal = zVals[i][j];
                let textColor;
                if (currentVal > 25) {
                    textColor = 'white';
                }
                else {
                    textColor = 'black';
                }
                let result = {
                    xref: 'x1',
                    yref: 'y1',
                    x: xVals[j],
                    y: yVals[i],
                    text: currentVal,
                    font: {
                        family: 'sans-serif',
                        size: 20,
                        color: textColor
                    },
                    showarrow: false
                };
                heatmapLayout.annotations.push(result);
            }
        }
        

        const config = {responsive: true};
        
        setPlot5({
            data: heatmapData,
            layout: heatmapLayout,
            config: config
        });

        setPlot5Loading(false);
    };


    // 
    // useEffect(getData, []);
    // my first attempt at cleaning up the async memory leak-causing function return. it did not work.
    useEffect(() => {

        let cancelled = false;
        if (!cancelled) getData();

        return (() => {
            cancelled = true;
        });
    }, []);
    useEffect(initConfMatrix, []);
    useEffect(initHeatmap, []);

    useEffect(initScatterPlot, [patientData]);

    useEffect(initBarPlot1, [patientData]);

    useEffect(initBarPlot2, [patientData]);


    const toggleView = () => {
        try {
            setExpanded(prevVal => !prevVal);
        }
        catch (error) {
            error.cause = "toggleView event";
            logToErrorQueue(error);
        }
    };

    const toggleViewCustom = () => {
        try {
            setCustomExpanded(prevVal => !prevVal);
        }
        catch (error) {
            error.cause = "toggleViewCustom event";
            logToErrorQueue(error);
        }
    };


    // I need to examine the state update flow and see what I can change to make the re-rendering not so ugly.
    // onBlur for the text field helped.
    // but I wonder if there's an underlying design problem.

    const nonNumericAttrs = ["sex", "hyper", "heart_d", "ever_married", "worktype", "restype", "smoking", "stroke"];

    const numericAttrVals = ['greaterthan', 'lessthan', 'greaterthanequal', 'lessthanequal'];

    const numericAttrs = ["id", "age", "avg_glucose", "bmi"];
    

    const updateQuery = (event, id) => {

        try {
            setQueryData((prevVal) => {
                const {name, value} = event.target;
                const prevQueryData = {...prevVal};

                // find the updated query statement object and update it accordingly:

                // this id is assigned as a prop, and accessed as a prop when the QueryStatement calls a parent function in this component. the event and the id are the parameters.
                // console.log("id:", id);
                console.log(event.target, name, value);

                // 
                // 
                // let oldAttrOp = prevQueryData[id][name];
                // console.log('old val', oldAttrVal);
                // 
                // 

                // if the changing datapoint is an attribute
                if (name === "attribute") {
                    console.log('NAME:', name, "VAL:", value);
                    console.log('Old attribute name:', prevQueryData[id][name]);
                    let oldAttribute = prevQueryData[id][name];
                    let oldOperator = prevQueryData[id]['operator'];
                    // if the old attribute was part of the numeric attributes, and the new attribute is a non-numeric attribute, AND the currently selected operator is an inequality operator
                    if (numericAttrs.includes(oldAttribute) && !numericAttrs.includes(value) && numericAttrVals.includes(oldOperator)) {
                        console.log('the old attribute is part of the numeric values, AND the new attribute is non-numeric, ANNNND the old operator was an inequality operator. \n You know what to do.');
                        // set the query data object's value to match the on-screen value: 'equals'
                        prevQueryData[id]['operator'] = 'equals';
                    }


                    
                    
                }

                prevQueryData[id][name] = value;





                return prevQueryData;

                });
        } catch(error) {
            error.cause = 'update custom query state object';
            logToErrorQueue(error);
        }
    };



    const addStatement = () => {

        if (statements.length === 4) {
            setError(true);
            setErrorMsg("Max 4 query conditions allowed.");
            return;
        }
                
        setError(false);
        setStatements((prevStatements) => [...prevStatements, <QueryStatement key={statements.length} id={statements.length} 
        onStatementChange={updateQuery} type="ANDOR"/>]);

        setQueryData((prevVal) => {
            const queryData = {...prevVal};
            // add new statement data object to the queryData object:
            queryData[statements.length] = {
                'statement_id': statements.length,
                'type': 'andor',
                'chaining_op': 'and',
                'attribute': 'id',
                'operator': 'equals',
                'attributeval': null
            };
            return queryData;
        });

    };

    // moved to allow use of the two functions:
    const [statements, setStatements] = useState([
        <QueryStatement id={0} key={0} onStatementChange={updateQuery} type="BASE" />
    ]);

    
    const removeStatement = () => {
        if (statements.length === 1) {
            console.log("no added conditions to delete.");
            return;
        }

        setQueryData((prevVal) => {
            const queryData = {...prevVal};
            delete queryData[statements.length - 1];
            return queryData;
        });


        setError(false);
        setStatements((prevStatements) => {
            prevStatements.splice((statements.length - 1), 1);
            return [...prevStatements];
        });
    };

    const runQuery = (event) => {
        try {
            event.preventDefault();
            setCustomExpanded(false);
            setIsLoading(true);


            // console.log(queryData['0']['attributeval']);
            // console.log(typeof(queryData['0']['attributeval']));

            setCustomQueryData([]);
        }
        catch (error) {
            error.cause = 'runQuery method before fetch';
            logToErrorQueue(error);
        }

        fetch((BASE_URL + 'api/customquery'), {
            method: 'POST',
            body: JSON.stringify(queryData),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`}
        }).then(res => {
            
            // console.log(res.status, res.statusText);

            if (res.ok) {
            return res.json();
            }
            // if the res status is 422, the fetch was likely missing a token.
            // so perform an autologout if that happens.
            else if (res.status === 422 || res.status === 401) {
                authCtx.logout(true);
            }
        }).then(data => {
            setCustomQueryData(data);
            setIsLoading(false);
            setCustomExpanded(true);
            console.log(data);

        }).catch(error => {
            error.cause = 'runQuery fetch request';
            logToErrorQueue(error);
        });
        };


    const populateCustPlot = () => {

        if (activeCustPlot === 'bp') initBarPlot1(customQueryData, true);
        else if (activeCustPlot === 'hd') initBarPlot2(customQueryData, true);
        else if (activeCustPlot === 'avg') initScatterPlot(customQueryData, true);
        
    
    };

    
    useEffect(populateCustPlot, [customQueryData, activeCustPlot]);


    const handleCustPlotSelect = (e) => {
        try {
            const value = e.target.value;
            console.log(value);

            setCustPlotLoading(true);

            // if value = a || b || c? else false?
            if (value === 'bp')
            setActiveCustPlot(value);
            else if (value === 'hd')
            setActiveCustPlot(value);
            else if (value === 'avg')
            setActiveCustPlot(value);

            setCustPlotLoading(false);
        }
        catch (error) {
            error.cause = 'handleCustPlotSelect event';
            logToErrorQueue(error);
        }
    };

    const [sliderVal, setSliderVal] = useState(11);

    // a debounce wrapper would likely make the changes not choppy -
    // and also avoid overly frequent DOM updating
    // kind of necessary, unless React already has a better answer w/ hooks or something

    // OR, a severely restricted set of possible values. iOS only has like 5 text sizes or whatever.

    const handleSliderChange = (event) => {
        try {
        const {name, value} = event.target;
        // console.log(name, value);
        setSliderVal(value);
        }
        catch (error) {
            error.cause = 'handleSliderChange event';
            logToErrorQueue(error);
        }
    };

    // touch context for plots:
    const touchCtx = useContext(TouchContext);

    const userHasTouched = touchCtx.userTouch;

// useEffect to fire when the user has touched the screen for the first time.
    useEffect(() => {
        if (userHasTouched) {
            // 
            console.log('Interactive mode is being disabled for all plots (first user touch received).');
            // 
            setPlot1Interactive(false);
            setPlot2Interactive(false);
            setPlot3Interactive(false);
            setPlot4Interactive(false);
            setPlot5Interactive(false);
            setCustPlotInteractive(false);

        }
    }, [userHasTouched]);

    

    const [plot1Interactive, setPlot1Interactive] = useState(true);

    const togglePlot1Interactive = () => {
        // console.log('toggled.');
        setPlot1Interactive((oldVal) => !oldVal);
    };

    const [plot2Interactive, setPlot2Interactive] = useState(true);

    const togglePlot2Interactive = () => {
        setPlot2Interactive((oldVal) => !oldVal);
    };

    const [plot3Interactive, setPlot3Interactive] = useState(true);

    const togglePlot3Interactive = () => {
        setPlot3Interactive((oldVal) => !oldVal);
    };

    const [plot4Interactive, setPlot4Interactive] = useState(true);

    const togglePlot4Interactive = () => {
        setPlot4Interactive((oldVal) => !oldVal);
    };

    const [plot5Interactive, setPlot5Interactive] = useState(true);

    const togglePlot5Interactive = () => {
        setPlot5Interactive((oldVal) => !oldVal);
    };

    const [custPlotInteractive, setCustPlotInteractive] = useState(true);

    const toggleCustPlotInteractive = () => {
        setCustPlotInteractive((oldVal) => !oldVal);
    };

    const [custPlot, setCustPlot] = useState({
        data: null,
        layout: null,
        config: null
    });



    return (
    <div className="dataVisualsWrapper">


        <div className="space"></div>

        <h1 className="dataPageTitle">Data Visualizations & Dataset</h1>
        {/* <hr id="titleHr"/> */}




        <div className="space"></div>
        <h2 className="plotsTitle">Plots</h2>

        {/* <hr/> */}

        <div className="infoBox">
            <div className='switchWrapper'>
                <div className="demonstrativePlotSwitchContainer">
                    <label >interactive:</label>
                    <input id="demonstrativeCheckbox" className="interactivePlotSwitch_Off" type="checkbox" 
                        style={ {backgroundColor: 'teal' } }
                    />
                </div>
            </div>
            <span id="plotswitchcaption">plot interactive mode switch</span>
            
            <span>Click or tap the interactive mode switch for each plot to toggle the plot's interactive mode.</span>

        </div>

        <div className="infoBox scrollInfo"><p>Each plot can be scrolled horizontally to view all of its content.</p></div>
  




    <div className="plotWrapper">
        <div className="plotSwitchPairWrapper">
            <div className='switchWrapper'>
                <div className="interactivePlotSwitchContainer">
                    <label htmlFor="plot1int">interactive:</label>
                    <input id="plot1int" className={ plot1Interactive ? "interactivePlotSwitch_On" : "interactivePlotSwitch_Off" } type="checkbox" onChange={togglePlot1Interactive} 
                        style={ {backgroundColor: plot1Interactive ? plotSwitchOnColor : plotSwitchOffColor } }
                    />
                </div>
            </div>
            <div className="plot1" style={
                { backgroundColor: plot1Interactive ? 'rgba(255, 255, 255, 1.0)' : 'rgba(255, 255, 255, 0.9)'  }
            }>

                <Plot className="responsivePlotWidth" data={plot1.data} layout={plot1.layout} config={plot1.config} useResizeHandler style={ {borderColor: plot1Interactive ? 'rgb(114, 87, 204)' : 'lightgrey'} }
                />
                <div className="responsivePlotWidth plot1screen" style={ {display: plot1Interactive ? "none" : "block"} }></div>
            </div>
        </div>



        <div className="plotSwitchPairWrapper">
        <div className='switchWrapper'>
            <div className="interactivePlotSwitchContainer">
            <p>interactive:</p>
            <input className={ plot2Interactive ? "interactivePlotSwitch_On" : "interactivePlotSwitch_Off" } type="checkbox" onChange={togglePlot2Interactive} 
                style={ {backgroundColor: plot2Interactive ? plotSwitchOnColor : plotSwitchOffColor } }
            />
            </div>
        </div>
        <div className="plot2 scatter" style={ {backgroundColor: plot2Interactive ? 'rgba(255, 255, 255, 1.0)' : 'rgba(255, 255, 255, 0.9)'} }>
            <Plot className="responsivePlotWidth" data={plot2.data} layout={plot2.layout} config={plot2.config} useResizeHandler />
            <div className="responsivePlotWidth plot2screen" style={ {display: plot2Interactive ? "none" : "block"} }></div>
        </div>
        </div>


        <div className="plotSwitchPairWrapper">
        <div className='switchWrapper'>
            <div className="interactivePlotSwitchContainer">
            <p>interactive:</p>
            <input className={ plot3Interactive ? "interactivePlotSwitch_On" : "interactivePlotSwitch_Off" } type="checkbox" onChange={togglePlot3Interactive} 
                style={ {backgroundColor: plot3Interactive ? plotSwitchOnColor : plotSwitchOffColor } }
            />
            </div>
        </div>
        <div className="plot3" style={ {backgroundColor: plot3Interactive ? 'rgba(255, 255, 255, 1.0)' : 'rgba(255, 255, 255, 0.9)'} }> 
            <Plot className="responsivePlotWidth" data={plot3.data} layout={plot3.layout} config={plot3.config} useResizeHandler />
            <div className="responsivePlotWidth plot3screen" style={ {display: plot3Interactive ? "none" : "block"} }></div>
        </div>
        </div>


        <div className="plotSwitchPairWrapper">
        <div className='switchWrapper'>
            <div className="interactivePlotSwitchContainer">
            <p>interactive:</p>
            <input className={ plot4Interactive ? "interactivePlotSwitch_On" : "interactivePlotSwitch_Off" } type="checkbox" onChange={togglePlot4Interactive} 
                style={ {backgroundColor: plot4Interactive ? plotSwitchOnColor : plotSwitchOffColor  } }
            />
            </div>
        </div>
        <div className="plot4" style={ {backgroundColor: plot4Interactive ? 'rgba(255, 255, 255, 1.0)' : 'rgba(255, 255, 255, 0.9)'} }> 
            <Plot className="responsivePlotWidth" data={plot4.data} layout={plot4.layout} config={plot4.config} useResizeHandler />
            <div className="responsivePlotWidth plot4screen" style={ {display: plot4Interactive ? "none" : "block"} }></div>
        </div>
        </div>
        

        <div className="plotSwitchPairWrapper">
        <div className='switchWrapper'>
            <div className="interactivePlotSwitchContainer">
            <p>interactive:</p>
            <input className={ plot5Interactive ? "interactivePlotSwitch_On" : "interactivePlotSwitch_Off" } type="checkbox" onChange={togglePlot5Interactive} 
                style={ {backgroundColor: plot5Interactive ? plotSwitchOnColor : plotSwitchOffColor } }
            />
            </div>
        </div>
        <div className="plot5" style={ {backgroundColor: plot5Interactive ? 'rgba(255, 255, 255, 1.0)' : 'rgba(255, 255, 255, 0.9)'} }> 
            <Plot className="responsivePlotWidth plot5container" data={plot5.data} layout={plot5.layout} config={plot5.config} useResizeHandler />
            <div className="responsivePlotWidth plot5screen" style={ {display: plot5Interactive ? "none" : "block"} }></div>
        </div>
        </div>


    </div>

    <hr className="sectionBreak"/>

    <div className="performanceBox">

    <h2 className="modelPerfTitle">Model Performance Evaluation</h2>

  

        <h2 className="smallTableHeader">Confusion Matrix Results Breakdown</h2>
    <br/>
    <div className='tableOuterWrapper'>
        <div className='tableInnerWrapper'>
            <table className="scoreTable">
                <thead>
                    <tr>
                        <th>Correct Positive Predictions</th>
                        <th>Correct Negative Predictions</th>
                        <th>No. of False Positives</th>
                        <th>No. of False Negatives</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>23</td>
                        <td>34</td>
                        <td>6</td>
                        <td>9</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>


    <h2  className="smallTableHeader">Evaluation Performance Metrics Table</h2>
    <p className="headerSubText">Calculated using Scikit-Learn metrics module</p>
    <div className='tableOuterWrapper'>
        <div className='tableInnerWrapper'>
            <table className="scoreTable">
                <thead>
                    <tr>
                        <th>Accuracy Score</th>
                        <th>Precision Score</th>
                        <th>Recall Score</th>
                        <th>F1 Score</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>79.2%</td>
                        <td>79.3%</td>
                        <td>72%</td>
                        <td>75%</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    <h2 className="smallTableHeader">Cross-Validation Score Data</h2>
    <p className="headerSubText">Obtained by performing 10-fold cross-validation of model</p>
    <div className='tableOuterWrapper'>
        <div className='tableInnerWrapper'>
            <table className="scoreTable">
                <thead>
                    <tr>
                        <th>Mean Cross-validated Accuracy Score</th>
                        <th>Standard Deviation</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>75.3%</td>
                        <td>0.084</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>


    </div>


        <h2 className="custPlotTitle"> Custom Plot and Queries</h2>


    <div className="plotWrapper">
        <div className="plotSwitchPairWrapper">
                <div className='switchWrapper'>
                    <div className="interactivePlotSwitchContainer">
                    <p>interactive:</p>
                    <input className={ custPlotInteractive ? "interactivePlotSwitch_On" : "interactivePlotSwitch_Off" } type="checkbox" onChange={toggleCustPlotInteractive} 
                        style={ {backgroundColor: custPlotInteractive ? plotSwitchOnColor : plotSwitchOffColor} }
                    />
                    </div>
                </div>
                <div className="custPlot" style={ {backgroundColor: custPlotInteractive ? 'rgba(255, 255, 255, 1.0)' : 'rgba(255, 255, 255, 0.9)'} }> 
                    <Plot className="responsivePlotWidth" data={custPlot.data} layout={custPlot.layout} config={custPlot.config} useResizeHandler />
                    {(!isLoading && customQueryData.length === 0) && (
                        <div className="custTooltip">
                            <span>Fit custom query results to a plot here by running a custom query below.</span>
                        </div>
                    )}
                    <div className="responsivePlotWidth custPlotScreen" style={ {display: custPlotInteractive ? "none" : "block"} }></div>
                </div>
        </div>
    </div>

    <div>
        <div class="infoBox">
        <p>Custom Plot to Show:</p>
            <select onChange={handleCustPlotSelect}>
            <option value={'bp'}>Stroke Freq. by Blood Pressure Status</option>
            <option value={'hd'}>Stroke Freq. by Heart Disease Status</option>
            <option value={'avg'}>Stroke Freq. as a function of Age and Average Glucose Level</option>
            </select>
        </div>
    </div>


    <div className="queryContainer">
        <h2>Custom Query Builder</h2>
        <span id="note">(Text searches are case-sensitive)</span>
        <p id="conditions">Query Conditions: {statements.length}/4</p>


         {/* unbroken queryData string below is off - will not be present in live app. 
         without special styling, the unbroken string forces the viewport to the string's width. */}
        {/* <p>{JSON.stringify(queryData)}</p> */}

        {error && <p className="errorMessage">{errorMsg}</p>}
        <button onClick={addStatement}>Add Condition</button>
        <button onClick={removeStatement}>Remove Condition</button>
        <form>
        <div>
        {statements}
        </div>
            <button onClick={runQuery} type="submit">Run Query</button>
        </form>
            {isLoading && <p>Loading...</p>}
    </div>

    {/* <button className={isCustomExpanded? "datasetControl" : "datasetControl-collapsed"} onClick={toggleViewCustom}>{isCustomExpanded ? 'Hide custom query result' : 'Show custom query result'}</button> */}
    <button className="datasetControl" onClick={toggleViewCustom}>{isCustomExpanded ? 'Hide custom query result' : 'Show custom query result'}</button>
    {/* {isLoading && <div className="spinner"></div>} */}

    {isCustomExpanded && (<>
        <h2 className="resultsHeader"> Custom Query Results </h2>
        {!isLoading && <p className="resultsInfo">{customQueryData.length} result{customQueryData.length !== 1 && 's'} returned for query.</p>}
    </>)}
    <div className={isCustomExpanded ? 'tableOuterWrapper' : 'tableOuterWrapper_collapsed'}>
        <div className='tableInnerWrapper'>
            <table>
                <thead>
                    <tr>
                        <th>Id No.</th>
                        <th>Gender</th>
                        <th>Age</th>
                        <th>Hypertension</th>
                        <th>Heart Disease</th>
                        <th>Ever Married</th>
                        <th>Work Type</th>
                        <th>Residence Type</th>
                        <th>Avg. Blood Glucose, mg/dL</th>
                        <th>BMI (Body Mass Index)</th>
                        <th>Smoking Status</th>
                        <th>Had Stroke</th>
                    </tr>
                </thead>
                <tbody>
                    {!isLoading && customQueryData.length < 1 && <tr><td colSpan="12">(No data.)</td></tr>}
                    {customQueryData.map(dataRow => {
                        return (
                            <tr key={'custtable' + dataRow.id}>
                                <td>{dataRow.id}</td>
                                <td>{dataRow.gender}</td>
                                <td>{dataRow.age}</td>
                                <td>{dataRow.hyper}</td>
                                <td>{dataRow.heart_d}</td>
                                <td>{dataRow.ever_married}</td>
                                <td>{dataRow.work_type}</td>
                                <td>{dataRow.res_type}</td>
                                <td>{dataRow.avg_glucose}</td>
                                <td>{dataRow.bmi}</td>
                                <td>{dataRow.smoking}</td>
                                <td>{dataRow.stroke}</td>
                            </tr>
                            );
                        })
                    }
                </tbody>
            </table>
        </div>
    </div>

    <br/>


    <button className="datasetControl" onClick={toggleView}>{isExpanded ? 'Hide full dataset' : 'Show full dataset'}</button>

    {isExpanded && (<> 
        <h2 className='fullDataSetTitle'> Full Dataset </h2>
 </>)}
    <div className={isExpanded ? 'tableOuterWrapper' : 'tableOuterWrapper_collapsed'}>
        <div className='tableInnerWrapper'>
        <table>
            <thead>
            <tr>
                <th>Id No.</th>
                <th>Gender</th>
                <th>Age</th>
                <th>Hypertension</th>
                <th>Heart Disease</th>
                <th>Ever Married</th>
                <th>Work Type</th>
                <th>Residence Type</th>
                <th>Avg. Blood Glucose, mg/dL</th>
                <th>BMI (Body Mass Index)</th>
                <th>Smoking Status</th>
                <th>Had Stroke</th>
            </tr>
            </thead>
            <tbody>

                { patientData.map(dataRow => {
                    return (
                        <tr key={'fulltable' + dataRow.id}>
                            <td>{dataRow.id}</td>
                            <td>{dataRow.gender}</td>
                            <td>{dataRow.age}</td>
                            <td>{dataRow.hyper}</td>
                            <td>{dataRow.heart_d}</td>
                            <td>{dataRow.ever_married}</td>
                            <td>{dataRow.work_type}</td>
                            <td>{dataRow.res_type}</td>
                            <td>{dataRow.avg_glucose}</td>
                            <td>{dataRow.bmi}</td>
                            <td>{dataRow.smoking}</td>
                            <td>{dataRow.stroke}</td>
                        </tr>        
                        );
                    })
                } 
            </tbody>
        </table>
        </div>
    </div>

    {!isExpanded && <div className="spacingBottom"></div>}


</div>);
};

export default DataVisuals;