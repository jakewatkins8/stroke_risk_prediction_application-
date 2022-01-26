import { logToErrorQueue } from "../Logger";

const BinaryQuestionRadio = (props) => {

    const handleClick = (event) => {
        try {
            props.onRadioChange(event);
            
            // testing throwing an error to the catch block:
            // console.log(null.dj);
        }
        catch (error) {
            error.cause = 'BinaryQuestionRadio event';
            logToErrorQueue(error);
        }
    };


 

return (
    <div className="radioContainer">
    <div className="labelInputPair">
        <input id={props.radioVal1} onClick={handleClick} type="radio" name={props.radioGroupName} required value={props.radioVal1}></input>
        <label htmlFor={props.radioVal1}>{props.radioVal1Text}</label>
    </div>

    <div className="labelInputPair">
        <input id={props.radioVal2} onClick={handleClick} type="radio" name={props.radioGroupName} value={props.radioVal2}></input>
        <label htmlFor={props.radioVal2}>{props.radioVal2Text}</label>
    </div>
    </div>
);
};

export default BinaryQuestionRadio;