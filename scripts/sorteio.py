import random
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db
from datetime import datetime
import time

class FirebaseDatabase:
    def __init__(self):
        cred = credentials.Certificate('firebase.json')
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://antoniofilho-ef6a2-default-rtdb.firebaseio.com/'
        })
        self.ref = db.reference()

    def read_data(self, path):
        return self.ref.child(path).get()

    def write_data(self, path, data):
        self.ref.child(path).push(data).key
        
    def set_data(self, path, data):
        self.ref.child(path).set(data)

    def update_data(self, path, data):
        self.ref.child(path).update(data)


def perform_sorteio(firebase_db, productKey):
                
    sales = firebase_db.read_data('sales')
    
    # List to store all numbers
    all_numbers = []
    quantidade_numeros_cotas = 6

    # Collect all cotas and append them to the list
    for sale in sales.values():    
        if sale['productKey'] != productKey:
            continue            
        quantidade_numeros_cotas = sale['qtdNCota']
        cotas = sale['cotas'].split(', ')
        all_numbers.extend(cotas)

    # Convert numbers to integers
    all_numbers = list(map(int, all_numbers))

    # Perform the weighted draw
    winner_number = random.choice(all_numbers)
    winner_name = ''
    
    print(f"O número vencedor é {winner_number}.")

    # Find the winner's CPF
    for sale in sales.values():
        
            # Check if 'status' key exists in the sale
        if 'status' in sale:
            print('Ignoring sale with status:', sale['status'])
            continue
    
        cotas = list(map(int, sale['cotas'].split(', ')))
        
        if winner_number in cotas:
            winner_cpf = sale['cpf']
            winner_name = sale['name']
            break
        
    # Check if a winner was found
    if not winner_name:
        print("Não foi possível encontrar um vencedor.")
        return

    # Check how many shares of this product the user has purchased
    user_cotas = cotas.count(winner_number)

    # Calculate the number of shares the user has
    user_cotas = quantidade_numeros_cotas * cotas.count(winner_number)

    print(f"O número vencedor é {winner_number}, ganhador: {winner_name} pertencente ao CPF {winner_cpf}.")
    print(f"O usuário comprou {user_cotas} cotas desse produto.")

    # Get the current date and time
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # Update the sales to 'Finalizado' and add the draw time
    for key, sale in sales.items():
        if sale['productKey'] == productKey:
            sale['status'] = 'Finalizado'
            sale['tempo_sorteio'] = current_time
            firebase_db.update_data(f'sales/{key}', sale)
            
            # Write the winner to the database
            winner = {
                'cpf': winner_cpf,
                'name': winner_name,
                'productKey': productKey,
                'winner_number': winner_number,
                'winner_cotas': user_cotas,
                'time': current_time
            }
            
            # Check if 'winner' key exists in the database
            if 'winner' in firebase_db.read_data(f'cards/{productKey}'):
                # Append the winner to the existing array
                firebase_db.update_data(f'cards/{productKey}/winner', winner)
            else:
                # Create a new array with the winner
                firebase_db.set_data(f'cards/{productKey}/winner', [winner])
            
            # Set the product status as 'used'
            firebase_db.update_data(f'cards/{productKey}', {'status': 'Finalizado', 'datetime': current_time})
    return winner
                
                
def main():
    firebase_db = FirebaseDatabase()
    
    while True:
        # Perform the sorteio (draw) for a specific product key
        # Create an instance of the FirebaseDatabase class
        
        sorteios = firebase_db.read_data('sorteios')
        
        if sorteios is None:
            print("No sorteios found.")
            time.sleep(60)  # Wait for 1 minute before performing the next sorteio
            continue
        
        print("Performing sorteio...")
        
        # Find a sorteio with non-existent status
        for key, sorteio in sorteios.items():
            
            if 'status' not in sorteio:
                print(f"Performing sorteio for product key: {key}")
                print(sorteio)
                
                winner = perform_sorteio(firebase_db, sorteio.get('productKey'))                
                firebase_db.update_data(f'sorteios/{key}', {'status': 'Finalizado', 'winner': winner})
                
                break
        
        print("Waiting for 1 minute before performing the next sorteio...")
        time.sleep(60)  # Wait for 1 minute before performing the next sorteio


if __name__ == "__main__":
    main()
        