const Tlushim = (function() {
    let updatedTimestamp = 0;
    let hoursSupposedToBe = 0;
    let totalTimeInMinutes = 0;

    function install() {
        let data = [];

        updatedTimestamp = getUpdatedTimeStamp();

        document.querySelectorAll("table.atnd tr:not(.total)").forEach((tr, index) => {
            const date = getText(tr.querySelector("td:nth-child(1)"));
            const enterTime = tr.querySelector("td:nth-child(3)");
            const exitTime = tr.querySelector("td:nth-child(4)");
            const optionType = getText(tr.querySelector("td.atnd_type select option"));
            const shiftType = getText(tr.querySelector('td.atnd:nth-child(20)'));
            const hourInRow = getText(tr.querySelector('td.atnd:nth-child(21)'));

            if (!isValidDate(date) || isInvalidShiftType(shiftType, optionType) || hourInRow === null) {
                return;
            }

            totalTimeInMinutes += summarizeMinutes(enterTime, exitTime);
            hoursSupposedToBe += Number(hourInRow);

            if(index === 3) {
                window.$tr = tr;
                window.$optionType = optionType;
                window.$enterTime = enterTime;
                window.$exitTime = exitTime;
            }

            data.push([date, optionType, shiftType, hourInRow]);
            // console.log(date, optionType, shiftType, hourInRow);
        });

        console.table(data);
        console.table([['hoursSupposedToBe', 'actualTime'], [hoursSupposedToBe, minutesToTime(totalTimeInMinutes)]]);
    }

    function summarizeMinutes(enterTime, exitTime) {
        const enterHours = getValue(enterTime.querySelector('input:nth-child(1)'));
        const exitHours = getValue(exitTime.querySelector('input:nth-child(1)'));
        let enterMinutes = getValue(enterTime.querySelector('input:nth-child(2)'));
        let exitMinutes = getValue(exitTime.querySelector('input:nth-child(2)'));

        if (enterHours === '' || enterMinutes === '' || exitHours === '' || exitMinutes === '') return 0;

        return getTotalMinutesInRow(enterHours, exitHours, enterMinutes, exitMinutes);
    }

    function getUpdatedTimeStamp() {
        const caption = document.querySelector('table.atnd caption').innerText;
        const regex = /(\d{2}\/\d{2}\/\d{2})/;
        const date = caption.match(regex);
        const dateSeparated = date[0].split('/');

        // Date uses a month -1 =[
        const month = (Number(dateSeparated[1]) - 1);

        return (new Date('20' + dateSeparated[2], month, dateSeparated[0])).getTime();
    }

    function isValidDate(date) {
        if (!date) return;

        let dateSeparated = date.split('/');
        if (!dateSeparated.length) return false;

        // Date uses a month -1 =[
        const month = (Number(dateSeparated[1]) - 1);

        return (updatedTimestamp >= new Date('20' + dateSeparated[2], month, dateSeparated[0]).getTime());
    }

    function isValidOptionType(optionType) {
        return !(optionType === '' || optionType !== 'רגיל');
    }

    function minutesToTime(minutes) {
        const realMinutes = minutes % 60;
        const hours = Math.ceil((minutes) / 60);

        return ((hours < 10) ? '0' + hours : hours) + ':' + realMinutes;
    }

    function getTotalMinutesInRow(enterHours, exitHours, enterMinutes, exitMinutes) {
        enterMinutes = Number(enterMinutes);
        exitMinutes = Number(exitMinutes);

        const hoursDiff = Number(exitHours) - Number(enterHours);
        let minutesDiff;

        if (exitMinutes >= enterMinutes) {
            minutesDiff = exitMinutes - enterMinutes;
        }
        else {
            minutesDiff = enterMinutes - exitMinutes;
        }

        return (minutesDiff + (hoursDiff * 60));
    }

    function isInvalidShiftType(shiftType, optionType) {
        return (shiftType === '' && ['מילואים', 'מחלה', 'חופשה'].indexOf(optionType) === -1);
    }

    function getText(str) {
        return (str) ? str.innerText.trim() : str;
    }

    function getValue(str) {
        return (str) ? str.value.trim() : str;
    }

    return {
        install: install
    }
})().install();