# <a href="https://headshot-haven.co.uk" target="_blank">Headshot Haven</a>

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [Contact](#contact)

## Overview
Headshot Haven is a web application designed to help users improve their aiming skills through various interactive games and tools. The platform includes features like aim training, CPS (Clicks Per Second) tests, leaderboards, and more.

## Features
- Aim Training Game
- CPS Game
- Reaction Speed Game
- Weapon Specifications
- Roulette Game
- User Authentication (Sign Up/Sign In)
- Admin Panel for managing users and scores

## Technologies Used 
- **Frontend:**
  - HTML
  - CSS (Bootstrap)
  - JavaScript
- **Backend:**
  - PHP
  - MySQL/PHPmyAdmin
  - Node.js
- **Other:**
  - Apache (Web Server)

## Installation
To set up the project locally, follow these steps:

1. **Clone the repository:**
    ```bash
    git clone https://github.com/Abdi-Suufi/Headshot-Haven.git
    ```
2. **Navigate to the project directory:**
    ```bash
    cd headshot-haven
    ```
3. **Set up the database:**
    - Import the provided SQL script (`database.sql`) into your MySQL database.
    - Update the database connection details in `database.php` if needed.

4. **Start the server:**
    - Ensure you have PHP and Apache installed. You can use Laragon, XAMPP or even get extension if you're using VSC. Paste 'brapifra.phpserver' into VSC extensions and it should allow you to serve your project a server.
    - If you are using Laragon or XAMPP, place the project folder in your Apache server's root directory. h2docs for XAMPP and WWW for Laragon.
    - Start the Apache server.

## Usage
1. **Access the application:**
   Open your web browser and navigate to `http://localhost:3000/index.php`. Make sure you're using the right port. Usually 3000 8080 or 5500.

2. **Sign up or log in:**
   - Create a new user account or log in with existing credentials.
   - For admin, login with username: admin and password: admin and make sure to tick the admin box.

3. **Use the features:**
   - Navigate through the application using the navigation bar.
   - Play the aim training games, check the leaderboards, and explore other features.

## Screenshots
### Header Section:
![image](https://github.com/Abdi-Suufi/Headshot-Haven/assets/93520190/01741025-005f-44f2-b7c2-624bbeeeb152)

### Aim-training Section:
![image](https://github.com/Abdi-Suufi/Headshot-Haven/assets/93520190/eae04a5c-349d-469e-a530-a37a8fe2e8ec)

### Aim-training Leaderboard Section:
![image](https://github.com/Abdi-Suufi/Headshot-Haven/assets/93520190/756c66f5-ddb0-4fdb-8a9e-8b8dcc5a5060)

### Cps Section:
![image](https://github.com/Abdi-Suufi/Headshot-Haven/assets/93520190/368b6a6c-9e7b-4e3d-b217-5e81979edf2e)

### Cps leaderboard Section:
![image](https://github.com/Abdi-Suufi/Headshot-Haven/assets/93520190/9992272a-9a09-43a9-9540-e86958a81837)

### Reaction Speed Section:
![image](https://github.com/Abdi-Suufi/Headshot-Haven/assets/93520190/026e6d50-7da4-43da-afe6-55ac82566b4f)

### Reaction Leaderboard:
![image](https://github.com/Abdi-Suufi/Headshot-Haven/assets/93520190/2ddafa34-1d63-4333-a396-e7767c6a7655)

### Weapon Specification Section:
![image](https://github.com/Abdi-Suufi/Headshot-Haven/assets/93520190/33ace2f1-97a3-4f0a-8300-3618f19ce9f2)

### Roulette Section:
![image](https://github.com/Abdi-Suufi/Headshot-Haven/assets/93520190/12c87ba3-e607-4426-80b3-0d3addfce43d)

### Signin Page:
![image](https://github.com/Abdi-Suufi/Headshot-Haven/assets/93520190/39c43a14-871a-43a5-ba92-c02fd92d763b)

### Signup Page:
![image](https://github.com/Abdi-Suufi/Headshot-Haven/assets/93520190/17dbca5e-c539-4f1f-8b8c-654ce402bd6a)

### Admin Page:
![image](https://github.com/Abdi-Suufi/Headshot-Haven/assets/93520190/5f951787-72bb-4830-82e3-5804d323b2d0)

## Contributing
If you would like to contribute to this project, please follow these steps:

1. **Fork the repository.**
2. **Create a new branch:**
    ```bash
    git checkout -b feature/your-feature-name
    ```
3. **Make your changes and commit them:**
    ```bash
    git commit -m 'Add some feature'
    ```
4. **Push to the branch:**
    ```bash
    git push origin feature/your-feature-name
    ```
5. **Create a pull request.**

## Contact
- **Name:** Abdi Rahman Suufi
- **Email:** abdisuufi123@gmail.com
- **GitHub:** [Abdi-Suufi](https://github.com/Abdi-Suufi)
