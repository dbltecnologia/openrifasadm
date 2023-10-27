import { Component, ViewChild, ElementRef } from '@angular/core';
import { IonicPage, NavController, NavParams, ViewController, Events, Platform, Navbar, ActionSheetController } from 'ionic-angular';
import { DataInfoProvider } from '../../providers/data-info/data-info'
import { UiUtilsProvider } from '../../providers/ui-utils/ui-utils'
import { DatabaseProvider } from '../../providers/database/database';
import * as moment from 'moment';
import { Observable } from 'rxjs/Observable';
import { AudioUtilsProvider } from '../../providers/audio-utils/audio-utils';
import { Subscription } from 'rxjs/Subscription'
import { SocialSharing } from '@ionic-native/social-sharing';
import { GoogleApiProvider } from '../../providers/google-api/google-api'
import { DataTextProvider } from '../../providers/data-text/data-text'

declare var google;

@IonicPage()
@Component({
  selector: 'page-work-run',
  templateUrl: 'work-run.html',
})
export class WorkRunPage {

  @ViewChild('navbar') navBar: Navbar;
  @ViewChild('maprun') mapElement: ElementRef;
  map: any;
  
  private workFollow: Subscription;  
  private workSubscription: Subscription;  
  private workStatusSubscription: Subscription;  
  
  workKey: string
  workStatus: string = "Aceito"
  workerPosition: Observable<any>;
  workInfo: Observable<any>;

  viewType: string;
  
  driverUid: string = ""
  driverName: string = ""
  driverPhoto: string = ""
  driverPhone: string = ""
  driverLatitude: string = ""
  driverLongitude: string = ""
  driverToken: string = ""
  
  carName: string = ''
  carPlate: string = ''
  arriveTime: string = ''
  
  fromAddressProfessional: string = ''
  fromAddress: string = ''
  toAddress: string = ''
  toReference: string = ''
  startPosition: any;
	originPosition: string = "";
  destinationPosition: string = "";	

  totalDistance: string = ''
  totalTravelingTime: string = ''
  estimateArrival: string = ''
  totalValue: string = ''

  clientUid: string = ""
  clientName: string = ""
  clientToken: string = ""
  clientPhoto: string = ""
  clientPhone: string = ""  	  
  
  paymentKey: string = ""
  paymentPath: string = ""

  alreadyRated: Boolean = false
  dropPoints: any = []
  dropPointNow: any

  allMarkers: any = []

  circleList: any = []
  updatePositionInterval: any
  textStartButton: string = "ASSINATURA"

  messageTip: string = ""  
  msgArrived: Boolean = false  
  appIsOnlyReference: string = "Entregas"

  historyClicked: Boolean = false
  
  private payload;
  public  serviceDistance : any = new google.maps.DistanceMatrixService();
  public directionsService = new google.maps.DirectionsService({suppressMarkers: true});
	public directionsDisplay = new google.maps.DirectionsRenderer();	    

  constructor(
    public navCtl: NavController, 
    public dataInfo: DataInfoProvider,
    public uiUtils: UiUtilsProvider,
    public events: Events,
    public db: DatabaseProvider,
    public viewCtrl: ViewController,
    public platform: Platform,    
    public audioUtils: AudioUtilsProvider,
    public actionSheetCtrl: ActionSheetController,
    public dataText: DataTextProvider,  
    public socialShare: SocialSharing,
    public routes: GoogleApiProvider,
    public navParams: NavParams) {



      this.subscribeEventsComponents()         
  }
  
  ionViewDidLoad() {            

    if(this.dataInfo.isHome)
      this.startInterface()    
    else
      this.navCtl.setRoot('LoginPage')    
  }

  ngOnDestroy() {
    
    this.events.unsubscribe('cancel-run');  
    
    if(this.workSubscription){
      this.workSubscription.unsubscribe()
    }

    if(this.workFollow){
      this.workFollow.unsubscribe()
    }

    

    if(this.workStatusSubscription){
      this.workStatusSubscription.unsubscribe()
    }
  }

  startInterface(){     
    
    this.audioUtils.preload('tabSwitch', 'assets/audio/ding.mp3');
    this.audioUtils.preload('tabSwitch2', 'assets/audio/ding2.mp3');
    this.audioUtils.preload('tabSwitch3', 'assets/audio/ding3.mp3');      

    this.workStatus = 'Aceito'
    this.payload = this.navParams.get('payload')    
    
    this.reloadInformation()             
  }      

  subscribeEventsComponents(){

    this.events.subscribe('dismiss', data => {          
      this.viewCtrl.dismiss()
    });      
    
    this.events.subscribe('finished-run', () => {          
      this.tripFinished()
    });  
    
    this.events.subscribe('canceled-run', () => {          
      this.canceled()
    });  

    this.events.subscribe('contacts-client', () => {   
      this.contactsClient()
    }); 

    this.events.subscribe('contacts-professional', () => {   
        this.contactsProfessional()                
    }); 

    this.events.subscribe('show-history-run', () => {                
      this.showHistoryRun()
    });

  }    
  
  reloadInformation(){
    let key = this.navParams.get('key')     
    this.reloadKey(key)
  }

  reloadKey(key){

    this.workFollow = this.db.getWorkAccept(key)
    .subscribe(data => {      
      
      this.reloadInfoCallback(data)              
    })
  }

  reloadInfoCallback(data){

    let first = true

    data.forEach(element => {

        if(first){

          first = false

          let val = element.payload.val()        
          val.key = element.payload.key  
                  
          this.buildData(val)
          
        }        
    });
  }

  buildData(info){    

    let container = {

      "key": info.key,
      "type": "2",  
      "totalPayment": info.clientInfo.total,
      "carName": info.workerInfo.carName,
      "status": info.status,      
      "carPlate": info.workerInfo.carPlate,
      "dropPoints": info.dropPoints,
      "fromAddress": info.clientInfo.fromAddress,
      "toAddress": info.clientInfo.toAddress,
      "toReference": info.clientInfo.toReference,
      "paymentKey": info.clientInfo.paymentKey,
      "paymentPath": info.clientInfo.paymentPath,
      "clientName": info.clientInfo.name,
      "clientPhoto": info.clientInfo.photo,      
      "clientPhone": info.clientInfo.tel,
      "clientUid": info.clientInfo.uid,
      "clientTotalIndications": String(info.clientInfo.totalIndications),
      "clientTotalWorks": String(info.clientInfo.totalWorks),
      "workerUid": info.workerInfo.uid,
      "workerName": info.workerInfo.name,
      "workerRate": String(info.workerInfo.rate),
      "workerPhoto": info.workerInfo.photo,
      "workerPhone": info.workerInfo.tel,
      "workStatus": info.workStatus,
      "workerTotalIndications": String(info.workerInfo.totalIndications),
      "workerTotalWorks": String(info.workerInfo.totalWorks)
    }

    if(!this.payload){
      this.payload = JSON.stringify(container)    
      this.loadData()
    }
    
  }


  getElement(){

    let element;

    if(this.dataInfo.isWeb){

      if(this.payload.data)

        element = this.payload.data
      else
        element = this.payload

      if(typeof(element) === 'string')
        element = JSON.parse(this.payload)
    }
        
    else
      element = JSON.parse(this.payload)

    return element
  }

  loadData(){  
    
    let element = this.getElement();     

    this.workKey = element.key
    this.driverName = element.workerName

    this.driverPhoto = element.workerPhoto
    this.driverPhone = element.workerPhone
    this.driverToken = element.tokenWorker
    this.workStatus = element.status

    this.clientUid = element.clientUid
    this.clientName = element.clientName
    this.clientPhoto = element.clientPhoto
    this.clientPhone = element.clientPhone
    this.clientToken = element.tokenClient

    this.carPlate = element.carPlate
    this.carName = element.carName
    this.fromAddress = element.fromAddress
    this.toAddress = element.toAddress    
    this.toReference = element.toReference    
    this.originPosition = element.fromAddress
    
    this.destinationPosition = element.toAddress
    this.driverUid = element.workerUid
    this.paymentKey = element.paymentKey
    this.paymentPath = element.paymentPath  
    this.dropPoints = element.dropPoints    

    //this.calcValuesPayment(element)  
    this.loadDataContinue()    
  } 
  
  calcValuesPayment(element){

    setTimeout(() => {

      this.totalValue = element.totalPayment    

      if(isNaN(Number(this.totalValue))){
        this.totalValue = "0.00"
      }      
    }, 3000);
  }


    loadDataContinue(){

      this.loadDelivery()  
      this.loadDefaults()
      this.watchPositions()
      this.watchWorkStatus()       
      this.updateInfoMap()          
    }

    loadDefaults(){

      if(! this.totalDistance)
        this.totalDistance = this.dataText.calculating

      if(!  this.totalTravelingTime)      
        this.totalTravelingTime = this.dataText.calculating

      if(! this.estimateArrival)  
        this.estimateArrival = this.dataText.calculating
    }
    
    watchPositions(){
      
    if(this.workStatus === 'Aceito' || this.workStatus == 'Iniciado'){

      this.workerPosition = this.db.getUserInfo(this.driverUid)        
           
      this.workSubscription = this.workerPosition.subscribe(data => {  
        this.workerPositionCallback(data)            
      })      
    }    
  }

  workerPositionCallback(data){

    data.forEach(element => {

      let worker = element.payload.val()                 
      this.driverLatitude = worker.latitude
      this.driverLongitude = worker.longitude           

       console.log('Latitude e longitude do moboboy ', this.driverLatitude, this.driverLongitude)
      
    });    

    if(this.driverLatitude && this.driverLongitude){
      var fromAddress = new google.maps.LatLng(this.driverLatitude, this.driverLongitude);
      
      if(fromAddress)
        this.makeMarker(fromAddress, this.dataInfo.iconLocationWorker, "Motoboy", this.map);     
    }
    
  }  

  updateInfoMap(){

    this.calculateRoute()


    this.distanceMatrix()
  }

  watchWorkStatus(){
    
    this.workInfo = this.db.getWorkAccept(this.workKey)

    this.workInfo.subscribe(data => {
      this.watchWorkStatusCallback(data)
    })  

  }

  watchWorkStatusCallback(data){

    data.forEach(element => {
      
      let info = element.payload.val()   
      info.key = element.payload.key            

      let status = info.status          
      this.workStatus = status      

      if(status === 'Finalizado'){
        this.uiUtils.showToast("Corrida finalizada")
      }

      this.setFromAndTo(info)   
    });        
  }

  setFromAndTo(info){
        
    if(info.dropPoints){

      for(let i = 0; i < info.dropPoints.length; i++){

        let element = info.dropPoints[i]
  
        if(element.status === 'Aguardando'){                        

            if(info.dropPoints[i-1]){              
              
              if(info.dropPoints[i-1].status === 'Finalizado'){
  
                this.fromAddress = info.dropPoints[i-1].address
                this.originPosition = this.fromAddress                        
  
                this.toAddress = info.dropPoints[i].address
                this.destinationPosition = this.toAddress          
                              
                
                this.updateInfoMap()
                
                break;
  
              }            
            }          
        }
      }
    }        
  }

  setViewType(vt) {
    this.viewType = vt;
  }
      
 home(){
    clearInterval(this.updatePositionInterval)

    this.viewCtrl.dismiss().then(() => {
     let self = this

     setTimeout( () => {
      self.uiUtils.showAlertSuccess('Sucesso')      
      self.audioUtils.play('tabSwitch3');   
     }, 1000)
     
    });
  }


  
  canceled(){
    console.log('Sair')
    this.viewCtrl.dismiss()
  }

  cancel(){
    let alert = this.uiUtils.showConfirm(this.dataText.warning, this.dataText.wantCancel)  
    alert.then((result) => {

      if(result){
        this.cancelContinue()      
      }        
    })        
  }

  cancelContinue(){
    let now = moment().format("DD/MM/YYYY HH:mm:ss")
    let msg = this.dataText.canceledByClient + now

    if(this.dataInfo.userInfo.userType === 2)
      msg = this.dataText.canceledByProfesssional + now

    let element = this.getElement();    
   
    this.viewCtrl.dismiss().then(() => {                     
        this.cancelFinish(element, msg)                
      });      
  }

  cancelFinish(element, msg){
    this.db.cancelWork(element.key, msg)  
    .then(() => {
      
      this.uiUtils.showToast(msg)      
    })
  } 

 
  initializeMap() {          

    let mapElement = document.getElementById('maprun')

    if(mapElement){

      if(this.dataInfo.userInfo.latitude && this.dataInfo.userInfo.longitude){

        this.startPosition = new google.maps.LatLng(this.dataInfo.userInfo.latitude, this.dataInfo.userInfo.longitude);
	 
        const mapOptions = {
          center: this.startPosition,
          zoom: 16,        
          mapTypeControl: false,
          animation: google.maps.Animation.DROP,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          disableDoubleClickZoom: false,
          disableDefaultUI: true,
          zoomControl: true,
          scaleControl: false,
        }
      
        this.map = new google.maps.Map(mapElement, mapOptions);    
        this.directionsDisplay.setMap(this.map);              

      }
      else {
        this.uiUtils.showAlertError(this.dataText.mapError1)
      }
      
    }
    else {
      this.uiUtils.showAlertError(this.dataText.mapError1)
    }
	}
	 
	  calculateRoute(){
     
      if (this.originPosition && this.destinationPosition) {

        const request = {
          origin: this.originPosition,
          destination: this.destinationPosition,
          travelMode: 'DRIVING'
        };
              
        this.traceRoute(this.directionsService, this.directionsDisplay, request);
      }
      else {          
        //this.uiUtils.showAlertError("Falha ao calcular rotas")
        console.log("Falha ao calcular rotas. Não é possível pegar origem e destino")
      }        
      
	  }
	 
	  traceRoute(service: any, display: any, request: any) {
      
      service.route(request, function (result, status) {

        if (status == 'OK') {
          display.setDirections(result);

        }
       
		});
  }

  makeMarker(position, icon, title, map) {
  
    this.clearOverlays()

    let marker = new google.maps.Marker({
        position: position,
        map: map,
        icon: icon,
        title: title
    });

    this.allMarkers.push(marker)
  }

  clearOverlays() {    

    for (var i = 0; i < this.allMarkers.length; i++ ) {
      this.allMarkers[i].setMap(null);
    }

    this.allMarkers.length = [];

  }
  
  distanceMatrix(){    

    console.log('distanceMatrix', this.fromAddress, this.toAddress)
    
    this.serviceDistance.getDistanceMatrix(
      {
        origins: [this.fromAddress],
        destinations: [this.toAddress],
        travelMode: 'DRIVING',
        unitSystem: google.maps.UnitSystem.METRIC,
        avoidHighways: false,
        avoidTolls: false,
      }, (response, status) => {

        console.log(status)

        if(status !== "NOT_FOUND"){
          this.callback(response, status)

        } 
       
      })
    
  }

  callback(response, status){    

    response.rows.forEach(element => {
      
      element.elements.forEach(elementMatrix => {
        this.populateDistanceInfo(elementMatrix)        
      });
    });
  }

  populateDistanceInfo(data){

    if(data){      

      if(data.distance){

        this.totalDistance = data.distance.text
        this.totalTravelingTime = data.duration.text        
        this.estimateArrival = moment().add(data.duration.value, 's').format("HH:mm:ss")
        console.log('Horario chegada: ', data.duration.value, moment().format("HH:mm:ss"), this.estimateArrival)



        //this.checkDistanceNotifications(data)
      }      
    }    
  }   

  goBack(){    
    this.viewCtrl.dismiss()
  }

  tripFinished(){    
    this.audioUtils.play('tabSwitch3');   
    this.workSubscription.unsubscribe()
    this.workFollow.unsubscribe()
    this.goBack()    
    
  }    
  
  contactsClient(){

    if(this.workStatus === 'Aceito' || this.workStatus == 'Iniciado'){

      const actionSheet = this.actionSheetCtrl.create({
        title: "Enviar mensagem",
        buttons: [
          {
            text: "Estou aguardando",
            role: 'destructive',
            handler: () => {
              this.callWhatsapp("Estou aguardando")          
            }
          },
          {
            text: "Favor me ligar",
            role: 'destructive',
            handler: () => {
              this.callWhatsapp("Favor me ligar")          
            }
          },{
            text: this.dataText.cancel,
            role: 'cancel'          
          }
        ]
      });
      actionSheet.present();

    }
    else {
      this.uiUtils.showAlertError("Status da corrida: " + this.workStatus + ". Para mais informações, favor entrar em contato com a central de atendimento")
    }

    
  }
  
  contactsProfessional(){

    if(this.workStatus === 'Aceito' || this.workStatus == 'Iniciado'){

      const actionSheet = this.actionSheetCtrl.create({
        title: "Enviar mensagem",
        buttons: [
          {
            text: "Não estou achando o local de destino",
            role: 'destructive',
            handler: () => {
              this.callWhatsapp("Não estou achando o local de destino")          
            }
          },
          {
            text: "Já cheguei no local",
            role: 'destructive',
            handler: () => {
              this.callWhatsapp("Já cheguei no local")          
            }
          },{
            text: this.dataText.cancel,
            role: 'cancel'          
          }
        ]
      });
      actionSheet.present();
    }
    else {
      this.uiUtils.showAlertError("Status da corrida: " + this.workStatus + ". Para mais informações, favor entrar em contato com a central de atendimento")
    }

    
  }

  callWhatsapp(mensagem){    

    if(this.socialShare.canShareVia('whatsApp')){

      let phone = ""
      let prefix = "+55"

      if(this.dataInfo.userInfo.userType === 1){        
          phone =  prefix + this.driverPhone        
      } else {
        
          phone = prefix + this.clientPhone      
      }                       
      
      this.socialShare.shareViaWhatsAppToReceiver(phone, mensagem, null, null)
      .then(() => {

        //console.log('Mensagem enviada')
      })
      .catch(error => {
        this.uiUtils.showAlertError(error)
      })
      
      }
    else {
      this.uiUtils.showAlertError("Não foi possível abrir whatsapp")
    }    
  } 

  showHistoryRun(){    

    console.log(this.historyClicked)

    if(! this.historyClicked){

      
      this.historyClicked = true

      this.navCtl.push('WorkRunHistoryPage', {payload: this.payload})

      setTimeout(() => {
        this.historyClicked = false
      }, 3000);
    }
      
  }

  /*********************
   * MODULO DELIVERY
   ******************/
  
  loadDelivery(){        
    this.loadDeliveryDropPoints()
  }     
  
  loadDeliveryDropPoints(){
      
    let loading = this.uiUtils.showLoading("Localizando motoboy")
    loading.present();
    
    let self = this    
    
    this.routes.geocodeLatLng(this.driverLatitude, this.driverLongitude)
      .then((results) => {

        self.geocodeLatLngCallback(results)
        loading.dismiss();
      })                  
    
  }

  geocodeLatLngCallback(data){  
    
    
    if(data && data.result){

      this.fromAddressProfessional = data.result.formatted_address                      
      this.uiUtils.showToast('Localização do motoboy:  ' + this.fromAddressProfessional)
      this.organizeDeliveryDropPoints()      

    } 
    else {
      this.uiUtils.showToast('Ocorreu uma falha ao realizar sua localização')
    }           
  }

  organizeDeliveryDropPoints(){  

    let dropPoints = this.toAddress
    this.dropPoints = []             

    if(dropPoints){

      let address = []

      if(typeof(dropPoints) === 'string'){        
        address = dropPoints.split(',')
      }
      else { 

        const objectArray = Object.entries(dropPoints);
    
        objectArray.forEach(([key, value]) => {      
    
          const array = Object.values(value);    
          let str = array[0]    
          let addrParse = str.replace(/[\[\]']+/g,' ');
          address.push(addrParse)
    
        });
      }      
                  
      address.forEach(element => {        
        let data = {address: element, status: 'Aguardando'}
        this.dropPoints.push(data)
      });            
      
      this.dropPoints.unshift({address: this.fromAddress, startPoint: true, status: 'Aguardando'})        
      
      this.toAddress = this.dropPoints[1].address
      this.destinationPosition = this.toAddress      
      this.originPosition = this.dropPoints[0].address
      this.fromAddress = this.originPosition

      
    }        
  }  
  



}