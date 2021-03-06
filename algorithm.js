/*
  Language tables constraint satisfaction problem
*/

/*
  HELPER FUNCTIONS
*/

const mail = require('./mail.js');

var compare = function(a, b) {
  if (a.waitlist.length > b.waitlist.length)
    return -1;
  if (a.waitlist.length < b.waitlist.length)
    return 1;
  return 0;
}

var findIndexByKeyValue = function(array, key, value) {
  for (var i = 0; i < array.length; i ++) {
    if (array[i][key] === value) {
      return i;
    }
  }
  return null;
}

var run = function(db, moment) {
  // Global Variables
  var spareTablesOf6 = 0,
    spareTablesOf8 = 0,
    seatLimit = 120,
    waitlistQ = [],
    waitlistToGuests = [];


  // Get today's date from MomentJS and find tomorrow
  var today = moment();
  var tomorrow = today.add(1, 'days').startOf('day');
  console.log("tomorrow: " + tomorrow.utc().format() + "\n");

  // Get tomorrow's object from database and run the algorithm
  var languages;
  db.collection('dates').find({date: tomorrow.utc().format()})
    .toArray(function(err, result) {
      if (err) {
        throw err;
      }

      languages = result[0].vacancy;
      console.log(languages);

      // For each language in the object
      languages.forEach(function(language, languageIndex) {
        var numTablesOf8 = language.tablesOf8;
        var numTablesOf6 = language.tablesOf6;

        // If the language's waitlist is empty
        if (language.waitlist.length === 0) {
          for (var i = 0; i < numTablesOf8; i ++) {
            // checks if any tables of size 8 can be removed from baseline allocation
            if (language.seatsReserved <= (language.seatsAvailable - 8)) {
              language.seatsAvailable -= 8;
              spareTablesOf8 ++;
              language.tablesOf8 --;
            }
          }

          for (var i = 0; i < numTablesOf6; i ++) {
            // checks if any tables of size 6 can be removed from baseline allocation
            if (language.seatsReserved <= (language.seatsAvailable - 6)) {
              language.seatsAvailable -= 6;
              spareTablesOf6 ++;
              language.tablesOf6 --;
            }
          }

          seatLimit -= language.seatsReserved;
        } else {
          // If the language has a waitlist, wait to analyze its table allocation.
          waitlistQ.push(language);
        }
      });

      // Sort the waitlist queue from longest waitlist to shortest
      waitlistQ.sort(compare);

      while (waitlistQ.length > 0) {
        if (spareTablesOf8 !== 0) {
          waitlistQ[0].tablesOf8 ++;
          spareTablesOf8 --;
          waitlistQ[0].seatsAvailable += 8;

          // Remove 8 people from waitlist
          for (var i = 0; i < 8; i ++) {
            if (waitlistQ[0].waitlist.length !== 0) {
              var temp = waitlistQ[0].waitlist.shift();
              waitlistQ[0].guestlist.push(temp);
              waitlistQ[0].seatsReserved ++;

              waitlistToGuests.push({guestId: temp, language: waitlistQ[0].language});
            }
          }

          if (waitlistQ[0].waitlist.length === 0) {
            // copy to languages array
            var removed = waitlistQ.shift();
            var index = findIndexByKeyValue(languages, "language", removed.language);
            languages[index] = removed;
          } else {
            waitlistQ.sort(compare);
          }

        } else if (spareTablesOf6 !== 0) {
          waitlistQ[0].tablesOf6 ++;
          spareTablesOf6 --;
          waitlistQ[0].seatsAvailable += 6;

          // Remove 6 people from waitlist
          for (var i = 0; i < 6; i ++) {
            if (waitlistQ[0].waitlist.length !== 0) {
              var temp = waitlistQ[0].waitlist.shift();
              waitlistQ[0].guestlist.push(temp);
              waitlistQ[0].seatsReserved ++;

              waitlistToGuests.push({guestId: temp, language: waitlistQ[0].language});
            }
          }

          if (waitlistQ[0].waitlist.length === 0) {
            // copy to languages array
            var removed = waitlistQ.shift();
            var index = findIndexByKeyValue(languages, "language", removed.language);
            languages[index] = removed;
          } else {
            waitlistQ.sort(compare);
          }

        } else {
          var removed = waitlistQ.shift();
          var index = findIndexByKeyValue(languages, "language", removed.language);
          languages[index] = removed;
        }
      }
      console.log();
      console.log(languages);
      //TODO: delete these lines, they are just for testing waitlistToGuests functionality
      //waitlistToGuests.push({guestId: "00666666", language: 0});
      console.log("new guests: "+ waitlistToGuests);

      db.collection('dates').update(
        {date: tomorrow.utc().format()},
        {$set: {vacancy: languages}}
      );

      waitlistToGuests.forEach(function(newGuest, newGuestIndex) {
        db.collection('attendants').find({id: newGuest.guestId}, {email: 1}).toArray(function(err, result) {
          if (err) {
            throw err;
          }
          mail.sendNewGuests(result[0].email, newGuest.language, tomorrow);
        });
      });
  });
}

module.exports = {
  run: run
};
