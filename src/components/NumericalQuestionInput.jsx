import { logToErrorQueue } from "../Logger";

const NumericalQuestionInput = (props) => {

    const handleChange = (event) => {
        try {
        props.onValueChange(event);
        }
        catch(error) {
            error.cause = 'NumericalQuestionInput event';
            logToErrorQueue(error);
        }
    };

    return (
        <div className="inputContainer numericalLabelInputPair">
            <label htmlFor={props.name}>{props.name}</label>
            <input disabled={props.isDisabled} name={props.name} type="text" placeholder={props.placeholder} onChange={handleChange} required maxLength={props.maxLength}>
            </input>
        </div>
    );

};

export default NumericalQuestionInput;