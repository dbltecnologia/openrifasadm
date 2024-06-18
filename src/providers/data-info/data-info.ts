import { Injectable } from '@angular/core';
import { Platform } from 'ionic-angular';
import * as moment from 'moment-timezone';

@Injectable()
export class DataInfoProvider {  
  
  appName: string = "Bingo Fácil Admin"
  appType: number = 1    // 0 - Rifa 1 - Bingo

  appVersion: string = ""   
  appIsActive: Boolean = true
  appConfig: any 
  appIsSMSEnabled: Boolean = false
  appIsCreditsEnabled: Boolean = true
  appCreditWorkValue: number = 1  
  userTotalCreditsRun: number = 0

  urlFirebase: string = ""
  appCreditUseTotalValue:Boolean = true
  defaultState: string = 'DF'
  defaultCity: string = '' 

  defaultCarPic: string = '../assets/imgs/car-1.jpeg'  
  imgDefaultClient: string = '../assets/imgs/cadastro.jpg'
  isWeb: Boolean = true
  isHome: Boolean = false
  userInfo: any;       
  isDev: Boolean = false
  isTest: Boolean = false

  services: any = []
  worksRequests: any = []
  worksAccepteds: any = []
  latitude: number = 0
  longitude: number = 0
  userType: number = 2  
  workStatus: any = ['Solicitado', 'Central ciente', 'Ajuda chegou', 'Finalizado', 'Cancelado']
  
  iconLocationGreen: string = 'https://firebasestorage.googleapis.com/v0/b/inova-f30e4.appspot.com/o/googlemapbluedot.png?alt=media&token=ebbb65e4-9e46-4fc8-b6e8-c58f5538b9e1&_gl=1*1bx84uc*_ga*Mzc1OTE1ODA2LjE2OTU2MDg1NTI.*_ga_CW55HF8NVT*MTY5ODk3Njc5OS42Ny4wLjE2OTg5NzY3OTkuNjAuMC4w'  
  iconLocationRed: string = 'https://firebasestorage.googleapis.com/v0/b/inova-f30e4.appspot.com/o/dot_red.gif?alt=media&token=2115d0b3-241c-4ea5-a768-1b50f4785553&_gl=1*17j6rem*_ga*Mzc1OTE1ODA2LjE2OTU2MDg1NTI.*_ga_CW55HF8NVT*MTY5ODk3Njc5OS42Ny4xLjE2OTg5NzcwMzMuNjAuMC4w'
  
  token: string = 'MeAjuda'      
  isAdmin: Boolean = false;
  addressServer: string = "localhost" 
  eventFcmToken: string = 'fcm:netToken'
  eventFcmStart: string = 'fcm:start'
  eventFcmNew: string = 'fcm:newMsg'
  isFcmStarted: Boolean = false
  warning: string = "Atenção"
  titleAreYouSure: string = "Tem certeza?"    
  titleChangePic: string = "Modificar foto"
  titleCompleteDescription: string = "Digite sua descrição aqui para ganhar pontos"
  titleUploading: string = "Enviando..."
  titleWarning: string = "Atenção"
  titleUsernameMinLenght: string = "Verificar usuário"
  titlePasswordMinLenght: string = "Verificar senha"
  pleaseWait: string = "Favor aguarde"
  titleAuthError: string = "Erro de autenticação"
  titleCheckMailbox: string = "Verifique seu e-mail"
  titleAuthRecoveryError: string = "Erro ao recuperar senha"
  titleStatusVerified: string = "Perfil verificado"
  titleStatusNotVerified: string = "Perfil não verificado"
  titleCreatingProfile: string = "Criando seu perfil"


  titleClients: string = "Clientes"
  titleProfessionals: string = "Profissionais"
  titleAgenda: string = "Agenda"
  titleCancel: string = "Cancelar"
  titleConfirm: string = "Confirmar essa semana"
  titleConfirmAll: string = "Confirmar 1 mês"
  titleLoadingInformations: string = "Carregando informações"

  titleVerifyProfile: string = "Para verificar o perfil do profissional e permitir o mesmo receber propostas, clique no botão Verificar. Caso contrário, clique em Não verificar."

  constructor(public platform: Platform) {    

   if(this.platform.is('core') || this.platform.is('mobileweb')) {
      this.isWeb = true;
    } else {
      this.isWeb = false;
    }

    moment.locale('pt-br');    
  }
  
  getToken(){
    return this.token
  }
  
  dataURItoBlob(dataURI) {    
    let binary = atob(dataURI.split(',')[1]);
    let array = [];
    for (let i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
  };

  getTotalRegisterCompleted(target_){

    let totalRegisterCompleted = 0;

    if(target_.name)
      totalRegisterCompleted++

    if(target_.lastName)
      totalRegisterCompleted ++

    if(target_.address)
      totalRegisterCompleted++

    if(target_.photo)
      totalRegisterCompleted++

    if(target_.tel)
      totalRegisterCompleted++       
    
    let total = totalRegisterCompleted * 20

    return total
  }

  getTotalRegisterCompletedStr(target_){

    let total = this.getTotalRegisterCompleted(target_)
    let totalRegisterStatusStr = "Incompleto";

    if(total == 100)
      totalRegisterStatusStr = "Completo"
      
    return totalRegisterStatusStr
  }

  getData(){    
    return moment().tz('America/Sao_Paulo').format('LLLL');     
  }

  getDataStr(date){
    return moment(date).tz('America/Sao_Paulo').format()
  }

  colors: any = {
    red: {
      primary: '#ad2121',
      secondary: '#FAE3E3'
    },
    blue: {
      primary: '#1e90ff',
      secondary: '#D1E8FF'
    },
    yellow: {
      primary: '#e3bc08',
      secondary: '#FDF1BA'
    }
  };

  setToken(tokenTmp) {    
    this.token = tokenTmp
  }  
  
}
