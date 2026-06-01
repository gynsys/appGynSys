import requests

# Login to get token
login_data = {
    "username": "endogen@example.com",
    "password": "hashed_password" # I don't know the password... wait, I can just query the DB for the error.
}
