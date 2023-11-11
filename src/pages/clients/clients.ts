import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, ActionSheetController, Platform } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import { FormControl } from '@angular/forms';
import * as moment from 'moment';

import { UiUtilsProvider } from '../../providers/ui-utils/ui-utils';
import { DataInfoProvider } from '../../providers/data-info/data-info';
import { DatabaseProvider } from '../../providers/database/database';
import { AuthProvider } from '../../providers/auth/auth';
import { HttpdProvider } from '../../providers/httpd/httpd';
import { DataTextProvider } from '../../providers/data-text/data-text';

@IonicPage()
@Component({
  selector: 'page-clients',
  templateUrl: 'clients.html',
})
export class ClientsPage {
  usersWorkers: Observable<any>;
  usersArray: any[] = [];
  searchTerm: string = '';
  searchControl: FormControl;
  orderType: any;

  constructor(
    public navCtrl: NavController,
    public uiUtils: UiUtilsProvider,
    public dataInfo: DataInfoProvider,
    public db: DatabaseProvider,
    public platform: Platform,
    public auth: AuthProvider,
    public dataText: DataTextProvider,
    public httpd: HttpdProvider,
    public actionsheetCtrl: ActionSheetController,
    public navParams: NavParams
  ) {}

  ionViewDidLoad() {
    this.orderType = "1";
    if (this.dataInfo.isHome) {
      this.reload();
    } else {
      this.navCtrl.setRoot('LoginPage');
    }
  }

  reload() {
    const loading = this.uiUtils.showLoading(this.dataInfo.titleLoadingInformations);
    loading.present();
    this.usersWorkers = this.db.getUsers();
    const sub = this.usersWorkers.subscribe(data => {
      sub.unsubscribe();
      this.processUserData(data);
      loading.dismiss();
    });
  }

  processUserData(data) {
    this.usersArray = [];
    data.forEach(element => {
      const info = element.payload.val();
      info.key = element.payload.key;
      info.lastDatetimeStr = moment(info.lastDatetime).format("DD/MM/YYYY hh:mm:ss");
      this.usersArray.push(info);
    });
    this.checkOrder();
  }

  
  checkOrder() {
    switch (this.orderType) {
      case "1":
        this.orderByProperty('name');
        break;
      case "2":
        this.orderByProperty('name', true);
        break;
      case "3":
        this.orderByProperty('datetime');
        break;
      case "4":
        this.orderByProperty('lastDatetime');
        break;
      default:
        this.uiUtils.showToast(this.dataText.errorFilter);
        break;
    }
  }

  orderByProperty(property, desc = false) {
    this.usersArray.sort((a, b) => desc ? b[property].localeCompare(a[property]) : a[property].localeCompare(b[property]));
  }

  orderAlpha(){

    let tmp = this.usersArray.sort(function(a,b) {

      if(a.name < b.name) { return -1; }
      if(a.name > b.name) { return 1; }
      return 0;

    })    


    this.usersArray = tmp
  }

  orderAlphaDesc(){

    let tmp = this.usersArray.sort(function(a,b) {

      if(a.name > b.name) { return -1; }
      if(a.name < b.name) { return 1; }
      return 0;

    })    


    this.usersArray = tmp
  }

  orderDatetime(){

    let tmp = this.usersArray.sort(function(a,b) {

      if(a.datetime < b.datetime) { return -1; }
      if(a.datetime > b.datetime) { return 1; }
      return 0;

    })    


    this.usersArray = tmp
  }


  orderAccess(){

    let tmp = this.usersArray.sort(function(a,b) {

      
      if(a.lastDatetime && b.lastDatetime){
        if(a.lastDatetime > b.lastDatetime) { return -1; }
        if(a.lastDatetime < b.lastDatetime) { return 1; }
      }
      
      return 0;

    })    


    this.usersArray = tmp
  }

    
  updateRanking(user, ranking){

    this.db.updateRankingUser(user, ranking)
    .then( () => {

      this.uiUtils.showAlert(this.dataText.success, this.dataText.savedSuccess).present()
      this.reload()
    })
  }
    
 

  changeProfileStatus(key){

    let actionSheet = this.actionsheetCtrl.create({
      title: this.dataText.selectRank,
      cssClass: 'action-sheets-basic-page',
      buttons: [
        {
          text: this.dataText.verifiedProfile,
          role: 'destructive',
          icon: !this.platform.is('ios') ? 'checkmark-circle' : null,
          handler: () => {            
            this.updateProfileStatus(key, "Verificado")
          }
        },        
        {
          text: this.dataText.notVerifiedProfile,
          icon: !this.platform.is('ios') ? 'remove-circle' : null,
          handler: () => {
            this.updateProfileStatus(key, this.dataInfo.titleStatusNotVerified)
          }
        },
        {
          text: this.dataText.cancel,
          role: 'cancel',
          icon: !this.platform.is('ios') ? 'close' : null,
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();

  }

  addClient(){
    this.navCtrl.push('ClientsAddPage')
  }

  updateProfileStatus(key, status){

    this.db.updateProfileStatusUser(key, status)
    .then(data => {
      this.uiUtils.showAlert(this.dataText.success, this.dataText.savedSuccess).present()
      this.reload()
    })
  }

  options(payload_){

    let actionSheet = this.actionsheetCtrl.create({
      
      title: this.dataText.selectOption,
      cssClass: 'action-sheets-basic-page',
      buttons: [           
        {
          text: 'Resetar senha',
          icon: !this.platform.is('ios') ? 'refresh' : null,
          handler: () => {
            this.updateProfilePassword(payload_)
          }
        },                             
        {
          text: this.dataText.remove,
          icon: !this.platform.is('ios') ? 'md-trash' : null,
          handler: () => {
            this.removeUser(payload_)
          }
        }, 
        {
          text: this.dataText.cancel,
          role: 'cancel',
          icon: !this.platform.is('ios') ? 'close' : null,
          handler: () => {
            console.log('Cancel clicked');
          }
        }
      ]
    });
    actionSheet.present();
  }


  updateProfilePassword(payload_){

    this.auth.resetPassword(payload_.email)
    .then(() => {
      this.uiUtils.showAlertSuccess(this.dataText.weSentYouALink)
    })
    .catch(() => {
      this.uiUtils.showAlertSuccess(this.dataText.errorResetPassword)
    })
  }

  

  removeUser(payload_){
    
    let alert = this.uiUtils.showConfirm(this.dataText.warning, this.dataText.areYouVerySure)  
    alert.then((result) => {

      if(result){
        this.removeUserContinue(payload_)
      }    
    })       
  }

  removeUserContinue(payload_){  
    
    let loading = this.uiUtils.showLoading(this.dataInfo.titleLoadingInformations)
    loading.present()

    if(!payload_.uid)
      payload_.uid = payload_.key
                     
    this.httpd.apiRemoveUser({uid: payload_.uid})
      .subscribe((result) => {              

        loading.dismiss()
        this.uiUtils.showAlertSuccess(this.dataText.removeSuccess)

        this.db.updateUserStatus(payload_.uid, 'Removido')
        .then(() => {


          this.reload()
        })        
      })    
  }

  disableUser(payload_){

    let alert = this.uiUtils.showConfirm(this.dataText.warning, this.dataText.doYouWantDisableUser)  
    alert.then((result) => {

      if(result){
        this.inativate(payload_)
      }    
    })       
  }

  inativate(payload_){
    this.db.updateUserStatus(payload_.uid, 'Desativado')
    .then(() => {
      this.reload()
    })          
  }
    
  clientChanged(event){
    this.reload()

  }  
}
