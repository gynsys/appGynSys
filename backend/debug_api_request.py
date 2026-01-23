import requests

def test_api():
    url = "http://localhost:8000/api/v1/blog/my-posts"
    # We might need authentication headers if the endpoint is protected
    # But usually 500 errors happen before auth if it's a schema/import error.
    # If it's 401/403, that's different.
    
    # We'll try to login efficiently or just hit a public endpoint to see if the whole blog module is crashing.
    # Let's try the public one for the same doctor first, as it's easier to fail fast.
    # Assuming doctor id 4 is the one we saw in the logs (Dra. Mariel Herrera)
    # We need her slug. 'ciruga-ginecolgica...'
    # Let's try to hit the public doctor posts endpoint.
    
    # Actually, let's just hit the endpoint the user is having trouble with.
    # If it returns 401, then the server is UP and the 500 was likely due to the user being logged in 
    # and the code crashing inside the handler.
    
    print(f"Hitting {url}...")
    try:
        response = requests.get(url, headers={"Authorization": "Bearer YOUR_TOKEN_HERE"}) 
        # Without a real token, we expect 401. 
        # If we get 500 even without a token (unlikely for protected routes), or if the user can paste the token...
        
        # Better approach: hit a PUBLIC endpoint that uses the same Schemas.
        # "/api/v1/blog/public/{doctor_slug}"
        # We need a valid slug. From the previous output: "Dra. Mariel Herrera". 
        # We can guess the slug or query it.
        
        # Let's try to query the public endpoint which shouldn't require auth.
        slug = "dra-mariel-herrera" # Assumption based on name
        public_url = f"http://localhost:8000/api/v1/blog/public/{slug}"
        print(f"Also hitting public url: {public_url}")
        
        resp_public = requests.get(public_url)
        print(f"Public Status: {resp_public.status_code}")
        if resp_public.status_code == 500:
            print("Public Endpoint 500 Error Content:")
            print(resp_public.text[:1000])
        elif resp_public.status_code == 404:
            print("Doctor not found with that slug, trying to fetch doctor list...")
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_api()
