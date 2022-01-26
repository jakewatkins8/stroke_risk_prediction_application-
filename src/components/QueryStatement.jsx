import { useEffect, useState, useRef } from "react";
import {logToErrorQueue} from "../Logger";

const QueryStatement = (props) => {

    const [isNumericAttr, setIfNumericAttr] = useState(true);

    // const [statementData, setStatementData] = useState({
    //     'statement_id': 0,
    //     'type': 'base',
    //     'chaining_op': null,
    //     'attribute': 'id',
    //     'operator': 'equals',
    //     'attributeval': null
    // });

    const operatorRef = useRef(null);


    let baseQuery;
    
    // const form = {...prevValue};
    // form[name] = value;

    // return form;
    if (props.type === "BASE") {
        baseQuery = true;
    }
    else if (props.type === "ANDOR") {
        baseQuery = false;
    }

    const numericAttrs = ['id', 'age', 'avg_glucose', 'bmi'];

    const setOperators = (event) => {
        try { 
            const selectedAttr = event.target.value;
            if (numericAttrs.includes(selectedAttr)) {
                setIfNumericAttr(true);
            }
            else {
                
                setIfNumericAttr(false);
            }
        }
        catch (error) {
            error.cause = 'QueryStatement event';
            logToErrorQueue(error);
        }
    };


    useEffect(() => {
          
        // props.onAdded();
        //props.onAdded(statementData);

    }, []); // I don't feel like I am using this right. I question the empty dep. array too.

    const handleStatementChange = (event) => {
        try {
            const { name, value } = event.target;
            // console.log(event.target);
            // console.log(name, value);
            
            if (name === 'attribute') {
                setOperators(event);
                // and also, reset the selected operator option to 'is equal to'? 
                // operatorRef.current.select(null);
            }

            props.onStatementChange(event, props.id);
            // props.onStatementChange(event);
            //props.onStatementChange(event, statementData);
        }
        catch (error) {
            error.cause = 'QueryStatement event';
            logToErrorQueue(error);
        }
    };


    return (<div className="querySentence">
    {baseQuery ? <p>Select all patients where:</p> : (
    <select id="chainOp" onChange={handleStatementChange} name="chaining_op">
        <option>and</option>
        <option>or</option>
    </select>
        )}
    <select onChange={handleStatementChange} name="attribute" className="selectField">
        <option value="id">Id No.</option>
        <option value="sex">Gender</option>
        <option value="age">Age</option>
        <option value="hyper">Hypertension</option>
        <option value="heart_d">Heart Disease</option>
        <option value="ever_married">Ever Married</option>
        <option value="worktype">Work Type</option>
        <option value="restype">Residence Type</option>
        <option value="avg_glucose">Avg. Blood Glucose, mg/dL</option>
        <option value="bmi">BMI (Body Mass Index)</option>
        <option value="smoking">Smoking Status</option>
        <option value="stroke">Had Stroke</option>
    </select>
    {/* ref={operatorRef}  */}
    <select onChange={handleStatementChange} name="operator" className="selectField">
        {/* selected  */}
        <option value="equals">is equal to</option>
        <option value="notequals">is not equal to</option>
        {isNumericAttr && <>
            {/* 'greaterthan', 'lessthan', 'greaterthanequal', 'lessthanequal' */}
            <option value="greaterthan">is greater than</option>
            <option value="lessthan">is less than</option>
            <option value="greaterthanequal">is greater than or equal to</option>
            <option value="lessthanequal">is less than or equal to</option>
        </>}
        <option value="contains">contains</option>
        <option value="notcontains">does not contain</option>
    </select>
    <input onBlur={handleStatementChange} name="attributeval" type="text"></input>
    {/* <p>{statementData['type']}</p> */}
    </div>);
};

export default QueryStatement;