# Mijlasna 

Hajz is a booking website for pools and majlis in Bahrain. We made it because most people book pools and majlis through whatsapp and its really messy, you dont know if the day is free or not and the owner have to keep track of everything by himself. So we wanted to make one place where customers can find a venue and book it and the owners can manage there bookings.

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


## ERD

## Routes

| Method | Route | What it does |
|---|---|---|
| POST | /api/auth/register | sign up |
| POST | /api/auth/login | login |
| GET | /api/venues | get all venues |
| GET | /api/venues/:id | get one venue |
| POST | /api/venues | add venue (owner) |
| PUT | /api/venues/:id | edit venue (owner) |
| DELETE | /api/venues/:id | delete venue (owner) |
| POST | /api/bookings | make a booking |
| GET | /api/bookings/mine | customer bookings |
| GET | /api/bookings/owner | owner bookings |
| PATCH | /api/bookings/:id/status | accept or reject booking |
| POST | /api/venues/:id/blocked | block a date |
| POST | /api/reviews | add review |


## Team

- Ahmed Qamber
- Komail Aljanabi
- Mahdi Salman 

## Future Plans


- Add arabic language