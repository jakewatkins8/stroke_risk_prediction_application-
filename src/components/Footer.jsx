import "../styles/Footer.css";

const Footer = () => {

    const getCurrentYear = () => {

        const currentYear = new Date().getFullYear().toString();

        return currentYear;

    };


    return (
    <div className="pageFooter">
        <span>&copy; {getCurrentYear()} &nbsp; Jacob Watkins</span>
    </div>
    );
};

export default Footer;