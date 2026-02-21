import requests
import time
import uuid

BACKEND_URL = "http://localhost:8000"
GATEWAY_URL = "http://localhost:8001"

def test_full_flow():
    email = f"test_order_{uuid.uuid4().hex[:6]}@example.com"
    password = "password123"
    
    print(f"--- Step 1: Registering User {email} ---")
    reg_data = {
        "email": email,
        "password": password,
        "full_name": "Test Order User",
        "phone": "9876543210",
        "shipping_address": "123 Test Street, Order City, 560001"
    }
    try:
        res = requests.post(f"{BACKEND_URL}/auth/register", json=reg_data)
        if res.status_code != 200:
            print(f"Registration failed: {res.text}")
            return
        print("Registration successful.")
    except Exception as e:
        print(f"Error during registration: {e}")
        return

    print("\n--- Step 2: Logging In ---")
    login_data = {"username": email, "password": password}
    try:
        res = requests.post(f"{BACKEND_URL}/auth/token", data=login_data)
        if res.status_code != 200:
            print(f"Login failed: {res.text}")
            return
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        print("Login successful.")
    except Exception as e:
        print(f"Error during login: {e}")
        return

    print("\n--- Step 3: Placing Order ---")
    order_data = {
        "total_amount": 299.0,
        "items": [
            {
                "product_id": 1,
                "product_name": "Eco Leaf Plate Small",
                "quantity": 2,
                "price": 149.5
            }
        ]
    }
    try:
        res = requests.post(f"{BACKEND_URL}/orders/", json=order_data, headers=headers)
        if res.status_code != 200:
            print(f"Order placement failed: {res.text}")
            # Check if it's the missing details error (shouldn't be since we registered with them)
            return
        
        order_res = res.json()
        print(f"Order placed. Order ID: {order_res.get('order_id')}")
        
        payment_url = order_res.get("payment_url")
        if payment_url:
            print(f"Payment URL received: {payment_url}")
            if payment_url.startswith(GATEWAY_URL):
                print("SUCCESS: Payment URL correctly points to the Payment Gateway.")
            else:
                print(f"WARNING: Payment URL {payment_url} does not match expected gateway {GATEWAY_URL}")
        else:
            print(f"Order Response: {order_res}")
            print("FAILURE: No payment URL received. Is the Payment Gateway running?")
            
    except Exception as e:
        print(f"Error during order placement: {e}")

if __name__ == "__main__":
    test_full_flow()
