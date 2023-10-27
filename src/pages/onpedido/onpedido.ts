import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, Events } from 'ionic-angular';
import { UiUtilsProvider } from '../../providers/ui-utils/ui-utils'
import { DataInfoProvider } from '../../providers/data-info/data-info'
import { DatabaseProvider } from '../../providers/database/database';
import { HttpdProvider } from '../../providers/httpd/httpd';
import * as moment from 'moment';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { AudioUtilsProvider } from '../../providers/audio-utils/audio-utils';
import { DataTextProvider } from '../../providers/data-text/data-text'


@IonicPage()
@Component({
  selector: 'page-onpedido',
  templateUrl: 'onpedido.html',
})
export class OnpedidoPage {

  storeStatus: string = "LOJA ABERTA"
  orders: any
  status: string = "Todos"
  endereco: string = "Brasília"

  storeData: any
  serviceName: string = "onPedido"
  showAllOptions: boolean = false

  usersWorkersArray: any = []
  clientsWorkersArray: any = []

  selectedDate: string
  selectedDateEnd: string  

  totalPedidosHoje: number = 0

  constructor(public navCtrl: NavController, 
    public uiUtils: UiUtilsProvider,    
    public dataInfo: DataInfoProvider,
    public db: DatabaseProvider,  
    private iab: InAppBrowser,
    public events: Events,
    public audioUtils: AudioUtilsProvider,
    public alertCtrl: AlertController, 
    public httpd: HttpdProvider,  
    public dataText: DataTextProvider,  
    public navParams: NavParams) {
  }

  ionViewDidLoad() {        

    if(this.dataInfo.isHome)
      this.startInterface()    
    else
      this.navCtrl.setRoot('LoginPage')          

  }


  startInterface(){
    this.orders = []

    this.selectedDateEnd = moment().format() 
    this.selectedDate = moment().startOf('month').format() 

    this.getWorkers()
    this.getClients()

    this.getInfoStore()
    this.get()    
  }



  showConfigurations(){
    this.showAllOptions= !this.showAllOptions

    if(this.showAllOptions)
      this.uiUtils.showAlertSuccess("Mostrando todas as {{dataText.options}} do pedido")
    
    else 
      this.uiUtils.showAlertSuccess('Mostrando somente {{dataText.options}} do fluxo')

  }


  getInfoStore(){
    
    let data = {token: this.dataInfo.appConfig.onPedidoToken}

    this.httpd.apiOnPedidoInfoStore(data)

    .subscribe((callback) => {

      this.getInfoStoreCallback(callback)
    })
  }



  getInfoStoreCallback(data){

    this.storeData = data.infos[0].estabelecimento[0]    
    let latitude = this.storeData.latitude[0]
    let longitude = this.storeData.longitude[0]
    this.endereco = latitude+','+longitude    

  }


  storeStatusCheck(){    

    let nome = this.storeData.nome[0]
    let email = this.storeData.email_contato[0]
    let tempoMedioEntrega = this.storeData.tempo_medio_entrega[0]
    let tempoMedioRetirada = this.storeData.tempo_medio_retirada[0]    
    let msg = "<b>{{dataText.name}} da loja:</b> " + nome + "<br><b>Email para contato:</b> " + email + "<br> <b>Tempo medio de entrega:</b> " + tempoMedioEntrega + " minutos<br> <b>Tempo medio retirada:</b> " + tempoMedioRetirada + " minutos<br><b>Total pedidos:</b>" + this.totalPedidosHoje + "<br>"
    this.uiUtils.showAlertSuccess(msg)
  }


  getClients(){
    
    this.db.getClients()
    .subscribe(data => {
        this.getClientsCallback(data)
    })
  }

  getClientsCallback(data){

    this.clientsWorkersArray = []

    data.forEach(element => {

      let info = element.payload.val()
      info.key = element.payload.key
      
      if(info.status !== 'Desativado')
        this.checkRegionClient(info)                                                          
              
    });

  }

  checkRegionClient(info){

    if(this.dataInfo.userInfo.isAdmin)
      this.clientsWorkersArray.push(info)
    
    if(this.dataInfo.userInfo.managerRegion)
      
      if(info.region === this.dataInfo.userInfo.managerRegion)
        this.clientsWorkersArray.push(info)          

    else 
      if(info.uid === this.dataInfo.userInfo.uid){
        this.clientsWorkersArray.push(info)                
      }

  }


  getWorkers(){

    this.db.getWorkers()
    .subscribe(data => {
        this.getWorkersCallback(data)
    })
  }

  getWorkersCallback(data){

    this.usersWorkersArray = []

    data.forEach(element => {

      let info = element.payload.val()
      info.key = element.payload.key

      if(info.status !== 'Desativado')            
        this.checkRegionWorker(info)      
    });

  }


  checkRegionWorker(info){

    if(this.dataInfo.userInfo.isAdmin)
      this.usersWorkersArray.push(info)
    
    if(this.dataInfo.userInfo.managerRegion)
      
      if(info.region === this.dataInfo.userInfo.managerRegion)
        this.usersWorkersArray.push(info)          
  }

  getToday(){
    this.selectedDateEnd = moment().format() 
    this.selectedDate = moment().format() 
    this.get()
  }

  getMonth(){
    this.selectedDateEnd = moment().endOf('month').format() 
    this.selectedDate = moment().startOf('month').format() 
    this.get()
  }

  get(){

    this.db.getOrdersOnPedido()
    .subscribe((data) => {

      this.getCallback(data)

    })

  }


  getCallback(data){

    let tmp = []
    this.orders = []

    data.forEach(element => {

      let info = element.payload.val()

      if(info && typeof(info) === 'object'){

        info.key = element.payload.key              

        info.pedido.forEach(element1 => {   
          
          if(Array.isArray(element1.pedido)){
  
            element1.pedido.forEach(element2 => {     
  
              element2.key = info.key     

              if(info.serviceKey)
                element2.serviceKey = info.serviceKey

              tmp.push(element2)
              
            });
  
          }          
          
        });
        
      }
     
      
    });

    this.parseData(tmp)


    this.organizaFila()  
    
  }

  organizaFila(){    
           
    this.orders.sort((a, b) => {            
      return Number(a.info.id) < Number(b.info.id) ? 1 : -1;      
    })

  }



  getDataModel(){

    let tmp = {
      key: '',
      serviceKey: '',
      info: {
        vencido: false,
        agendamento: '', 
        data: '', 
        id: '', 
        observacao: '', 
        previsao: '', 
        status: '',
        datetime: ''
      },

      cliente: {
        nome: '', 
        cel: '', 
        endereco: '', 
        cpf: '', 
        bairro: '', 
        cep: '', 
        cidade: '', 
        complemento: '', 
        numero: '', 
        referencia: '', 
        rua: '', 
        uf: ''
      },

      produtos: [],
      valores: {cupom: '', forma: '', taxa: '', total: '', troco: '' }
      
    }

    return tmp
  }

  parseData(data){

    this.totalPedidosHoje = 0

    data.forEach(element => {

      console.log(element)

      let tmp = this.getDataModel()
      tmp.key = element.key

      if(element.serviceKey)
        tmp.serviceKey = element.serviceKey      

      let status = 'Pedido despachado'

      element.info.forEach(element1 => {             

        let agendamento = element1.agendamento[0].data[0].corrente[0]
        let data = element1.data[0].corrente[0]
        let id = element1.id[0].pedido[0]
        let observacao = element1.observacao[0]
        let previsao = element1.previsao[0].data[0].corrente[0]

        let datetime = element1.data[0].corrente[0]
        let datetimestr = datetime.replace("as", " ")
        let datetimestr1 = datetimestr.replace("hrs", " ")    

        let momentoPedido = moment(datetimestr1, "DD/MM/YYYY hh:mm")
        let prazo = moment().add(-1, 'hour')
        
        let vencido = momentoPedido.isBefore(prazo)        

        status = element1["status-pedido"][0].texto
                        
        tmp.info = {
          vencido: vencido,
          agendamento: agendamento, 
          data: data, 
          id: id, 
          observacao: observacao, 
          previsao: previsao,           
          status: status,
          datetime: momentoPedido.format()
        }

      });


      element.cliente.forEach(element1 => {        

        let nome = element1.nome[0]        
        let cel = element1.celular[0].formatado[0]
        let endereco = element1.endereco[0].formatado[0]
        let bairro = element1.endereco[0].bairro[0]
        let cep = element1.endereco[0].cep[0]
        let cidade = element1.endereco[0].cidade[0]
        let complemento = element1.endereco[0].complemento[0]
        let numero = element1.endereco[0].numero[0]
        let referencia = element1.endereco[0].referencia[0]
        let rua = element1.endereco[0].rua[0]
        let uf = element1.endereco[0].uf[0]
        let cpf = element1.cpf[0]
        
        tmp.cliente = {
          nome: nome, 
          cel: cel, 
          endereco: endereco, 
          bairro: bairro,
          cep: cep,
          cidade: cidade,
          complemento: complemento,
          numero: numero,
          referencia: referencia,
          rua: rua,
          uf: uf,
          cpf: cpf
        }

      });

      element.produtos.forEach(element1 => {                

        element1.produto.forEach(element2 => {

          let comentario = element2.comentario[0].comentario[0]
          let desconto = element2.desconto[0].valor[0]
          let nome = element2.nome[0]
          let promocao = element2.promocao[0]
          let qtd = element2.qtd[0]

          tmp.produtos.push({nome: nome, comentario: comentario, desconto: desconto, promocao: promocao, qtd: qtd})
          
        });
        

      });

      element.valor.forEach(element1 => {                

        let cupom = element1.cupom[0].cupom[0]
        let forma = element1.pagamento[0].forma[0]
        let taxa = element1.taxa[0]
        let total = element1.total[0]
        let troco = element1.troco[0].recebido[0]

        tmp.valores = {cupom: cupom, forma: forma, taxa: taxa, total: total, troco: troco}

      });


      this.parseCheck(tmp)       
      
      
      
    });


    console.log(this.orders)

  }


  parseCheck(tmp){

    if(this.status === tmp.info.status || this.status === "Todos"){

      let same = moment(tmp.info.datetime).isBetween(moment(this.selectedDate).startOf('day'), moment(this.selectedDateEnd).endOf('day'), 'day') || 
      moment(tmp.info.datetime).isSame(moment(this.selectedDate), 'day') || 
      moment(tmp.info.datetime).isSame(moment(this.selectedDateEnd), 'day')

      console.log(same, tmp.info.datetime)
        
      if(same) { 

        this.parseFinish(tmp)      
      }

        
    }
    
    
  }


  parseFinish(tmp){
     

    


    this.totalPedidosHoje++
    this.orders.push(tmp)

  }

  changeStatusCancel(order){
    
    const prompt = this.alertCtrl.create({
      title: 'Cancelamento',
      message: "Favor informar o motivo do cancelamento",
      inputs: [
        {
          name: 'valor',
          placeholder: 'Motivo do cancelamento'
        }
      ],
      buttons: [
        {
          text: this.dataText.cancel,
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Enviar',
          handler: data => {

            console.log(data)

            this.uiUtils.showAlertSuccess("Notificação enviada com sucesso!")     
            this.changeStatusCancelContinue(order, data.valor) 
          }
        }
      ]
    });

    prompt.present();
  }






  changeStatusCancelContinue(order, motivo){

    let loading = this.uiUtils.showLoading("Favor aguarde...")
    loading.present()

    let data = {id: order.info.id, status: 5, token: this.dataInfo.appConfig.onPedidoToken, motivo: motivo}        

    this.httpd.apiOnPedidoStatusCancel(data)
    .subscribe((data) => {
      
      loading.dismiss()
      this.getStatusCallback(order, 'Pedido cancelado')
      
    })
  }

  changeStatusAsk(order, status, statustexto){


    let msg = "Deseja mudar o status do pedido de <b>" + order.info.status + "</b> para <b>" + statustexto + "</b> ?"

    let alert = this.uiUtils.showConfirm(this.dataText.warning, msg)  
    alert.then((result) => {

      if(result){
        this.changeStatus(order, status, statustexto)
      }    
    })       
  }


  changeStatus(order, status, statustexto){
    
    let loading = this.uiUtils.showLoading("Favor aguarde...")
    loading.present()

    let data = {id: order.info.id, status: status, token: this.dataInfo.appConfig.onPedidoToken}        

    this.httpd.apiOnPedidoStatusChanged(data)
    .subscribe((data) => {
      
      loading.dismiss()
      this.getStatusCallback(order, statustexto)
      
    })
  }





  getStatusCallback(order, status){

    console.log(order)
    console.log(status)    

    this.uiUtils.showAlertSuccess("Status modificado com sucesso")

    this.db.updateOnPedidoOrder(order.key, status)
    .then(() => {

      console.log('Atualizado no banco')

      if(status === 'Pedido despachado'){
        this.despachaPedido(order)
      }
      
    })
    .catch(() => {
      console.log('Não Atualizado no banco')
    })

  }




  despachaPedido(order){ 

    let info = this.getDataDelivery(order)
    console.log(info)
    
    this.httpd.apiSendRequest(info)
      .subscribe((result) => {              

        this.sendCallback(order, result)
      },
    error => {

      
      console.log(error)
      this.uiUtils.showAlertError("Houve um erro ao enviar a notificação de serviço")
    })      
   }


   sendCallback(order, data){
   
    console.log(data)

    if(data.success){

      this.uiUtils.showAlertSuccess("Despacho realizado com sucesso! ")
      order.serviceKey = data.key

      console.log(order.serviceKey)

      this.db.updateOnPedidoKey(order.key, order.serviceKey)
      .then(() => {

      })

    }
      
    
    else 
      this.uiUtils.showAlertError("Falha ao enviar solicitação. Favor verifique todos os endereços")
  
        
   }


   getDataDelivery(order){   

    console.log(order)


    let service = {name: this.serviceName, total: order.valores.total, paymentKey: this.dataText.notInformade, paymentPath: this.dataText.notInformade, paymentMethod: order.valores.forma, paymentChange: order.valores.troco}
    let data = this.dataInfo.userInfo       
    
    data.datetime = moment().format()
    
    data.carInfo = service 
    data.fromAddress = this.endereco 
    data.origem = data.fromAddress
    data.fromAddress = this.endereco
    data.name = this.dataInfo.appConfig.appName

    data.total = order.valores.total
    data.comission = order.valores.taxa
    data.workComission = order.valores.taxa
    data.uidBusiness = this.dataInfo.userInfo.uid
    data.appCreditWorkValue = this.dataInfo.appConfig.appCreditWorkValue
    data.uf = this.dataInfo.defaultState
    data.state = this.dataInfo.defaultState
    data.status = 'Criado'    
    data.toReference  = this.dataText.notInformade
    data.order = order        
    data.agenda  = moment().format()
    data.appType = "Entrega"    
    data.paymentKey = this.dataText.notInformade
    data.paymentPath = this.dataText.notInformade
    data.paymentMethod = order.valores.forma
    data.paymentChange = order.valores.troco
    data.googleApiKey = this.dataInfo.appConfig.googleApiKey    
    data.onPedidoKey = order.key    
        
    data.dropPoints = []    
    
    let addr = order.cliente.endereco   
        
    data.dropPoints.push({description: this.endereco, startPoint: true, status: 'Aguardando', instructions: "Pegar pedido(s)"})        
    data.dropPoints.push({description: addr, status: 'Aguardando', instructions: this.getInstrunctionsPayment(data), responsible: order.cliente.nome, charge: order.valores.total, reference: '' })  

    data.totalPoints = data.dropPoints.length          
    data.appType = "Entregas" 
    
    return data
   }


   getInstrunctionsPayment(order){


    console.log(order)
    return "Realizar entrega dos produtos"
   }


   
   show(order){

    console.log(order)

    if(order.serviceKey){

      this.navCtrl.push('WorkRunHistoryPage', {payload: order})

    }
    else {
      this.uiUtils.showAlertError("Nâo foi possível acessar a corrida. Favor clicar em despachar para criar uma nova corrida")
    }
    

   }

   getGerente(){

    let options = 'location=no';
    
    this.iab.create(this.dataInfo.appConfig.onPedidoGerenteUrl, '_blank', options);    
   }
  

}
