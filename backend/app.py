import os
import json
import base64
from datetime import datetime, date 
from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud.firestore import FieldFilter

# Import Token Verification Middleware
from auth_middleware import verify_token

# Load environment variables
load_dotenv()

# ----------------------------------------------------------
# 1. Flask App and CORS Setup
# ----------------------------------------------------------

app = Flask(__name__)

# Reading CORS config for safer initialization
cors_origins_str = os.getenv("CORS_ORIGINS", "*")
# Handle both comma-separated and JSON array formats
if cors_origins_str.startswith('['):
    origins_list = json.loads(cors_origins_str)
else:
    origins_list = [origin.strip() for origin in cors_origins_str.split(',')]

CORS(app, resources={r"/api/*": {"origins": origins_list}})

# ----------------------------------------------------------
# 2. Firebase Admin SDK Initialization (Render Compatible)
# ----------------------------------------------------------

def initialize_firebase():
    """Initialize Firebase with support for both local and Render environments."""
    
    # Try Base64 credentials first (Render deployment)
    firebase_creds_base64 = os.getenv("FIREBASE_CREDENTIALS")
    
    if firebase_creds_base64:
        try:
            # Decode base64 credentials
            creds_json = base64.b64decode(firebase_creds_base64).decode('utf-8')
            creds_dict = json.loads(creds_json)
            cred = credentials.Certificate(creds_dict)
            firebase_admin.initialize_app(cred)
            print("✅ Firebase initialized with Base64 credentials (Render mode)")
            return firestore.client()
        except Exception as e:
            print(f"⚠️ Failed to initialize with Base64 credentials: {e}")
    
    # Fallback to local file (Local development)
    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "serviceAccountKey.json")
    
    if os.path.exists(credentials_path):
        try:
            cred = credentials.Certificate(credentials_path)
            firebase_admin.initialize_app(cred)
            print(f"✅ Firebase initialized with file: {credentials_path}")
            return firestore.client()
        except Exception as e:
            print(f"❌ Failed to initialize with file credentials: {e}")
            exit(1)
    else:
        print("❌ FATAL ERROR: No Firebase credentials found!")
        print("Please set FIREBASE_CREDENTIALS (base64) or provide serviceAccountKey.json")
        exit(1)

db = initialize_firebase()

# ----------------------------------------------------------
# 3. Basic & Secure Test Routes
# ----------------------------------------------------------

@app.route('/api/status', methods=['GET'])
def status():
    """Check if the API is running and connected to Firebase."""
    try:
        db_status = "Connected" if db else "Error: DB client missing"
    except Exception as e:
        db_status = f"Error: {e}"

    return jsonify({
        "status": "API Running",
        "service": "Near Dukaan Backend",
        "firebase_connection": db_status,
        "environment": os.getenv("FLASK_ENV", "production")
    })

@app.route('/api/secure/test', methods=['GET'])
@verify_token
def secure_test():
    """Protected route to verify token and return user information."""
    shopkeeper_email = request.user.get('email', 'N/A')

    return jsonify({
        "message": "Access Granted: You are successfully authenticated.",
        "user_id": request.user_id,
        "shop_id": request.shop_id,
        "email": shopkeeper_email,
        "token_payload_source": "Firebase Verified JWT"
    }), 200

# ----------------------------------------------------------
# 4. Customer Management API Routes (/api/customers)
# ----------------------------------------------------------

@app.route('/api/customers', methods=['POST'])
@verify_token
def add_customer():
    """Create a new customer profile."""
    data = request.get_json()
    shop_id = request.shop_id 

    if not data or 'name' not in data or 'phone' not in data:
        return jsonify({"error": "Missing customer name or phone."}), 400

    try:
        customers_ref = db.collection('customers')
        
        customer_data = {
            'shopId': shop_id,
            'name': data['name'],
            'phone': data['phone'],
            'due_balance': float(data.get('initialDue', 0.0)), 
            'total_spent': 0.0,
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
        }

        doc_ref = customers_ref.add(customer_data)
        
        return jsonify({
            "message": "Customer added successfully.",
            "customerId": doc_ref[1].id
        }), 201

    except Exception as e:
        print(f"Error adding customer: {e}")
        return jsonify({"error": "Internal server error."}), 500

@app.route('/api/customers', methods=['GET'])
@verify_token
def get_customers():
    """Retrieve all customer profiles."""
    shop_id = request.shop_id
    
    try:
        customers_stream = db.collection('customers').where(
            filter=FieldFilter('shopId', '==', shop_id)
        ).order_by('name').stream()
        
        customers_list = []
        for doc in customers_stream:
            customer = doc.to_dict()
            customer['id'] = doc.id
            customers_list.append(customer)
            
        return jsonify(customers_list), 200

    except Exception as e:
        print(f"Error retrieving customers: {e}")
        return jsonify({"error": "Internal server error."}), 500

@app.route('/api/customers/<customer_id>', methods=['GET', 'PUT', 'DELETE'])
@verify_token
def handle_customer_detail(customer_id):
    """Handle GET, PUT, and DELETE for a single customer."""
    shop_id = request.shop_id
    doc_ref = db.collection('customers').document(customer_id)
    doc = doc_ref.get()

    if not doc.exists:
        return jsonify({"error": "Customer not found."}), 404

    customer_existing = doc.to_dict()

    # Security Check
    if customer_existing.get('shopId') != shop_id:
        return jsonify({"error": "Unauthorized access."}), 403

    if request.method == 'GET':
        customer_existing['id'] = doc.id
        return jsonify(customer_existing), 200

    elif request.method == 'PUT':
        data = request.get_json()
        if not data:
            return jsonify({"error": "No update data provided."}), 400

        update_data = {'updatedAt': firestore.SERVER_TIMESTAMP}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'phone' in data:
            update_data['phone'] = data['phone']

        doc_ref.update(update_data)
        return jsonify({"message": "Customer updated successfully."}), 200

    elif request.method == 'DELETE':
        doc_ref.delete()
        return jsonify({"message": "Customer deleted successfully."}), 200

# ----------------------------------------------------------
# 5. Transaction Management API Routes (/api/transactions)
# ----------------------------------------------------------

@app.route('/api/transactions', methods=['POST'])
@verify_token
def add_transaction():
    """Records a new transaction and updates the customer's balance."""
    data = request.get_json()
    shop_id = request.shop_id

    if not data or 'customerId' not in data or 'totalAmount' not in data:
        return jsonify({"error": "Missing customer ID or amount."}), 400

    customer_id = data['customerId']
    total_amount = float(data['totalAmount'])
    payment_type = data.get('paymentType', 'credit')

    try:
        customer_ref = db.collection('customers').document(customer_id)
        customer_doc = customer_ref.get()

        if not customer_doc.exists or customer_doc.to_dict().get('shopId') != shop_id:
            return jsonify({"error": "Customer not found or unauthorized."}), 404

        # Prepare transaction data
        transaction_data = {
            'shopId': shop_id,
            'customerId': customer_id,
            'type': payment_type,
            'amount': total_amount,
            'items': data.get('items', []),
            'notes': data.get('notes', ''),
            'createdAt': firestore.SERVER_TIMESTAMP,
        }

        # Calculate balance change
        if payment_type == 'credit':
            balance_change = total_amount
        elif payment_type == 'payment':
            balance_change = -total_amount
        else:
            balance_change = 0

        # Firestore transactional safety
        @firestore.transactional
        def update_balance_transaction(transaction, customer_ref):
            snapshot = customer_ref.get(transaction=transaction)
            current_balance = snapshot.get('due_balance') or 0.0
            current_total_spent = snapshot.get('total_spent') or 0.0
            
            new_balance = current_balance + balance_change
            if payment_type != 'payment':
                new_total_spent = current_total_spent + total_amount
            else:
                new_total_spent = current_total_spent 
            
            transaction.update(customer_ref, {
                'due_balance': new_balance,
                'total_spent': new_total_spent,
                'updatedAt': firestore.SERVER_TIMESTAMP
            })

        update_balance_transaction(db.transaction(), customer_ref)
        db.collection('transactions').add(transaction_data)

        return jsonify({
            "message": "Transaction recorded successfully. Customer balance updated.",
            "type": payment_type
        }), 201

    except Exception as e:
        print(f"Error recording transaction: {e}")
        return jsonify({"error": "Internal server error during transaction."}), 500

@app.route('/api/transactions/<customer_id>', methods=['GET'])
@verify_token
def get_customer_transactions(customer_id):
    """Retrieve all transactions for a specific customer."""
    shop_id = request.shop_id

    try:
        transactions_stream = (
            db.collection('transactions')
            .where(filter=FieldFilter('shopId', '==', shop_id))
            .where(filter=FieldFilter('customerId', '==', customer_id))
            .order_by('createdAt', direction=firestore.Query.DESCENDING)
            .stream()
        )

        transactions_list = []
        for doc in transactions_stream:
            txn = doc.to_dict()
            txn['id'] = doc.id
            transactions_list.append(txn)

        return jsonify(transactions_list), 200

    except Exception as e:
        print(f"Error retrieving transactions: {e}")
        return jsonify({"error": "Internal server error."}), 500

# ----------------------------------------------------------
# 6. Inventory Management API Routes (/api/inventory)
# ----------------------------------------------------------

@app.route('/api/inventory', methods=['POST'])
@verify_token
def add_inventory_item():
    """Add a new item to the shopkeeper's inventory."""
    data = request.get_json()
    shop_id = request.shop_id

    if not data or 'name' not in data or 'quantity' not in data or 'sellingPrice' not in data:
        return jsonify({"error": "Missing item name, quantity, or selling price."}), 400

    try:
        inventory_data = {
            'shopId': shop_id,
            'name': data['name'],
            'quantity': int(data['quantity']),
            'unitCost': float(data.get('unitCost', 0.0)),
            'sellingPrice': float(data['sellingPrice']),
            'expiryDate': data.get('expiryDate', None),
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP,
        }

        doc_ref = db.collection('inventory').add(inventory_data)
        
        return jsonify({
            "message": "Inventory item added successfully.",
            "itemId": doc_ref[1].id
        }), 201

    except Exception as e:
        print(f"Error adding inventory item: {e}")
        return jsonify({"error": "Internal server error."}), 500

@app.route('/api/inventory', methods=['GET'])
@verify_token
def get_inventory_list():
    """Retrieve all inventory items for the shopkeeper."""
    shop_id = request.shop_id
    
    try:
        inventory_stream = db.collection('inventory').where(
            filter=FieldFilter('shopId', '==', shop_id)
        ).order_by('name').stream()
        
        items_list = []
        for doc in inventory_stream:
            item = doc.to_dict()
            item['id'] = doc.id
            items_list.append(item)
            
        return jsonify(items_list), 200

    except Exception as e:
        print(f"Error retrieving inventory: {e}")
        return jsonify({"error": "Internal server error."}), 500

@app.route('/api/inventory/<item_id>', methods=['GET', 'PUT', 'DELETE'])
@verify_token
def handle_inventory_detail(item_id):
    """Handle GET, PUT, and DELETE for a single inventory item."""
    shop_id = request.shop_id
    doc_ref = db.collection('inventory').document(item_id)
    doc = doc_ref.get()

    if not doc.exists:
        return jsonify({"error": "Inventory item not found."}), 404

    item_existing = doc.to_dict()

    if item_existing.get('shopId') != shop_id:
        return jsonify({"error": "Unauthorized access."}), 403

    if request.method == 'GET':
        item_existing['id'] = doc.id
        return jsonify(item_existing), 200

    elif request.method == 'PUT':
        data = request.get_json()
        if not data:
            return jsonify({"error": "No update data provided."}), 400

        update_data = {'updatedAt': firestore.SERVER_TIMESTAMP}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'quantity' in data:
            update_data['quantity'] = int(data['quantity'])
        if 'sellingPrice' in data:
            update_data['sellingPrice'] = float(data['sellingPrice'])
        if 'unitCost' in data:
            update_data['unitCost'] = float(data['unitCost'])
        if 'expiryDate' in data:
            update_data['expiryDate'] = data['expiryDate']

        doc_ref.update(update_data)
        return jsonify({"message": "Inventory item updated successfully."}), 200

    elif request.method == 'DELETE':
        doc_ref.delete()
        return jsonify({"message": "Inventory item deleted successfully."}), 200

# ----------------------------------------------------------
# 7. Analytics & Dashboard Metrics
# ----------------------------------------------------------

@app.route('/api/dashboard/metrics', methods=['GET'])
@verify_token
def get_dashboard_metrics():
    """Calculates and returns key metrics for the dashboard."""
    shop_id = request.shop_id
    
    try:
        # Total Outstanding Dues & Active Customer Count
        customers_ref = db.collection('customers')
        customers_stream = customers_ref.where(
            filter=FieldFilter('shopId', '==', shop_id)
        ).stream()
        
        total_dues = 0.0
        active_customers = 0
        
        for doc in customers_stream:
            customer = doc.to_dict()
            active_customers += 1
            total_dues += customer.get('due_balance', 0.0)

        # Inventory Alerts
        inventory_ref = db.collection('inventory')
        inventory_stream = inventory_ref.where(
            filter=FieldFilter('shopId', '==', shop_id)
        ).stream()

        low_stock_count = 0
        expiry_alert_count = 0
        
        for doc in inventory_stream:
            item = doc.to_dict()
            quantity = item.get('quantity', 0)
            
            if quantity < 10:
                low_stock_count += 1
            
            expiry_date_str = item.get('expiryDate')
            if expiry_date_str:
                try:
                    expiry_date = datetime.strptime(expiry_date_str, '%Y-%m-%d').date()
                    today = date.today()
                    days_until_expiry = (expiry_date - today).days
                    
                    if 0 <= days_until_expiry <= 30:
                        expiry_alert_count += 1
                except ValueError:
                    pass

        metrics = {
            "totalOutstandingDues": round(total_dues, 2),
            "activeCustomerCount": active_customers,
            "itemsLowInStock": low_stock_count,
            "expiryAlerts": expiry_alert_count
        }

        return jsonify(metrics), 200

    except Exception as e:
        print(f"Error retrieving dashboard metrics: {e}")
        return jsonify({"error": "Internal server error during analytics."}), 500

# ----------------------------------------------------------
# 8. Health Check for Render
# ----------------------------------------------------------

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for Render."""
    return jsonify({"status": "healthy"}), 200

# ----------------------------------------------------------
# 9. Main Execution
# ----------------------------------------------------------

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=False)