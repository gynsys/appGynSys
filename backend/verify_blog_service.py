
import sys
import os
import requests

# Assuming the server is running on localhost:8000
BASE_URL = "http://localhost:8000/api/v1"

def verify_blog_posts():
    try:
        # Fetch posts for mariel-herrera
        print("Fetching posts for mariel-herrera...")
        response = requests.get(f"{BASE_URL}/blog/public/mariel-herrera")
        
        if response.status_code != 200:
            print(f"FAILED: Status {response.status_code}")
            print(response.text)
            return

        posts = response.json()
        print(f"Found {len(posts)} posts.")
        
        if len(posts) > 0:
            first_post = posts[0]
            if 'is_service_content' in first_post:
                print(f"SUCCESS: 'is_service_content' field found. Value: {first_post['is_service_content']}")
            else:
                print("FAILED: 'is_service_content' field MISSING in response.")
                print("Keys found:", first_post.keys())
        else:
            print("No posts found to verify.")

    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    verify_blog_posts()
