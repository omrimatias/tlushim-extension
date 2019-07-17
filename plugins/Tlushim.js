Tlushim = (function() {
    let updatedTimestamp = 0;
    let hoursSupposedToBe = 0;
    let totalTimeInMinutes = 0;
    const ONE_HOUR_IN_MINUTES = 60;

    function install() {
        let data = [];

        updatedTimestamp = getUpdatedTimeStamp();

        document.querySelectorAll("table.atnd tr:not(.total)").forEach((tr, index) => {
            const date = getText(tr.querySelector("td:nth-child(1)"));
            const enterTime = tr.querySelector("td:nth-child(3)");
            const exitTime = tr.querySelector("td:nth-child(4)");
            const optionType = getText(tr.querySelector("td.atnd_type select option[selected]"));
            const shiftType = getText(tr.querySelector('td.atnd:nth-child(' + getColumnIndexByText('משמרת') + ')'));
            const hourInRow = getText(tr.querySelector('td.atnd:nth-child(' + getColumnIndexByText('תקן') + ')'));

            if (!isValidDate(date) || isInvalidShiftType(shiftType) || hourInRow === null) {
                return;
            }

            if (isOutOfWork(shiftType, optionType)) {
                totalTimeInMinutes += hourInRow * ONE_HOUR_IN_MINUTES;
                return;
            }

            totalTimeInMinutes += summarizeMinutes(enterTime, exitTime);
            hoursSupposedToBe += Number(hourInRow);

            // data.push([date, optionType, shiftType, hourInRow]);
        });

        // console.table(data);
        // console.table([['hoursSupposedToBe', 'actualTime'], [hoursSupposedToBe, minutesToTime(totalTimeInMinutes)]]);
        printTime();
    }

    function printTime() {
        const time = minutesToTime(totalTimeInMinutes);
        const div = document.createElement('div');
        const span = document.createElement('span');

        if (document.querySelector('.om_message')) return;

        div.classList.add('om_message');
        div.style.cssText = 'border: 1px solid; width: 80%; margin: 10px auto; line-height: 50px; font-size: 14px;font-family: Arial;';

        if (time.hours < hoursSupposedToBe) {
            div.style.cssText += 'color: #D8000C; background-color: #FFBABA;';

            if (time.hours > 0) {
                ++time.hours;
                time.minutes = ONE_HOUR_IN_MINUTES - time.minutes;
            }

            // Bad boy!
            // console.log("חסרות לך " + (hoursSupposedToBe - time.hours) + " שעות ו-" + time.minutes + " דקות");
            span.innerText = "חסרות לך " + (hoursSupposedToBe - time.hours) + " שעות ו-" + time.minutes + " דקות";
        }
        else {
            div.style.cssText += 'color: #4F8A10; background-color: #DFF2BF;';

            // Great!
            // console.log("יש לך " + (time.hours - hoursSupposedToBe) + " שעות עודף!");
            span.innerText = "יש לך " + (-1 * (hoursSupposedToBe - time.hours)) + " שעות ו-" + time.minutes + " דקות עודף!";
        }

        div.appendChild(span);
        document.querySelector('div.atnd form').insertBefore(div, document.querySelector('table.atnd'));
    }

    function summarizeMinutes(enterTime, exitTime) {

        let enterHoursEl = enterTime.querySelector('input:nth-child(1)');
        let exitHoursEl = exitTime.querySelector('input:nth-child(1)');
        let enterMinutesEl = enterTime.querySelector('input:nth-child(2)');
        let exitMinutesEl = exitTime.querySelector('input:nth-child(2)');

        let enterHours = getValue(enterHoursEl);
        let exitHours = getValue(exitHoursEl);
        let enterMinutes = getValue(enterMinutesEl);
        let exitMinutes = getValue(exitMinutesEl);

        if (!enterHours || !enterMinutes || !exitHours || !exitMinutes) {
            const separatedEnterHours = getText(enterTime).split(':');
            const separatedExitHours = getText(exitTime).split(':');

            enterHours = separatedEnterHours[0];
            enterMinutes = separatedEnterHours[1];
            exitHours = separatedExitHours[0];
            exitMinutes = separatedExitHours[1];
        }

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

        return (updatedTimestamp > new Date('20' + dateSeparated[2], month, dateSeparated[0]).getTime());
    }

    function minutesToTime(minutes) {
        const realMinutes = minutes % 60;
        const hours = parseInt((minutes - realMinutes) / 60);

        return {
            hours: hours,
            minutes: realMinutes
        }
        // return ((hours < 10) ? '0' + hours : hours) + ':' + ((realMinutes < 10) ? '0' + realMinutes : realMinutes);
    }

    function isInvalidShiftType(shiftType) {
        return (shiftType === '');
    }

    function getTotalMinutesInRow(enterHours, exitHours, enterMinutes, exitMinutes) {
        enterMinutes = Number(enterMinutes);
        exitMinutes = Number(exitMinutes);

        const hoursDiff = Number(exitHours) - Number(enterHours);
        const minutesDiff = exitMinutes - enterMinutes;

        return (minutesDiff + (hoursDiff * 60));
    }

    function isOutOfWork(shiftType, optionType) {
        return (shiftType !== '' && ['מילואים', 'מחלה', 'חופשה'].indexOf(optionType) !== -1);
    }

    function getText(str) {
        return (str) ? str.innerText.trim() : str;
    }

    function getValue(str) {
        return (str) ? str.value.trim() : str;
    }

    function getColumnIndexByText(text) {
        let realIndex = 0;
        document.querySelectorAll('table.atnd tr.atnd:first-child th').forEach((th, index) => {
            if (th.innerText === text) {
                realIndex = index;
            }
        });

        return (realIndex + 1);
    }

    return {
        install: install
    }
})().install();