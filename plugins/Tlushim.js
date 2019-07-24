const Tlushim = (function() {
    let updatedTimestamp = 0;
    let hoursSupposedToBe = 0;
    let totalTimeInMinutes = 0;
    const ONE_HOUR_IN_MINUTES = 60;

    /**
     * Starting point of the app.
     * Here it runs in a loop over all the lines in the table
     * and uses helping functions to parse and summarize the minutes calculation.
     */
    function install() {
        if (!isHoursTableExists()) return;

        updatedTimestamp = getUpdatedTimeStamp();

        document.querySelectorAll("table.atnd tr:not(.total)").forEach((tr) => {
            const date = getText(tr.querySelector("td:nth-child(1)"));
            const enterTime = tr.querySelector("td:nth-child(3)");
            const exitTime = tr.querySelector("td:nth-child(4)");
            const optionType = getOptionType(tr, getColumnIndexByText('סוג', true));
            const shiftType = getText(tr.querySelector('td.atnd:nth-child(' + getColumnIndexByText('משמרת', true) + ')'));
            const hourInRow = getText(tr.querySelector('td.atnd:nth-child(' + getColumnIndexByText('תקן') + ')'));

            if (!isValidDate(date) || isInvalidShiftType(shiftType) || hourInRow === null) {
                return;
            }

            hoursSupposedToBe += Number(hourInRow);

            if (isOutOfWork(shiftType, optionType)) {
                totalTimeInMinutes += (hourInRow * ONE_HOUR_IN_MINUTES);
                return;
            }

            totalTimeInMinutes += summarizeMinutes(enterTime, exitTime);
        });

        printTime();
    }

    /**
     * Returns the optionType text,
     * also supports previous months
     *
     * @param tr
     * @param tdIndex
     * @returns {*}
     */
    function getOptionType(tr, tdIndex) {
        let optionType = tr.querySelector('td.atnd_type select option[selected]');

        if (!optionType) {
            optionType = tr.querySelector('td:nth-child(' + tdIndex + ')');
        }

        return getText(optionType);
    }

    /**
     * Print function creates the colored div and puts the data inside
     */
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

    /**
     * It extracts the time from a string or an input
     * and summarizes the minutes of all the lines in the table
     *
     * @param enterTime
     * @param exitTime
     * @returns {number|*}
     */
    function summarizeMinutes(enterTime, exitTime) {

        let enterHoursEl = enterTime.querySelector('input:nth-child(1)');
        let exitHoursEl = exitTime.querySelector('input:nth-child(1)');
        let enterMinutesEl = enterTime.querySelector('input:nth-child(2)');
        let exitMinutesEl = exitTime.querySelector('input:nth-child(2)');

        let enterHours = getValue(enterHoursEl);
        let exitHours = getValue(exitHoursEl);
        let enterMinutes = getValue(enterMinutesEl);
        let exitMinutes = getValue(exitMinutesEl);

        if (!enterHours || !enterMinutes) {
            const separatedEnterHours = extractTimeFromString(enterTime);

            enterHours = separatedEnterHours.hours;
            enterMinutes = separatedEnterHours.minutes;
        }

        if (!exitHours || !exitMinutes) {
            const separatedExitHours = extractTimeFromString(exitTime);

            exitHours = separatedExitHours.hours;
            exitMinutes = separatedExitHours.minutes;
        }

        if (enterHours === '' || enterMinutes === '' || exitHours === '' || exitMinutes === '') return 0;

        return getTotalMinutesInRow(enterHours, exitHours, enterMinutes, exitMinutes);
    }

    /**
     * Extracts the time from a string and split it to hours and minutes
     *
     * @param time
     * @returns {{hours: string, minutes: string}}
     */
    function extractTimeFromString(time) {
        const separatedTime = getText(time).split(':');

        return {
            hours: separatedTime[0],
            minutes: separatedTime[1]
        }
    }

    /**
     * getUpdatedTimeStamp helps to retrieve the last updated date
     *
     * @returns {number}
     */
    function getUpdatedTimeStamp() {
        const caption = document.querySelector('table.atnd caption').innerText;
        const regex = /(\d{2}\/\d{2}\/\d{2})/;
        const date = caption.match(regex);
        const dateSeparated = date[0].split('/');

        // Date uses a month -1 =[
        const month = (Number(dateSeparated[1]) - 1);

        return (new Date('20' + dateSeparated[2], month, dateSeparated[0])).getTime();
    }

    /**
     * isValidDate checks if the given date is valid and in the past
     *
     * @param date
     * @returns {boolean}
     */
    function isValidDate(date) {
        if (!date) return;

        let dateSeparated = date.split('/');
        if (!dateSeparated.length) return false;

        // Date uses a month -1 =[
        const month = (Number(dateSeparated[1]) - 1);

        return (updatedTimestamp > new Date('20' + dateSeparated[2], month, dateSeparated[0]).getTime());
    }

    /**
     * Here it gets a minutes number and returns separated hours and minutes object
     *
     * @param minutes
     * @returns {{hours: number, minutes: number}}
     */
    function minutesToTime(minutes) {
        const realMinutes = minutes % 60;
        const hours = parseInt((minutes - realMinutes) / 60);

        return {
            hours: hours,
            minutes: realMinutes
        }
    }

    /**
     * Check if this shift is a regular shift
     *
     * @param shiftType
     * @returns {boolean}
     */
    function isInvalidShiftType(shiftType) {
        return (shiftType === '' || shiftType === 'חג');
    }

    /**
     * getTotalMinutesInRow calculates the enter and exit time in the row
     *
     * @param enterHours
     * @param exitHours
     * @param enterMinutes
     * @param exitMinutes
     * @returns {number}
     */
    function getTotalMinutesInRow(enterHours, exitHours, enterMinutes, exitMinutes) {
        enterMinutes = Number(enterMinutes);
        exitMinutes = Number(exitMinutes);

        const hoursDiff = Number(exitHours) - Number(enterHours);
        const minutesDiff = exitMinutes - enterMinutes;

        return (minutesDiff + (hoursDiff * 60));
    }

    /**
     * Checks if the line is a "out of work" line
     *
     * @param shiftType
     * @param optionType
     * @returns {boolean}
     */
    function isOutOfWork(shiftType, optionType) {
        return (shiftType !== '' && ['מילואים', 'מחלה', 'חופשה'].indexOf(optionType) !== -1);
    }

    /**
     * Helps to get a text and trim it
     *
     * @param str
     * @returns {string}
     */
    function getText(str) {
        return (str) ? str.innerText.trim() : str;
    }

    /**
     * Helps to get a value and trim it
     *
     * @param str
     * @returns {string}
     */
    function getValue(str) {
        return (str) ? str.value.trim() : str;
    }

    /**
     * It helps to get the index of the corresponding text
     *
     * @param text
     * @param getFirst
     * @returns {number}
     */
    function getColumnIndexByText(text, getFirst) {
        let realIndex = 0;
        let already = false;
        document.querySelectorAll('table.atnd tr.atnd:first-child th').forEach((th, index) => {
            if (th.innerText === text && (!getFirst || (getFirst && !already))) {
                realIndex = index;
                already = true;
            }
        });

        return (realIndex + 1);
    }

    /**
     * Checks if the table of hours is shown
     *
     * @returns {Element}
     */
    function isHoursTableExists() {
        return (document.querySelector("table.atnd"));
    }

    return {
        install: install
    }
})();