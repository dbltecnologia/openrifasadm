import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { OnpedidoPage } from './onpedido';
import { IonicSelectableModule } from 'ionic-selectable';


@NgModule({
  declarations: [
    OnpedidoPage,
  ],
  imports: [
    IonicPageModule.forChild(OnpedidoPage),
    IonicSelectableModule
  ],
})
export class OnpedidoPageModule {}
