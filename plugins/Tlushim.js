const Tlushim = (function() {
    let names = {};
    let totalPercentage = 0;
    let updatedTimestamp = 0;
    let hoursSupposedToBe = 0;
    let showPercentage = true;
    let showTimeOnBlank = true;
    let totalTimeInMinutes = 0;
    const ulSearchBarDefaultStyle = 'z-index: 9999; position: absolute; width: 220px; top: 100%; padding: 0; margin: 0; list-style: none; background: #fff; max-height: 200px; overflow: scroll; border: 1px #ccc solid; border-top: 0; border-radius: 0 0 5px 5px;';
    const ONE_HOUR_IN_MINUTES = 60;

    /**
     * Starting point of the app.
     * Here it runs in a loop over all the lines in the table
     * and uses helping functions to parse and summarize the minutes calculation.
     */
    function install(settings) {
        totalPercentage = 0;
        updatedTimestamp = 0;
        hoursSupposedToBe = 0;
        totalTimeInMinutes = 0;
        showPercentage = settings.showPercentage;
        showTimeOnBlank = settings.showTimeOnBlank;

        let data = [['date', 'minutes', 'hour in row']];
        if (!isHoursTableExists()) return;

        updatedTimestamp = getUpdatedTimeStamp();
        const menuLinks = document.querySelector('.menu_links');

        if (menuLinks)
            appendSearchInput(menuLinks);

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
                const duration = tr.querySelector("td:nth-child(" + getColumnIndexByText('משך', loop) + ")");
                const optionType = getOptionType(tr, getColumnIndexByText('סוג', loop));

                if (isOutOfWork(shiftType, optionType) && loop === 1) {
                    totalMinutesInRow += (hourInRow * ONE_HOUR_IN_MINUTES);
                    continue;
                }
                else if (isOutOfWork(shiftType, optionType)) {
                    continue;
                }

                const summarizedMinutes = summarizeMinutes(enterTime, exitTime);
                if (showTimeOnBlank && !duration.innerText && summarizedMinutes !== 0) {
                    const time = minutesToTime(summarizedMinutes);
                    duration.innerText = `${time.hours < 10 ? `0${time.hours}` : time.hours}:${time.minutes < 10 ? `0${time.minutes}` : time.minutes}`;
                    duration.classList.add('om_duration');
                }
                else if (!showTimeOnBlank && duration.classList.contains('om_duration')) {
                    duration.classList.remove('om_duration');
                    duration.innerText = '';
                }

                totalMinutesInRow += summarizedMinutes;
            }

            data.push([date, totalMinutesInRow, hourInRow]);

            totalTimeInMinutes += totalMinutesInRow;
            hoursSupposedToBe += Number(hourInRow);
        });
        document.addEventListener('click', handleULClose);

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

        if (document.querySelector('.om_message')) {
            document.querySelector('.om_message').remove();
        }

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

        if(showPercentage) {
            span.innerHTML += `<br>אחוז משרה מתחילת החודש: ${totalPercentage.toFixed(2)}%`;
        }

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
        if (hours.exit < hours.enter) hours.exit += 24;

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
        return (shiftType !== '' && ['מילואים', 'מחלה', 'חופשה', 'חופש ע"ח המעסיק', 'בידוד'].indexOf(optionType) !== -1);
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

    function toggle() {
        const divMessage = document.querySelector('.om_message');
        if (divMessage) {
            divMessage.remove();
        }
        else {
            chrome.runtime.sendMessage({method: "getItem", key: ['showPercentage', 'showTimeOnBlank']}, function (response) {
                install({
                    showPercentage: response['showPercentage'] === undefined || response['showPercentage'].value,
                    showTimeOnBlank: response['showTimeOnBlank'] === undefined || response['showTimeOnBlank'].value,
                });
            });
        }
    }

    function refresh() {
        chrome.runtime.sendMessage({method: "getItem", key: ['showPercentage', 'showTimeOnBlank']}, function (response) {
            install({
                showPercentage: response['showPercentage'] === undefined || response['showPercentage'].value,
                showTimeOnBlank: response['showTimeOnBlank'] === undefined || response['showTimeOnBlank'].value,
            });
        });
    }

    function appendSearchInput(menuLinks) {
        const ul = document.createElement('ul');
        const div = document.createElement('div');
        const input = document.createElement('input');
        const allTaz = document.getElementById('worker_list');

        ul.style.cssText = `display: none; ${ulSearchBarDefaultStyle}`;
        div.style.cssText = 'display: inline-block; position: relative; width: 220px;';
        input.style.cssText = 'height: 20px; width: 220px;';
        ul.id = 'ulSearchByName';
        ul.className = 'ulSearch';
        input.id = 'inputSearchByName';

        input.addEventListener('keyup', filterSearch);

        for (const el of allTaz.children) {
            if (el.value) {
                names[el.value] = {};
                names[el.value]['name'] = el.text.replace('&nbsp;', ' ');
                names[el.value]['tz'] = el.value;
            }
        }

        div.appendChild(ul);
        div.appendChild(input);
        menuLinks.appendChild(div);
    }

    function filterSearch() {
        const ul = document.getElementById('ulSearchByName');
        const inputSearch = document.getElementById('inputSearchByName');
        const value = inputSearch.value;
        const filteredNames = getTzByName(value);
        ul.style.cssText = `display: block; ${ulSearchBarDefaultStyle}`;
        ul.innerHTML = '';

        filteredNames.forEach((key, index) => {
            const li = document.createElement('li');
            let liBasicCSS = 'cursor: pointer; height: 17px; padding: 5px;';
            if (index !== (filteredNames.length-1)) {
                liBasicCSS += 'border-bottom: 1px #c8c8c8 solid;';
            }
            li.textContent = names[key].name;
            li.style.cssText = liBasicCSS;
            li.onmouseenter = (e) => { e.target.style.cssText = liBasicCSS + 'background: #ccc'; }
            li.onmouseleave = (e) => { e.target.style.cssText = liBasicCSS + 'background: #fff'; }
            li.onclick = () => { moveToTz(key) };
            ul.appendChild(li);
        });
    }

    function getTzByName(value) {
        return Object.keys(names).filter(key => names[key].name.indexOf(value) !== -1);
    }

    function handleULClose(e) {
        const ul = document.getElementById('ulSearchByName');
        if (e.target.className !== 'ulSearch') {
            ul.style.cssText = `display: none; ${ulSearchBarDefaultStyle}`;
        }
    }

    function moveToTz(tz) {
        const month = getParameterByName('month');

        window.location.href = 'https://www.tlushim.co.il/main.php?op=atnd&tz=' + tz + (month ? '&month=' + month : '');
    }

    function getParameterByName(name, url = window.location.href) {
        name = name.replace(/[\[\]]/g, '\\$&');
        const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, ' '));
    }

    return {
        toggle: toggle,
        install: install,
        refresh: refresh,
    }
})();
