import { Component, ViewChild, ElementRef, NgZone, OnInit } from '@angular/core';
import { AlertController } from 'ionic-angular';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { DataInfoProvider } from '../../providers/data-info/data-info'
import { UiUtilsProvider } from '../../providers/ui-utils/ui-utils'
import { DatabaseProvider } from '../../providers/database/database';
import { HttpdProvider } from '../../providers/httpd/httpd';
import { Observable } from 'rxjs/Observable';
import { DataTextProvider } from '../../providers/data-text/data-text'
import { AudioUtilsProvider } from '../../providers/audio-utils/audio-utils';
import { GoogleApiProvider } from '../../providers/google-api/google-api';

import * as moment from 'moment';

declare var google;

// Define an interface for cache entries
interface AddressCacheEntry {
  address: string;
  timestamp: moment.Moment;
}

@IonicPage()
@Component({
  selector: 'page-work-watch',
  templateUrl: 'work-watch.html',
})
export class WorkWatchPage implements OnInit {

  @ViewChild('maprun') mapElement: ElementRef;
  private addressCache: Map<string, AddressCacheEntry> = new Map();

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
  
  totalOnline: number = 0
  totalWorks: number = 0

  allOffline: any = []; 
  totalOffline: number = 0;

  isInitializing: Boolean = true
    
  constructor(
    public navCtl: NavController, 
    public dataInfo: DataInfoProvider,
    public uiUtils: UiUtilsProvider,
    public events: Events,
    public _ngZone: NgZone,
    public alertCtrl: AlertController,
    public db: DatabaseProvider,
    public httpd: HttpdProvider,
    public routing: GoogleApiProvider,
    public dataText: DataTextProvider,  
    public audioUtils: AudioUtilsProvider,
    public navParams: NavParams) {


      this.audioUtils.preload('tabSwitch', 'assets/audio/ding.mp3');
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

    this.isInitializing = true
    
    let loading = this.uiUtils.showLoading(this.dataInfo.pleaseWait)    
    loading.present() 
    this.icon = this.dataInfo.iconLocationGreen    
    this.initializeMap()    
    this.centerMap()    
    this.loadOnlines()

    this.getWorks()  

    loading.dismiss()   
    this.isInitializing = false    
  }    

  loadOnlines(){
    this.getUsers()
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
    else if(element.workerInfo.name.includes(this.searchTerm)){
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


  getWorks(){

    const year = moment().format("YYYY");
    const month = moment().format("MM");

    this.db.getAllWorksAccepteds(year, month)
    .subscribe(data => {

      this.totalWorks = data.length

      data.forEach(element => {
        let info: any = element.payload.val();
        info.key = element.payload.key;
        info.lastDatetimeStr = moment().format("DD/MM/YYYY hh:mm:ss");
        
        info.hasWork = this.checkIfUserHasWork(info.uid)

        this.allWorking.push(info)
      })

      console.log('allWorking', this.allWorking)

      
    })
  }

  getUsers(){
    
    return new Promise<void>((resolve, reject) => {
      this.db.getUsers()
      .subscribe(data => {
          this.getUserCallback(data)
          resolve()              
        })
    })    
  }

  getUserCallback(data) {
    
    this.allOnline = [];
    this.allOffline = []; 
    this.totalOnline = 0;
    this.totalOffline = 0;

    data.forEach(element => {
      let info = element.payload.val();
      info.key = element.payload.key;
      info.lastDatetimeStr = moment().format("DD/MM/YYYY hh:mm:ss");

      console.log('Status da usuária ', info.name, info.statusJob)

      if (info.statusJob) { 

        this.totalOffline++;
        this.allOffline.push(info);
        
      } else {

        this.allOnline.push(info);
        this.totalOnline++;                

        if(! this.isInitializing)
          this.audioUtils.play('tabSwitch');

        const cacheKey = `${info.latitude}-${info.longitude}`;
        const cacheEntry = this.addressCache.get(cacheKey);
        const now = moment();
        
        if (cacheEntry && now.diff(cacheEntry.timestamp, 'minutes') < 60) { 
          console.log('Using cached address:', cacheEntry.address);   
          info.formatted_address = cacheEntry.address;  
               
        } else {          

          this.routing.geocodeLatLng(info.latitude, info.longitude)
          .then((data: any) => {
            
            const formatted_address = data.result.formatted_address;
            this.addressCache.set(cacheKey, { address: formatted_address, timestamp: now });    

            info.formatted_address = formatted_address;
          });
        }
      }
    })

    this.sortOnline()
  }

  // create a function to check inside the array if the user has some work with the status different from Finalizado
  // if yes, return true, else return false

  checkIfUserHasWork(user){
    let hasWork = false;

    this.allWorking.forEach(element => {
      if(element.uid == user.uid){
        hasWork = true;
      }
    });

    return hasWork;
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

    this.uiUtils.showToast("Carregando lista...")
    this.requestType = "Todos"
    this.clearAll()   

    this.allOnline.forEach(info => {

        if(info.datetime)
           info.datetime = moment(info.datetime).format("DD/MM/YYYY HH:mm:ss")    

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
    let iconUrl = info.statusJob ? this.dataInfo.iconLocationGreen : this.dataInfo.iconLocationRed;

    if(info.workerInfo && latitude && longitude){
                     
        let marker = new google.maps.Marker({        
          label: {
            color: 'black',
            fontWeight: 'bold',
            text: info.workerInfo.name,
          },
          icon: {
            labelOrigin: new google.maps.Point(11, 50),
            url: iconUrl,

            
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

  showMap(work){
    console.log('work', work)
    let latitude = work.latitude
    let longitude = work.longitude    
    this.map.setCenter(new google.maps.LatLng(latitude, longitude));
  }

  showHistory(work){    
    this.navCtl.push('HistoryPage', {work: work})
  }
     
}
