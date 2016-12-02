**If this is your first time running**

  npm install -g gulp
  mkdir ./db

**delete ./node_modules & ./client/node_modules & install node packages in ./ and ./client**

  npm install

**Ensure you have a .env file**

  get it from a homie

**to start the server, initialize mongodb with fresh test data, and webpack the front end**

  gulp start-fresh

**to start the server, start mongodb with existing, and webpack the front end**

  gulp start

**to check how values update in the database, run the following commands in a
separate terminal window from the top directory (../language-tables-app):**

  mongo
  *once the mongo shell starts, connect to the 'lt' database*
  use lt

  *to check values in 'attendants' collection, run:*
  db.attendants.find().pretty()
  *to check values in 'dates' collection, run:*
  db.dates.find().pretty()
