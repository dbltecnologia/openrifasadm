import { Component } from '@angular/core';
import { NavController, NavParams, IonicPage } from 'ionic-angular';
import { UiUtilsProvider } from '../../providers/ui-utils/ui-utils'
import { DataInfoProvider } from '../../providers/data-info/data-info'
import { AuthProvider } from '../../providers/auth/auth';
import { HomePage } from '../../pages/home/home';
import firebase from 'firebase/app';
import 'firebase/auth';
import { DatabaseProvider } from '../../providers/database/database';
import { Storage } from '@ionic/storage';

import { DataTextProvider } from '../../providers/data-text/data-text'

@IonicPage()

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})
export class LoginPage {
  
  userConfig:any;
  autoLogin: Boolean = true
  username: string
  password: string
  languageSelected: number = 0

  constructor(public navCtrl: NavController, 
    public dataInfo: DataInfoProvider,    
    public uiUtils: UiUtilsProvider,
    public authProvider: AuthProvider,
    public storage: Storage,
    public navParams: NavParams,
    public dataText: DataTextProvider,
    public db: DatabaseProvider) {
    
      

  }

  ionViewDidLoad() {
    var self = this  
    
    this.autoLogin = this.navParams.get("autoLogin")

    if(this.autoLogin == undefined)
      this.autoLogin = true      

    if(this.autoLogin){      

      firebase.auth().onAuthStateChanged(function(user) {      

        if(user)
          self.goHome()
      });                  
    }        

    this.startInterface() 
        
  }  

  loginDev(){          
    
    this.username = "admin@rifasfacil.com.br"    
    this.password = "1020304050607980brasil"

    this.loginUser()    

  }
  
  goHome(){    
    if(this.dataInfo.isHome){
      return
    }

    this.dataInfo.isHome = true
    this.navCtrl.setRoot(HomePage);      
    
    this.goPageDev()
  }  

  
  goPageDev(){
            
    setTimeout(() => {                           
      // this.navCtrl.setRoot('RegionsPage');
    }, 1000);
  }

  startInterface(){    

    console.log('startInterface')

    this.loginDev()
    
    this.storage.get('default-state')

    .then((data) => {
            
      if(data)
        this.dataInfo.defaultState = data      

    })

  
  }  

  loginUser(): void {        

    console.log('Login user ' + this.username + ' pass ' + this.password)


    if (! this.username || this.username.length < 6){
      this.uiUtils.showAlert(this.dataText.warning, this.dataInfo.titleUsernameMinLenght).present()

    } else if (! this.password || this.password.length < 6){
      this.uiUtils.showAlert(this.dataText.warning, this.dataInfo.titlePasswordMinLenght).present()


      
    } else {
      this.loginContinue(this.username.trim(), this.password.trim())
    }
  }

  loginContinue(email, pass){

    console.log('Login user ' + email + ' pass ' + pass)
    
    let loading = this.uiUtils.showLoading(this.dataInfo.pleaseWait)    
    loading.present() 
    var self = this

    this.authProvider.loginUser(email, pass)

    .then( () => {

      loading.dismiss();
      self.goHome()


    }, error => {
      console.log('Error login ' + error)
      
      loading.dismiss().then( () => {
        self.uiUtils.showAlert(this.dataText.warning, this.dataInfo.titleAuthError).present()
      });
    });    
  }

  goToSignup(): void {
    
  }
  
  goToResetPassword(): void {
    
    if (this.username.length > 0){
      this.authProvider.resetPassword(this.username).then( () => {
        this.uiUtils.showAlert(this.dataText.warning, this.dataInfo.titleCheckMailbox).present()

      }, error => {
          this.uiUtils.showAlert(this.dataText.warning, this.dataInfo.titleAuthRecoveryError).present()
      });  

    } else 
        this.uiUtils.showAlert(this.dataText.warning, this.dataInfo.titleAuthRecoveryError).present()    
  }


  selectedStateChanged(){

  }

  
  languageChanged(){

    this.languageSelected === 0 ?  this.languageSelected = 1 : this.languageSelected = 0
    this.dataText.languageSelected = this.languageSelected

    this.storage.set('language', this.dataText.languageSelected)
    .then(() => {        
               
      if(this.dataText.languageSelected === 1){
        this.dataInfo.defaultState = "DF"
        this.dataText.translateEnglish()
      }
      else 
        this.dataText.translatePortuguese()
      
                
    })
    .then(() => {



    })


  }



 

}
