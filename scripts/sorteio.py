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


def perform_sorteio(firebase_db, productKey, sorteioKey):
                
    sales = firebase_db.read_data('sales')
                
    # List to store all numbers
    all_numbers = []
    quantidade_numeros_cotas = 6

    # Collect all cotas and append them to the list
    for sale in sales.values():    
        if sale['productKey'] != productKey:
            continue            
        quantidade_numeros_cotas = sale['qtdNCota']
        if 'cotas' in sale:
            cotas = sale['cotas'].split(', ')
            all_numbers.extend(cotas)
            
    print('productKey', productKey)

    if not all_numbers:
        print("Nenhum número encontrado.")
        firebase_db.write_data('sorteios_logs/'+sorteioKey, {'msg': 'Nenhum número encontrado.', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
        return

    # Convert numbers to integers
    all_numbers = list(map(int, all_numbers))
    firebase_db.write_data('sorteios_logs/'+sorteioKey, {'msg': f'Quantidade de números por cota: {quantidade_numeros_cotas}', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})

    # Perform the weighted draw
    winner_number = random.choice(all_numbers)
    winner_name = ''
    
    print(f"O número vencedor é {winner_number}.")
    firebase_db.write_data('sorteios_logs/'+sorteioKey, {'msg': f'O número vencedor é {winner_number}.', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})

    # Find the winner's CPF
    for sale in sales.values():
                                   
        if 'status' in sale and sale['status'] == 'Finalizado':
            print('Ignoring sale with status:', sale['status'])
            continue
    
        if sale['productKey'] != productKey:
            print('Ignoring sale with productKey:', sale['productKey'])
            continue
        
        if 'cotas' not in sale:
            print('Ignoring sale without cotas:', sale)
            continue
        
        
        cotas = list(map(int, sale['cotas'].split(', ')))                
        
        print(f"Venda de {sale['name']} tem os números: {cotas}")
        firebase_db.write_data('sorteios_logs/'+sorteioKey, {'msg': f"Venda de {sale['name']} tem os números: {cotas}", 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
        
        if winner_number in cotas:
            winner_cpf = sale['cpf']
            winner_name = sale['name']
            break
        
    # Check if a winner was found
    if not winner_name:
        print("Não foi possível encontrar um vencedor.")
        firebase_db.write_data('sorteios_logs/'+sorteioKey, {'msg': 'Não foi possível encontrar um vencedor.', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
        return
    else:
        print("Vencedor encontrado!")
        firebase_db.write_data('sorteios_logs/'+sorteioKey, {'msg': 'Vencedor encontrado!', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})

    # Check how many shares of this product the user has purchased
    user_cotas = cotas.__len__()


    print(f"O número vencedor é {winner_number}, ganhador: {winner_name} pertencente ao CPF {winner_cpf}.")
    print(f"O usuário comprou {user_cotas} cotas desse produto.")
    
    firebase_db.write_data('sorteios_logs/'+sorteioKey, {'msg': f"O número vencedor é {winner_number}, ganhador: {winner_name} pertencente ao CPF {winner_cpf}.", 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})

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
            time.sleep(10)  # Wait for 1 minute before performing the next sorteio
            continue
        
        print("Performing sorteio...")
        
        # Find a sorteio with non-existent status
        for key, sorteio in sorteios.items():
            
            if 'status' not in sorteio:
                # firebase_db.update_data(f'sorteios/{key}', {'status': 'Em andamento'})
                firebase_db.write_data('sorteios_logs/'+key, {'msg': 'Sorteio iniciado', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
                
                winner = perform_sorteio(firebase_db, sorteio.get('productKey'), key)  
                print("Sorteio finalizado.", key, winner)    
                                
                firebase_db.update_data('sorteios/'+key, {'msg': 'Sorteio finalizado', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 'status': 'Finalizado', 'winner': winner})
                firebase_db.write_data('sorteios_logs/'+key, {'msg': 'Sorteio finalizado', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 'winner': winner})
                
                break
        
        print("Waiting for 10 seconds  before performing the next sorteio...")
        time.sleep(10)  


if __name__ == "__main__":
    main()
        