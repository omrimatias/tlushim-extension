const Tlushim = (function() {
    let totalTime = 0;

    function install() {
        document.querySelectorAll("table.atnd tr:not(.total)").forEach((tr, index) => {
            let date = getText(tr.querySelector("td.atnd:nth-child(1)"));
            let optionType = getText(tr.querySelector("td.atnd_type select option"));
            let shiftType = getText(tr.querySelector('td.atnd:nth-child(20)'));

            if (!date || isInvalidShiftType(shiftType)) {
                return;
            }

            if(index === 3) {
                window.$tr = tr;
                window.$optionType = optionType;
            }

            console.log(date, optionType, shiftType);
        });
    }

    function isValidOptionType(optionType) {
        return !(optionType === '' || optionType !== 'רגיל');
    }

    function getTotalMinutesInDay() {

    }

    function isInvalidShiftType(shiftType) {
        return (shiftType === 'העדרות' || shiftType === '' || shiftType === 'העדרות מקוצר');
    }

    function getText(str) {
        return (str) ? str.innerText.trim() : str;
    }

    return {
        install: install
    }
})().install();