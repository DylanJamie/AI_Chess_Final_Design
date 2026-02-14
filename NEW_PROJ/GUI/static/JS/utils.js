/* 
Utils JavaScript - Utility functions and helpers
Date: 10/08/2025
file: /AI_Chess_Senior_Design/GUI/static/CSS/utils.js
*/

//------------------------------------------------------------------------------
//
// function: formatTime
//
// arguments:
//  seconds - number of seconds to format
//
// returns:
//  string - formatted time in MM:SS format
//
// description:
//  Converts a time value in seconds into a user-friendly string format
//  displaying minutes and seconds.
//
//------------------------------------------------------------------------------

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

//------------------------------------------------------------------------------
//
// function: generateId
//
// arguments:
//  none
//
// returns:
//  string - a randomly generated unique identifier
//
// description:
//  Generates a short, unique alphanumeric ID suitable for use as an element
//  identifier or key.
//
//------------------------------------------------------------------------------

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

//------------------------------------------------------------------------------
//
// function: deepClone
//
// arguments:
//  obj - object to clone
//
// returns:
//  object - a deep copy of the input object
//
// description:
//  Creates a deep copy of an object using JSON serialization and parsing,
//  ensuring no references are shared between the original and clone.
//
//------------------------------------------------------------------------------

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

//------------------------------------------------------------------------------
//
// function: isEmpty
//
// arguments:
//  value - any value to check
//
// returns:
//  boolean - true if the value is null, undefined, or an empty string
//
// description:
//  Determines whether a given value is considered empty.
//
//------------------------------------------------------------------------------

function isEmpty(value) {
    return value === null || value === undefined || value === '';
}

//------------------------------------------------------------------------------
//
// function: debounce
//
// arguments:
//  func - function to debounce
//  wait - delay time in milliseconds
//
// returns:
//  function - debounced version of the input function
//
// description:
//  Prevents a function from executing until a specified delay has elapsed
//  since the last time it was invoked.
//
//------------------------------------------------------------------------------

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

//------------------------------------------------------------------------------
//
// function: throttle
//
// arguments:
//  func - function to throttle
//  limit - time limit in milliseconds
//
// returns:
//  function - throttled version of the input function
//
// description:
//  Ensures that the provided function is only executed once within a given
//  time interval, improving performance for frequent events.
//
//------------------------------------------------------------------------------

function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

//------------------------------------------------------------------------------
//
// function: getRandomElement
//
// arguments:
//  array - array to select a random element from
//
// returns:
//  any - a random element from the array
//
// description:
//  Returns a single random element from the provided array.
//
//------------------------------------------------------------------------------

function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}

//------------------------------------------------------------------------------
//
// function: shuffleArray
//
// arguments:
//  array - array to shuffle
//
// returns:
//  array - a new shuffled version of the input array
//
// description:
//  Performs a Fisher-Yates shuffle to randomize the order of elements in an array.
//
//------------------------------------------------------------------------------

function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

//------------------------------------------------------------------------------
//
// function: isValidEmail
//
// arguments:
//  email - string to validate
//
// returns:
//  boolean - true if the email matches the expected format
//
// description:
//  Validates that an input string follows a standard email address format.
//
//------------------------------------------------------------------------------

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

//------------------------------------------------------------------------------
//
// function: formatNumber
//
// arguments:
//  num - number to format
//
// returns:
//  string - formatted number with commas as thousand separators
//
// description:
//  Converts a number into a string with comma separators for readability.
//
//------------------------------------------------------------------------------

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

//------------------------------------------------------------------------------
//
// function: getCurrentTimestamp
//
// arguments:
//  none
//
// returns:
//  string - ISO-formatted timestamp of the current date and time
//
// description:
//  Retrieves the current timestamp in ISO 8601 format.
//
//------------------------------------------------------------------------------

function getCurrentTimestamp() {
    return new Date().toISOString();
}

//------------------------------------------------------------------------------
//
// function: getUrlParams
//
// arguments:
//  none
//
// returns:
//  object - key-value pairs representing URL query parameters
//
// description:
//  Parses the current window's URL query string and returns its parameters
//  as an object.
//
//------------------------------------------------------------------------------

function getUrlParams() {
    const params = {};
    const urlSearchParams = new URLSearchParams(window.location.search);
    for (const [key, value] of urlSearchParams) {
        params[key] = value;
    }
    return params;
}

// Local storage helpers
const storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('Error saving to localStorage:', e);
        }
    },
    
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return defaultValue;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            console.error('Error removing from localStorage:', e);
        }
    }
};
//
// End of file