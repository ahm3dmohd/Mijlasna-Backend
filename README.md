# Mijlasna 

Mijlasna is a booking website for pools and majlis in Bahrain. We made it because most people book pools and majlis through whatsapp and its really messy, you dont know if the day is free or not and the owner have to keep track of everything by himself. So we wanted to make one place where customers can find a venue and book it and the owners can manage there bookings.

This is our project 3 for General Assembly and its made using the MERN stack.

## Features

- Sign up and login
- There is 3 types of users customer, owner and admin
- Owners can add there venues (pool or majlis) and edit or delete them
- Customers can see all the venues and book a date
- Owner can accept or reject the booking
- Owner can block dates if the venue is not available
- You cant book a date that is already booked
- Customers can leave a review after the booking is done

## User Stories

Customer

- As a customer i want to sign up and login so i can book venues
- As a customer i want to see all the pools and majlis so i can choose one
- As a customer i want to see the details and pictures of the venue
- As a customer i want to see which dates are free so i dont book a day thats taken
- As a customer i want to book a venue on a date
- As a customer i want to see my bookings and if they got accepted or not
- As a customer i want to cancel my booking if my plans change
- As a customer i want to leave a review after i go to the venue

Owner

- As a owner i want to add my venue with pictures and price
- As a owner i want to edit or delete my venue
- As a owner i want to see all the bookings for my venues
- As a owner i want to accept or reject bookings
- As a owner i want to block dates when my venue is not available

Admin

- As a admin i want to see all users and venues
- As a admin i want to delete fake venues or users

## Technologies Used

- MongoDB
- Express
- React
- Node.js

## Screenshots

Landing page for visitors who are not signed in

![Landing page](Screenshot%202026-11-14%20165222.png)

Home page after signing in, with the welcome message and the owner links in the navbar

![Home page signed in](Screenshot%202026-11-14%20164706.png)

All the venues

![Venues page](Screenshot%202026-11-14%20164850.png)

Venue details with the venue image and the book, edit and delete buttons

![Venue details](Screenshot%202026-11-14%20165044.png)

Booking details after the deposit is paid, now the cancel button shows

![Booking details](Screenshot%202026-11-14%20165140.png)

## Routes

### Backend routes

The backend runs on port 3000 by default. Every route except the public ones needs the token in the Authorization header.

| Method | Route | What it does | Who can use it |
|---|---|---|---|
| POST | /auth/sign-up | sign up as a customer or an owner | everyone |
| POST | /auth/sign-in | sign in and get a token | everyone |
| GET | /users/me | get my profile | signed in |
| PUT | /users/me | edit my profile, the password is optional | signed in |
| DELETE | /users/me | delete my account and everything that belongs to it | signed in |
| GET | /users | get all users | admin |
| GET | /users/:id | get one user | admin |
| PUT | /users/:id | edit a user and his role | admin |
| DELETE | /users/:id | delete a user | admin |
| GET | /venues | get all venues | everyone |
| GET | /venues/:id | get one venue | everyone |
| POST | /venues | add a venue with one image | owner, admin |
| PUT | /venues/:id | edit a venue and replace its image | the venue owner, admin |
| DELETE | /venues/:id | delete a venue | the venue owner, admin |
| POST | /venues/:id/booking | book a venue, blocked or taken dates are refused | signed in |
| GET | /venues/:id/reviews | get the reviews of a venue | everyone |
| POST | /venues/:id/reviews | add a review | signed in |
| DELETE | /venues/:id/reviews/:rid | delete a review | the review writer, the venue owner, admin |
| GET | /venues/:id/blocked-dates | get the blocked dates of a venue | everyone |
| POST | /venues/:id/blocked-dates | block a date | the venue owner, admin |
| PUT | /venues/:id/blocked-dates/:blockedId | edit a blocked date | the venue owner, admin |
| DELETE | /venues/:id/blocked-dates/:blockedId | delete a blocked date | the venue owner, admin |
| GET | /bookings | get my bookings, the admin gets all of them | signed in |
| GET | /bookings/owner | get the bookings made on my venues | owner |
| GET | /bookings/:id | get one booking | the customer, the venue owner, admin |
| POST | /bookings/:id/checkout | pay the deposit | the customer |
| PUT | /bookings/:id/status | change the status of a booking | owner: confirmed, rejected, completed. customer: cancelled. admin: any |
| PUT | /bookings/:id | edit the date, time or notes | the customer, the venue owner, admin |
| DELETE | /bookings/:id | delete a booking | the customer, the venue owner, admin |

### Frontend routes

| Route | Page | Who can see it |
|---|---|---|
| / | Home page | everyone |
| /sign-up | Sign up | visitors, signed in users go to the dashboard |
| /sign-in | Sign in | visitors, signed in users go to the dashboard |
| /venues | All venues | everyone |
| /venues/new | Create a venue | owner, admin |
| /venues/:id | Venue details, blocked dates and reviews | everyone |
| /venues/:id/edit | Edit a venue and its image | the venue owner, admin |
| /venues/:id/blocked-dates/new | Add a blocked date | the venue owner, admin |
| /venues/:id/blocked-dates/:bid/edit | Edit a blocked date | the venue owner, admin |
| /venues/:id/book | Book a venue | signed in |
| /dashboard | Dashboard | signed in |
| /me | My profile | signed in |
| /me/edit | Edit my profile and password, you sign in again after saving | signed in |
| /bookings | My bookings | signed in |
| /bookings/:id | Booking details with checkout and cancel | signed in |
| /bookings/:id/edit | Edit a booking | signed in |
| /owner/bookings | Bookings on my venues, change their status or delete them | owner |
| /users | Manage users | admin |
| /users/:id | User details with edit and delete | admin |
| /users/:id/edit | Edit a user | admin |

## Team

- Ahmed Qamber
- Komail Aljanabi
- Mahdi Salman 

## Future Plans

- Add arabic language
- Online payment for the deposit (Benefit Pay or card) instead of just marking the booking as paid
- Send an email or whatsapp message to the customer when the owner accepts, rejects or completes the booking
