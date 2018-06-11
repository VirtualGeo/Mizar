/*******************************************************************************
 * Copyright 2017 CNES - CENTRE NATIONAL d'ETUDES SPATIALES
 *
 * This file is part of MIZAR.
 *
 * MIZAR is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * MIZAR is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with MIZAR. If not, see <http://www.gnu.org/licenses/>.
 ******************************************************************************/
/*global define: false */

/**
 * Time travel module : time control 
 */
define(["jquery", "moment", "./TimeSample","./TimeEnumerated","../Utils/Constants"], function ($, Moment, TimeSample, TimeEnumerated, Constants) {

    /**
     * @name TimeTravelParams
     * @class
     * Management of time travel
     */
    var TimeTravelParams = function () {
        this.currentDate = new Date();
        
        this.currentPeriod = {
            "from" : null,
            "to" : null
        };

        this.currentDisplayDate = Moment(this.currentDate).format(Constants.TIME.DEFAULT_FORMAT);

        this.ctx = null;
        // List of samples
        this.samples = [];
        // Enumerated values
        this.enumeratedValues = new TimeEnumerated();

        // TODO: internationalized
        Moment.locale('fr');
    };

    /**************************************************************************************************************/

    /**
     * Set the context
     * @function setContext
     * @param ctx Context context
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.setContext = function (ctx) {
        this.ctx = ctx;
        this.apply();
    };

   

    /**************************************************************************************************************/

    /**
     * Set the current date
     * @function setCurrentDate
     * @param date Date current date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.setCurrentDate = function (date) {
        this.currentDate = Moment.utc(date);
    };


    /**************************************************************************************************************/

    /**
     * Get the current date
     * @function getCurrentDate
     * @return Date current date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getCurrentDate = function () {
        return this.currentDate;
    };


    /**************************************************************************************************************/

    /**
     * Get the current period
     * @function getCurrentPeriod
     * @return {Json} period { "from", "to" }
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getCurrentPeriod = function() {
        return this.currentPeriod;
    };

    /**************************************************************************************************************/

    /**
     * Add a sample
     * @function addSample
     * @param {Date} start Start date
     * @param {Date} end End date
     * @param {String} stepKind Step kind
     * @param {Integer} stepValue Step value
     * @param {String} ID Layer ID
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.addSample = function (start,end,stepKind,stepValue,ID) {
        var sample = new TimeSample();
        sample.setStart(start);
        sample.setEnd(end);
        sample.setStepKind(stepKind);
        sample.setStepValue(stepValue);
        sample.setLayerID(ID);
        this.samples.push(sample);
    };


    /**************************************************************************************************************/

    /**
     * Add values
     * @function add values
     * @param {Json} parameters Parameters
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.addValues = function (parameters) {
        if (!parameters) {
            return;
        }
        var saveCurrentValue = this.currentDate;

        if (parameters.enumeratedValues) {
            // Add to enumerated
            this.enumeratedValues.addEnumeratedValuesForID(parameters.enumeratedValues,parameters.ID);
        } else if (parameters.start && parameters.end && parameters.stepKind && parameters.stepValue && parameters.ID) {
            // Add a new sample
            this.addSample(parameters.start,parameters.end,parameters.stepKind,parameters.stepValue,parameters.ID);
        } else {
            console.log("Can't understand add values for time travel with parameters",parameters);
        }

        this.setToNearestValue(saveCurrentValue);
    };

    /**************************************************************************************************************/

    /**
     * Remove values
     * @function remove values
     * @param {Json} parameters Parameters
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.removeValues = function (parameters) {
        if (!parameters) {
            return;
        }
        var saveCurrentValue = this.currentDate;

        if (parameters.ID) {
            // Remove values into enumerated values
            this.enumeratedValues.removeEnumeratedValuesForID(parameters.ID);

            // Remove samples with ID
            var newSamples = [];
            for (var i=0;i<this.samples.length;i++) {
                if (this.samples[i].getLayerID() !== parameters.ID) {
                    newSamples.push(samples[i]);
                }
            }
            this.samples = newSamples;
        }
        this.setToNearestValue(saveCurrentValue);
    };

    /**************************************************************************************************************/

    /**
     * Get next date 
     * @function getNextDate
     * @return {Date} Date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getNextDate = function (date) {
        var minDate = {
            "date" : null
        };

        var allDates = [];
        for (var i=0;i<this.samples.length;i++) {
            allDates.push(this.samples[i].getFirstDateAfter(date));
        }
        //allDates.push(this.enumeratedValues.getFirstDateAfter(date));

        for (i=0;i<allDates.length;i++) {
            var currentNextDate = allDates[i];
            if (minDate.date === null) {
                minDate = currentNextDate;
            } else {
                if (Math.abs((currentNextDate-date)<(minDate-date))) {
                    minDate = currentNextDate;
                }
            }
        }
        return minDate;
    };

    /**************************************************************************************************************/

    /**
     * Get previous date 
     * @function getNextDate
     * @return {Date} Date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getPreviousDate = function (date) {
        var minDate = {
            "date" : null
        };

        var allDates = [];
        for (var i=0;i<this.samples.length;i++) {
            allDates.push(this.samples[i].getFirstDateBefore(date));
        }
        //allDates.push(this.enumeratedValues.getFirstDateBefore(date));

        for (i=0;i<allDates.length;i++) {
            var currentPreviousDate = allDates[i];
            if (minDate.date === null) {
                minDate = currentPreviousDate;
            } else {
                if (Math.abs((currentPreviousDate.date-date)<(minDate.date-date))) {
                    minDate = currentPreviousDate;
                }
            }
        }

        return minDate;
    };


    /**************************************************************************************************************/

    /**
     * Set to nearest value (call only for enumerated)
     * @function setToNearestValue
     * @param {Date} date date
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.setToNearestValue = function (date) {
        var previousExistingDate = this.getPreviousDate(date);
        var nextExistingDate = this.getNextDate(date);

        console.log("previous",previousExistingDate);
        console.log("next",nextExistingDate);
        if ( (previousExistingDate.date === null) && (nextExistingDate.date === null) ) {
            console.log("no date");
            // No date found
            this.currentDate = new Date();
            this.currentDisplayDate = Moment(this.currentDate).format("Do MMM Y");
            this.currentPeriod = {"from" : this.currentDate,"to":this.currentDate};
        } else if (previousExistingDate.date === null) {
            console.log("only after");
            // Only before
            this.currentDate = nextExistingDate.date;
            this.currentDisplayDate = nextExistingDate.display;
            this.currentPeriod = nextExistingDate.period;
        } else if (nextExistingDate.date === null) {
            console.log("only before");
            // Only after
            this.currentDate = previousExistingDate.date;
            this.currentDisplayDate = previousExistingDate.display;
            this.currentPeriod = previousExistingDate.period;
        } else {
            console.log("search nearest");
            // Search nearest
            deltaPrevious = Math.abs(date-previousExistingDate.date);
            deltaNext = Math.abs(nextExistingDate.date-date);
            if (deltaPrevious < deltaNext) {
                this.currentDate = previousExistingDate.date;
                this.currentDisplayDate = previousExistingDate.display;
                this.currentPeriod = previousExistingDate.period;
            } else {
                this.currentDate = nextExistingDate.date;
                this.currentDisplayDate = nextExistingDate.display;
                this.currentPeriod = nextExistingDate.period;
            }
        }
        this.apply();
    };

    /**************************************************************************************************************/

    /**
     * Update
     * @function update
     * @param {Json} parameters Parameters
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.update = function (parameters) {
        console.log("update",parameters);
        if (!parameters) {
            return;
        }
        if (parameters.add) {
            this.addValues(parameters.add);
        }
        if (parameters.remove) {
            this.removeValues(parameters.remove);
        }
        this.apply();

        console.log("toString ! "+this.toString());
    };

    /**************************************************************************************************************/

    /**
     * Apply current date to IHM (launch event)
     * @function apply
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.apply = function () {
        var details = {
            date :   this.currentDate,
            display: this.currentDisplayDate,
            period : this.currentPeriod
        };
        this.ctx.publish(Constants.EVENT_MSG.GLOBAL_TIME_CHANGED,details);
    };

    /**************************************************************************************************************/

    /**
     * Rewind to previous time step
     * @function rewind
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.rewind = function () {
        if (!this.isEmpty()) {
            var previousDate = this.getPreviousDate(Moment(this.currentDate).subtract(1,Constants.TIME_STEP.MILLISECOND));
            if (previousDate.date !== null) {
                this.currentDate = previousDate.date;
                this.currentPeriod = previousDate.period;
                this.currentDisplayDate = previousDate.display;
                this.apply();
            }
        }
    };

    /**************************************************************************************************************/

    /**
     * Forward to next time step
     * @function forward
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.forward = function () {
        if (!this.isEmpty()) {
            var nextDate = this.getNextDate(Moment(this.currentDate).add(1,Constants.TIME_STEP.MILLISECOND));
            if (nextDate.date !== null) {
                this.currentDate = nextDate.date;
                this.currentPeriod = nextDate.period;
                this.currentDisplayDate = nextDate.display;
                this.apply();
            } 
        }
    };

    /**************************************************************************************************************/

    /**
     * Get date formated (when there is no enumerated values)
     * @function getDateFormated
     * @param {Date} date Date
     * @return String Date formated
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getDateFormated = function (date) {
            // Check with STEP kind value
            var formatPattern = "LLLL";
            if (this.stepKind === Constants.TIME_STEP.YEAR) {
                formatPattern = "Y";
            } else if ( (this.stepKind === Constants.TIME_STEP.QUARTER) || (this.stepKind === Constants.TIME_STEP.MONTH) ) {
                formatPattern = "MMM Y";
            } else if ( (this.stepKind === Constants.TIME_STEP.WEEK) || (this.stepKind === Constants.TIME_STEP.DAY) || (this.stepKind === Constants.TIME_STEP.ENUMERATED)) {
                formatPattern = "Do MMM Y";
            } else if ( (this.stepKind === Constants.TIME_STEP.HOUR) || (this.stepKind === Constants.TIME_STEP.MINUTE) ) {
                formatPattern = "Do MMM Y HH:mm";
            } else if ( this.stepKind === Constants.TIME_STEP.SECOND) {
                formatPattern = "Do MMM Y   HH:mm:ss";
            } else {
                formatPattern = "Do MMM Y   HH:mm:ss.SSS";
            }    
            return Moment.utc(this.currentDate).format(formatPattern);
    };

    /**************************************************************************************************************/

    /**
     * Return date to display on IHM
     * @function getCurrentDisplayDate
     * @return String Date formated
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.getCurrentDisplayDate = function() {
        return this.currentDisplayDate;
        /*
        var result = null;
        if (this.stepKind === Constants.TIME_STEP.ENUMERATED) {
            if (this.enumeratedValues.length>0) {
                result = this.enumeratedValues[this.currentIndex].display;
            } else {
                result = this.getDateFormated(new Date());
            }
        } else {
            result = this.getDateFormated(this.currentDate);
        }
        return result;
        */
    };

    /**************************************************************************************************************/

    /**
     * Is current date the first ?
     * @function isCurrentDateTheFirst
     * @return boolean If the current date is the first of range
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.isCurrentDateTheFirst = function() {
        if (this.isEmpty() === true) {
            this.isFirstDate = true;
        } else {
            var previousDate = this.getPreviousDate(Moment(this.currentDate).subtract(1,Constants.TIME_STEP.MILLISECOND));
            this.isFirstDate = (previousDate.date === null);
        }
        return this.isFirstDate;
    };

    /**************************************************************************************************************/

    /**
     * Is current date the last ?
     * @function isCurrentDateTheLast
     * @return boolean If the current date is the last of range
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.isCurrentDateTheLast = function() {
        if (this.isEmpty() === true) {
            this.isLastDate = true;
        } else {
            var nextDate = this.getNextDate(Moment(this.currentDate).add(1,Constants.TIME_STEP.MILLISECOND));
            this.isLastDate = (nextDate.date === null);
        }
        return this.isLastDate;
    };

    /**************************************************************************************************************/

    /**
     * Is time travel empty ?
     * @function toString
     * @return {Boolean} Is time travel empty
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.isEmpty = function() {
        var hasSamples = ( (this.samples) && (this.samples.length>0) );
        return ( (!hasSamples) && (this.enumeratedValues.isEmpty()) );
    };

    /**************************************************************************************************************/

    /**
     * Get string representation
     * @function toString
     * @return {String} String representation
     * @memberOf TimeTravelParams#
     */
    TimeTravelParams.prototype.toString = function() {
        var res = "";
        
        if (this.samples) {
            for (var i=0;i<this.samples.length;i++) {
                res += "Sample : "+this.samples[i].toString()+"\n";
            }
        }

        if (!this.enumeratedValues.isEmpty()) {
            res += "Enumerated : "+this.enumeratedValues.toString()+"\n";
        }

        return res;
    };
    

    return TimeTravelParams;
});



