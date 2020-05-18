const Tlushim = (function() {
    let totalPercentage = 0;
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
        let data = [['date', 'minutes', 'hour in row']];
        if (!isHoursTableExists()) return;

        updatedTimestamp = getUpdatedTimeStamp();

        document.querySelectorAll("table.atnd tr:not(.total)").forEach((tr, index) => {
            const date = getText(tr.querySelector("td:nth-child(1)"));
            const hourInRow = getText(tr.querySelector('td.atnd:nth-child(' + getColumnIndexByText('תקן') + ')'));
            const shiftType = getText(tr.querySelector('td.atnd:nth-child(' + getColumnIndexByText('משמרת') + ')'));

            if (index === 0) return;

            if (!isValidDate(date) || isInvalidShiftType(shiftType) || hourInRow == null) {
                return;
            }

            let totalMinutesInRow = 0;
            for (let loop = 1; loop <= 3; loop++) {
                const enterTime = tr.querySelector("td:nth-child(" + getColumnIndexByText('כניסה', loop) + ")");
                const exitTime = tr.querySelector("td:nth-child(" + getColumnIndexByText('יציאה', loop) + ")");
                const optionType = getOptionType(tr, getColumnIndexByText('סוג', loop));

                if (isOutOfWork(shiftType, optionType) && loop === 1) {
                    totalMinutesInRow += (hourInRow * ONE_HOUR_IN_MINUTES);
                    continue;
                }
                else if (isOutOfWork(shiftType, optionType)) {
                    continue;
                }

                totalMinutesInRow += summarizeMinutes(enterTime, exitTime);
            }

            data.push([date, totalMinutesInRow, hourInRow]);

            totalTimeInMinutes += totalMinutesInRow;
            hoursSupposedToBe += Number(hourInRow);
        });

        // console.table(data);

        const sumTotalTime = document.querySelector('.total .atnd:nth-child(' + getColumnIndexByText('תקן') + ')');
        
        // console.log('totalTimeInMinutes', totalTimeInMinutes);
        // console.log('hoursSupposedToBe', (hoursSupposedToBe * ONE_HOUR_IN_MINUTES));
        totalPercentage = (totalTimeInMinutes * 100) / (sumTotalTime.innerText * ONE_HOUR_IN_MINUTES);

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
        let hoursDiff;
        const time = minutesToTime(totalTimeInMinutes);
        const div = document.createElement('div');
        const span = document.createElement('span');
        const roundedHoursSupposedToBe = Math.round(hoursSupposedToBe);

        if (document.querySelector('.om_message')) return;

        div.classList.add('om_message');
        div.style.cssText = 'border: 1px solid; width: 80%; margin: 10px auto; line-height: 22px; padding: 10px 0; font-size: 14px;font-family: Arial;';

        if (time.hours < roundedHoursSupposedToBe) {
            // Bad boy!
            div.style.cssText += 'color: #D8000C; background-color: #FFBABA;';

            if (time.hours > 0) {
                ++time.hours;
                time.minutes = ONE_HOUR_IN_MINUTES - time.minutes;
            }

            hoursDiff = (roundedHoursSupposedToBe - time.hours);
            span.innerText = "חסרות לך " + translateHoursToNormalHebrew(hoursDiff) + ' ' + translateMinutesToNormalHebrew(time.minutes, hoursDiff);
        }
        else {
            // Great
            hoursDiff = (-1 * (roundedHoursSupposedToBe - time.hours));

            div.style.cssText += 'color: #4F8A10; background-color: #DFF2BF;';
            span.innerText = "יש לך " + translateHoursToNormalHebrew(hoursDiff) + ' ' + translateMinutesToNormalHebrew(time.minutes, hoursDiff) + " עודף!";
        }

        span.innerHTML += `<br>אחוז משרה: ${totalPercentage.toFixed(2)}%`;

        div.appendChild(span);
        document.querySelector('div.atnd form').insertBefore(div, document.querySelector('table.atnd'));
    }

    function translateHoursToNormalHebrew(hours) {
        if (hours === 0) return '';
        if (hours === 1) return 'שעה';
        if (hours === 2) return 'שעתיים';

        return hours + ' שעות';
    }

    function translateMinutesToNormalHebrew(minutes, hours) {
        if (hours !== 0) {
            if (minutes === 1) return 'ודקה';

            return " ו-" + minutes + ' דקות';
        }
        else {
            if (minutes === 1) return 'דקה';

            return minutes + ' דקות';
        }
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
        let hours = {
            exit: Number(exitHours),
            enter: Number(enterHours)
        };

        let minutes = {
            exit: Number(exitMinutes),
            enter: Number(enterMinutes)
        };

        hours.exit = (hours.exit === 0) ? 24 : hours.exit;
        hours.enter = (hours.enter === 0) ? 24 : hours.enter;

        let difference = calculateHoursToMinutes(hours, minutes);

        // In case of late night work Ex: 00:00 - 03:00
        if (difference < 0) {
            hours.exit = (hours.exit === 24) ? 0 : hours.exit;
            hours.enter = (hours.enter === 24) ? 0 : hours.enter;

            difference = calculateHoursToMinutes(hours, minutes);
        }

        return difference;
    }

    function calculateHoursToMinutes(hours, minutes) {
        const hoursDiff = hours.exit - hours.enter;
        const minutesDiff = minutes.exit - minutes.enter;
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
     * @param byIndex - if null returns the last index
     * @returns {number}
     */
    function getColumnIndexByText(text, byIndex) {
        let realIndex = 0;
        let foundCount = 0;

        document.querySelectorAll('table.atnd tr.atnd:first-child th').forEach((th, index) => {
            if (th.innerText === text) {
                foundCount++;

                if (!byIndex || (byIndex === foundCount)) {
                    realIndex = index;
                }
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
