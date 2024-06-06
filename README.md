# Headshot Haven

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Overview
Headshot Haven is a web application designed to help users improve their aiming skills through various interactive games and tools. The platform includes features like aim training, CPS (Clicks Per Second) tests, leaderboards, and more.

## Features
- Aim Training Module
- CPS Game and Leaderboard
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
(Add screenshots of your application here)

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

## License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact
- **Name:** Your Name
- **Email:** your-email@example.com
- **GitHub:** [your-username](https://github.com/your-username)
