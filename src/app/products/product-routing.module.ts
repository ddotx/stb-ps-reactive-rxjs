import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ProductListComponent } from './product-list.component';
import { ProductEditComponent } from './product-edit/product-edit.component';

@NgModule({
  imports: [
    RouterModule.forChild([
      { path: 'allproducts', component: ProductListComponent },
      { path: 'allproducts/addproduct', component: ProductEditComponent },
      { path: '', redirectTo: 'allproducts', pathMatch: 'full' }
    ])
  ],
  exports: [RouterModule]
})
export class ProductRoutingModule { }

