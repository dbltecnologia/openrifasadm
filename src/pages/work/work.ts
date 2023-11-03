import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, Events } from 'ionic-angular';
import { UiUtilsProvider } from '../../providers/ui-utils/ui-utils'
import { DataInfoProvider } from '../../providers/data-info/data-info'
import { DatabaseProvider } from '../../providers/database/database';
import { DataTextProvider } from '../../providers/data-text/data-text'

@IonicPage()
@Component({
  selector: 'page-work',
  templateUrl: 'work.html',
})
export class WorkPage {

  constructor(public navCtrl: NavController, 
    public uiUtils: UiUtilsProvider,    
    public dataInfo: DataInfoProvider,    
    public db: DatabaseProvider,    
    public dataText: DataTextProvider,  
    public events: Events,
    public navParams: NavParams) {
  }

  ionViewDidLoad() {
    
    if(this.dataInfo.isHome)
      this.startInterface()
    else
      this.navCtrl.setRoot('LoginPage')             
  }

  startInterface(){

    if(!this.dataInfo.userInfo.isAdmin){

      this.subscribeStuff()        
      this.events.publish(this.dataInfo.eventFcmStart, 1);  
    }    
  }

  subscribeStuff(){
    
    this.events.subscribe(this.dataInfo.eventFcmToken, data => {   
                  
      this.dataInfo.setToken(data)
      this.db.saveToken(data)        
    });       
  }

  goPageWorks(){
    this.navCtrl.push('WorkRequestPage')
  }  

  goPageWorksAdd(){
    this.navCtrl.push('WorkRequestAddPage')
  } 

  goPageHistory(){    
    this.navCtrl.push('HistoryPage')
  }  

  logout(){
    this.events.publish('logout')
  }

  goPageWorkWatch(){    
    this.navCtrl.push('WorkWatchPage')
  }


}

