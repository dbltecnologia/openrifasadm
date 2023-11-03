import { Component, ViewChild, ElementRef, NgZone, OnInit } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { DataInfoProvider } from '../../providers/data-info/data-info'
import { UiUtilsProvider } from '../../providers/ui-utils/ui-utils'
import { DatabaseProvider } from '../../providers/database/database';
import { HttpdProvider } from '../../providers/httpd/httpd';
import { Observable } from 'rxjs/Observable';
import { DataTextProvider } from '../../providers/data-text/data-text'
import * as moment from 'moment';

declare var google;

@IonicPage()
@Component({
  selector: 'page-work-watch',
  templateUrl: 'work-watch.html',
})
export class WorkWatchPage implements OnInit {

  @ViewChild('maprun') mapElement: ElementRef;

  works: Observable<any>;  
  map: any;  
  
  markers: any = []   
  startPosition: any
  bounds: any
  status: string = "Criado"        
  searchTerm: string = '';
  
  icon: string 
  requestType: string = "Todos"


  allOnline: any = [] 
  allClientsOnline: any = [] 
  allWorking: any = [] 
  allJobsList: any = []   
  
  totalOnline: number = 0
  totalWorks: number = 0
  

  constructor(
    public navCtl: NavController, 
    public dataInfo: DataInfoProvider,
    public uiUtils: UiUtilsProvider,
    public events: Events,
    public _ngZone: NgZone,
    public alertCtrl: AlertController,
    public db: DatabaseProvider,
    public httpd: HttpdProvider,
    public dataText: DataTextProvider,  
    public navParams: NavParams) {
  }

  ngOnInit() {
    window["angularComponentRef"] = { component: this, zone: this._ngZone };
  }

  ionViewDidLoad() {    
    
    if(this.dataInfo.isHome)
      this.startInterface()
    else
      this.navCtl.setRoot('LoginPage')    
  }

  startInterface(){
    
    let loading = this.uiUtils.showLoading(this.dataInfo.pleaseWait)    
    loading.present() 

    this.icon = this.dataInfo.iconLocationClient
    
    this.initializeMap()    
    this.centerMap()
    this.loadOnlines()
    
    setTimeout(() => {

      loading.dismiss()   
    }, 3000);

  }

  
  loadOnlines(){

    this.getWorkers()
    .then(() => {

      this.addOnline()      
    })
  }

  
  
  initializeMap() {
    
    this.bounds = new google.maps.LatLngBounds();
    this.startPosition = new google.maps.LatLng(this.dataInfo.userInfo.latitude, this.dataInfo.userInfo.longitude);

		const mapOptions = {
      center: this.startPosition,
      zoom: 12
		}
	 
    this.map = new google.maps.Map(document.getElementById('mapwatch'), mapOptions);     
  }

  zoomMap(){
    this.map.zoom = 12
  }

  
  clearMarkers(map){
    for (var i = 0; i < this.markers.length; i++) {
      this.markers[i].setMap(map);
    }

  }

  clearAll(){
    this.clearMarkers(null)
    this.markers = []    
  } 
  
  
  setFilteredItems(){

    this.clearMarkers(null)
    this.markers = []    
   
  }

  searchAndAdd(element){
    
    if(element.name.includes(this.searchTerm)){
      this.loadUsersMarkers(element)
    }      
    else if(element.workerInfo && element.workerInfo.name.includes(this.searchTerm)){
      this.loadUsersMarkers(element)
    }              
  }  


  fit(){
    this.map.fitBounds(this.bounds);
  }

  

  centerMap(){
    var center = new google.maps.LatLng(this.dataInfo.userInfo.latitude, this.dataInfo.userInfo.longitude);    
    this.map.panTo(center);
  }  

  goBack(){
    this.navCtl.pop()
  }

  getWorkers(){
    
    return new Promise<void>((resolve, reject) => {

      this.db.getWorkers()

      .subscribe(data => {
          this.getWorkersCallback(data)
          resolve()      
        
        })

    })
    
  }

  getWorkersCallback(data){      
    
    this.allJobsList = []
    this.allOnline = []     
    this.allWorking = []
    this.totalOnline = 0   

    data.forEach(element => {

      let info = element.payload.val()
      info.key = element.payload.key

      info.lastDatetimeStr = moment().format("DD/MM/YYYY hh:mm:ss")  
      
      console.log('Info', info)

      if(info.statusJob)
        this.getWorkersContinue(info)                                                  
                                 
    });

    this.sortOnline()
  }

  getWorkersContinue(info){

    this.totalOnline++
    this.allOnline.push(info)
    this.allJobsList.push(info)
  }

  sortOnline(){

    let tmp = this.allOnline.sort(function(a,b) {

      if(a.name && b.name){

        if(a.name < b.name) { return -1; }
        if(a.name > b.name) { return 1; }
      }
      
      return 0;

    })    

    this.allOnline = tmp
  }
 

  addOnline(){        

    this.uiUtils.showToast(this.dataText.showProfessionals)
    this.requestType = "Todos"
    this.clearAll()   

    this.allOnline.forEach(info => {

        if(info.datetime){
           info.datetime = moment(info.datetime).format("DD/MM/YYYY HH:mm:ss")
        }

        this.loadOnlineMarkers(info)
    });
        
  }
 

  loadOnlineMarkers(info){    
    
      let marker = new google.maps.Marker({        
        label: {
          color: 'black',
          fontWeight: 'bold',
          text: info.name,
        },
        icon: {
          labelOrigin: new google.maps.Point(11, 50),
          url:this.icon,
          origin: new google.maps.Point(0, 0),
          anchor: new google.maps.Point(11, 40),
        },        
        position: new google.maps.LatLng(info.latitude, info.longitude),
        map: this.map, 
        id: 1
  
      });      
  

      this.bounds.extend(marker.position);              
      this.markers.push(marker)            
  }
  
  
  

  loadUsersMarkers(info){        
    
    
    let latitude = info.workerInfo.latitude
    let longitude = info.workerInfo.longitude    

    if(info.workerInfo && latitude && longitude){
                 
      info.image = this.icon

      console.log('info', info)

      if(! info.statusJob){
        info.image = "https://firebasestorage.googleapis.com/v0/b/inova-f30e4.appspot.com/o/dot_red.gif?alt=media&token=2115d0b3-241c-4ea5-a768-1b50f4785553&_gl=1*1cla932*_ga*Mzc1OTE1ODA2LjE2OTU2MDg1NTI.*_ga_CW55HF8NVT*MTY5ODk3Mzg4Mi42Ni4xLjE2OTg5NzQ1MTQuNDMuMC4w"

      }

        let marker = new google.maps.Marker({        
          label: {
            color: 'black',
            fontWeight: 'bold',
            text: info.workerInfo.name,
          },
          icon: {
            labelOrigin: new google.maps.Point(11, 50),
            url: this.icon,

            
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(11, 40),

          },        

          position: new google.maps.LatLng(latitude, longitude),
          map: this.map, 
          id: 1
    
        }); 
                        
      
        this.markers.push(marker)
        this.bounds.extend(marker.position);       
        
    }        

  } 
  


  
  
 
}
