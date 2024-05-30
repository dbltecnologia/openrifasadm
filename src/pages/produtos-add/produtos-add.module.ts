import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ProdutosAddPage } from './produtos-add';

@NgModule({
  declarations: [
    ProdutosAddPage,
  ],
  imports: [
    IonicPageModule.forChild(ProdutosAddPage),
  ],
})
export class ProdutosAddPageModule {}
