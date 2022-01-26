const QuestionBlock = (props) => {

    return (
        <div className="questionBlock">
            <div className="questionNo">
            <span><span className="number">{props.questionNumber}</span>/10</span>
            </div>
        
        <p className="questionText">{props.question}</p>


        {props.children}


    </div>
    );
};

export default QuestionBlock;