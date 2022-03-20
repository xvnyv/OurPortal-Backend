# OurPortal Backend

Frontend code: https://github.com/shohamc1/OurPortal

A module bidding solution for SUTD as part of the 50.003 course in Spring 2021.

This application includes:
- Authentication using SUTD credentials with email verification during sign up
- Module searching
- Module enrollment, with capabilities to handle load spikes during bidding days
- Peer-to-peer module trading option
- Automated module trading option using the Blossom algorithm
- Email notification of trading results
- Exporting list of students enrolled in each module to CSV

Error handling was included to prevent malicious acts such as:
- Attempting to sign up with a non-SUTD email
- Attempting to use another student's SUTD email to sign up
- Attemping to enrol in modules before the bidding period has begun
- Deleting HTML nodes of error bubbles to access underlying content
- Spamming trade requests to multiple students

Testing was carried out using the following tools:
- Backend unit tests: Jest
- Frontend unit tests: Jest
- End-to-End tests: Cypress
- Load tests: k6

Backend was deployed using Google Cloud Functions.

Video recordings of the application that were used for our demo can be found here: https://drive.google.com/drive/folders/1OqVNjJVsC7jQbphgXPNBIVzMNoDC2R6E
