from functools import wraps
from flask import request, jsonify
from firebase_admin import auth, exceptions

# Function to extract token from the Authorization header
def get_token_from_header(request):
    """Extracts the JWT from the Authorization header."""
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        # Format is typically "Bearer <token>"
        return auth_header.split(' ')[1]
    return None

def verify_token(f):
    """
    Decorator that verifies the Firebase ID Token (JWT) sent in the request header.
    If valid, it adds the decoded token (user info) to the request object.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = get_token_from_header(request)

        if not token:
            return jsonify({
                "error": "Authorization token missing or invalid format."
            }), 401

        try:
            # Verify the token using the Firebase Admin SDK
            # This checks signature, expiry, and audience.
            decoded_token = auth.verify_id_token(token)
            
            # Add the decoded token/user info to the request object for later use
            request.user = decoded_token
            request.user_id = decoded_token.get('uid')
            request.shop_id = decoded_token.get('uid') # Assuming shopkeeper UID is the shop ID

        except exceptions.FirebaseError as e:
            # Handle common token errors (expired, invalid signature, revoked)
            print(f"Token verification failed: {e}")
            return jsonify({
                "error": "Invalid or expired authorization token."
            }), 403
        except Exception as e:
            print(f"An unexpected error occurred during token verification: {e}")
            return jsonify({
                "error": "Authentication failed due to a server error."
            }), 500

        # If verification is successful, proceed to the original route function
        return f(*args, **kwargs)

    return decorated_function