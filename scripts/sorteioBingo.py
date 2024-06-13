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

def perform_bingo_draw(firebase_db, productKey, drawKey):
    # Read product details
    product = firebase_db.read_data(f'cards/{productKey}')
    if not product:
        print(f"Produto com key {productKey} não encontrado.")
        firebase_db.write_data('bingo_logs/' + drawKey, {'msg': f'Produto com key {productKey} não encontrado.', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
        return

    number_min = product.get('numberMin', 1)
    number_max = product.get('numberMax', 75)
    total_numbers = product.get('totalNumbers', 24)  # Assuming default of 24 numbers per bingo card

    print(f"Sorteando para o produto {productKey} com números de {number_min} a {number_max} e {total_numbers} números por cartela.")

    sales = firebase_db.read_data('sales')

    # List to store all bingo cards
    bingo_cards = []

    # Collect all bingo cards
    for sale in sales.values():
        if sale['productKey'] != productKey:
            continue
            
        if 'cotas' in sale:
            card = list(map(int, sale['cotas'].split(', ')))
            bingo_cards.append({
                'card': card,
                'name': sale['name'],
                'cpf': sale['cpf']
            })

    if not bingo_cards:
        print("Nenhuma cartela encontrada para o produto.")
        firebase_db.write_data('bingo_logs/' + drawKey, {'msg': 'Nenhuma cartela encontrada para o produto.', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
        return

    # Generate drawn numbers until we find a winner
    drawn_numbers = set()
    winner = None
    start_time = datetime.now()

    while not winner and len(drawn_numbers) < (number_max - number_min + 1):
        new_number = random.randint(number_min, number_max)
        drawn_numbers.add(new_number)

        print(f"Sorteando número {new_number}...")        
        
        # Check each card to see if we have a winner
        for card_info in bingo_cards:
            if set(card_info['card']).issubset(drawn_numbers):
                winner = card_info
                print(f"Vencedor encontrado: {winner['name']} com o CPF {winner['cpf']}.")
                break

    if winner:
        winner_name = winner['name']
        winner_cpf = winner['cpf']

        print(f"O vencedor é {winner_name} com o CPF {winner_cpf}.")

        firebase_db.write_data('bingo_logs/' + drawKey, {'msg': f'O vencedor é {winner_name} com o CPF {winner_cpf}.', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
        
        # Update sales and draw status
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        for key, sale in sales.items():
            if sale['productKey'] == productKey:
                sale['status'] = 'Finalizado'
                sale['tempo_sorteio'] = current_time
                firebase_db.update_data(f'sales/{key}', sale)
        
        # Write the winner to the database
        winner_data = {
            'cpf': winner_cpf,
            'name': winner_name,
            'productKey': productKey,
            'drawn_numbers': list(drawn_numbers),
            'time': current_time
        }
        firebase_db.set_data(f'cards/{productKey}/winner', winner_data)
        firebase_db.update_data(f'cards/{productKey}', {'status': 'Finalizado', 'datetime': current_time})

        return len(drawn_numbers), datetime.now() - start_time
    else:
        print("Nenhum vencedor encontrado.")
        firebase_db.write_data('bingo_logs/' + drawKey, {'msg': 'Nenhum vencedor encontrado.', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})
        return 0, datetime.now() - start_time
        

def main():
    firebase_db = FirebaseDatabase()

    while True:

        draws = firebase_db.read_data('sorteios')

        if draws is None:
            print("Nenhum sorteio encontrado.")
            time.sleep(10)
            continue

        print("Realizando sorteio...")

        for key, draw in draws.items():
            if 'status' not in draw:

                print(f"Iniciando sorteio para o produto {draw.get('productKey')}...")
                firebase_db.update_data('sorteios/' + key, {'msg': 'Sorteio iniciado', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 'status': 'Iniciado'})
                firebase_db.write_data('bingo_logs/' + key, {'msg': 'Sorteio iniciado', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S")})

                winner = perform_bingo_draw(firebase_db, draw.get('productKey'), key)

                print(f"Sorteio finalizado para o produto {draw.get('productKey')}.")
                print(winner)

                if isinstance(winner, list) and len(winner) > 0:
                    winner_time = winner[1].total_seconds()
                    firebase_db.update_data('sorteios/' + key, {'msg': 'Sorteio finalizado', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 'status': 'Finalizado', 'winner': {'name': winner[0]['name'], 'cpf': winner[0]['cpf'], 'time': winner_time}})
                    firebase_db.write_data('bingo_logs/' + key, {'msg': 'Sorteio finalizado', 'datetime': datetime.now().strftime("%Y-%m-%d %H:%M:%S"), 'winner': {'name': winner[0]['name'], 'cpf': winner[0]['cpf'], 'time': winner_time}})
                else:
                    print("Nenhum vencedor encontrado.")

                break

        print("Esperando 10 segundos antes de realizar o próximo sorteio...")
        time.sleep(10)

if __name__ == "__main__":
    main()
