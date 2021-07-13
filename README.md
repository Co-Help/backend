![Logo](https://avatars.githubusercontent.com/u/84613367?s=200&v=4)

# Co-Help Backend

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

```
PORT=5000
CLIENT_ID=<GOOGLE_OAUTH2_WEB_APP_CLIENT_ID>
ANDROID_CLIENT_ID=<GOOGLE_OAUTH2_ANDROID_APP_CLIENT_ID if you have otherwise put dummy>
CLIENT_SECRET=<GOOGLE_OAUTH2_WEB_APP_CLIENT_SECRET>
DB_URI=<MONGODB_URI>
ACCESS_TOKEN_SECRET=<ACCESS_TOKEN_SECRET>
REFRESH_TOKEN_SECRET=<REFRESH_TOKEN_SECRET>
USER_COLLECTION=users
NOTIFICATION_COLLECTION=notifications
APPOINTMENT_COLLECTION=appointments
BED_PROVIDE_COLLECTION=bed_provides
EMERGENCY_PROVIDE_COLLECTION=emergency_provides
BLOOD_PROVIDE_COLLECTION=blood_provides
BLOOD_TEST_COLLECTION=blood_tests
ORG_COLLECTION=orgs
OXYGEN_COLLECTION=oxygens
VACCINE_COLLECTION=vaccines
APPLICATION_COLLECTION=pendings
CONFIG_COLLECTION=configs

MAIL_USERNAME=<GMAIL_USERNAME make sure to turn off secure login from google account>
MAIL_PASSWORD=<GMAIL_PASSWORD>
CLIENT_REFRESH_TOKEN=xx
CLIENT_ACCESS_TOKEN=xx
JAGUAR_TOKEN_SECRET=xx
```

## Run Locally

Clone the project

```bash
  git clone https://github.com/Co-Help/backend.git co-help-backend
```

Go to the project directory

```bash
  cd co-help-backend
```

Install dependencies

```bash
  npm i
```

Start the server

```bash
  npm run start
```

## Tech Stack

**Client:** React, Redux, Chakra UI

**Server:** Node, Express, MongoDB
